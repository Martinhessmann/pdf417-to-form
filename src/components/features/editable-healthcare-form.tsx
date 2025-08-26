// Purpose: Comprehensive editable healthcare form with pre-filled data
// Allows users to review and edit scanned PDF417 barcode data

'use client';

import { useState } from 'react';
import { ParsedBarcodeData } from '@/types/healthcare';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertCircle, CheckCircle, FileText, User, Shield, Building2, Stethoscope, Download, Copy, Eye } from 'lucide-react';

interface EditableHealthcareFormProps {
  parsedData: ParsedBarcodeData;
  onBack: () => void;
  onSave?: (data: Record<string, unknown>) => void;
}

interface FormField {
  label: string;
  value: string;
  fieldNumber?: number | string;
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
      { label: 'Form Type', value: data.formularcode || '', fieldNumber: 1, section: 'form', type: 'select', options: ['6', '10', '12', '16'] },
      { label: 'Form Supplement', value: data.formularcodeergaenzung || '', fieldNumber: 2, section: 'form' },
      { label: 'Version', value: data.versionsnummer || '', fieldNumber: 3, section: 'form' }
    );

    // Patient Information
    fields.push(
      { label: 'Last Name', value: data.nachname || '', fieldNumber: 4, section: 'patient', placeholder: 'Enter last name' },
      { label: 'First Name', value: data.vorname || '', fieldNumber: 5, section: 'patient', placeholder: 'Enter first name' },
      { label: 'Birth Date', value: formatDate(data.geburtsdatum) || '', fieldNumber: 6, section: 'patient', type: 'date' },
      { label: 'Gender', value: data.geschlecht || '', fieldNumber: 18, section: 'patient', type: 'select', options: ['M', 'W', 'X', 'D'] },
      { label: 'Title', value: data.titel || '', fieldNumber: 19, section: 'patient', placeholder: 'Dr., Prof., etc.' }
    );

    // Address
    fields.push(
      { label: 'Street', value: data.strasse || '', fieldNumber: '23*', section: 'patient', placeholder: 'Street name' },
      { label: 'House Number', value: data.hausnummer || '', fieldNumber: '24*', section: 'patient', placeholder: 'Number' },
      { label: 'Postal Code', value: data.plz || '', fieldNumber: 22, section: 'patient', placeholder: '12345' },
      { label: 'City', value: data.ort || '', fieldNumber: '25*', section: 'patient', placeholder: 'City name' }
    );

    // Insurance Information
    fields.push(
      { label: 'Insurance Provider ID', value: data.kostentraegerkennung || '', fieldNumber: 8, section: 'insurance', placeholder: '9-digit ID' },
      { label: 'Insurance Provider', value: data.kostentraegername || '', fieldNumber: '26*', section: 'insurance', placeholder: 'AOK, TK, Barmer, etc.' },
      { label: 'Insured Person ID', value: data.versichertenId || '', fieldNumber: 9, section: 'insurance', placeholder: 'A123456789' },
      { label: 'Insurance Type', value: data.versichertenart || '', fieldNumber: 10, section: 'insurance', type: 'select', options: ['1', '3', '5'] },
      { label: 'Coverage End Date', value: formatDate(data.versicherungsschutzEnde) || '', fieldNumber: 7, section: 'insurance', type: 'date' },
      { label: 'Special Person Group', value: data.besonderePersonengruppe || '', fieldNumber: 11, section: 'insurance', type: 'select', options: ['00', '04', '06', '07', '08', '09'] },
      { label: 'DMP Identifier', value: data.dmpKennzeichnung || '', fieldNumber: 12, section: 'insurance', placeholder: '2-digit code' }
    );

    // Provider Information
    fields.push(
      { label: 'Issue Date', value: formatDate(data.ausstellungsdatum) || '', fieldNumber: 15, section: 'provider', type: 'date' },
      { label: 'Practice Location Number', value: data.betriebsstaettennummer || data.bsnrErstveranlasser || '', fieldNumber: 13, section: 'provider', placeholder: '9-digit BSNR' },
      { label: 'Physician ID (LANR)', value: data.lanr || data.lanrErstveranlasser || '', fieldNumber: 14, section: 'provider', placeholder: '9-digit LANR' }
    );

    // Medical Information
    if (data.diagnose || data.auftrag || data.ueberweisungsgrund) {
      fields.push(
        { label: 'Diagnosis', value: String(data.diagnose || ''), fieldNumber: '16*', section: 'medical', placeholder: 'Primary diagnosis' },
        { label: 'Order/Assignment', value: String(data.auftrag || ''), fieldNumber: '27*', section: 'medical', placeholder: 'Lab tests, procedures, etc.' },
        { label: 'Referral Reason', value: String(data.ueberweisungsgrund || ''), fieldNumber: '28*', section: 'medical', placeholder: 'Reason for referral' }
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

  const sectionIcons = {
    form: FileText,
    patient: User,
    insurance: Shield,
    provider: Building2,
    medical: Stethoscope
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="shrink-0 mt-2 hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Scan New Form
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Healthcare Form Data
                  </h1>
                  <p className="text-lg text-muted-foreground">{getFormTypeName(formType)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Form: {data.formularcode}{data.formularcodeergaenzung}</span>
                <span>•</span>
                <span>Version: {data.versionsnummer}</span>
                {data.ausstellungsdatum && (
                  <>
                    <span>•</span>
                    <span>Issued: {formatDate(data.ausstellungsdatum)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={isValid ? "status-valid" : "status-invalid"}>
              {isValid ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {isValid ? 'Valid Data' : 'Needs Review'}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {!isValid && errors.length > 0 && (
        <Alert variant="destructive" className="animate-slide-up">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-semibold">Data validation issues found:</p>
              <ul className="space-y-2">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 shrink-0" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Field Number Legend */}
      <Alert className="animate-fade-in bg-muted/30 border-muted">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">PDF417 Field Reference</p>
            <p className="text-sm text-muted-foreground">
              Field numbers 1-15 are standardized across all German healthcare forms.
              Fields marked with * are form-specific and may vary by Muster type.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Editable Form Sections */}
      <div className="grid gap-8">
        {Object.entries(sectionTitles).map(([section, title], sectionIndex) => {
          const sectionFields = groupedFields[section];
          if (!sectionFields || sectionFields.length === 0) return null;
          
          const SectionIcon = sectionIcons[section as keyof typeof sectionIcons];

          return (
            <Card key={section} className="card-enhanced animate-slide-up shadow-sm hover:shadow-md transition-all duration-300" style={{ animationDelay: `${sectionIndex * 0.1}s` }}>
              <CardHeader className="border-b border-border/40 bg-muted/20">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <SectionIcon className="h-4 w-4 text-primary" />
                  </div>
                  {title}
                  <span className="text-sm font-normal text-muted-foreground ml-auto">
                    {sectionFields.length} field{sectionFields.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sectionFields.map(field => (
                    <div key={field.index} className="space-y-3 group">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {field.fieldNumber && (
                          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 bg-primary/10 text-primary text-xs font-mono rounded-md border border-primary/20">
                            {field.fieldNumber}
                          </span>
                        )}
                        {field.label}
                        {field.value && (
                          <div className="w-2 h-2 bg-success rounded-full ml-auto opacity-60" />
                        )}
                      </label>

                      {field.type === 'select' && field.options ? (
                        <select
                          value={field.value}
                          onChange={(e) => updateField(field.index, e.target.value)}
                          className="input-enhanced group-hover:border-primary/30"
                        >
                          <option value="">Select an option...</option>
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
                          className="input-enhanced group-hover:border-primary/30"
                        />
                      ) : (
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateField(field.index, e.target.value)}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                          className="input-enhanced group-hover:border-primary/30"
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
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50 -mx-6 px-6 py-6 mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span>Changes auto-saved</span>
            </div>
            <span className="hidden sm:block">•</span>
            <span className="hidden sm:block">
              {formFields.filter(f => f.value).length} of {formFields.length} fields completed
            </span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="hover:bg-muted/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scan
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  // Export functionality
                  const formData = Object.fromEntries(
                    formFields.map(field => [field.label.toLowerCase().replace(/\s+/g, '_'), field.value])
                  );
                  const dataStr = JSON.stringify(formData, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `healthcare-form-${formType}-${new Date().toISOString().split('T')[0]}.json`;
                  
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
                className="hover:bg-muted/80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button 
                onClick={handleSave} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-sm"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
