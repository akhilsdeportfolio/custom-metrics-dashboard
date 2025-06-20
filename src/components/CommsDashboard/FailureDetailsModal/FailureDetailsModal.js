import React, { useState } from "react"
import { CSVLink } from "react-csv"

const FailureDetailsModal = ({
  isOpen,
  onClose,
  title,
  data,
  loading,
  error,
  showCategorization = false,
  categorizedData
}) => {
  const [activeTab, setActiveTab] = useState("all")

  if (!isOpen) return null

  // Format timestamp for display
  const formatTimestamp = timestamp => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Get current data based on active tab and categorization mode
  const getCurrentData = () => {
    if (!showCategorization || !categorizedData) {
      return data
    }

    switch (activeTab) {
      case "controllable":
        return categorizedData.controllable
      case "nonControllable":
        return categorizedData.nonControllable
      default:
        return [
          ...categorizedData.controllable,
          ...categorizedData.nonControllable
        ]
    }
  }

  const currentData = getCurrentData()

  // Prepare CSV data
  const csvData = currentData.map(item => ({
    "Event Message": item.eventMessage,
    "Error Message": item.errorMessage,
    Origin: item.origin,
    Count: item.count,
    Category: item.category || "N/A",
    "Tenant ID": item.tenantId || "N/A",
    "Dealer ID": item.dealerId || "N/A",
    Timestamp: item.eventTimestamp
      ? formatTimestamp(item.eventTimestamp)
      : "N/A",
    "Event Type": item.eventType || "N/A",
    "Event SubType": item.eventSubType || "N/A",
    "Provider Type": item.providerType || "N/A"
  }))

  // Get category color
  const getCategoryColor = category => {
    switch (category) {
      case "CONTROLLABLE":
        return "text-orange-600 bg-orange-50"
      case "NON_CONTROLLABLE":
        return "text-red-600 bg-red-50"
      default:
        return ""
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <div className="flex space-x-2">
              {currentData.length > 0 && (
                <CSVLink
                  data={csvData}
                  filename={`failure-details-${new Date().toISOString()}.csv`}
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

          {/* Categorization Tabs */}
          {showCategorization && categorizedData && (
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All (
                {
                  [
                    ...categorizedData.controllable,
                    ...categorizedData.nonControllable
                  ].length
                }
                )
              </button>
              <button
                onClick={() => setActiveTab("controllable")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "controllable"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Controllable ({categorizedData.controllable.length})
              </button>
              <button
                onClick={() => setActiveTab("nonControllable")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "nonControllable"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Non-Controllable ({categorizedData.nonControllable.length})
              </button>
            </div>
          )}
        </div>

        <div className="overflow-auto flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              <span>Loading failure details...</span>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
              <p className="font-bold">Error Loading Data</p>
              <p>{error.message}</p>
            </div>
          ) : currentData.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No failure details found.
            </div>
          ) : (
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left">
                    Event Message
                  </th>
                  <th className="py-3 px-4 border-b text-left">
                    Error Message
                  </th>
                  <th className="py-3 px-4 border-b text-left">Origin</th>
                  {showCategorization && (
                    <th className="py-3 px-4 border-b text-left">Category</th>
                  )}
                  <th className="py-3 px-4 border-b text-left">Count</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">{item.eventMessage}</td>
                    <td className="py-3 px-4 border-b">{item.errorMessage}</td>
                    <td className="py-3 px-4 border-b">{item.origin}</td>
                    {showCategorization && (
                      <td className="py-3 px-4 border-b">
                        {item.category && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                              item.category
                            )}`}
                          >
                            {item.category.replace("_", " ")}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4 border-b font-bold">
                      {item.count}
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
