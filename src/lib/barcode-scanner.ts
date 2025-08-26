// Purpose: Barcode scanner utility for extracting PDF417 codes from images
// Uses ZXing library to decode barcodes from image files and camera streams

import { BrowserPDF417Reader, NotFoundException } from '@zxing/library';

export class BarcodeScanner {
  private reader: BrowserPDF417Reader;

  constructor() {
    this.reader = new BrowserPDF417Reader();
  }

    /**
   * Scan PDF417 barcode from image file
   */
    async scanFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = async () => {
        try {
          // Resize large images for better barcode detection (like messaging apps do)
          const resizedImg = await this.resizeImageIfNeeded(img);

          // Try multiple scanning approaches for better reliability
          let result = null;
          let lastError = null;

          // Method 1: Direct image element scanning
          try {
            result = await this.reader.decodeFromImageElement(resizedImg);
            if (result) {
              URL.revokeObjectURL(img.src);
              resolve(result.getText());
              return;
            }
          } catch (error) {
            lastError = error;
          }

          // Method 2: Canvas-based scanning with preprocessing
          try {
            result = await this.scanFromCanvas(resizedImg);
            if (result) {
              URL.revokeObjectURL(img.src);
              resolve(result);
              return;
            }
          } catch (error) {
            lastError = error;
          }

          // All methods failed
          URL.revokeObjectURL(img.src);

          if (lastError instanceof NotFoundException) {
            reject(new Error('No PDF417 barcode found in image. Please ensure the barcode is clearly visible and try again.'));
          } else {
            reject(new Error(`Scan failed: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`));
          }
        } catch (error) {
          URL.revokeObjectURL(img.src);
          reject(new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      const imageUrl = URL.createObjectURL(file);
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

    // Basic validation - canvas methods should work with loaded images
    if (!img.complete && img.naturalWidth === 0) {
      throw new Error('Image not properly loaded for canvas scanning');
    }

    // Set canvas size to image's natural size (actual pixel dimensions)
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    // Draw image to canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data and process it manually
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Try scanning without enhancement first
    try {
      const result = await this.scanImageData(imageData);
      return result;
    } catch (error) {
      // If that fails, try with contrast enhancement
      this.enhanceImageContrast(imageData);

      // Put the enhanced data back on canvas for processing
      ctx.putImageData(imageData, 0, 0);
      const enhancedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const result = await this.scanImageData(enhancedImageData);
      return result;
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

    // Basic validation - ensure image is loaded
    if (!img.complete && img.naturalWidth === 0) {
      throw new Error('Image not properly loaded for scaled scanning');
    }

    // Scale up the image for better barcode recognition
    const scale = 2.0;
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;
    canvas.width = naturalWidth * scale;
    canvas.height = naturalHeight * scale;

    // Use high quality scaling - disable smoothing for sharp edges
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get the scaled image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Scan the scaled image data
    const result = await this.scanImageData(imageData);
    return result;
  }

    /**
   * Scan ImageData by converting canvas to image element that ZXing can process
   */
  private async scanImageData(imageData: ImageData): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a new canvas and put the ImageData on it
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) {
        reject(new Error('Failed to get temp canvas context'));
        return;
      }

      tempCanvas.width = imageData.width;
      tempCanvas.height = imageData.height;
      tempCtx.putImageData(imageData, 0, 0);

      // Convert canvas to data URL
      const dataURL = tempCanvas.toDataURL('image/png');

      // Create image element from data URL
      const img = new Image();

      img.onload = async () => {
        try {
          // Use ZXing's built-in method to scan the image element
          const result = await this.reader.decodeFromImageElement(img);
          resolve(result.getText());
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image from data URL'));
      };

      img.src = dataURL;
    });
  }

    /**
   * Try scanning different cropped regions of the image
   */
  private async scanCroppedRegions(img: HTMLImageElement): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Basic validation - ensure image is loaded
    if (!img.complete && img.naturalWidth === 0) {
      throw new Error('Image not properly loaded for cropped scanning');
    }

        // Define crop regions to try (as percentages of image dimensions)
    // Specifically targeted for German healthcare form barcode locations
    const cropRegions = [
      // Bottom-right area (most common for German healthcare forms)
      { name: 'bottom-right', x: 0.4, y: 0.6, width: 0.6, height: 0.4 },
      // Right side bottom area
      { name: 'right-bottom', x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
      // Bottom area centered
      { name: 'bottom-center', x: 0.2, y: 0.7, width: 0.6, height: 0.3 },
      // Full bottom third
      { name: 'bottom-full', x: 0.0, y: 0.65, width: 1.0, height: 0.35 },
      // Bottom-left area (alternative layout)
      { name: 'bottom-left', x: 0.0, y: 0.6, width: 0.6, height: 0.4 },
      // Large bottom area
      { name: 'bottom-large', x: 0.0, y: 0.5, width: 1.0, height: 0.5 },
      // Center-right area
      { name: 'center-right', x: 0.5, y: 0.3, width: 0.5, height: 0.5 },
      // Full right side
      { name: 'right-full', x: 0.6, y: 0.0, width: 0.4, height: 1.0 },
    ];

    for (const region of cropRegions) {
      try {
        console.log(`[BarcodeScanner] Trying crop region: ${region.name} (${Math.floor(region.x*100)}%, ${Math.floor(region.y*100)}%, ${Math.floor(region.width*100)}% x ${Math.floor(region.height*100)}%)`);

        // Calculate crop dimensions using natural image dimensions
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        const cropX = Math.floor(naturalWidth * region.x);
        const cropY = Math.floor(naturalHeight * region.y);
        const cropWidth = Math.floor(naturalWidth * region.width);
        const cropHeight = Math.floor(naturalHeight * region.height);

        console.log(`[BarcodeScanner] Crop dimensions: ${cropWidth}x${cropHeight} at (${cropX}, ${cropY})`);

        // Skip tiny crop regions that won't contain readable barcodes
        if (cropWidth < 50 || cropHeight < 50) {
          console.log(`[BarcodeScanner] ❌ Crop region too small for region: ${region.name}`);
          continue;
        }

        // Set canvas to crop size
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw cropped region
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

        // Get image data from the cropped region
        const imageData = ctx.getImageData(0, 0, cropWidth, cropHeight);

        // Try scanning this region
        const result = await this.scanImageData(imageData);
        console.log(`[BarcodeScanner] ✅ Found barcode in region: ${region.name}!`);
        return result;

      } catch (error) {
        console.log(`[BarcodeScanner] ❌ No barcode in region: ${region.name}`);
        // Continue to next region
        continue;
      }
    }

    throw new NotFoundException('No barcode found in any cropped region');
  }

  /**
   * Try scanning at different resolutions (for very large images)
   */
  private async scanMultiResolution(img: HTMLImageElement): Promise<string> {
    console.log('[BarcodeScanner] scanMultiResolution - img dimensions:', img.width, 'x', img.height, 'naturalWidth:', img.naturalWidth, 'naturalHeight:', img.naturalHeight);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Basic validation - ensure image is loaded
    if (!img.complete && img.naturalWidth === 0) {
      throw new Error('Image not properly loaded for multi-resolution scanning');
    }

    // Define different resolution scales to try
    const resolutionScales = [
      { scale: 0.5, name: '50%' },    // Half resolution - often optimal for barcode recognition
      { scale: 0.25, name: '25%' },   // Quarter resolution
      { scale: 0.75, name: '75%' },   // Three-quarter resolution
      { scale: 1.0, name: '100%' },   // Original resolution
    ];

    for (const scaleConfig of resolutionScales) {
      try {
        const { scale, name } = scaleConfig;
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        console.log(`[BarcodeScanner] Trying resolution: ${name} (${Math.floor(naturalWidth * scale)}x${Math.floor(naturalHeight * scale)})`);

        // Calculate scaled dimensions using natural image dimensions
        const scaledWidth = Math.floor(naturalWidth * scale);
        const scaledHeight = Math.floor(naturalHeight * scale);

        // Skip tiny scaled images that won't be useful
        if (scaledWidth < 50 || scaledHeight < 50) {
          console.log(`[BarcodeScanner] ❌ Scaled dimensions too small for resolution: ${name}`);
          continue;
        }

        // Set canvas to scaled size
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        // Use high-quality scaling
        ctx.imageSmoothingEnabled = false; // For sharp barcode edges
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

        // Get image data from the scaled image
        const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);

        // Try scanning this resolution
        const result = await this.scanImageData(imageData);
        console.log(`[BarcodeScanner] ✅ Found barcode at resolution: ${name}!`);
        return result;

      } catch (error) {
        console.log(`[BarcodeScanner] ❌ No barcode at resolution: ${scaleConfig.name}`);
        // Continue to next resolution
        continue;
      }
    }

    throw new NotFoundException('No barcode found at any resolution');
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
   * Check if camera access is available
   */
  isCameraSupported(): boolean {
    // Check for secure context (HTTPS required for camera)
    const isSecureContext = typeof window !== 'undefined' &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

    // Check for MediaDevices API support
    const hasMediaDevices = typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function';

    return isSecureContext && hasMediaDevices;
  }

  /**
   * Scan PDF417 barcode from camera stream
   */
  async scanFromCamera(): Promise<string> {
    // Enhanced camera support detection
    if (!this.isCameraSupported()) {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

      if (!isHttps && !isLocalhost) {
        throw new Error('Camera access requires HTTPS. Please use HTTPS or localhost.');
      } else if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported by this browser. Please use a modern browser with camera support.');
      } else {
        throw new Error('Camera access not available.');
      }
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
        // Request camera access with mobile-optimized settings
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        });

        // Create video element
        video = document.createElement('video');
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true'); // Important for iOS
        video.style.display = 'none';
        document.body.appendChild(video);

        await new Promise((resolve) => {
          video!.onloadedmetadata = () => {
            video!.play();
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

          try {
            // Use the same method as image scanning for consistency
            const result = await this.reader.decodeFromImageElement(video);

            if (result && result.getText) {
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
    try {
      // Use ZXing's built-in method to decode from image element
      const result = await this.reader.decodeFromImageElement(imgElement);
      return result.getText();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new Error('No PDF417 barcode found in image');
      }
      throw new Error(`Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resize large images to optimal size for barcode scanning (like messaging apps do)
   */
    private async resizeImageIfNeeded(img: HTMLImageElement): Promise<HTMLImageElement> {
    const MAX_WIDTH = 1200;
    const MAX_HEIGHT = 1600;

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    // If image is already small enough, return as-is
    if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
      return img;
    }

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = width;
    let newHeight = height;

    if (width > MAX_WIDTH) {
      newWidth = MAX_WIDTH;
      newHeight = (height * MAX_WIDTH) / width;
    }

    if (newHeight > MAX_HEIGHT) {
      newWidth = (newWidth * MAX_HEIGHT) / newHeight;
      newHeight = MAX_HEIGHT;
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      canvas.width = Math.round(newWidth);
      canvas.height = Math.round(newHeight);

      // Use high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw resized image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert back to image element
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(img);
          return;
        }

        const resizedImg = new Image();
        resizedImg.onload = () => {
          resolve(resizedImg);
        };
        resizedImg.src = URL.createObjectURL(blob);
      }, 'image/jpeg', 0.85); // Good quality JPEG
    });
  }
}

export const barcodeScanner = new BarcodeScanner();
