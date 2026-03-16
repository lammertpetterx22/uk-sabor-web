# Configuración DNS Flashhost para Koyeb

## Dominio: consabor.uk

### ⚠️ ALIAS Records - ACCIÓN CRÍTICA REQUERIDA

**Koyeb requiere un ALIAS record para el dominio raíz (no un A record)**

**✅ AGREGAR este registro ALIAS:**
```
Host: @ (dejar en blanco o poner @)
Points To: 0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app
```

### A Records - BORRAR TODOS

**❌ BORRAR estos registros A (ya no necesarios):**
```
Host: @  →  104.18.26.246  (Cloudflare viejo - REMOVE)
Host: @  →  104.18.27.246  (Cloudflare viejo - REMOVE)
Host: @  →  81.99.162.48   (REMOVE también - usar ALIAS en su lugar)
```

### CNAME Records

**✅ YA EXISTE - NO TOCAR:**
```
Host: sabor
Points To: 0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app
```

**✅ AGREGAR nuevo:**
```
Host: www
Points To: 0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app
```

---

## Pasos en Flashhost Panel

1. Ve a **Advanced DNS** para `consabor.uk`

2. ⚠️ **PRIMERO - ALIAS Records** (CRÍTICO):
   - Click **Add ALIAS Record**
     - Points To: `0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app`
     - Click **Add**

3. En **A Records** - BORRAR TODOS:
   - Click **Remove** en el registro `@ → 104.18.26.246`
   - Click **Remove** en el registro `@ → 104.18.27.246`
   - Click **Remove** en el registro `@ → 81.99.162.48` (si existe)

4. En **CNAME Records** - AGREGAR www:
   - Click **Add CNAME Record**
     - Host Name: `www`
     - Points To: `0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app`
     - Click **Add**

5. **Guardar** todos los cambios

---

## Verificación

Una vez configurado, espera 5-30 minutos y verifica:

```bash
# Verificar dominio raíz
dig +short consabor.uk
# Debería mostrar: 81.99.162.48

# Verificar www
dig +short www.consabor.uk
# Debería mostrar: 81.99.162.48

# Verificar sabor subdomain
dig +short sabor.consabor.uk
# Debería mostrar: 81.99.162.48
```

Probar en navegador:
- https://consabor.uk → Debería cargar tu app
- https://www.consabor.uk → Debería cargar tu app
- https://sabor.consabor.uk → Debería cargar tu app

---

## Estado actual en Koyeb

- App: `parliamentary-bunnie`
- Service ID: `27a2455a`
- Status: HEALTHY ✅
- Domain ID: `d40863c4`
- Domain Status: **ERROR** (necesita ALIAS record, no A record)
- Koyeb CNAME: `0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app`
- Error actual: "CNAME record for this domain is not correctly configured"

**Solución**: Usar ALIAS record en lugar de A record para el dominio raíz (@).

Una vez que agregues el ALIAS record, Koyeb detectará automáticamente el dominio y emitirá el certificado SSL. El dominio pasará de ERROR → ACTIVE.
