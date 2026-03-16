import { useState } from "react";
import ImageCropper from "./ImageCropper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, X, Upload } from "lucide-react";

/**
 * ImageCropperDemo - Example component showing how to use ImageCropper
 *
 * This demonstrates two common use cases:
 * 1. Profile Picture (1:1 aspect ratio)
 * 2. Cover Photo (16:9 aspect ratio for teacher profiles)
 */
export default function ImageCropperDemo() {
  const [showProfileCropper, setShowProfileCropper] = useState(false);
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Handle profile image crop
  const handleProfileCrop = (blob: Blob, url: string) => {
    setProfileImage(url);
    setShowProfileCropper(false);
    // Here you would typically upload the blob to your server
    console.log("Profile image blob:", blob);
  };

  // Handle cover image crop
  const handleCoverCrop = (blob: Blob, url: string) => {
    setCoverImage(url);
    setShowCoverCropper(false);
    // Here you would typically upload the blob to your server
    console.log("Cover image blob:", blob);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Professional Image Cropper</h1>
        <p className="text-lg text-muted-foreground">
          Instagram-style image cropping with mobile-first gestures
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary">📱 Mobile Gestures</Badge>
          <Badge variant="secondary">🔄 Pinch to Zoom</Badge>
          <Badge variant="secondary">✨ High Resolution</Badge>
          <Badge variant="secondary">🎨 Free Crop</Badge>
        </div>
      </div>

      {/* Profile Picture Section */}
      <Card className="glass-dark shadow-xl">
        <CardHeader className="border-b brand-gradient-bg">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/10">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            Profile Picture
          </CardTitle>
          <CardDescription>Square format (1:1) - Perfect for profile photos</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {!showProfileCropper ? (
            <div className="space-y-4">
              {profileImage ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <img
                      src={profileImage}
                      alt="Profile preview"
                      className="w-48 h-48 rounded-full object-cover shadow-lg border-4 border-white/10"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setProfileImage(null)}
                      className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => setShowProfileCropper(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Change Photo
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    onClick={() => setShowProfileCropper(true)}
                    className="btn-vibrant flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Profile Picture
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <ImageCropper
              aspectRatioPreset={1}
              onCropComplete={handleProfileCrop}
              onCancel={() => setShowProfileCropper(false)}
            />
          )}
        </CardContent>
      </Card>

      {/* Cover Photo Section */}
      <Card className="glass-dark shadow-xl">
        <CardHeader className="border-b brand-gradient-bg">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/10">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            Teacher Profile Cover
          </CardTitle>
          <CardDescription>Wide format (16:9) - Perfect for cover photos</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {!showCoverCropper ? (
            <div className="space-y-4">
              {coverImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full aspect-video object-cover"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setCoverImage(null)}
                      className="absolute top-4 right-4 rounded-full w-8 h-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <Button
                      onClick={() => setShowCoverCropper(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Change Cover
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    onClick={() => setShowCoverCropper(true)}
                    className="btn-vibrant flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Cover Photo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <ImageCropper
              aspectRatioPreset={16 / 9}
              onCropComplete={handleCoverCrop}
              onCancel={() => setShowCoverCropper(false)}
            />
          )}
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="border-accent/50 bg-accent/5">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              ✨ Features
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span><strong>Mobile-First:</strong> Full support for pinch-to-zoom and drag gestures on mobile devices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span><strong>Desktop Support:</strong> Mouse wheel zoom and click-and-drag navigation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span><strong>Flexible Aspect Ratios:</strong> Choose from 16:9, 3:1, 1:1, 9:16, or free crop mode</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span><strong>High-Resolution Export:</strong> Images are exported at 95% JPEG quality for professional results</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span><strong>Rotation Controls:</strong> Rotate images in 90-degree increments or any angle with the slider</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span><strong>Dark Mode Compatible:</strong> Styled with Tailwind CSS for seamless dark mode integration</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Guide */}
      <Card className="border-purple-500/50 bg-purple-500/5">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              💻 Usage Example
            </h3>
            <pre className="bg-black/50 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`import ImageCropper from "@/components/ImageCropper";

// In your component:
const [showCropper, setShowCropper] = useState(false);

const handleCrop = (blob: Blob, url: string) => {
  // Upload blob to server or use URL for preview
  console.log("Cropped image:", blob);
  setShowCropper(false);
};

return (
  <ImageCropper
    aspectRatioPreset={16 / 9}  // or 1, 3/1, 9/16, null
    onCropComplete={handleCrop}
    onCancel={() => setShowCropper(false)}
  />
);`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
