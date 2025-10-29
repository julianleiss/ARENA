# ARENA Scripts

Utility scripts for development workflows.

## Node 20 Requirement

**IMPORTANT**: This project requires Node.js 20.x.

### Setup with nvm

```bash
# Install nvm if not already installed
# https://github.com/nvm-sh/nvm

# Use the project's Node version
nvm use

# Or install Node 20.12.2 specifically
nvm install 20.12.2
nvm use 20.12.2
```

The `.nvmrc` file in the project root specifies `v20.12.2`. Running `nvm use` will automatically switch to the correct version.

### Verify Node Version

```bash
node --version
# Should output: v20.x.x
```

### Why Node 20?

- Required by `@supabase/supabase-js` (deprecated support for Node 18)
- Required by dependencies: `marked@16.3.0`, `vite@7.1.11`
- Enforced in CI/CD pipeline
- Vercel deployment configured for Node 20.x

## Available Scripts

### seed.ts

Populates database with test data:

```bash
npm run db:seed
```

Creates:
- Test users (citizen and expert)
- POIs in Buenos Aires Núñez area
- Sample proposals

### rollback.ts

**⚠️ CAUTION:** Deletes all data from database:

```bash
npm run db:rollback
```

Respects foreign key constraints and deletes in correct order.
Use only in development when you need a clean slate.

### migrate-production.ts

Production database migration script (future use).

### fetch-buildings.js

Fetches building data from external sources.

### SQL Migration Files

- `i3-create-tables.sql` - Iteration 3 database schema
- `i4-create-tables.sql` - Iteration 4 database schema

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

**Workflow**: `.github/workflows/ci.yml`

**Runs on**:
- Every push to any branch
- Every pull request

**Steps**:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Generate Prisma client
5. Run linter
6. Type checking (`tsc --noEmit`)
7. Build project

**Node Version**: Enforced via `package.json` engines field and CI configuration.
