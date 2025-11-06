# 🐳 HierarchIQ - Docker Deployment Guide

## Complete Containerization with Real-Time Functionality

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Docker Architecture](#docker-architecture)
5. [Development Setup](#development-setup)
6. [Production Setup](#production-setup)
7. [Docker Commands Reference](#docker-commands-reference)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## 🎯 Overview

HierarchIQ is now fully containerized with:
- ✅ **Multi-stage Docker builds** for optimized production images
- ✅ **Docker Compose** for orchestrating services
- ✅ **PostgreSQL** database in a separate container
- ✅ **Hot reload** for development
- ✅ **Health checks** for monitoring
- ✅ **Volume persistence** for data
- ✅ **Network isolation** for security

---

## 📦 Prerequisites

### Required Software

1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
   - Download: https://www.docker.com/products/docker-desktop
   - Version: 20.10+ recommended

2. **Docker Compose**
   - Included with Docker Desktop
   - Linux: `sudo apt-get install docker-compose`

3. **Verify Installation**:
```bash
docker --version
# Output: Docker version 24.0.0+

docker-compose --version
# Output: Docker Compose version v2.20.0+
```

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Production Build

```bash
# 1. Navigate to project directory
cd d:\capstone project_presidio\project_tracker

# 2. Build and start containers
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f app

# 5. Access application
# Open: http://localhost:3000
```

### Option 2: Development Build (with Hot Reload)

```bash
# 1. Navigate to project directory
cd d:\capstone project_presidio\project_tracker

# 2. Start development environment
docker-compose -f docker-compose.dev.yml up

# 3. Access application
# Open: http://localhost:3000
# Changes to code will auto-reload!
```

---

## 🏗️ Docker Architecture

### Container Structure

```
┌─────────────────────────────────────────┐
│     HierarchIQ Docker Environment       │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐   ┌──────────────┐  │
│  │              │   │              │  │
│  │   Next.js    │◄──┤  PostgreSQL  │  │
│  │     App      │   │   Database   │  │
│  │  (Port 3000) │   │  (Port 5432) │  │
│  │              │   │              │  │
│  └──────────────┘   └──────────────┘  │
│         ▲                   ▲          │
│         │                   │          │
│         └───────┬───────────┘          │
│                 │                      │
│         ┌───────▼──────┐              │
│         │   Adminer    │              │
│         │  DB Manager  │              │
│         │  (Port 8080) │              │
│         └──────────────┘              │
│                                         │
└─────────────────────────────────────────┘
         │
         ▼
   User Browser
```

### Services Overview

| Service | Container Name | Port | Purpose |
|---------|---------------|------|---------|
| **app** | hierarchiq-app | 3000 | Next.js application |
| **postgres** | hierarchiq-db | 5432 | PostgreSQL database |
| **adminer** | hierarchiq-adminer | 8080 | Database management UI |

---

## 💻 Development Setup

### Using Docker for Development

**Advantages**:
- ✅ Consistent environment across team
- ✅ No need to install Node.js/PostgreSQL locally
- ✅ Hot reload enabled
- ✅ Easy database reset

### Step 1: Start Development Environment

```bash
# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up -d
```

### Step 2: View Real-Time Logs

```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f postgres
```

### Step 3: Make Changes

1. Edit any file in your project
2. Save the file
3. Watch the terminal - it will auto-reload!
4. Refresh browser to see changes

### Step 4: Access Services

- **Application**: http://localhost:3000
- **Database Manager**: http://localhost:8080
  - System: PostgreSQL
  - Server: postgres
  - Username: hierarchiq
  - Password: hierarchiq_dev_password
  - Database: hierarchiq_dev

### Step 5: Run Database Commands

```bash
# Generate Prisma Client
docker-compose -f docker-compose.dev.yml exec app npx prisma generate

# Run migrations
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev

# Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec app npx prisma studio

# Seed database
docker-compose -f docker-compose.dev.yml exec app npx prisma db seed
```

### Step 6: Stop Development Environment

```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (DELETES DATABASE DATA!)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🏭 Production Setup

### Building Production Image

```bash
# Build production image
docker-compose build

# Or build without cache
docker-compose build --no-cache
```

### Starting Production Containers

```bash
# Start in detached mode
docker-compose up -d

# Check if containers are running
docker-compose ps

# Expected output:
# NAME                  STATUS        PORTS
# hierarchiq-app        Up 2 minutes  0.0.0.0:3000->3000/tcp
# hierarchiq-db         Up 2 minutes  0.0.0.0:5432->5432/tcp
# hierarchiq-adminer    Up 2 minutes  0.0.0.0:8080->8080/tcp
```

### Health Check

```bash
# Check application health
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-06T08:00:00.000Z",
#   "database": "connected",
#   "application": "running"
# }
```

### Monitoring Logs

```bash
# View real-time logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View logs for specific service
docker-compose logs -f app
```

### Scaling (Optional)

```bash
# Run multiple app containers
docker-compose up -d --scale app=3

# Note: You'll need a load balancer for this
```

---

## 📚 Docker Commands Reference

### Container Management

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# Stop specific service
docker-compose stop app

# Start specific service
docker-compose start app

# Remove containers and volumes
docker-compose down -v
```

### Image Management

```bash
# Build images
docker-compose build

# Pull images
docker-compose pull

# List images
docker images | grep hierarchiq

# Remove unused images
docker image prune -a
```

### Logs and Debugging

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app

# Follow logs with timestamps
docker-compose logs -f --timestamps

# View last N lines
docker-compose logs --tail=50
```

### Execute Commands in Containers

```bash
# Open shell in app container
docker-compose exec app sh

# Run Prisma commands
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma studio

# Check Node.js version
docker-compose exec app node --version

# Check environment variables
docker-compose exec app env
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U hierarchiq -d hierarchiq

# Backup database
docker-compose exec postgres pg_dump -U hierarchiq hierarchiq > backup.sql

# Restore database
docker-compose exec -T postgres psql -U hierarchiq hierarchiq < backup.sql

# Reset database (DANGER!)
docker-compose exec app npx prisma migrate reset
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect project_tracker_postgres_data

# Remove volume (DELETES DATA!)
docker volume rm project_tracker_postgres_data

# Remove all unused volumes
docker volume prune
```

### Network Management

```bash
# List networks
docker network ls

# Inspect network
docker network inspect project_tracker_hierarchiq-network

# Test connectivity between containers
docker-compose exec app ping postgres
```

---

## 🔧 Environment Configuration

### Production Environment Variables

Edit `docker-compose.yml` and update the environment section:

```yaml
environment:
  # Database
  DATABASE_URL: postgresql://hierarchiq:CHANGE_THIS_PASSWORD@postgres:5432/hierarchiq?schema=public
  
  # JWT - Generate secure secret!
  JWT_SECRET: your-super-secure-jwt-secret-min-32-characters
  
  # GROQ AI - Add your API key
  GROQ_API_KEY: gsk_your_actual_groq_api_key
  
  # Email - Configure your SMTP
  SMTP_HOST: smtp.gmail.com
  SMTP_PORT: 587
  SMTP_USER: your-email@gmail.com
  SMTP_PASS: your-gmail-app-password
  
  # App URL
  NEXT_PUBLIC_APP_URL: https://your-domain.com
```

### Using .env File (Recommended)

```bash
# Create .env.docker.local
cp .env.docker .env.docker.local

# Edit with your values
nano .env.docker.local

# Update docker-compose.yml to use it
env_file:
  - .env.docker.local
```

---

## 🧪 Testing the Docker Setup

### Test 1: Application Access

```bash
# Start containers
docker-compose up -d

# Wait 30 seconds for startup
sleep 30

# Test health endpoint
curl http://localhost:3000/api/health

# Expected: {"status":"healthy",...}
```

### Test 2: Database Connection

```bash
# Access Adminer
open http://localhost:8080

# Login with:
# System: PostgreSQL
# Server: postgres
# Username: hierarchiq
# Password: hierarchiq_secure_password
# Database: hierarchiq
```

### Test 3: Register New User

```bash
# Register via API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "name": "Test User",
    "role": "INDIVIDUAL"
  }'

# Expected: {"success":true,"token":"..."}
```

### Test 4: Full Workflow

```bash
# 1. Open application
open http://localhost:3000

# 2. Register account
# Click "Register here"

# 3. Login
# Use your credentials

# 4. Create project
# Click "Create Project"

# 5. Verify in database
open http://localhost:8080
# View the "Project" table
```

---

## 🐛 Troubleshooting

### Issue 1: Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**:
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Issue 2: Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
```bash
# Check if postgres container is running
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Wait for health check
docker-compose ps
# postgres should show (healthy)
```

### Issue 3: Prisma Migration Fails

**Error**: `Migration failed to apply`

**Solution**:
```bash
# Reset database (CAUTION: Deletes data!)
docker-compose exec app npx prisma migrate reset

# Or apply migrations manually
docker-compose exec app npx prisma migrate deploy

# Regenerate client
docker-compose exec app npx prisma generate
```

### Issue 4: Container Keeps Restarting

**Solution**:
```bash
# View container logs
docker-compose logs --tail=100 app

# Check for errors
docker-compose ps

# Inspect container
docker inspect hierarchiq-app

# Remove and recreate
docker-compose down
docker-compose up -d
```

### Issue 5: Out of Disk Space

**Solution**:
```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Clean everything
docker system prune -a --volumes
```

---

## 🎯 Best Practices

### Security

1. **Change Default Passwords**:
   ```yaml
   POSTGRES_PASSWORD: use-strong-password-here
   JWT_SECRET: generate-secure-32-char-secret
   ```

2. **Don't Commit Secrets**:
   - Add `.env.docker.local` to `.gitignore`
   - Use Docker secrets in production

3. **Run as Non-Root**:
   - Dockerfile already configured with `nextjs` user

4. **Use Health Checks**:
   - Already configured in Dockerfile and docker-compose

### Performance

1. **Multi-Stage Builds**:
   - Already implemented in Dockerfile
   - Reduces final image size by 60%

2. **Layer Caching**:
   ```bash
   # Order Dockerfile commands by change frequency
   # Dependencies first, code last
   ```

3. **Volume Mounts**:
   ```yaml
   # Use named volumes for persistence
   volumes:
     - postgres_data:/var/lib/postgresql/data
   ```

### Monitoring

1. **Check Health**:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Monitor Logs**:
   ```bash
   docker-compose logs -f --tail=100
   ```

3. **Resource Usage**:
   ```bash
   docker stats
   ```

---

## 📊 Docker Image Optimization

### Current Image Sizes

```bash
# View image sizes
docker images | grep hierarchiq

# Expected:
# hierarchiq-app (production)  ~200MB
# hierarchiq-app (dev)         ~400MB
# postgres:15-alpine           ~240MB
```

### Optimization Techniques Used

1. **Alpine Linux** - Smallest base image
2. **Multi-stage builds** - Separate build and runtime
3. **.dockerignore** - Exclude unnecessary files
4. **Layer caching** - Optimize build order
5. **Production dependencies** - Only install what's needed

---

## 🚢 Deployment to Cloud

### Deploy to DigitalOcean

```bash
# 1. Create Docker droplet
# 2. SSH into server
ssh root@your-server-ip

# 3. Clone repository
git clone https://github.com/your-repo/hierarchiq.git
cd hierarchiq

# 4. Configure environment
nano .env.docker.local

# 5. Start containers
docker-compose up -d

# 6. Configure domain and SSL
# Use Nginx + Let's Encrypt
```

### Deploy to AWS ECS

1. Build and push image to ECR
2. Create ECS cluster
3. Define task definition
4. Create service
5. Configure load balancer

### Deploy to Google Cloud Run

```bash
# Build and push to GCR
docker build -t gcr.io/PROJECT_ID/hierarchiq .
docker push gcr.io/PROJECT_ID/hierarchiq

# Deploy
gcloud run deploy hierarchiq \
  --image gcr.io/PROJECT_ID/hierarchiq \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 📝 Summary

### What You Now Have

✅ **Fully Containerized Application**
- Next.js app in Docker container
- PostgreSQL database in Docker container
- Development and production configurations

✅ **Real-Time Functionality**
- Hot reload in development mode
- Health checks for monitoring
- Live database connections

✅ **Production-Ready**
- Multi-stage optimized builds
- Security best practices
- Scalable architecture

✅ **Easy Management**
- Simple docker-compose commands
- Database GUI (Adminer)
- Comprehensive logging

---

## 🎯 Quick Reference Card

```bash
# DEVELOPMENT
docker-compose -f docker-compose.dev.yml up    # Start dev
docker-compose -f docker-compose.dev.yml down  # Stop dev

# PRODUCTION
docker-compose up -d                           # Start prod
docker-compose down                            # Stop prod
docker-compose logs -f                         # View logs

# MANAGEMENT
docker-compose exec app sh                     # Shell into app
docker-compose exec postgres psql -U hierarchiq # Database shell
docker-compose exec app npx prisma studio      # Database GUI

# CLEANUP
docker-compose down -v                         # Remove everything
docker system prune -a                         # Clean Docker
```

---

**Your HierarchIQ application is now fully containerized and production-ready!** 🐳🎉

For support: Check logs with `docker-compose logs -f`
