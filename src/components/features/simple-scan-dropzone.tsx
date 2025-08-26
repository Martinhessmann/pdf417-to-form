// Purpose: Clean, simple dropzone for PDF417 barcode scanning
// Just drag & drop → scan → callback with results

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, AlertCircle } from 'lucide-react';
import { barcodeScanner } from '@/lib/barcode-scanner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface SimpleScanDropzoneProps {
  onScanSuccess: (data: string) => void;
  className?: string;
}

export function SimpleScanDropzone({ onScanSuccess, className }: SimpleScanDropzoneProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageScan = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[SimpleScanDropzone] Scanning file:', file.name);
      const barcodeData = await barcodeScanner.scanFromFile(file);
      console.log('[SimpleScanDropzone] Scan successful, data length:', barcodeData.length);
      onScanSuccess(barcodeData);
    } catch (err) {
      console.error('[SimpleScanDropzone] Scan failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan barcode';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraScan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[SimpleScanDropzone] Starting camera scan...');
      const barcodeData = await barcodeScanner.scanFromCamera();
      console.log('[SimpleScanDropzone] Camera scan successful, data length:', barcodeData.length);
      onScanSuccess(barcodeData);
    } catch (err) {
      console.error('[SimpleScanDropzone] Camera scan failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Camera scan failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleImageScan(file);
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

  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Main Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200',
          {
            'border-primary bg-primary/5 scale-[1.02]': isDragActive,
            'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5': !isLoading && !isDragActive,
            'cursor-not-allowed opacity-60': isLoading,
          }
        )}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto">
            <Upload className={cn("h-8 w-8 text-muted-foreground", {
              "animate-bounce": isDragActive
            })} />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-1 w-32 bg-muted rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">
                Scanning barcode...
              </p>
            </div>
          ) : isDragActive ? (
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop your image here</p>
              <p className="text-sm text-muted-foreground">
                We'll scan for PDF417 barcodes automatically
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium">Scan Healthcare Form</p>
              <p className="text-sm text-muted-foreground">
                Drag & drop an image with a PDF417 barcode, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Supports Muster 10, 6, 12, 16 and other German healthcare forms
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Camera Button */}
      {isMobile && (
        <div className="flex justify-center">
          <Button
            onClick={handleCameraScan}
            disabled={isLoading}
            size="lg"
            className="flex items-center gap-2"
          >
            <Camera className="h-5 w-5" />
            {isLoading ? 'Scanning...' : 'Use Camera'}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <div className="text-center text-xs text-muted-foreground">
        <p>📋 For best results, ensure the barcode is clearly visible and well-lit</p>
      </div>
    </div>
  );
}
