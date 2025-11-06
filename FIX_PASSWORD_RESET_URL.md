# Fix Password Reset URL for Vercel

## 🚨 Problem
Password reset emails are sending `http://localhost:3000/reset?token=...` links, which don't work for other users.

## ✅ Solution: Update NEXT_PUBLIC_APP_URL in Vercel

---

## 🔧 Step-by-Step Fix

### Step 1: Find Your Vercel URL

1. Go to: https://vercel.com/dashboard
2. Click your project: `ai_project_tracker`
3. Copy your deployment URL, for example:
   ```
   https://ai-project-tracker.vercel.app
   ```
   OR
   ```
   https://your-custom-domain.com
   ```

### Step 2: Add to Vercel Environment Variables

1. In Vercel Dashboard → Your Project
2. Go to **Settings** → **Environment Variables**
3. Click **Add New**
4. Fill in:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://ai-project-tracker.vercel.app` (your actual Vercel URL)
   - **Environments**: Select **Production** (and Preview if you want)
5. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click the ⋯ menu on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 4: Test Password Reset

1. Go to your Vercel app: https://ai-project-tracker.vercel.app/forgot-password
2. Enter an email address
3. Check the email inbox
4. The reset link should now be:
   ```
   https://ai-project-tracker.vercel.app/reset?token=...
   ```
   ✅ NOT `http://localhost:3000/reset?token=...`

---

## 📝 Complete Vercel Environment Variables

Make sure ALL these are set in Vercel:

```bash
# Database (REQUIRED)
DATABASE_URL="your-neon-database-url-here"

# JWT Authentication (REQUIRED)
JWT_SECRET="your-jwt-secret-here-min-32-chars"
JWT_EXPIRES_IN="7d"

# Email for Password Reset (REQUIRED for forgot password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password-here"

# AI Insights (REQUIRED for insights feature)
GROQ_API_KEY="your-groq-api-key-here"

# App URL (REQUIRED - THIS IS THE FIX!)
NEXT_PUBLIC_APP_URL="https://ai-project-tracker.vercel.app"
```

**IMPORTANT**: Replace `https://ai-project-tracker.vercel.app` with YOUR actual Vercel URL!

---

## 🔍 How to Find Your Vercel URL

### Method 1: From Dashboard
1. Vercel Dashboard → Your Project
2. Look at the top - you'll see: "Visit: https://your-app.vercel.app"
3. Copy that URL

### Method 2: From Deployments
1. Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. At the top you'll see the domain
4. Copy it

### Method 3: Custom Domain
If you added a custom domain:
1. Settings → Domains
2. Use your custom domain: `https://your-domain.com`

---

## 🎯 Quick Setup Commands

### Copy-Paste These to Vercel Environment Variables:

**Variable 1**:
```
Name: NEXT_PUBLIC_APP_URL
Value: https://YOUR-ACTUAL-VERCEL-URL-HERE.vercel.app
Environment: Production
```

**Variable 2** (if missing):
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_3CBPyZkhbLf7@ep-green-frog-ahe4p06e-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Environment: Production, Preview, Development
```

**Variable 3** (if missing):
```
Name: JWT_SECRET
Value: f5c73a57ab3840998fe9b859a66831401afeebb87bcba0ea667afed9b8b4a8af9a42244d0959df7a6eaf594d6aa0f7af2eb62bedab1b61c953b0e253cf4fd64cey
Environment: Production, Preview, Development
```

**Variable 4-7** (Email config - if missing):
```
Name: SMTP_HOST
Value: smtp.gmail.com
Environment: Production

Name: SMTP_PORT
Value: 587
Environment: Production

Name: SMTP_USER
Value: your-email@gmail.com
Environment: Production

Name: SMTP_PASS
Value: your-app-password-here
Environment: Production
```

**Variable 8** (if missing):
```
Name: GROQ_API_KEY
Value: your-groq-api-key-here
Environment: Production, Preview, Development
```

---

## ✅ After Adding Variables

1. **Save all variables**
2. **Redeploy** (Deployments → ⋯ → Redeploy)
3. **Wait** for deployment to complete (1-2 minutes)
4. **Test** password reset again

---

## 🧪 Test Password Reset Flow

### Step 1: Trigger Reset
1. Go to: `https://your-app.vercel.app/forgot-password`
2. Enter email: `test@example.com` (a registered user)
3. Click "Send Reset Link"

### Step 2: Check Email
1. Open the email inbox for `test@example.com`
2. Look for password reset email
3. Click the link in email

### Step 3: Verify URL
The link should be:
```
✅ https://your-app.vercel.app/reset?token=eyJhbGciOiJIUzI1NiIsInR5...
```

NOT:
```
❌ http://localhost:3000/reset?token=eyJhbGciOiJIUzI1NiIsInR5...
```

### Step 4: Complete Reset
1. Link should open your Vercel app
2. Enter new password
3. Click "Reset Password"
4. Should redirect to login
5. Test login with new password ✅

---

## 🔍 Verify Configuration

Check that Vercel has the correct URL:

1. **Go to**: Vercel Dashboard → Settings → Environment Variables
2. **Find**: `NEXT_PUBLIC_APP_URL`
3. **Verify**: Should be `https://your-app.vercel.app` (NOT localhost)
4. **Check**: Environment should be "Production"

---

## 🎯 Important Notes

### For Development (Local)
Keep your local `.env` as:
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### For Production (Vercel)
Vercel environment variable should be:
```bash
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

This way:
- **Local development** → Uses localhost
- **Production (Vercel)** → Uses Vercel URL

The app automatically uses the correct URL based on environment! 🎉

---

## 🆘 If Still Not Working

### Debug Step 1: Check Email Settings

Verify Gmail is allowing app access:
1. Gmail → Settings → Security
2. "Less secure app access" should be ON
3. OR use "App Password" (recommended)

### Debug Step 2: Check Vercel Logs

1. Vercel Dashboard → Deployments → Latest
2. Click "Functions" tab
3. Look for email/SMTP errors
4. Check if SMTP variables are loaded

### Debug Step 3: Test Email Manually

Check if emails are being sent at all:
1. Trigger password reset on Vercel
2. Check Vercel function logs
3. Look for: "Email sent successfully" or errors

### Debug Step 4: Verify Environment Variable

In Vercel function logs, check if correct URL is being used:
```
# Should see in logs:
Using app URL: https://your-app.vercel.app
```

---

## 📊 Expected Behavior After Fix

### Before Fix:
- ❌ Reset email: `http://localhost:3000/reset?token=...`
- ❌ Link doesn't work for other users
- ❌ Only works on your computer

### After Fix:
- ✅ Reset email: `https://your-app.vercel.app/reset?token=...`
- ✅ Link works for anyone
- ✅ Opens Vercel app directly

---

## 🎉 Summary

**Problem**: Password reset links use localhost
**Solution**: Set `NEXT_PUBLIC_APP_URL` in Vercel to your Vercel URL
**Steps**: 
1. Copy Vercel URL
2. Add to Environment Variables
3. Redeploy
4. Test

**Result**: Password reset emails now use correct Vercel URL and work for all users! 🚀

---

## ⚡ Quick Fix Checklist

- [ ] Find Vercel URL (e.g., `https://ai-project-tracker.vercel.app`)
- [ ] Add `NEXT_PUBLIC_APP_URL` to Vercel Environment Variables
- [ ] Set value to your Vercel URL (NOT localhost)
- [ ] Select "Production" environment
- [ ] Save variable
- [ ] Redeploy application
- [ ] Test password reset
- [ ] Verify email link uses Vercel URL
- [ ] ✅ Done!
