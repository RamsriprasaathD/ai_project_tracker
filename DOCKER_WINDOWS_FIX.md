# 🐳 Docker Desktop - Windows Troubleshooting

## Error: "The system cannot find the file specified"

This error means **Docker Desktop is not running** on Windows.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Start Docker Desktop

1. Press `Windows Key` and search: **Docker Desktop**
2. Click to open it
3. Wait for the whale icon to appear in system tray (bottom-right)
4. Wait until it says: **"Docker Desktop is running"**

**⏱️ This may take 1-2 minutes on first start**

---

### Step 2: Verify Docker is Running

Open PowerShell and run:

```powershell
docker --version
```

**Expected Output**:
```
Docker version 24.0.6, build ed223bc
```

**If you see an error**, Docker is still not running. Wait a bit longer.

---

### Step 3: Try Again

```powershell
docker-compose up -d
```

**Expected Output**:
```
Creating network "project_tracker_hierarchiq-network" ... done
Creating hierarchiq-db ... done
Creating hierarchiq-app ... done
Creating hierarchiq-adminer ... done
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Docker Desktop Won't Start

**Symptoms**:
- Whale icon stays grayed out
- Error: "Docker Desktop starting..."

**Solutions**:

1. **Restart Docker Desktop**:
   - Right-click whale icon in system tray
   - Click "Quit Docker Desktop"
   - Wait 10 seconds
   - Open Docker Desktop again

2. **Restart Your Computer**:
   - Sometimes Windows needs a restart
   - This fixes most issues

3. **Check WSL 2** (if using Windows 10/11):
   ```powershell
   wsl --list --verbose
   ```
   - Should show Ubuntu or similar
   - If not installed, Docker Desktop will install it

4. **Check Hyper-V** (Windows 10 Pro/Enterprise):
   - Open "Turn Windows features on or off"
   - Enable "Hyper-V"
   - Restart computer

---

### Issue 2: "Docker daemon is not running"

**Solution**:

```powershell
# Method 1: Start via command
"C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Method 2: Start via Windows Services
# Press Win+R, type: services.msc
# Find: Docker Desktop Service
# Right-click → Start
```

---

### Issue 3: Permission Denied

**Solution**:

1. **Run PowerShell as Administrator**:
   - Right-click PowerShell
   - Select "Run as Administrator"

2. **Then run**:
   ```powershell
   docker-compose up -d
   ```

---

### Issue 4: Port Already in Use

**Error**: `port is already allocated`

**Solution**:

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill it (replace <PID> with actual number)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
# Edit ports: "3001:3000" instead of "3000:3000"
```

---

### Issue 5: WSL 2 Not Installed (Windows 10/11)

**Error**: "WSL 2 installation is incomplete"

**Solution**:

```powershell
# Install WSL 2
wsl --install

# Restart computer
# Then start Docker Desktop
```

---

## 🎯 Step-by-Step: First Time Setup

### For Windows 10/11 Users

1. **Install Docker Desktop**:
   - Download: https://www.docker.com/products/docker-desktop
   - Run installer
   - Follow prompts

2. **Enable WSL 2** (if prompted):
   ```powershell
   wsl --install
   ```

3. **Restart Computer**:
   - Required for changes to take effect

4. **Start Docker Desktop**:
   - Windows Key → Docker Desktop
   - Wait for "running" status

5. **Verify Installation**:
   ```powershell
   docker --version
   docker-compose --version
   ```

6. **Run HierarchIQ**:
   ```powershell
   cd "d:\capstone project_presidio\project_tracker"
   docker-compose up -d
   ```

---

## 🔧 Advanced Troubleshooting

### Check Docker Service Status

```powershell
# Open Services
services.msc

# Find these services:
# - Docker Desktop Service
# - com.docker.service

# Make sure both are "Running"
```

### Reset Docker Desktop

**⚠️ WARNING: This will delete all containers and images**

1. Open Docker Desktop
2. Click gear icon (Settings)
3. Click "Troubleshoot"
4. Click "Reset to factory defaults"
5. Confirm reset
6. Wait for Docker to restart

### Check Event Viewer

```powershell
# Open Event Viewer
eventvwr

# Navigate to:
# Applications and Services Logs → Docker Desktop
# Check for errors
```

---

## ✅ Verification Checklist

After Docker Desktop is running:

```powershell
# 1. Check Docker version
docker --version
# ✓ Should show: Docker version 24.0.x

# 2. Check Docker Compose
docker-compose --version
# ✓ Should show: Docker Compose version v2.x.x

# 3. Test Docker
docker run hello-world
# ✓ Should show: "Hello from Docker!"

# 4. Check running containers
docker ps
# ✓ Should show: CONTAINER ID  IMAGE  ...

# 5. Start HierarchIQ
docker-compose up -d
# ✓ Should create 3 containers
```

---

## 🎯 Quick Test Script

Save this as `test-docker-windows.bat`:

```batch
@echo off
echo Testing Docker Desktop on Windows...
echo.

echo 1. Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Docker is not installed or not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)
echo [PASS] Docker is installed

echo.
echo 2. Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Docker Compose not found
    pause
    exit /b 1
)
echo [PASS] Docker Compose is available

echo.
echo 3. Testing Docker daemon...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Docker daemon is not running
    echo Start Docker Desktop and wait for "running" status
    pause
    exit /b 1
)
echo [PASS] Docker daemon is running

echo.
echo ========================================
echo All tests passed! Docker is ready!
echo ========================================
echo.
echo You can now run:
echo   docker-compose up -d
echo.
pause
```

---

## 📱 System Tray Icon Meanings

Docker Desktop whale icon in system tray (bottom-right):

| Icon | Status | Meaning |
|------|--------|---------|
| 🐳 (white) | Running | Docker is ready to use ✓ |
| 🐳 (gray) | Starting | Wait a bit... |
| 🐳 (animating) | Working | Docker is busy |
| ❌ (red) | Error | Check logs/restart |
| No icon | Not running | Start Docker Desktop |

---

## 🆘 Still Not Working?

### Option 1: Check System Requirements

**Windows 10/11 Requirements**:
- Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 or higher)
- Windows 11 64-bit
- WSL 2 feature enabled
- Hyper-V and Containers features enabled
- BIOS-level hardware virtualization support enabled

### Option 2: Reinstall Docker Desktop

```powershell
# Uninstall
# Control Panel → Programs → Docker Desktop → Uninstall

# Download latest version
# https://www.docker.com/products/docker-desktop

# Install
# Run installer as Administrator
```

### Option 3: Use Windows Compatibility Mode

For older Windows versions:
1. Right-click Docker Desktop shortcut
2. Properties → Compatibility
3. Check "Run as administrator"
4. Apply and restart

---

## 🎉 Success!

Once you see this output, you're ready:

```powershell
PS> docker-compose up -d
Creating network "project_tracker_hierarchiq-network" ... done
Creating hierarchiq-db ... done
Creating hierarchiq-app ... done
Creating hierarchiq-adminer ... done

PS> docker-compose ps
NAME                 STATUS         PORTS
hierarchiq-app       Up 10 seconds  0.0.0.0:3000->3000/tcp
hierarchiq-db        Up 10 seconds  0.0.0.0:5432->5432/tcp
hierarchiq-adminer   Up 10 seconds  0.0.0.0:8080->8080/tcp
```

**Open**: http://localhost:3000

---

## 📞 Getting Help

If Docker Desktop still won't start:

1. **Docker Desktop Logs**:
   - Open Docker Desktop
   - Click gear icon → Troubleshoot → View Logs

2. **Community Support**:
   - https://forums.docker.com/
   - Stack Overflow (tag: docker-desktop)

3. **Official Docs**:
   - https://docs.docker.com/desktop/troubleshoot/overview/

---

**Most Common Fix**: Just start Docker Desktop and wait 1-2 minutes! 🐳
