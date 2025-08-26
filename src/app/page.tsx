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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-30 dark:opacity-10" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.05'%3E%3Cpolygon points='0,0 0,60 60,0'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="relative z-10">
        <div className="container mx-auto py-8 px-4 max-w-7xl">

          {appState === 'scanning' && (
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="text-center mb-16 animate-fade-in">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                  Healthcare Form Scanner
                </h1>
                <p className="text-muted-foreground text-xl mb-4 max-w-2xl mx-auto leading-relaxed">
                  Digitize PDF417 barcodes from German healthcare forms with precision and ease
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">Muster 10</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">Muster 6</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">Muster 12</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">Muster 16</span>
                  <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full">+ more</span>
                </div>
              </div>

              {/* Scan Dropzone */}
              <div className="animate-slide-up">
                <SimpleScanDropzone onScanSuccess={handleScanSuccess} />
              </div>
            </div>
          )}

          {appState === 'editing' && parsedData && (
            <div className="max-w-7xl mx-auto animate-fade-in">
              {/* Editable Form */}
              <EditableHealthcareForm
                parsedData={parsedData}
                onBack={handleBackToScan}
                onSave={handleSaveData}
              />
            </div>
          )}

          {/* Footer */}
          <footer className="mt-20 pt-12 border-t border-border/50">
            <div className="max-w-4xl mx-auto text-center">
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Step 1</h3>
                  <p className="text-sm text-muted-foreground">Scan or upload your healthcare form</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Step 2</h3>
                  <p className="text-sm text-muted-foreground">Review and edit extracted data</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Step 3</h3>
                  <p className="text-sm text-muted-foreground">Save or export your data</p>
                </div>
              </div>
              <div className="pt-8 border-t border-border/30">
                <p className="text-sm text-muted-foreground">
                  PDF417 Healthcare Form Scanner - Secure German Blankoformularbedruckung support
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Built with privacy in mind • No data stored on servers
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
