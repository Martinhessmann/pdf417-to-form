// Purpose: Comprehensive editable healthcare form with pre-filled data
// Allows users to review and edit scanned PDF417 barcode data

'use client';

import { useState } from 'react';
import { ParsedBarcodeData } from '@/types/healthcare';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface EditableHealthcareFormProps {
  parsedData: ParsedBarcodeData;
  onBack: () => void;
  onSave?: (data: Record<string, unknown>) => void;
}

interface FormField {
  label: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'date' | 'select';
  options?: string[];
  section: 'form' | 'patient' | 'insurance' | 'provider' | 'medical';
}

export function EditableHealthcareForm({ parsedData, onBack, onSave }: EditableHealthcareFormProps) {
  const { formType, isValid, errors, data } = parsedData;

  // Convert parsed data to editable form fields
  const getFormFields = (): FormField[] => {
    const fields: FormField[] = [];

    // Form Information
    fields.push(
      { label: 'Form Type', value: data.formularcode || '', section: 'form', type: 'select', options: ['6', '10', '12', '16'] },
      { label: 'Form Supplement', value: data.formularcodeergaenzung || '', section: 'form' },
      { label: 'Version', value: data.versionsnummer || '', section: 'form' }
    );

    // Patient Information
    fields.push(
      { label: 'Last Name', value: data.nachname || '', section: 'patient', placeholder: 'Enter last name' },
      { label: 'First Name', value: data.vorname || '', section: 'patient', placeholder: 'Enter first name' },
      { label: 'Birth Date', value: formatDate(data.geburtsdatum) || '', section: 'patient', type: 'date' },
      { label: 'Gender', value: data.geschlecht || '', section: 'patient', type: 'select', options: ['M', 'W', 'X', 'D'] },
      { label: 'Title', value: data.titel || '', section: 'patient', placeholder: 'Dr., Prof., etc.' }
    );

    // Address
    fields.push(
      { label: 'Street', value: data.strasse || '', section: 'patient', placeholder: 'Street name' },
      { label: 'House Number', value: data.hausnummer || '', section: 'patient', placeholder: 'Number' },
      { label: 'Postal Code', value: data.plz || '', section: 'patient', placeholder: '12345' },
      { label: 'City', value: data.ort || '', section: 'patient', placeholder: 'City name' }
    );

    // Insurance Information
    fields.push(
      { label: 'Insurance Provider ID', value: data.kostentraegerkennung || '', section: 'insurance', placeholder: '9-digit ID' },
      { label: 'Insurance Provider', value: data.kostentraegername || '', section: 'insurance', placeholder: 'AOK, TK, Barmer, etc.' },
      { label: 'Insured Person ID', value: data.versichertenId || '', section: 'insurance', placeholder: 'A123456789' },
      { label: 'Insurance Type', value: data.versichertenart || '', section: 'insurance', type: 'select', options: ['1', '3', '5'] },
      { label: 'Coverage End Date', value: formatDate(data.versicherungsschutzEnde) || '', section: 'insurance', type: 'date' },
      { label: 'Special Person Group', value: data.besonderePersonengruppe || '', section: 'insurance', type: 'select', options: ['00', '04', '06', '07', '08', '09'] },
      { label: 'DMP Identifier', value: data.dmpKennzeichnung || '', section: 'insurance', placeholder: '2-digit code' }
    );

    // Provider Information
    fields.push(
      { label: 'Issue Date', value: formatDate(data.ausstellungsdatum) || '', section: 'provider', type: 'date' },
      { label: 'Practice Location Number', value: data.betriebsstaettennummer || data.bsnrErstveranlasser || '', section: 'provider', placeholder: '9-digit BSNR' },
      { label: 'Physician ID (LANR)', value: data.lanr || data.lanrErstveranlasser || '', section: 'provider', placeholder: '9-digit LANR' }
    );

    // Medical Information
    if (data.diagnose || data.auftrag || data.ueberweisungsgrund) {
      fields.push(
        { label: 'Diagnosis', value: data.diagnose || '', section: 'medical', placeholder: 'Primary diagnosis' },
        { label: 'Order/Assignment', value: data.auftrag || '', section: 'medical', placeholder: 'Lab tests, procedures, etc.' },
        { label: 'Referral Reason', value: data.ueberweisungsgrund || '', section: 'medical', placeholder: 'Reason for referral' }
      );
    }

    return fields.filter(field => field.value || field.label.includes('Date') || field.type === 'select');
  };

  const [formFields, setFormFields] = useState<FormField[]>(getFormFields());

  const updateField = (index: number, value: string) => {
    const updated = [...formFields];
    updated[index].value = value;
    setFormFields(updated);
  };

  const handleSave = () => {
    const formData = Object.fromEntries(
      formFields.map(field => [field.label.toLowerCase().replace(/\s+/g, '_'), field.value])
    );
    console.log('[EditableForm] Saving form data:', formData);
    onSave?.(formData);
  };

  const getFormTypeName = (type: string): string => {
    const formNames: Record<string, string> = {
      '10': 'Muster 10 - Laboratory Request',
      '6': 'Muster 6 - Referral',
      '12': 'Muster 12 - Nursing Care',
      '16': 'Muster 16 - Rehabilitation'
    };
    return formNames[type] || `Form ${type}`;
  };

  const groupedFields = formFields.reduce((acc, field, index) => {
    if (!acc[field.section]) acc[field.section] = [];
    acc[field.section].push({ ...field, index });
    return acc;
  }, {} as Record<string, (FormField & { index: number })[]>);

  const sectionTitles = {
    form: 'Form Information',
    patient: 'Patient Information',
    insurance: 'Insurance Information',
    provider: 'Provider Information',
    medical: 'Medical Information'
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Scan New Form
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Healthcare Form Data</h1>
            <p className="text-muted-foreground">{getFormTypeName(formType)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isValid ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Valid</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Needs Review</span>
            </div>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {!isValid && errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Please review the following:</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Editable Form Sections */}
      <div className="grid gap-6">
        {Object.entries(sectionTitles).map(([section, title]) => {
          const sectionFields = groupedFields[section];
          if (!sectionFields || sectionFields.length === 0) return null;

          return (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sectionFields.map(field => (
                    <div key={field.index} className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {field.label}
                      </label>

                      {field.type === 'select' && field.options ? (
                        <select
                          value={field.value}
                          onChange={(e) => updateField(field.index, e.target.value)}
                          className="w-full p-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        >
                          <option value="">Select...</option>
                          {field.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={field.value ? field.value.split('.').reverse().join('-') : ''}
                          onChange={(e) => {
                            const date = e.target.value;
                            const formatted = date ? date.split('-').reverse().join('.') : '';
                            updateField(field.index, formatted);
                          }}
                          className="w-full p-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        />
                      ) : (
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateField(field.index, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full p-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Data
        </Button>
      </div>
    </div>
  );
}
