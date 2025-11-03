# ARENA - Troubleshooting Guide

## Problem: Only 5 proposals visible, slow loading, new proposals not saving

This indicates database connection issues between Vercel and Supabase.

---

## Step 1: Verify Database State (Run in Supabase Studio)

1. Go to: https://supabase.com/dashboard → Your Project → **SQL Editor**
2. Run the diagnostic script: `scripts/diagnose-database.sql`
3. Check the results:

**Expected:**
- `total_proposals`: 20+ proposals
- `proposals_with_geom`: All proposals should have geom
- `spanish_proposals`: Should be 20+
- Recent proposals should show Spanish titles

**If you see fewer proposals:**
- Run `scripts/insert-spanish-proposals.sql` to add the 20 Spanish proposals
- Verify it completed successfully

---

## Step 2: Test Database Connection from Vercel

1. Deploy the latest code to Vercel (includes `/api/debug` endpoint)
2. Open in browser: `https://arena-lab8.vercel.app/api/debug`
3. Check the response:

**Expected:**
```json
{
  "overall_status": "✅ All checks passed",
  "checks": {
    "database_connection": "✅ Connected",
    "proposal_count": "✅ 20 proposals",
    "recent_proposals": "✅ Fetched 5 proposals"
  }
}
```

**If you see errors:**
- Proceed to Step 3 (Environment Variables)

---

## Step 3: Verify Vercel Environment Variables

### Check DATABASE_URL

1. Go to: Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Verify it's configured correctly:

**IMPORTANT: For Vercel (serverless), use SESSION POOLER:**

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**NOT the direct connection** (which is for local development):
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].connect.supabase.com:5432/postgres
```

### How to get the correct URL:

1. Go to: Supabase Dashboard → Your Project → **Settings** → **Database**
2. Under **Connection string** section, find **Connection pooling** (Session mode)
3. Copy the URI with mode=**session**
4. Replace `[YOUR-PASSWORD]` with your actual database password

### Add/Update in Vercel:

1. Vercel → Settings → Environment Variables
2. Edit or Add `DATABASE_URL`
3. Value: The connection pooler URI from Supabase
4. Select: **Production**, **Preview**, **Development**
5. Click **Save**

### Verify other required variables:

- `NEXT_PUBLIC_SUPABASE_URL` → Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` → Supabase service role key (for image uploads)

---

## Step 4: Redeploy Vercel

After updating environment variables:

1. Go to: Vercel → **Deployments**
2. Click on latest deployment → **⋮** (3 dots) → **Redeploy**
3. Wait for deployment to complete
4. Test again: `https://arena-lab8.vercel.app/api/debug`

---

## Step 5: Verify Proposal Detail View

If proposals load but clicking them shows errors:

1. Open browser console (F12)
2. Click a proposal pin
3. Check for errors

**Common issue:** ProposalDetailPanel expecting fields that don't exist

**Fix:** Run this SQL in Supabase Studio:

```sql
-- Add missing fields to existing proposals
UPDATE proposals
SET
  summary = COALESCE(summary, LEFT(body, 200)),
  category = COALESCE(category, 'urban'),
  image_urls = COALESCE(image_urls, '{}')
WHERE summary IS NULL OR category IS NULL OR image_urls IS NULL;

-- Verify
SELECT
  id,
  title,
  summary IS NOT NULL as has_summary,
  category,
  image_urls,
  geom IS NOT NULL as has_geom
FROM proposals
LIMIT 5;
```

---

## Step 6: Test Proposal Creation

1. Go to map → Switch to **Create mode**
2. Click a building
3. Click **Finalize** → Fill form
4. Submit

**Check console logs:**
```
🚀 Creating proposal: {...}
✅ Proposal created: {...}
🔄 Refreshing map proposals...
✅ Loaded X proposals
```

**If you see errors:**
- Check `/api/debug` response for database connectivity
- Verify `DATABASE_URL` uses connection pooler (not direct connection)

---

## Step 7: Check Vercel Logs

1. Vercel Dashboard → Your Project → **Logs**
2. Filter by: **Errors**
3. Look for:
   - `P1001: Can't reach database server`
   - `Connection timeout`
   - `ECONNREFUSED`

**If you see database errors:**
- DATABASE_URL is wrong or using direct connection instead of pooler
- Supabase project is paused (check Supabase Dashboard)
- IP restrictions enabled in Supabase (Settings → Database → Network Restrictions)

---

## Common Issues & Solutions

### Issue: "Only 5 proposals showing"
**Cause:** SQL script not run or failed
**Solution:** Run `scripts/insert-spanish-proposals.sql` in Supabase Studio

### Issue: "Proposals panel takes many seconds to load"
**Cause:** Wrong DATABASE_URL (using direct connection instead of pooler)
**Solution:** Use session pooler URL in Vercel environment variables

### Issue: "New proposals not saving"
**Cause:** Database write timeout or permission issue
**Solution:**
1. Check Vercel logs for errors
2. Verify DATABASE_URL uses pooler
3. Run `/api/debug` to test connection

### Issue: "Can't see proposal details"
**Cause:** Missing fields (summary, category, imageUrls)
**Solution:** Run SQL update query in Step 5

### Issue: "Images not uploading"
**Cause:** Missing SUPABASE_SERVICE_ROLE_KEY
**Solution:**
1. Get key from Supabase Dashboard → Settings → API → service_role
2. Add to Vercel environment variables
3. Redeploy

---

## Quick Checklist

- [ ] Run `scripts/diagnose-database.sql` in Supabase Studio
- [ ] Run `scripts/insert-spanish-proposals.sql` in Supabase Studio
- [ ] Verify 20+ proposals exist in database
- [ ] Check `DATABASE_URL` uses **pooler** URL (not connect)
- [ ] Add/verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel
- [ ] Redeploy Vercel
- [ ] Test `/api/debug` endpoint
- [ ] Verify proposals load on map
- [ ] Test creating new proposal
- [ ] Test clicking proposal to see details

---

## Still Having Issues?

1. Share the output of `/api/debug`
2. Share the output of `scripts/diagnose-database.sql`
3. Share any errors from Vercel logs
4. Confirm DATABASE_URL format (first 50 characters, without password)

---

## Remove Debug Endpoint (After Fixing)

For security, delete the debug endpoint:
```bash
rm app/api/debug/route.ts
git commit -m "chore: remove debug endpoint"
git push
```
