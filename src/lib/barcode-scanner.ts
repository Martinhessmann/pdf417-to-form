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

          // Use ZXing's built-in method to decode from image element
          const result = await this.reader.decodeFromImageElement(img);
          console.log('[BarcodeScanner] Decode successful:', result.getText());

          // Clean up the object URL
          URL.revokeObjectURL(img.src);
          resolve(result.getText());
        } catch (error) {
          console.error('[BarcodeScanner] Decode failed:', error);

          // Clean up the object URL
          URL.revokeObjectURL(img.src);

          if (error instanceof NotFoundException) {
            reject(new Error('No PDF417 barcode found in image'));
          } else {
            reject(new Error(`Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
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
