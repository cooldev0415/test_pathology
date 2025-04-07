import axios from 'axios';
import { DiagnosticResult } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const analyzeORU = async (file: File): Promise<DiagnosticResult> => {
  const formData = new FormData();
  formData.append('oruFile', file);

  try {
    const response = await axios.post(`${API_URL}/analyze-oru`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Failed to analyze ORU file');
    }
    throw error;
  }
}; 