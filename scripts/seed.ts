// ARENA - Database Seeder (iteration 1 - proposals)
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database (iteration 1)...')

  // Insert 5 proposals with authorId="demo"
  const proposals = [
    {
      id: 'prop-1',
      title: 'New Community Park in Downtown',
      description: 'Proposal to transform the vacant lot on Main Street into a vibrant community park with playgrounds, walking paths, and green spaces for residents to enjoy.',
      status: 'public',
      authorId: 'demo',
    },
    {
      id: 'prop-2',
      title: 'Bike Lane Expansion Project',
      description: 'Expand the existing bike lane network by adding 15 miles of protected bike lanes connecting residential areas to commercial districts and public transit hubs.',
      status: 'public',
      authorId: 'demo',
    },
    {
      id: 'prop-3',
      title: 'Public Library Renovation',
      description: 'Renovate and modernize the central public library with updated technology, expanded study spaces, and improved accessibility features for all community members.',
      status: 'public',
      authorId: 'demo',
    },
    {
      id: 'prop-4',
      title: 'Urban Garden Initiative',
      description: 'Create 10 community urban gardens throughout the city to promote local food production, environmental education, and neighborhood gathering spaces.',
      status: 'draft',
      authorId: 'demo',
    },
    {
      id: 'prop-5',
      title: 'Street Lighting Upgrade',
      description: 'Replace outdated street lighting with energy-efficient LED fixtures to improve public safety, reduce energy costs, and minimize light pollution.',
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
