# Deploy to Production - Step by Step

## Current Situation
- Your code changes are in branch: `claude/resolve-git-divergence-011CUjzRL7NTRq3bGsNEETD9`
- Vercel is deploying from: `main` branch
- Result: New code (including `/api/debug`) is not live

## Solution: Merge to Main

Follow these steps exactly:

### Step 1: Check Current Branch
```bash
git branch
```

You should see a `*` next to `claude/resolve-git-divergence-011CUjzRL7NTRq3bGsNEETD9`

### Step 2: Switch to Main
```bash
git checkout main
```

### Step 3: Pull Latest Main
```bash
git pull origin main
```

### Step 4: Merge Feature Branch
```bash
git merge claude/resolve-git-divergence-011CUjzRL7NTRq3bGsNEETD9
```

**Expected output:** `Fast-forward` (no conflicts)

If you see conflicts:
```bash
# Abort the merge
git merge --abort

# Contact developer for help
```

### Step 5: Push to Main
```bash
git push origin main
```

### Step 6: Wait for Vercel Deploy
1. Go to: https://vercel.com/dashboard
2. Go to your project
3. Click: **Deployments**
4. Wait for the new deployment to finish (1-2 minutes)
5. Status should show: ✅ **Ready**

### Step 7: Verify Deploy
Open in browser:
```
https://arena-lab8.vercel.app/api/debug
```

**Expected result:**
```json
{
  "overall_status": "✅ All checks passed",
  "checks": {
    "database_connection": "✅ Connected",
    "proposal_count": "✅ 25 proposals"
  }
}
```

---

## If You Don't Have Git Locally

### Alternative: Use Vercel Dashboard

1. Go to: Vercel Dashboard → Settings → Git
2. Under **Production Branch**, change from `main` to:
   ```
   claude/resolve-git-divergence-011CUjzRL7NTRq3bGsNEETD9
   ```
3. Click **Save**
4. Go to: Deployments
5. Click **Create Deployment**
6. Wait for deployment to complete

---

## After Deployment

Test these URLs:
- ✅ `/api/debug` - Should return JSON (not 404)
- ✅ Map page - Should show 25 purple pins
- ✅ Create proposal - Should save and appear immediately
- ✅ Click pin - Should show proposal details

---

## Summary of Changes Being Deployed

Commits included in this merge:
- `077b6e7` - Diagnostic tools and troubleshooting guide
- `7933732` - Image upload to map form + SQL script
- `ad47f7e` - 20 Spanish proposals and documentation
- `4bd6601` - Remove status filter from MapView
- `4c7eb6d` - Add geom field to published proposals
- `5721899` - Categories & Images system

Total: 6 commits, 900+ lines added

---

## Rollback (If Something Breaks)

If you need to undo:

```bash
git checkout main
git reset --hard origin/main~6
git push origin main --force
```

⚠️ **Only do this if absolutely necessary!**
