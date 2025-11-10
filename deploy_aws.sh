#!/bin/bash
set -e  # Stop script on first error

# ================= CONFIGURATION =================
PROJECT_NAME="hierarchiq"
AWS_REGION="ap-south-1"  # Mumbai region
ECR_REPO_NAME="$PROJECT_NAME"
ECS_CLUSTER_NAME="${PROJECT_NAME}_cluster"
ECS_SERVICE_NAME="${PROJECT_NAME}_service"
TASK_DEF_FILE="ecs-task-definition.json"
CONTAINER_PORT=3000

echo "🚀 Starting AWS deployment for $PROJECT_NAME..."
echo "----------------------------------------------"

# ================= AWS LOGIN =================
aws configure set region $AWS_REGION
echo "✅ AWS CLI configured for region $AWS_REGION"

echo "🔍 Checking AWS identity..."
aws sts get-caller-identity || { echo "❌ AWS credentials invalid!"; exit 1; }

# ================= GET AWS ACCOUNT ID =================
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $ACCOUNT_ID"

# ================= GET DEFAULT VPC & SUBNETS =================
echo "🔍 Detecting default VPC and subnets..."
DEFAULT_VPC=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
if [ "$DEFAULT_VPC" == "None" ] || [ -z "$DEFAULT_VPC" ]; then
  echo "❌ No default VPC found. Creating one..."
  aws ec2 create-default-vpc
  DEFAULT_VPC=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
fi
echo "✅ Using VPC: $DEFAULT_VPC"

SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC" --query "Subnets[*].SubnetId" --output text | tr '\t' ',')
echo "✅ Found subnets: $SUBNETS"

# ================= CREATE SECURITY GROUP =================
SG_NAME="${PROJECT_NAME}_sg"
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$DEFAULT_VPC" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null)

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
  echo "🔒 Creating security group: $SG_NAME"
  SG_ID=$(aws ec2 create-security-group \
    --group-name $SG_NAME \
    --description "Security group for $PROJECT_NAME" \
    --vpc-id $DEFAULT_VPC \
    --query 'GroupId' \
    --output text)
  
  # Allow HTTP traffic
  aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port $CONTAINER_PORT \
    --cidr 0.0.0.0/0
  
  # Allow HTTPS
  aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0
    
  echo "✅ Security group created: $SG_ID"
else
  echo "✅ Using existing security group: $SG_ID"
fi

# ================= CREATE ECR REPOSITORY =================
if ! aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" >/dev/null 2>&1; then
  echo "📦 Creating new ECR repository: $ECR_REPO_NAME"
  aws ecr create-repository --repository-name "$ECR_REPO_NAME" --region $AWS_REGION
else
  echo "✅ ECR repository already exists: $ECR_REPO_NAME"
fi

# ================= BUILD & PUSH DOCKER IMAGE =================
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "🐳 Building Docker image..."
docker build -t $ECR_REPO_NAME .

echo "🏷️ Tagging Docker image..."
docker tag $ECR_REPO_NAME:latest $ECR_URI:latest

echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

echo "📤 Pushing image to ECR..."
docker push $ECR_URI:latest

# ================= CREATE ECS CLUSTER =================
if ! aws ecs describe-clusters --clusters $ECS_CLUSTER_NAME --query "clusters[?status=='ACTIVE']" --output text | grep -q $ECS_CLUSTER_NAME; then
  echo "🛠️ Creating ECS Cluster: $ECS_CLUSTER_NAME"
  aws ecs create-cluster --cluster-name $ECS_CLUSTER_NAME
else
  echo "✅ ECS cluster already exists: $ECS_CLUSTER_NAME"
fi

# ================= ENSURE IAM ROLE EXISTS =================
ROLE_NAME="ecsTaskExecutionRole"
if ! aws iam get-role --role-name $ROLE_NAME >/dev/null 2>&1; then
  echo "🔐 Creating IAM role: $ROLE_NAME"
  
  cat > trust-policy.json <<EOF
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
EOF
  
  aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file://trust-policy.json
  
  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
  
  rm trust-policy.json
  echo "✅ IAM role created"
else
  echo "✅ IAM role already exists: $ROLE_NAME"
fi

# ================= CREATE TASK DEFINITION =================
echo "📄 Creating ECS task definition file: $TASK_DEF_FILE"

cat > $TASK_DEF_FILE <<EOF
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
      "image": "$ECR_URI:latest",
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
EOF

echo "📦 Registering ECS task definition..."
aws ecs register-task-definition --cli-input-json file://$TASK_DEF_FILE

# ================= DEPLOY SERVICE =================
# Convert comma-separated subnets to JSON array format
SUBNET_ARRAY=$(echo $SUBNETS | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')

SERVICE_EXISTS=$(aws ecs describe-services --cluster $ECS_CLUSTER_NAME --services $ECS_SERVICE_NAME --query "services[?status=='ACTIVE']" --output text)

if [ -z "$SERVICE_EXISTS" ]; then
  echo "🚀 Creating ECS Fargate service..."
  aws ecs create-service \
    --cluster $ECS_CLUSTER_NAME \
    --service-name $ECS_SERVICE_NAME \
    --task-definition ${PROJECT_NAME}_task \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={assignPublicIp=ENABLED,subnets=[$SUBNET_ARRAY],securityGroups=[$SG_ID]}"
else
  echo "🔄 Updating existing ECS service..."
  aws ecs update-service \
    --cluster $ECS_CLUSTER_NAME \
    --service $ECS_SERVICE_NAME \
    --task-definition ${PROJECT_NAME}_task \
    --force-new-deployment
fi

echo "----------------------------------------------"
echo "✅ Deployment complete!"
echo ""
echo "📋 Deployment Information:"
echo "  ECR Repository: $ECR_URI"
echo "  ECS Cluster: $ECS_CLUSTER_NAME"
echo "  ECS Service: $ECS_SERVICE_NAME"
echo "  VPC: $DEFAULT_VPC"
echo "  Security Group: $SG_ID"
echo ""
echo "🔍 To get the public IP of your container:"
echo "  aws ecs list-tasks --cluster $ECS_CLUSTER_NAME --service-name $ECS_SERVICE_NAME"
echo "  aws ecs describe-tasks --cluster $ECS_CLUSTER_NAME --tasks <TASK_ARN>"
echo ""
echo "📊 Monitor logs:"
echo "  aws logs tail /ecs/${PROJECT_NAME} --follow"
