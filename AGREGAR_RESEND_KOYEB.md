# 📧 Cómo Agregar Resend a Koyeb

## 🚀 Opción 1: Usando el Script Automático (MÁS FÁCIL)

### Paso 1: Obtén tu token de Koyeb

1. Ve a: https://app.koyeb.com/account/api
2. Click en **"Create API Token"**
3. Dale un nombre: `resend-setup`
4. Copia el token (se muestra solo una vez)

### Paso 2: Exporta el token

```bash
export KOYEB_TOKEN="tu-token-copiado-aqui"
```

### Paso 3: Ejecuta el script

```bash
./add-resend-to-koyeb.sh
```

¡Listo! Las variables de entorno se agregarán automáticamente y Koyeb redesplegará la aplicación.

---

## 🖱️ Opción 2: Desde el Dashboard de Koyeb (MANUAL)

### Paso 1: Ve al Dashboard

1. Abre: https://app.koyeb.com/
2. Busca tu app: **uk-sabor-web**
3. Click en la app

### Paso 2: Ve a Settings → Environment

1. En el menú lateral, click en **"Settings"**
2. Luego click en **"Environment"**

### Paso 3: Agrega las Variables

Click en **"Add variable"** y agrega estas 2 variables:

**Variable 1:**
```
Name: RESEND_API_KEY
Value: re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA
```

**Variable 2:**
```
Name: RESEND_FROM_EMAIL
Value: UK Sabor <noreply@consabor.uk>
```

### Paso 4: Guarda y Redespliega

1. Click en **"Save"**
2. Koyeb redesplegará automáticamente la app
3. Espera 2-3 minutos para que termine el deployment

---

## ✅ Verificar que Funciona

### Opción A: Registra un usuario de prueba

1. Ve a: https://www.consabor.uk/register
2. Registra un nuevo usuario
3. Revisa el email de bienvenida en tu bandeja de entrada

### Opción B: Revisa los logs de Koyeb

```bash
koyeb service logs uk-sabor-web/uk-sabor-web -f
```

Busca estas líneas:
```
[EMAIL] Sent successfully to user@example.com: 🎉 ¡Bienvenido a UK Sabor!
```

---

## 🎯 Valores Exactos a Copiar

Por si acaso, aquí están los valores exactos que debes pegar:

**RESEND_API_KEY:**
```
re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA
```

**RESEND_FROM_EMAIL:**
```
UK Sabor <noreply@consabor.uk>
```

---

## 📧 Qué Emails se Enviarán

Una vez configurado, se enviarán automáticamente:

| Evento | Email |
|--------|-------|
| Usuario se registra | 🎉 Bienvenida |
| Usuario compra ticket | 🎫 QR Code |
| Pago confirmado | 💳 Confirmación |

---

## ⚠️ Troubleshooting

### "Email no llega"

1. **Revisa spam:** Los primeros emails pueden ir a spam
2. **Verifica variables:** Asegúrate de copiar exactamente los valores
3. **Revisa logs:** Busca errores en los logs de Koyeb

### "Emails llegan desde onboarding@resend.dev"

Esto es normal hasta que verifiques el dominio. Para usar `noreply@consabor.uk`:

1. Ve a: https://resend.com/domains
2. Agrega el dominio `consabor.uk`
3. Configura los registros DNS (SPF, DKIM, DMARC)

Mientras tanto, los emails funcionan perfectamente desde `onboarding@resend.dev`.

---

## 🔗 Links Útiles

- **Koyeb Dashboard:** https://app.koyeb.com/
- **Koyeb API Tokens:** https://app.koyeb.com/account/api
- **Resend Dashboard:** https://resend.com/emails
- **Resend Domains:** https://resend.com/domains

---

✅ **Una vez agregadas las variables, el sistema de emails estará 100% funcional!**
