/**
 * Converts an array of data rows into a CSV file and triggers a download.
 * @param filename The name of the file to be downloaded (e.g., 'data.csv').
 * @param rows An array of arrays, where each inner array represents a row.
 *             The first inner array should be the headers.
 */
export const exportToCsv = (filename: string, rows: (string | number)[][]) => {
    // Ensure all row values are properly escaped for CSV format
    const processRow = (row: (string | number)[]): string =>
        row
            .map(String)
            .map(v => v.replace(/"/g, '""')) // Escape double quotes
            .map(v => `"${v}"`) // Wrap every field in double quotes
            .join(',');

    const csvContent = rows.map(processRow).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    
    // Check for browser compatibility
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up the object URL
    }
};
