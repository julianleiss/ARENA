// ARENA V1.0 - Mock Data Layer
// Fallback data for demo when database is unavailable

export const MOCK_USERS = [
  {
    id: 'user-citizen-1',
    email: 'juan.perez@example.com',
    name: 'Juan Pérez',
    role: 'CITIZEN',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'user-citizen-2',
    email: 'maria.garcia@example.com',
    name: 'María García',
    role: 'CITIZEN',
    createdAt: new Date('2024-01-16').toISOString(),
    updatedAt: new Date('2024-01-16').toISOString(),
  },
  {
    id: 'user-expert-1',
    email: 'carlos.urbano@example.com',
    name: 'Carlos Urbano',
    role: 'EXPERT',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
]

export const MOCK_PROPOSALS = [
  {
    id: 'prop-demo-1',
    title: 'Corredor Verde Av. del Libertador',
    description: 'Propuesta para crear un corredor verde con ciclovía protegida, espacios de descanso y arbolado nativo a lo largo de 2km de Av. del Libertador en Núñez.',
    status: 'public',
    geom: { type: 'LineString', coordinates: [[-58.4517, -34.5456], [-58.4517, -34.5256]] },
    authorId: 'user-citizen-1',
    createdAt: new Date('2024-02-10T14:30:00Z').toISOString(),
    updatedAt: new Date('2024-02-15T10:20:00Z').toISOString(),
    author: {
      id: 'user-citizen-1',
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      role: 'CITIZEN',
    },
    _count: {
      votes: 247,
      comments: 18,
    },
  },
  {
    id: 'prop-demo-2',
    title: 'Plaza Interactiva Barrio Belgrano',
    description: 'Transformación de espacio público en plaza multiuso con juegos infantiles inclusivos, sector de calistenia, mesas de ajedrez y wifi público gratuito.',
    status: 'public',
    geom: { type: 'Polygon', coordinates: [[[-58.4563, -34.5628], [-58.4553, -34.5628], [-58.4553, -34.5618], [-58.4563, -34.5618], [-58.4563, -34.5628]]] },
    authorId: 'user-citizen-2',
    createdAt: new Date('2024-02-12T09:15:00Z').toISOString(),
    updatedAt: new Date('2024-02-12T09:15:00Z').toISOString(),
    author: {
      id: 'user-citizen-2',
      name: 'María García',
      email: 'maria.garcia@example.com',
      role: 'CITIZEN',
    },
    _count: {
      votes: 189,
      comments: 12,
    },
  },
  {
    id: 'prop-demo-3',
    title: 'Estación de Carga Solar para Bicicletas Eléctricas',
    description: 'Instalación de estaciones de carga solar distribuidas cada 500m en principales corredores ciclistas, con sistema de reserva por app y monitoreo en tiempo real.',
    status: 'public',
    geom: { type: 'MultiPoint', coordinates: [[-58.4200, -34.5900], [-58.4250, -34.5920], [-58.4300, -34.5940], [-58.4350, -34.5960], [-58.4400, -34.5980]] },
    authorId: 'user-expert-1',
    createdAt: new Date('2024-02-08T16:45:00Z').toISOString(),
    updatedAt: new Date('2024-02-14T11:30:00Z').toISOString(),
    author: {
      id: 'user-expert-1',
      name: 'Carlos Urbano',
      email: 'carlos.urbano@example.com',
      role: 'EXPERT',
    },
    _count: {
      votes: 312,
      comments: 24,
    },
  },
  {
    id: 'prop-demo-4',
    title: 'Corredor Peatonal Calle Florida',
    description: 'Ampliación de vereda y mejora de accesibilidad en calle Florida entre Av. Córdoba y Av. de Mayo, con reducción de carriles vehiculares y prioridad peatonal.',
    status: 'public',
    geom: { type: 'LineString', coordinates: [[-58.3747, -34.6037], [-58.3747, -34.5989]] },
    authorId: 'user-citizen-1',
    createdAt: new Date('2024-02-05T13:20:00Z').toISOString(),
    updatedAt: new Date('2024-02-05T13:20:00Z').toISOString(),
    author: {
      id: 'user-citizen-1',
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      role: 'CITIZEN',
    },
    _count: {
      votes: 156,
      comments: 8,
    },
  },
  {
    id: 'prop-demo-5',
    title: 'Huerta Comunitaria Parque Centenario',
    description: 'Creación de espacio de agricultura urbana con parcelas comunitarias, sistema de riego por goteo, compostaje y talleres educativos sobre soberanía alimentaria.',
    status: 'public',
    geom: { type: 'Polygon', coordinates: [[[-58.4387, -34.6088], [-58.4377, -34.6088], [-58.4377, -34.6078], [-58.4387, -34.6078], [-58.4387, -34.6088]]] },
    authorId: 'user-citizen-2',
    createdAt: new Date('2024-02-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-02-11T15:45:00Z').toISOString(),
    author: {
      id: 'user-citizen-2',
      name: 'María García',
      email: 'maria.garcia@example.com',
      role: 'CITIZEN',
    },
    _count: {
      votes: 423,
      comments: 31,
    },
  },
]

export const MOCK_COMMENTS = [
  {
    id: 'comment-1',
    proposalId: 'prop-demo-1',
    authorId: 'user-citizen-2',
    body: 'Excelente propuesta! Sería ideal conectar con el sistema de Ecobici existente.',
    createdAt: new Date('2024-02-11T15:20:00Z').toISOString(),
    author: {
      name: 'María García',
    },
  },
  {
    id: 'comment-2',
    proposalId: 'prop-demo-1',
    authorId: 'user-expert-1',
    body: 'Como experto urbano, recomiendo incluir análisis de impacto en tráfico vehicular y estudio de especies arbóreas más resistentes al clima porteño.',
    createdAt: new Date('2024-02-12T09:30:00Z').toISOString(),
    author: {
      name: 'Carlos Urbano',
    },
  },
  {
    id: 'comment-3',
    proposalId: 'prop-demo-2',
    authorId: 'user-citizen-1',
    body: '¿Se contempla accesibilidad para personas con movilidad reducida? Fundamental para una plaza inclusiva.',
    createdAt: new Date('2024-02-12T14:10:00Z').toISOString(),
    author: {
      name: 'Juan Pérez',
    },
  },
  {
    id: 'comment-4',
    proposalId: 'prop-demo-3',
    authorId: 'user-citizen-1',
    body: '¿Cuál sería el costo estimado por estación? Me parece clave para evaluar viabilidad.',
    createdAt: new Date('2024-02-09T11:15:00Z').toISOString(),
    author: {
      name: 'Juan Pérez',
    },
  },
  {
    id: 'comment-5',
    proposalId: 'prop-demo-5',
    authorId: 'user-expert-1',
    body: 'Gran iniciativa. Sugiero coordinación con Ministerio de Ambiente para financiamiento y asistencia técnica.',
    createdAt: new Date('2024-02-03T16:40:00Z').toISOString(),
    author: {
      name: 'Carlos Urbano',
    },
  },
]

export const MOCK_SANDBOX_DATA = {
  'prop-demo-1': {
    objects: [
      {
        id: 'obj-1',
        type: 'tree',
        position: [-58.4598, -34.5448, 0],
        properties: { species: 'Jacarandá', height: 8 },
      },
      {
        id: 'obj-2',
        type: 'bikelane',
        position: [-58.4600, -34.5450, 0],
        properties: { width: 2.5, length: 100 },
      },
    ],
  },
  'prop-demo-2': {
    objects: [
      {
        id: 'obj-3',
        type: 'playground',
        position: [-58.4520, -34.5620, 0],
        properties: { capacity: 20, accessible: true },
      },
    ],
  },
}

// Utility function to check if database is available
export function isDatabaseAvailable(): boolean {
  // This will be set by API routes when DB connection fails
  return false
}

// Utility to get mock data with database-like structure
export function getMockProposals(options?: { status?: string }) {
  const filtered = options?.status
    ? MOCK_PROPOSALS.filter((p) => p.status === options.status)
    : MOCK_PROPOSALS

  return {
    proposals: filtered,
    count: filtered.length,
    source: 'mock',
  }
}

export function getMockProposal(id: string) {
  return MOCK_PROPOSALS.find((p) => p.id === id) || null
}

export function getMockComments(proposalId: string) {
  return MOCK_COMMENTS.filter((c) => c.proposalId === proposalId)
}

export function getMockSandbox(proposalId: string) {
  return MOCK_SANDBOX_DATA[proposalId as keyof typeof MOCK_SANDBOX_DATA] || { objects: [] }
}
