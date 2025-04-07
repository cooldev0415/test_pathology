import React, { useState, useMemo } from 'react';
import type { DiagnosticResult, AbnormalResult } from '../../../types';

interface Props {
  results: DiagnosticResult;
}

type SortField = 'name' | 'value' | 'risk' | 'group';
type SortOrder = 'asc' | 'desc';

export const TotalResultsDisplay: React.FC<Props> = ({ results }) => {
  const [sortField, setSortField] = useState<SortField>('group');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showOnlyHighRisk, setShowOnlyHighRisk] = useState(false);

  const groups = useMemo(() => {
    const uniqueGroups = new Set(results.abnormalResults.map((result: AbnormalResult) => result.group));
    return Array.from(uniqueGroups).sort();
  }, [results.abnormalResults]);

  const sortedResults = useMemo(() => {
    let filtered = [...results.abnormalResults];
    
    if (showOnlyHighRisk) {
      filtered = filtered.filter((result: AbnormalResult) => result.isHighRisk);
    }

    return filtered.sort((a: AbnormalResult, b: AbnormalResult) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.testName.localeCompare(b.testName);
          break;
        case 'value':
          const valueA = parseFloat(a.value);
          const valueB = parseFloat(b.value);
          comparison = isNaN(valueA) || isNaN(valueB) ? 
            a.value.localeCompare(b.value) : 
            valueA - valueB;
          break;
        case 'risk':
          comparison = Number(b.isHighRisk) - Number(a.isHighRisk);
          break;
        case 'group':
          comparison = a.group.localeCompare(b.group);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [results.abnormalResults, sortField, sortOrder, showOnlyHighRisk]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Test Results</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={showOnlyHighRisk}
                onChange={(e) => setShowOnlyHighRisk(e.target.checked)}
              />
              <span className="ml-2">Show only high risk</span>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Test Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort('value')}
              >
                Value {sortField === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-2">Units</th>
              <th className="px-4 py-2">Reference Range</th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort('risk')}
              >
                Risk Level {sortField === 'risk' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort('group')}
              >
                Group {sortField === 'group' && (sortOrder === 'asc' ? '↓' : '↑')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result: AbnormalResult, index) => (
              <tr
                key={`${result.testName}-${index}`}
                className={`${
                  result.isHighRisk
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="border px-4 py-2">{result.testName}</td>
                <td className="border px-4 py-2 font-mono">{result.value}</td>
                <td className="border px-4 py-2">{result.units}</td>
                <td className="border px-4 py-2">{result.referenceRange}</td>
                <td className="border px-4 py-2">
                  {result.isHighRisk ? (
                    <span className="text-red-600 font-semibold">High Risk</span>
                  ) : (
                    <span className="text-yellow-600">Abnormal</span>
                  )}
                </td>
                <td className="border px-4 py-2">{result.group}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedResults.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No results match the current filters
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Total Results: {sortedResults.length}
        {showOnlyHighRisk && ` (Showing only high risk)`}
      </div>
    </div>
  );
}; 