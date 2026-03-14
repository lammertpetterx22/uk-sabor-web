# 🖼️ Ejemplo: Cómo Integrar el Image Cropper en Cursos

## 📝 Caso de Uso: Subir y Recortar Miniatura de Curso

Este es un ejemplo completo de cómo integrar el **ImageCropperModal** en el componente de creación/edición de cursos.

---

## 🎯 Objetivo

Permitir al profesor subir una imagen para la miniatura del curso y recortarla en formato **16:9** (ideal para thumbnails de video).

---

## 💻 Código Completo

### 1. Importaciones Necesarias

```tsx
import { useState } from 'react';
import { ImageCropperModal } from '@/components/video';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Check } from 'lucide-react';
```

---

### 2. Estado del Componente

```tsx
function CourseCreator() {
  // Estado para el cropper
  const [showCropper, setShowCropper] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  // Estado del curso
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    // ... otros campos
  });

  // ... resto del componente
}
```

---

### 3. Manejadores de Eventos

```tsx
// Cuando el usuario selecciona una imagen del input file
const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validar que sea imagen
  if (!file.type.startsWith('image/')) {
    toast.error('Por favor selecciona un archivo de imagen');
    return;
  }

  // Crear URL temporal para el cropper
  const imageUrl = URL.createObjectURL(file);
  setOriginalImageUrl(imageUrl);
  setShowCropper(true);
};

// Cuando el usuario finaliza el recorte
const handleCropComplete = async (blob: Blob) => {
  // Guardar el blob para subir después
  setCroppedBlob(blob);

  // Crear URL para preview
  const previewUrl = URL.createObjectURL(blob);
  setCroppedImageUrl(previewUrl);

  // Cerrar el modal
  setShowCropper(false);

  // Opcional: Subir inmediatamente
  // await uploadCroppedImage(blob);
};

// Subir la imagen recortada al servidor
const uploadCroppedImage = async (blob: Blob) => {
  const formData = new FormData();
  formData.append('image', blob, 'course-thumbnail.jpg');

  try {
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    // Actualizar URL en el estado del curso
    setCourseData((prev) => ({
      ...prev,
      imageUrl: data.url,
    }));

    toast.success('Imagen subida exitosamente');
  } catch (error) {
    toast.error('Error al subir la imagen');
    console.error(error);
  }
};
```

---

### 4. JSX del Componente

```tsx
return (
  <div className="space-y-6">
    {/* Título del curso */}
    <Input
      placeholder="Título del curso"
      value={courseData.title}
      onChange={(e) =>
        setCourseData((prev) => ({ ...prev, title: e.target.value }))
      }
    />

    {/* Descripción */}
    <Textarea
      placeholder="Descripción del curso"
      value={courseData.description}
      onChange={(e) =>
        setCourseData((prev) => ({ ...prev, description: e.target.value }))
      }
    />

    {/* ════════════════════════════════════════════════════════ */}
    {/*  SECCIÓN DE IMAGEN CON CROPPER                          */}
    {/* ════════════════════════════════════════════════════════ */}

    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground/70">
        Miniatura del curso (16:9)
      </label>

      {/* Preview de la imagen recortada */}
      {croppedImageUrl ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-accent/30 group">
          <img
            src={croppedImageUrl}
            alt="Course thumbnail"
            className="w-full h-full object-cover"
          />

          {/* Overlay con botones */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Re-abrir cropper con la imagen original
                setShowCropper(true);
              }}
              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Recortar de nuevo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCroppedImageUrl('');
                setCroppedBlob(null);
                setOriginalImageUrl('');
              }}
              className="bg-red-500/20 backdrop-blur-md border-red-500/20 text-red-300 hover:bg-red-500/30"
            >
              Eliminar
            </Button>
          </div>
        </div>
      ) : (
        /* Área de upload cuando no hay imagen */
        <div className="relative border-2 border-dashed border-accent/30 rounded-xl p-12 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/50 transition-all duration-300 cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          <div className="text-center pointer-events-none">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 mb-4 border border-accent/20 group-hover:scale-110 transition-transform duration-300">
              <Upload className="h-10 w-10 text-accent" />
            </div>
            <p className="font-medium text-foreground mb-2">
              Arrastra una imagen aquí
            </p>
            <p className="text-sm text-foreground/60 mb-4">
              o haz clic para seleccionar
            </p>
            <p className="text-xs text-foreground/50">
              Formatos: JPG, PNG, WebP • Máx: 5MB
            </p>
          </div>
        </div>
      )}
    </div>

    {/* ════════════════════════════════════════════════════════ */}
    {/*  MODAL DEL CROPPER                                      */}
    {/* ════════════════════════════════════════════════════════ */}

    <ImageCropperModal
      imageUrl={originalImageUrl}
      isOpen={showCropper}
      onClose={() => setShowCropper(false)}
      onCropComplete={handleCropComplete}
      aspectRatio={16 / 9} // Para thumbnails
      circularCrop={false} // Rectangular
    />

    {/* Botón de crear curso */}
    <Button
      onClick={async () => {
        // 1. Subir imagen recortada si existe
        if (croppedBlob) {
          await uploadCroppedImage(croppedBlob);
        }

        // 2. Crear curso con la URL de la imagen
        // await createCourse(courseData);
      }}
      className="w-full btn-vibrant"
    >
      <Check className="w-4 h-4 mr-2" />
      Crear Curso
    </Button>
  </div>
);
```

---

## 🎨 Estilos Adicionales (Opcional)

Si quieres personalizar aún más el diseño, puedes agregar clases de Tailwind:

```tsx
// Thumbnail con efecto de hover elegante
<div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-pink-500/20 group">
  <img
    src={croppedImageUrl}
    alt="Course thumbnail"
    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
  />
</div>
```

---

## 🔧 Variantes de Aspect Ratio

Dependiendo del tipo de imagen, puedes ajustar el aspect ratio:

```tsx
// Para thumbnail de video (horizontal)
<ImageCropperModal
  aspectRatio={16 / 9}
  circularCrop={false}
/>

// Para foto de perfil (cuadrada)
<ImageCropperModal
  aspectRatio={1}
  circularCrop={true} // Recorte circular
/>

// Para banner (ultra-wide)
<ImageCropperModal
  aspectRatio={21 / 9}
  circularCrop={false}
/>

// Para vertical (Stories/Reels)
<ImageCropperModal
  aspectRatio={9 / 16}
  circularCrop={false}
/>
```

---

## 📊 Validaciones Recomendadas

```tsx
const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validar tipo
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    toast.error('Formato no soportado. Usa JPG, PNG o WebP');
    return;
  }

  // Validar tamaño (máx. 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    toast.error('Imagen demasiado grande. Máximo 5MB');
    return;
  }

  // Validar dimensiones mínimas
  const img = new Image();
  img.onload = () => {
    if (img.width < 1280 || img.height < 720) {
      toast.error('Imagen muy pequeña. Mínimo 1280x720px');
      return;
    }

    // Si pasa todas las validaciones
    const imageUrl = URL.createObjectURL(file);
    setOriginalImageUrl(imageUrl);
    setShowCropper(true);
  };
  img.src = URL.createObjectURL(file);
};
```

---

## 🎯 Flujo Completo

```
1. Usuario hace click en área de upload
   ↓
2. Selecciona imagen de su dispositivo
   ↓
3. Se valida tipo, tamaño y dimensiones
   ↓
4. Se abre modal del cropper
   ↓
5. Usuario ajusta zoom y rotación
   ↓
6. Usuario hace click en "Aplicar Recorte"
   ↓
7. Se genera Blob con imagen recortada
   ↓
8. Se muestra preview de la imagen
   ↓
9. Al crear curso, se sube imagen recortada
   ↓
10. Se obtiene URL final del servidor
   ↓
11. Se crea curso con imageUrl
```

---

## 🐛 Troubleshooting

### La imagen no se muestra en el cropper
```tsx
// Asegúrate de crear la URL correctamente
const imageUrl = URL.createObjectURL(file);

// Y limpia la URL cuando ya no la necesites
useEffect(() => {
  return () => {
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }
  };
}, [originalImageUrl]);
```

### El blob es muy grande
```tsx
// Ajusta la calidad JPEG al exportar
canvas.toBlob(
  (blob) => {
    if (blob) onCropComplete(blob);
  },
  'image/jpeg',
  0.85 // Calidad 85% (0.0 - 1.0)
);
```

### El recorte está descentrado
```tsx
// Asegúrate de usar el área en píxeles
const { x, y, width, height } = croppedAreaPixels;

ctx.drawImage(
  image,
  x,     // X de origen
  y,     // Y de origen
  width, // Ancho de origen
  height, // Alto de origen
  0,     // X de destino
  0,     // Y de destino
  width, // Ancho de destino
  height // Alto de destino
);
```

---

## 🎉 ¡Listo!

Ahora tienes un sistema completo de upload y recorte de imágenes profesional.

**Próximos pasos**:
1. Integrar en CourseCreator
2. Probar con diferentes tamaños
3. Ajustar validaciones según necesites
4. Personalizar estilos con tu marca

---

**Versión**: 1.0.0
**Última actualización**: 2026-03-13
