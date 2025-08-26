'use client';

import { useState } from 'react';
import { ParsedBarcodeData } from '@/types/healthcare';
import { BarcodeInput } from '@/components/features/barcode-input';
import { HealthcareForm } from '@/components/features/healthcare-form';
import WebcamCapture from '@/components/features/webcam-capture';

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedBarcodeData | null>(null);

  const handleDataParsed = (data: ParsedBarcodeData | null) => {
    setParsedData(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <WebcamCapture />

        {/* Main Content */}
        <div className="space-y-8">
          {/* Barcode Input Section */}
          <BarcodeInput onDataParsed={handleDataParsed} />

          {/* Healthcare Form Display */}
          <HealthcareForm parsedData={parsedData} />
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
