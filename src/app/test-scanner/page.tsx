'use client';

import { useState } from 'react';
import { ParsedBarcodeData } from '@/types/healthcare';
import RealTimeBarcodeScanner from '@/components/features/real-time-barcode-scanner';

export default function TestScannerPage() {
  const [detectedBarcodes, setDetectedBarcodes] = useState<ParsedBarcodeData[]>([]);

  const handleBarcodeDetected = (data: ParsedBarcodeData) => {
    console.log('[TestPage] Barcode detected:', data);
    setDetectedBarcodes(prev => [...prev, data]);
  };

  const handleError = (error: string) => {
    console.error('[TestPage] Scanner error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Real-time PDF417 Scanner Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the real-time barcode scanning functionality
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Live Scanner
            </h2>
            <RealTimeBarcodeScanner 
              onBarcodeDetected={handleBarcodeDetected}
              onError={handleError}
              autoStopOnDetection={false} // Keep scanning for testing
              scanInterval={1000}
              width={400}
              height={300}
            />
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Detected Barcodes ({detectedBarcodes.length})
            </h2>
            
            {detectedBarcodes.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <p>No barcodes detected yet.</p>
                <p className="text-sm mt-2">Point your camera at a PDF417 barcode to start scanning.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {detectedBarcodes.map((barcode, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">
                        Barcode #{index + 1}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        barcode.isValid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {barcode.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Form Type:</strong> {barcode.formType}</div>
                      {barcode.data.nachname && (
                        <div><strong>Name:</strong> {barcode.data.nachname}, {barcode.data.vorname}</div>
                      )}
                      {barcode.data.geburtsdatum && (
                        <div><strong>Birth Date:</strong> {barcode.data.geburtsdatum}</div>
                      )}
                      {barcode.data.kostentraegername && (
                        <div><strong>Insurance:</strong> {barcode.data.kostentraegername}</div>
                      )}
                    </div>

                    {barcode.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <div className="text-xs font-medium text-red-800 mb-1">Errors:</div>
                        <ul className="text-xs text-red-700 space-y-1">
                          {barcode.errors.map((error, errorIndex) => (
                            <li key={errorIndex}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {detectedBarcodes.length > 0 && (
              <button
                onClick={() => setDetectedBarcodes([])}
                className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear Results
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How to Test
          </h3>
          <div className="text-blue-800 space-y-2">
            <p>1. <strong>Start the scanner</strong> by clicking "Start Scanner"</p>
            <p>2. <strong>Point your camera</strong> at a PDF417 barcode (German healthcare form)</p>
            <p>3. <strong>Hold steady</strong> - the scanner will attempt to read the barcode every second</p>
            <p>4. <strong>Check results</strong> - detected barcodes will appear in the right panel</p>
            <p>5. <strong>Switch cameras</strong> if needed using the "Switch Camera" button</p>
          </div>
        </div>
      </div>
    </div>
  );
}
