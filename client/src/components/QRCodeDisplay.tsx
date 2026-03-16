import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { logger } from "@/lib/logger";

interface QRCodeDisplayProps {
  itemType: "event" | "class";
  itemId: number;
  itemTitle: string;
  qrCode?: string;
  onQRCodeGenerated?: (code: string) => void;
}

export default function QRCodeDisplay({
  itemType,
  itemId,
  itemTitle,
  qrCode,
  onQRCodeGenerated,
}: QRCodeDisplayProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Generate QR code image
  useEffect(() => {
    if (!qrCode) return;

    const generateQRImage = async () => {
      try {
        const dataUrl: string = await new Promise((resolve, reject) => {
          (QRCode as any).toDataURL(qrCode, {
            errorCorrectionLevel: "H",
            type: "image/png",
            margin: 1,
            width: 300,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          } as any, (err: any, url: string) => {
            if (err) reject(err);
            else resolve(url);
          });
        });
        setQrImage(dataUrl);
      } catch (error) {
        logger.error('Failed to generate QR code image', error);
      }
    };

    generateQRImage();
  }, [qrCode]);

  const handleDownload = async () => {
    if (!qrImage) return;

    try {
      const link = document.createElement("a");
      link.href = qrImage;
      link.download = `${itemType}-${itemId}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR code downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download QR code");
    }
  };

  const handleCopyCode = async () => {
    if (!qrCode) return;

    try {
      await navigator.clipboard.writeText(qrCode);
      toast.success("QR code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy QR code");
    }
  };

  if (!qrCode) {
    return null;
  }

  return (
    <>
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">QR Code</CardTitle>
              <CardDescription>Check-in code for {itemType}</CardDescription>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              Generated
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Code Preview */}
          {qrImage && (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img
                src={qrImage}
                alt="QR Code"
                className="h-48 w-48 object-contain"
              />
            </div>
          )}

          {/* QR Code Value */}
          <div className="space-y-2">
            <p className="text-sm text-foreground/60">Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-background/50 border border-border/50 rounded text-xs font-mono truncate">
                {qrCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {/* Instructions */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm text-foreground/80">
            <p>
              <strong>How to use:</strong> Print or display this QR code at the entrance. Attendees can scan it with their phone to check in.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Preview</DialogTitle>
          </DialogHeader>
          {qrImage && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="p-6 bg-white rounded-lg">
                <img
                  src={qrImage}
                  alt="QR Code Preview"
                  className="h-64 w-64 object-contain"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-foreground/60">{itemType.toUpperCase()} Check-In</p>
                <p className="font-medium">{itemTitle}</p>
              </div>
              <Button onClick={handleDownload} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
