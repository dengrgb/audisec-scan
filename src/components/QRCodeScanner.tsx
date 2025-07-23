import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Upload, X, QrCode, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QrScanner from 'qr-scanner';
import QRCode from 'qrcode';

interface QRCodeScannerProps {
  onQRScanned: (url: string) => void;
  onClose: () => void;
}

export const QRCodeScanner = ({ onQRScanned, onClose }: QRCodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [generatedQR, setGeneratedQR] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'scan' | 'generate'>('scan');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          if (result.data) {
            handleQRResult(result.data);
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await qrScannerRef.current.start();
      
      toast({
        title: "Camera Started",
        description: "Point your camera at a QR code to scan",
      });
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await QrScanner.scanImage(file);
      handleQRResult(result);
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Could not find a valid QR code in the image",
        variant: "destructive"
      });
    }
  };

  const handleQRResult = (data: string) => {
    setQrCode(data);
    
    // Check if it's a URL
    try {
      new URL(data);
      onQRScanned(data);
      toast({
        title: "QR Code Scanned",
        description: `Found URL: ${data}`,
      });
    } catch {
      toast({
        title: "QR Code Scanned",
        description: `Content: ${data}`,
        variant: "destructive"
      });
    }
  };

  const generateQRCode = async () => {
    if (!inputUrl.trim()) {
      toast({
        title: "Enter URL",
        description: "Please enter a URL to generate QR code",
        variant: "destructive"
      });
      return;
    }

    try {
      new URL(inputUrl); // Validate URL
      const qrDataUrl = await QRCode.toDataURL(inputUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#10B981', // Using our success color
          light: '#FFFFFF'
        }
      });
      setGeneratedQR(qrDataUrl);
      
      toast({
        title: "QR Code Generated",
        description: "QR code generated successfully",
      });
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
    }
  };

  const downloadQRCode = () => {
    if (!generatedQR) return;

    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = generatedQR;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Downloaded",
      description: "QR code saved to downloads",
    });
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Scanner & Generator
          </DialogTitle>
          <DialogDescription>
            Scan QR codes with your camera or upload an image, or generate QR codes for URLs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tab Buttons */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'scan' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('scan');
                if (isScanning) stopCamera();
              }}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Scan QR Code
            </Button>
            <Button
              variant={activeTab === 'generate' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('generate');
                if (isScanning) stopCamera();
              }}
              className="flex-1"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Generate QR Code
            </Button>
          </div>

          {activeTab === 'scan' && (
            <Card>
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>
                  Use your camera or upload an image containing a QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={isScanning ? stopCamera : startCamera}
                    variant={isScanning ? "destructive" : "default"}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {isScanning ? "Stop Camera" : "Start Camera"}
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {isScanning && (
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      playsInline
                    />
                  </div>
                )}

                {qrCode && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Scanned Content:</Label>
                    <p className="text-sm mt-1 break-all">{qrCode}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'generate' && (
            <Card>
              <CardHeader>
                <CardTitle>Generate QR Code</CardTitle>
                <CardDescription>
                  Create a QR code for any URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url-input">URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url-input"
                      placeholder="https://example.com"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={generateQRCode}>
                      Generate
                    </Button>
                  </div>
                </div>

                {generatedQR && (
                  <div className="text-center space-y-4">
                    <div className="inline-block p-4 bg-white rounded-lg">
                      <img 
                        src={generatedQR} 
                        alt="Generated QR Code" 
                        className="w-64 h-64 mx-auto"
                      />
                    </div>
                    <Button onClick={downloadQRCode} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};