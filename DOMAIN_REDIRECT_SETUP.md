# Configuración de Redirección de Dominio Raíz

## Estado Actual ✅

- **www.consabor.uk**: ACTIVO en Koyeb con SSL ✅
  - Domain ID: 957d89fa
  - Status: ACTIVE
  - SSL: ✅ Certificado emitido
  - URL: https://www.consabor.uk

## Problema

El dominio raíz `consabor.uk` (sin www) no puede usar CNAME/ALIAS directamente con Koyeb debido a limitaciones de DNS de Flashhost.

## Solución: Redirección HTTP

Configura una redirección de `consabor.uk` → `www.consabor.uk` en Flashhost.

### Pasos en Flashhost Panel

1. Ve a la página principal de **consabor.uk**

2. Busca la opción **"Add forwarding"** o **"Domain Forwarding"** o **"URL Redirect"**

3. Configura:
   - **From**: `consabor.uk` (o `@`)
   - **To**: `https://www.consabor.uk`
   - **Type**: **Permanent (301)** redirect
   - **Forward Path**: YES (mantener la ruta)
   - **HTTPS**: YES (si disponible)

4. Guarda los cambios

### Resultado Esperado

```
http://consabor.uk → https://www.consabor.uk
https://consabor.uk → https://www.consabor.uk (puede no tener SSL)
http://consabor.uk/events → https://www.consabor.uk/events
```

## Alternativa: A Record con App Redirect

Si Flashhost no tiene URL forwarding, puedes:

1. Mantener el A record actual (`@ → 81.99.162.48`)
2. El dominio raíz mostrará un error de SSL (esto es normal)
3. Los usuarios deberán usar `www.consabor.uk`

**Recomendación**: Siempre promociona `www.consabor.uk` como tu URL principal.

---

## Verificación

Una vez configurado el forwarding:

```bash
# Debería redirigir a www
curl -I http://consabor.uk
# Busca: Location: https://www.consabor.uk
```

En navegador:
- Visita: http://consabor.uk
- Debería redirigir a: https://www.consabor.uk ✅

---

## Estado de Dominios en Koyeb

```
www.consabor.uk     → ACTIVE ✅ (SSL activo)
sabor.consabor.uk   → Configurado en DNS (listo para usar)
consabor.uk (root)  → Redirect a www (configurar en Flashhost)
```

## Actualización de URLs en el Proyecto

Actualiza las URLs en tu proyecto para usar `www.consabor.uk`:

### Variables de Entorno en Koyeb

```bash
# Ya configuradas en Koyeb
BUNNY_ALLOWED_REFERRER=https://www.consabor.uk
OAUTH_SERVER_URL=https://www.consabor.uk
```

✅ URLs correctas - ya apuntan a www

---

## Próximos Pasos

1. **Usuario**: Configura URL forwarding en Flashhost panel
   - `consabor.uk` → `https://www.consabor.uk`
   - Redirect permanente (301)

2. **Promoción**: Usa `www.consabor.uk` en:
   - Redes sociales
   - Marketing materials
   - Business cards
   - Email signatures

3. **SEO**: El 301 redirect asegura que Google indexe correctamente www

---

**Dominio principal activo**: https://www.consabor.uk ✅
