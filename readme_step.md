# ARENA V1.0 — Step-by-Step Progress

## ✅ v0.100 — Setup + Deploy (CURRENT)

**Goal:** Get a live, working Next.js app deployed with a `/health` endpoint.

**Status:** 🟡 In Progress

### What We Built

- ✅ Next.js 14 project with TypeScript + Tailwind
- ✅ Prisma schema with core entities (User, Proposal, Vote, Comment, Metric, POI, AuditLog)
- ✅ Supabase integration (auth + database)
- ✅ `/api/health` endpoint for system status
- ✅ Seed script with test data
- ✅ Rollback script for database cleanup

### Setup Instructions

#### 1. Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait for provisioning (2-3 minutes)
4. Go to **Settings** → **API**
5. Copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key
6. Go to **Settings** → **Database**
7. Copy the connection string (URI format)

#### 2. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
nano .env.local
```

Fill in the values you copied from Supabase.

#### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push

# Seed with test data
npm run db:seed
```

#### 4. Run Development Server

```bash
npm run dev
```

Visit:
- **App:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

You should see:
```json
{
  "status": "ok",
  "version": "0.100",
  "timestamp": "2025-10-20T...",
  "database": "connected",
  "service": "ARENA MVP"
}
```

#### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables in Vercel Dashboard
# Then deploy to production
vercel --prod
```

### Testing

**Manual Test:**
```bash
curl https://your-app.vercel.app/api/health
```

Expected: 200 OK with JSON response

### Validation Checklist

- [ ] Public URL accessible
- [ ] `/api/health` returns 200 OK
- [ ] Database connected
- [ ] Seed data visible in Prisma Studio (`npm run db:studio`)
- [ ] Vercel deployment successful

### What's Next?

Once v0.100 is validated, we move to **v0.101 — Scene Viewer**:
- MapLibre GL integration
- POI layer rendering
- Interactive map controls
- Loads in <2 seconds

---

## 🔮 Upcoming Versions

- **v0.101:** Scene Viewer (MapLibre + POIs)
- **v0.102:** Proposals CRUD
- **v0.103:** Participation (Comments + Votes)
- **v0.104:** Metrics + Gates
- **v0.105:** Demo Script + E2E Tests

---

## 🆘 Troubleshooting

### Database Connection Failed

**Error:** `Can't reach database server`

**Fix:**
1. Check your `DATABASE_URL` in `.env.local`
2. Ensure Supabase project is active
3. Check firewall/network settings

### Prisma Generate Failed

**Error:** `Environment variable not found: DATABASE_URL`

**Fix:**
```bash
# Make sure .env.local exists
cp .env.example .env.local
# Fill in your Supabase credentials
```

### Health Check Returns 503

**Fix:**
1. Run `npm run db:push` to sync schema
2. Check Supabase project status
3. Verify DATABASE_URL is correct

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
