// ARENA - Spanish Translation File
// Complete UI translations for Spanish language

export const es = {
  // Common
  common: {
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
    back: 'Volver',
    next: 'Siguiente',
    previous: 'Anterior',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'No',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    required: 'Requerido',
  },

  // Navigation
  nav: {
    map: 'Mapa',
    proposals: 'Propuestas',
    sandbox: 'Sandbox',
    profile: 'Perfil',
  },

  // Map modes
  map: {
    modes: {
      navigate: 'Navegar',
      create: 'Crear',
    },
    selection: {
      building: 'Edificio',
      point: 'Punto',
      polygon: 'Polígono',
    },
    tooltips: {
      building: '👆 Haz clic en un edificio para crear propuesta',
      point: '📍 Haz clic en cualquier lugar del mapa',
      polygon: '✏️ Haz clic para dibujar un área',
    },
  },

  // Sandbox
  sandbox: {
    title: 'Editor 3D',
    newProposal: 'Nueva Propuesta',

    // Toolbar
    toolbar: {
      select: 'Seleccionar',
      move: 'Mover',
      rotate: 'Rotar',
      scale: 'Escalar',
      delete: 'Eliminar',
      undo: 'Deshacer',
      redo: 'Rehacer',
      viewTop: 'Vista Superior',
      viewPerspective: 'Vista en Perspectiva',
    },

    // Palette (Asset categories and names)
    palette: {
      title: 'Paleta de Objetos',
      search: 'Buscar objetos...',

      categories: {
        all: 'Todos',
        buildings: 'Edificios',
        nature: 'Naturaleza',
        urban: 'Urbano',
        transport: 'Transporte',
        furniture: 'Mobiliario',
        lighting: 'Iluminación',
      },

      assets: {
        // Buildings
        building_residential: 'Edificio Residencial',
        building_commercial: 'Edificio Comercial',
        building_industrial: 'Edificio Industrial',
        house_small: 'Casa Pequeña',
        house_medium: 'Casa Mediana',
        house_large: 'Casa Grande',
        apartment: 'Edificio de Apartamentos',

        // Nature
        tree_oak: 'Roble',
        tree_pine: 'Pino',
        tree_palm: 'Palmera',
        bush_small: 'Arbusto Pequeño',
        bush_medium: 'Arbusto Mediano',
        grass_patch: 'Césped',
        flower_bed: 'Macizo de Flores',

        // Urban
        street_light: 'Farola',
        traffic_light: 'Semáforo',
        sign_stop: 'Señal de Pare',
        sign_yield: 'Señal de Ceda el Paso',
        bench_park: 'Banco de Parque',
        trash_can: 'Papelera',
        fountain: 'Fuente',

        // Transport
        car_sedan: 'Auto Sedán',
        car_suv: 'SUV',
        bus: 'Autobús',
        bike: 'Bicicleta',
        bike_rack: 'Bicicletero',

        // Furniture
        bench: 'Banco',
        table: 'Mesa',
        chair: 'Silla',
        umbrella: 'Sombrilla',

        // Lighting
        lamp_post: 'Poste de Luz',
        spotlight: 'Reflector',

        // Basic primitives
        cube: 'Cubo',
        sphere: 'Esfera',
        cylinder: 'Cilindro',
        cone: 'Cono',
        pyramid: 'Pirámide',
        plane: 'Plano',
      },
    },

    // Inspector
    inspector: {
      title: 'Inspector',
      noSelection: 'Ningún objeto seleccionado',

      properties: {
        name: 'Nombre',
        type: 'Tipo',
        position: 'Posición',
        rotation: 'Rotación',
        scale: 'Escala',
        color: 'Color',
        opacity: 'Opacidad',
        visible: 'Visible',
      },

      transform: {
        x: 'X',
        y: 'Y',
        z: 'Z',
      },
    },

    // Stats Panel
    stats: {
      title: 'Estadísticas',
      objects: 'Objetos',
      vertices: 'Vértices',
      triangles: 'Triángulos',
      fps: 'FPS',
      camera: 'Cámara',
      memory: 'Memoria',
    },

    // Actions
    actions: {
      publish: 'Publicar',
      save: 'Guardar Borrador',
      discard: 'Descartar',
      unsavedWarning: '¿Tienes cambios sin guardar. ¿Seguro que quieres cerrar?',
    },
  },

  // Publish Form
  publish: {
    title: 'Publicar Propuesta',
    subtitle: 'Completa la información para compartir tu diseño con la comunidad',

    fields: {
      title: {
        label: 'Título',
        placeholder: 'Ej: Parque Comunitario en Av. Libertador',
        maxLength: '100 caracteres',
      },
      description: {
        label: 'Descripción',
        placeholder: 'Describe tu propuesta: objetivos, beneficios, características principales...',
        maxLength: '500 caracteres',
      },
      visibility: {
        label: 'Visibilidad',
        public: {
          title: 'Pública',
          description: 'Todos pueden ver y votar tu propuesta',
        },
        private: {
          title: 'Privada',
          description: 'Solo tú puedes ver esta propuesta',
        },
      },
      tags: {
        label: 'Etiquetas',
        placeholder: 'parque, verde, comunidad, accesibilidad (separadas por comas)',
        hint: 'Separa las etiquetas con comas',
      },
    },

    actions: {
      cancel: 'Cancelar',
      submit: 'Publicar Propuesta',
      submitting: 'Publicando...',
    },

    validation: {
      requiredFields: 'Por favor completa todos los campos requeridos',
    },

    success: '¡Propuesta publicada con éxito!',
    error: 'Error al publicar la propuesta',
  },

  // Proposals
  proposals: {
    title: 'Propuestas',
    noProposals: 'No hay propuestas disponibles',
    createNew: 'Crear Nueva Propuesta',

    card: {
      by: 'por',
      votes: 'votos',
      comments: 'comentarios',
      viewDetails: 'Ver Detalles',
      viewOnMap: 'Ver en Mapa',
    },

    details: {
      description: 'Descripción',
      location: 'Ubicación',
      author: 'Autor',
      createdAt: 'Creado el',
      updatedAt: 'Actualizado el',
      status: 'Estado',
      tags: 'Etiquetas',
    },

    status: {
      draft: 'Borrador',
      published: 'Publicada',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      implemented: 'Implementada',
    },

    actions: {
      edit: 'Editar',
      delete: 'Eliminar',
      vote: 'Votar',
      comment: 'Comentar',
      share: 'Compartir',
    },
  },

  // Comments
  comments: {
    title: 'Comentarios',
    noComments: 'No hay comentarios aún',
    writeComment: 'Escribe un comentario...',
    submit: 'Enviar',
    reply: 'Responder',
    edit: 'Editar',
    delete: 'Eliminar',
    deleteConfirm: '¿Estás seguro de que quieres eliminar este comentario?',
  },

  // Voting
  voting: {
    upvote: 'Me gusta',
    downvote: 'No me gusta',
    voted: 'Has votado',
    removeVote: 'Quitar voto',
  },

  // Time formatting
  time: {
    justNow: 'Justo ahora',
    minuteAgo: 'hace 1 minuto',
    minutesAgo: 'hace {n} minutos',
    hourAgo: 'hace 1 hora',
    hoursAgo: 'hace {n} horas',
    dayAgo: 'hace 1 día',
    daysAgo: 'hace {n} días',
    weekAgo: 'hace 1 semana',
    weeksAgo: 'hace {n} semanas',
    monthAgo: 'hace 1 mes',
    monthsAgo: 'hace {n} meses',
    yearAgo: 'hace 1 año',
    yearsAgo: 'hace {n} años',
  },

  // Errors
  errors: {
    generic: 'Ocurrió un error. Por favor intenta nuevamente.',
    network: 'Error de conexión. Verifica tu internet.',
    notFound: 'No se encontró el recurso solicitado.',
    unauthorized: 'No tienes permiso para realizar esta acción.',
    validation: 'Algunos campos contienen errores.',
  },
}

export type TranslationKeys = typeof es
