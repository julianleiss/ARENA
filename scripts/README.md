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

## API Endpoints

### GET /api/health

Health check endpoint that validates database connectivity.

**Usage**:
```bash
curl http://localhost:3000/api/health
```

**Successful Response (200)**:
```json
{
  "status": "ok",
  "database": "connected",
  "time": "2025-01-15T10:30:00.000Z"
}
```

**Error Response (500)**:
```json
{
  "status": "error",
  "error": "Connection refused"
}
```

**Implementation**:
- Executes `SELECT 1 AS ok` query to verify database connection
- Returns 200 if database responds correctly
- Returns 500 if database is unreachable or returns invalid response
- Used for monitoring deployment health in production

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
7. Run unit tests (`npm test`)
8. Build project

**Node Version**: Enforced via `package.json` engines field and CI configuration.

## Security

### Security Headers

The application sets security headers on all responses via `middleware.ts`:

- **X-Frame-Options**: `DENY` - Prevents clickjacking attacks
- **X-Content-Type-Options**: `nosniff` - Prevents MIME-type sniffing
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Permissions-Policy**: `geolocation=(), microphone=()` - Restricts feature access

Headers are applied to all routes except static assets (`_next/static`, `_next/image`, images).

### Rate Limiting

Fixed-window in-memory rate limiting protects public POST endpoints:

**Implementation**: `app/lib/rate-limit.ts`
- Fixed-window algorithm (in-memory Map)
- IP-based tracking via `x-forwarded-for` and `x-real-ip` headers
- Automatic cleanup of expired entries every 10 minutes

**Protected Endpoints**:
- `POST /api/proposals` - Create proposal (60 requests / 5 minutes)
- `POST /api/proposals/[id]/comments` - Create comment (60 requests / 5 minutes)

**Rate Limit Response (429)**:
```json
{
  "error": "Too many requests. Please try again later."
}
```
Headers: `Retry-After: <seconds>`

**Usage**:
```typescript
import { enforce } from '@/app/lib/rate-limit'

const rateLimitResult = await enforce(request, 'endpoint-key', 60, 300000)
if (!rateLimitResult.allowed) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil(rateLimitResult.retryAfterMs / 1000).toString(),
      },
    }
  )
}
```

**Limitations**:
- In-memory storage (resets on server restart)
- Not suitable for multi-instance deployments without external store (Redis)
- Sufficient for MVP and single-instance production deployments
