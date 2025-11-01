// ARENA - Spanish Time Formatting Utility
// Convert timestamps to relative time in Spanish

export function timeAgo(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 10) {
    return 'justo ahora'
  } else if (diffSeconds < 60) {
    return 'hace unos segundos'
  } else if (diffMinutes === 1) {
    return 'hace 1 minuto'
  } else if (diffMinutes < 60) {
    return `hace ${diffMinutes} minutos`
  } else if (diffHours === 1) {
    return 'hace 1 hora'
  } else if (diffHours < 24) {
    return `hace ${diffHours} horas`
  } else if (diffDays === 1) {
    return 'hace 1 día'
  } else if (diffDays < 7) {
    return `hace ${diffDays} días`
  } else if (diffWeeks === 1) {
    return 'hace 1 semana'
  } else if (diffWeeks < 4) {
    return `hace ${diffWeeks} semanas`
  } else if (diffMonths === 1) {
    return 'hace 1 mes'
  } else if (diffMonths < 12) {
    return `hace ${diffMonths} meses`
  } else if (diffYears === 1) {
    return 'hace 1 año'
  } else {
    return `hace ${diffYears} años`
  }
}
