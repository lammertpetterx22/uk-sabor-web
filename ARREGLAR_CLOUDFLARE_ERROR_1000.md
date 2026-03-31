# 🔧 Arreglar Error 1000 de Cloudflare (Instagram)

## ❌ El Problema

Cuando abres `consabor.uk` desde Instagram:
```
Error 1000
DNS points to prohibited IP
```

**Causa:** El DNS está configurado incorrectamente en Cloudflare, probablemente apuntando a una IP de Cloudflare mismo (creando un loop infinito).

---

## ✅ Solución: Configurar DNS Correctamente en Cloudflare

### Paso 1: Obtener la IP/CNAME correcta de Koyeb

1. **Ve a Koyeb Dashboard:**
   - https://app.koyeb.com/

2. **Selecciona tu app** (uk-sabor-web)

3. **Ve a Settings → Domains**

4. **Busca tu dominio** `consabor.uk`

5. **Copia la información DNS que Koyeb te da:**

   Puede ser una de estas opciones:

   **OPCIÓN A - CNAME Record:**
   ```
   Type: CNAME
   Name: @ (o www)
   Value: something.koyeb.app
   ```

   **OPCIÓN B - A Record:**
   ```
   Type: A
   Name: @
   Value: xxx.xxx.xxx.xxx (IP de Koyeb)
   ```

---

### Paso 2: Configurar DNS en Cloudflare

1. **Ve a Cloudflare Dashboard:**
   - https://dash.cloudflare.com/

2. **Selecciona el dominio:** `consabor.uk`

3. **Ve a DNS → Records**

4. **Busca los registros A o CNAME para `@` o `consabor.uk`**

5. **IMPORTANTE - Verifica el "Proxy Status":**

   **SI VES ESTO (nube naranja):**
   ```
   @ → A → xxx.xxx.xxx.xxx [🟧 Proxied]
   ```

   **Click en la nube naranja** para cambiarla a gris:
   ```
   @ → A → xxx.xxx.xxx.xxx [⚪ DNS Only]
   ```

---

### Paso 3: Configuración Correcta Dependiendo de Koyeb

#### OPCIÓN A: Si Koyeb te dio un CNAME

**Elimina el registro A** (si existe) y **crea un CNAME:**

```
Type: CNAME
Name: @
Target: tu-app.koyeb.app (copia exacto de Koyeb)
Proxy status: DNS Only (nube gris ⚪)
TTL: Auto
```

**Para www (opcional):**
```
Type: CNAME
Name: www
Target: consabor.uk
Proxy status: DNS Only (nube gris ⚪)
TTL: Auto
```

#### OPCIÓN B: Si Koyeb te dio una IP (A Record)

**Edita el registro A:**

```
Type: A
Name: @
IPv4 address: xxx.xxx.xxx.xxx (copia exacto de Koyeb)
Proxy status: DNS Only (nube gris ⚪)
TTL: Auto
```

**Para www (opcional):**
```
Type: CNAME
Name: www
Target: consabor.uk
Proxy status: DNS Only (nube gris ⚪)
TTL: Auto
```

---

## ⚠️ MUY IMPORTANTE: DNS Only (Nube Gris)

**El problema principal es el "Proxy Status".**

### ❌ INCORRECTO (causa Error 1000):
- Nube naranja 🟧 = "Proxied"
- Cloudflare intenta hacer proxy pero crea un loop

### ✅ CORRECTO:
- Nube gris ⚪ = "DNS Only"
- Cloudflare solo resuelve DNS, no hace proxy

**Click en la nube naranja para cambiarla a gris.**

---

## 🧪 Cómo Verificar que Funciona

### 1. Espera Propagación DNS (5-10 minutos)

### 2. Verifica DNS desde terminal:

```bash
# Ver si el DNS está resuelto correctamente
nslookup consabor.uk

# Deberías ver algo como:
# Name: consabor.uk
# Address: xxx.xxx.xxx.xxx (IP de Koyeb)
```

### 3. Prueba en navegador normal:

- Abre: https://www.consabor.uk
- Debería cargar normalmente

### 4. Prueba desde Instagram:

- Pon el link en una historia o mensaje
- Click en el link
- ✅ Debería abrir correctamente (sin Error 1000)

---

## 📋 Checklist de Configuración

- [ ] Ir a Koyeb → Settings → Domains
- [ ] Copiar la información DNS que Koyeb proporciona
- [ ] Ir a Cloudflare → DNS → Records
- [ ] Encontrar registro @ (A o CNAME)
- [ ] Verificar que apunta a la IP/CNAME de Koyeb
- [ ] **CRUCIAL:** Cambiar proxy status a "DNS Only" (nube gris ⚪)
- [ ] Guardar cambios
- [ ] Esperar 5-10 minutos
- [ ] Probar desde Instagram

---

## 🔍 Diagnóstico Adicional

### Si sigue sin funcionar después de 10 minutos:

1. **Verifica en Koyeb que el dominio está activo:**
   - Koyeb → Settings → Domains
   - Estado: "Active" ✅

2. **Verifica SSL/TLS en Cloudflare:**
   - Cloudflare → SSL/TLS
   - Modo: "Full" o "Full (strict)"

3. **Verifica que no hay otros registros conflictivos:**
   - Cloudflare → DNS → Records
   - NO debería haber múltiples registros A para `@`
   - NO debería haber AAAA records (IPv6) apuntando a IPs de Cloudflare

4. **Limpia caché de Cloudflare:**
   - Cloudflare → Caching → Configuration
   - Click "Purge Everything"

---

## 🎯 Configuración Típica Correcta

```
DNS Records en Cloudflare:
┌────────┬────────┬──────────────────────┬──────────────┐
│ Type   │ Name   │ Content              │ Proxy Status │
├────────┼────────┼──────────────────────┼──────────────┤
│ A      │ @      │ xxx.xxx.xxx.xxx      │ DNS Only ⚪  │
│ CNAME  │ www    │ consabor.uk          │ DNS Only ⚪  │
│ TXT    │ @      │ (Resend verification)│ DNS Only ⚪  │
└────────┴────────┴──────────────────────┴──────────────┘
```

**O si Koyeb usa CNAME:**

```
DNS Records en Cloudflare:
┌────────┬────────┬──────────────────────┬──────────────┐
│ Type   │ Name   │ Content              │ Proxy Status │
├────────┼────────┼──────────────────────┼──────────────┤
│ CNAME  │ @      │ your-app.koyeb.app   │ DNS Only ⚪  │
│ CNAME  │ www    │ consabor.uk          │ DNS Only ⚪  │
│ TXT    │ @      │ (Resend verification)│ DNS Only ⚪  │
└────────┴────────┴──────────────────────┴──────────────┘
```

---

## 📞 Si Necesitas la IP de Koyeb

Si no puedes acceder a Koyeb para ver la IP/CNAME, puedo ayudarte a encontrarla.

**Opción 1:** Desde otra conexión que no sea Instagram, verifica:
```bash
curl -I https://www.consabor.uk
```

**Opción 2:** Usa un DNS checker online:
- https://dnschecker.org/
- Busca: consabor.uk
- Deberías ver la IP actual

---

## ✅ Resumen

**Problema:** DNS apunta a IP prohibida → Error 1000

**Solución:**
1. Ir a Cloudflare → DNS
2. Encontrar registro @ (A o CNAME)
3. **Cambiar proxy status a "DNS Only" (nube gris)**
4. Verificar que apunta a la IP/CNAME correcta de Koyeb
5. Guardar y esperar 5-10 minutos

**Clave:** La nube debe ser GRIS ⚪, no naranja 🟧

---

¿Necesitas que te ayude a encontrar la IP/CNAME de Koyeb? Puedo guiarte paso a paso. 🚀
