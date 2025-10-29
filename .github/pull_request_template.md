# Pull Request - ARENA V1.0

## 🎯 Objetivo

<!-- Describe brevemente el propósito de este PR -->

**Relacionado con:** <!-- Issue #, Iteración, Feature -->

## 📝 Cambios

<!-- Lista detallada de los cambios realizados -->

-
-
-

### Archivos modificados principales

<!-- Listar los archivos clave que fueron modificados o creados -->

- `path/to/file.ts` - Descripción del cambio
- `path/to/component.tsx` - Descripción del cambio

## 🗄️ Migraciones / Cambios en la base de datos

<!-- ¿Requiere cambios en el esquema de Prisma o en la base de datos? -->

- [ ] No requiere migraciones
- [ ] Requiere `prisma generate`
- [ ] Requiere `prisma db push`
- [ ] Requiere reseed: `npm run db:seed`

**Detalles:**
<!-- Si aplica, describe los cambios en el schema o datos -->

```prisma
// Ejemplo de cambios en schema.prisma
```

## 🧪 Cómo probar

<!-- Pasos detallados para verificar los cambios -->

1. Checkout del branch: `git checkout <branch-name>`
2. Instalar dependencias: `npm install`
3. [Si aplica] Generar cliente Prisma: `npm run db:generate`
4. [Si aplica] Aplicar migraciones: `npm run db:push`
5. Iniciar dev server: `npm run dev`
6. Navegar a: `http://localhost:3000/...`
7. Verificar:
   -
   -

### Casos de prueba

<!-- Escenarios específicos que se deben probar -->

- [ ] Caso 1:
- [ ] Caso 2:
- [ ] Caso 3:

## 📸 Capturas / Videos

<!-- Screenshots, GIFs, o videos demostrando los cambios -->

### Antes

<!-- Si aplica -->

### Después

<!-- Añadir capturas de pantalla aquí -->

## ✅ Checklist

### Build & Quality

- [ ] `npm run build` - Build exitoso sin errores
- [ ] `npm run lint` - Sin errores de linting
- [ ] `npm test` - Tests pasan (si aplica)
- [ ] Código TypeScript sin errores de tipo
- [ ] No hay console.logs innecesarios

### Database & Seeds

- [ ] Schema de Prisma actualizado si fue necesario
- [ ] Seeds funcionan correctamente: `npm run db:seed`
- [ ] No hay conflictos con datos existentes

### Funcionalidad

- [ ] Funcionalidad core probada manualmente
- [ ] Casos extremos (edge cases) verificados
- [ ] Manejo de errores implementado
- [ ] UX/UI responsive en mobile y desktop

### Documentación

- [ ] Comentarios en código complejo
- [ ] README actualizado si es necesario
- [ ] CLAUDE.md actualizado si cambió arquitectura
- [ ] Variables de entorno documentadas en `.env.example`

### Security & Performance

- [ ] No hay credenciales o secrets en el código
- [ ] Validación de inputs implementada
- [ ] Sanitización XSS en renders con datos de usuario
- [ ] Queries optimizadas (sin N+1)
- [ ] Assets optimizados (imágenes, bundles)

## 📌 Notas adicionales

<!-- Cualquier información adicional que los revisores deban saber -->

---

**¿Listo para merge?**
- [ ] Sí, cumple todos los criterios de aceptación
- [ ] No, requiere revisión adicional en: ___________
