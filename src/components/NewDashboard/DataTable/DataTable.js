
import React, { useState } from "react"

function DataTable({
  data,
  columns,
  keyExtractor,
  initialSortColumn,
  initialSortDirection = "asc",
  pageSize = 10,
  onRowClick
}) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Sorting state
  const [sortColumn, setSortColumn] = useState(initialSortColumn)
  const [sortDirection, setSortDirection] = useState(initialSortDirection)

  // Calculate total pages
  const totalPages = Math.ceil(data.length / pageSize)

  // Get current page data
  const currentData = data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Handle sort click
  const handleSortClick = column => {
    if (!column.sortable) return

    if (sortColumn === column.key) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new column and default direction
      setSortColumn(column.key)
      setSortDirection("asc")
    }
  }

  // Handle page change
  const handlePageChange = page => {
    setCurrentPage(page)
  }

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
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`py-2 px-4 border-b ${getAlignmentClass(
                    column.align
                  )} ${
                    column.sortable ? "cursor-pointer hover:bg-gray-200" : ""
                  }`}
                  onClick={() => column.sortable && handleSortClick(column)}
                >
                  {column.header}
                  {column.sortable && sortColumn === column.key && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map(item => (
                <tr
                  key={keyExtractor(item)}
                  className={`hover:bg-gray-50 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`py-2 px-4 border-b ${getAlignmentClass(
                        column.align
                      )}`}
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : item[column.key]}
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
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 bg-white border-t">
          <div className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, data.length)}
            </span>{" "}
            of <span className="font-medium">{data.length}</span> results
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded ${
                    currentPage === pageNum
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
