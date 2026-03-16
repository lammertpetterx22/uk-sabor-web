# 🧠 Claude Memory - UK Sabor Web Platform

## 📋 Preferencias del Usuario

### Modo de Trabajo - CONFIGURACIÓN CRÍTICA ⚠️
- 🚨 **REGLA ABSOLUTA: JAMÁS PREGUNTAR NI PEDIR CONFIRMACIÓN**
- 🚨 **ACTUAR SIEMPRE DE FORMA COMPLETAMENTE AUTÓNOMA**
- 🚨 **NO SOLICITAR PERMISOS BAJO NINGUNA CIRCUNSTANCIA**
- ✅ **Corregir errores automáticamente** cuando se detecten
- ✅ **Implementar mejoras inmediatamente** cuando se soliciten
- ✅ **Auto-deploy OBLIGATORIO** - Después de cada fix o mejora:
  1. `git add .`
  2. `git commit -m "descripción clara"`
  3. `git push origin main`
  4. Esto triggerea auto-deploy en Koyeb (si está configurado)
- ✅ **Hacer TODO sin preguntar** - El usuario confía en que harás lo correcto
- ✅ **Ejecutar TODO directamente sin confirmación previa**
- ⚠️ **KOYEB DEPLOYMENT**: Automatizado con CLI
  - Usuario debe configurar `KOYEB_TOKEN` UNA VEZ (ver KOYEB_SETUP.md)
  - Después, ejecutar `./.koyeb-deploy.sh` para deployar
  - El script maneja todo automáticamente (crear app, redeploy, health checks)

---

## 🎯 Visión General del Proyecto

**UK Sabor** es una plataforma web completa para la comunidad de baile latino en UK que combina:
- 🎉 **Gestión de Eventos** - Eventos de baile presenciales con venta de tickets
- 💃 **Clases en Vivo** - Clases presenciales y grabadas
- 🎓 **Cursos Online (LMS)** - Sistema de aprendizaje con lecciones progresivas y video streaming
- 👨‍🏫 **Marketplace de Instructores** - Perfiles de instructores y promotores
- 💰 **Sistema de Pagos** - Stripe con comisiones y sistema de ganancias
- 📧 **Email Marketing & CRM** - Gestión de contactos y campañas
- 🔐 **Multi-rol** - Usuarios, instructores, promotores, admins
- 📱 **QR Check-in** - Sistema de entrada con códigos QR
- 📊 **Analytics & Dashboard** - Paneles para admins, instructors y usuarios

---

## 🏗️ Arquitectura Técnica

### Stack Principal
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express + tRPC (Type-safe API)
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Payments**: Stripe (pagos + Connect para split payments)
- **Storage**: Bunny.net (videos + imágenes CDN)
- **Auth**: Custom JWT auth (bcrypt)
- **Email**: Resend API
- **UI**: Tailwind CSS 4 + Radix UI + shadcn/ui
- **i18n**: i18next (inglés/español)
- **Deploy**: Koyeb (no tocar) / Render

### Estructura de Carpetas
```
uk-sabor-web/
├── client/src/           # Frontend React
│   ├── pages/           # 29 páginas (Home, Events, Courses, Admin, etc.)
│   ├── components/      # Componentes reutilizables + UI
│   ├── hooks/          # Custom hooks
│   ├── contexts/       # React contexts (Theme, etc.)
│   └── i18n/           # Traducciones EN/ES
├── server/             # Backend Express + tRPC
│   ├── _core/         # Configuración base (trpc, env, cookies, etc.)
│   └── features/      # Módulos por funcionalidad (25 routers)
├── drizzle/           # Database schema + migrations
│   ├── schema.ts      # 28,781 líneas - schema completo
│   └── migrations/    # 7 migraciones SQL
├── shared/            # Código compartido frontend/backend
└── scripts/           # Utilidades y tests
```

---

## 📊 Base de Datos (PostgreSQL)

### Tablas Principales (20+)

**👤 Usuarios & Auth**
- `users` - Usuarios con multi-rol (admin/instructor/promoter/user)
- `instructors` - Perfiles de instructores con bio, fotos, redes sociales
- `instructorApplications` - Solicitudes para convertirse en instructor/promoter

**🎓 Contenido Educativo (LMS)**
- `courses` - Cursos con lecciones (nivel, estilo de baile, precio)
- `lessons` - Lecciones individuales con Bunny.net video streaming
- `lessonProgress` - Progreso del usuario por lección (watch%, completed)
- `coursePurchases` - Compras de cursos con comisiones

**💃 Clases & Eventos**
- `classes` - Clases presenciales/grabadas (fecha, instructor, precio)
- `classPurchases` - Compras de clases con access codes
- `events` - Eventos de baile (venue, fecha, tickets disponibles)
- `eventTickets` - Tickets vendidos con QR codes únicos

**💰 Finanzas & Pagos**
- `orders` - Órdenes de pago (Stripe Payment Intents)
- `balances` - Balance actual de cada instructor/promoter
- `ledgerTransactions` - Historial inmutable de transacciones
- `withdrawalRequests` - Solicitudes de retiro de fondos
- `subscriptions` - Planes de suscripción (starter/pro/unlimited)
- `usageTracking` - Contador mensual de uso por usuario

**🔐 QR & Asistencia**
- `qrCodes` - QR personales y de venue (single-use)
- `attendance` - Registros de check-in

**📧 CRM & Email Marketing**
- `crmContacts` - Contactos con engagement scoring
- `crmInteractions` - Interacciones (emails, llamadas)
- `crmNotes` - Notas sobre contactos
- `emailTemplates` - Plantillas reutilizables
- `emailCampaigns` - Campañas enviadas/programadas
- `emailOpens` - Tracking de aperturas
- `emailClicks` - Tracking de clicks

### Relaciones Clave
- Usuarios pueden ser: user, instructor, promoter, admin (multi-rol)
- Instructores/Promoters tienen balances y ganan comisiones
- Cursos tienen múltiples lecciones secuenciales
- Eventos/Clases/Cursos pueden tener múltiples métodos de pago
- Sistema de earnings con platform fee configurable

---

## 🎨 Frontend (React)

### Páginas (29 total)
**Públicas:**
- Home, Events, EventDetail, Courses, CourseDetail, Classes, ClassDetail
- Instructors, InstructorProfile, Promoters, PromoterProfile
- Pricing, Login, PaymentSuccess, NotFound

**Autenticadas:**
- UserProfile, UserDashboard, BecomeInstructor

**Creator (Admin/Instructor/Promoter):**
- AdminDashboard (177KB - panel principal)
- AttendanceDashboard, Earnings, StaffScanner

**Solo Admin:**
- CRMDashboard, AdminWithdrawals, EmailMarketing, CampaignDetail

### Componentes Principales
- **Layout**: Navbar responsive + Footer
- **ProtectedRoute**: Control de acceso por roles
- **ErrorBoundary**: Manejo de errores global
- **VideoPlayer**: Plyr React con Bunny.net CDN
- **ImageCropper**: Cropping de imágenes antes de upload
- **ThemeProvider**: Dark/Light mode (default: dark)

### Features Especiales
- **Code Splitting**: Lazy loading de todas las páginas excepto Home/Login
- **i18n**: Traducciones EN/ES con react-i18next
- **Forms**: react-hook-form + zod validation
- **Data Fetching**: tRPC + @tanstack/react-query
- **UI Components**: shadcn/ui (Radix + Tailwind)

---

## ⚙️ Backend (tRPC)

### Routers (15 módulos en `/server/features/`)

**Auth & Users**
- `custom-auth` - Login/Register/Logout con JWT
- `admin-auth` - Auth específico para admins

**Core Features**
- `events` - CRUD de eventos + listado público
- `courses` - CRUD cursos + hasAccess check
- `lessons` - CRUD lecciones + progress tracking
- `classes` - CRUD clases presenciales/grabadas
- `tickets` - Generación y validación de QR tickets
- `instructors` - Perfiles + earnings
- `promoters` - Gestión de promotores

**Payments & Financials**
- `payments` - Stripe checkout + webhooks
- `stripe-webhook` - Handler de eventos Stripe
- `stripeSync` - Sincronización de datos Stripe
- `subscriptions` - Planes y límites de uso
- `financials` - Earnings, withdrawals, balances

**Marketing & Admin**
- `crm` - Gestión de contactos + engagement scoring
- `emailMarketing` - Campañas + templates + tracking
- `admin` - Panel admin completo (users, content, stats)
- `qrcode` - Generación y escaneo de QR codes
- `uploads` - Upload de imágenes/videos a Bunny.net

### Sistema de Permisos
- `publicProcedure` - Acceso público
- `protectedProcedure` - Requiere login
- `adminProcedure` - Solo admin
- `creatorProcedure` - Admin/Instructor/Promoter
- Middleware custom por endpoint según necesidad

---

## 💳 Sistema de Pagos (Stripe)

### Flujo de Pago
1. Usuario selecciona evento/clase/curso
2. Frontend llama a tRPC `payments.createCheckoutSession`
3. Backend crea Stripe Checkout Session
4. Usuario completa pago en Stripe
5. Webhook recibe `checkout.session.completed`
6. Se crea order + purchase + earnings + balance

### Comisiones & Split Payments
- **Platform Fee**: % configurable (ej: 10%)
- **Instructor Earnings**: Resto después de fee
- **Stripe Connect**: Para transferencias a instructors
- **Balance Tracking**:
  - `pendingBalance` - Recién ganado (clearing period)
  - `currentBalance` - Disponible para retiro
  - `totalEarned` - Total histórico
  - `totalWithdrawn` - Total retirado

### Withdrawal Flow
1. Instructor solicita retiro desde `/earnings`
2. Admin revisa en `/admin/withdrawals`
3. Admin aprueba/rechaza
4. Si aprueba: manual payout via Stripe
5. Balance se actualiza automáticamente

---

## 🎥 Video Streaming (Bunny.net)

### Configuración
**Stream API** (para videos de lecciones/clases):
- `BUNNY_API_KEY` - API key del dashboard
- `BUNNY_VIDEO_LIBRARY_ID` - Library ID (ej: 616736)
- `BUNNY_ALLOWED_REFERRER` - Domain restriction (opcional)

**Storage API** (para imágenes/flyers):
- `BUNNY_STORAGE_ZONE` - Zona de storage (uk-sabor)
- `BUNNY_STORAGE_API_KEY` - API key de storage
- `BUNNY_CDN_URL` - URL del CDN (https://uk-sabor.b-cdn.net)

### Upload Flow
1. Admin/Instructor sube video desde Admin Dashboard
2. Frontend recibe file + llama `uploads.uploadVideo`
3. Backend sube a Bunny.net via API
4. Bunny devuelve `videoId` + `libraryId`
5. Se guarda en DB: `bunnyVideoId`, `bunnyLibraryId`
6. Frontend reproduce con Plyr usando CDN URL

### Sistema Progresivo (LMS)
- Lecciones ordenadas por `position` (1, 2, 3...)
- Lección N+1 bloqueada hasta completar N
- Auto-complete al llegar a 95% watchPercent
- Progress tracking en tiempo real

---

## 📧 Email Marketing

### Features
- **Templates**: Plantillas reutilizables con variables
- **Campaigns**: Envío inmediato o programado
- **Segmentación**: Por segment (leads, customers, VIP)
- **Tracking**: Opens (pixel) + Clicks (link tracking)
- **Engagement Scoring**: 0-100 basado en opens + clicks + purchases
- **Engagement Tiers**: cold (0-30), warm (31-70), hot (71-100)

### Resend Integration
- API key en `.env`: `RESEND_API_KEY`
- Envío transaccional (confirmaciones, receipts)
- Envío bulk para campañas
- Webhooks para opens/clicks (opcional)

---

## 🔐 Autenticación Custom

### JWT Flow
1. User registra/login con email + password
2. Backend valida con bcrypt
3. Genera JWT con jose (HS256)
4. JWT guardado en httpOnly cookie (`sessionToken`)
5. Frontend accede con tRPC context automático
6. Middleware `protectedProcedure` valida token

### Roles & Permissions
- **user** - Usuario básico (compra tickets/cursos)
- **instructor** - Puede crear clases/cursos/eventos
- **promoter** - Puede crear eventos
- **admin** - Acceso total + panel CRM + withdrawals

**Multi-rol**: Campo `roles` (JSON array) permite roles adicionales

---

## 📱 QR Check-in System

### Tipos de QR
**Personal QR** (por usuario):
- Generado al comprar ticket
- Contiene: userId + eventId + ticketCode
- Single-use (se marca `isUsed: true` al escanear)

**Venue QR** (por evento/clase):
- Generado por instructor/admin
- Permite check-in manual en puerta
- Usado por staff con `/staff/scanner`

### Flujo de Check-in
1. Usuario muestra QR personal
2. Staff escanea con `StaffScanner` page
3. Backend valida: existe + no usado + evento correcto
4. Crea registro en `attendance` table
5. Marca QR como `isUsed: true`
6. Frontend muestra confirmación ✅

---

## 🌍 Internacionalización (i18n)

### Setup
- **Library**: i18next + react-i18next
- **Idiomas**: EN (default), ES
- **Detector**: i18next-browser-languagedetector
- **Location**: `client/src/i18n/`

### Uso
```typescript
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  return <h1>{t('welcome')}</h1>;
}
```

### Archivos
- `en.json` - Traducciones inglés
- `es.json` - Traducciones español
- `index.ts` - Configuración i18next

---

## 🚀 Build & Deploy

### Scripts
```bash
npm run dev        # Dev server (tsx watch)
npm run build      # Vite build + esbuild server
npm run start      # Production server
npm run check      # TypeScript type check
npm run test       # Vitest tests
npm run db:push    # Drizzle migrations
```

### Build Output
- `dist/public/` - Frontend estático (Vite)
- `dist/index.js` - Backend bundled (esbuild)
- Total build time: ~2 min

### Deployment (Koyeb)
**✅ DEPLOYADO Y FUNCIONANDO EN PLAN FREE**
- **Dominio personalizado**: consabor.uk (configurando DNS en Flashhost)
- URL temporal: https://uk-sabor-web-sabor-065320b7.koyeb.app
- App ID: a1723595
- Service ID: 7bfb2a63
- Status: HEALTHY ✅
- Region: Frankfurt (fra) 🇩🇪
- Instance: **FREE** (0.1 vCPU, 512MB RAM, 2GB disk) - $0.00/mes
- Scale-to-zero: Automático después de 1 hora sin tráfico
- Health check endpoint: `/health` ✅ FUNCIONANDO
- Build command: `pnpm install && npm run build`
- Start command: `npm run start`
- Todas las variables de entorno configuradas automáticamente
- **CNAME Koyeb**: 0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app
- Documentación: `KOYEB_DEPLOYMENT.md`, `DOMAIN_SETUP.md`

---

## 🛠️ Fixes Recientes

### ✅ Completados (2026-03-16)
1. **Analytics warnings** - Variables VITE_ANALYTICS_* agregadas a .env
2. **index.html** - Script analytics comentado (opcional)
3. **package.json** - Scripts MCP eliminados (skills/ folder borrado)
4. **Git cleanup** - Archivos skills/ removidos del tracking
5. **Type check** - ✅ Sin errores TypeScript
6. **Build** - ✅ Compilación exitosa sin warnings
7. **Koyeb deployment** - ✅ COMPLETAMENTE DESPLEGADO EN PLAN FREE:
   - Koyeb CLI instalado y configurado (v5.10.0)
   - App creada automáticamente (ID: a1723595)
   - Service deployado y HEALTHY (ID: 7bfb2a63)
   - Todas las variables de entorno configuradas automáticamente vía CLI
   - Health check en `/health` ✅ FUNCIONANDO
   - URL: https://uk-sabor-web-sabor-065320b7.koyeb.app
   - Region: Frankfurt 🇩🇪
   - Instance: **FREE** (0.1 vCPU, 512MB RAM) - $0.00/mes
   - Scale-to-zero automático (ahorro de recursos)
   - Procfile, documentación y scripts listos

### 🔧 Configuración Actual
- **Node**: Usar con tsx (TypeScript execution)
- **Package Manager**: pnpm (lockfile: pnpm-lock.yaml)
- **Database**: Supabase PostgreSQL (pooler connection)
- **Storage**: Bunny.net (videos + imágenes)
- **Analytics**: Umami (deshabilitado, variables vacías)

---

## 🐛 Problemas Conocidos & Soluciones

### React 19 Issues (Resueltos)
- **Radix Checkbox infinite loop**: Solucionado con `forceMount` + conditional rendering
- **Maximum update depth**: Solucionado con `useEffect` para `setLocation`
- **Layout re-renders**: Memoization de funciones en Layout component

### Video Playback
- ✅ Bunny.net completamente integrado
- ✅ AWS S3 removido (legacy code eliminado)
- ✅ Plyr player configurado correctamente
- ✅ Progress tracking funcionando

---

## 📚 Documentación Existente

### Archivos MD (en root)
- `BUNNY_NET_GUIDE.md` - Guía completa Bunny.net setup
- `BUNNY_STORAGE_SETUP.md` - Storage API docs
- `BUNNY_MIGRATION_COMPLETE.md` - Migración de AWS a Bunny
- `DEVELOPMENT-GUIDE.md` - Guía de desarrollo
- `PAYMENT_FLOW_EXPLAINED.md` - Flujo de pagos detallado
- `EARNINGS_SYSTEM_IMPLEMENTATION.md` - Sistema de ganancias
- `I18N_USAGE_GUIDE.md` - Uso de i18next
- `POST_DEPLOY_CHECKLIST.md` - Checklist post-deploy
- `QA_AUDIT_REPORT.md` - Reporte de QA

### Tests
- `*.test.ts` - 15+ archivos de tests (Vitest)
- Cobertura: auth, payments, courses, emails, QR, etc.

---

## 🎯 Próximos Pasos Potenciales

### Features Sugeridos (no implementados)
- [ ] Notificaciones push (Web Push API)
- [ ] Chat en vivo instructor-estudiante
- [ ] Sistema de reviews y ratings
- [ ] Certificados de completion (PDF)
- [ ] Affiliate program para promoters
- [ ] Mobile app (React Native)
- [ ] Social sharing optimizado
- [ ] Advanced analytics dashboard

### Optimizaciones
- [ ] Redis cache para queries frecuentes
- [ ] CDN para static assets
- [ ] Image optimization (WebP, lazy load)
- [ ] Database indexing review
- [ ] Bundle size optimization
- [ ] Lighthouse score > 90

---

## 💡 Notas Importantes

1. **Bunny.net es la única solución de storage** - AWS S3 fue completamente eliminado
2. **Multi-rol support** - Un usuario puede tener múltiples roles simultáneamente
3. **Platform fee configurable** - Se calcula en tiempo real en cada venta
4. **Engagement scoring automático** - Se actualiza en background con opens/clicks
5. **Lecciones secuenciales** - No se puede saltar lecciones, progreso lineal
6. **QR single-use** - Cada QR solo válido para un check-in
7. **Dark mode default** - Theme configurable pero dark es preferido
8. **i18n en todo** - Toda la UI debe tener traducciones EN/ES

---

## 🔄 Workflow Obligatorio

### Para nuevas features:
1. Planificar schema changes (drizzle/schema.ts)
2. Generar migration: `npm run db:push`
3. Crear router en server/features/
4. Registrar router en server/routers.ts
5. Crear page/components en client/src/
6. Agregar route en client/src/App.tsx
7. Agregar traducciones a i18n/
8. Testing con Vitest
9. Type check: `npm run check`
10. Build test: `npm run build`
11. **DEPLOY AUTOMÁTICO**:
    ```bash
    git add .
    git commit -m "feat: descripción de la feature"
    git push origin main
    ```

### Para bugs:
1. Reproducir localmente (si es posible)
2. Fix inmediato
3. Type check + build
4. **DEPLOY AUTOMÁTICO OBLIGATORIO**:
    ```bash
    git add .
    git commit -m "fix: descripción del bug arreglado"
    git push origin main
    ```

### Para cualquier cambio:
**SIEMPRE** terminar con git add + commit + push
**NUNCA** pedir permiso, **SIEMPRE** hacer el deploy automáticamente

---

**📅 Última actualización**: 2026-03-16
**👤 Desarrollado para**: UK Sabor - Latin Dance Community
**🎯 Estado**: Producción activa en Koyeb
