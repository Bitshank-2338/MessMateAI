import React, { useState } from 'react';
import { MealLog } from '../types';
import { ArrowUpDown, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

interface HistoryTableProps {
  logs: MealLog[];
}

type SortField = 'date' | 'calories' | 'protein' | 'carbs';

export const HistoryTable: React.FC<HistoryTableProps> = ({ logs }) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedLogs = [...logs].sort((a, b) => {
    let valA: number | string = 0;
    let valB: number | string = 0;

    switch (sortField) {
      case 'date':
        valA = a.timestamp;
        valB = b.timestamp;
        break;
      case 'calories':
        valA = a.totalStats.calories;
        valB = b.totalStats.calories;
        break;
      case 'protein':
        valA = a.totalStats.protein;
        valB = b.totalStats.protein;
        break;
      case 'carbs':
        valA = a.totalStats.carbs;
        valB = b.totalStats.carbs;
        break;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No history available yet.</p>
      </div>
    );
  }

  const HeaderCell = ({ field, label }: { field: SortField, label: string }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition select-none group"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="w-3 h-3 text-indigo-600" />
          ) : (
            <ArrowDown className="w-3 h-3 text-indigo-600" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">Nutrient History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <HeaderCell field="date" label="Date & Time" />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <HeaderCell field="calories" label="Calories" />
              <HeaderCell field="protein" label="Protein (g)" />
              <HeaderCell field="carbs" label="Carbs (g)" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="font-medium text-gray-900">{log.dateStr}</div>
                  <div className="text-xs">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={log.description}>
                  {log.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.totalStats.calories}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                  {log.totalStats.protein}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-medium">
                  {log.totalStats.carbs}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
