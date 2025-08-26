// Purpose: Barcode input component for manual entry and parsing of PDF417 data
// Provides textarea for barcode input and parsing controls

'use client';

import { useState } from 'react';
import { PDF417HealthcareParser } from '@/lib/pdf417-parser';
import { ParsedBarcodeData } from '@/types/healthcare';
import { ImageDropzone } from './image-dropzone';
import { ZXingTest } from './zxing-test';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, TestTube2, FileText, Stethoscope, Activity } from 'lucide-react';

interface BarcodeInputProps {
  onDataParsed: (data: ParsedBarcodeData | null) => void;
}

export function BarcodeInput({ onDataParsed }: BarcodeInputProps) {
  const [barcodeText, setBarcodeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'test' | 'image'>('image');
  const parser = new PDF417HealthcareParser();



  const handleClear = () => {
    setBarcodeText('');
    setError(null);
    onDataParsed(null);
  };

  // Sample test data for all supported form types
  const testData = {
    '10': {
      name: 'Muster 10 - Laborauftrag',
      icon: TestTube2,
      data: [
        '10', 'a', '01', 'REQ12345', 'Mustermann', 'Max', '19850615', '20241231',
        '123456789', 'AOK Bayern', 'BY', 'A123456789', '1', '00', '01',
        '123456789', '987654321', '123456789', '987654321', '20241226', 'M',
        'Dr.', '80331', 'München', 'Maximilianstraße', '1',
        'V70.9 - Routineuntersuchung', '', 'Ja', 'Blutbild, Leberwerte'
      ].join('\t')
    },
    '6': {
      name: 'Muster 6 - Überweisung',
      icon: FileText,
      data: [
        '06', '11', 'Leuthäuser', 'Angelika', '19740414', '', '105177505',
        'Techniker Krankenkasse', '46', 'Y207887976', '1', '00', '00',
        '409601100', '948301053', '20231116', 'W', '', '', '60322', 'Frankfurt',
        'Sömmerringstr.', '12', 'D', '', '', '', '', '', '', 'Radiologie', '', '3',
        '', 'bek. Multiple Sklerose, Thx: Thx- frei',
        '', 'Erbitte cMRT OHNE Kontrast mit der Frage nach  Befunddynamik gegenüber der Vorbildgebung, Danke'
      ].join('\t')
    },
    '12': {
      name: 'Muster 12 - Häusliche Krankenpflege',
      icon: Stethoscope,
      data: [
        '12', 'a', '01', 'Weber', 'Hans', '19401205', '20241231',
        '555666777', 'Barmer GEK', 'C555666777', '1', '07',
        '20241226', 'M', 'Hauptstraße', '15', '10115', 'Berlin'
      ].join('\t')
    },
    '16': {
      name: 'Muster 16 - Medizinische Rehabilitation',
      icon: Activity,
      data: [
        '16', 'a', '01', 'Fischer', 'Maria', '19751120', '20241231',
        '888999000', 'D888999000', '1', '20241226', 'W'
      ].join('\t')
    }
  };

  const loadTestData = (formCode: string) => {
    const testFormData = testData[formCode as keyof typeof testData];
    if (testFormData) {
      setBarcodeText(testFormData.data);
      setError(null);
      handleParse(testFormData.data);
    }
  };

    const handleImageScan = (barcodeData: string) => {
    console.log('[BarcodeInput] Received image scan data:', barcodeData);
    setBarcodeText(barcodeData);
    setError(null);
    handleParse(barcodeData);
  };



  const handleParse = async (data?: string) => {
    const textToProcess = data || barcodeText.trim();

    if (!textToProcess) {
      setError('Please enter barcode data or scan an image');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parsed = parser.parse(textToProcess);
      onDataParsed(parsed);

      if (!parsed.isValid) {
        setError('Barcode data is invalid or incomplete');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse barcode data';
      setError(errorMessage);
      onDataParsed(null);
    } finally {
      setIsLoading(false);
    }
  };

  const supportedForms = parser.getSupportedForms();

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF417 Barcode Parser</CardTitle>
        <CardDescription>
          Scan from image or use test data to parse healthcare form information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Supported Forms Info */}
        <div className="rounded-lg bg-muted p-3">
          <h4 className="font-medium text-sm mb-2">Supported Forms:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
            {supportedForms.map(form => (
              <div key={form.code} className="flex">
                <span className="font-mono w-8">{form.code}:</span>
                <span>{form.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'image'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Camera className="h-4 w-4 inline mr-2" />
            Scan Image
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'test'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TestTube2 className="h-4 w-4 inline mr-2" />
            Test Data
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'image' ? (
          <ImageDropzone onBarcodeScanned={handleImageScan} />
        ) : (
          <div className="space-y-4">
            {/* Test Data Selection */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Select Form Type to Test:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(testData).map(([formCode, formInfo]) => {
                  const IconComponent = formInfo.icon;
                  return (
                    <Button
                      key={formCode}
                      onClick={() => loadTestData(formCode)}
                      variant="outline"
                      size="sm"
                      className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent hover:text-accent-foreground"
                      disabled={isLoading}
                    >
                      <IconComponent className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium">Form {formCode}</div>
                        <div className="text-xs text-muted-foreground">
                          {formInfo.name}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Current Data Preview */}
            {barcodeText && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Current Test Data:</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="rounded border p-3 bg-muted/50">
                  <div className="text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                    {barcodeText.split('\t').slice(0, 10).map((field, index) => (
                      <div key={index} className="flex">
                        <span className="w-8 text-muted-foreground shrink-0">{index}:</span>
                        <span className="break-all">{field || '(empty)'}</span>
                      </div>
                    ))}
                    {barcodeText.split('\t').length > 10 && (
                      <div className="text-muted-foreground text-center py-1">
                        ... and {barcodeText.split('\t').length - 10} more fields
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              <h4 className="font-medium mb-1">Test Data Information:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Click any form button to load and automatically parse test data</li>
                <li>Test data includes realistic German healthcare form information</li>
                <li>Form 6 uses the actual barcode data from your uploaded image</li>
                <li>Each form type has different field requirements and validation</li>
              </ul>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Debug Test Component */}
        <ZXingTest />
      </CardContent>
    </Card>
  );
}
