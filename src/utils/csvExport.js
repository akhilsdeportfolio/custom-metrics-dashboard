/**
 * Converts an array of objects to CSV format and triggers a download
 * @param {Array} data - Array of objects to convert to CSV
 * @param {string} filename - Name of the file to download
 */
export function downloadCSV(data, filename) {
  if (!data || !data.length) {
    console.warn('No data to export')
    return
  }

  // Get headers from the first object
  const headers = Object.keys(data[0])
  
  // Create CSV rows
  const csvRows = []
  
  // Add header row
  csvRows.push(headers.join(','))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      // Handle special cases (null, undefined, strings with commas)
      if (value === null || value === undefined) {
        return ''
      }
      const valueStr = String(value)
      // Escape quotes and wrap in quotes if contains comma, quote or newline
      if (valueStr.includes(',') || valueStr.includes('"') || valueStr.includes('\n')) {
        return `"${valueStr.replace(/"/g, '""')}"`
      }
      return valueStr
    })
    csvRows.push(values.join(','))
  }
  
  // Create CSV content
  const csvContent = csvRows.join('\n')
  
  // Create a blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
