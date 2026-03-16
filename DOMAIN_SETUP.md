# 🌐 Configuración de Dominio Personalizado - consabor.uk

## ✅ Configuración en Koyeb (Ya está hecha automáticamente)

- Dominio agregado: `consabor.uk`
- CNAME requerido: `0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app`
- Variables de entorno actualizadas con el nuevo dominio

---

## 📋 PASOS QUE DEBES HACER EN FLASHHOST

### 1. Login en Flashhost

1. Ve a tu panel de control de Flashhost
2. Busca la sección **DNS Management** o **Manage Domains**
3. Selecciona el dominio `consabor.uk`

### 2. Configurar los registros DNS

Agrega estos **DOS registros DNS**:

#### Registro 1: CNAME para www

```
Tipo: CNAME
Nombre/Host: www
Valor/Apunta a: 0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app
TTL: 3600 (o dejar por defecto)
```

#### Registro 2: A para dominio raíz

```
Tipo: A
Nombre/Host: @ (o dejar vacío para root domain)
Valor/Apunta a: 81.99.162.48
TTL: 3600 (o dejar por defecto)
```

### 3. Guardar cambios

- Asegúrate de **guardar/aplicar** los cambios en Flashhost
- La propagación DNS puede tardar entre **5 minutos y 48 horas** (generalmente ~10 minutos)

---

## 🔍 Verificar la configuración

### Después de 10-15 minutos, verifica:

```bash
# Verificar CNAME de www
dig www.consabor.uk CNAME +short
# Debe mostrar: 0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app

# Verificar A record del dominio raíz
dig consabor.uk A +short
# Debe mostrar: 81.99.162.48
```

### O usa herramientas web:
- https://dnschecker.org/
- Busca `consabor.uk` y `www.consabor.uk`

---

## ✅ Una vez que el DNS esté propagado

### Tu app estará disponible en:

- ✅ https://consabor.uk
- ✅ https://www.consabor.uk
- ✅ https://uk-sabor-web-sabor-065320b7.koyeb.app (URL de Koyeb, seguirá funcionando)

### Características:

- 🔒 **HTTPS automático** - Koyeb provee certificado SSL gratis
- 🌍 **CDN global** - Distribuido en todo el mundo
- ⚡ **Health checks** - Endpoint `/health` funcionando
- 🎥 **Videos Bunny.net** - Configurados para permitir consabor.uk

---

## ⚠️ Problemas comunes

### "Domain verification failed" en Koyeb

**Solución**: Espera más tiempo (hasta 48h) o verifica que:
- Los registros DNS estén correctamente escritos (sin espacios extras)
- El TTL no sea muy alto (usa 3600 o menos)

### "SSL certificate error"

**Solución**: Koyeb genera el certificado SSL automáticamente después de verificar el dominio. Puede tardar hasta 1 hora.

### Videos no cargan en el dominio nuevo

**Solución**: Ya configuré Bunny.net para permitir `https://consabor.uk`. Si hay problemas:
1. Ve a https://dash.bunny.net/
2. Stream Library → Security
3. Verifica que `consabor.uk` esté en la lista de dominios permitidos

---

## 📊 Estado actual del dominio en Koyeb

```
Domain: consabor.uk
Status: ERROR (esperando configuración DNS)
CNAME Required: 0f046ddc-e64b-4870-b678-b5acea874f43.cname.koyeb.app
```

Después de configurar el DNS en Flashhost, el status cambiará a **ACTIVE** ✅

---

## 🔄 Próximos pasos

1. **Tú**: Configura los 2 registros DNS en Flashhost (arriba)
2. **Espera**: 10-30 minutos para propagación DNS
3. **Yo verificaré**: Automáticamente cuando me digas que ya lo configuraste
4. **Resultado**: consabor.uk apuntando a tu app en Koyeb

---

**Nota**: Una vez que esté configurado, cada vez que hagas `git push`, la app se re-desplegará automáticamente y seguirá funcionando en consabor.uk.
