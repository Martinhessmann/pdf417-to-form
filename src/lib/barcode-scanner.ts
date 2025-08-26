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

          // Ensure image has valid dimensions
          if (img.width === 0 || img.height === 0) {
            throw new Error('Image has invalid dimensions');
          }

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

          // Method 4: Try with different resolutions (for large images)
          try {
            console.log('[BarcodeScanner] Attempting multi-resolution scanning...');
            result = await this.scanMultiResolution(img);
            if (result) {
              console.log('[BarcodeScanner] Multi-resolution scan successful:', result);
              URL.revokeObjectURL(img.src);
              resolve(result);
              return;
            }
          } catch (error) {
            console.log('[BarcodeScanner] Multi-resolution scan failed:', error);
            lastError = error;
          }

          // Method 5: Try with cropped regions (for large images)
          try {
            console.log('[BarcodeScanner] Attempting cropped region scanning...');
            result = await this.scanCroppedRegions(img);
            if (result) {
              console.log('[BarcodeScanner] Cropped scan successful:', result);
              URL.revokeObjectURL(img.src);
              resolve(result);
              return;
            }
          } catch (error) {
            console.log('[BarcodeScanner] Cropped scan failed:', error);
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

    // Validate image dimensions
    if (img.width === 0 || img.height === 0) {
      throw new Error('Invalid image dimensions for canvas scanning');
    }

    // Set canvas size to image size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image to canvas
    ctx.drawImage(img, 0, 0);

        // Get image data and process it manually
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Try scanning without enhancement first
    try {
      console.log('[BarcodeScanner] Trying canvas scan without enhancement');
      const result = await this.scanImageData(imageData);
      return result;
    } catch (error) {
      // If that fails, try with contrast enhancement
      console.log('[BarcodeScanner] Trying canvas scan with contrast enhancement');
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

    // Validate image dimensions
    if (img.width === 0 || img.height === 0) {
      throw new Error('Invalid image dimensions for scaled scanning');
    }

    // Scale up the image for better barcode recognition
    const scale = 2.0;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

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
    console.log(`[BarcodeScanner] Processing ImageData: ${imageData.width}x${imageData.height}, data length: ${imageData.data.length}`);

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
      console.log(`[BarcodeScanner] Created data URL, length: ${dataURL.length}`);

      // Create image element from data URL
      const img = new Image();

      img.onload = async () => {
        try {
          console.log(`[BarcodeScanner] Image element loaded: ${img.width}x${img.height}`);

          // Use ZXing's built-in method to scan the image element
          const result = await this.reader.decodeFromImageElement(img);
          console.log('[BarcodeScanner] Decode successful via converted image');
          resolve(result.getText());
        } catch (error) {
          console.error('[BarcodeScanner] Image element decode error:', error);
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

    // Validate image dimensions
    if (img.width === 0 || img.height === 0) {
      throw new Error('Invalid image dimensions for cropped scanning');
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

        // Calculate crop dimensions
        const cropX = Math.floor(img.width * region.x);
        const cropY = Math.floor(img.height * region.y);
        const cropWidth = Math.floor(img.width * region.width);
        const cropHeight = Math.floor(img.height * region.height);

        console.log(`[BarcodeScanner] Crop dimensions: ${cropWidth}x${cropHeight} at (${cropX}, ${cropY})`);

        // Validate crop dimensions
        if (cropWidth <= 0 || cropHeight <= 0) {
          console.log(`[BarcodeScanner] ❌ Invalid crop dimensions for region: ${region.name}`);
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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Validate image dimensions
    if (img.width === 0 || img.height === 0) {
      throw new Error('Invalid image dimensions for multi-resolution scanning');
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
        console.log(`[BarcodeScanner] Trying resolution: ${name} (${Math.floor(img.width * scale)}x${Math.floor(img.height * scale)})`);

        // Calculate scaled dimensions
        const scaledWidth = Math.floor(img.width * scale);
        const scaledHeight = Math.floor(img.height * scale);

        // Validate scaled dimensions
        if (scaledWidth <= 0 || scaledHeight <= 0) {
          console.log(`[BarcodeScanner] ❌ Invalid scaled dimensions for resolution: ${name}`);
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

    console.log('[BarcodeScanner] Camera support check:', {
      isSecureContext,
      hasMediaDevices,
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
    });

    return isSecureContext && hasMediaDevices;
  }

  /**
   * Scan PDF417 barcode from camera stream
   */
  async scanFromCamera(): Promise<string> {
    console.log('[BarcodeScanner] Starting camera scan...');

    // Enhanced camera support detection
    if (!this.isCameraSupported()) {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

      if (!isHttps && !isLocalhost) {
        console.error('[BarcodeScanner] Camera requires HTTPS');
        throw new Error('Camera access requires HTTPS. Please use HTTPS or localhost.');
      } else if (!navigator.mediaDevices?.getUserMedia) {
        console.error('[BarcodeScanner] MediaDevices API not supported');
        throw new Error('Camera access not supported by this browser. Please use a modern browser with camera support.');
      } else {
        console.error('[BarcodeScanner] Camera not supported for unknown reason');
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
