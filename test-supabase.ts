// Test de conexión a Supabase
// Guarda este archivo como: test-supabase.ts en la raíz de ARENA
// Ejecuta con: npx tsx test-supabase.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('🔍 Testing Supabase connection...\n')

  try {
    // Test 1: Conexión básica
    console.log('1️⃣ Connecting to database...')
    await prisma.$connect()
    console.log('✅ Connection successful!\n')

    // Test 2: Verificar tablas existentes
    console.log('2️⃣ Checking existing data...')
    
    const userCount = await prisma.user.count()
    console.log(`   Users: ${userCount}`)
    
    const proposalCount = await prisma.proposal.count()
    console.log(`   Proposals: ${proposalCount}`)
    
    const voteCount = await prisma.vote.count()
    console.log(`   Votes: ${voteCount}\n`)

    // Test 3: Crear usuario de prueba
    console.log('3️⃣ Creating test user...')
    const testUser = await prisma.user.upsert({
      where: { email: 'test@arena.com' },
      update: {},
      create: {
        email: 'test@arena.com',
        name: 'Test User',
        role: 'citizen',
      },
    })
    console.log(`✅ User created: ${testUser.id}\n`)

    // Test 4: Crear propuesta de prueba
    console.log('4️⃣ Creating test proposal...')
    const testProposal = await prisma.proposal.create({
      data: {
        title: 'Test Proposal - Connection Check',
        summary: 'This is a test proposal to verify Supabase connection',
        body: 'If you see this in Supabase Table Editor, everything is working!',
        layer: 'micro',
        category: 'urban',
        status: 'published',
        authorId: testUser.id,
        geom: {
          type: 'Point',
          coordinates: [-58.3816, -34.6037], // Buenos Aires
        },
      },
    })
    console.log(`✅ Proposal created: ${testProposal.id}\n`)

    // Test 5: Consultar propuesta
    console.log('5️⃣ Fetching test proposal...')
    const fetchedProposal = await prisma.proposal.findUnique({
      where: { id: testProposal.id },
      include: {
        author: true,
      },
    })
    console.log(`✅ Proposal fetched:`)
    console.log(`   Title: ${fetchedProposal?.title}`)
    console.log(`   Author: ${fetchedProposal?.author.name}`)
    console.log(`   Status: ${fetchedProposal?.status}\n`)

    console.log('🎉 ALL TESTS PASSED!')
    console.log('\n📊 Next steps:')
    console.log('   1. Check Supabase Table Editor to see the test data')
    console.log('   2. Update Vercel environment variables')
    console.log('   3. Deploy and test in production')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
