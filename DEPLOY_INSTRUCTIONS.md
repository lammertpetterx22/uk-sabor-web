# 🚀 Deploy Instructions - Koyeb

## ✅ Código ya está en GitHub
- **Último commit:** `b850f40` - Complete cash payment system
- **Branch:** `main`
- **Remote:** https://github.com/lammertpetterx22/uk-sabor-web.git

---

## 🔄 Auto-Deploy (Recomendado)

Koyeb debería detectar automáticamente el push y hacer deploy.

**Para verificar:**
1. Ve a: https://app.koyeb.com/
2. Busca tu servicio "uk-sabor-web" o similar
3. Verifica que haya un nuevo deployment en progreso

**Tiempo estimado:** 3-5 minutos

---

## 🆘 Si Auto-Deploy NO funcionó

### Opción A: Redeploy desde Koyeb Dashboard

1. Ve a https://app.koyeb.com/
2. Click en tu servicio
3. Click en "Redeploy" o "Deploy from GitHub"
4. Selecciona branch `main`
5. Click "Deploy"

### Opción B: Trigger deploy manualmente via CLI

Si tienes Koyeb CLI instalado:

```bash
# Install Koyeb CLI (si no lo tienes)
curl -fsSL https://koyeb.com/install-cli.sh | sh

# Login
koyeb login

# Redeploy
koyeb service redeploy <SERVICE_NAME>
```

### Opción C: Force push (último recurso)

```bash
# Crear commit vacío para forzar deploy
git commit --allow-empty -m "chore: trigger Koyeb redeploy"
git push origin main
```

---

## 🔍 Verificar Deploy Exitoso

Una vez que el deploy termine:

### 1. Check Health
```bash
curl https://www.consabor.uk/api/health
# Debería retornar: {"status":"ok"}
```

### 2. Check Database Migration
- La migración ya fue aplicada localmente: ✅
- Koyeb debería usar la misma DB (compartida)
- Verifica que las nuevas columnas existan

### 3. Test Payment Flow
1. Ve a un evento: https://www.consabor.uk/events
2. Verifica que aparezcan los botones de pago correctos
3. Haz una reserva de prueba con cash

---

## 📋 Checklist Post-Deploy

- [ ] Servicio está "Running" en Koyeb
- [ ] URL responde: https://www.consabor.uk
- [ ] No hay errores en logs de Koyeb
- [ ] Nuevas features visibles en frontend
- [ ] Payment method selector funciona
- [ ] Cash reservations crean QR codes
- [ ] Staff scanner confirma pagos cash

---

## 🐛 Si hay errores

**Revisar logs en Koyeb:**
1. Ve a tu servicio en Koyeb
2. Click en "Logs"
3. Busca errores relacionados con:
   - Database connection
   - Missing environment variables
   - Build errors

**Variables de entorno necesarias:**
- ✅ `DATABASE_URL` (ya existe)
- ✅ `BUNNY_API_KEY` (opcional, para image upload)
- ✅ `BUNNY_STORAGE_ZONE` (opcional)
- ✅ `JWT_SECRET` (ya existe)
- ✅ Todas las demás variables existentes

---

## 📊 Nueva Funcionalidad Deployada

### Cash Payment System ✅
- Usuarios pueden reservar y pagar en puerta
- QR codes generados automáticamente
- Staff scanner confirma pagos cash
- Emails de confirmación
- Dual payment method selection

### Archivos clave:
- `server/features/events.ts` - Cash reservation endpoint
- `server/features/classes.ts` - Cash reservation endpoint
- `client/src/pages/EventDetail.tsx` - Payment method UI
- `client/src/pages/ReservationConfirmation.tsx` - Confirmation page
- `drizzle/0010_green_stardust.sql` - Database migration

---

## 🎉 Estado Actual

**Commit deployado:** `b850f40`
**Features nuevas:** 6 componentes, 4 endpoints, 1 migration
**Compilación:** ✅ Exitosa (0 errores)
**Tests:** ✅ TypeScript passing
**Bundle size:** 475.53 kB (gzip: 140.29 kB)

---

**Última actualización:** 2026-04-02
**Mantenedor:** Claude Code + Lammert
