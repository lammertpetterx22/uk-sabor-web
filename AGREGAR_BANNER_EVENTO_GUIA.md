# 📸 Agregar Banner + Portada a Eventos - Guía Completa

## 🎯 Objetivo

Que cuando se cree/edite un evento, se puedan subir **2 imágenes**:

1. **Portada (Cover/Flyer)** - Formato vertical 17:25 (1275x1875) → Se muestra en las tarjetas
2. **Banner** - Formato horizontal (1920x400 aprox) → Se muestra arriba en la página del evento

---

## ✅ Paso 1: Base de Datos (YA COMPLETADO)

✅ **Ya agregué el campo `bannerUrl` a la tabla `events`**

```sql
ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;
```

✅ **Ya ejecuté la migración en la base de datos local**

---

## 📝 Paso 2: Modificar el Formulario de Eventos

**Archivo:** `client/src/components/admin/EventFormCard.tsx`

### 2.1 Agregar estados para banner

**Busca la línea ~44:**
```typescript
const imageInputRef = useRef<HTMLInputElement>(null);
```

**Agrega debajo:**
```typescript
const bannerInputRef = useRef<HTMLInputElement>(null);
```

### 2.2 Agregar campos al formData

**Busca las líneas 78-82 (dentro del if editing):**
```typescript
imageUrl: editingEvent.imageUrl || "",
imagePreview: editingEvent.imageUrl || "",
```

**Agrega debajo:**
```typescript
bannerUrl: editingEvent.bannerUrl || "",
bannerPreview: editingEvent.bannerUrl || "",
```

**Busca las líneas 92-93 (return inicial):**
```typescript
imageUrl: "",
imagePreview: "",
```

**Agrega debajo:**
```typescript
bannerUrl: "",
bannerPreview: "",
```

**Busca las líneas 111-112 (resetForm):**
```typescript
imageUrl: "",
imagePreview: "",
```

**Agrega debajo:**
```typescript
bannerUrl: "",
bannerPreview: "",
```

### 2.3 Agregar estados de carga

**Busca la línea ~99:**
```typescript
const [uploading, setUploading] = useState(false);
```

**Agrega debajo:**
```typescript
const [uploadingBanner, setUploadingBanner] = useState(false);
```

**Busca la línea ~100:**
```typescript
const [cropSrc, setCropSrc] = useState<string | null>(null);
```

**Agrega debajo:**
```typescript
const [cropSrcBanner, setCropSrcBanner] = useState<string | null>(null);
```

### 2.4 Agregar handler para banner

**Busca la función `handleCropComplete` (línea ~134):**

**Agrega DESPUÉS de esa función:**
```typescript
const handleBannerCropComplete = async (croppedDataUrl: string) => {
  setCropSrcBanner(null);
  setFormData(prev => ({ ...prev, bannerPreview: croppedDataUrl, bannerUrl: "" }));
  setUploadingBanner(true);
  try {
    const fileName = editingEvent
      ? `event-banner-${editingEvent.id}-${Date.now()}.jpg`
      : `event-banner-new-${Date.now()}.jpg`;

    const result = await uploadFileMutation.mutateAsync({
      base64Image: croppedDataUrl,
      fileName,
      mimeType: "image/jpeg",
      folder: "events",
    });
    setFormData(prev => ({ ...prev, bannerUrl: result.url }));
    toast.success("✅ Banner subido exitosamente");
  } catch (uploadErr: any) {
    toast.error(`Error al subir banner: ${uploadErr.message}`);
    setFormData(prev => ({ ...prev, bannerPreview: "", bannerUrl: "" }));
  } finally {
    setUploadingBanner(false);
  }
};
```

### 2.5 Agregar handler para seleccionar banner

**Busca `handleImageSelect` (línea ~119):**

**Agrega DESPUÉS de esa función:**
```typescript
const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast.error("Por favor selecciona un archivo de imagen");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    setCropSrcBanner(reader.result as string);
  };
  reader.readAsDataURL(file);
};
```

### 2.6 Actualizar create/update mutations

**Busca la línea ~178 (dentro de checkEventEntitlement):**
```typescript
imageUrl: formData.imageUrl,
```

**Agrega debajo:**
```typescript
bannerUrl: formData.bannerUrl,
```

**Busca la línea ~207 (dentro de handleSubmit):**
```typescript
imageUrl: formData.imageUrl,
```

**Agrega debajo:**
```typescript
bannerUrl: formData.bannerUrl,
```

### 2.7 Agregar UI para banner

**Busca la sección "Image Upload Section" (línea ~439):**

**DESPUÉS de la sección completa de "Imagen del Evento", agrega:**

```tsx
<Separator className="bg-border/50" />

{/* Banner Upload Section */}
<div className="space-y-4">
  <div className="flex items-center gap-2 mb-4">
    <ImageIcon className="h-4 w-4 text-accent" />
    <h3 className="font-semibold text-foreground">Banner del Evento (Horizontal)</h3>
    <Badge variant="outline" className="text-xs">Opcional</Badge>
  </div>

  {formData.bannerPreview ? (
    <div className="space-y-4">
      <div className="relative group rounded-xl overflow-hidden border-2 border-accent/30">
        <img
          src={formData.bannerPreview}
          alt="Banner preview"
          className="w-full h-48 object-cover"
        />
        {!formData.bannerUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-white mx-auto mb-3" />
              <p className="text-white font-medium">Subiendo banner...</p>
            </div>
          </div>
        )}
        {formData.bannerUrl && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-green-500 text-white border-0 shadow-lg">
              ✓ Banner subido
            </Badge>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => bannerInputRef.current?.click()}
          disabled={!formData.bannerUrl}
          className="flex-1"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Cambiar Banner
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFormData({ ...formData, bannerUrl: "", bannerPreview: "" })}
          className="text-red-600 hover:text-red-700 hover:border-red-300"
        >
          <X className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
      </div>
    </div>
  ) : (
    <div>
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        onChange={handleBannerSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => bannerInputRef.current?.click()}
        className="w-full h-32 border-dashed border-2 hover:border-accent hover:bg-accent/5 transition-colors"
      >
        <div className="text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-foreground/50" />
          <p className="text-sm font-medium mb-1">Subir Banner (Horizontal)</p>
          <p className="text-xs text-foreground/50">
            Recomendado: 1920x400px o similar
          </p>
        </div>
      </Button>
    </div>
  )}
</div>
```

### 2.8 Agregar componente de cropper para banner

**Busca donde está el ImageCropperModal al final del componente (línea ~540 aprox):**

```tsx
{cropSrc && (
  <ImageCropperModal
    imageSrc={cropSrc}
    onCropComplete={handleCropComplete}
    onCancel={() => setCropSrc(null)}
  />
)}
```

**Agrega DEBAJO:**
```tsx
{cropSrcBanner && (
  <ImageCropperModal
    imageSrc={cropSrcBanner}
    onCropComplete={handleBannerCropComplete}
    onCancel={() => setCropSrcBanner(null)}
    aspectRatio={19 / 4}
  />
)}
```

---

## 📝 Paso 3: Actualizar el Backend

**Archivo:** `server/features/admin.ts`

**Busca donde se crean/actualizan eventos** (probablemente líneas 200-300):

### En createEvent:

**Busca:**
```typescript
imageUrl: z.string().optional(),
```

**Agrega debajo:**
```typescript
bannerUrl: z.string().optional(),
```

**Busca en el insert:**
```typescript
imageUrl: input.imageUrl,
```

**Agrega debajo:**
```typescript
bannerUrl: input.bannerUrl,
```

### En updateEvent:

**Busca:**
```typescript
imageUrl: z.string().optional(),
```

**Agrega debajo:**
```typescript
bannerUrl: z.string().optional(),
```

**Busca en el update:**
```typescript
imageUrl: input.imageUrl,
```

**Agrega debajo:**
```typescript
bannerUrl: input.bannerUrl,
```

---

## 📝 Paso 4: Actualizar la Página de Detalle del Evento

**Archivo:** `client/src/pages/EventDetail.tsx`

**Busca donde se muestra la imagen del evento** (probablemente línea 80-120):

**REEMPLAZA la sección de la imagen con:**

```tsx
{/* Event Banner (if exists) or Cover Image */}
{event.bannerUrl ? (
  <div className="relative h-80 overflow-hidden">
    <img
      src={event.bannerUrl}
      alt={event.title}
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-8">
      <div className="container">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          {event.title}
        </h1>
        <div className="flex items-center gap-4 text-white/90">
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            <span>{formattedDate}</span>
          </div>
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin size={20} />
              <span>{event.venue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
) : event.imageUrl ? (
  <div className="relative h-96 overflow-hidden bg-gradient-to-br from-[#E91E8C]/20 to-[#FF4500]/20">
    <img
      src={event.imageUrl}
      alt={event.title}
      className="w-full h-full object-cover"
    />
  </div>
) : null}
```

---

## 🧪 Paso 5: Probar

### Test Local:

1. **Build:**
   ```bash
   pnpm run build
   ```

2. **Crear/Editar un evento:**
   - Sube una **portada** (flyer vertical 1275x1875)
   - Sube un **banner** (horizontal 1920x400)

3. **Verificar:**
   - ✅ Portada se ve en la tarjeta (página /events)
   - ✅ Banner se ve arriba en la página del evento
   - ✅ Si no hay banner, se muestra la portada

---

## 📊 Resumen de Cambios

| Archivo | Cambios |
|---------|---------|
| `drizzle/schema.ts` | ✅ Agregado campo `bannerUrl` |
| `scripts/add-event-banner.ts` | ✅ Migración ejecutada |
| `client/src/components/admin/EventFormCard.tsx` | ⏳ Agregar upload de banner |
| `server/features/admin.ts` | ⏳ Agregar `bannerUrl` en create/update |
| `client/src/pages/EventDetail.tsx` | ⏳ Mostrar banner arriba |

---

## 💡 Tips

**Dimensiones recomendadas:**

1. **Portada (Cover):**
   - 1275 x 1875 px (ratio 17:25)
   - Formato vertical
   - Para las tarjetas de eventos

2. **Banner:**
   - 1920 x 400 px (ratio ~19:4)
   - Formato horizontal
   - Para la parte superior de la página del evento

---

¿Quieres que modifique algún archivo automáticamente o prefieres hacerlo manualmente siguiendo esta guía? 🚀
