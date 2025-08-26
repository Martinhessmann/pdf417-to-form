// Purpose: Test component to verify ZXing library functionality
// Used for debugging PDF417 scanning issues

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrowserPDF417Reader, NotFoundException, BinaryBitmap, HybridBinarizer, RGBLuminanceSource } from '@zxing/library';

export function ZXingTest() {
  const [testResult, setTestResult] = useState<string>('');

  const testZXingImports = () => {
    console.log('[ZXingTest] Testing ZXing imports...');

    try {
      // Test basic imports
      console.log('[ZXingTest] BrowserPDF417Reader:', BrowserPDF417Reader);
      console.log('[ZXingTest] NotFoundException:', NotFoundException);
      console.log('[ZXingTest] BinaryBitmap:', BinaryBitmap);
      console.log('[ZXingTest] HybridBinarizer:', HybridBinarizer);
      console.log('[ZXingTest] RGBLuminanceSource:', RGBLuminanceSource);

      // Test reader creation
      const reader = new BrowserPDF417Reader();
      console.log('[ZXingTest] Reader created:', reader);
      console.log('[ZXingTest] Reader prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(reader)));
      console.log('[ZXingTest] Reader methods:', Object.getOwnPropertyNames(reader));

      // Test if decode method exists
      console.log('[ZXingTest] Has decode method:', typeof reader.decode === 'function');
      console.log('[ZXingTest] Has decodeFromImageData method:', typeof reader.decodeFromImageData === 'function');

      setTestResult('✅ ZXing library imports and reader creation successful');
    } catch (error) {
      console.error('[ZXingTest] Error:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testImageDataCreation = () => {
    console.log('[ZXingTest] Testing ImageData creation...');

    try {
      // Create a small test canvas
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Fill with a pattern
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = 'white';
      ctx.fillRect(10, 10, 80, 80);

      const imageData = ctx.getImageData(0, 0, 100, 100);
      console.log('[ZXingTest] ImageData created:', imageData);

      // Test ZXing components
      // Use imported RGBLuminanceSource, HybridBinarizer, BinaryBitmap

      const luminanceSource = new RGBLuminanceSource(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );
      console.log('[ZXingTest] LuminanceSource created:', luminanceSource);

      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      console.log('[ZXingTest] BinaryBitmap created:', binaryBitmap);

      setTestResult('✅ ImageData and ZXing components creation successful');
    } catch (error) {
      console.error('[ZXingTest] Error:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">ZXing Library Debug Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testZXingImports} variant="outline" size="sm">
            Test Imports
          </Button>
          <Button onClick={testImageDataCreation} variant="outline" size="sm">
            Test ImageData
          </Button>
        </div>

        {testResult && (
          <div className="p-3 bg-muted rounded text-sm font-mono">
            {testResult}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Check browser console for detailed logs
        </div>
      </CardContent>
    </Card>
  );
}
