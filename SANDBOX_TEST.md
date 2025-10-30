# 3D Sandbox - Testing Instructions

## Database Issue
The database schema is currently out of sync - the Prisma schema has `description` field but the API expects `geom`, `summary`, `body`, `layer`, `tags`, etc.

## How to Test the Sandbox NOW

Since the database is not working, you can test the 3D Sandbox with mock data by accessing this URL directly:

### Option 1: Use Mock Proposal (Recommended for Testing)

Visit: `http://localhost:3000/sandbox/test-mock-123`

The sandbox will:
1. Try to fetch the proposal (will fail gracefully)
2. Fall back to default coordinates: Buenos Aires Núñez (-58.46, -34.545)
3. Load 3D buildings from OSM around those coordinates
4. Display the 3D canvas with buildings

### Option 2: Fix the Database Schema

To make proposals work properly, the Prisma schema needs to be updated to match what the API expects:

```prisma
model Proposal {
  id          String   @id @default(cuid())
  title       String
  summary     String?  @db.Text  // ADD THIS
  body        String?  @db.Text  // ADD THIS
  description String   @db.Text   // Keep for backwards compatibility
  geom        Json?              // ADD THIS - GeoJSON geometry
  layer       String   @default("micro")  // ADD THIS - micro/meso/macro
  tags        String[]  @default([])      // ADD THIS
  status      String   @default("published")
  authorId    String   @map("author_id")

  // OSM feature data
  osmType     String?  @map("osm_type")     // ADD THIS
  osmId       String?  @map("osm_id")       // ADD THIS
  osmTags     Json?    @map("osm_tags")     // ADD THIS
  featureName String?  @map("feature_name") // ADD THIS

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  author   User              @relation(fields: [authorId], references: [id], onDelete: Cascade)
  votes    Vote[]
  comments Comment[]
  metrics  Metric[]
  versions ProposalVersion[]
  preview  ProposalPreview?

  @@index([authorId])
  @@index([status])
  @@map("proposals")
}
```

Then run:
```bash
npx prisma db push
npx prisma generate
```

## What the Sandbox Will Show

When it loads, you'll see:
- ✅ 3D Google Maps centered on Buenos Aires
- ✅ Gray 3D buildings fetched from OSM
- ✅ Yellow highlight for proposal area (if proposal has geom)
- ✅ Stats overlay showing building count
- ✅ Controls help (drag, scroll, ctrl+drag, shift+drag)
- ✅ Loading spinner while fetching buildings
- ✅ Error messages if anything fails

## Current Implementation Status

All sandbox features are **fully implemented**:
- ✅ Dynamic route /sandbox/[id]
- ✅ 3D canvas with deck.gl + Google Maps
- ✅ OSM building data fetching
- ✅ 3D building extrusion
- ✅ Proposal area highlighting
- ✅ Ambient + directional lighting
- ✅ Dark-themed UI layout
- ✅ Loading & error states

**Blocked by**: Database schema mismatch - proposals cannot be created until schema is fixed.
