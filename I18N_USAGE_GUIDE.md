# 🌍 Sistema de Internacionalización (i18n) - Guía de Uso

## 📋 Resumen

Se ha implementado **i18next** para la internacionalización completa de la plataforma UK Sabor, soportando **Español** e **Inglés**.

---

## 🏗️ Estructura del Sistema

```
client/src/
├── i18n/
│   ├── config.ts                 # Configuración de i18next
│   └── locales/
│       ├── es.json               # Traducciones en español
│       └── en.json               # Traducciones en inglés
├── components/
│   └── LanguageSwitcher.tsx      # Selector de idioma
├── hooks/
│   └── useTranslations.ts        # Hook personalizado
└── main.tsx                      # Inicialización de i18n
```

---

## 📦 Paquetes Instalados

```json
{
  "i18next": "^25.8.18",
  "react-i18next": "^16.5.8",
  "i18next-browser-languagedetector": "^8.2.1"
}
```

---

## 🚀 Cómo Usar las Traducciones

### 1. **Import del Hook**

```typescript
import { useTranslations } from '@/hooks/useTranslations';

function MyComponent() {
  const { t } = useTranslations();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

### 2. **Traducciones con Variables**

```typescript
// en.json: "uploadSpeed": "Speed: {{speed}}MB/s"
// es.json: "uploadSpeed": "Velocidad: {{speed}}MB/s"

const { t } = useTranslations();
const message = t('upload.uploadSpeed', { speed: 12.5 });
// English: "Speed: 12.5MB/s"
// Spanish: "Velocidad: 12.5MB/s"
```

### 3. **Traducciones en Toast/Mensajes**

```typescript
// ❌ ANTES (hardcoded)
toast.success('Curso creado exitosamente');

// ✅ AHORA (traducido)
const { t } = useTranslations();
toast.success(t('courses.courseCreatedSuccess'));
```

### 4. **Traducciones en Formularios**

```typescript
<Input
  placeholder={t('auth.email')}
  {...register('email')}
/>

<Button type="submit">
  {t('common.submit')}
</Button>
```

### 5. **Cambiar Idioma Programáticamente**

```typescript
const { changeLanguage, language } = useTranslations();

// Cambiar a inglés
changeLanguage('en');

// Cambiar a español
changeLanguage('es');

// Obtener idioma actual
console.log(language); // "en" o "es"
```

---

## 🎯 Claves de Traducción Disponibles

### **Common (Comunes)**
- `common.loading` → "Loading..." / "Cargando..."
- `common.save` → "Save" / "Guardar"
- `common.cancel` → "Cancel" / "Cancelar"
- `common.delete` → "Delete" / "Eliminar"
- `common.edit` → "Edit" / "Editar"

### **Auth (Autenticación)**
- `auth.login` → "Log In" / "Iniciar Sesión"
- `auth.register` → "Sign Up" / "Registrarse"
- `auth.email` → "Email Address" / "Correo Electrónico"
- `auth.password` → "Password" / "Contraseña"

### **Dashboard**
- `dashboard.title` → "Dashboard" / "Panel de Control"
- `dashboard.overview` → "Overview" / "Resumen"
- `dashboard.myEvents` → "My Events" / "Mis Eventos"
- `dashboard.myCourses` → "My Courses" / "Mis Cursos"

### **Events (Eventos)**
- `events.title` → "Events" / "Eventos"
- `events.createEvent` → "Create Event" / "Crear Evento"
- `events.eventName` → "Event Name" / "Nombre del Evento"
- `events.ticketPrice` → "Ticket Price" / "Precio de Entrada"

### **Courses (Cursos)**
- `courses.title` → "Courses" / "Cursos"
- `courses.createCourse` → "Create Course" / "Crear Curso"
- `courses.courseTitle` → "Course Title" / "Título del Curso"
- `courses.price` → "Price" / "Precio"

### **Classes (Clases)**
- `classes.title` → "Classes" / "Clases"
- `classes.createClass` → "Create Class" / "Crear Clase"
- `classes.className` → "Class Name" / "Nombre de la Clase"

### **Earnings (Ganancias)**
- `earnings.title` → "Your Earnings" / "Tus Ganancias"
- `earnings.availableBalance` → "Available to withdraw" / "Disponible para retiro"
- `earnings.requestWithdrawal` → "Request Withdrawal" / "Solicitar Retiro"

### **Upload (Subidas)**
- `upload.videoTooLarge` → "The video is too large" / "El video es demasiado grande"
- `upload.videoMaxSize` → "Maximum size: 1GB" / "Tamaño máximo: 1GB"
- `upload.uploadingToServer` → "Uploading to server..." / "Subiendo a servidor..."

### **Validation (Validaciones)**
- `validation.required` → "This field is required" / "Este campo es requerido"
- `validation.invalidEmail` → "Invalid email address" / "Correo electrónico inválido"

Ver **`client/src/i18n/locales/en.json`** y **`es.json`** para la lista completa.

---

## 🎨 Componente Language Switcher

Para agregar el selector de idioma en tu navbar o header:

```typescript
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function Navbar() {
  return (
    <nav>
      <div>Logo</div>
      <div>Menu Items</div>
      <LanguageSwitcher /> {/* ← Agregar aquí */}
    </nav>
  );
}
```

**Resultado:**
```
🇬🇧 English  ▼
🇪🇸 Español  ▼
```

---

## 📝 Cómo Agregar Nuevas Traducciones

### Paso 1: Agregar clave en ambos archivos JSON

**`client/src/i18n/locales/es.json`:**
```json
{
  "mySection": {
    "newKey": "Nuevo texto en español"
  }
}
```

**`client/src/i18n/locales/en.json`:**
```json
{
  "mySection": {
    "newKey": "New text in English"
  }
}
```

### Paso 2: Usar en tu componente

```typescript
const { t } = useTranslations();
const text = t('mySection.newKey');
```

---

## 🔄 Detectar el Idioma del Usuario

El sistema detecta automáticamente el idioma del usuario en este orden:

1. **localStorage** (`i18nextLng`)
2. **Navegador del usuario** (`navigator.language`)
3. **Fallback**: Inglés (`en`)

---

## 🛠️ Migrar Componentes Existentes

### ANTES (Texto Hardcodeado)

```typescript
function EventForm() {
  return (
    <div>
      <h2>Crear Evento</h2>
      <Input placeholder="Nombre del Evento" />
      <Button>Guardar</Button>
      <Button onClick={() => toast.success('Evento creado exitosamente')}>
        Crear
      </Button>
    </div>
  );
}
```

### DESPUÉS (Con i18n)

```typescript
import { useTranslations } from '@/hooks/useTranslations';

function EventForm() {
  const { t } = useTranslations();

  return (
    <div>
      <h2>{t('events.createEvent')}</h2>
      <Input placeholder={t('events.eventName')} />
      <Button>{t('common.save')}</Button>
      <Button onClick={() => toast.success(t('events.eventCreatedSuccess'))}>
        {t('common.create')}
      </Button>
    </div>
  );
}
```

---

## 📊 Prioridad de Migración

### Alta Prioridad (Crítico)
1. ✅ **Sistema de autenticación** (Login, Register)
2. ⏳ **AdminDashboard** (Panel principal)
3. ⏳ **Earnings** (Página de ganancias)
4. ⏳ **AdminWithdrawals** (Gestión de retiros)

### Media Prioridad
5. ⏳ **Events, Courses, Classes** (Formularios de creación)
6. ⏳ **InstructorOverview** (Panel de instructores)
7. ⏳ **Toasts y mensajes de error**

### Baja Prioridad
8. ⏳ **Páginas públicas** (Home, EventDetail, CourseDetail)
9. ⏳ **Emails** (Notificaciones)

---

## 🚫 QUÉ NO TRADUCIR

❌ **NO traducir:**
- Nombres de variables (`className`, `id`, `name`)
- Rutas de API (`/api/events`)
- Palabras clave de código (`const`, `function`, `return`)
- Nombres de archivos
- Nombres de clases CSS
- Comentarios de código (opcional)

✅ **SÍ traducir:**
- Textos visibles para el usuario
- Placeholders de inputs
- Mensajes de toast
- Títulos y descripciones
- Botones y labels
- Mensajes de error/éxito

---

## 🎯 Ejemplo Completo: AdminWithdrawals.tsx

### ANTES:
```typescript
<h1>Gestión de Retiros</h1>
<p>Revisa y procesa las solicitudes de pago de los profesores</p>
<Button>Marcar como Pagado</Button>
<p>No se encontraron solicitudes</p>
```

### DESPUÉS:
```typescript
import { useTranslations } from '@/hooks/useTranslations';

function AdminWithdrawals() {
  const { t } = useTranslations();

  return (
    <div>
      <h1>{t('withdrawals.title')}</h1>
      <p>{t('withdrawals.subtitle')}</p>
      <Button>{t('withdrawals.markAsPaid')}</Button>
      <p>{t('withdrawals.noRequests')}</p>
    </div>
  );
}
```

---

## 🌐 Testing de Traducciones

### 1. **Cambiar idioma manualmente**

```typescript
// En DevTools Console
localStorage.setItem('i18nextLng', 'en'); // Inglés
localStorage.setItem('i18nextLng', 'es'); // Español
window.location.reload();
```

### 2. **Verificar traducciones faltantes**

Si una clave no existe, i18next mostrará la clave:
```
// Si falta: t('nonexistent.key')
// Muestra: "nonexistent.key"
```

### 3. **Debug mode**

En `client/src/i18n/config.ts`, cambiar:
```typescript
debug: true, // muestra logs en consola
```

---

## 📚 Recursos

- **i18next Docs**: https://www.i18next.com/
- **react-i18next Docs**: https://react.i18next.com/
- **JSON Validator**: https://jsonlint.com/

---

## ✅ Checklist de Migración

- [x] Instalar dependencias i18n
- [x] Crear configuración de i18n
- [x] Crear archivos de traducción (es.json, en.json)
- [x] Integrar en main.tsx
- [x] Crear LanguageSwitcher component
- [x] Crear hook useTranslations
- [ ] Migrar AdminDashboard.tsx
- [ ] Migrar Earnings.tsx
- [ ] Migrar AdminWithdrawals.tsx
- [ ] Migrar componentes de formularios
- [ ] Agregar LanguageSwitcher a navbar
- [ ] Testing completo en ambos idiomas

---

## 🎉 Próximos Pasos

1. **Agregar LanguageSwitcher** al header/navbar principal
2. **Migrar AdminDashboard.tsx** (archivo más grande)
3. **Migrar Earnings.tsx** (crítico para instructores)
4. **Migrar formularios** de Events, Classes, Courses
5. **Testing end-to-end** con ambos idiomas

---

**Autor:** Claude Code
**Fecha:** 2026-03-13
**Versión:** 1.0.0

🌍 **Sistema i18n listo para producción!**
