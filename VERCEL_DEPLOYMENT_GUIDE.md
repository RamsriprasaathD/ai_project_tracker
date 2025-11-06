# Vercel Deployment Guide - Project Tracker

## Pre-Deployment Checklist

### 1. Environment Variables Required

Before deploying to Vercel, ensure you have the following environment variables ready:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
GROQ_API_KEY="your-groq-api-key"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### 2. Database Setup

**Option A: Use Vercel Postgres (Recommended)**
1. Go to Vercel Dashboard → Storage → Create Database
2. Select "Postgres"
3. Copy the DATABASE_URL automatically provided
4. Run migrations: `npx prisma migrate deploy`

**Option B: Use External Database (e.g., Neon, Supabase)**
1. Create a PostgreSQL database on your provider
2. Copy the connection string
3. Ensure the database is accessible from Vercel (public/IP whitelist)

### 3. Build Configuration

The project uses:
- **Next.js 16.0.1** (App Router)
- **React 19.2.0**
- **TypeScript 5.x**
- **Prisma 6.18.0**

Build command: `next build`
Output directory: `.next`
Install command: `npm install`

## Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Push to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Verify .gitignore**
   Ensure these are ignored:
   ```
   .env
   .env.local
   node_modules
   .next
   ```

### Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or your project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

#### Database
```
DATABASE_URL = postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

#### Authentication
```
JWT_SECRET = <generate-strong-random-string>
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### AI Integration
```
GROQ_API_KEY = <your-groq-key>
```
Get from: https://console.groq.com/

#### Email (Optional - for password reset)
```
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your-app-specific-password
EMAIL_FROM = your-email@gmail.com
```

#### Application URL
```
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
```

**Important**: Set environment variables for all environments (Production, Preview, Development) if needed.

### Step 4: Database Migration

After first deployment:

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Link your local project to Vercel:
   ```bash
   vercel link
   ```

3. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

4. Run Prisma migrations:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. (Optional) Seed initial data:
   ```bash
   npx prisma db seed
   ```

### Step 5: Deploy

Click "Deploy" in Vercel dashboard or:
```bash
vercel --prod
```

### Step 6: Post-Deployment Verification

1. **Check Build Logs**
   - Ensure no errors during build
   - Verify Prisma client generation succeeded

2. **Test Key Endpoints**
   - `/login` - Login page loads
   - `/api/users` - API responds (with 401 if not authenticated)
   - `/dashboard` - Dashboard accessible after login

3. **Test Core Functionality**
   - User registration
   - User login
   - Project creation
   - Task creation
   - AI insights generation

## Prisma Configuration for Production

Ensure `prisma/schema.prisma` has correct settings:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

The `binaryTargets` ensures compatibility with Vercel's build environment.

## Common Deployment Issues & Solutions

### Issue 1: Build Fails - "Cannot find module '@/lib/prisma'"

**Solution**: Ensure Prisma is properly generated
```bash
# Add postinstall script to package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Issue 2: Database Connection Error

**Solution**: Check connection string format
```
# Correct format
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

# With SSL (for most cloud providers)
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require
```

### Issue 3: AI Insights Not Working

**Solution**: Verify GROQ_API_KEY is set correctly
- Check Vercel Environment Variables
- Ensure key is from https://console.groq.com/
- Check API quota/limits

### Issue 4: TypeScript Build Errors

**Solution**: Fix type errors before deployment
```bash
# Run type check locally
npx tsc --noEmit

# Fix any errors, then commit and redeploy
```

### Issue 5: Module Not Found Errors

**Solution**: Clear Vercel build cache
1. Go to Project Settings → General
2. Scroll to "Build & Development Settings"
3. Clear build cache
4. Redeploy

### Issue 6: Environment Variables Not Loading

**Solution**: 
- Ensure variables are set for correct environment (Production/Preview)
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

## Build Optimization

### 1. Reduce Bundle Size

Already implemented:
- Tree-shaking enabled
- Code splitting via Next.js App Router
- Dynamic imports where appropriate

### 2. Database Query Optimization

Ensure Prisma queries use:
- Proper `include` statements (only fetch what's needed)
- Indexes on frequently queried fields
- Connection pooling (automatically handled by Prisma)

### 3. Serverless Function Optimization

- Keep API routes lightweight
- Use edge runtime for read-only operations (optional)
- Implement caching where appropriate

## Monitoring & Logging

### Vercel Analytics (Built-in)

1. Enable in Project Settings → Analytics
2. Track:
   - Page views
   - Web Vitals
   - API response times

### Error Monitoring

Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Vercel Logs** for serverless function logs

### Database Monitoring

- Monitor connection pool usage
- Track slow queries
- Set up alerts for high error rates

## Custom Domain Setup

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records (Vercel provides instructions)
4. Update `NEXT_PUBLIC_APP_URL` environment variable

## Security Checklist

- [ ] Strong JWT_SECRET set (32+ characters)
- [ ] DATABASE_URL uses SSL connection
- [ ] GROQ_API_KEY is kept secret
- [ ] Email credentials are app-specific passwords
- [ ] No sensitive data in client-side code
- [ ] CORS configured properly (if needed)
- [ ] Rate limiting implemented on API routes
- [ ] SQL injection prevention (Prisma handles this)

## Scaling Considerations

### Database

**Free Tier Limits**:
- Vercel Postgres Free: 256 MB storage
- Connection limit: 1 GB data transfer/month

**When to Upgrade**:
- More than 100 concurrent users
- Database size > 200 MB
- Need for read replicas

### Serverless Functions

**Limits**:
- Free tier: 100 GB-Hours compute
- 10-second execution limit
- 4.5 MB request/response size

**Optimization**:
- Use edge functions for simple operations
- Implement caching for expensive operations
- Consider background jobs for long-running tasks

## Continuous Deployment

Vercel automatically deploys on:
- Push to main branch → Production
- Push to other branches → Preview deployments
- Pull requests → Preview deployments

### Branch Strategy

Recommended:
- `main` → Production
- `staging` → Staging environment (optional)
- `feature/*` → Preview deployments

## Rollback Procedure

If deployment fails or has issues:

1. **Via Vercel Dashboard**:
   - Go to Deployments
   - Find previous working deployment
   - Click "..." → Promote to Production

2. **Via Git**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

## Environment-Specific Configuration

### Development
```bash
# .env.local
DATABASE_URL="postgresql://localhost:5432/projecttracker"
JWT_SECRET="dev-secret"
GROQ_API_KEY="test-key"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### Staging (Preview)
```bash
DATABASE_URL="<staging-database-url>"
JWT_SECRET="<staging-secret>"
GROQ_API_KEY="<production-key>"
NEXT_PUBLIC_APP_URL="https://staging-projecttracker.vercel.app"
```

### Production
```bash
DATABASE_URL="<production-database-url>"
JWT_SECRET="<strong-production-secret>"
GROQ_API_KEY="<production-key>"
NEXT_PUBLIC_APP_URL="https://projecttracker.vercel.app"
```

## Performance Optimization

### 1. Enable Caching

Add to API routes:
```typescript
export const revalidate = 60; // Cache for 60 seconds
```

### 2. Image Optimization

Already handled by Next.js Image component.

### 3. Font Optimization

Next.js automatically optimizes fonts.

### 4. Code Splitting

App Router automatically code splits by route.

## Testing Before Deployment

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint check
npm run lint

# 3. Build locally
npm run build

# 4. Test build
npm start

# 5. Run tests (if any)
npm test
```

## Useful Vercel CLI Commands

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Check project status
vercel inspect
```

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Project Repository**: [Your GitHub URL]

## Final Checklist Before Going Live

- [ ] All environment variables configured
- [ ] Database migrated successfully
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Test user registration/login
- [ ] Test project/task creation
- [ ] AI insights working
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring setup
- [ ] Backup strategy defined
- [ ] Security review completed

## Post-Deployment Monitoring

### Week 1:
- Monitor error rates daily
- Check database performance
- Review serverless function execution times
- Gather user feedback

### Ongoing:
- Weekly performance reviews
- Monthly security audits
- Database optimization as needed
- Feature deployments via staging first

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: _____________

**Database Provider**: _____________

**Notes**: _____________
