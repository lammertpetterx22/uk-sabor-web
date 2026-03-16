import { useState } from "react";
import ImageCropperPro, { CropPreset, CROP_PRESETS } from "./ImageCropperPro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image as ImageIcon,
  X,
  Upload,
  CheckCircle2,
  Sparkles,
  Download,
  Info,
  User,
  GraduationCap,
  BookOpen,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ImageCropperProDemo - Showcase of the professional image cropper
 *
 * Demonstrates all crop presets:
 * - Profile Picture (1:1)
 * - Teacher Cover (16:9)
 * - Course Card (4:3)
 * - Event Banner (21:9)
 * - Free Crop
 */
export default function ImageCropperProDemo() {
  const [activeTab, setActiveTab] = useState("demo");
  const [showCropper, setShowCropper] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("teacher_cover");
  const [croppedImages, setCroppedImages] = useState<{
    [key: string]: { url: string; blob: Blob; preset: CropPreset };
  }>({});

  const handleCrop = (blob: Blob, url: string, preset: CropPreset) => {
    setCroppedImages(prev => ({
      ...prev,
      [preset.id]: { url, blob, preset }
    }));
    setShowCropper(false);
  };

  const handleDelete = (presetId: string) => {
    const image = croppedImages[presetId];
    if (image) {
      URL.revokeObjectURL(image.url);
      setCroppedImages(prev => {
        const newImages = { ...prev };
        delete newImages[presetId];
        return newImages;
      });
    }
  };

  const handleDownload = (presetId: string) => {
    const image = croppedImages[presetId];
    if (image) {
      const link = document.createElement("a");
      link.href = image.url;
      link.download = `${presetId}_${Date.now()}.jpg`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-block p-4 rounded-full mb-4 shadow-2xl brand-gradient-header">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="gradient-text">Professional Image Cropper</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Upload any image and perfectly fit it to your website sections with our smart,
            Instagram-style cropping tool. Supports profiles, covers, courses, and events.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="text-sm">📱 Mobile Gestures</Badge>
            <Badge variant="secondary" className="text-sm">🎯 Smart Auto-Fit</Badge>
            <Badge variant="secondary" className="text-sm">💎 High Quality</Badge>
            <Badge variant="secondary" className="text-sm">🚀 WebP Support</Badge>
            <Badge variant="secondary" className="text-sm">📏 5 Presets</Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="demo">Try It Out</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          {/* Demo Tab */}
          <TabsContent value="demo" className="space-y-6 mt-8">
            {!showCropper ? (
              <>
                {/* Preset Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CROP_PRESETS.filter(p => p.id !== "free").map((preset) => {
                    const hasImage = !!croppedImages[preset.id];
                    return (
                      <Card
                        key={preset.id}
                        className={cn(
                          "overflow-hidden hover-lift transition-all cursor-pointer",
                          hasImage && "ring-2 ring-green-500"
                        )}
                        onClick={() => {
                          setSelectedPreset(preset.id);
                          setShowCropper(true);
                        }}
                      >
                        <CardHeader className={cn("pb-3", preset.color, "text-white")}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {preset.icon}
                              <CardTitle className="text-base">{preset.label}</CardTitle>
                            </div>
                            {hasImage && <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          <CardDescription className="text-white/80 text-xs">
                            {preset.aspectRatio === 1 && "1:1 Ratio"}
                            {preset.aspectRatio === 16/9 && "16:9 Ratio"}
                            {preset.aspectRatio === 4/3 && "4:3 Ratio"}
                            {preset.aspectRatio === 21/9 && "21:9 Ratio"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-3">
                          {hasImage ? (
                            <div className="space-y-3">
                              <div className="relative rounded-lg overflow-hidden shadow-md group">
                                <img
                                  src={croppedImages[preset.id].url}
                                  alt={preset.label}
                                  className={cn(
                                    "w-full object-cover",
                                    preset.id === "profile" && "aspect-square",
                                    preset.id === "teacher_cover" && "aspect-video",
                                    preset.id === "course_card" && "aspect-[4/3]",
                                    preset.id === "event_banner" && "aspect-[21/9]"
                                  )}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(preset.id);
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(preset.id);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPreset(preset.id);
                                  setShowCropper(true);
                                }}
                              >
                                <Upload className="w-3 h-3 mr-2" />
                                Change
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <p className="text-xs text-muted-foreground text-center">
                                {preset.recommendedWidth}×{preset.recommendedHeight}px
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Free Crop Option */}
                <Card className="border-accent/50 bg-accent/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-gray-500 text-white">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Need a custom size?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Use Free Crop mode for complete control over dimensions
                        </p>
                        <Button
                          onClick={() => {
                            setSelectedPreset("free");
                            setShowCropper(true);
                          }}
                          variant="outline"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Open Free Crop
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <ImageCropperPro
                defaultPreset={selectedPreset as any}
                onCropComplete={handleCrop}
                onCancel={() => setShowCropper(false)}
                showRecommendations={true}
                exportFormat="jpeg"
                exportQuality={0.95}
              />
            )}
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    Smart Presets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Choose from 5 professionally designed presets optimized for different use cases
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Profile (1:1)</strong> - 500×500px avatars</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Teacher Cover (16:9)</strong> - 1920×1080px banners</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Course Card (4:3)</strong> - 800×600px thumbnails</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Event Banner (21:9)</strong> - 2560×1080px ultra-wide</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Free Crop</strong> - Any custom dimension</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Pro-Tips & Guidance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Get context-aware recommendations for each image type
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Recommended resolution displayed for each preset</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Pro-tips show best practices for each format</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Size recommendation table for quick reference</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Auto-centering when switching between presets</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-green-500" />
                    Mobile-First UX
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Optimized for touch devices with Instagram-style gestures
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Pinch-to-zoom gesture support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Drag-to-move for precise positioning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Two-finger pan for fine adjustments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Mouse wheel zoom for desktop users</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-orange-500" />
                    High-Quality Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Professional-grade output for all your publishing needs
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>95% JPEG quality (configurable)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>WebP format support for better compression</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Hidden canvas rendering (no blur)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Blob export ready for server upload</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* No-Fail Experience */}
            <Card className="border-accent/50 bg-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-accent" />
                  The "No-Fail" Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Our smart cropping system ensures that <strong>any photo, regardless of original size</strong>,
                  will look professional once saved. Here's how:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">🎯 Forced Aspect Ratios</h4>
                    <p className="text-xs text-muted-foreground">
                      By enforcing aspect ratios (like 16:9 for teacher covers), we ensure your website's
                      design stays perfect while teachers still feel they have "free" control within that box.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">📏 Smart Recommendations</h4>
                    <p className="text-xs text-muted-foreground">
                      The recommendation guide helps teachers who want high-quality results, while the
                      free-crop mode handles those who just want to upload a quick photo from their phone.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">✨ Auto-Centering</h4>
                    <p className="text-xs text-muted-foreground">
                      When switching presets, images automatically center and scale to fill the crop area,
                      giving users a smart starting point for their adjustments.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">💎 Professional Output</h4>
                    <p className="text-xs text-muted-foreground">
                      Hidden canvas rendering at 95% JPEG quality ensures crisp, professional-looking
                      images without pixelation or blur, even when zoomed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
