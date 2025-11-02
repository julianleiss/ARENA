# 🔧 Database Setup Guide for ARENA

This guide will help you fix the database connection issues once and for all.

## 🎯 Problem Summary

The app was failing to connect to Supabase because:
1. ❌ Using **direct connection** (port 5432) instead of **pooler** (port 6543)
2. ❌ Wrong username format (needs `postgres.PROJECT_REF` not just `postgres`)
3. ❌ Missing `?pgbouncer=true` parameter
4. ⚠️ RLS policies were missing (now fixed)

## ✅ Solution: 3 Quick Steps

### Step 1: Setup Local Environment (.env file)

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Open the file
nano .env
# or
code .env

# 3. Find this line (around line 23):
DATABASE_URL="postgresql://postgres.vtckkegygfhsvobmyhto:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# 4. Replace [YOUR-PASSWORD] with your actual Supabase database password
# IMPORTANT: Get the exact connection string from Supabase Dashboard → Database → Connection Pooling → Session mode

# 5. Save the file
```

**Your correct DATABASE_URL should look like:**
```
DATABASE_URL="postgresql://postgres.vtckkegygfhsvobmyhto:Zvx9zya6vdb.atbasAJU@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

### Step 2: Seed the Database

```bash
# Clear Prisma cache
rm -rf node_modules/.prisma

# Regenerate Prisma client with new connection
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with mock data (5 proposals)
npm run db:seed
```

**Expected output:**
```
✅ Seeded 5 proposals
✅ Seeded 3 users
✅ Seeded 5 POIs
```

### Step 3: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Click your **ARENA** project
3. Go to **Settings** → **Environment Variables**
4. Find or create `DATABASE_URL`
5. Set value to (use the EXACT same string from your local .env):
   ```
   postgresql://postgres.vtckkegygfhsvobmyhto:Zvx9zya6vdb.atbasAJU@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   ```
6. Enable for: **Production**, **Preview**, **Development**
7. **Save**
8. Go to **Deployments** → Click ⋯ on latest → **Redeploy**

## 🧪 Verify Everything Works

### Test 1: Local API
```bash
npm run dev
```

Open: http://localhost:3000/api/proposals?status=public

**Should see:**
```json
{
  "proposals": [...],
  "count": 5,
  "source": "database"  ← Must say "database" not "mock"
}
```

### Test 2: Production API

After Vercel redeploys, open:
https://arena-lab8.vercel.app/api/proposals?status=public

**Should see:**
```json
{
  "proposals": [...],
  "count": 5,
  "source": "database"  ← Must say "database" not "mock"
}
```

### Test 3: Map & Sidebar

1. Open: https://arena-lab8.vercel.app/
2. **Map should show 5 proposal pins** 📍
3. Click **"PROPUESTAS"** button
4. **Sidebar should show 5 proposals** 📋
5. Create new proposal → should appear immediately

## 🔑 Key Points

### Connection String Format

| Component | Value |
|-----------|-------|
| **Protocol** | `postgresql://` |
| **Username** | `postgres.vtckkegygfhsvobmyhto` |
| **Password** | Your database password |
| **Host** | `aws-1-us-east-1.pooler.supabase.com` |
| **Port** | `5432` (Session pooler uses 5432, not 6543!) |
| **Database** | `postgres` |
| **Parameters** | None (no pgbouncer parameter needed) |

### Direct vs Session Pooler Connection

| Type | Port | Works From | Use For |
|------|------|------------|---------|
| **Direct** | 6543 | ❌ Only internal | Never use for external apps |
| **Session Pooler** | 5432 | ✅ Vercel, local, etc. | ALWAYS use this for external access |

**Note**: Supabase has multiple pooler types (Session, Transaction). For Next.js apps, use **Session pooler on port 5432**.

## 🆘 Troubleshooting

### "Tenant or user not found"
- ❌ Wrong username format
- ✅ Use: `postgres.vtckkegygfhsvobmyhto`

### "Can't reach database server"
- ❌ Using direct connection (port 6543)
- ✅ Use Session pooler connection (port 5432)

### Still showing "source": "mock"
- ❌ Vercel environment variable not updated
- ❌ Didn't redeploy after updating
- ✅ Update `DATABASE_URL` in Vercel and redeploy

### RLS errors "permission denied"
- ❌ RLS policies not applied
- ✅ Run the SQL script: `prisma/migrations/enable_rls_minimal.sql` in Supabase SQL Editor

## 📞 Need Your Database Password?

If you don't remember your database password:

1. **Supabase Dashboard** → ⚙️ **Project Settings** → **Database**
2. Scroll to **"Reset database password"**
3. Click **"Generate a new password"**
4. **Copy and save it** (you'll need it for DATABASE_URL)
5. Update both local `.env` and Vercel with the new password

## ✅ Success Checklist

- [ ] `.env` file has correct Session pooler connection (port 5432)
- [ ] Username is `postgres.vtckkegygfhsvobmyhto` (not just `postgres`)
- [ ] Host is `aws-1-us-east-1.pooler.supabase.com`
- [ ] NO `?pgbouncer=true` parameter (not needed for Session pooler)
- [ ] `npm run db:seed` runs successfully
- [ ] Local API shows `"source": "database"`
- [ ] Vercel DATABASE_URL updated with same Session pooler connection
- [ ] Vercel redeployed after env var update
- [ ] Production API shows `"source": "database"`
- [ ] Map shows 5 proposal pins
- [ ] Sidebar shows 5 proposals
- [ ] New proposals appear immediately after creation

---

**Once all checkboxes are ✅, your database is fully working!** 🎉
