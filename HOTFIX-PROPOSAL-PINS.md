# 🔧 HOTFIX: Proposal Pins Not Showing

## Problem Identified

**Root Cause**: The `Proposal` database schema was missing critical fields that the application code expected:
- `geom` (GeoJSON geometry - required for map pins)
- `layer`, `summary`, `body`, `tags` (expected by API)

This caused:
- ❌ Pins not rendering on map
- ❌ Client-side exception when trying to access proposal geometry
- ❌ New proposals failing to save with correct data structure

## Files Fixed

1. ✅ `prisma/schema.prisma` - Added missing fields to Proposal model
2. ✅ `app/components/MapView.tsx` - Fixed IconLayer configuration
3. ✅ `prisma/migrations/add_proposal_fields.sql` - Database migration script

---

## 🚀 HOW TO APPLY THE FIX

### Step 1: Update Database Schema

Run these commands in your terminal:

```bash
cd /home/user/ARENA

# Generate Prisma client with new schema
npm run db:generate

# Push schema changes to Supabase database
npm run db:push
```

If `npm run db:push` asks about data loss, type **'y'** (yes) - this is safe since we're only adding new fields.

### Alternative (If Prisma commands fail):

Manually run the SQL migration in Supabase dashboard:

1. Go to https://supabase.com/dashboard
2. Select your ARENA project
3. Click "SQL Editor" in left sidebar
4. Paste the contents of `prisma/migrations/add_proposal_fields.sql`
5. Click "Run"

---

### Step 2: Restart Development Server

```bash
# Kill any running dev server (Ctrl+C)

# Start fresh
npm run dev
```

---

### Step 3: Verify the Fix

#### **Test 1: Check Map for Pins**
1. Open http://localhost:3000
2. You should see **purple teardrop pins** on the map (if any proposals exist)
3. Hover over a pin → tooltip should appear
4. Click a pin → detail panel should slide in from left

#### **Test 2: Create New Proposal**
1. Click "Crear Propuesta" button
2. Select an area (building/point/polygon)
3. Fill in the form
4. Submit
5. **New pin should appear on map immediately**

#### **Test 3: Check Browser Console**
Open DevTools (F12) and check for:
- ✅ No errors
- ✅ Log: "📍 Loaded X proposals"
- ✅ When hovering pin: cursor changes to pointer
- ✅ When clicking pin: "📍 Clicked proposal: [id]"

---

## 📊 What Changed in Database Schema

### BEFORE (Broken):
```prisma
model Proposal {
  id          String
  title       String
  description String
  status      String
  authorId    String
  // ❌ Missing: geom, layer, summary, body, tags
}
```

### AFTER (Fixed):
```prisma
model Proposal {
  id          String
  title       String
  description String
  status      String
  authorId    String
  geom        Json?        // ✅ NEW: Map coordinates
  layer       String       // ✅ NEW: micro/meso/macro
  summary     String?      // ✅ NEW: Short description
  body        String?      // ✅ NEW: Full content
  tags        String[]     // ✅ NEW: Categories/labels
}
```

---

## 🎯 Expected Results After Fix

### Map View (Navigate Mode)
- **Purple pins visible** at proposal locations
- **Hover tooltip** shows proposal preview
- **Click pin** → sidebar opens with details
- **Smooth animations** and interactions

### Proposal Creation
- Form submission **saves geometry** correctly
- New proposals **immediately visible** on map
- **No console errors**

---

## 🐛 Troubleshooting

### "Pins still not showing"

**Check 1: Are there any proposals in database?**
```bash
# Run seed script to create sample proposals
npm run db:seed
```

**Check 2: Check browser console**
- Look for "Loaded X proposals" message
- If X = 0, there are no proposals to show
- If errors appear, screenshot and share

**Check 3: Verify you're in Navigate mode**
- Map should NOT show "Crear Propuesta" overlay
- If in create mode, click away from create mode

### "Client-side exception still happening"

**Clear build cache:**
```bash
rm -rf .next
npm run dev
```

**Check Vercel deployment:**
- If testing on vercel (arena-lab8.vercel.app), you need to:
  1. Commit and push these changes
  2. Wait for Vercel to redeploy
  3. Vercel needs DATABASE_URL configured in environment variables

### "Database push fails"

**Error: "Can't reach database"**
- Check `DATABASE_URL` in `.env.local`
- Verify Supabase project is not paused
- Try the manual SQL migration instead

---

## 📝 Commit Message (For Git)

```bash
git add prisma/schema.prisma app/components/MapView.tsx prisma/migrations/add_proposal_fields.sql HOTFIX-PROPOSAL-PINS.md

git commit -m "fix: add missing geom field to Proposal schema

Fixes proposal pins not showing on map.

Root cause: Proposal model was missing geom, layer, summary, body, and tags fields that the API and frontend expected.

Changes:
- Add geom (Json) field to store GeoJSON geometry
- Add layer, summary, body, tags fields for complete proposal data
- Fix IconLayer configuration in MapView (sizeScale instead of getSize)
- Provide migration SQL for existing databases

Resolves: pins not visible, client-side exceptions, proposal creation errors"

git push
```

---

## ⏱️ Time to Fix: ~5 minutes

1. Run `npm run db:push` (1 min)
2. Restart dev server (30 sec)
3. Test in browser (3 min)

---

## ✅ Success Checklist

After applying fix, you should have:
- [ ] No errors in browser console
- [ ] Purple pins visible on map
- [ ] Hover tooltip works
- [ ] Click pin opens detail panel
- [ ] New proposals show on map immediately
- [ ] Database has geom/layer/summary/body/tags columns

---

**Need Help?**

If issues persist:
1. Screenshot browser console errors
2. Share the output of `npm run db:push`
3. Check Supabase database logs in dashboard
