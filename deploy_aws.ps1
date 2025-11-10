# PowerShell AWS Deployment Script
$ErrorActionPreference = "Stop"

# ================= CONFIGURATION =================
$PROJECT_NAME = "hierarchiq"
$AWS_REGION = "ap-south-1"  # Mumbai region
$ECR_REPO_NAME = $PROJECT_NAME
$ECS_CLUSTER_NAME = $PROJECT_NAME + "_cluster"
$ECS_SERVICE_NAME = $PROJECT_NAME + "_service"
$TASK_DEF_FILE = "ecs-task-definition.json"
$CONTAINER_PORT = 3000

Write-Host "🚀 Starting AWS deployment for $PROJECT_NAME..." -ForegroundColor Green
Write-Host "----------------------------------------------"

# ================= AWS LOGIN =================
aws configure set region $AWS_REGION
Write-Host "✅ AWS CLI configured for region $AWS_REGION" -ForegroundColor Green

Write-Host "🔍 Checking AWS identity..."
try {
    $identity = aws sts get-caller-identity
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ AWS credentials invalid!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ AWS credentials invalid!" -ForegroundColor Red
    exit 1
}

# ================= GET AWS ACCOUNT ID =================
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
Write-Host "📋 AWS Account ID: $ACCOUNT_ID" -ForegroundColor Cyan

# ================= GET DEFAULT VPC & SUBNETS =================
Write-Host "🔍 Detecting default VPC and subnets..."
$DEFAULT_VPC = (aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
if ([string]::IsNullOrEmpty($DEFAULT_VPC) -or $DEFAULT_VPC -eq "None") {
    Write-Host "❌ No default VPC found. Creating one..."
    aws ec2 create-default-vpc
    $DEFAULT_VPC = (aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
}
Write-Host "✅ Using VPC: $DEFAULT_VPC" -ForegroundColor Green

$SUBNETS_RAW = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC" --query "Subnets[*].SubnetId" --output text)
$SUBNETS = $SUBNETS_RAW -replace "`t", ","
Write-Host "✅ Found subnets: $SUBNETS" -ForegroundColor Green

# ================= CREATE SECURITY GROUP =================
$SG_NAME = $PROJECT_NAME + "_sg"
try {
    $SG_ID = (aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$DEFAULT_VPC" --query "SecurityGroups[0].GroupId" --output text 2>$null)
} catch {
    $SG_ID = $null
}

if ([string]::IsNullOrEmpty($SG_ID) -or $SG_ID -eq "None") {
    Write-Host "🔒 Creating security group: $SG_NAME"
    $SG_ID = (aws ec2 create-security-group --group-name $SG_NAME --description "Security group for $PROJECT_NAME" --vpc-id $DEFAULT_VPC --query 'GroupId' --output text)
    
    # Allow HTTP traffic
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port $CONTAINER_PORT --cidr 0.0.0.0/0 | Out-Null
    
    # Allow HTTPS
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 | Out-Null
    
    Write-Host "✅ Security group created: $SG_ID" -ForegroundColor Green
} else {
    Write-Host "✅ Using existing security group: $SG_ID" -ForegroundColor Green
}

# ================= CREATE ECR REPOSITORY =================
try {
    $ecrExists = aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" 2>$null
    $ecrFound = ($LASTEXITCODE -eq 0)
} catch {
    $ecrFound = $false
}
if (-not $ecrFound) {
    Write-Host "📦 Creating new ECR repository: $ECR_REPO_NAME"
    aws ecr create-repository --repository-name "$ECR_REPO_NAME" --region $AWS_REGION | Out-Null
} else {
    Write-Host "✅ ECR repository already exists: $ECR_REPO_NAME" -ForegroundColor Green
}

# ================= BUILD & PUSH DOCKER IMAGE =================
$ECR_URI = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

Write-Host "🐳 Building Docker image..."
docker build -t $ECR_REPO_NAME .
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "🏷️ Tagging Docker image..."
docker tag "${ECR_REPO_NAME}:latest" "${ECR_URI}:latest"

Write-Host "🔐 Logging in to ECR..."
$loginPassword = (aws ecr get-login-password --region $AWS_REGION)
$loginPassword | docker login --username AWS --password-stdin $ECR_URI
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "📤 Pushing image to ECR..."
docker push "${ECR_URI}:latest"
if ($LASTEXITCODE -ne 0) { exit 1 }

# ================= CREATE ECS CLUSTER =================
$clusterCheck = (aws ecs describe-clusters --clusters $ECS_CLUSTER_NAME --query "clusters[?status=='ACTIVE'].clusterName" --output text)
if ([string]::IsNullOrEmpty($clusterCheck)) {
    Write-Host "🛠️ Creating ECS Cluster: $ECS_CLUSTER_NAME"
    aws ecs create-cluster --cluster-name $ECS_CLUSTER_NAME | Out-Null
} else {
    Write-Host "✅ ECS cluster already exists: $ECS_CLUSTER_NAME" -ForegroundColor Green
}

# ================= ENSURE IAM ROLE EXISTS =================
$ROLE_NAME = "ecsTaskExecutionRole"
try {
    $roleExists = aws iam get-role --role-name $ROLE_NAME 2>$null
    $roleFound = ($LASTEXITCODE -eq 0)
} catch {
    $roleFound = $false
}
if (-not $roleFound) {
    Write-Host "🔐 Creating IAM role: $ROLE_NAME"
    
    $trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@
    
    $trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding utf8
    
    aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://trust-policy.json | Out-Null
    aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" | Out-Null
    
    Remove-Item "trust-policy.json"
    Write-Host "✅ IAM role created" -ForegroundColor Green
} else {
    Write-Host "✅ IAM role already exists: $ROLE_NAME" -ForegroundColor Green
}

# ================= CREATE TASK DEFINITION =================
Write-Host "📄 Creating ECS task definition file: $TASK_DEF_FILE"

$taskDef = @"
{
  "family": "${PROJECT_NAME}_task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "$PROJECT_NAME",
      "image": "${ECR_URI}:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": ${CONTAINER_PORT},
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${PROJECT_NAME}",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      }
    }
  ]
}
"@

$taskDef | Out-File -FilePath $TASK_DEF_FILE -Encoding utf8

Write-Host "📦 Registering ECS task definition..."
aws ecs register-task-definition --cli-input-json "file://$TASK_DEF_FILE" | Out-Null

# ================= DEPLOY SERVICE =================
# Convert subnets to array format
$subnetArray = ($SUBNETS -split ',') | ForEach-Object { "`"$_`"" }
$subnetString = $subnetArray -join ","

$SERVICE_EXISTS = (aws ecs describe-services --cluster $ECS_CLUSTER_NAME --services $ECS_SERVICE_NAME --query "services[?status=='ACTIVE']" --output text)

if ([string]::IsNullOrEmpty($SERVICE_EXISTS)) {
    Write-Host "🚀 Creating ECS Fargate service..."
    aws ecs create-service `
        --cluster $ECS_CLUSTER_NAME `
        --service-name $ECS_SERVICE_NAME `
        --task-definition "${PROJECT_NAME}_task" `
        --desired-count 1 `
        --launch-type FARGATE `
        --network-configuration "awsvpcConfiguration={assignPublicIp=ENABLED,subnets=[$subnetString],securityGroups=[\"$SG_ID\"]}" | Out-Null
} else {
    Write-Host "🔄 Updating existing ECS service..."
    aws ecs update-service `
        --cluster $ECS_CLUSTER_NAME `
        --service $ECS_SERVICE_NAME `
        --task-definition "${PROJECT_NAME}_task" `
        --force-new-deployment | Out-Null
}

Write-Host "----------------------------------------------"
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Information:" -ForegroundColor Cyan
Write-Host "  ECR Repository: $ECR_URI"
Write-Host "  ECS Cluster: $ECS_CLUSTER_NAME"
Write-Host "  ECS Service: $ECS_SERVICE_NAME"
Write-Host "  VPC: $DEFAULT_VPC"
Write-Host "  Security Group: $SG_ID"
Write-Host ""
Write-Host "🔍 To get the public IP of your container:" -ForegroundColor Yellow
Write-Host "  aws ecs list-tasks --cluster $ECS_CLUSTER_NAME --service-name $ECS_SERVICE_NAME"
Write-Host "  aws ecs describe-tasks --cluster $ECS_CLUSTER_NAME --tasks `<TASK_ARN`>"
Write-Host ""
Write-Host "📊 Monitor logs:" -ForegroundColor Yellow
Write-Host "  aws logs tail /ecs/${PROJECT_NAME} --follow"
