import Papa from 'papaparse';
import type { CSVRow, CSVValidationResult, Template } from '@/types';
import { templateService } from '@/services/templateService';

const MAX_ROWS = 200;

/**
 * Read file with proper encoding detection
 * Tries UTF-8 first, then falls back to Windows-1252/Latin-1
 */
async function readFileWithEncoding(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  // Try UTF-8 first
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    const text = utf8Decoder.decode(buffer);
    // Check if the text has replacement characters (indicates encoding issues)
    if (!text.includes('\uFFFD')) {
      return text;
    }
  } catch {
    // UTF-8 decoding failed, try other encodings
  }

  // Try Windows-1252 (common for Excel files)
  try {
    const win1252Decoder = new TextDecoder('windows-1252');
    return win1252Decoder.decode(buffer);
  } catch {
    // Fallback to ISO-8859-1 (Latin-1)
    const latin1Decoder = new TextDecoder('iso-8859-1');
    return latin1Decoder.decode(buffer);
  }
}

/**
 * Parse and validate CSV file for bulk sending
 */
export async function parseCSV(
  file: File,
  template: Template
): Promise<CSVValidationResult> {
  try {
    // Read file with proper encoding
    const csvText = await readFileWithEncoding(file);

    // Parse the CSV text
    const results = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
    });

    if (results.errors && results.errors.length > 0) {
      return {
        isValid: false,
        errors: results.errors.map(e => `Erro ao processar CSV: ${e.message}`),
        data: [],
      };
    }

    const validation = validateCSVData(results.data as string[][], template);
    return validation;
  } catch (error) {
    return {
      isValid: false,
      errors: [`Erro ao processar arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
      data: [],
    };
  }
}

/**
 * Validate CSV data against template requirements
 */
function validateCSVData(
  rawData: string[][],
  template: Template
): CSVValidationResult {
  const errors: string[] = [];
  const data: CSVRow[] = [];
  const paramCount = templateService.getParameterCount(template);

  // Check if file is empty
  if (rawData.length === 0) {
    return {
      isValid: false,
      errors: ['O arquivo CSV está vazio'],
      data: [],
    };
  }

  // Check max rows
  if (rawData.length > MAX_ROWS) {
    return {
      isValid: false,
      errors: [`O arquivo CSV não pode ter mais de ${MAX_ROWS} linhas. Encontradas: ${rawData.length}`],
      data: [],
    };
  }

  // Validate each row
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const lineNum = i + 1;

    // Check if phone column exists
    if (!row[0] || row[0].trim() === '') {
      errors.push(`Linha ${lineNum}: Número de telefone não informado`);
      continue;
    }

    // Validate phone number
    const phone = row[0].trim().replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 13) {
      errors.push(`Linha ${lineNum}: Número de telefone inválido (${row[0]})`);
    }

    // Validate required parameters
    for (let j = 0; j < paramCount; j++) {
      const colIndex = j + 1;
      if (!row[colIndex] || row[colIndex].trim() === '') {
        const paramName = getParameterName(template, j + 1);
        errors.push(`Linha ${lineNum}: ${paramName} não preenchido`);
      }
    }

    // Add row to results
    data.push({
      phone: row[0]?.trim() || '',
      param_1: row[1]?.trim(),
      param_2: row[2]?.trim(),
      param_3: row[3]?.trim(),
      param_4: row[4]?.trim(),
      param_5: row[5]?.trim(),
      param_6: row[6]?.trim(),
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

/**
 * Get parameter name from template
 */
function getParameterName(template: Template, index: number): string {
  switch (index) {
    case 1: return template.parameter_1 || `Parâmetro ${index}`;
    case 2: return template.parameter_2 || `Parâmetro ${index}`;
    case 3: return template.parameter_3 || `Parâmetro ${index}`;
    case 4: return template.parameter_4 || `Parâmetro ${index}`;
    case 5: return template.parameter_5 || `Parâmetro ${index}`;
    case 6: return template.parameter_6 || `Parâmetro ${index}`;
    default: return `Parâmetro ${index}`;
  }
}

/**
 * Generate sample CSV content for download
 */
export function generateSampleCSV(template: Template): string {
  const params = templateService.getParameters(template);
  const headers = ['Telefone', ...params];

  // Sample data
  const sampleRow = [
    '5562999999999',
    ...params.map((_, i) => `Valor ${i + 1}`),
  ];

  return [
    headers.join(','),
    sampleRow.join(','),
  ].join('\n');
}

/**
 * Download sample CSV file
 */
export function downloadSampleCSV(template: Template): void {
  const content = generateSampleCSV(template);
  // Add UTF-8 BOM so Excel opens it correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `modelo_${template.name.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
