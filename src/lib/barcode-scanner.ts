// Purpose: Barcode scanner utility for extracting PDF417 codes from images
// Uses ZXing library to decode barcodes from image files and camera streams

import { BrowserPDF417Reader, NotFoundException } from '@zxing/library';

export class BarcodeScanner {
  private reader: BrowserPDF417Reader;

  constructor() {
    console.log('[BarcodeScanner] Initializing BrowserPDF417Reader...');
    this.reader = new BrowserPDF417Reader();
    console.log('[BarcodeScanner] Reader initialized');
  }

    /**
   * Scan PDF417 barcode from image file
   */
  async scanFromFile(file: File): Promise<string> {
    console.log('[BarcodeScanner] Starting scan from file:', file.name, file.type, file.size);

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = async () => {
        try {
          console.log('[BarcodeScanner] Image loaded:', img.width, 'x', img.height);

          // Try multiple scanning approaches for better reliability
          let result = null;
          let lastError = null;

          // Method 1: Direct image element scanning
          try {
            console.log('[BarcodeScanner] Attempting direct image scanning...');
            result = await this.reader.decodeFromImageElement(img);
            if (result) {
              console.log('[BarcodeScanner] Direct scan successful:', result.getText());
              URL.revokeObjectURL(img.src);
              resolve(result.getText());
              return;
            }
          } catch (error) {
            console.log('[BarcodeScanner] Direct scan failed:', error);
            lastError = error;
          }

          // Method 2: Canvas-based scanning with preprocessing
          try {
            console.log('[BarcodeScanner] Attempting canvas-based scanning...');
            result = await this.scanFromCanvas(img);
            if (result) {
              console.log('[BarcodeScanner] Canvas scan successful:', result);
              URL.revokeObjectURL(img.src);
              resolve(result);
              return;
            }
          } catch (error) {
            console.log('[BarcodeScanner] Canvas scan failed:', error);
            lastError = error;
          }

          // Method 3: Try with different image scaling
          try {
            console.log('[BarcodeScanner] Attempting scaled image scanning...');
            result = await this.scanFromScaledCanvas(img);
            if (result) {
              console.log('[BarcodeScanner] Scaled scan successful:', result);
              URL.revokeObjectURL(img.src);
              resolve(result);
              return;
            }
          } catch (error) {
            console.log('[BarcodeScanner] Scaled scan failed:', error);
            lastError = error;
          }

          // All methods failed
          console.error('[BarcodeScanner] All scanning methods failed');
          URL.revokeObjectURL(img.src);

          if (lastError instanceof NotFoundException) {
            reject(new Error('No PDF417 barcode found in image. Please ensure the barcode is clearly visible and try again.'));
          } else {
            reject(new Error(`Scan failed: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`));
          }
        } catch (error) {
          console.error('[BarcodeScanner] Unexpected error:', error);
          URL.revokeObjectURL(img.src);
          reject(new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      img.onerror = (error) => {
        console.error('[BarcodeScanner] Image load failed:', error);
        reject(new Error('Failed to load image'));
      };

      const imageUrl = URL.createObjectURL(file);
      console.log('[BarcodeScanner] Created object URL:', imageUrl);
      img.src = imageUrl;
    });
  }

  /**
   * Scan using canvas with image preprocessing
   */
  private async scanFromCanvas(img: HTMLImageElement): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set canvas size to image size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image to canvas
    ctx.drawImage(img, 0, 0);

    // Try to scan the canvas directly
    try {
      const result = await this.reader.decodeFromImageElement(canvas);
      return result.getText();
    } catch (error) {
      // If direct canvas scan fails, try with image data processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Enhance contrast
      this.enhanceImageContrast(imageData);
      ctx.putImageData(imageData, 0, 0);

      const result = await this.reader.decodeFromImageElement(canvas);
      return result.getText();
    }
  }

  /**
   * Scan using scaled canvas for better recognition
   */
  private async scanFromScaledCanvas(img: HTMLImageElement): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Scale up the image for better barcode recognition
    const scale = 2.0;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Use high quality scaling
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const result = await this.reader.decodeFromImageElement(canvas);
    return result.getText();
  }

  /**
   * Enhance image contrast for better barcode recognition
   */
  private enhanceImageContrast(imageData: ImageData): void {
    const data = imageData.data;
    const factor = 1.5; // Contrast factor
    const intercept = 128 * (1 - factor);

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast adjustment to RGB channels
      data[i] = Math.max(0, Math.min(255, data[i] * factor + intercept));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor + intercept)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor + intercept)); // B
      // Alpha channel (data[i + 3]) remains unchanged
    }
  }

    /**
   * Scan PDF417 barcode from camera stream
   */
  async scanFromCamera(): Promise<string> {
    console.log('[BarcodeScanner] Starting camera scan...');

    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('[BarcodeScanner] Camera not supported');
      throw new Error('Camera access not supported');
    }

    return new Promise(async (resolve, reject) => {
      let stream: MediaStream | null = null;
      let video: HTMLVideoElement | null = null;
      let scanning = false;

      const cleanup = () => {
        scanning = false;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      try {
        console.log('[BarcodeScanner] Requesting camera access...');

        // Request camera access with mobile-optimized settings
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        });

        console.log('[BarcodeScanner] Camera access granted');

        // Create video element
        video = document.createElement('video');
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true'); // Important for iOS
        video.style.display = 'none';
        document.body.appendChild(video);

        await new Promise((resolve) => {
          video!.onloadedmetadata = () => {
            video!.play();
            console.log('[BarcodeScanner] Video ready:', video!.videoWidth, 'x', video!.videoHeight);
            resolve(undefined);
          };
        });

        // Start scanning loop
        scanning = true;
        let scanCount = 0;
        const maxScans = 600; // 20 seconds at ~30fps

        const scanFrame = async () => {
          if (!scanning || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
            if (scanning && scanCount < maxScans) {
              requestAnimationFrame(scanFrame);
            }
            return;
          }

          scanCount++;
          console.log(`[BarcodeScanner] Scanning frame ${scanCount}/${maxScans}`);

          try {
            // Use the same method as image scanning for consistency
            const result = await this.reader.decodeFromImageElement(video);

            if (result && result.getText) {
              console.log('[BarcodeScanner] Camera scan successful:', result.getText());
              cleanup();
              document.body.removeChild(video);
              resolve(result.getText());
              return;
            }
          } catch (error) {
            // Continue scanning on decode errors (expected when no barcode found)
          }

          if (scanCount >= maxScans) {
            cleanup();
            document.body.removeChild(video);
            reject(new Error('Camera scan timeout - no PDF417 barcode detected after 20 seconds'));
            return;
          }

          // Continue scanning
          requestAnimationFrame(scanFrame);
        };

        // Start the scanning loop
        scanFrame();

      } catch (error) {
        cleanup();
        if (video && document.body.contains(video)) {
          document.body.removeChild(video);
        }

        console.error('[BarcodeScanner] Camera setup failed:', error);

        if (error instanceof NotFoundException) {
          reject(new Error('No PDF417 barcode found'));
        } else if (error && typeof error === 'object' && 'name' in error && error.name === 'NotAllowedError') {
          reject(new Error('Camera access denied. Please allow camera permissions and try again.'));
        } else if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFoundError') {
          reject(new Error('No camera found on this device'));
        } else {
          reject(new Error(`Camera scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      }
    });
  }

  /**
   * Scan PDF417 barcode from image element
   */
  async scanFromImageElement(imgElement: HTMLImageElement): Promise<string> {
    console.log('[BarcodeScanner] Scanning from image element:', imgElement.width, 'x', imgElement.height);

    try {
      // Use ZXing's built-in method to decode from image element
      const result = await this.reader.decodeFromImageElement(imgElement);
      console.log('[BarcodeScanner] Element scan successful:', result.getText());
      return result.getText();
    } catch (error) {
      console.error('[BarcodeScanner] Element scan failed:', error);
      if (error instanceof NotFoundException) {
        throw new Error('No PDF417 barcode found in image');
      }
      throw new Error(`Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const barcodeScanner = new BarcodeScanner();
