# 🎬 Professional Video Components

Este directorio contiene los componentes profesionales para la gestión y reproducción de videos en la plataforma.

---

## 📦 Componentes Disponibles

### 1. ProfessionalVideoPlayer

Reproductor de video premium con controles personalizados usando Plyr.io.

```tsx
import { ProfessionalVideoPlayer } from '@/components/video';

function MyComponent() {
  return (
    <ProfessionalVideoPlayer
      videoUrl="https://example.com/video.mp4"
      poster="https://example.com/thumbnail.jpg"
      isLocked={false}
      onTimeUpdate={(time) => console.log('Current time:', time)}
      onProgress={(percent) => console.log('Progress:', percent)}
      initialTime={0}
      className="my-custom-class"
    />
  );
}
```

**Props:**
- `videoUrl` (string, required): URL del video MP4
- `poster` (string, optional): URL de la miniatura
- `isLocked` (boolean, optional): Si está bloqueado, muestra overlay
- `onTimeUpdate` (function, optional): Callback con tiempo actual
- `onProgress` (function, optional): Callback con porcentaje de progreso
- `initialTime` (number, optional): Tiempo inicial en segundos
- `className` (string, optional): Clases CSS adicionales

---

### 2. ImageCropperModal

Modal para recortar imágenes con zoom y rotación.

```tsx
import { ImageCropperModal } from '@/components/video';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleCropComplete = (blob: Blob) => {
    // Subir el blob a tu servidor
    const formData = new FormData();
    formData.append('image', blob, 'cropped.jpg');
    // fetch(...) para subir
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Recortar Imagen</button>

      <ImageCropperModal
        imageUrl={imageUrl}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9} // 16:9 para thumbnails
        circularCrop={false} // true para avatares circulares
      />
    </>
  );
}
```

**Props:**
- `imageUrl` (string, required): URL de la imagen a recortar
- `isOpen` (boolean, required): Si el modal está abierto
- `onClose` (function, required): Callback para cerrar el modal
- `onCropComplete` (function, required): Callback con el Blob recortado
- `aspectRatio` (number, optional): Relación de aspecto (16/9, 4/3, 1, etc.)
- `circularCrop` (boolean, optional): Recorte circular (para avatares)

**Aspect Ratios Comunes:**
- `16 / 9`: Thumbnails de video, banners
- `4 / 3`: Fotos tradicionales
- `1`: Cuadrado (Instagram, avatares cuadrados)
- `9 / 16`: Vertical (Stories, Reels)

---

### 3. ProfessionalUploadProgress

Barra de progreso elegante para mostrar el estado de subida.

```tsx
import { ProfessionalUploadProgress } from '@/components/video';

function MyComponent() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [fileName, setFileName] = useState('');

  return (
    <ProfessionalUploadProgress
      isUploading={uploading}
      progress={progress}
      uploadComplete={uploadComplete}
      uploadType="video" // "video" | "image"
      fileName={fileName}
    />
  );
}
```

**Props:**
- `isUploading` (boolean, required): Si está subiendo actualmente
- `progress` (number, required): Progreso de 0 a 100
- `uploadComplete` (boolean, required): Si la subida terminó
- `uploadType` ("video" | "image", required): Tipo de archivo
- `fileName` (string, optional): Nombre del archivo

---

## 🎨 Estilos y Temas

Todos los componentes usan:
- **Tailwind CSS** para estilos
- **Colores de marca**: `#FA3698` (rosa), `#A855F7` (púrpura)
- **Dark mode**: Compatible con next-themes
- **Animaciones**: Transiciones suaves con durations de 300ms

---

## 📱 Responsive Design

- **Mobile**: Optimizado para touch, controles grandes
- **Tablet**: Layout adaptativo
- **Desktop**: Hover effects, tooltips

---

## 🔧 Instalación de Dependencias

```bash
pnpm add plyr-react react-easy-crop
```

O si usas npm:

```bash
npm install plyr-react react-easy-crop
```

---

## 🎯 Casos de Uso

### Ejemplo Completo: Upload de Video con Recorte de Thumbnail

```tsx
import { useState } from 'react';
import {
  ProfessionalUploadProgress,
  ImageCropperModal,
  ProfessionalVideoPlayer
} from '@/components/video';

function VideoUploadExample() {
  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');

  // Image crop state
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [croppedThumbnail, setCroppedThumbnail] = useState('');

  const handleVideoUpload = async (file: File) => {
    setVideoFile(file);
    setUploading(true);

    // Simular upload con progress
    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      const response = JSON.parse(xhr.responseText);
      setVideoUrl(response.url);
      setUploading(false);
    });

    xhr.open('POST', '/api/upload/video');
    xhr.send(formData);
  };

  const handleThumbnailCrop = (blob: Blob) => {
    // Subir thumbnail recortado
    const url = URL.createObjectURL(blob);
    setCroppedThumbnail(url);
    setShowCropper(false);
  };

  return (
    <div className="space-y-6">
      {/* Video Upload */}
      <div>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleVideoUpload(file);
          }}
        />

        <ProfessionalUploadProgress
          isUploading={uploading}
          progress={uploadProgress}
          uploadComplete={!!videoUrl}
          uploadType="video"
          fileName={videoFile?.name}
        />
      </div>

      {/* Thumbnail Crop */}
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setThumbnailUrl(URL.createObjectURL(file));
              setShowCropper(true);
            }
          }}
        />

        <ImageCropperModal
          imageUrl={thumbnailUrl}
          isOpen={showCropper}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleThumbnailCrop}
          aspectRatio={16 / 9}
        />
      </div>

      {/* Video Preview */}
      {videoUrl && (
        <ProfessionalVideoPlayer
          videoUrl={videoUrl}
          poster={croppedThumbnail}
          onProgress={(percent) => {
            console.log('Watching progress:', percent);
          }}
        />
      )}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### El reproductor no carga
- Verifica que `plyr-react` esté instalado
- Importa los estilos: `import 'plyr-react/plyr.css'`
- Comprueba que la URL del video sea válida

### El cropper no funciona
- Verifica que `react-easy-crop` esté instalado
- Asegúrate de que la imagen tenga una URL válida
- Revisa que el modal esté visible (`isOpen={true}`)

### La barra de progreso no se muestra
- Verifica que `isUploading={true}` o `uploadComplete={true}`
- Comprueba que el `progress` esté entre 0 y 100

---

## 📚 Recursos Adicionales

- [Plyr Documentation](https://github.com/sampotts/plyr)
- [React-Easy-Crop Docs](https://github.com/ValentinH/react-easy-crop)
- [Tailwind CSS](https://tailwindcss.com)

---

**Versión**: 1.0.0
**Última actualización**: 2026-03-13
