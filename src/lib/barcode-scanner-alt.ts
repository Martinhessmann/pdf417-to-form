// Purpose: Alternative PDF417 barcode scanner with different ZXing approaches
// Fallback implementation for debugging scanning issues

export class AlternativeBarcodeScanner {
  
  /**
   * Try scanning with @zxing/browser (simpler API)
   */
  async scanWithBrowserAPI(file: File): Promise<string> {
    console.log('[AltScanner] Attempting scan with @zxing/browser API...');
    
    try {
      // Try the browser-specific API
      const { BrowserPDF417Reader } = await import('@zxing/browser');
      console.log('[AltScanner] BrowserPDF417Reader imported:', BrowserPDF417Reader);
      
      const codeReader = new BrowserPDF417Reader();
      console.log('[AltScanner] CodeReader created:', codeReader);
      console.log('[AltScanner] Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(codeReader)));
      
      // Create image element
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          console.log('[AltScanner] Image loaded for browser API scan');
          
          try {
            // Try different methods that might be available
            if (typeof codeReader.decodeFromImage === 'function') {
              console.log('[AltScanner] Using decodeFromImage method');
              codeReader.decodeFromImage(img)
                .then(result => {
                  console.log('[AltScanner] Browser API scan success:', result.text);
                  resolve(result.text);
                })
                .catch(error => {
                  console.error('[AltScanner] Browser API decodeFromImage failed:', error);
                  reject(error);
                });
            } else if (typeof codeReader.decodeFromImageElement === 'function') {
              console.log('[AltScanner] Using decodeFromImageElement method');
              codeReader.decodeFromImageElement(img)
                .then(result => {
                  console.log('[AltScanner] Browser API scan success:', result.text);
                  resolve(result.text);
                })
                .catch(error => {
                  console.error('[AltScanner] Browser API decodeFromImageElement failed:', error);
                  reject(error);
                });
            } else {
              console.error('[AltScanner] No suitable decode method found');
              reject(new Error('No suitable decode method found in browser API'));
            }
          } catch (error) {
            console.error('[AltScanner] Browser API processing error:', error);
            reject(error);
          } finally {
            URL.revokeObjectURL(imageUrl);
          }
        };
        
        img.onerror = (error) => {
          console.error('[AltScanner] Image load failed:', error);
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Failed to load image'));
        };
        
        img.src = imageUrl;
      });
      
    } catch (error) {
      console.error('[AltScanner] Browser API import/setup failed:', error);
      throw error;
    }
  }

  /**
   * Try scanning with manual canvas processing
   */
  async scanWithCanvasProcessing(file: File): Promise<string> {
    console.log('[AltScanner] Attempting scan with canvas processing...');
    
    try {
      const { BrowserPDF417Reader, RGBLuminanceSource, HybridBinarizer, BinaryBitmap } = await import('@zxing/library');
      console.log('[AltScanner] Library components imported');
      
      const reader = new BrowserPDF417Reader();
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          console.log('[AltScanner] Image loaded for canvas processing');
          
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Failed to get canvas context');
            }
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            console.log('[AltScanner] Canvas processing - imageData:', imageData.width, 'x', imageData.height);
            
            // Create luminance source
            const rgbArray = new Uint8ClampedArray(imageData.data.length / 4);
            for (let i = 0; i < imageData.data.length; i += 4) {
              // Convert RGBA to grayscale
              const r = imageData.data[i];
              const g = imageData.data[i + 1];
              const b = imageData.data[i + 2];
              rgbArray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            }
            
            const luminanceSource = new RGBLuminanceSource(rgbArray, imageData.width, imageData.height);
            const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
            
            console.log('[AltScanner] Binary bitmap created for canvas processing');
            
            // Try to decode
            reader.decode(binaryBitmap)
              .then(result => {
                console.log('[AltScanner] Canvas processing scan success:', result.getText());
                resolve(result.getText());
              })
              .catch(error => {
                console.error('[AltScanner] Canvas processing decode failed:', error);
                reject(error);
              });
              
          } catch (error) {
            console.error('[AltScanner] Canvas processing error:', error);
            reject(error);
          } finally {
            URL.revokeObjectURL(imageUrl);
          }
        };
        
        img.onerror = (error) => {
          console.error('[AltScanner] Image load failed:', error);
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Failed to load image'));
        };
        
        img.src = imageUrl;
      });
      
    } catch (error) {
      console.error('[AltScanner] Canvas processing setup failed:', error);
      throw error;
    }
  }

  /**
   * Try all scanning methods
   */
  async scanFromFile(file: File): Promise<string> {
    console.log('[AltScanner] Starting comprehensive scan attempts...');
    
    const methods = [
      { name: 'Browser API', method: this.scanWithBrowserAPI.bind(this) },
      { name: 'Canvas Processing', method: this.scanWithCanvasProcessing.bind(this) }
    ];
    
    for (const { name, method } of methods) {
      try {
        console.log(`[AltScanner] Trying ${name} method...`);
        const result = await method(file);
        console.log(`[AltScanner] ${name} method succeeded:`, result);
        return result;
      } catch (error) {
        console.error(`[AltScanner] ${name} method failed:`, error);
        // Continue to next method
      }
    }
    
    throw new Error('All scanning methods failed');
  }
}

export const altBarcodeScanner = new AlternativeBarcodeScanner();
