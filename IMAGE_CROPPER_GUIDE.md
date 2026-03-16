# Professional Image Cropper Component

A highly flexible, mobile-first image cropper component for React with Instagram-style user experience.

## ✨ Features

### Mobile-First UX
- **Touch Gestures**: Full support for pinch-to-zoom and drag-to-move on mobile devices
- **Desktop Support**: Mouse wheel zooming and click-and-drag functionality
- **Responsive Design**: Works seamlessly on all screen sizes

### Flexible Cropping
- **Aspect Ratio Presets**:
  - Free Crop (unrestricted)
  - Cover 16:9 (perfect for teacher profile covers)
  - Cover 3:1 (ultra-wide covers)
  - Square 1:1 (profile pictures)
  - Portrait 9:16 (mobile-first content)
- **Dynamic Switching**: Change aspect ratio during editing
- **Rotation Controls**:
  - 90-degree quick rotation button
  - Fine-tuned rotation slider (0-360°)

### High-Quality Output
- **Hidden Canvas Rendering**: Prevents pixelation and blur
- **95% JPEG Quality**: Professional-grade image export
- **Blob Export**: Ready for direct upload to servers
- **Base64 URL**: Instant preview capability

### Professional UI
- **Tailwind CSS Styling**: Modern, clean design
- **Dark Mode Compatible**: Seamless theme integration
- **Glass Morphism Effects**: Beautiful card designs
- **Smooth Animations**: Polished user interactions

## 📦 Installation

The component uses `react-easy-crop` for the core cropping functionality:

```bash
pnpm add react-easy-crop
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { useState } from "react";
import ImageCropper from "@/components/ImageCropper";

function MyComponent() {
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const handleCropComplete = (blob: Blob, url: string) => {
    // Use the URL for preview
    setCroppedImage(url);

    // Upload the blob to your server
    uploadToServer(blob);

    // Close the cropper
    setShowCropper(false);
  };

  return (
    <div>
      {showCropper ? (
        <ImageCropper
          aspectRatioPreset={16 / 9}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      ) : (
        <button onClick={() => setShowCropper(true)}>
          Upload Image
        </button>
      )}
    </div>
  );
}
```

### Profile Picture (1:1)

```tsx
<ImageCropper
  aspectRatioPreset={1}
  onCropComplete={(blob, url) => {
    setProfilePicture(url);
    uploadProfilePicture(blob);
  }}
  onCancel={() => setShowCropper(false)}
/>
```

### Teacher Cover (16:9)

```tsx
<ImageCropper
  aspectRatioPreset={16 / 9}
  onCropComplete={(blob, url) => {
    setCoverPhoto(url);
    uploadCoverPhoto(blob);
  }}
  onCancel={() => setShowCropper(false)}
/>
```

### Ultra-Wide Cover (3:1)

```tsx
<ImageCropper
  aspectRatioPreset={3 / 1}
  onCropComplete={handleCrop}
/>
```

### Free Crop (No Restrictions)

```tsx
<ImageCropper
  aspectRatioPreset={null}
  onCropComplete={handleCrop}
/>
```

## 🎨 Component API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onCropComplete` | `(blob: Blob, url: string) => void` | **Required** | Callback when user completes cropping |
| `onCancel` | `() => void` | `undefined` | Optional callback when user cancels |
| `aspectRatioPreset` | `number \| null` | `16 / 9` | Initial aspect ratio (null = free crop) |
| `className` | `string` | `undefined` | Additional CSS classes for the card |

### Aspect Ratio Values

- `null` - Free crop (no restrictions)
- `16 / 9` - Wide cover (1.78:1)
- `3 / 1` - Ultra-wide cover (3:1)
- `1` - Square (1:1)
- `9 / 16` - Portrait (0.56:1)
- Custom: Any number (width/height ratio)

## 💡 Advanced Usage

### Upload to Server

```tsx
const handleCropComplete = async (blob: Blob, url: string) => {
  // Create FormData for upload
  const formData = new FormData();
  formData.append('image', blob, 'cropped-image.jpg');

  // Upload to your API
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  console.log('Uploaded:', data.imageUrl);
};
```

### Convert to Base64

```tsx
const handleCropComplete = (blob: Blob, url: string) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result as string;
    console.log('Base64:', base64);
  };
  reader.readAsDataURL(blob);
};
```

### Custom Aspect Ratio

```tsx
// Custom 21:9 ultra-wide
<ImageCropper
  aspectRatioPreset={21 / 9}
  onCropComplete={handleCrop}
/>

// A4 paper ratio
<ImageCropper
  aspectRatioPreset={210 / 297}
  onCropComplete={handleCrop}
/>
```

## 📱 Mobile Gestures

### Touch Controls
- **Pinch**: Zoom in/out on the image
- **Drag**: Move the image within the crop area
- **Two-finger drag**: Pan the image

### Desktop Controls
- **Mouse Wheel**: Zoom in/out
- **Click + Drag**: Move the image
- **Slider**: Fine-tune zoom level
- **Rotation Slider**: Rotate to any angle

## 🎯 Use Cases

### 1. Teacher Profile Covers
Perfect for wide, professional cover photos:
```tsx
<ImageCropper aspectRatioPreset={16 / 9} />
```

### 2. Profile Pictures
Square format for avatars:
```tsx
<ImageCropper aspectRatioPreset={1} />
```

### 3. Event Banners
Ultra-wide banners:
```tsx
<ImageCropper aspectRatioPreset={3 / 1} />
```

### 4. Instagram Stories
Vertical format:
```tsx
<ImageCropper aspectRatioPreset={9 / 16} />
```

### 5. Free-Form Editing
Let users decide:
```tsx
<ImageCropper aspectRatioPreset={null} />
```

## 🔧 Technical Details

### Image Processing
- Uses HTML5 Canvas API for high-quality rendering
- Implements rotation matrix transformations
- Maintains original image quality during processing
- Exports at 95% JPEG quality to balance size and quality

### Performance
- Lazy loading of cropper UI
- Optimized canvas rendering
- Minimal re-renders with React hooks
- Efficient touch event handling

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Styling

The component uses Tailwind CSS classes and is fully customizable:

```tsx
<ImageCropper
  className="max-w-2xl mx-auto"
  aspectRatioPreset={16 / 9}
  onCropComplete={handleCrop}
/>
```

### Custom Colors
The component respects your Tailwind theme:
- `brand-gradient-bg` - Header gradient
- `glass-dark` - Card background
- `btn-vibrant` - Primary button
- Dark mode compatible out of the box

## 📝 Integration Example

See [ImageCropperDemo.tsx](./client/src/components/ImageCropperDemo.tsx) for a complete working example with:
- Profile picture cropper (1:1)
- Cover photo cropper (16:9)
- Preview functionality
- State management
- Error handling

## 🐛 Troubleshooting

### Images appear blurry
- The component exports at 95% quality by default
- Check your server isn't re-compressing images
- Ensure you're using the Blob, not the preview URL

### Pinch zoom not working on mobile
- Ensure your viewport meta tag allows user scaling:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

### Large images causing lag
- Consider resizing images before cropping
- Use image optimization libraries
- Implement lazy loading for multiple croppers

## 📚 Resources

- [react-easy-crop Documentation](https://github.com/ValentinH/react-easy-crop)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)

## 🤝 Contributing

This component is part of the UK Sabor Web project. To contribute:
1. Test on both mobile and desktop
2. Ensure dark mode compatibility
3. Follow the existing Tailwind CSS patterns
4. Update this documentation if adding features

## 📄 License

Part of the UK Sabor Web project - MIT License

---

**Built with ❤️ for the dance community**
