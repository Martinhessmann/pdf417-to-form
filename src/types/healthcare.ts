// Purpose: TypeScript types for PDF417 healthcare barcode schema
// Healthcare forms based on German Blankoformularbedruckung standards

export type FormType = '10' | '12' | '6' | '16' | '17' | '18' | '39' | '52';

export interface StandardBarcodeFields {
  formularcode: string; // 2-digit form number
  formularcodeergaenzung: string; // 1 char form supplement
  versionsnummer: string; // 2-digit version number
}

export interface PatientInfo {
  nachname?: string; // Last name (max 45 chars)
  vorname?: string; // First name (max 45 chars)
  geburtsdatum?: string; // Birth date YYYYMMDD
  geschlecht?: 'M' | 'W' | 'X' | 'D'; // Gender
  titel?: string; // Title (max 20 chars)
  strasse?: string; // Street (max 46 chars)
  hausnummer?: string; // House number (max 9 chars)
  plz?: string; // Postal code (max 10 chars)
  ort?: string; // City (max 40 chars)
}

export interface InsuranceInfo {
  versicherungsschutzEnde?: string; // Insurance coverage end YYYYMMDD
  kostentraegerkennung?: string; // Insurance provider ID (9 digits)
  kostentraegername?: string; // Insurance provider name
  versichertenId?: string; // Insured person ID (max 12 chars)
  versichertenart?: '1' | '3' | '5'; // Type of insurance
  besonderePersonengruppe?: '00' | '04' | '06' | '07' | '08' | '09'; // Special person group
  dmpKennzeichnung?: string; // Disease Management Program ID (2 digits)
  wopKennzeichen?: string; // WOP identifier
}

export interface ProviderInfo {
  betriebsstaettennummer?: string; // Practice location number (9 digits)
  bsnrErstveranlasser?: string; // First requester practice number
  lanrErstveranlasser?: string; // First requester physician ID
  bsnrUeberweiser?: string; // Referring practice number
  lanrUeberweiser?: string; // Referring physician ID
  lanr?: string; // Physician ID number (9 digits)
  ausstellungsdatum?: string; // Issue date YYYYMMDD
}

export interface Muster10Fields extends StandardBarcodeFields, PatientInfo, InsuranceInfo, ProviderInfo {
  anforderungsIdent?: string; // Request identifier
  diagnose?: string; // Diagnosis (max 70 chars)
  verdachtsdiagnose?: string; // Suspected diagnosis
  befundkopie?: string; // Copy of findings
  auftrag?: string; // Order/assignment
}

export interface Muster6Fields extends StandardBarcodeFields, PatientInfo, InsuranceInfo, ProviderInfo {
  ueberweisungsgrund?: string; // Referral reason
  befundkopie?: string; // Copy of findings
  kurativePraeventivKur?: string; // Curative/preventive treatment
}

export interface ParsedBarcodeData {
  formType: FormType;
  isValid: boolean;
  errors: string[];
  data: StandardBarcodeFields & Partial<PatientInfo & InsuranceInfo & ProviderInfo> & Record<string, unknown>;
}

export interface BarcodeFieldDefinition {
  name: string;
  index: number;
  type?: 'string' | 'date' | 'numeric';
  maxLength?: number;
  allowedValues?: string[];
  required?: boolean;
  transform?: (value: string) => unknown;
}

export interface FormSchema {
  formCode: string;
  name: string;
  fields: BarcodeFieldDefinition[];
}
