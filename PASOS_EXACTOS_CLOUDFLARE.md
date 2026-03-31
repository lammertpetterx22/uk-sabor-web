# 🎯 Pasos EXACTOS para Arreglar Error 1000

## 📋 Lo Que Veo en tu Cloudflare

```
❌ INCORRECTO (causando Error 1000):

CNAME  consabor.uk  →  0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app  [🟧 Proxied]
CNAME  www          →  consabor.uk                                             [🟧 Proxied]
```

**Ambos están en "Proxied" (nube naranja 🟧)** → Esto causa el Error 1000

---

## ✅ Cómo Arreglarlo (1 minuto)

### Paso 1: Cambiar `consabor.uk` a DNS Only

1. En la tabla DNS de Cloudflare
2. Busca la línea:
   ```
   CNAME  consabor.uk  →  0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app
   ```
3. **Click en "Edit"** (botón al final de la línea)
4. Verás un toggle/botón de **"Proxy status"**
5. **Click en la nube naranja 🟧** para cambiarla a **gris ⚪**
6. Debería decir: **"DNS only"**
7. Click **"Save"**

---

### Paso 2: Cambiar `www` a DNS Only

1. Busca la línea:
   ```
   CNAME  www  →  consabor.uk
   ```
2. **Click en "Edit"**
3. **Click en la nube naranja 🟧** para cambiarla a **gris ⚪**
4. Debería decir: **"DNS only"**
5. Click **"Save"**

---

## ✅ Resultado Esperado

Después de hacer los cambios, deberías ver:

```
✅ CORRECTO:

CNAME  consabor.uk  →  0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app  [⚪ DNS only]
CNAME  www          →  consabor.uk                                             [⚪ DNS only]
```

**Nube gris ⚪ = DNS only = ✅ Correcto**

---

## ⏱️ Espera 5-10 Minutos

Después de hacer los cambios:
- DNS necesita propagarse
- Instagram necesita actualizar su caché

---

## 🧪 Probar que Funciona

Después de 10 minutos:

1. **Abre Instagram**
2. **Pon el link** `https://www.consabor.uk` en mensaje o historia
3. **Click en el link**
4. ✅ **Debería abrir correctamente** (sin Error 1000)

---

## 📸 Referencia Visual

**ANTES (Error 1000):**
```
[🟧 Proxied]  ← Nube naranja (INCORRECTO)
```

**DESPUÉS (Funciona):**
```
[⚪ DNS only]  ← Nube gris (CORRECTO)
```

---

## ⚠️ NO Cambies los Otros Registros

**Deja estos como están (DNS only):**
- ✅ MX send → DNS only (correcto)
- ✅ TXT resend._domainkey → DNS only (correcto)
- ✅ TXT send → DNS only (correcto)

**Solo cambia los 2 CNAME a DNS only.**

---

## 🎯 Checklist

- [ ] Edit CNAME `consabor.uk`
- [ ] Cambiar de "Proxied" 🟧 a "DNS only" ⚪
- [ ] Save
- [ ] Edit CNAME `www`
- [ ] Cambiar de "Proxied" 🟧 a "DNS only" ⚪
- [ ] Save
- [ ] Esperar 10 minutos
- [ ] Probar link desde Instagram

---

¡Eso es todo! Después de estos cambios, el Error 1000 desaparecerá. 🚀
