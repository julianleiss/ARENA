// ARENA - Application Constants

export const PROPOSAL_CATEGORIES = [
  { value: 'urban', label: 'Desarrollo Urbano', emoji: '🏙️', color: 'indigo' },
  { value: 'transport', label: 'Transporte', emoji: '🚇', color: 'blue' },
  { value: 'green', label: 'Espacios Verdes', emoji: '🌳', color: 'green' },
  { value: 'social', label: 'Social & Comunitario', emoji: '🤝', color: 'purple' },
  { value: 'housing', label: 'Vivienda', emoji: '🏠', color: 'orange' },
  { value: 'infrastructure', label: 'Infraestructura', emoji: '🏗️', color: 'gray' },
] as const

export type ProposalCategory = typeof PROPOSAL_CATEGORIES[number]['value']

export const PROPOSAL_LAYERS = [
  { value: 'micro', label: 'Micro (Manzana)', description: 'Intervención a escala de edificio o manzana' },
  { value: 'meso', label: 'Meso (Barrio)', description: 'Intervención a escala de barrio' },
  { value: 'macro', label: 'Macro (Ciudad)', description: 'Intervención a escala de ciudad' },
] as const

export type ProposalLayer = typeof PROPOSAL_LAYERS[number]['value']

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_IMAGES_PER_PROPOSAL = 5
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
