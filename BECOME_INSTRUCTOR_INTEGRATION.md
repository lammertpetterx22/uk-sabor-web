# Integrating Image Cropper into BecomeInstructor Page

This guide shows how to add profile picture and cover photo upload to the BecomeInstructor application form.

## 📋 Overview

Add two image croppers to the application form:
1. **Profile Picture** (1:1 aspect ratio) - For instructor avatar
2. **Cover Photo** (16:9 aspect ratio) - For instructor profile banner

## 🔧 Implementation

### Step 1: Add State Management

Add these state variables to [BecomeInstructor.tsx](./client/src/pages/BecomeInstructor.tsx):

```tsx
// After existing state declarations (around line 47)
const [showProfileCropper, setShowProfileCropper] = useState(false);
const [showCoverCropper, setShowCoverCropper] = useState(false);
const [profileImageBlob, setProfileImageBlob] = useState<Blob | null>(null);
const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
const [coverImageBlob, setCoverImageBlob] = useState<Blob | null>(null);
const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
```

### Step 2: Add Import

Add the ImageCropper import at the top:

```tsx
import ImageCropper from "@/components/ImageCropper";
import { Image as ImageIcon } from "lucide-react"; // Add ImageIcon
```

### Step 3: Add Crop Handlers

Add these callback functions (around line 102, after `onSubmit`):

```tsx
const handleProfileCrop = (blob: Blob, url: string) => {
  setProfileImageBlob(blob);
  setProfileImageUrl(url);
  setShowProfileCropper(false);
};

const handleCoverCrop = (blob: Blob, url: string) => {
  setCoverImageBlob(blob);
  setCoverImageUrl(url);
  setShowCoverCropper(false);
};
```

### Step 4: Update Form Schema (Optional)

If you want to make images required, update the schema:

```tsx
const applicationSchema = z.object({
  // ... existing fields ...
  profileImage: z.instanceof(Blob).optional(),
  coverImage: z.instanceof(Blob).optional(),
});
```

### Step 5: Update Submit Handler

Modify the `onSubmit` function to upload images first:

```tsx
const onSubmit = async (data: ApplicationFormData) => {
  const specialtiesArray = data.specialties
    ? data.specialties.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  // Upload images if they exist
  let uploadedProfileUrl: string | undefined;
  let uploadedCoverUrl: string | undefined;

  if (profileImageBlob) {
    // TODO: Implement your upload function
    // uploadedProfileUrl = await uploadImage(profileImageBlob);
    console.log("Profile image to upload:", profileImageBlob);
  }

  if (coverImageBlob) {
    // TODO: Implement your upload function
    // uploadedCoverUrl = await uploadImage(coverImageBlob);
    console.log("Cover image to upload:", coverImageBlob);
  }

  submitApplication.mutate({
    ...data,
    specialties: specialtiesArray,
    profileImageUrl: uploadedProfileUrl,
    coverImageUrl: uploadedCoverUrl,
  });
};
```

### Step 6: Add UI Section to Form

Add this section in the form, after the "Personal Information" section (around line 468):

```tsx
{/* Profile Images Section */}
<div className="space-y-5">
  <div className="flex items-center gap-2">
    <div className="h-8 w-1 rounded-full brand-gradient-bar" />
    <h3 className="text-lg font-semibold">Profile Images</h3>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Profile Picture */}
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        Profile Picture
      </Label>
      {showProfileCropper ? (
        <ImageCropper
          aspectRatioPreset={1}
          onCropComplete={handleProfileCrop}
          onCancel={() => setShowProfileCropper(false)}
        />
      ) : (
        <div className="space-y-3">
          {profileImageUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img
                  src={profileImageUrl}
                  alt="Profile preview"
                  className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-border"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setProfileImageUrl(null);
                    setProfileImageBlob(null);
                  }}
                  className="absolute -top-2 -right-2 rounded-full w-7 h-7 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowProfileCropper(true)}
              >
                Change Photo
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowProfileCropper(true)}
              className="w-full h-32 border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:border-accent"
            >
              <Upload className="w-6 h-6" />
              <span className="text-sm">Upload Profile Picture</span>
            </Button>
          )}
        </div>
      )}
    </div>

    {/* Cover Photo */}
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        Cover Photo
      </Label>
      {showCoverCropper ? (
        <ImageCropper
          aspectRatioPreset={16 / 9}
          onCropComplete={handleCoverCrop}
          onCancel={() => setShowCoverCropper(false)}
        />
      ) : (
        <div className="space-y-3">
          {coverImageUrl ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="w-full aspect-video object-cover"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setCoverImageUrl(null);
                    setCoverImageBlob(null);
                  }}
                  className="absolute top-2 right-2 rounded-full w-7 h-7 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowCoverCropper(true)}
                className="w-full"
              >
                Change Cover
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCoverCropper(true)}
              className="w-full h-32 border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:border-accent"
            >
              <Upload className="w-6 h-6" />
              <span className="text-sm">Upload Cover Photo</span>
            </Button>
          )}
        </div>
      )}
    </div>
  </div>

  <p className="text-xs text-muted-foreground">
    Your profile picture and cover photo will help students recognize you and make your profile more appealing.
  </p>
</div>
```

## 📤 Backend Integration

### Upload Function Example

Create a helper function to upload images:

```tsx
async function uploadImage(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.url; // Return the uploaded image URL
}
```

### Update TRPC Schema

Add these fields to your instructor application mutation:

```typescript
// In your TRPC router
submitInstructorApplication: protectedProcedure
  .input(
    z.object({
      // ... existing fields ...
      profileImageUrl: z.string().url().optional(),
      coverImageUrl: z.string().url().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Save application with image URLs
  });
```

## 🎨 Alternative: Modal Version

For a cleaner UI, you can use a modal/dialog:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// In your JSX:
<Dialog open={showProfileCropper} onOpenChange={setShowProfileCropper}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Crop Profile Picture</DialogTitle>
    </DialogHeader>
    <ImageCropper
      aspectRatioPreset={1}
      onCropComplete={handleProfileCrop}
      onCancel={() => setShowProfileCropper(false)}
    />
  </DialogContent>
</Dialog>
```

## ✅ Testing Checklist

- [ ] Profile picture uploads successfully
- [ ] Cover photo uploads successfully
- [ ] Cropped images display correctly in previews
- [ ] Cancel button works (clears cropper without saving)
- [ ] Change button allows re-cropping
- [ ] Delete button removes image
- [ ] Images are included in form submission
- [ ] Mobile gestures work (pinch/zoom)
- [ ] Desktop controls work (mouse wheel)
- [ ] Form validation works with images
- [ ] Images upload to server correctly

## 🚀 Production Considerations

### Image Optimization
```tsx
// Resize large images before cropping
const resizeImage = async (blob: Blob, maxWidth: number): Promise<Blob> => {
  // ... implementation
};

// Use in crop handler:
const handleProfileCrop = async (blob: Blob, url: string) => {
  const optimizedBlob = await resizeImage(blob, 800); // Max 800px
  setProfileImageBlob(optimizedBlob);
  setProfileImageUrl(url);
  setShowProfileCropper(false);
};
```

### Error Handling
```tsx
const handleProfileCrop = async (blob: Blob, url: string) => {
  try {
    // Validate file size (e.g., max 5MB)
    if (blob.size > 5 * 1024 * 1024) {
      toast.error("Image is too large. Maximum 5MB.");
      return;
    }

    setProfileImageBlob(blob);
    setProfileImageUrl(url);
    setShowProfileCropper(false);
  } catch (error) {
    console.error("Crop error:", error);
    toast.error("Failed to process image");
  }
};
```

### Loading States
```tsx
const [isUploading, setIsUploading] = useState(false);

const onSubmit = async (data: ApplicationFormData) => {
  setIsUploading(true);
  try {
    // Upload images...
    // Submit form...
  } finally {
    setIsUploading(false);
  }
};
```

## 📝 Notes

- Images are stored as Blobs in state until submission
- Preview URLs are created with `URL.createObjectURL()`
- Remember to revoke URLs when component unmounts to prevent memory leaks:
  ```tsx
  useEffect(() => {
    return () => {
      if (profileImageUrl) URL.revokeObjectURL(profileImageUrl);
      if (coverImageUrl) URL.revokeObjectURL(coverImageUrl);
    };
  }, [profileImageUrl, coverImageUrl]);
  ```

## 🎯 Final Result

After integration, instructors can:
1. Click "Upload Profile Picture" or "Upload Cover Photo"
2. Select an image from their device
3. Crop and adjust the image with mobile gestures
4. See a preview of their cropped image
5. Re-crop or delete if needed
6. Submit the form with images included

The images are uploaded to your server and associated with their instructor profile!

---

**Need Help?** Check the [IMAGE_CROPPER_GUIDE.md](./IMAGE_CROPPER_GUIDE.md) for more details.
