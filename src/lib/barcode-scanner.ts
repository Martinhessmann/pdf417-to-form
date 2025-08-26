// Purpose: Barcode scanner utility for extracting PDF417 codes from images
// Uses ZXing library to decode barcodes from image files and camera streams

import { BrowserPDF417Reader, NotFoundException, BinaryBitmap, HybridBinarizer, RGBLuminanceSource } from '@zxing/library';

export class BarcodeScanner {
  private reader: BrowserPDF417Reader;

  constructor() {
    console.log('[BarcodeScanner] Initializing BrowserPDF417Reader...');
    this.reader = new BrowserPDF417Reader();
    console.log('[BarcodeScanner] Reader initialized:', this.reader);
  }

    /**
   * Scan PDF417 barcode from image file
   */
  async scanFromFile(file: File): Promise<string> {
    console.log('[BarcodeScanner] Starting scan from file:', file.name, file.type, file.size);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          console.log('[BarcodeScanner] Image loaded:', img.width, 'x', img.height);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.error('[BarcodeScanner] Failed to get canvas context');
            reject(new Error('Failed to get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          console.log('[BarcodeScanner] Image drawn to canvas');

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          console.log('[BarcodeScanner] Image data extracted:', imageData.width, 'x', imageData.height, 'pixels');
          
          // Convert ImageData to format expected by ZXing
          const luminanceSource = new RGBLuminanceSource(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
          );
          console.log('[BarcodeScanner] Luminance source created');
          
          const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
          console.log('[BarcodeScanner] Binary bitmap created');
          
          console.log('[BarcodeScanner] Reader methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.reader)));
          
          // Try to decode
          this.reader.decode(binaryBitmap)
            .then(result => {
              console.log('[BarcodeScanner] Decode successful:', result.getText());
              resolve(result.getText());
            })
            .catch(error => {
              console.error('[BarcodeScanner] Decode failed:', error);
              if (error instanceof NotFoundException) {
                reject(new Error('No PDF417 barcode found in image'));
              } else {
                reject(new Error(`Scan failed: ${error.message}`));
              }
            });
        } catch (error) {
          console.error('[BarcodeScanner] Image processing error:', error);
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
   * Scan PDF417 barcode from camera stream
   */
  async scanFromCamera(): Promise<string> {
    console.log('[BarcodeScanner] Starting camera scan...');
    
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('[BarcodeScanner] Camera not supported');
      throw new Error('Camera access not supported');
    }

    console.log('[BarcodeScanner] Requesting camera access...');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Use back camera on mobile
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    console.log('[BarcodeScanner] Camera stream obtained');

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('[BarcodeScanner] Failed to get canvas context');
        reject(new Error('Failed to get canvas context'));
        return;
      }

      video.srcObject = stream;
      video.play();
      console.log('[BarcodeScanner] Video element started');

      let scanAttempts = 0;
      const maxAttempts = 300; // 10 seconds at ~30fps

      const scanFrame = () => {
        scanAttempts++;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          try {
            const luminanceSource = new RGBLuminanceSource(
              new Uint8ClampedArray(imageData.data),
              imageData.width,
              imageData.height
            );
            const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
            
            this.reader.decode(binaryBitmap)
              .then(result => {
                console.log('[BarcodeScanner] Camera scan successful after', scanAttempts, 'attempts');
                stream.getTracks().forEach(track => track.stop());
                resolve(result.getText());
              })
              .catch(() => {
                // Continue scanning if no barcode found
                if (scanAttempts < maxAttempts) {
                  requestAnimationFrame(scanFrame);
                } else {
                  stream.getTracks().forEach(track => track.stop());
                  reject(new Error('Scan timeout - no barcode detected after ' + maxAttempts + ' attempts'));
                }
              });
          } catch (error) {
            console.error('[BarcodeScanner] Frame processing error:', error);
            if (scanAttempts < maxAttempts) {
              requestAnimationFrame(scanFrame);
            } else {
              stream.getTracks().forEach(track => track.stop());
              reject(new Error('Scan failed: ' + (error instanceof Error ? error.message : 'Unknown error')));
            }
          }
        } else {
          requestAnimationFrame(scanFrame);
        }
      };

      video.addEventListener('loadedmetadata', () => {
        console.log('[BarcodeScanner] Video metadata loaded, starting scan loop');
        scanFrame();
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        console.log('[BarcodeScanner] Camera scan timeout');
        stream.getTracks().forEach(track => track.stop());
        reject(new Error('Scan timeout - no barcode detected'));
      }, 30000);
    });
  }

    /**
   * Scan PDF417 barcode from image element
   */
  async scanFromImageElement(imgElement: HTMLImageElement): Promise<string> {
    console.log('[BarcodeScanner] Scanning from image element:', imgElement.width, 'x', imgElement.height);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('[BarcodeScanner] Failed to get canvas context');
      throw new Error('Failed to get canvas context');
    }

    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log('[BarcodeScanner] Image data extracted from element');
    
    try {
      const luminanceSource = new RGBLuminanceSource(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      
      const result = await this.reader.decode(binaryBitmap);
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
