# ARENA — Sandbox Lite + Proposals

Civic engagement platform for urban transformations. Next.js 15 + React 19 + Tailwind 4 + Prisma 6 + Supabase PostgreSQL + Server Actions.

## Features

- ✅ **Sandbox Lite (i2)** - Area selection and sandbox creation workflow
- ✅ **Proposals CRUD** - Create, read, update, delete proposals
- ✅ **Server Components** - Fast, SEO-friendly pages
- ✅ **Server Actions** - Type-safe mutations with Zod validation
- ✅ **GeoJSON Validation** - Zod schemas for geographic data
- ✅ **Database Seeding** - Quick setup with test data

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# 3. Generate Prisma client and push schema
npm run db:generate
npm run db:push

# 4. Seed database with 5 test proposals
npm run db:seed

# 5. Run development server
npm run dev
```

Open [http://localhost:3000/proposals](http://localhost:3000/proposals) to view proposals.

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint

### Database
- `npm run db:generate` - Generate Prisma client (run after schema changes)
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:seed` - Populate database with 5 test proposals
- `npm run db:rollback` - Clear all database data (use with caution)

### Testing
- `npm test` - Run unit tests (Vitest)
- `npm test:e2e` - Run E2E tests (Playwright)

## Pages

- `/map` - Map page with sandbox creation test button
- `/sandbox/[id]` - Sandbox detail page with polygon info and side panel
- `/proposals` - List of all proposals (last 20, with create form in development)
- `/proposals/[id]` - Proposal detail page with full description and timestamps

## Manual Testing

### Sandbox Flow (i2-lite)
1. Visit `/map` - Map placeholder with test button
2. Click "Create Test Sandbox" - Creates sandbox with hardcoded polygon (Núñez area)
3. Redirects to `/sandbox/{id}` - Shows sandbox detail with:
   - Left: Map placeholder for polygon visualization
   - Right: Side panel with status badge, polygon info (point count), metadata, and publish button

### Proposals Flow
1. Visit `/proposals` - Should show 5 seeded proposals
2. Click "+ Create New Proposal" - Form appears (development only)
3. Fill form and submit - New proposal appears in list
4. Click any proposal - Detail page shows full information

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **Database**: Supabase PostgreSQL (via REST API + Prisma 6 schema)
- **Validation**: Zod (including GeoJSON schemas)
- **Type Safety**: TypeScript (strict mode)

## Database Schema

```prisma
model Sandbox {
  id        String   @id @default(cuid())
  geometry  Json     // GeoJSON Polygon
  status    String   @default("draft") // "draft" | "published"
  createdAt DateTime @default(now())
}

model Proposal {
  id          String   @id @default(cuid())
  title       String
  description String   @db.Text
  status      String   @default("published") // "draft" | "published"
  authorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Project Structure

```
├── app/
│   ├── (public)/
│   │   ├── map/
│   │   │   ├── page.tsx              # Map page with test button
│   │   │   ├── _actions/
│   │   │   │   └── createSandbox.ts  # Create sandbox action
│   │   │   └── _components/
│   │   │       └── SandboxTest.tsx   # Test button component
│   │   └── proposals/
│   │       ├── page.tsx              # List page (server)
│   │       ├── [id]/
│   │       │   └── page.tsx          # Detail page (server)
│   │       ├── _actions/
│   │       │   └── create.ts         # Create action (server)
│   │       └── _components/
│   │           └── CreateProposalForm.tsx  # Form (client)
│   ├── (creator)/
│   │   └── sandbox/
│   │       └── [id]/
│   │           └── page.tsx          # Sandbox detail page
│   └── lib/
│       ├── db.ts                     # Prisma client
│       ├── supabase-client.ts        # Supabase REST client
│       └── zod-geo.ts                # GeoJSON validation schemas
├── prisma/
│   └── schema.prisma                 # Database schema
└── scripts/
    ├── seed.ts                       # Seed 5 proposals
    └── rollback.ts                   # Clear database
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Zod Validation](https://zod.dev)
