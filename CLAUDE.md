# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ARENA V1.0 is a civic engagement platform for urban transformations. It's a Next.js 15 application that allows citizens to create, view, and participate in urban development proposals with geospatial visualization and 2.5D prefab-based urban planning.

Current version: **v1.1.0** (Iterations i1-i4 complete: Publish System + Prefabs + 2.5D Rendering)

## Development Commands

### Core Development
```bash
npm run dev              # Start development server at localhost:3000
npm run build            # Build for production
npm start                # Run production build
npm run lint             # Run ESLint
```

### Database Management (Prisma + Supabase)
```bash
npm run db:generate      # Generate Prisma client (run after schema changes)
npm run db:push          # Push schema changes to Supabase database
npm run db:studio        # Open Prisma Studio GUI for database inspection
npm run db:seed          # Populate database with test data
npm run db:rollback      # Clear ALL database data (use with caution)
```

### Testing
```bash
npm test                 # Run unit tests with Vitest
npm run test:e2e         # Run end-to-end tests with Playwright
```

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Fill in required credentials:
   - `DATABASE_URL`: Supabase PostgreSQL connection string
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: **REQUIRED for image uploads** (Supabase service role key)
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key
3. Run `npm run db:generate && npm run db:push && npm run db:seed`

**Important**: Image upload functionality requires `SUPABASE_SERVICE_ROLE_KEY`. Without this key, users won't be able to upload images to proposals. The key is found in: Supabase Dashboard → Settings → API → service_role

## Architecture

### Database Layer (Prisma + Supabase PostgreSQL)
- **Location**: `prisma/schema.prisma`
- **Core Models**:
  - `User`: Citizens and experts with role-based access
  - `Proposal`: Urban transformation proposals with metadata (title, description, status)
  - `ProposalVersion` *(i4)*: Version tracking for sandbox snapshots linked to proposals
  - `ProposalPreview` *(i4)*: Simplified geometry snapshots for list views (FeatureCollection, mask polygon)
  - `Sandbox` *(i2-i4)*: Urban planning workspaces with polygon boundary geometry
  - `Asset` *(i3)*: Prefab library (8 types: Casa, Torre, Bloque, Plaza, Árbol, Farola, Edificio Alto, Kiosko)
  - `Instance` *(i3)*: Placed prefabs in sandboxes with geom (Point/Line/Polygon), params (floors, height), transform (scale, rotation)
  - `Vote`: Voting mechanism with origin tracking (web/mobile) - API exists, UI not integrated
  - `Comment`: Threaded discussions on proposals - API exists, UI not integrated
  - `Metric`: Quantitative metrics for proposals - schema exists, no implementation
  - `POI`: Points of Interest (parks, hospitals, schools, transit)
  - `AuditLog`: Action tracking for governance and transparency

- **Key Patterns**:
  - All geographic data stored as JSON (GeoJSON format) in `geom` fields
  - Cascade deletes configured for data integrity (Instance → Sandbox, ProposalVersion → Proposal)
  - Snake_case for database columns, mapped via `@map()` directives
  - **Prefab System**: Assets define defaults, Instances store actual placements with overridden params
  - **Version Tracking**: ProposalVersion links sandbox snapshots to proposals with hash and timestamp
  - **Graceful Degradation**: API routes fallback to mock data when DB is unreachable

### API Routes (Next.js App Router)
- **Location**: `app/api/`
- **Endpoints**:
  - `/api/health` - System health check with database connectivity test
  - `/api/pois` - GET POIs for map rendering
  - `/api/proposals` - CRUD operations for proposals
  - `/api/proposals/[id]` - Single proposal operations

### Frontend Components
- **Location**: `app/components/`
- **Main Pages**:
  - `/` - **MapPage**: Google Maps with DeckGL overlay for 3D building rendering
    - Multi-select buildings (Ctrl+click)
    - Point selection with radius (1-100m slider)
    - Polygon drawing (3+ points)
    - Proposal creation flow via ProposalFormModal
    - ProposalsPanel sidebar for browsing proposals
    - Loads 808KB building dataset (`ba-buildings.json`)
    - 2D/3D toggle with 67.5° tilt for 3D view
  - `/proposals` - Server component listing last 20 proposals
  - `/proposals/[id]` - Server component for proposal detail view
  - `/sandbox/[id]` *(i2-i4)* - **Sandbox Editor**: Interactive 2.5D urban planning workspace
    - MapLibre GL base map with DeckGL overlay
    - **PrefabPalette** (left sidebar): 8 asset types (buildings, trees, lamps, etc.)
    - **Inspector** (right panel): Edit instance params (floors, height, scale, rotation)
    - **SandboxLayer**: DeckGL GeoJsonLayer with extrusion for 2.5D rendering
    - Place/Edit/Delete modes for instances
    - Real-time CRUD via server actions
    - Publish to Proposal workflow *(i4)*

- **Key Client Components**:
  - `MapView.tsx`: Google Maps + DeckGL 3D buildings layer
  - `SandboxClient.tsx`: Orchestrates sandbox editor UI
  - `PrefabPalette.tsx`: Asset selection sidebar
  - `Inspector.tsx`: Instance parameter editing panel
  - `SandboxLayer.tsx`: DeckGL layer for 2.5D prefab rendering
  - `ProposalFormModal.tsx`: Proposal creation form
  - `ProposalsPanel.tsx`: Sidebar for browsing proposals

- **Server Components**:
  - `ProposalCard.tsx`: Display proposals in card format
  - `CommentsList.tsx`, `VoteButton.tsx`: Scaffolded but not wired to UI

### Shared Libraries
- **Location**: `app/lib/`
- **db.ts**: Singleton Prisma client with hot reload protection and connection pooling
  - Logs queries in development, errors only in production
  - Prevents multiple client instances during Next.js hot reloading
  - Configured with datasource URL for explicit connection handling
- **rate-limit.ts**: Fixed-window in-memory rate limiter (60 req/5min for proposals)
  - **Note**: Resets on serverless cold starts
- **zod-geo.ts**: GeoJSON validation schemas (Point, LineString, Polygon, MultiPoint)
- **mock-data.ts**: Mock proposals and POIs for offline development/demo
- **supabase-client.ts**: Supabase REST API client
- **auth.ts**: Supabase authentication helpers
  - Magic link sign-in flow
  - User session management
  - **Note**: Auth scaffolded but NOT active - currently using temp users with nanoid
- **i18n/es.ts**: Spanish translations (not yet integrated)
- **utils/timeAgo.ts**: Relative time formatting (Spanish locale)

### Scripts
- **seed.ts**: Creates test users, POIs in Buenos Aires (Núñez area), sample proposal, and 8 prefab assets
  - Uses upsert (updates existing data)
- **rollback.ts**: Deletes all data in correct order respecting foreign key constraints
- **i3-create-tables.sql**: SQL for Asset and Instance tables
- **i4-create-tables.sql**: SQL for ProposalVersion and ProposalPreview tables

## Important Conventions

### Path Aliases
- Use `@/` prefix for all imports (maps to project root via tsconfig.json)
- Example: `import prisma from '@/app/lib/db'`

### GeoJSON Storage
- All geographic data stored as JSON in Prisma
- Standard GeoJSON format: `{ type: "Point", coordinates: [lng, lat] }`
- **Coordinate order**: Always longitude first, then latitude (GeoJSON standard)

### API Response Patterns
- Health check returns 200 for healthy, 503 for errors
- Development mode allows bypassed DB checks (`local-bypass` status)
- All API routes use Next.js App Router convention (route.ts files)

### Data Seeding
- Test users: `citizen@arena.test` and `expert@arena.test`
- Test POIs in Buenos Aires Núñez neighborhood (4 POIs)
- Sample proposal: "Corredor Verde Av. del Libertador" (green corridor with bike lane)
- 8 prefab assets: Casa, Torre, Bloque, Plaza, Árbol, Farola, Edificio Alto, Kiosko
- Building dataset: `public/data/ba-buildings.json` (808KB GeoJSON)

## Testing Approach

- **Unit tests**: Not yet configured (Vitest installed but 0 tests written)
- **E2E tests**: Not yet configured (Playwright installed but 0 tests written)
- **Manual testing**: Use dev server and browser DevTools

## Version History & Roadmap

### Completed (v1.1.0)
- **i1**: ✅ Basic setup (Next.js 15, Prisma, Supabase, initial schema)
- **i2**: ✅ Sandbox Lite (hardcoded polygon creation, redirect to editor)
- **i3**: ✅ Prefabs & 2.5D (Asset/Instance models, PrefabPalette, DeckGL extrusion, Inspector)
- **i4**: ✅ Publish System (ProposalVersion, ProposalPreview, sandbox→proposal export)

### Current Iteration
- **CURRENT**: Bug fixes, documentation updates, database connection improvements

### Planned
- **Future**: Real authentication (replace temp users), Comments/Votes UI integration, E2E tests, pagination, search/filter

## Technology Stack

### Core Framework
- **Next.js 15.5.6** - App Router with Server/Client components
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5.x** - Type safety throughout

### Database & ORM
- **Prisma 6.17.1** - Type-safe database ORM
- **Supabase PostgreSQL** - Hosted database with connection pooling
- **PostgreSQL** - Relational database with JSON support for GeoJSON

### Map & Visualization
- **Google Maps API** (`@vis.gl/react-google-maps 1.5.5`) - Base map rendering
- **DeckGL 9.2.2** - WebGL-powered 3D/2.5D data visualization layers
- **MapLibre GL 5.9.0** - Open-source map rendering (used in sandbox editor)

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library

### Validation & Data
- **Zod 4.1.12** - Runtime schema validation (including GeoJSON schemas)
- **nanoid** - Temporary user ID generation

### Development Tools
- **Vitest** - Unit testing framework (not yet configured)
- **Playwright** - E2E testing framework (not yet configured)
- **ESLint** - Code linting

## Troubleshooting

### Database Connection Timeouts
If you see "DB timeout" errors or APIs returning mock/empty data:

1. **Check DATABASE_URL is configured**:
   ```bash
   # In .env.local (create from .env.example)
   DATABASE_URL="postgresql://..."
   ```

2. **For local development, use DIRECT connection**:
   ```
   DATABASE_URL="postgresql://postgres.PROJECT:PASSWORD@aws-1-us-east-1.connect.supabase.com:5432/postgres?pgbouncer=true&connection_limit=10&pool_timeout=30"
   ```

3. **For production (Vercel), use SESSION POOLER**:
   ```
   DATABASE_URL="postgresql://postgres.PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
   ```

4. **Test connection**:
   ```bash
   npm run db:studio  # Opens Prisma Studio - if this works, DB connection is OK
   ```

5. **Verify Supabase project**:
   - Check project is not paused in Supabase dashboard
   - Verify IP allowlist if configured
   - Check database credentials are correct

6. **Check API timeouts**: Currently set to 30s in `/api/proposals` and `/api/pois`

### Dev Server Port Issues
If port 3000 is occupied, the dev server will run on 3010 or next available port. Update `NEXT_PUBLIC_APP_URL` in `.env.local` if needed.

### Mock Data in Production
Mock data fallbacks only activate in `NODE_ENV=development`. In production, DB failures will return errors.

## Common Gotchas

1. **Prisma Client**: Always regenerate after schema changes (`npm run db:generate`)
2. **Environment Variables**:
   - Next.js requires `NEXT_PUBLIC_` prefix for client-side vars
   - Copy `.env.example` to `.env.local` and fill in actual values
   - **CRITICAL**: DATABASE_URL must be configured or all DB queries will timeout
3. **Database Connection**:
   - For **local development**: Use DIRECT connection string (not pooler)
   - For **Vercel/production**: Use SESSION POOLER connection string
   - Connection format in `.env.example` includes pool timeout and connection limits
   - API routes have 30-second timeout (increased from 3-5s to handle cold starts)
4. **GeoJSON Coordinates**: [longitude, latitude] order (not lat/lng) - GeoJSON standard
5. **Client Components**: Map components must be 'use client' due to browser APIs (Google Maps, MapLibre, DeckGL)
6. **Development Server**: May run on port 3010 if 3000 is occupied
7. **Mock Data Fallback**: POIs and Proposals APIs return mock data if DB is unreachable (development mode only)
8. **Temp Users**: Currently using nanoid-based temporary users - real auth is scaffolded but not active
9. **Building Data**: 808KB JSON loaded on map page - consider lazy loading for production
10. **Rate Limiting**: In-memory rate limiter resets on serverless cold starts
