'use client';

import { useState } from 'react';
import { ParsedBarcodeData } from '@/types/healthcare';
import { BarcodeInput } from '@/components/features/barcode-input';
import { HealthcareForm } from '@/components/features/healthcare-form';
import WebcamCapture from '@/components/features/webcam-capture';
import RealTimeBarcodeScanner from '@/components/features/real-time-barcode-scanner';

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedBarcodeData | null>(null);

  const handleDataParsed = (data: ParsedBarcodeData | null) => {
    setParsedData(data);
  };

  const handleRealTimeBarcodeDetected = (data: ParsedBarcodeData) => {
    console.log('[Home] Real-time barcode detected:', data);
    setParsedData(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PDF417 Healthcare Form Parser
          </h1>
          <p className="text-lg text-gray-600">
            Real-time barcode scanning and parsing for German healthcare forms
          </p>
          <div className="mt-4">
            <a
              href="/test-scanner"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Test Real-time Scanner
            </a>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Real-time Barcode Scanner Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Real-time Barcode Scanner
            </h2>
            <p className="text-gray-600 mb-4">
              Point your camera at a PDF417 barcode to scan and parse it automatically.
            </p>
            <RealTimeBarcodeScanner
              onBarcodeDetected={handleRealTimeBarcodeDetected}
              onError={(error) => console.error('[Home] Scanner error:', error)}
              autoStopOnDetection={true}
              scanInterval={500} // Scan every 500ms for better responsiveness
            />
          </div>

          {/* Manual Barcode Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Manual Barcode Input
            </h2>
            <p className="text-gray-600 mb-4">
              Paste or type PDF417 barcode data manually for parsing.
            </p>
            <BarcodeInput onDataParsed={handleDataParsed} />
          </div>

          {/* Webcam Capture Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Webcam Capture
            </h2>
            <p className="text-gray-600 mb-4">
              Capture photos from your webcam for manual processing.
            </p>
            <WebcamCapture />
          </div>

          {/* Healthcare Form Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Parsed Form Data
            </h2>
            <HealthcareForm parsedData={parsedData} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            PDF417 Healthcare Form Parser - Supports German Blankoformularbedruckung standards
          </p>
          <p className="mt-2">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}
