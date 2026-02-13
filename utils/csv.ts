import { MealLog } from "../types";

export const downloadCSV = (logs: MealLog[]) => {
  const headers = ['Date', 'Time', 'Description', 'Calories', 'Protein (g)', 'Carbs (g)', 'Feedback'];
  const rows = logs.map(log => [
    log.dateStr,
    new Date(log.timestamp).toLocaleTimeString(),
    `"${log.description.replace(/"/g, '""')}"`, // Escape quotes
    log.totalStats.calories,
    log.totalStats.protein,
    log.totalStats.carbs,
    `"${log.feedback.replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nutrition_log_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
