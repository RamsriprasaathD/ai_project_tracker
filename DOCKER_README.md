# 🐳 HierarchIQ - Docker Quick Start

## Run HierarchIQ in 3 Steps!

### Step 1: Install Docker

Download and install Docker Desktop:
- **Windows/Mac**: https://www.docker.com/products/docker-desktop
- **Linux**: `sudo apt-get install docker-compose`

### Step 2: Start Application

```bash
# Windows (double-click)
docker-start.bat

# Or manually:
docker-compose up -d
```

### Step 3: Open Application

- **Application**: http://localhost:3000
- **Database Manager**: http://localhost:8080
- **Health Check**: http://localhost:3000/api/health

---

## 🎯 What's Included

### Services

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **HierarchIQ App** | 3000 | http://localhost:3000 | Main application |
| **PostgreSQL** | 5432 | localhost:5432 | Database |
| **Adminer** | 8080 | http://localhost:8080 | Database UI |

### Features

✅ **Full Application** - Complete Next.js app with all features
✅ **PostgreSQL Database** - Production-ready database
✅ **Database Manager** - GUI for database management
✅ **Hot Reload** - Development mode with auto-reload
✅ **Health Checks** - Automatic health monitoring
✅ **Data Persistence** - Database data is saved in Docker volumes

---

## 🚀 Quick Commands

### Start Application

```bash
# Production mode
docker-compose up -d

# Development mode (with hot reload)
docker-compose -f docker-compose.dev.yml up
```

### Stop Application

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

### Database Management

```bash
# Open database shell
docker-compose exec postgres psql -U hierarchiq -d hierarchiq

# Run Prisma commands
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma migrate deploy
```

---

## 🔧 Configuration

### Environment Variables

Edit `docker-compose.yml` to configure:

- **Database Password**: Change `POSTGRES_PASSWORD`
- **JWT Secret**: Update `JWT_SECRET`
- **Email Settings**: Configure SMTP settings
- **GROQ API Key**: Add your GROQ API key

### Default Credentials

**Database (Adminer)**:
- System: PostgreSQL
- Server: postgres
- Username: hierarchiq
- Password: hierarchiq_secure_password
- Database: hierarchiq

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

### Container Won't Start

```bash
# View logs
docker-compose logs app

# Restart containers
docker-compose restart
```

### Database Connection Error

```bash
# Check database status
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Clean Install

```bash
# Remove everything and start fresh
docker-compose down -v
docker-compose up -d
```

---

## 📊 Health Check

Verify everything is working:

```bash
# Run automated tests
test-docker.bat

# Or manually check health
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "application": "running"
}
```

---

## 📚 Full Documentation

For complete details, see: `DOCKER_DEPLOYMENT_GUIDE.md`

---

## 🎉 That's It!

Your HierarchIQ application is now running in Docker!

**Next Steps**:
1. Open http://localhost:3000
2. Register a new account
3. Start managing your projects!

---

**Need Help?**

- Check logs: `docker-compose logs -f`
- Full guide: `DOCKER_DEPLOYMENT_GUIDE.md`
- Stop all: `docker-compose down`
