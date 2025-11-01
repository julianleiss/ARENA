# Vercel Database Connection Checklist

## 🔴 CURRENT ISSUE
Connection to Supabase PostgreSQL times out:
- DNS resolves: ✅ `2600:1f18:2e13:9d09:58a1:8271:ea9e:7d4f`
- TCP Connection: ❌ **Times out after 10 seconds**
- Error: `Can't reach database server at db.vtckkegygfhsvobmyhto.supabase.co:5432`

## 📋 Diagnostic Steps

### 1. Check Supabase Project Status
Go to: https://supabase.com/dashboard/projects

**Verify:**
- [ ] Project is **not paused** (free tier auto-pauses after 7 days inactivity)
- [ ] Project status shows "Active" (green indicator)
- [ ] Database is running (check project overview)

**If paused:**
```
Click "Resume Project" button in Supabase dashboard
Wait 2-3 minutes for database to start
```

### 2. Verify Connection Pooler Configuration
Go to: Project Settings → Database → Connection Pooling

**Current Configuration Issues:**
- ❌ Using transaction mode (port 5432) - not recommended for serverless
- ❌ No `DIRECT_URL` set - required for migrations
- ❌ No `pgbouncer=true` parameter

**Recommended Configuration:**

```bash
# For Vercel Environment Variables:
DATABASE_URL="postgresql://postgres.vtckkegygfhsvobmyhto:[PASSWORD]@db.vtckkegygfhsvobmyhto.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.vtckkegygfhsvobmyhto:[PASSWORD]@db.vtckkegygfhsvobmyhto.supabase.co:5432/postgres"
```

### 3. Update Prisma Schema
Add DIRECT_URL for migrations:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")      // Pooler (port 6543)
  directUrl = env("DIRECT_URL")       // Direct (port 5432)
}
```

### 4. Vercel Environment Variables

**Go to:** https://vercel.com/julianleiss-projects/arena/settings/environment-variables

**Required Variables:**
- [x] `DATABASE_URL` - Session pooler (port 6543 + pgbouncer=true)
- [ ] `DIRECT_URL` - Direct connection (port 5432) for migrations
- [x] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Already set
- [x] `NEXT_DISABLE_LIGHTNINGCSS` - Already set to 1

**After updating:**
1. Redeploy: `vercel --prod --force`
2. Or trigger deployment via Git push

### 5. Test Connection from Vercel

**Option A:** Use Vercel CLI
```bash
vercel env pull .env.production
npx tsx scripts/test-db-connection.ts
```

**Option B:** Check Vercel deployment logs
```bash
vercel logs --prod
# Look for Prisma connection errors
```

### 6. Network Restrictions

**Check if your IP/network blocks Supabase:**
```bash
# Test from different network (mobile hotspot, etc.)
curl -v telnet://db.vtckkegygfhsvobmyhto.supabase.co:5432
```

**Supabase IP Allowlist:**
- Go to: Project Settings → Database → Connection Pooling
- Check "Restrict IP ranges" setting
- Ensure Vercel IPs are allowed (or disable restriction)

## 🚨 Quick Fix: Resume Paused Project

**Most likely cause:** Free tier Supabase project auto-paused

**Steps:**
1. Go to https://supabase.com/dashboard
2. Find project `vtckkegygfhsvobmyhto`
3. Click "Resume Project" if paused
4. Wait 2-3 minutes
5. Run: `npx tsx scripts/test-db-connection.ts`

## 🔄 Alternative: Migrate to New Supabase Project

If project is deleted or unrecoverable:

```bash
# 1. Create new Supabase project
# 2. Update .env.local with new connection string
# 3. Push schema
npm run db:push

# 4. Seed data
npm run db:seed

# 5. Update Vercel env vars
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production

# 6. Redeploy
git push origin main
```

## 🎯 Expected Results After Fix

```bash
npx tsx scripts/test-db-connection.ts

# Should output:
✅ Test 1: Raw SQL Query - Success
✅ Test 2: Count Users - Success: X users
✅ Test 3: Database Version - Success: PostgreSQL 15.x
✅ All tests passed!
```

## 📊 Current Environment Analysis

**Local (.env.local):**
- DATABASE_URL: ✅ Set (port 5432, no pooler)
- DIRECT_URL: ❌ Not set

**Recommendation:**
Update `.env.local` to use pooler for local development too:
```bash
DATABASE_URL="postgresql://postgres.vtckkegygfhsvobmyhto:[PASSWORD]@db.vtckkegygfhsvobmyhto.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.vtckkegygfhsvobmyhto:[PASSWORD]@db.vtckkegygfhsvobmyhto.supabase.co:5432/postgres"
```
