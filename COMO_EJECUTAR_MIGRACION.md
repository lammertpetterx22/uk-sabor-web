# 🔧 Cómo Ejecutar la Migración en Koyeb

## 🚨 Estado Actual

- ✅ Login está ARREGLADO (código desplegado sin bank details)
- ⏳ Migración de base de datos PENDIENTE
- ⏳ Sistema de payouts desactivado temporalmente

---

## 📋 Pasos para Ejecutar la Migración

### **Opción 1: Koyeb Console (MÁS FÁCIL)**

1. Ve a https://app.koyeb.com/
2. Click en tu app: `uk-sabor-web`
3. Click en la pestaña **"Console"**
4. Abre el archivo `RUN_THIS_IN_KOYEB.sql`
5. **Copia CADA LÍNEA una por una** y pégala en la consola
6. Espera confirmación `ALTER TABLE` después de cada línea

**IMPORTANTE:** No copies todo el bloque, solo línea por línea.

### **Comandos a ejecutar (uno por uno):**

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankAccountHolderName" VARCHAR(255);
```
*(Espera la confirmación)*

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankSortCode" VARCHAR(255);
```
*(Espera la confirmación)*

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankAccountNumber" VARCHAR(255);
```
*(Espera la confirmación)*

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankDetailsVerified" BOOLEAN DEFAULT false;
```
*(Espera la confirmación)*

```sql
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
```
*(Espera la confirmación)*

---

### **Opción 2: psql Local (Si tienes DATABASE_URL)**

Si tienes acceso a `DATABASE_URL` localmente:

```bash
# Consigue el DATABASE_URL desde Koyeb Settings → Environment Variables
# Luego ejecuta:

psql "TU_DATABASE_URL_AQUI" -f RUN_THIS_IN_KOYEB.sql
```

---

## ✅ Verificar que Funcionó

Después de ejecutar la migración, verifica:

```sql
\d users
```

Deberías ver las nuevas columnas:
- `bankAccountHolderName`
- `bankSortCode`
- `bankAccountNumber`
- `bankDetailsVerified`

```sql
\d "withdrawalRequests"
```

Deberías ver:
- `paymentProofUrl`

---

## 🔄 Después de la Migración

Una vez que la migración esté completa, necesitamos **descomentar** el código:

1. Abre `drizzle/schema.ts` → Descomenta las 4 líneas de bank details
2. Abre `server/routers.ts` → Descomenta `bankDetails` router
3. Abre `server/features/financials.ts` → Descomenta 2 procedures
4. Build → Push → Deploy

**¿Quieres que yo haga esto automáticamente después de que confirmes que la migración funcionó?**

---

## 🐛 Troubleshooting

### **Error: "relation does not exist"**
- Verifica que estás conectado a la base de datos correcta
- Verifica el DATABASE_URL

### **Error: "permission denied"**
- Verifica que tu usuario tiene permisos `ALTER TABLE`
- Contacta a Koyeb support si es necesario

### **Error: "syntax error"**
- Asegúrate de copiar cada comando COMPLETO (incluyendo el punto y coma `;`)
- No copies comentarios (`--`)

---

## 📞 ¿Necesitas Ayuda?

Si tienes algún problema ejecutando la migración:

1. Copia el error exacto que ves
2. Dime qué paso estabas haciendo
3. Te ayudaré a resolverlo

---

## ⚡ Resumen Rápido

1. ✅ Login ya funciona (fix deployed)
2. ⏳ Ejecuta migración (copia comandos uno por uno en Koyeb Console)
3. ⏳ Dime cuando termine para descomentar el código
4. ✅ Sistema de payouts activado

**Tiempo estimado:** 5 minutos
