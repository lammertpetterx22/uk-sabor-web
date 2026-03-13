# 🎬 Bunny.net Video Streaming - Guía Completa

## 📋 Resumen

La plataforma **Con Sabor UK** ahora usa **Bunny.net Stream API** para alojar y reproducir todos los videos de lecciones y clases grabadas. Esta integración proporciona:

✅ **Máxima seguridad**: Token authentication + domain restriction
✅ **Bajo costo**: ~$0.005/GB vs AWS S3 ~$0.09/GB
✅ **Soporte para videos grandes**: 20-40 minutos sin problemas (TUS upload)
✅ **CDN global**: Entrega ultra-rápida en todo el mundo
✅ **Protección anti-piratería**: Links firmados + restricción de dominio

---

## 🔧 Configuración Inicial

### 1. Obtener Credenciales de Bunny.net

1. Ve a [Bunny.net Dashboard](https://dash.bunny.net/)
2. Navega a **Stream → Video Libraries**
3. Crea una nueva biblioteca (o usa una existente)
4. Copia el **Library ID** (número que aparece en la URL)
5. Ve a **Stream → API** y copia tu **API Key**

### 2. Configurar Variables de Entorno

Edita tu archivo `.env` y agrega/actualiza estas variables:

```bash
# ✅ BUNNY.NET VIDEO STREAMING
BUNNY_API_KEY=d13c6575-3b2d-490f-bca7-e3df257fb5ada4506b8e-7a74-432e-839e-7a6128f74efb
BUNNY_VIDEO_LIBRARY_ID=123456  # ← REEMPLAZA con tu Library ID
BUNNY_ALLOWED_REFERRER=https://uk-sabor-web.onrender.com  # ← Tu dominio
```

> **⚠️ IMPORTANTE**: Debes obtener tu propio `BUNNY_VIDEO_LIBRARY_ID` desde el dashboard de Bunny.net.

### 3. Aplicar Migración de Base de Datos

La migración ya está generada. Aplícala manualmente ejecutando el SQL:

```sql
ALTER TABLE "classes" ADD COLUMN "bunnyVideoId" varchar(255);
ALTER TABLE "classes" ADD COLUMN "bunnyLibraryId" varchar(255);
ALTER TABLE "lessons" ADD COLUMN "bunnyVideoId" varchar(255);
ALTER TABLE "lessons" ADD COLUMN "bunnyLibraryId" varchar(255);
```

O desde tu herramienta de base de datos, copia el contenido de:
```
drizzle/0004_military_lester.sql
```

---

## 📤 Cómo Subir Videos

### Opción A: Desde el Frontend (Admin Panel)

**Archivo**: `client/src/components/dashboard/CoursesTab.tsx` (o donde tengas tu formulario)

```tsx
import { trpc } from "@/lib/trpc";

function LessonUploadForm() {
  const uploadMutation = trpc.uploads.uploadVideoToBunny.useMutation();

  const handleVideoUpload = async (file: File, lessonTitle: string) => {
    // 1. Convertir archivo a base64
    const base64 = await fileToBase64(file);

    // 2. Subir a Bunny.net
    const result = await uploadMutation.mutateAsync({
      videoBase64: base64,
      fileName: file.name,
      title: lessonTitle, // e.g., "Salsa Básica - Lección 1"
    });

    // 3. Guardar bunnyVideoId y bunnyLibraryId en la lección
    await createLessonMutation.mutateAsync({
      courseId: selectedCourse.id,
      title: lessonTitle,
      bunnyVideoId: result.bunnyVideoId,
      bunnyLibraryId: result.bunnyLibraryId,
      position: 1,
      // ... otros campos
    });

    console.log("✅ Video subido:", result.bunnyVideoId);
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleVideoUpload(file, "Mi Lección");
        }}
      />
      {uploadMutation.isLoading && <p>Subiendo video...</p>}
    </div>
  );
}

// Helper para convertir File a base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### Opción B: Desde el Backend (Script de migración)

**Archivo**: `scripts/upload-videos-to-bunny.ts`

```typescript
import { bunnyUploadVideo } from "../server/bunny";
import fs from "fs";

async function uploadLessonVideo() {
  // Leer archivo de video
  const videoBuffer = fs.readFileSync("./videos/leccion-1.mp4");

  // Subir a Bunny.net
  const { videoId, libraryId } = await bunnyUploadVideo(
    "Salsa Básica - Lección 1", // Título
    videoBuffer,
    "leccion-1.mp4"
  );

  console.log(`✅ Video subido: ${videoId}`);
  console.log(`📚 Library ID: ${libraryId}`);

  // Ahora actualiza tu base de datos con estos valores
  // await db.update(lessons).set({ bunnyVideoId: videoId, bunnyLibraryId: libraryId }).where(...)
}

uploadLessonVideo();
```

---

## 🎥 Cómo Reproducir Videos

### En el Frontend: Usa el Componente `BunnyVideoPlayer`

**Archivo**: `client/src/pages/CourseDetail.tsx` (o donde muestres lecciones)

```tsx
import BunnyVideoPlayer from "@/components/BunnyVideoPlayer";
import { trpc } from "@/lib/trpc";

function LessonViewer({ lesson }: { lesson: Lesson }) {
  const { data: videoAccess } = trpc.lessons.getSecureVideoUrl.useQuery({
    lessonId: lesson.id,
  });

  // Si la lección usa Bunny.net
  if (videoAccess?.isBunnyVideo && videoAccess.bunnyVideoId) {
    return (
      <BunnyVideoPlayer
        bunnyVideoId={videoAccess.bunnyVideoId}
        bunnyLibraryId={videoAccess.bunnyLibraryId}
        title={lesson.title}
        locked={lesson.locked}
        onProgress={(percent) => {
          console.log(`Progreso: ${percent}%`);
          // Opcional: guardar progreso en BD
        }}
        onComplete={() => {
          console.log("Video completado!");
          // Marcar como completado
        }}
      />
    );
  }

  // Fallback para videos legacy (S3)
  if (videoAccess?.videoUrl) {
    return <ProtectedVideoPlayer src={videoAccess.videoUrl} />;
  }

  return <p>No hay video disponible</p>;
}
```

---

## 🔐 Seguridad Implementada

### 1. **Token Authentication (Signed URLs)**

Cada URL de video incluye un token SHA256 que expira en 24 horas:

```typescript
// Generado automáticamente por bunnyGenerateSignedUrl()
https://iframe.mediadelivery.net/embed/123456/abc-def-ghi?token=sha256hash&expires=1234567890
```

✅ **Beneficio**: Nadie puede copiar el link y compartirlo fuera de la plataforma.

### 2. **Domain Restriction (Referrer)**

Configurado en `.env`:
```bash
BUNNY_ALLOWED_REFERRER=https://uk-sabor-web.onrender.com
```

✅ **Beneficio**: El video solo se reproduce si viene de tu dominio oficial.

### 3. **IP Locking (Opcional)**

El backend genera URLs atadas a la IP del usuario:

```typescript
// En server/features/uploads.ts
const ipAddress = ctx.req?.headers?.["x-forwarded-for"] as string | undefined;
const signedUrl = bunnyGenerateSignedUrl(videoId, libraryId, 86400, ipAddress);
```

✅ **Beneficio**: Seguridad extra para prevenir sharing de links.

### 4. **Purchase Verification**

El endpoint `getSecureVideoUrl` verifica:
- ✅ Usuario ha comprado el curso
- ✅ Usuario es instructor/admin
- ✅ Lección es preview (gratis)

```typescript
// Solo devuelve el video si cumple los requisitos
if (!isAdmin && !isInstructor && !hasPurchased) {
  throw new Error("You must purchase this course");
}
```

---

## 📊 Monitorear Videos

### Verificar Estado de Procesamiento

Después de subir un video, Bunny.net tarda unos minutos en procesarlo. Puedes verificar su estado:

```tsx
const { data: videoStatus } = trpc.uploads.getBunnyVideoStatus.useQuery({
  bunnyVideoId: "abc-def-ghi",
});

console.log(videoStatus);
// {
//   status: 3, // 0=queue, 1=processing, 2=encoding, 3=ready, 4=error
//   durationSeconds: 1200,
//   isReady: true,
//   views: 45
// }
```

### Estados del Video

| Status | Descripción |
|--------|-------------|
| 0 | En cola (queued) |
| 1 | Procesando (processing) |
| 2 | Codificando (encoding) |
| 3 | ✅ Listo (finished) |
| 4 | ❌ Error |

---

## 💰 Costos

### Bunny.net Pricing (2024)

- **Almacenamiento**: $0.01/GB/mes
- **Streaming**: $0.005/GB transferido (CDN global)
- **Codificación**: Gratis

### Ejemplo: Curso de 10 Lecciones

- 10 videos × 200MB = 2GB total
- **Almacenamiento**: $0.02/mes
- **Streaming** (100 estudiantes viendo todo): 200GB × $0.005 = **$1.00**

**Total**: ~$1.02/mes para 100 estudiantes completos

🆚 **AWS S3** (mismo escenario): ~$18/mes

---

## 🛠️ Archivos Modificados

### Backend
- ✅ `server/bunny.ts` - Servicio principal de Bunny.net
- ✅ `server/features/uploads.ts` - Endpoints de subida y signed URLs
- ✅ `server/features/lessons.ts` - Soporte para Bunny.net en lecciones
- ✅ `server/storage.ts` - Limpieza de código BUILT_IN_FORGE
- ✅ `server/_core/env.ts` - Eliminación de variables Forge

### Frontend
- ✅ `client/src/components/BunnyVideoPlayer.tsx` - Reproductor con iframe de Bunny.net

### Base de Datos
- ✅ `drizzle/schema.ts` - Campos `bunnyVideoId` y `bunnyLibraryId`
- ✅ `drizzle/0004_military_lester.sql` - Migración SQL

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa con los videos antiguos en S3?

Los videos legacy en S3 siguen funcionando. El sistema tiene **retrocompatibilidad**:

```typescript
// El endpoint getSecureVideoUrl devuelve automáticamente el correcto
if (hasBunnyVideo) {
  return bunnySignedUrl; // Preferido
} else if (hasLegacyVideo) {
  return s3SignedUrl; // Fallback
}
```

### ¿Cómo migro videos de S3 a Bunny.net?

1. Descarga el video de S3
2. Súbelo a Bunny.net usando `uploadVideoToBunny`
3. Actualiza la lección con los nuevos `bunnyVideoId` y `bunnyLibraryId`
4. (Opcional) Elimina el archivo de S3 para ahorrar costos

### ¿Puedo usar Bunny.net para imágenes también?

**No recomendado**. Bunny.net Stream está optimizado para videos. Para imágenes, sigue usando S3 + CloudFront CDN (es más económico).

### ¿Cómo obtengo mi Library ID?

1. Ve a https://dash.bunny.net/
2. Navega a **Stream → Video Libraries**
3. Haz clic en tu biblioteca
4. El número en la URL es tu Library ID: `https://dash.bunny.net/stream/library/123456` ← `123456`

### ¿Los usuarios pueden descargar los videos?

**NO**. El reproductor de Bunny.net tiene protección anti-descarga:
- ✅ No hay botón de descarga
- ✅ Clic derecho bloqueado
- ✅ URLs firmadas que expiran
- ✅ Restricción de dominio

---

## 🚀 Siguientes Pasos

1. **Obtén tu Library ID** desde Bunny.net Dashboard
2. **Actualiza `.env`** con tus credenciales reales
3. **Aplica la migración SQL** para agregar las columnas nuevas
4. **Sube tu primer video de prueba** usando el admin panel
5. **Verifica que se reproduce correctamente** con BunnyVideoPlayer

---

## 📞 Soporte

- **Bunny.net Docs**: https://docs.bunny.net/docs/stream
- **API Reference**: https://docs.bunny.net/reference/api-overview
- **Support**: support@bunny.net

---

**¡Listo para subir videos de 40 minutos sin problemas! 🎉**
