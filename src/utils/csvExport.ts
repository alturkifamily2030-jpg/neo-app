/**
 * Downloads a CSV file in the browser.
 * @param filename - The filename (should end in .csv)
 * @param headers - Array of column header strings
 * @param rows - 2D array of cell values
 */
export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  const escape = (cell: string | number | boolean | null | undefined): string => {
    const str = cell == null ? '' : String(cell);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const content = [headers, ...rows]
    .map(row => row.map(escape).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
