# RLS Fix for ARENA Database

## Problem

Supabase tables have RLS (Row Level Security) enabled but no policies configured, which blocks all queries from returning data. This causes:

- ✅ Proposals are created successfully (POST works)
- ❌ Proposals are not visible in map or sidebar (GET returns 0 rows)
- ⚠️ Supabase shows "unrestricted" warning because RLS is enabled without policies

## Solution

Apply the SQL migration in `enable_rls_public_access.sql` to:

1. Enable RLS on all tables
2. Create public read policies (SELECT)
3. Create public write policies (INSERT/UPDATE/DELETE) for demo mode

## How to Apply (Supabase Dashboard)

### Option 1: SQL Editor (Recommended)

1. Open Supabase Dashboard: https://app.supabase.com
2. Navigate to your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**
5. Copy the entire contents of `enable_rls_public_access.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Verify success:
   - Should see "Success. No rows returned" message
   - Check the verification queries at the bottom show RLS enabled

### Option 2: Table Editor

1. Go to **Table Editor** in Supabase Dashboard
2. For each table (User, Proposal, Vote, Comment, etc.):
   - Click on the table
   - Go to **Policies** tab
   - Click **Enable RLS** (if not already enabled)
   - Click **Create Policy**
   - Choose "Create policy from scratch"
   - Add policies as defined in the SQL file

### Option 3: CLI (if you have Supabase CLI)

```bash
# Make sure you're connected to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
psql $DATABASE_URL -f prisma/migrations/enable_rls_public_access.sql
```

## Verification

After applying the migration, verify it worked:

### 1. Check RLS is Enabled

In Supabase Dashboard > Table Editor:
- Each table should show a 🔒 icon
- Policies tab should show multiple policies

### 2. Test API

```bash
# Should return proposals (not empty array)
curl https://arena-lab8.vercel.app/api/proposals?status=public | jq '.'
```

### 3. Test in App

1. Create a new proposal
2. Check map → should see new pin immediately
3. Open proposals sidebar → should see proposal in list

## Security Notes

⚠️ **Current policies are VERY permissive** (public read/write for demo purposes)

In production, you should:

1. Remove public INSERT/UPDATE/DELETE policies
2. Add authentication checks:
   ```sql
   -- Example: Only authenticated users can create proposals
   CREATE POLICY "Authenticated users can create proposals"
     ON "Proposal"
     FOR INSERT
     TO authenticated
     WITH CHECK (auth.uid() IS NOT NULL);
   ```

3. Add ownership checks:
   ```sql
   -- Example: Users can only update their own proposals
   CREATE POLICY "Users can update own proposals"
     ON "Proposal"
     FOR UPDATE
     TO authenticated
     USING (author_id = auth.uid())
     WITH CHECK (author_id = auth.uid());
   ```

## Troubleshooting

### Still seeing empty results after applying migration?

1. **Check Supabase connection string**:
   - `.env.local` should have correct `DATABASE_URL`
   - Use connection pooler URL for Prisma

2. **Verify policies were created**:
   ```sql
   SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
   ```

3. **Check Prisma connection**:
   - Run `npx prisma db pull` to verify connection
   - Check Vercel logs for database errors

4. **Clear cached data**:
   - Redeploy Vercel app to clear any caches
   - Hard refresh browser (Cmd/Ctrl + Shift + R)

### "Permission denied" errors?

- Make sure you're using a service role key (not anon key) for server-side operations
- Check that policies allow the operation you're trying to perform

## Related Files

- `prisma/schema.prisma` - Database schema
- `app/api/proposals/route.ts` - API that queries proposals
- `app/lib/db.ts` - Prisma client configuration

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
