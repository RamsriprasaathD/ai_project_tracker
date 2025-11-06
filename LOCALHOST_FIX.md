# Localhost Login Issue - Quick Fix

## Problem
- Login fails with 500 error
- Server running on port 3001, but accessing port 3000
- Another Next.js instance already running

## Solutions

### Solution 1: Use Correct Port

Your server is running on **port 3001**, not 3000.

**Access**: http://localhost:3001

Update your browser URL from:
- ❌ `http://localhost:3000/login`
- ✅ `http://localhost:3001/login`

### Solution 2: Stop Other Instance & Restart

If you want port 3000:

**Windows (PowerShell)**:
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Restart server
npm run dev
```

**Alternative - Kill All Node Processes**:
```powershell
taskkill /IM node.exe /F
npm run dev
```

### Solution 3: Remove Lock File

If you get lock error:

```bash
# Remove lock file
rm -rf .next/dev/lock

# Or on Windows
rmdir /s /q .next\dev

# Restart
npm run dev
```

### Solution 4: Verify Environment Variables

Check your `.env` file has:

```bash
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
GROQ_API_KEY="your-groq-key"
```

Generate JWT_SECRET if missing:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Solution 5: Regenerate Prisma Client

```bash
npx prisma generate
npm run dev
```

## Quick Test

1. **Stop all Node processes**:
   ```powershell
   taskkill /IM node.exe /F
   ```

2. **Clean build**:
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

3. **Regenerate Prisma**:
   ```bash
   npx prisma generate
   ```

4. **Start dev server**:
   ```bash
   npm run dev
   ```

5. **Access correct URL**:
   - Check terminal output for port
   - Usually: http://localhost:3001

## Check Server Logs

After starting dev server, check terminal for errors:

```bash
npm run dev
```

Look for:
- ✅ "Ready in X ms" - Server started successfully
- ❌ Database connection errors
- ❌ JWT_SECRET errors
- ❌ Prisma client errors

## Common Error Messages

### "JWT_SECRET not defined"
**Fix**: Add to `.env`:
```bash
JWT_SECRET="generate-a-long-random-string-here"
```

### "PrismaClient is unable to run"
**Fix**: 
```bash
npx prisma generate
npm run dev
```

### "Can't reach database server"
**Fix**: Check DATABASE_URL in `.env` and ensure PostgreSQL is running

### "Port 3000 already in use"
**Fix**: Either:
- Use port 3001 (shown in terminal)
- Kill process on port 3000
- Change port in package.json: `"dev": "next dev -p 3002"`

## Test Login

After fixing:

1. Go to: http://localhost:3001/login (check your actual port)
2. Enter test credentials
3. Check browser console (F12) for errors
4. Check terminal for server logs

## Still Not Working?

Share these:
1. Terminal output when running `npm run dev`
2. Browser console errors (F12 → Console tab)
3. Network tab error details (F12 → Network → Click failed request)
