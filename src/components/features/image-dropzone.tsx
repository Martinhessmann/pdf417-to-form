// Purpose: Image dropzone component with camera support for PDF417 barcode scanning
// Supports drag & drop, file selection, and mobile camera capture

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X } from 'lucide-react';
import { barcodeScanner } from '@/lib/barcode-scanner';
import { altBarcodeScanner } from '@/lib/barcode-scanner-alt';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ImageDropzoneProps {
  onBarcodeScanned: (barcodeData: string) => void;
  className?: string;
}

export function ImageDropzone({ onBarcodeScanned, className }: ImageDropzoneProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleImageScan = async (file: File) => {
    console.log('[ImageDropzone] Starting image scan for file:', file);
    setIsLoading(true);
    setError(null);

    try {
      // Create preview
      console.log('[ImageDropzone] Creating preview URL...');
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      console.log('[ImageDropzone] Preview URL created:', previewUrl);

      // Scan for barcode - try primary scanner first
      console.log('[ImageDropzone] Starting barcode scan...');
      let barcodeData: string;

      try {
        barcodeData = await barcodeScanner.scanFromFile(file);
        console.log('[ImageDropzone] Primary scanner succeeded:', barcodeData);
      } catch (primaryError) {
        console.warn('[ImageDropzone] Primary scanner failed, trying alternative:', primaryError);

        try {
          barcodeData = await altBarcodeScanner.scanFromFile(file);
          console.log('[ImageDropzone] Alternative scanner succeeded:', barcodeData);
        } catch (altError) {
          console.error('[ImageDropzone] Alternative scanner also failed:', altError);
          throw altError;
        }
      }

      onBarcodeScanned(barcodeData);
      console.log('[ImageDropzone] Barcode data passed to parent component');
    } catch (err) {
      console.error('[ImageDropzone] Scan error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan image';
      console.error('[ImageDropzone] Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('[ImageDropzone] Scan process finished');
      setIsLoading(false);
    }
  };

  const handleCameraScan = async () => {
    console.log('[ImageDropzone] Starting camera scan...');
    setIsLoading(true);
    setIsCameraActive(true);
    setError(null);

    try {
      console.log('[ImageDropzone] Calling barcodeScanner.scanFromCamera()...');
      const barcodeData = await barcodeScanner.scanFromCamera();
      console.log('[ImageDropzone] Camera scan completed:', barcodeData);
      onBarcodeScanned(barcodeData);
      console.log('[ImageDropzone] Camera barcode data passed to parent component');
    } catch (err) {
      console.error('[ImageDropzone] Camera scan error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Camera scan failed';
      console.error('[ImageDropzone] Camera error message:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('[ImageDropzone] Camera scan process finished');
      setIsLoading(false);
      setIsCameraActive(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('[ImageDropzone] Files dropped:', acceptedFiles);
    const file = acceptedFiles[0];
    if (file) {
      console.log('[ImageDropzone] Processing dropped file:', file.name, file.type, file.size);
      handleImageScan(file);
    } else {
      console.log('[ImageDropzone] No valid file found in drop');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  const clearPreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setError(null);
  };

  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Dropzone Area */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors',
              {
                'border-primary bg-primary/5': isDragActive,
                'hover:border-primary/50 hover:bg-primary/5': !isLoading,
                'cursor-not-allowed opacity-50': isLoading,
              }
            )}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-muted rounded-full">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>

              {isDragActive ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Drop the image here</p>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll scan it for PDF417 barcodes
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Drag & drop an image here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PNG, JPG, JPEG, GIF, BMP, WebP
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Camera Button for Mobile */}
          {isMobile && (
            <div className="flex justify-center">
              <Button
                onClick={handleCameraScan}
                disabled={isLoading || isCameraActive}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {isCameraActive ? 'Scanning...' : 'Use Camera'}
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                {isCameraActive ? 'Scanning with camera...' : 'Processing image...'}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Image Preview */}
          {previewImage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Scanned Image</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearPreview}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative border rounded-lg overflow-hidden">
                <img
                  src={previewImage}
                  alt="Scanned document"
                  className="w-full max-h-64 object-contain bg-muted"
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <h4 className="font-medium mb-1">Tips for better scanning:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Ensure the PDF417 barcode is clearly visible and well-lit</li>
              <li>Keep the image sharp and avoid blur</li>
              <li>Try to align the barcode horizontally in the image</li>
              <li>Higher resolution images generally work better</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
