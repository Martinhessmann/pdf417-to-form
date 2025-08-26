// Purpose: Healthcare form component that displays parsed PDF417 barcode data
// Shows patient information, insurance details, and provider information

'use client';

import { ParsedBarcodeData } from '@/types/healthcare';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HealthcareFormProps {
  parsedData: ParsedBarcodeData | null;
}

export function HealthcareForm({ parsedData }: HealthcareFormProps) {
  if (!parsedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Healthcare Form Data</CardTitle>
          <CardDescription>
            Parsed barcode data will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No barcode data to display. Please scan or input a valid PDF417 barcode.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { formType, isValid, errors, data } = parsedData;

  const getFormTypeName = (type: string): string => {
    const formNames: Record<string, string> = {
      '10': 'Muster 10 - Laborauftrag',
      '6': 'Muster 6 - Überweisung',
      '12': 'Muster 12 - Häusliche Krankenpflege',
      '16': 'Muster 16 - Medizinische Rehabilitation'
    };
    return formNames[type] || `Form ${type}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getFormTypeName(formType)}
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isValid ? 'Valid' : 'Invalid'}
            </span>
          </CardTitle>
          <CardDescription>
            Form: {data.formularcode}{data.formularcodeergaenzung} | Version: {data.versionsnummer}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Validation Errors */}
      {!isValid && errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Validation Errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoField label="Name" value={`${data.vorname || ''} ${data.nachname || ''}`.trim()} />
            <InfoField label="Birth Date" value={formatDate(data.geburtsdatum)} />
            <InfoField label="Gender" value={data.geschlecht} />
            <InfoField label="Title" value={data.titel} />

            {(data.strasse || data.hausnummer || data.plz || data.ort) && (
              <>
                <div className="pt-2 border-t">
                  <p className="font-medium text-sm text-muted-foreground mb-2">Address</p>
                </div>
                <InfoField
                  label="Street"
                  value={`${data.strasse || ''} ${data.hausnummer || ''}`.trim()}
                />
                <InfoField
                  label="City"
                  value={`${data.plz || ''} ${data.ort || ''}`.trim()}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insurance Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoField label="Insurance Provider ID" value={data.kostentraegerkennung} />
            <InfoField label="Provider Name" value={data.kostentraegername} />
            <InfoField label="Insured Person ID" value={data.versichertenId} />
            <InfoField label="Insurance Type" value={data.versichertenart} />
            <InfoField label="Coverage End Date" value={formatDate(data.versicherungsschutzEnde)} />
            <InfoField label="Special Person Group" value={data.besonderePersonengruppe} />
            <InfoField label="DMP Identifier" value={data.dmpKennzeichnung} />
            <InfoField label="WOP Identifier" value={data.wopKennzeichen} />
          </CardContent>
        </Card>
      </div>

      {/* Provider Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Provider Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <InfoField label="Issue Date" value={formatDate(data.ausstellungsdatum)} />
            <InfoField label="Practice Location Number" value={data.betriebsstaettennummer} />
            <InfoField label="Physician ID (LANR)" value={data.lanr} />
            <InfoField label="First Requester Practice" value={data.bsnrErstveranlasser} />
            <InfoField label="First Requester Physician" value={data.lanrErstveranlasser} />
            <InfoField label="Referring Practice" value={data.bsnrUeberweiser} />
            <InfoField label="Referring Physician" value={data.lanrUeberweiser} />
          </div>
        </CardContent>
      </Card>

      {/* Form-Specific Information */}
      {(data.diagnose || data.verdachtsdiagnose || data.auftrag || data.ueberweisungsgrund) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoField label="Diagnosis" value={data.diagnose} />
            <InfoField label="Suspected Diagnosis" value={data.verdachtsdiagnose} />
            <InfoField label="Assignment/Order" value={data.auftrag} />
            <InfoField label="Referral Reason" value={data.ueberweisungsgrund} />
            <InfoField label="Copy of Findings" value={data.befundkopie} />
            <InfoField label="Curative/Preventive Treatment" value={data.kurativePraeventivKur} />
          </CardContent>
        </Card>
      )}

      {/* Request Information (for Muster 10) */}
      {data.anforderungsIdent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Information</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoField label="Request Identifier" value={data.anforderungsIdent} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value?: string | null;
}

function InfoField({ label, value }: InfoFieldProps) {
  if (!value) return null;

  return (
    <div className="flex flex-col space-y-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm font-mono">
        {value}
      </span>
    </div>
  );
}
