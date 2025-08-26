'use client';

import { useState } from 'react';
import { ParsedBarcodeData } from '@/types/healthcare';
import { PDF417HealthcareParser } from '@/lib/pdf417-parser';
import { SimpleScanDropzone } from '@/components/features/simple-scan-dropzone';
import { EditableHealthcareForm } from '@/components/features/editable-healthcare-form';

type AppState = 'scanning' | 'editing';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('scanning');
  const [parsedData, setParsedData] = useState<ParsedBarcodeData | null>(null);
  const parser = new PDF417HealthcareParser();

  const handleScanSuccess = (barcodeData: string) => {
    console.log('[Home] Scan successful, parsing data...');
    try {
      const parsed = parser.parse(barcodeData);
      console.log('[Home] Parse result:', { isValid: parsed.isValid, errors: parsed.errors });
      setParsedData(parsed);
      setAppState('editing');
    } catch (error) {
      console.error('[Home] Parse error:', error);
      // Could show an error state here, but for now just stay in scanning mode
    }
  };

  const handleBackToScan = () => {
    setAppState('scanning');
    setParsedData(null);
  };

  const handleSaveData = (formData: Record<string, unknown>) => {
    console.log('[Home] Form data saved:', formData);
    // Here you could send the data to an API, download as PDF, etc.
    // For now, just log it and could show a success message
    alert('Form data saved successfully!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">

        {appState === 'scanning' && (
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold tracking-tight mb-4">
                Healthcare Form Scanner
              </h1>
              <p className="text-muted-foreground text-lg mb-2">
                Scan PDF417 barcodes from German healthcare forms
              </p>
              <p className="text-sm text-muted-foreground">
                Supports Muster 10, 6, 12, 16 and other Blankoformularbedruckung forms
              </p>
            </div>

            {/* Scan Dropzone */}
            <SimpleScanDropzone onScanSuccess={handleScanSuccess} />
          </div>
        )}

        {appState === 'editing' && parsedData && (
          <div className="max-w-6xl mx-auto">
            {/* Editable Form */}
            <EditableHealthcareForm
              parsedData={parsedData}
              onBack={handleBackToScan}
              onSave={handleSaveData}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground max-w-4xl mx-auto">
          <p>
            PDF417 Healthcare Form Scanner - German Blankoformularbedruckung support
          </p>
          <p className="mt-2">
            Scan → Review → Edit → Save
          </p>
        </footer>
      </div>
    </div>
  );
}
