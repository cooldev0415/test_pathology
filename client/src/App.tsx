import React, { useState } from 'react';
import { FileUpload } from './components/features/upload/FileUpload';
import { TotalResultsDisplay } from './components/features/results/TotalResultsDisplay';
import { DiagnosticResult } from './types';
import { analyzeORU } from './api/analyze';

/**
 * Main application component for the Pathology Report Analyzer
 */
const App: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeORU(file);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-5xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold text-center mb-8">
                  ORU Analysis Dashboard
                </h1>
                
                <FileUpload onUpload={handleFileUpload} isLoading={isLoading} />
                
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {results && (
                  <div className="mt-8 space-y-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">{results.patientInfo.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date of Birth</p>
                          <p className="font-medium">{results.patientInfo.dob}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Gender</p>
                          <p className="font-medium">{results.patientInfo.gender}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">ID</p>
                          <p className="font-medium">{results.patientInfo.id}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg">
                      <h2 className="text-xl font-semibold mb-4">Doctor Information</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">{results.doctorInfo.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Provider ID</p>
                          <p className="font-medium">{results.doctorInfo.providerId}</p>
                        </div>
                      </div>
                    </div>

                    <TotalResultsDisplay results={results} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 