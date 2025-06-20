
import React from "react"
import { downloadCSV } from "../../../utils/csvExport"

const FailureDetailsModal = ({
  isOpen,
  onClose,
  failureType,
  failureDetails,
  title
}) => {
  if (!isOpen) return null

  // Handle export to CSV
  const handleExportCSV = () => {
    const headers = {
      message:
        failureType === "API"
          ? "Error Message"
          : failureType === "Delivery"
          ? "Delivery Status"
          : "Threads Error Message",
      origin: "Origin Platform",
      eventMessage: "Event Message",
      eventSubType: "Event SubType",
      count: "Count"
    }

    downloadCSV(
      failureDetails,
      `${failureType.toLowerCase()}-failures.csv`,
      headers
    )
  }

  // Calculate totals
  const totalCount = failureDetails.reduce((sum, item) => sum + item.count, 0)
  const threadsCount = failureDetails
    .filter(item => item.origin.toUpperCase().includes("THREAD"))
    .reduce((sum, item) => sum + item.count, 0)
  const nonThreadsCount = totalCount - threadsCount

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleExportCSV}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-600">Threads</p>
              <p className="text-xl font-bold">
                {threadsCount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {totalCount > 0
                  ? ((threadsCount / totalCount) * 100).toFixed(2) + "%"
                  : "0%"}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-gray-600">Non-Threads</p>
              <p className="text-xl font-bold">
                {nonThreadsCount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {totalCount > 0
                  ? ((nonThreadsCount / totalCount) * 100).toFixed(2) + "%"
                  : "0%"}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold">{totalCount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">100%</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-grow px-6 py-4">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">
                  {failureType === "API"
                    ? "Error Message"
                    : failureType === "Delivery"
                    ? "Delivery Status"
                    : "Threads Error Message"}
                </th>
                <th className="py-2 px-4 border-b text-left">
                  Origin Platform
                </th>
                <th className="py-2 px-4 border-b text-left">Event Message</th>
                <th className="py-2 px-4 border-b text-left">Event SubType</th>
                <th className="py-2 px-4 border-b text-right">Count</th>
                <th className="py-2 px-4 border-b text-right">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {failureDetails.map((item, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-2 px-4 border-b">
                    {item.message || "Unknown"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.origin.toUpperCase().includes("THREAD")
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.origin || "Unknown"}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {item.eventMessage || "-"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {item.eventSubType || "-"}
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {item.count.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {totalCount > 0
                      ? ((item.count / totalCount) * 100).toFixed(2) + "%"
                      : "0%"}
                  </td>
                </tr>
              ))}
              {failureDetails.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    No failure details available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default FailureDetailsModal
