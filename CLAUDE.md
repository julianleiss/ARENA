# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ARENA V1.0 is a civic engagement platform for urban transformations. It's a Next.js 15 application that allows citizens to create, view, and participate in urban development proposals with geospatial visualization.

Current version: **v0.101** (Scene Viewer with MapLibre integration)

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
2. Fill in Supabase credentials from your project dashboard
3. Run `npm run db:generate && npm run db:push && npm run db:seed`

## Architecture

### Database Layer (Prisma + Supabase PostgreSQL)
- **Location**: `prisma/schema.prisma`
- **Core Models**:
  - `User`: Citizens and experts with role-based access
  - `Proposal`: Urban transformation proposals with geospatial data (GeoJSON)
  - `Vote`: Voting mechanism with origin tracking (web/mobile)
  - `Comment`: Threaded discussions on proposals
  - `Metric`: Quantitative metrics for proposals (pedestrian count, noise levels, etc.)
  - `POI`: Points of Interest (parks, hospitals, schools, transit)
  - `AuditLog`: Action tracking for governance and transparency

- **Key Patterns**:
  - Proposals have a `layer` field ("micro", "meso", "macro") for scale classification
  - All geographic data stored as JSON (GeoJSON format) in `geom` fields
  - Cascade deletes configured for data integrity
  - Snake_case for database columns, mapped via `@map()` directives

### API Routes (Next.js App Router)
- **Location**: `app/api/`
- **Endpoints**:
  - `/api/health` - System health check with database connectivity test
  - `/api/pois` - GET POIs for map rendering
  - `/api/proposals` - CRUD operations for proposals
  - `/api/proposals/[id]` - Single proposal operations

### Frontend Components
- **Location**: `app/components/`
- **MapView Component** (`MapView.tsx`):
  - Uses MapLibre GL for basemap rendering
  - Fetches POIs from `/api/pois` and renders as custom markers
  - POI styling by type (green=parks, red=health, blue=education, orange=transit)
  - Centered on Buenos Aires Núñez area (-58.46, -34.545)
  - Uses CartoDB Positron basemap style

- **ProposalCard Component**: Display proposals in card format

### Shared Libraries
- **Location**: `app/lib/`
- **db.ts**: Singleton Prisma client with hot reload protection
  - Logs queries in development, errors only in production
  - Prevents multiple client instances during Next.js hot reloading
- **auth.ts**: Supabase authentication helpers
  - Magic link sign-in flow
  - User session management
  - **Note**: Auth integration is scaffolded but not fully implemented in UI yet

### Scripts
- **seed.ts**: Creates test users, POIs in Buenos Aires (Núñez area), and sample proposal
- **rollback.ts**: Deletes all data in correct order respecting foreign key constraints

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
- Test POIs in Buenos Aires Núñez neighborhood
- Sample proposal: "Corredor Verde Av. del Libertador" (green corridor with bike lane)

## Testing Approach

- **Unit tests**: Vitest (not yet configured)
- **E2E tests**: Playwright (not yet configured)
- **Manual testing**: Use `/api/health` to verify deployment and DB connectivity

## Version Roadmap

- **v0.100**: ✅ Setup + Deploy (health endpoint, Prisma schema, seed data)
- **v0.101**: ✅ Scene Viewer (MapLibre + POI rendering) - CURRENT
- **v0.102**: Proposals CRUD (create/read/update/delete proposals)
- **v0.103**: Participation (comments + votes)
- **v0.104**: Metrics + Gates (approval thresholds)
- **v0.105**: Demo Script + E2E Tests

## Common Gotchas

1. **Prisma Client**: Always regenerate after schema changes (`npm run db:generate`)
2. **Environment Variables**: Next.js requires `NEXT_PUBLIC_` prefix for client-side vars
3. **MapLibre Coordinates**: [longitude, latitude] order (not lat/lng)
4. **Database Connection**: Supabase uses connection pooling; connection string must use pooler endpoint
5. **Client Components**: MapView must be 'use client' due to MapLibre browser APIs
