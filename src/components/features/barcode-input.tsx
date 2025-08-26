// Purpose: Barcode input component for manual entry and parsing of PDF417 data
// Provides textarea for barcode input and parsing controls

'use client';

import { useState } from 'react';
import { PDF417HealthcareParser } from '@/lib/pdf417-parser';
import { ParsedBarcodeData } from '@/types/healthcare';
import { ImageDropzone } from './image-dropzone';
import { ZXingTest } from './zxing-test';
import { TestBarcodeData } from './test-barcode-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Keyboard, Camera } from 'lucide-react';

interface BarcodeInputProps {
  onDataParsed: (data: ParsedBarcodeData | null) => void;
}

export function BarcodeInput({ onDataParsed }: BarcodeInputProps) {
  const [barcodeText, setBarcodeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'image'>('image');
  const parser = new PDF417HealthcareParser();



  const handleClear = () => {
    setBarcodeText('');
    setError(null);
    onDataParsed(null);
  };

  const loadSampleData = () => {
    // Sample Muster 10 (Laboratory Request) barcode data
    const sampleData = [
      '10', // formularcode
      'a',  // formularcodeergaenzung
      '01', // versionsnummer
      'REQ12345', // anforderungsIdent
      'Mustermann', // nachname
      'Max', // vorname
      '19850615', // geburtsdatum
      '20241231', // versicherungsschutzEnde
      '123456789', // kostentraegerkennung
      'AOK Bayern', // kostentraegername
      'BY', // wopKennzeichen
      'A123456789', // versichertenId
      '1', // versichertenart
      '00', // besonderePersonengruppe
      '01', // dmpKennzeichnung
      '123456789', // bsnrErstveranlasser
      '987654321', // lanrErstveranlasser
      '123456789', // bsnrUeberweiser
      '987654321', // lanrUeberweiser
      '20241226', // ausstellungsdatum
      'M', // geschlecht
      'Dr.', // titel
      '80331', // plz
      'München', // ort
      'Maximilianstraße', // strasse
      '1', // hausnummer
      'V70.9 - Routineuntersuchung', // diagnose
      '', // verdachtsdiagnose
      'Ja', // befundkopie
      'Blutbild, Leberwerte' // auftrag
    ].join('\t');

    setBarcodeText(sampleData);
    setError(null);
  };

    const handleImageScan = (barcodeData: string) => {
    console.log('[BarcodeInput] Received image scan data:', barcodeData);
    setBarcodeText(barcodeData);
    setError(null);
    handleParse(barcodeData);
  };

  const handleTestData = (testData: string) => {
    console.log('[BarcodeInput] Received test data:', testData);
    setBarcodeText(testData);
    setError(null);
    handleParse(testData);
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
        <CardTitle className="flex items-center justify-between">
          PDF417 Barcode Parser
          <Button
            variant="outline"
            size="sm"
            onClick={loadSampleData}
          >
            Load Sample
          </Button>
        </CardTitle>
        <CardDescription>
          Scan from image or enter PDF417 barcode data to parse healthcare form information
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
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'manual'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Keyboard className="h-4 w-4 inline mr-2" />
            Manual Input
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'image' ? (
          <ImageDropzone onBarcodeScanned={handleImageScan} />
        ) : (
          <div className="space-y-4">

                    {/* Input Area */}
            <div className="space-y-2">
              <label htmlFor="barcode-input" className="text-sm font-medium">
                Barcode Data (Tab-separated):
              </label>
              <Textarea
                id="barcode-input"
                placeholder="Paste or enter tab-separated barcode data here..."
                value={barcodeText}
                onChange={(e) => setBarcodeText(e.target.value)}
                rows={4}
                className="font-mono text-xs"
              />
              <div className="text-xs text-muted-foreground">
                Example: 10	a	01	REQ123	Mustermann	Max	19850615	...
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleParse()}
                disabled={isLoading || !barcodeText.trim()}
              >
                {isLoading ? 'Parsing...' : 'Parse Barcode'}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={!barcodeText && !error}
              >
                Clear
              </Button>
            </div>

            {/* Data Preview */}
            {barcodeText && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Data Preview:</h4>
                <div className="rounded border p-2 bg-muted/50 text-xs font-mono max-h-20 overflow-y-auto">
                  {barcodeText.split('\t').map((field, index) => (
                    <div key={index} className="flex">
                      <span className="w-8 text-muted-foreground">{index}:</span>
                      <span className="break-all">{field || '(empty)'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Test Data Component */}
        <TestBarcodeData onTestDataSelected={handleTestData} />

        {/* Debug Test Component */}
        <ZXingTest />
      </CardContent>
    </Card>
  );
}
