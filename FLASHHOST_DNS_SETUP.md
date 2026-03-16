# Configuración DNS Flashhost para Koyeb

## Dominio: consabor.uk

### A Records - ACCIÓN REQUERIDA

**❌ BORRAR estos registros:**
```
Host: @  →  104.18.26.246  (Cloudflare viejo - REMOVE)
Host: @  →  104.18.27.246  (Cloudflare viejo - REMOVE)
```

**✅ AGREGAR este registro:**
```
Host: @
Points To: 81.99.162.48
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

2. En **A Records**:
   - Click **Remove** en el registro `@ → 104.18.26.246`
   - Click **Remove** en el registro `@ → 104.18.27.246`
   - Click **Add A Record**
     - Host Name: `@`
     - Points To: `81.99.162.48`
     - Click **Add**

3. En **CNAME Records**:
   - Click **Add CNAME Record**
     - Host Name: `www`
     - Points To: `0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app`
     - Click **Add**

4. **Guardar** todos los cambios

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
- Domain Status: PENDING (esperando DNS)
- Koyeb CNAME: `0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app`
- Koyeb IP: `81.99.162.48`

Una vez que cambies el DNS, Koyeb detectará automáticamente el dominio y emitirá el certificado SSL. El dominio pasará de PENDING a ACTIVE.
