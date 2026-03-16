# 🔧 Configuración única de Koyeb CLI

## ⚡ Setup rápido (hacer UNA SOLA VEZ)

### 1. Obtener tu API Token de Koyeb

1. Ve a: https://app.koyeb.com/account/api
2. Click en **"Create API Token"**
3. Dale un nombre: `uk-sabor-deployment`
4. Copia el token (se muestra solo una vez)

### 2. Configurar el token en tu terminal

**Opción A - Temporal (solo para esta sesión):**
```bash
export KOYEB_TOKEN="tu-token-aqui"
```

**Opción B - Permanente (recomendado):**
```bash
echo 'export KOYEB_TOKEN="tu-token-aqui"' >> ~/.zshrc
source ~/.zshrc
```

### 3. Ejecutar el deployment

```bash
./.koyeb-deploy.sh
```

Eso es todo. El script hará AUTOMÁTICAMENTE:
- ✅ Crear la app en Koyeb (si no existe)
- ✅ Configurar el build command
- ✅ Configurar el health check
- ✅ Deployar desde GitHub
- ✅ Redeploy automático si ya existe

---

## 🔐 Variables de entorno que debes configurar MANUALMENTE (solo la primera vez)

Después del primer deployment, ve a Koyeb Dashboard → Tu App → Settings → Environment y agrega:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret-muy-seguro
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

Las variables de Bunny.net YA están en el script, pero verifica que sean correctas.

---

## 🚀 Deployments futuros

Cada vez que hagas un fix o cambio:

```bash
git add .
git commit -m "fix: descripción"
git push origin main
```

Y luego ejecuta:
```bash
./.koyeb-deploy.sh
```

O mejor aún, crea un alias:
```bash
echo 'alias deploy-koyeb="git push origin main && ./.koyeb-deploy.sh"' >> ~/.zshrc
```

Y después solo ejecuta:
```bash
deploy-koyeb
```

---

## 📊 Comandos útiles de Koyeb CLI

```bash
# Ver logs en tiempo real
koyeb service logs uk-sabor-web/uk-sabor-web -f

# Ver estado del deployment
koyeb service get uk-sabor-web/uk-sabor-web

# Listar todas tus apps
koyeb app list

# Redeploy manual
koyeb service redeploy uk-sabor-web/uk-sabor-web
```

---

## ✅ Ya está todo configurado

- ✅ Koyeb CLI instalado (v5.10.0)
- ✅ Script de deployment creado (`.koyeb-deploy.sh`)
- ✅ Health check configurado (`/health`)
- ✅ Procfile listo
- ✅ Build optimizado

Solo necesitas:
1. Configurar tu KOYEB_TOKEN (una sola vez)
2. Ejecutar `./.koyeb-deploy.sh`

¡Eso es todo! 🎉
