import { DiagnosticResult } from '../types/diagnostic';
import { endpoints } from '../constants/endpoints';

/**
 * Service to analyze ORU files
 * @param file The ORU file to analyze
 * @returns Promise with the diagnostic result
 */
export const analyzeORU = async (file: File): Promise<DiagnosticResult> => {
  const formData = new FormData();
  formData.append('oruFile', file);

  const response = await fetch(endpoints.analyzeORU, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to process the file.');
  }

  return response.json();
};
