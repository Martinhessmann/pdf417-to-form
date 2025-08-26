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

    try {
      console.log('[BarcodeScanner] Requesting camera access...');

      // Use ZXing's built-in method to decode from video device
      const result = await this.reader.decodeFromVideoDevice(
        undefined, // Use default device
        undefined, // Use default video element
        (result) => {
          console.log('[BarcodeScanner] Camera scan successful:', result.getText());
          return result; // Return result to stop scanning
        }
      );

      return result.getText();
    } catch (error) {
      console.error('[BarcodeScanner] Camera scan failed:', error);

      if (error instanceof NotFoundException) {
        throw new Error('No PDF417 barcode found');
      } else {
        throw new Error(`Camera scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
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
