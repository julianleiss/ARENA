// ARENA - Health Endpoint Unit Test
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/health/route'

// Mock Prisma client
vi.mock('@/app/lib/db', () => ({
  default: {
    $queryRaw: vi.fn(),
  },
}))

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with connected status when database is accessible', async () => {
    const prisma = await import('@/app/lib/db')

    // Mock successful database query
    vi.mocked(prisma.default.$queryRaw).mockResolvedValue([{ ok: 1 }])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.database).toBe('connected')
    expect(data.time).toBeDefined()
    expect(typeof data.time).toBe('string')
  })

  it('should return 500 with error status when database connection fails', async () => {
    const prisma = await import('@/app/lib/db')

    // Mock database connection failure
    vi.mocked(prisma.default.$queryRaw).mockRejectedValue(new Error('Connection refused'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.status).toBe('error')
    expect(data.error).toBeDefined()
  })

  it('should return 500 when database returns invalid response', async () => {
    const prisma = await import('@/app/lib/db')

    // Mock invalid database response
    vi.mocked(prisma.default.$queryRaw).mockResolvedValue([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.status).toBe('error')
    expect(data.error).toContain('Invalid database response')
  })
})
