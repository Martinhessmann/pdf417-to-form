// Purpose: PDF417 healthcare barcode parser for German Blankoformularbedruckung
// Implements form-specific parsing schemas for Muster 10, 6, 12, etc.

import {
  ParsedBarcodeData,
  FormSchema,
  BarcodeFieldDefinition,
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

    if (fields.length < 3) {
      return {
        formType: '10',
        isValid: false,
        errors: ['Invalid barcode format: insufficient fields'],
        data: {} as any
      };
    }

    // Extract form identification from first 3 fields
    const formularcode = fields[0];
    const formularcodeergaenzung = fields[1];
    const versionsnummer = fields[2];

    const schema = this.getSchemaForForm(formularcode);
    if (!schema) {
      return {
        formType: formularcode as FormType,
        isValid: false,
        errors: [`Unsupported form type: ${formularcode}`],
        data: { formularcode, formularcodeergaenzung, versionsnummer }
      };
    }

    const result = this.mapFieldsToSchema(fields, schema);
    const errors = this.validateParsedData(result);

    return {
      formType: formularcode as FormType,
      isValid: errors.length === 0,
      errors,
      data: result
    };
  }

  /**
   * Get schema for specific form type
   */
  private getSchemaForForm(formCode: string): FormSchema | undefined {
    return this.schemas.get(formCode);
  }

  /**
   * Map barcode fields to structured data according to schema
   */
  private mapFieldsToSchema(fields: string[], schema: FormSchema): Record<string, any> {
    const result: Record<string, any> = {};

    schema.fields.forEach(fieldDef => {
      let value = fields[fieldDef.index] || '';

      if (value) {
        // Apply transformations
        if (fieldDef.transform) {
          value = fieldDef.transform(value);
        } else if (fieldDef.type === 'date') {
          value = parseGermanDate(value);
        }

        if (value !== null && value !== '') {
          result[fieldDef.name] = value;
        }
      }
    });

    return result;
  }

  /**
   * Validate parsed data against schema rules
   */
  private validateParsedData(data: Record<string, any>): string[] {
    const errors: string[] = [];

    // Validate required fields
    if (!data.formularcode || !data.versionsnummer) {
      errors.push('Missing required form identification fields');
    }

    // Validate date fields
    Object.entries(data).forEach(([key, value]) => {
      if (key.includes('datum') && value && !validateDate(value.replace(/-/g, ''))) {
        errors.push(`Invalid date format for ${key}: ${value}`);
      }
    });

    // Validate specific field constraints
    if (data.versichertenart && !['1', '3', '5'].includes(data.versichertenart)) {
      errors.push(`Invalid insurance type: ${data.versichertenart}`);
    }

    if (data.geschlecht && !['M', 'W', 'X', 'D'].includes(data.geschlecht)) {
      errors.push(`Invalid gender value: ${data.geschlecht}`);
    }

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
   */
  private getMuster6Schema(): FormSchema {
    return {
      formCode: '6',
      name: 'Muster 6 - Überweisung',
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
        { name: 'wopKennzeichen', index: 9 },
        { name: 'versichertenId', index: 10, maxLength: 12 },
        { name: 'versichertenart', index: 11, allowedValues: ['1', '3', '5'] },
        { name: 'besonderePersonengruppe', index: 12, allowedValues: ['00', '04', '06', '07', '08', '09'] },
        { name: 'dmpKennzeichnung', index: 13, maxLength: 2 },
        { name: 'bsnrErstveranlasser', index: 14, maxLength: 9 },
        { name: 'lanrErstveranlasser', index: 15, maxLength: 9 },
        { name: 'ausstellungsdatum', index: 16, type: 'date' },
        { name: 'ueberweisungsgrund', index: 17 },
        { name: 'befundkopie', index: 18 },
        { name: 'kurativePraeventivKur', index: 19 }
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
    return this.schemas.get(formCode);
  }
}
