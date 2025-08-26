// Purpose: Clean, simple dropzone for PDF417 barcode scanning
// Just drag & drop → scan → callback with results

'use client';

import { useState, useCallback, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

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

  // Detect mobile after component mounts to avoid hydration mismatch
  useEffect(() => {
    const checkIsMobile = () => {
      return typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);
    };
    setIsMobile(checkIsMobile());
  }, []);

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Main Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-300 bg-gradient-to-br from-card via-card to-muted/10',
          {
            'border-primary bg-primary/10 scale-[1.02] animate-pulse-glow': isDragActive,
            'border-border/40 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg': !isLoading && !isDragActive,
            'cursor-not-allowed opacity-60': isLoading,
          }
        )}
        role="button"
        tabIndex={0}
        aria-label={isLoading ? "Processing image..." : "Upload healthcare form image"}
        aria-describedby="dropzone-instructions"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isLoading) {
              // Trigger file input click
              const input = document.querySelector('input[type="file"]') as HTMLInputElement;
              input?.click();
            }
          }
        }}
      >
        <input
          {...getInputProps()}
          aria-label="Upload healthcare form image file"
        />

        <div className="space-y-6">
          {/* Icon Section */}
          <div className={cn(
            "relative w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300",
            {
              "bg-primary/20 animate-bounce": isDragActive,
              "bg-muted/50": !isDragActive && !isLoading,
              "bg-primary/10": isLoading
            }
          )}>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Upload className={cn("h-10 w-10 transition-all duration-300", {
                "text-primary animate-bounce": isDragActive,
                "text-muted-foreground": !isDragActive
              })} />
            )}

            {/* Decorative elements */}
            {!isLoading && (
              <>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary/20 rounded-full" />
              </>
            )}
          </div>

          {/* Content Section */}
          {isLoading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-2 w-48 bg-muted rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-primary animate-pulse loading-shimmer" />
                </div>
                <div className="h-1.5 w-32 bg-muted rounded-full mx-auto opacity-60" />
              </div>
              <p className="text-base font-medium text-primary">
                Analyzing barcode data...
              </p>
              <p className="text-sm text-muted-foreground">
                This may take a few seconds
              </p>
            </div>
          ) : isDragActive ? (
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-primary">Perfect! Drop it here</h3>
              <p className="text-base text-muted-foreground max-w-md mx-auto">
                Release to start scanning for PDF417 barcodes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Upload Healthcare Form</h3>
              <p
                id="dropzone-instructions"
                className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed"
              >
                Drag and drop an image containing a PDF417 barcode, or click to browse files
              </p>

              {/* Supported formats */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['JPG', 'PNG', 'WEBP', 'GIF', 'BMP'].map((format) => (
                  <span
                    key={format}
                    className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full font-mono"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background decoration */}
        {!isLoading && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}
      </div>

      {/* Mobile Camera Button */}
      {isMobile && (
        <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={handleCameraScan}
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
          >
            <Camera className="h-5 w-5 mr-3" />
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Scanning...
              </>
            ) : (
              'Use Camera'
            )}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="animate-slide-up shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Instructions Card */}
      <div className="bg-card border border-border/50 rounded-lg p-6 text-center space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <h4 className="font-semibold text-foreground">📋 Scanning Tips</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span>Good lighting</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span>Clear focus</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-accent/50 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <span>Full barcode visible</span>
          </div>
        </div>
      </div>
    </div>
  );
}
