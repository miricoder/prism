/**
 * Smart Data Parser - Intelligently converts various data formats to structured trip data
 */

export type DataType = 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'url';

export interface ParsedField {
  key: string;
  value: any;
  type: DataType;
}

export interface ParsedEntry {
  type: 'flight' | 'hotel' | 'activity' | 'transport' | 'meal' | 'other';
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  cost?: number;
  currency?: string;
  location?: string;
  fields: ParsedField[];
  notes?: string;
}

export interface ParsedTrip {
  name: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  description?: string;
  budget?: { total: number; currency: string };
  entries: ParsedEntry[];
  fields: ParsedField[];
  fieldSchema: Map<string, DataType>;
}

// Detect data type from value
export function detectType(value: any): DataType {
  if (value === null || value === undefined) return 'text';

  const str = String(value).toLowerCase().trim();

  // Boolean
  if (str === 'true' || str === 'false' || str === 'yes' || str === 'no') {
    return 'boolean';
  }

  // Date patterns (ISO, MM/DD/YYYY, DD/MM/YYYY, etc.)
  if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(str)) {
    const parsed = parseDate(value);
    if (parsed) return 'date';
  }

  // Currency (starts with $, €, £, ¥, etc.)
  if (/^[$€£¥₹]/.test(str) || /^\d+(\.\d{2})?$/.test(str.replace(/[,]/g, ''))) {
    const numValue = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numValue)) return 'currency';
  }

  // URL
  if (/^https?:\/\/|^www\./.test(str)) {
    return 'url';
  }

  // Number
  if (/^-?\d+(\.\d+)?$/.test(str.replace(/,/g, ''))) {
    return 'number';
  }

  return 'text';
}

// Parse date from various formats
export function parseDate(value: any): Date | null {
  if (!value) return null;

  const str = String(value).trim();

  try {
    // ISO format
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return new Date(str);
    }

    // MM/DD/YYYY or DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) {
      const [part1, part2, part3] = str.split('/');
      const date = new Date(
        parseInt(part3) < 100 ? (parseInt(part3) + 2000) : parseInt(part3),
        parseInt(part1) - 1,
        parseInt(part2)
      );
      if (!isNaN(date.getTime())) return date;
    }

    // Try generic Date parsing
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // Ignore parse errors
  }

  return null;
}

// Parse number from string
export function parseNumber(value: any): number | null {
  if (!value) return null;

  const str = String(value).trim();
  const cleaned = str.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

// Parse boolean
export function parseBoolean(value: any): boolean {
  const str = String(value).toLowerCase().trim();
  return str === 'true' || str === 'yes' || str === '1';
}

// Convert value to typed value
export function coerceValue(value: any, type: DataType): any {
  if (value === null || value === undefined) return null;

  switch (type) {
    case 'date':
      return parseDate(value);
    case 'number':
      return parseNumber(value);
    case 'currency':
      return parseNumber(value);
    case 'boolean':
      return parseBoolean(value);
    case 'url':
    case 'text':
    default:
      return String(value).trim();
  }
}

// Parse CSV string
export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.trim().split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

// Detect entry type from keywords
export function detectEntryType(
  title: string,
  description?: string
): 'flight' | 'hotel' | 'activity' | 'transport' | 'meal' | 'other' {
  const text = `${title} ${description || ''}`.toLowerCase();

  if (/flight|airline|depart|arrival|airport|plane|booking|seat/.test(text)) return 'flight';
  if (/hotel|accommodation|lodge|resort|airbnb|apartment|booking|night/.test(text)) return 'hotel';
  if (/activity|tour|museum|restaurant|visit|show|ticket|experience|hike|adventure/.test(text)) {
    return 'activity';
  }
  if (/taxi|uber|transport|bus|train|rental|car|ride|transfer/.test(text)) return 'transport';
  if (/meal|breakfast|lunch|dinner|food|drink|restaurant|cafe/.test(text)) return 'meal';

  return 'other';
}

// Intelligent CSV-to-Trip parser
export function parseCSVToTrip(
  csvContent: string,
  userId: string,
  tripName?: string
): ParsedTrip {
  const rows = parseCSV(csvContent);
  if (rows.length === 0) {
    throw new Error('CSV is empty');
  }

  const headers = rows[0].map((h) => h.toLowerCase());
  const dataRows = rows.slice(1);

  const entries: ParsedEntry[] = [];
  const fieldSchema = new Map<string, DataType>();
  const tripFields: ParsedField[] = [];

  // Process data rows
  for (const row of dataRows) {
    if (row.every((cell) => !cell.trim())) continue; // Skip empty rows

    const entry: ParsedEntry = {
      type: 'other',
      title: '',
      fields: [],
    };

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const value = row[i] || '';

      if (!value.trim()) continue;

      // Detect data type
      const type = detectType(value);
      const typedValue = coerceValue(value, type);

      // Track field schema
      if (!fieldSchema.has(header)) {
        fieldSchema.set(header, type);
      }

      // Map to standard entry fields
      if (/^title|name|flight|hotel|activity/.test(header)) {
        entry.title = String(value);
        entry.type = detectEntryType(String(value));
      } else if (/^description|details|notes/.test(header)) {
        entry.description = String(value);
      } else if (/^start|departure|date/.test(header) && type === 'date') {
        entry.startDate = typedValue;
      } else if (/^end|arrival|return/.test(header) && type === 'date') {
        entry.endDate = typedValue;
      } else if (/^cost|price|amount|fee|charge/.test(header) && type === 'currency') {
        entry.cost = typedValue;
      } else if (/^currency|currency_code|code/.test(header)) {
        entry.currency = String(value).toUpperCase();
      } else if (/^location|destination|city|hotel|place/.test(header)) {
        entry.location = String(value);
      } else {
        // Store as custom field
        entry.fields.push({ key: header, value: typedValue, type });
      }
    }

    if (entry.title) {
      entries.push(entry);
    }
  }

  // Calculate trip-level metadata
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let totalCost = 0;

  for (const entry of entries) {
    if (entry.startDate && (!startDate || entry.startDate < startDate)) {
      startDate = entry.startDate;
    }
    if (entry.endDate && (!endDate || entry.endDate > endDate)) {
      endDate = entry.endDate;
    }
    if (entry.cost) {
      totalCost += entry.cost;
    }
  }

  return {
    name: tripName || 'Imported Trip',
    startDate,
    endDate,
    budget: totalCost > 0 ? { total: totalCost, currency: 'USD' } : undefined,
    entries,
    fields: tripFields,
    fieldSchema,
  };
}

// Parse plain text format
export function parseTextToTrip(
  textContent: string,
  userId: string,
  tripName?: string
): ParsedTrip {
  // Simple heuristic: split by lines, detect entries
  const lines = textContent.split('\n').filter((l) => l.trim());
  const entries: ParsedEntry[] = [];
  const fieldSchema = new Map<string, DataType>();

  let currentEntry: Partial<ParsedEntry> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect entry type from keywords
    const type = detectEntryType(trimmed);
    if (type !== 'other' || /^-|^\*|^•/.test(trimmed)) {
      // New entry
      if (currentEntry && currentEntry.title) {
        entries.push({
          type: currentEntry.type || 'other',
          title: currentEntry.title,
          description: currentEntry.description,
          fields: currentEntry.fields || [],
        });
      }

      currentEntry = {
        type,
        title: trimmed.replace(/^[-*•]\s*/, ''),
        fields: [],
      };
    } else if (currentEntry) {
      if (!currentEntry.description) {
        currentEntry.description = trimmed;
      } else {
        currentEntry.description += '\n' + trimmed;
      }
    }
  }

  // Push last entry
  if (currentEntry && currentEntry.title) {
    entries.push({
      type: currentEntry.type || 'other',
      title: currentEntry.title,
      description: currentEntry.description,
      fields: currentEntry.fields || [],
    });
  }

  return {
    name: tripName || 'Imported Trip',
    entries,
    fields: [],
    fieldSchema,
  };
}

// Main import dispatcher
export function parseImport(
  content: string,
  format: 'csv' | 'json' | 'text',
  userId: string,
  tripName?: string
): ParsedTrip {
  switch (format) {
    case 'csv':
      return parseCSVToTrip(content, userId, tripName);
    case 'text':
      return parseTextToTrip(content, userId, tripName);
    case 'json':
      try {
        const json = JSON.parse(content);
        if (Array.isArray(json)) {
          // Array of trips or entries
          return {
            name: tripName || 'Imported Trip',
            entries: json.map((item: any) => ({
              type: item.type || 'other',
              title: item.title || item.name || '',
              description: item.description,
              startDate: item.startDate ? new Date(item.startDate) : undefined,
              endDate: item.endDate ? new Date(item.endDate) : undefined,
              cost: item.cost || item.price,
              currency: item.currency || 'USD',
              location: item.location,
              fields: [],
            })),
            fields: [],
            fieldSchema: new Map(),
          };
        } else {
          // Single trip object
          return {
            name: tripName || json.name || 'Imported Trip',
            destination: json.destination,
            startDate: json.startDate ? new Date(json.startDate) : undefined,
            endDate: json.endDate ? new Date(json.endDate) : undefined,
            reason: json.reason,
            entries: json.entries || [],
            fields: [],
            fieldSchema: new Map(),
          };
        }
      } catch (e) {
        throw new Error('Invalid JSON format');
      }
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
