# Professional Image Cropper - Complete Guide

## 🎯 Overview

The **Professional Image Cropper** (`ImageCropperPro`) is an advanced, production-ready React component designed for educational platforms. It provides a **"no-fail" experience** where any photo, regardless of original size, looks professional once saved.

This guide covers the enhanced version with:
- ✅ **5 Smart Presets** (Profile, Teacher Cover, Course Card, Event Banner, Free)
- ✅ **Size Recommendation Table** built into the UI
- ✅ **Pro-Tips** that change based on selected mode
- ✅ **Smart Auto-Centering** when switching presets
- ✅ **WebP Export** for better compression
- ✅ **Mobile-First** Instagram-style gestures

## 🚀 Quick Start

```tsx
import ImageCropperPro from "@/components/ImageCropperPro";

const handleCrop = (blob: Blob, url: string, preset: CropPreset) => {
  console.log("Cropped:", preset.label);
  uploadToServer(blob);
};

<ImageCropperPro
  defaultPreset="teacher_cover"
  onCropComplete={handleCrop}
  showRecommendations={true}
  exportFormat="jpeg"
  exportQuality={0.95}
/>
```

## 📋 Crop Presets

### Available Presets

| Preset ID | Label | Aspect Ratio | Recommended Size | Use Case |
|-----------|-------|--------------|------------------|----------|
| `profile` | Profile Picture | 1:1 | 500×500px | User avatars, profile photos |
| `teacher_cover` | Teacher Cover | 16:9 | 1920×1080px | Teacher profile banners |
| `course_card` | Course Card | 4:3 | 800×600px | Course thumbnails, listings |
| `event_banner` | Event Banner | 21:9 | 2560×1080px | Event headers, ultra-wide |
| `free` | Free Crop | - | Any | Custom dimensions |

### Preset Object Structure

```tsx
interface CropPreset {
  id: CropCategory;
  label: string;
  aspectRatio: number | null;
  recommendedWidth: number;
  recommendedHeight: number;
  icon: React.ReactNode;
  color: string;
  description: string;
  proTip: string;
}
```

## 🎨 Component API

### Props

```tsx
interface ImageCropperProProps {
  // Required: Callback when crop is complete
  onCropComplete: (blob: Blob, url: string, preset: CropPreset) => void;

  // Optional: Callback when user cancels
  onCancel?: () => void;

  // Default preset to start with
  defaultPreset?: CropCategory; // Default: "teacher_cover"

  // Additional CSS classes
  className?: string;

  // Show size recommendation table
  showRecommendations?: boolean; // Default: true

  // Export format (JPEG or WebP)
  exportFormat?: "jpeg" | "webp"; // Default: "jpeg"

  // Export quality (0.0 - 1.0)
  exportQuality?: number; // Default: 0.95
}
```

### Usage Examples

#### Profile Picture
```tsx
<ImageCropperPro
  defaultPreset="profile"
  onCropComplete={(blob, url, preset) => {
    setProfilePicture(url);
    uploadProfilePicture(blob);
  }}
/>
```

#### Teacher Cover (High Quality WebP)
```tsx
<ImageCropperPro
  defaultPreset="teacher_cover"
  exportFormat="webp"
  exportQuality={0.95}
  onCropComplete={(blob, url, preset) => {
    setCoverPhoto(url);
    uploadCoverPhoto(blob);
  }}
/>
```

#### Course Card
```tsx
<ImageCropperPro
  defaultPreset="course_card"
  showRecommendations={true}
  onCropComplete={handleCrop}
/>
```

#### Event Banner
```tsx
<ImageCropperPro
  defaultPreset="event_banner"
  onCropComplete={handleCrop}
  onCancel={() => setShowCropper(false)}
/>
```

## 🎯 Key Features

### 1. Smart Preset System

The component includes **5 professionally designed presets**:

- **Profile (1:1)** - Perfect square for avatars
  - Recommended: 500×500px
  - Pro-Tip: "Use a close-up photo with your face centered"

- **Teacher Cover (16:9)** - Widescreen banners
  - Recommended: 1920×1080px
  - Pro-Tip: "Recommended: 1920×1080px for crisp, professional covers"

- **Course Card (4:3)** - Standard photo format
  - Recommended: 800×600px
  - Pro-Tip: "Recommended: 800×600px - Perfect for course listings"

- **Event Banner (21:9)** - Ultra-wide format
  - Recommended: 2560×1080px
  - Pro-Tip: "Recommended: 2560×1080px - Ultra-wide for stunning event banners"

- **Free Crop** - No restrictions
  - Recommended: 1200×1200px (suggested max)
  - Pro-Tip: "Total freedom - crop to any dimension you need"

### 2. Visual Size Recommendations

The component displays a **built-in recommendation table** showing:
- Category name with icon
- Aspect ratio
- Recommended resolution

This table updates dynamically and highlights the currently selected preset.

### 3. Pro-Tips & Guidance

Each preset includes **context-aware pro-tips** that appear when:
- Selecting a preset (before upload)
- Cropping an image (during editing)

Examples:
- Profile: "Use a close-up photo with your face centered for best results"
- Teacher Cover: "Recommended: 1920×1080px for crisp, professional covers"
- Course Card: "Perfect for course listings"

### 4. Smart Fit-to-Format

When switching between presets, the image automatically:
- **Centers** in the new crop area
- **Scales** to fill the space
- **Resets** zoom to 1x

This gives users a smart starting point for each format.

### 5. Mobile-First UX

**Touch Gestures:**
- Pinch to zoom in/out
- Drag to move image
- Two-finger pan for fine adjustments

**Desktop Controls:**
- Mouse wheel for zoom
- Click and drag to move
- Smooth sliders for precision

### 6. High-Quality Export

**JPEG Mode:**
- 95% quality by default
- Hidden canvas rendering
- No pixelation or blur

**WebP Mode:**
- Better compression (~30% smaller)
- Same visual quality
- Modern browser support

## 💡 Advanced Usage

### Upload to Server

```tsx
const handleCrop = async (blob: Blob, url: string, preset: CropPreset) => {
  const formData = new FormData();
  formData.append('file', blob, `${preset.id}_${Date.now()}.jpg`);
  formData.append('category', preset.id);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const { uploadedUrl } = await response.json();
  console.log('Uploaded to:', uploadedUrl);
};
```

### Custom Preset Configuration

```tsx
import { CROP_PRESETS } from "@/components/ImageCropperPro";

// Access all presets
const allPresets = CROP_PRESETS;

// Get specific preset
const teacherCover = CROP_PRESETS.find(p => p.id === "teacher_cover");

// Use preset data
console.log(teacherCover.recommendedWidth); // 1920
console.log(teacherCover.aspectRatio);      // 1.777...
```

### Dynamic Preset Selection

```tsx
const [selectedCategory, setSelectedCategory] = useState<CropCategory>("profile");

<ImageCropperPro
  key={selectedCategory} // Force re-mount on change
  defaultPreset={selectedCategory}
  onCropComplete={handleCrop}
/>
```

### File Validation

The component includes built-in validation:
- Maximum file size: 10MB
- Accepted types: All image formats (image/*)

To customize:

```tsx
// Edit the onFileChange callback in ImageCropperPro.tsx
if (file.size > 5 * 1024 * 1024) { // 5MB limit
  alert("File is too large. Maximum size is 5MB.");
  return;
}
```

### Export Multiple Formats

```tsx
const handleCrop = async (blob: Blob, url: string, preset: CropPreset) => {
  // Save original
  await uploadImage(blob, 'original');

  // Also create thumbnail (if profile)
  if (preset.id === 'profile') {
    const thumbnail = await resizeBlob(blob, 128, 128);
    await uploadImage(thumbnail, 'thumbnail');
  }
};
```

## 🎨 UI Customization

### Custom Styling

```tsx
<ImageCropperPro
  className="max-w-4xl mx-auto shadow-xl"
  defaultPreset="teacher_cover"
  onCropComplete={handleCrop}
/>
```

### Hide Recommendations Table

```tsx
<ImageCropperPro
  showRecommendations={false}
  defaultPreset="profile"
  onCropComplete={handleCrop}
/>
```

### Custom Quality Settings

```tsx
// Maximum quality (larger file size)
<ImageCropperPro
  exportFormat="jpeg"
  exportQuality={1.0}
  onCropComplete={handleCrop}
/>

// Balanced quality (recommended)
<ImageCropperPro
  exportFormat="webp"
  exportQuality={0.85}
  onCropComplete={handleCrop}
/>
```

## 📱 Demo

**Live Demo Route:** `/image-cropper-pro`

The demo includes:
- ✅ All 5 presets in action
- ✅ Interactive grid showing cropped results
- ✅ Download functionality
- ✅ Delete and re-crop options
- ✅ Features explanation tab
- ✅ "No-Fail" experience showcase

## 🔧 Integration Examples

### BecomeInstructor Form

```tsx
import ImageCropperPro from "@/components/ImageCropperPro";

function BecomeInstructor() {
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);

  const handleCoverCrop = (blob: Blob, url: string, preset: CropPreset) => {
    setCoverBlob(blob);
    setShowCoverCropper(false);
  };

  const handleSubmit = async (formData) => {
    // Upload cover photo
    if (coverBlob) {
      const uploadedUrl = await uploadImage(coverBlob);
      formData.coverPhotoUrl = uploadedUrl;
    }

    // Submit application
    await submitApplication(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}

      {showCoverCropper ? (
        <ImageCropperPro
          defaultPreset="teacher_cover"
          onCropComplete={handleCoverCrop}
          onCancel={() => setShowCoverCropper(false)}
        />
      ) : (
        <Button onClick={() => setShowCoverCropper(true)}>
          Upload Cover Photo
        </Button>
      )}
    </form>
  );
}
```

### Course Creation

```tsx
<ImageCropperPro
  defaultPreset="course_card"
  exportFormat="webp"
  onCropComplete={(blob, url, preset) => {
    setCourseImage(url);
    uploadCourseImage(blob);
  }}
/>
```

### Event Management

```tsx
<ImageCropperPro
  defaultPreset="event_banner"
  exportQuality={0.95}
  onCropComplete={(blob, url, preset) => {
    setEventBanner(url);
    uploadEventBanner(blob);
  }}
/>
```

## 🎯 The "No-Fail" Experience

### Why It Works

1. **Forced Aspect Ratios**
   - Ensures consistent website layout
   - Users feel control within defined boundaries
   - No broken or distorted images

2. **Smart Recommendations**
   - Visual guide for quality-conscious users
   - Flexibility for quick mobile uploads
   - Pro-tips educate users on best practices

3. **Auto-Centering Logic**
   - Images automatically fit when switching presets
   - Smart starting point reduces user effort
   - Instant preview of final result

4. **Professional Output**
   - Hidden canvas prevents blur/pixelation
   - 95% JPEG quality maintains detail
   - WebP option reduces file size without quality loss

### Result

Any photo, regardless of original size or format, will:
- ✅ Fit perfectly in the target section
- ✅ Look professional and crisp
- ✅ Maintain consistent aspect ratio
- ✅ Load quickly (optimized file size)

## 🐛 Troubleshooting

### Images appear blurry
- Component uses 95% JPEG quality by default
- Ensure you're using the Blob, not the preview URL
- Check if your server is re-compressing images

### Pinch zoom not working
- Check viewport meta tag allows scaling:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  ```

### Large images causing lag
- Component validates max 10MB file size
- Consider client-side resize before cropping
- Use WebP format for better compression

### Preset not applying
- Ensure `defaultPreset` value matches a valid CropCategory
- Try using `key` prop to force re-mount when changing presets

## 📚 Files

```
uk-sabor-web/
├── client/src/components/
│   ├── ImageCropperPro.tsx           ✅ Main enhanced component
│   ├── ImageCropperProDemo.tsx       ✅ Professional demo
│   ├── ImageCropper.tsx              ⚡ Original simple version
│   └── ImageCropperDemo.tsx          ⚡ Original demo
├── PRO_CROPPER_GUIDE.md              ✅ This file
├── IMAGE_CROPPER_GUIDE.md            ⚡ Original guide
└── IMPLEMENTATION_SUMMARY.md         ⚡ Original summary
```

## 🆚 Comparison: Basic vs Pro

| Feature | ImageCropper | ImageCropperPro |
|---------|-------------|-----------------|
| Aspect ratio presets | 5 presets | 5 smart presets |
| Recommendation table | ❌ No | ✅ Yes |
| Pro-tips | ❌ No | ✅ Yes |
| Auto-centering | ❌ No | ✅ Yes |
| WebP export | ❌ No | ✅ Yes |
| Category icons | ❌ No | ✅ Yes |
| Size guidance | ❌ No | ✅ Yes |
| File validation | ❌ No | ✅ Yes (10MB) |
| Preset metadata | Basic | Rich (description, tips) |

**Recommendation:** Use `ImageCropperPro` for production, especially in educational platforms.

## 🚀 Next Steps

1. **Visit the demo:** `/image-cropper-pro`
2. **Test all presets** with different images
3. **Try mobile gestures** on a touch device
4. **Integrate into your forms** using examples above
5. **Customize presets** if needed for your use case

## 📞 Support

- **Demo:** Navigate to `/image-cropper-pro`
- **Docs:** This file (PRO_CROPPER_GUIDE.md)
- **Original:** IMAGE_CROPPER_GUIDE.md

---

**Built with ❤️ for teachers and students**
**Version:** 2.0.0 (Pro)
**Status:** ✅ Production Ready
