# ARENA - Configuración Rápida

## Problema: No veo pines en el mapa

Si no ves pines ni puedes interactuar con el mapa, sigue estos pasos:

### 1. Configurar el Token de Mapbox (REQUERIDO)

El mapa usa Mapbox GL JS y necesita un token de acceso.

```bash
# 1. Copia el archivo de ejemplo
cp .env.example .env.local

# 2. Edita .env.local y agrega tu token de Mapbox
```

**Obtener token de Mapbox (GRATIS):**
1. Ve a https://account.mapbox.com/
2. Crea una cuenta (gratis - 50,000 cargas de mapa/mes)
3. Ve a https://account.mapbox.com/access-tokens
4. Copia tu "Default public token"
5. Pégalo en `.env.local`:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1Ij...tu-token-aqui"
```

### 2. Verificar el servidor está corriendo

```bash
npm run dev
```

El servidor debe estar en http://localhost:3000

### 3. Verificar que hay propuestas en la base de datos

```bash
# Poblar la base de datos con datos de prueba
npm run db:seed
```

Esto creará:
- 2 usuarios de prueba
- 4 POIs en Buenos Aires
- 1 propuesta de ejemplo: "Corredor Verde Av. del Libertador"
- 8 assets de prefabs

### 4. Abrir el navegador con DevTools

1. Abre http://localhost:3000
2. Presiona F12 para abrir DevTools
3. Ve a la pestaña "Console"
4. Busca estos mensajes:

**✅ BIEN:**
```
✅ Mapbox map loaded
🚀 Starting ProposalMarkers initialization...
✅ Map style loaded, adding proposal markers...
✅ Proposal markers initialized
🔄 Fetching proposals from API...
✅ Loaded X proposals
📍 Setting proposal data: ...
✅ Updated X proposal markers
```

**❌ MAL (sin token):**
```
⚠️ NEXT_PUBLIC_MAPBOX_TOKEN not found
❌ Mapbox error: ...
```

### 5. Verificar visualmente

Si todo está bien, deberías ver:
- 📍 **Pines morados** en el mapa (propuestas)
- El mapa centrado en Buenos Aires (Núñez: -34.545, -58.46)
- Zoom level 15 con pitch 60° (vista 3D)
- Debug panel en esquina inferior izquierda mostrando:
  - Mode: navigate
  - Proposals: X (número de propuestas cargadas)

### 6. Solución de problemas

**El mapa no se ve (pantalla gris):**
- ❌ Falta el token de Mapbox en `.env.local`
- Solución: Agrega `NEXT_PUBLIC_MAPBOX_TOKEN`

**El mapa se ve pero no hay pines:**
- ❌ No hay propuestas en la base de datos
- Solución: Ejecuta `npm run db:seed`
- Verifica en console: "Loaded 0 proposals"

**Los pines no están visibles (ocultos por el mapa):**
- ❌ Problema de z-index o capa de Mapbox
- Verifica en console: "Proposal source not found!"
- Los cambios recientes deberían haber solucionado esto

**No puedo hacer clic en el mapa:**
- ❌ El mapa no recibe eventos de click
- Verifica que el cursor cambie a "crosshair" en modo Create
- Abre DevTools y verifica errores en console

### 7. Comandos útiles

```bash
# Ver la base de datos con interfaz visual
npm run db:studio

# Limpiar toda la base de datos (⚠️ cuidado)
npm run db:rollback

# Volver a poblar con datos de prueba
npm run db:seed

# Ver logs del servidor en tiempo real
npm run dev
```

## Configuración mínima de .env.local

Para que el mapa funcione, necesitas AL MENOS:

```bash
# Token de Mapbox (OBLIGATORIO)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ..."

# Conexión a base de datos (OBLIGATORIO)
DATABASE_URL="postgresql://postgres.xxx:password@xxx.supabase.com:5432/postgres"

# Supabase (opcional, para autenticación futura)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

## ¿Necesitas ayuda?

1. Revisa la consola del navegador (F12 → Console)
2. Revisa la consola del servidor (terminal donde corre `npm run dev`)
3. Copia los mensajes de error y repórtalos

---

**Nota:** Los cambios recientes agregaron:
- ✅ Debugging extensivo en ProposalMarkers
- ✅ symbol-sort-key: 1000 para renderizar pines arriba
- ✅ Tamaños de iconos aumentados 25%
- ✅ Re-inicialización al cambiar el estilo del mapa
- ✅ Pines visibles en modo navigate Y create
