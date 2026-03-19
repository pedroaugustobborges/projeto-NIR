import Papa from 'papaparse';
import type { CSVRow, CSVValidationResult, Template } from '@/types';
import { templateService } from '@/services/templateService';

const MAX_ROWS = 200;

/**
 * Parse and validate CSV file for bulk sending
 */
export function parseCSV(
  file: File,
  template: Template
): Promise<CSVValidationResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const validation = validateCSVData(results.data as string[][], template);
        resolve(validation);
      },
      error: (error) => {
        resolve({
          isValid: false,
          errors: [`Erro ao processar arquivo CSV: ${error.message}`],
          data: [],
        });
      },
    });
  });
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
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `modelo_${template.name.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
