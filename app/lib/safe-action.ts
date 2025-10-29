// ARENA V1.0 - Safe Action Wrapper (Iteration 10)
// Utility for error handling in server actions and API routes

/**
 * Wraps an async function with try-catch error handling
 * Returns a Result type: { ok: true, data } or { ok: false, error }
 *
 * @example
 * const safeGetUser = safe(async (id: string) => {
 *   return await prisma.user.findUnique({ where: { id } })
 * })
 *
 * const result = await safeGetUser('123')
 * if (result.ok) {
 *   console.log(result.data) // Type-safe data access
 * } else {
 *   console.error(result.error) // Error message
 * }
 */
export function safe<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return async (
    ...args: Parameters<T>
  ): Promise<
    | { ok: true; data: Awaited<ReturnType<T>> }
    | { ok: false; error: string }
  > => {
    try {
      const data = await fn(...args)
      return { ok: true, data }
    } catch (e: any) {
      console.error('Safe action error:', e)
      return {
        ok: false,
        error: e?.message ?? 'Unknown error',
      }
    }
  }
}

/**
 * Synchronous version of safe() for non-async functions
 */
export function safeSync<T extends (...args: any[]) => any>(fn: T) {
  return (
    ...args: Parameters<T>
  ): { ok: true; data: ReturnType<T> } | { ok: false; error: string } => {
    try {
      const data = fn(...args)
      return { ok: true, data }
    } catch (e: any) {
      console.error('Safe sync error:', e)
      return {
        ok: false,
        error: e?.message ?? 'Unknown error',
      }
    }
  }
}

// Type helper for Result pattern
export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E }
