# 📦 AWS S3 Setup Guide - UK Sabor Platform

## ¿Por qué necesitas AWS S3?

La plataforma UK Sabor permite a profesores e instructores subir:
- **Videos de cursos** (hasta 1GB)
- **Imágenes de eventos** (hasta 10MB)
- **Fotos de instructores** (hasta 10MB)

Estos archivos se almacenan en **AWS S3** (Simple Storage Service) y se sirven a través de **CloudFront CDN** para máxima velocidad.

---

## 🚀 Configuración Rápida (5 minutos)

### Paso 1: Crear un bucket S3

1. Ve a [AWS Console](https://console.aws.amazon.com/)
2. Busca **S3** en la barra de búsqueda
3. Click en **"Create bucket"**
4. Configuración del bucket:
   ```
   Bucket name: uk-sabor-media (o el nombre que prefieras)
   Region: Europe (Ireland) eu-west-1

   Block Public Access: ❌ DESACTIVAR todas las opciones
   (Necesitamos acceso público para servir imágenes/videos)

   Bucket Versioning: Disabled
   Encryption: Enable (server-side encryption)
   ```
5. Click **"Create bucket"**

### Paso 2: Configurar permisos del bucket

1. Ve a tu bucket → **Permissions** tab
2. Edita **Bucket Policy** y pega esto:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::uk-sabor-media/*"
    }
  ]
}
```

⚠️ **IMPORTANTE**: Reemplaza `uk-sabor-media` con el nombre de tu bucket.

3. Click **"Save changes"**

### Paso 3: Crear usuario IAM con acceso al bucket

1. Ve a **IAM** en AWS Console
2. Click **Users** → **Create user**
3. Nombre: `uk-sabor-uploader`
4. Permissions: Click **"Attach policies directly"**
5. Busca y selecciona: **AmazonS3FullAccess** (o crea una policy custom más restrictiva)
6. Click **"Create user"**

### Paso 4: Crear Access Keys

1. Ve a tu usuario → **Security credentials** tab
2. Scroll down a **Access keys**
3. Click **"Create access key"**
4. Purpose: **Application running outside AWS**
5. Copia tus credenciales:
   ```
   Access Key ID: AKIA...
   Secret Access Key: wJalr...
   ```

⚠️ **¡IMPORTANTE!**: Guarda el Secret Access Key ahora. No podrás verlo de nuevo.

### Paso 5: Configurar variables de entorno

Edita tu archivo `.env`:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA1234567890EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-west-1
S3_BUCKET_NAME=uk-sabor-media
```

### Paso 6: (Opcional) Configurar CloudFront CDN

CloudFront acelera la entrega de archivos a usuarios en todo el mundo.

1. Ve a **CloudFront** en AWS Console
2. Click **"Create distribution"**
3. Configuración:
   ```
   Origin domain: Selecciona tu bucket S3
   Origin access: Public
   Viewer protocol policy: Redirect HTTP to HTTPS
   Cache policy: CachingOptimized
   ```
4. Click **"Create distribution"**
5. Espera ~5 minutos a que se despliegue
6. Copia el **Distribution domain name** (ej: `d1234567890.cloudfront.net`)
7. Añade a tu `.env`:
   ```bash
   CLOUDFRONT_CDN_URL=https://d1234567890.cloudfront.net
   ```

---

## 🧪 Probar la configuración

1. Reinicia el servidor:
   ```bash
   npm run dev
   ```

2. Deberías ver en los logs:
   ```
   [S3] ✅ Initialized S3 client for bucket: uk-sabor-media (eu-west-1)
   ```

3. Ve al Admin Dashboard → Courses → Create Course
4. Intenta subir un video
5. Deberías ver:
   ```
   [Storage] Using AWS S3 for upload: courses/123/videos/...
   [S3] ✅ Uploaded: courses/123/videos/video.mp4 → https://...
   ```

---

## 🔒 Seguridad

### ✅ Mejores prácticas:

1. **Nunca subas tus credenciales a Git**:
   - El archivo `.env` está en `.gitignore` ✅
   - Usa variables de entorno en producción (Render, Vercel, etc.)

2. **Usa IAM policies restrictivas**:
   En lugar de `AmazonS3FullAccess`, crea una policy custom:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::uk-sabor-media/*"
       }
     ]
   }
   ```

3. **Rota tus Access Keys regularmente** (cada 90 días)

4. **Habilita MFA** en tu cuenta AWS root

---

## 📊 Costos estimados

AWS S3 es **muy económico**:

- **Storage**: $0.023/GB/mes (primeros 50TB)
- **Transfer OUT**: $0.09/GB (primeros 10TB/mes)
- **Requests**: $0.005 por 1,000 requests

**Ejemplo**:
- 100 videos de 500MB cada uno = 50GB storage = **$1.15/mes**
- 10,000 visualizaciones/mes (500GB transfer) = **$45/mes**
- 50,000 uploads/mes = **$0.25/mes**

**Total estimado**: ~$50/mes para una plataforma activa

💡 **Consejo**: CloudFront reduce costos de transfer porque cachea los archivos en edge locations.

---

## 🆘 Troubleshooting

### Error: "AWS credentials missing"
- ✅ Verifica que `.env` tiene las variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`
- ✅ Reinicia el servidor después de modificar `.env`

### Error: "Access Denied"
- ✅ Verifica que el bucket policy permite acceso público (`s3:GetObject`)
- ✅ Verifica que tu usuario IAM tiene permisos de S3

### Video se sube pero no se reproduce
- ✅ Verifica que el CORS está configurado en el bucket:
  ```json
  [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": []
    }
  ]
  ```

### URLs muy largas
- ✅ Usa CloudFront CDN para URLs cortas y cacheadas

---

## 📚 Recursos adicionales

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS Pricing Calculator](https://calculator.aws/)

---

¿Necesitas ayuda? Contacta al equipo de desarrollo. 🚀
