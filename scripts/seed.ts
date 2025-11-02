// ARENA - Database Seeder (iteration 1 - proposals)
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database (iteration 1)...')

  // Insert 5 proposals with authorId="demo" with full geospatial data
  const proposals = [
    {
      id: 'prop-1',
      title: 'New Community Park in Downtown',
      description: 'Proposal to transform the vacant lot on Main Street into a vibrant community park with playgrounds, walking paths, and green spaces for residents to enjoy.',
      summary: 'Transform vacant lot into vibrant community park',
      body: 'Detailed proposal to create a new community park featuring playgrounds for children, walking paths for exercise, green spaces for relaxation, and community gathering areas.',
      geom: { type: 'Polygon', coordinates: [[[-58.45, -34.54], [-58.45, -34.55], [-58.44, -34.55], [-58.44, -34.54], [-58.45, -34.54]]] },
      layer: 'meso',
      tags: ['parks', 'community', 'green-space'],
      status: 'public',
      authorId: 'demo',
    },
    {
      id: 'prop-2',
      title: 'Bike Lane Expansion Project',
      description: 'Expand the existing bike lane network by adding 15 miles of protected bike lanes connecting residential areas to commercial districts and public transit hubs.',
      summary: 'Expand bike lane network throughout the city',
      body: 'Comprehensive bike lane expansion adding 15 miles of protected lanes connecting key areas of the city.',
      geom: { type: 'LineString', coordinates: [[-58.46, -34.54], [-58.46, -34.56], [-58.45, -34.57]] },
      layer: 'macro',
      tags: ['mobility', 'cycling', 'infrastructure'],
      status: 'public',
      authorId: 'demo',
    },
    {
      id: 'prop-3',
      title: 'Public Library Renovation',
      description: 'Renovate and modernize the central public library with updated technology, expanded study spaces, and improved accessibility features for all community members.',
      summary: 'Modernize central library with new technology',
      body: 'Complete renovation of the public library including new computers, expanded study areas, and accessibility improvements.',
      geom: { type: 'Point', coordinates: [-58.455, -34.548] },
      layer: 'micro',
      tags: ['education', 'community', 'accessibility'],
      status: 'public',
      authorId: 'demo',
    },
    {
      id: 'prop-4',
      title: 'Urban Garden Initiative',
      description: 'Create 10 community urban gardens throughout the city to promote local food production, environmental education, and neighborhood gathering spaces.',
      summary: 'Create network of community urban gardens',
      body: 'Establish 10 urban gardens across different neighborhoods for local food production and community education.',
      geom: { type: 'MultiPoint', coordinates: [[-58.45, -34.54], [-58.46, -34.55], [-58.44, -34.56]] },
      layer: 'meso',
      tags: ['sustainability', 'food', 'community'],
      status: 'draft',
      authorId: 'demo',
    },
    {
      id: 'prop-5',
      title: 'Street Lighting Upgrade',
      description: 'Replace outdated street lighting with energy-efficient LED fixtures to improve public safety, reduce energy costs, and minimize light pollution.',
      summary: 'Upgrade to energy-efficient LED street lighting',
      body: 'City-wide replacement of old street lights with modern LED fixtures for better safety and energy savings.',
      geom: { type: 'LineString', coordinates: [[-58.47, -34.54], [-58.47, -34.55]] },
      layer: 'macro',
      tags: ['infrastructure', 'energy', 'safety'],
      status: 'public',
      authorId: 'demo',
    },
  ]

  for (const proposal of proposals) {
    await prisma.proposal.upsert({
      where: { id: proposal.id },
      update: proposal, // Update with all fields if record exists
      create: proposal,
    })
  }

  console.log(`✅ Created ${proposals.length} proposals`)
  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
