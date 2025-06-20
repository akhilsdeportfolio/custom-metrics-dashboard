
import React, { useState } from "react"
import { CSVLink } from "react-csv"

function MetricsTable({
  data,
  columns,
  title,
  loading = false,
  emptyMessage = "No data available",
  exportFilename = "metrics-export.csv",
  onRowClick
}) {
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState("desc")

  // Handle sort click
  const handleSortClick = column => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new column and default direction
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  // Prepare CSV data
  const csvData = data.map(item => {
    const row = {}
    columns.forEach(column => {
      const value = item[column.key]
      if (column.render && typeof value !== "object") {
        // Try to extract the rendered value if it's a simple value
        row[column.header] = column.render(value, item)
      } else {
        row[column.header] = value
      }
    })
    return row
  })

  // Get alignment class
  const getAlignmentClass = align => {
    switch (align) {
      case "center":
        return "text-center"
      case "right":
        return "text-right"
      default:
        return "text-left"
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">{title}</h2>
        {data.length > 0 && (
          <CSVLink
            data={csvData}
            filename={exportFilename}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
          >
            Export CSV
          </CSVLink>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`py-3 px-4 border-b cursor-pointer hover:bg-gray-200 ${getAlignmentClass(
                    column.align
                  )} ${column.headerClassName || ""}`}
                  onClick={() => handleSortClick(column.key)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.header}</span>
                    {sortColumn === column.key && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-4 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length > 0 ? (
              sortedData.map((item, rowIndex) => (
                <tr key={rowIndex} className={`hover:bg-gray-50`}>
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`py-3 px-4 border-b ${getAlignmentClass(
                        column.align
                      )} ${column.cellClassName || ""} ${
                        column.isClickable
                          ? "cursor-pointer hover:bg-blue-100"
                          : ""
                      }`}
                      onClick={() => {
                        if (column.isClickable && onRowClick) {
                          // Pass both the item and the column key to the click handler
                          onRowClick(item, column.key)
                        }
                      }}
                      data-column-key={column.key}
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : item[column.key]}
                      {column.isClickable && (
                        <span className="ml-1 text-blue-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 inline"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-4 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MetricsTable
