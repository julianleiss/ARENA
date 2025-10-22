// ARENA V1.0 - Database Seeder
// Populate database with initial test data

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test users
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@arena.test' },
    update: {},
    create: {
      email: 'citizen@arena.test',
      name: 'María González',
      role: 'citizen',
    },
  })

  const expert = await prisma.user.upsert({
    where: { email: 'expert@arena.test' },
    update: {},
    create: {
      email: 'expert@arena.test',
      name: 'Juan Arquitecto',
      role: 'expert',
    },
  })

  console.log('✅ Created users:', { citizen: citizen.email, expert: expert.email })

  // Create sample POIs in Buenos Aires (Núñez area)
  const pois = [
    {
      name: 'Plaza Balcarce',
      type: 'espacio_verde',
      geom: { type: 'Point', coordinates: [-58.4583, -34.5447] },
      address: 'Av. del Libertador 7800',
      source: 'manual',
    },
    {
      name: 'Hospital Rivadavia',
      type: 'salud',
      geom: { type: 'Point', coordinates: [-58.4520, -34.5460] },
      address: 'Av. Las Heras 2670',
      source: 'manual',
    },
    {
      name: 'Escuela Primaria Común N° 12',
      type: 'educacion',
      geom: { type: 'Point', coordinates: [-58.4600, -34.5470] },
      address: 'Cabildo 3500',
      source: 'manual',
    },
    {
      name: 'Estación Núñez',
      type: 'transporte',
      geom: { type: 'Point', coordinates: [-58.4650, -34.5420] },
      address: 'Av. del Libertador 8000',
      source: 'manual',
    },
  ]

  for (const poi of pois) {
    await prisma.pOI.upsert({
      where: { id: poi.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: poi,
    })
  }

  console.log(`✅ Created ${pois.length} POIs`)

  // Create sample proposal
  const proposal = await prisma.proposal.create({
    data: {
      authorId: expert.id,
      title: 'Corredor Verde Av. del Libertador',
      summary: 'Propuesta para crear un corredor verde con ciclovía protegida en Av. del Libertador entre Congreso y La Pampa.',
      body: 'Esta propuesta busca mejorar la conectividad peatonal y ciclista mediante la creación de un corredor verde arbolado con bicisenda protegida, ampliación de veredas y nuevos espacios de permanencia.',
      geom: {
        type: 'LineString',
        coordinates: [
          [-58.4650, -34.5420],
          [-58.4583, -34.5447],
        ],
      },
      layer: 'meso',
      status: 'public',
      tags: ['movilidad', 'espacio-publico', 'verde'],
    },
  })

  console.log('✅ Created sample proposal:', proposal.title)

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      userId: expert.id,
      action: 'create_proposal',
      entity: 'proposal',
      entityId: proposal.id,
      metadata: {
        title: proposal.title,
        status: proposal.status,
      },
    },
  })

  console.log('✅ Created audit log entry')

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
