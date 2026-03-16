# Image Cropper - Quick Reference Card

## 🚀 Quick Start (30 seconds)

```tsx
import ImageCropper from "@/components/ImageCropper";

const handleCrop = (blob: Blob, url: string) => {
  setImage(url);        // Preview
  uploadImage(blob);    // Upload to server
};

<ImageCropper
  aspectRatioPreset={16 / 9}
  onCropComplete={handleCrop}
/>
```

## 📱 Aspect Ratios

| Value | Ratio | Use Case |
|-------|-------|----------|
| `null` | Free | Unrestricted cropping |
| `16 / 9` | 1.78:1 | Teacher covers, banners |
| `3 / 1` | 3:1 | Ultra-wide covers |
| `1` | 1:1 | Profile pictures |
| `9 / 16` | 0.56:1 | Stories, vertical content |

## 🎯 Common Use Cases

### Profile Picture
```tsx
<ImageCropper aspectRatioPreset={1} onCropComplete={handleCrop} />
```

### Cover Photo
```tsx
<ImageCropper aspectRatioPreset={16 / 9} onCropComplete={handleCrop} />
```

### Free Crop
```tsx
<ImageCropper aspectRatioPreset={null} onCropComplete={handleCrop} />
```

## 📤 Upload to Server

```tsx
const handleCrop = async (blob: Blob, url: string) => {
  const formData = new FormData();
  formData.append('image', blob, 'image.jpg');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const { url: uploadedUrl } = await response.json();
  console.log('Uploaded:', uploadedUrl);
};
```

## 🔄 Convert to Base64

```tsx
const handleCrop = (blob: Blob, url: string) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result as string;
    console.log('Base64:', base64);
  };
  reader.readAsDataURL(blob);
};
```

## 📋 Props Reference

```tsx
interface ImageCropperProps {
  // Required: called when crop is complete
  onCropComplete: (blob: Blob, url: string) => void;

  // Optional: called when user cancels
  onCancel?: () => void;

  // Optional: initial aspect ratio (default: 16/9)
  aspectRatioPreset?: number | null;

  // Optional: additional CSS classes
  className?: string;
}
```

## 🎮 Controls

### Mobile
- **Pinch** - Zoom in/out
- **Drag** - Move image
- **Two fingers** - Pan

### Desktop
- **Mouse wheel** - Zoom in/out
- **Click + Drag** - Move image
- **Slider** - Fine-tune zoom

## 💡 Pro Tips

### 1. File Size Validation
```tsx
const handleCrop = (blob: Blob, url: string) => {
  if (blob.size > 5 * 1024 * 1024) {
    alert("Image too large (max 5MB)");
    return;
  }
  // Process...
};
```

### 2. Image Format
```tsx
// Component exports as JPEG at 95% quality
// To change format, modify getCroppedImg() in ImageCropper.tsx
canvas.toBlob(callback, "image/png", 1.0); // PNG, 100% quality
```

### 3. Memory Management
```tsx
useEffect(() => {
  return () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  };
}, [imageUrl]);
```

### 4. Loading State
```tsx
const [uploading, setUploading] = useState(false);

const handleCrop = async (blob: Blob, url: string) => {
  setUploading(true);
  try {
    await uploadImage(blob);
  } finally {
    setUploading(false);
  }
};
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Blurry images | Component already uses hidden canvas (95% quality) |
| Pinch not working | Check viewport meta tag allows scaling |
| Large images lag | Resize before cropping or use lower quality |
| Can't upload | Ensure blob is passed to FormData correctly |

## 📚 Files

- Component: `client/src/components/ImageCropper.tsx`
- Demo: `client/src/components/ImageCropperDemo.tsx`
- Route: `/image-cropper-demo`
- Full Guide: `IMAGE_CROPPER_GUIDE.md`
- Integration: `BECOME_INSTRUCTOR_INTEGRATION.md`

## 🔗 Demo

Visit `/image-cropper-demo` to try it out!

---

**Questions?** Check [IMAGE_CROPPER_GUIDE.md](./IMAGE_CROPPER_GUIDE.md)
