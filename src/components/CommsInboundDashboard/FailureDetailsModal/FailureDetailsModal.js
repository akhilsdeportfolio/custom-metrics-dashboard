
import React from "react"
import { CSVLink } from "react-csv"

const FailureDetailsModal = ({
  isOpen,
  onClose,
  title,
  data,
  loading,
  error
}) => {
  if (!isOpen) return null

  // Format timestamp for display
  const formatTimestamp = timestamp => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Prepare CSV data
  const csvData = data.map(item => ({
    Timestamp: formatTimestamp(item.timestamp),
    "Tenant ID": item.tenantId,
    "Dealer ID": item.dealerId,
    "Event SubType": item.eventSubType,
    "Event Message": item.eventMessage,
    "Error Message": item.errorMessage,
    Origin: item.origin,
    Metadata: item.metadata
  }))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex space-x-2">
            {data.length > 0 && (
              <CSVLink
                data={csvData}
                filename={`inbound-failure-details-${new Date().toISOString()}.csv`}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Export CSV
              </CSVLink>
            )}
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>

        <div className="overflow-auto flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              <span>Loading inbound failure details...</span>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
              <p className="font-bold">Error Loading Data</p>
              <p>{error.message}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No inbound failure details found.
            </div>
          ) : (
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left">Timestamp</th>
                  <th className="py-3 px-4 border-b text-left">Tenant ID</th>
                  <th className="py-3 px-4 border-b text-left">Dealer ID</th>
                  <th className="py-3 px-4 border-b text-left">
                    Event SubType
                  </th>
                  <th className="py-3 px-4 border-b text-left">
                    Event Message
                  </th>
                  <th className="py-3 px-4 border-b text-left">
                    Error Message
                  </th>
                  <th className="py-3 px-4 border-b text-left">Origin</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b text-sm">
                      {formatTimestamp(item.timestamp)}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm">
                      {item.tenantId}
                    </td>
                    <td className="py-3 px-4 border-b font-mono text-sm">
                      {item.dealerId}
                    </td>
                    <td className="py-3 px-4 border-b">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.eventSubType === "API_FAILURE"
                            ? "bg-red-100 text-red-800"
                            : item.eventSubType === "DELIVERY_FAILURE"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.eventSubType}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b">{item.eventMessage}</td>
                    <td
                      className="py-3 px-4 border-b text-sm max-w-xs truncate"
                      title={item.errorMessage}
                    >
                      {item.errorMessage}
                    </td>
                    <td className="py-3 px-4 border-b">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.origin.toUpperCase().includes("THREAD")
                            ? "bg-blue-100 text-blue-800"
                            : item.origin.toUpperCase().includes("TWILIO")
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.origin}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default FailureDetailsModal
