// Purpose: Test component with sample barcode data for debugging
// Provides easy access to test data without needing actual images

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface TestBarcodeDataProps {
  onTestDataSelected: (data: string) => void;
}

export function TestBarcodeData({ onTestDataSelected }: TestBarcodeDataProps) {
  const [customData, setCustomData] = useState('');

  // Sample PDF417 data for different form types
  const testData = {
    muster10: [
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
    ].join('\t'),

    muster6: [
      '6', // formularcode
      'a', // formularcodeergaenzung
      '01', // versionsnummer
      'Schmidt', // nachname
      'Anna', // vorname
      '19920318', // geburtsdatum
      '20241231', // versicherungsschutzEnde
      '987654321', // kostentraegerkennung
      'TK Techniker', // kostentraegername
      'NW', // wopKennzeichen
      'B987654321', // versichertenId
      '1', // versichertenart
      '00', // besonderePersonengruppe
      '02', // dmpKennzeichnung
      '111222333', // bsnrErstveranlasser
      '444555666', // lanrErstveranlasser
      '20241226', // ausstellungsdatum
      'Orthopädische Untersuchung', // ueberweisungsgrund
      'Nein', // befundkopie
      'Nein' // kurativePraeventivKur
    ].join('\t'),

    muster12: [
      '12', // formularcode
      'a', // formularcodeergaenzung
      '01', // versionsnummer
      'Weber', // nachname
      'Hans', // vorname
      '19401205', // geburtsdatum
      '20241231', // versicherungsschutzEnde
      '555666777', // kostentraegerkennung
      'Barmer GEK', // kostentraegername
      'C555666777', // versichertenId
      '1', // versichertenart
      '07', // besonderePersonengruppe
      '20241226', // ausstellungsdatum
      'M', // geschlecht
      'Hauptstraße', // strasse
      '15', // hausnummer
      '10115', // plz
      'Berlin' // ort
    ].join('\t')
  };

  const handleTestData = (key: keyof typeof testData) => {
    const data = testData[key];
    console.log('[TestBarcodeData] Sending test data:', key, data);
    onTestDataSelected(data);
  };

  const handleCustomData = () => {
    if (customData.trim()) {
      console.log('[TestBarcodeData] Sending custom data:', customData);
      onTestDataSelected(customData.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Test Barcode Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            onClick={() => handleTestData('muster10')}
            variant="outline"
            size="sm"
          >
            Muster 10 (Lab)
          </Button>
          <Button
            onClick={() => handleTestData('muster6')}
            variant="outline"
            size="sm"
          >
            Muster 6 (Referral)
          </Button>
          <Button
            onClick={() => handleTestData('muster12')}
            variant="outline"
            size="sm"
          >
            Muster 12 (Care)
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Test Data:</label>
          <Textarea
            placeholder="Enter tab-separated test data..."
            value={customData}
            onChange={(e) => setCustomData(e.target.value)}
            rows={2}
            className="font-mono text-xs"
          />
          <Button
            onClick={handleCustomData}
            disabled={!customData.trim()}
            size="sm"
          >
            Use Custom Data
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Click buttons to simulate successful barcode scans with test data
        </div>
      </CardContent>
    </Card>
  );
}
