// Purpose: Utility functions for class name merging and common operations

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr === '00000000' || dateStr.length !== 8) return null;

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return `${day}.${month}.${year}`;
}

export function parseGermanDate(dateStr: string): string | null {
  if (!dateStr || dateStr === '00000000' || dateStr.length !== 8) return null;

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return `${year}-${month}-${day}`;
}

export function validateDate(dateStr: string): boolean {
  if (!dateStr || dateStr.length !== 8) return false;

  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));

  return year >= 1900 && year <= 2100 &&
         month >= 1 && month <= 12 &&
         day >= 1 && day <= 31;
}

export function sanitizeInput(input: string): string {
  // For PDF417 barcodes, preserve tabs as field separators
  // Only remove newlines and carriage returns
  return input.trim().replace(/[\n\r]/g, '');
}
