// ARENA - Rate Limiting
// Fixed-window in-memory rate limiter

interface RateLimitRecord {
  count: number
  resetAt: number
}

// In-memory store: Map<key, RateLimitRecord>
const store = new Map<string, RateLimitRecord>()

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) {
      store.delete(key)
    }
  }
}, 10 * 60 * 1000)

/**
 * Rate limiter using fixed window algorithm
 *
 * @param req - Next.js Request object
 * @param key - Unique identifier for the rate limit (e.g., 'proposals', 'comments')
 * @param limit - Maximum number of requests allowed in the window (default: 60)
 * @param windowMs - Time window in milliseconds (default: 300000 = 5 minutes)
 * @returns Object with allowed status and retry delay
 */
export async function enforce(
  req: Request,
  key: string,
  limit: number = 60,
  windowMs: number = 300000
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  // Extract IP address
  const ip = getIpAddress(req)

  // Create unique key for this IP + endpoint
  const rateLimitKey = `${ip}:${key}`

  const now = Date.now()
  const record = store.get(rateLimitKey)

  // No record or window expired - create new record
  if (!record || now > record.resetAt) {
    store.set(rateLimitKey, {
      count: 1,
      resetAt: now + windowMs,
    })
    return { allowed: true, retryAfterMs: 0 }
  }

  // Within window - check limit
  if (record.count < limit) {
    record.count++
    return { allowed: true, retryAfterMs: 0 }
  }

  // Limit exceeded
  const retryAfterMs = record.resetAt - now
  return { allowed: false, retryAfterMs }
}

/**
 * Extract IP address from request headers
 */
function getIpAddress(req: Request): string {
  // Check common headers for proxied requests
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback to a placeholder (in local dev, there may be no IP)
  return 'unknown'
}
