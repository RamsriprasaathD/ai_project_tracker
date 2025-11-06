# Complete Neon Database Setup Guide

## 🎯 What You Need to Do

Your `.env` file is now ready - you just need to **paste your Neon connection string**.

---

## ✅ Step-by-Step Instructions

### Step 1: Get Your Neon Connection String

1. Go to: **https://console.neon.tech**
2. **Sign in** (or create account if you haven't)
3. **Select your project** (or create new one)
4. On the dashboard, you'll see **"Connection Details"**
5. **Copy the connection string** - it looks like:
   ```
   postgresql://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Update .env File

1. Open: `d:\capstone project_presidio\project_tracker\.env`
2. Find line 3:
   ```
   DATABASE_URL="YOUR_NEON_DATABASE_URL_HERE"
   ```
3. **Replace** `YOUR_NEON_DATABASE_URL_HERE` with your Neon connection string
4. Should look like:
   ```
   DATABASE_URL="postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
5. **Save the file** (Ctrl+S)

### Step 3: Run Setup Script

Open PowerShell in your project folder and run:

```bash
.\setup-neon-db.bat
```

This will:
- Stop old processes
- Clean caches
- Generate Prisma client
- Push database schema
- Test connection

**OR** run manually:

```bash
# Stop all Node processes
taskkill /IM node.exe /F

# Clean cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Generate Prisma
npx prisma generate

# Push schema to Neon
npx prisma db push

# Test connection
node test-db.js
```

### Step 4: Start Server

```bash
npm run dev
```

You should see:
```
✓ Ready in 1234ms
Local: http://localhost:3000
```

### Step 5: Register & Login

1. Go to: **http://localhost:3000/register**
2. Create your first user account
3. Login with your credentials
4. ✅ **Success!** You're in!

---

## 🔍 Verify It's Using Neon

When you run `npx prisma db push`, you should see:

```
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-xxxx.neon.tech:5432"
✓ Database synchronized
```

**NOT**:
```
❌ at "aws-1-ap-southeast-1.pooler.supabase.com:5432"  (This is Supabase - wrong!)
```

---

## ❌ If You See Errors

### Error: "Can't reach database server"

**Problem**: DATABASE_URL is still wrong or not updated

**Fix**:
1. Double-check you saved `.env` file
2. Make sure you pasted the FULL Neon connection string
3. Close and reopen terminal
4. Try again

### Error: "Authentication failed"

**Problem**: Wrong password in connection string

**Fix**:
1. Go back to Neon dashboard
2. Reset database password if needed
3. Copy fresh connection string
4. Update `.env` again

### Error: "Schema not found"

**Problem**: Database name in connection string is wrong

**Fix**:
1. Check your connection string
2. Make sure it ends with `/neondb?sslmode=require`
3. Or use the database name from Neon dashboard

---

## 🎉 After Setup Complete

Your application will have:

✅ Working login/registration
✅ Role-based dashboards
✅ Project management
✅ Task tracking
✅ AI-powered insights
✅ Real-time updates

All features are ready - just needed the database!

---

## 📝 What Your .env Should Look Like

```bash
# Database - NEON
DATABASE_URL="postgresql://neondb_owner:xxxx@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# JWT Config
JWT_SECRET=your-jwt-secret-here-min-32-characters
JWT_EXPIRES_IN="7d"

# SMTP Config (for password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password-here"

# GROQ AI Config (for AI insights)
GROQ_API_KEY=your-groq-api-key-here

# App URL (for password reset links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚀 Quick Command Reference

```bash
# Stop server
Ctrl+C

# Clean everything
Remove-Item -Recurse -Force .next

# Regenerate Prisma
npx prisma generate

# Update database schema
npx prisma db push

# Test connection
node test-db.js

# Start server
npm run dev
```

---

## ✅ Success Indicators

When everything works:

1. **`node test-db.js`** shows:
   ```
   ✅ SUCCESS! Database is connected and working!
   ```

2. **`npx prisma db push`** shows:
   ```
   ✓ Database synchronized
   ```

3. **Server starts** without database errors

4. **Login works** at http://localhost:3000/login

---

## 🆘 Need Help?

If still stuck:
1. Share the exact error message
2. Share your DATABASE_URL (hide password with xxx)
3. Share output of `node test-db.js`

I'll help you fix it!
