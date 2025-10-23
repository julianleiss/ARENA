# ARENA — Bootstrap

Civic engagement platform for urban transformations. Next.js 15 + React 19 + Tailwind 4 + Prisma 6 + Supabase + deck.gl 9.2 + MapLibre.

## Requisitos

- **Node 20 LTS** (see `.nvmrc`)
- **pnpm** (or npm)
- **PostgreSQL/Supabase** with `DATABASE_URL`

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and other credentials

# 3. Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# 4. (Optional) Seed database
pnpm db:seed

# 5. Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

### Development
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Run production build
- `pnpm lint` - Run ESLint

### Database
- `pnpm db:generate` - Generate Prisma client (run after schema changes)
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Prisma Studio GUI
- `pnpm db:seed` - Populate database with test data
- `pnpm db:rollback` - Clear all database data (use with caution)

### Testing
- `pnpm test` - Run unit tests (Vitest)
- `pnpm test:e2e` - Run E2E tests (Playwright)

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key for map visualization
- `NEXT_PUBLIC_SUPABASE_URL` - (Optional) Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - (Optional) Supabase anonymous key

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **Database**: PostgreSQL (Prisma 6 ORM)
- **Maps**: deck.gl 9.2 + Google Maps + MapLibre GL
- **Testing**: Vitest + Playwright
- **Type Safety**: TypeScript (strict mode)

## Project Structure

```
├── app/              # Next.js app router pages & components
├── prisma/           # Database schema & migrations
├── scripts/          # Database seed/rollback scripts
├── public/           # Static assets
└── src/              # Shared utilities & libraries
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [deck.gl Documentation](https://deck.gl)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
