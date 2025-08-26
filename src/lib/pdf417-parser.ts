// Purpose: PDF417 healthcare barcode parser for German Blankoformularbedruckung
// Implements form-specific parsing schemas for Muster 10, 6, 12, etc.

import {
  ParsedBarcodeData,
  FormSchema,
  FormType
} from '@/types/healthcare';
import { parseGermanDate, validateDate, sanitizeInput } from './utils';

export class PDF417HealthcareParser {
  private readonly fieldSeparator = '\t'; // TAB character
  private schemas: Map<string, FormSchema>;

  constructor() {
    this.schemas = new Map();
    this.initializeSchemas();
  }

  /**
   * Parse PDF417 barcode data according to healthcare form specifications
   */
  parse(barcodeData: string): ParsedBarcodeData {
    const sanitizedData = sanitizeInput(barcodeData);
    const fields = sanitizedData.split(this.fieldSeparator);

    console.log('[PDF417Parser] Parsing barcode data with', fields.length, 'fields');
    console.log('[PDF417Parser] First 5 fields:', fields.slice(0, 5));

    if (fields.length < 3) {
      console.log('[PDF417Parser] Insufficient fields, returning error');
      return {
        formType: '10',
        isValid: false,
        errors: ['Invalid barcode format: insufficient fields'],
        data: {}
      };
    }

    // Extract form identification from first 3 fields
    const formularcode = fields[0];
    const formularcodeergaenzung = fields[1];
    const versionsnummer = fields[2];

    console.log('[PDF417Parser] Form identification:', { formularcode, formularcodeergaenzung, versionsnummer });

    // Normalize form code (e.g., "06" -> "6")
    const normalizedFormCode = this.normalizeFormCode(formularcode);
    console.log('[PDF417Parser] Normalized form code:', normalizedFormCode);

    const schema = this.getSchemaForForm(formularcode);
    if (!schema) {
      console.log('[PDF417Parser] No schema found for form code:', formularcode);
      return {
        formType: normalizedFormCode as FormType,
        isValid: false,
        errors: [`Unsupported form type: ${formularcode}`],
        data: { formularcode, formularcodeergaenzung, versionsnummer }
      };
    }

    console.log('[PDF417Parser] Using schema:', schema.name);
    const result = this.mapFieldsToSchema(fields, schema);
    console.log('[PDF417Parser] Mapped result keys:', Object.keys(result));

    const errors = this.validateParsedData(result);
    console.log('[PDF417Parser] Validation errors:', errors);

    return {
      formType: normalizedFormCode as FormType,
      isValid: errors.length === 0,
      errors,
      data: result
    };
  }

  /**
   * Normalize form code (e.g., "06" -> "6", "10" -> "10")
   */
  private normalizeFormCode(formCode: string): string {
    // Remove leading zeros for single-digit form codes
    const normalized = formCode.replace(/^0+/, '');
    return normalized || formCode; // Return original if normalization results in empty string
  }

  /**
   * Get schema for specific form type
   */
  private getSchemaForForm(formCode: string): FormSchema | undefined {
    // Normalize the form code before lookup (e.g., "06" -> "6")
    const normalizedCode = this.normalizeFormCode(formCode);
    return this.schemas.get(normalizedCode);
  }

    /**
   * Map barcode fields to structured data according to schema
   */
  private mapFieldsToSchema(fields: string[], schema: FormSchema): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    schema.fields.forEach(fieldDef => {
      // Skip reserved fields from mapping
      if (fieldDef.name.startsWith('reserved')) {
        return;
      }

      let value = fields[fieldDef.index] || '';
      console.log(`[PDF417Parser] Mapping field "${fieldDef.name}" (index ${fieldDef.index}): "${value}"`);

      if (value) {
        // Apply transformations
        if (fieldDef.transform) {
          value = fieldDef.transform(value);
        } else if (fieldDef.type === 'date') {
          const dateValue = parseGermanDate(value);
          console.log(`[PDF417Parser] Date transformation "${value}" -> "${dateValue}"`);
          value = dateValue;
        }

        if (value !== null && value !== '') {
          result[fieldDef.name] = value;
        }
      }
    });

    console.log('[PDF417Parser] Final mapped result:', result);
    return result;
  }

  /**
   * Validate parsed data against schema rules
   */
  private validateParsedData(data: Record<string, unknown>): string[] {
    const errors: string[] = [];

    console.log('[PDF417Parser] Validating data:', data);

    // Validate required fields
    if (!data.formularcode || !data.versionsnummer) {
      errors.push('Missing required form identification fields');
    }

    // Validate date fields - only check actual date values
    Object.entries(data).forEach(([key, value]) => {
      if (key.includes('datum') && value) {
        console.log(`[PDF417Parser] Validating date field ${key}: "${value}"`);
        // Check if it's already in YYYY-MM-DD format or YYYYMMDD format
        const datePattern = /^\d{4}-\d{2}-\d{2}$|^\d{8}$/;
        if (!datePattern.test(value)) {
          errors.push(`Invalid date format for ${key}: ${value}`);
        }
      }
    });

    // Validate specific field constraints with explicit checks
    if (data.versichertenart) {
      console.log(`[PDF417Parser] Validating versichertenart: "${data.versichertenart}"`);
      if (!['1', '3', '5'].includes(data.versichertenart)) {
        errors.push(`Invalid insurance type: ${data.versichertenart}`);
      }
    }

    if (data.geschlecht) {
      console.log(`[PDF417Parser] Validating geschlecht: "${data.geschlecht}"`);
      if (!['M', 'W', 'X', 'D'].includes(data.geschlecht)) {
        errors.push(`Invalid gender value: ${data.geschlecht}`);
      }
    }

    console.log('[PDF417Parser] Validation complete, errors:', errors);
    return errors;
  }

  /**
   * Initialize form schemas for different Muster types
   */
  private initializeSchemas(): void {
    this.schemas.set('10', this.getMuster10Schema());
    this.schemas.set('6', this.getMuster6Schema());
    this.schemas.set('12', this.getMuster12Schema());
    this.schemas.set('16', this.getMuster16Schema());
  }

  /**
   * Muster 10 - Laboratory Request Form
   */
  private getMuster10Schema(): FormSchema {
    return {
      formCode: '10',
      name: 'Muster 10 - Laborauftrag',
      fields: [
        { name: 'formularcode', index: 0, required: true },
        { name: 'formularcodeergaenzung', index: 1, required: true },
        { name: 'versionsnummer', index: 2, required: true },
        { name: 'anforderungsIdent', index: 3 },
        { name: 'nachname', index: 4, maxLength: 45 },
        { name: 'vorname', index: 5, maxLength: 45 },
        { name: 'geburtsdatum', index: 6, type: 'date' },
        { name: 'versicherungsschutzEnde', index: 7, type: 'date' },
        { name: 'kostentraegerkennung', index: 8, maxLength: 9 },
        { name: 'kostentraegername', index: 9 },
        { name: 'wopKennzeichen', index: 10 },
        { name: 'versichertenId', index: 11, maxLength: 12 },
        { name: 'versichertenart', index: 12, allowedValues: ['1', '3', '5'] },
        { name: 'besonderePersonengruppe', index: 13, allowedValues: ['00', '04', '06', '07', '08', '09'] },
        { name: 'dmpKennzeichnung', index: 14, maxLength: 2 },
        { name: 'bsnrErstveranlasser', index: 15, maxLength: 9 },
        { name: 'lanrErstveranlasser', index: 16, maxLength: 9 },
        { name: 'bsnrUeberweiser', index: 17, maxLength: 9 },
        { name: 'lanrUeberweiser', index: 18, maxLength: 9 },
        { name: 'ausstellungsdatum', index: 19, type: 'date' },
        { name: 'geschlecht', index: 20, allowedValues: ['M', 'W', 'X', 'D'] },
        { name: 'titel', index: 21, maxLength: 20 },
        { name: 'plz', index: 22, maxLength: 10 },
        { name: 'ort', index: 23, maxLength: 40 },
        { name: 'strasse', index: 24, maxLength: 46 },
        { name: 'hausnummer', index: 25, maxLength: 9 },
        { name: 'diagnose', index: 26, maxLength: 70 },
        { name: 'verdachtsdiagnose', index: 27 },
        { name: 'befundkopie', index: 28 },
        { name: 'auftrag', index: 29 }
      ]
    };
  }

  /**
   * Muster 6 - Referral Form
   * Based on actual barcode data structure with empty fields
   */
  private getMuster6Schema(): FormSchema {
    return {
      formCode: '6',
      name: 'Muster 6 - Überweisung',
      fields: [
        { name: 'formularcode', index: 0, required: true },
        { name: 'formularcodeergaenzung', index: 1 }, // often empty
        { name: 'versionsnummer', index: 2, required: true },
        { name: 'reserved1', index: 3 }, // often empty
        { name: 'nachname', index: 4, maxLength: 45 },
        { name: 'vorname', index: 5, maxLength: 45 },
        { name: 'geburtsdatum', index: 6, type: 'date' },
        { name: 'reserved2', index: 7 }, // often empty
        { name: 'kostentraegerkennung', index: 8, maxLength: 9 },
        { name: 'kostentraegername', index: 9 },
        { name: 'wopKennzeichen', index: 10 },
        { name: 'versichertenId', index: 11, maxLength: 12 },
        { name: 'versichertenart', index: 12, allowedValues: ['1', '3', '5'] },
        { name: 'besonderePersonengruppe', index: 13, allowedValues: ['00', '04', '06', '07', '08', '09'] },
        { name: 'dmpKennzeichnung', index: 14, maxLength: 2 },
        { name: 'bsnrErstveranlasser', index: 15, maxLength: 9 },
        { name: 'lanrErstveranlasser', index: 16, maxLength: 9 },
        { name: 'ausstellungsdatum', index: 17, type: 'date' },
        { name: 'geschlecht', index: 18, allowedValues: ['M', 'W', 'X', 'D'] },
        { name: 'titel', index: 19, maxLength: 20 },
        { name: 'reserved3', index: 20 }, // often empty
        { name: 'reserved4', index: 21 }, // often empty
        { name: 'plz', index: 22, maxLength: 10 },
        { name: 'ort', index: 23, maxLength: 40 },
        { name: 'strasse', index: 24, maxLength: 46 },
        { name: 'hausnummer', index: 25, maxLength: 9 },
        { name: 'reserved5', index: 26 }, // often empty
        // Additional fields may follow based on specific form requirements
        { name: 'fachbereich', index: 27 }, // Medical department
        { name: 'reserved6', index: 28 },
        { name: 'reserved7', index: 29 },
        { name: 'reserved8', index: 30 },
        { name: 'reserved9', index: 31 },
        { name: 'reserved10', index: 32 },
        { name: 'reserved11', index: 33 },
        { name: 'reserved12', index: 34 },
        { name: 'fachrichtung', index: 35 }, // Medical specialty
        { name: 'reserved13', index: 36 },
        { name: 'reserved14', index: 37 },
        { name: 'reserved15', index: 38 },
        { name: 'diagnose', index: 39 }, // Diagnosis
        { name: 'ueberweisungsgrund', index: 40 } // Referral reason
      ]
    };
  }

  /**
   * Muster 12 - Nursing Care Request
   */
  private getMuster12Schema(): FormSchema {
    return {
      formCode: '12',
      name: 'Muster 12 - Verordnung häuslicher Krankenpflege',
      fields: [
        { name: 'formularcode', index: 0, required: true },
        { name: 'formularcodeergaenzung', index: 1, required: true },
        { name: 'versionsnummer', index: 2, required: true },
        { name: 'nachname', index: 3, maxLength: 45 },
        { name: 'vorname', index: 4, maxLength: 45 },
        { name: 'geburtsdatum', index: 5, type: 'date' },
        { name: 'versicherungsschutzEnde', index: 6, type: 'date' },
        { name: 'kostentraegerkennung', index: 7, maxLength: 9 },
        { name: 'kostentraegername', index: 8 },
        { name: 'versichertenId', index: 9, maxLength: 12 },
        { name: 'versichertenart', index: 10, allowedValues: ['1', '3', '5'] },
        { name: 'besonderePersonengruppe', index: 11, allowedValues: ['00', '04', '06', '07', '08', '09'] },
        { name: 'ausstellungsdatum', index: 12, type: 'date' },
        { name: 'geschlecht', index: 13, allowedValues: ['M', 'W', 'X', 'D'] },
        { name: 'strasse', index: 14, maxLength: 46 },
        { name: 'hausnummer', index: 15, maxLength: 9 },
        { name: 'plz', index: 16, maxLength: 10 },
        { name: 'ort', index: 17, maxLength: 40 }
      ]
    };
  }

  /**
   * Muster 16 - Rehabilitation Request
   */
  private getMuster16Schema(): FormSchema {
    return {
      formCode: '16',
      name: 'Muster 16 - Verordnung medizinischer Rehabilitation',
      fields: [
        { name: 'formularcode', index: 0, required: true },
        { name: 'formularcodeergaenzung', index: 1, required: true },
        { name: 'versionsnummer', index: 2, required: true },
        { name: 'nachname', index: 3, maxLength: 45 },
        { name: 'vorname', index: 4, maxLength: 45 },
        { name: 'geburtsdatum', index: 5, type: 'date' },
        { name: 'versicherungsschutzEnde', index: 6, type: 'date' },
        { name: 'kostentraegerkennung', index: 7, maxLength: 9 },
        { name: 'versichertenId', index: 8, maxLength: 12 },
        { name: 'versichertenart', index: 9, allowedValues: ['1', '3', '5'] },
        { name: 'ausstellungsdatum', index: 10, type: 'date' },
        { name: 'geschlecht', index: 11, allowedValues: ['M', 'W', 'X', 'D'] }
      ]
    };
  }

  /**
   * Get list of supported form types
   */
  public getSupportedForms(): { code: string; name: string }[] {
    return Array.from(this.schemas.values()).map(schema => ({
      code: schema.formCode,
      name: schema.name
    }));
  }

  /**
   * Get schema for a specific form (public method for debugging/testing)
   */
  public getFormSchema(formCode: string): FormSchema | undefined {
    const normalizedCode = this.normalizeFormCode(formCode);
    return this.schemas.get(normalizedCode);
  }
}
