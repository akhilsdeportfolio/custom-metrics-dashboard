import React, { useState } from "react"
import { downloadCSV } from "../../../utils/csvExport"
import FailureDetailsModal from "../FailureDetailsModal"
import {
  fetchAPIFailureDetails,
  fetchDeliveryFailureDetails,
  fetchThreadsFailureDetails
} from "../../../services/failureDetailsService"
import { fetchSpecificTenantDealerMetrics } from "../../../services/specificTenantDealerService"

const SpecificTenantDealerTab = ({ formatNumber }) => {
  // State for tenant and dealer IDs
  const [tenantId, setTenantId] = useState("")
  const [dealerId, setDealerId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(null)

  // State for failure details modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [failureType, setFailureType] = useState("API")
  const [failureDetails, setFailureDetails] = useState([])
  const [modalTitle, setModalTitle] = useState("")

  // Function to fetch metrics for specific tenant/dealer
  const fetchMetrics = async () => {
    if (!tenantId) {
      setError("Tenant ID is required")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await fetchSpecificTenantDealerMetrics(tenantId, dealerId)

      if (!data) {
        setError("No data found for the specified tenant/dealer")
        setMetrics(null)
        return
      }

      // Check if data is an array or a single item
      const dataArray = Array.isArray(data) ? data : [data]

      // Process each metrics item to add enhanced metrics
      const enhancedDataArray = dataArray.map(item => {
        // Calculate additional metrics
        const nonThreadsTotal = item.tmsInitiated + item.gtcInitiated
        const totalNonThreadsFailure = item.apiFailures + item.deliveryFailures
        const nonThreadsSuccess = nonThreadsTotal - totalNonThreadsFailure
        const nonThreadsFailureRate =
          nonThreadsTotal > 0
            ? ((totalNonThreadsFailure / nonThreadsTotal) * 100).toFixed(2) +
              "%"
            : "0%"
        const apiFailureRate =
          nonThreadsTotal > 0
            ? ((item.apiFailures / nonThreadsTotal) * 100).toFixed(2) + "%"
            : "0%"
        const deliveryFailureRate =
          nonThreadsTotal > 0
            ? ((item.deliveryFailures / nonThreadsTotal) * 100).toFixed(2) + "%"
            : "0%"

        return {
          ...item,
          nonThreadsTotal,
          nonThreadsSuccess,
          totalNonThreadsFailure,
          nonThreadsFailureRate,
          apiFailureRate,
          deliveryFailureRate,
          failureRate: item.failureRate || "0%" // Ensure failureRate is always set
        }
      })

      setMetrics(enhancedDataArray)
    } catch (err) {
      console.error("Error fetching metrics:", err)
      setError("Failed to fetch metrics. Please try again.")
      setMetrics(null)
    } finally {
      setIsLoading(false)
    }
  }

  // State for selected metrics item (not currently used but kept for future functionality)
  const [selectedMetrics, setSelectedMetrics] = useState(null)

  // Function to open the API failures modal
  const handleViewAPIFailures = async item => {
    try {
      setIsLoading(true)
      setFailureType("API")

      // Use the provided item or the first item in the metrics array
      const metricsItem =
        item || (metrics && metrics.length > 0 ? metrics[0] : null)
      setSelectedMetrics(metricsItem)

      if (!metricsItem) {
        alert("No metrics data available")
        return
      }

      // Set title based on tenant/dealer selection
      let title = "API Failures"
      title += ` for Tenant ${metricsItem.tenantId}`
      if (metricsItem.dealerId && metricsItem.dealerId !== "TOTAL") {
        title += ` / Dealer ${metricsItem.dealerId}`
      }

      setModalTitle(title)

      // Fetch API failure details with tenant and dealer filters
      const itemDealerId =
        metricsItem.dealerId === "TOTAL" ? undefined : metricsItem.dealerId
      const details = await fetchAPIFailureDetails(
        undefined,
        metricsItem.tenantId,
        itemDealerId
      )
      setFailureDetails(details)
      setIsModalOpen(true)
    } catch (error) {
      console.error("Error fetching API failure details:", error)
      alert("Failed to load API failure details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to open the delivery failures modal
  const handleViewDeliveryFailures = async item => {
    try {
      setIsLoading(true)
      setFailureType("Delivery")

      // Use the provided item or the first item in the metrics array
      const metricsItem =
        item || (metrics && metrics.length > 0 ? metrics[0] : null)
      setSelectedMetrics(metricsItem)

      if (!metricsItem) {
        alert("No metrics data available")
        return
      }

      // Set title based on tenant/dealer selection
      let title = "Delivery Failures"
      title += ` for Tenant ${metricsItem.tenantId}`
      if (metricsItem.dealerId && metricsItem.dealerId !== "TOTAL") {
        title += ` / Dealer ${metricsItem.dealerId}`
      }

      setModalTitle(title)

      // Fetch delivery failure details with tenant and dealer filters
      const itemDealerId =
        metricsItem.dealerId === "TOTAL" ? undefined : metricsItem.dealerId
      const details = await fetchDeliveryFailureDetails(
        undefined,
        metricsItem.tenantId,
        itemDealerId
      )
      setFailureDetails(details)
      setIsModalOpen(true)
    } catch (error) {
      console.error("Error fetching delivery failure details:", error)
      alert("Failed to load delivery failure details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to open the Threads failures modal
  const handleViewThreadsFailures = async item => {
    try {
      setIsLoading(true)
      setFailureType("Threads")

      // Use the provided item or the first item in the metrics array
      const metricsItem =
        item || (metrics && metrics.length > 0 ? metrics[0] : null)
      setSelectedMetrics(metricsItem)

      if (!metricsItem) {
        alert("No metrics data available")
        return
      }

      // Set title based on tenant/dealer selection
      let title = "Threads Failures"
      title += ` for Tenant ${metricsItem.tenantId}`
      if (metricsItem.dealerId && metricsItem.dealerId !== "TOTAL") {
        title += ` / Dealer ${metricsItem.dealerId}`
      }

      setModalTitle(title)

      // Fetch Threads failure details with tenant and dealer filters
      const itemDealerId =
        metricsItem.dealerId === "TOTAL" ? undefined : metricsItem.dealerId
      const details = await fetchThreadsFailureDetails(
        undefined,
        metricsItem.tenantId,
        itemDealerId
      )
      setFailureDetails(details)
      setIsModalOpen(true)
    } catch (error) {
      console.error("Error fetching Threads failure details:", error)
      alert("Failed to load Threads failure details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle CSV export
  const handleExportCSV = () => {
    if (!metrics || metrics.length === 0) return

    // Create a simplified version of the data for export
    const exportData = metrics.map(item => ({
      tenantId: item.tenantId,
      dealerId: item.dealerId,
      threadConnectorTotal: item.threadConnectorTotal,
      threadConnectorSuccess: item.threadConnectorSuccess,
      threadConnectorFailure: item.threadConnectorFailure,
      threadConnectorFailureRate: item.threadConnectorFailureRate,
      tmsInitiated: item.tmsInitiated,
      gtcInitiated: item.gtcInitiated,
      nonThreadsTotal: item.nonThreadsTotal,
      nonThreadsSuccess: item.nonThreadsSuccess,
      totalNonThreadsFailure: item.totalNonThreadsFailure,
      nonThreadsFailureRate: item.nonThreadsFailureRate,
      apiFailures: item.apiFailures,
      apiFailureRate: item.apiFailureRate,
      deliveryFailures: item.deliveryFailures,
      deliveryFailureRate: item.deliveryFailureRate
    }))

    // Define custom headers for better readability in the CSV
    const headers = {
      tenantId: "Tenant ID",
      dealerId: "Dealer ID",
      threadConnectorTotal: "Total Threads Messages",
      threadConnectorSuccess: "Threads Success Messages",
      threadConnectorFailure: "Threads Failure Count",
      threadConnectorFailureRate: "Threads Failure Rate",
      tmsInitiated: "Total TMS Messages",
      gtcInitiated: "Total GTC Messages",
      nonThreadsTotal: "Total Non-Threads Messages",
      nonThreadsSuccess: "Non-Threads Success",
      totalNonThreadsFailure: "Non-Threads Failure",
      nonThreadsFailureRate: "Non-Threads Failure Rate",
      apiFailures: "API Failures",
      apiFailureRate: "API Failure Rate",
      deliveryFailures: "Delivery Failures",
      deliveryFailureRate: "Delivery Failure Rate"
    }

    // Download the CSV
    downloadCSV(
      exportData,
      `metrics-${tenantId}${dealerId ? `-${dealerId}` : ""}.csv`,
      headers
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Specific Tenant/Dealer Metrics</h2>
      </div>

      {/* Search inputs */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="tenantIdInput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tenant ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="tenantIdInput"
            value={tenantId}
            onChange={e => setTenantId(e.target.value)}
            placeholder="Enter Tenant ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="dealerIdInput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Dealer ID (Optional)
          </label>
          <input
            type="text"
            id="dealerIdInput"
            value={dealerId}
            onChange={e => setDealerId(e.target.value)}
            placeholder="Enter Dealer ID (Optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
            disabled={isLoading || !tenantId}
          >
            {isLoading ? "Loading..." : "Fetch Metrics"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {metrics && metrics.length > 0 && (
        <>
          <div className="flex justify-end mb-4">
            <div className="flex space-x-2">
              <button
                onClick={handleExportCSV}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleViewThreadsFailures()}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "View Threads Failures"}
              </button>
              <button
                onClick={() => handleViewAPIFailures()}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "View API Failures"}
              </button>
              <button
                onClick={() => handleViewDeliveryFailures()}
                className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "View Delivery Failures"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th colSpan={2} className="py-2 px-4 border-b"></th>
                  <th
                    colSpan={4}
                    className="py-2 px-4 border-b text-center bg-blue-100 font-bold"
                  >
                    Threads Metrics (CRM)
                  </th>
                  <th
                    colSpan={11}
                    className="py-2 px-4 border-b text-center bg-green-100 font-bold"
                  >
                    Non-Threads Metrics (ARC + CRM)
                  </th>
                </tr>
                <tr>
                  <th className="py-2 px-4 border-b">Tenant ID</th>
                  <th className="py-2 px-4 border-b">Dealer ID</th>
                  <th className="py-2 px-4 border-b bg-blue-50">Total</th>
                  <th className="py-2 px-4 border-b bg-blue-50">Success</th>
                  <th className="py-2 px-4 border-b bg-blue-50">Failure</th>
                  <th className="py-2 px-4 border-b bg-blue-50">
                    Failure Rate
                  </th>
                  <th className="py-2 px-4 border-b bg-green-50">TMS</th>
                  <th className="py-2 px-4 border-b bg-green-50">GTC</th>
                  <th className="py-2 px-4 border-b bg-green-50">Total</th>
                  <th className="py-2 px-4 border-b bg-green-50">Success</th>
                  <th className="py-2 px-4 border-b bg-green-50">Failure</th>
                  <th className="py-2 px-4 border-b bg-green-50">
                    Failure Rate
                  </th>
                  <th className="py-2 px-4 border-b bg-green-50">
                    API Failures
                  </th>
                  <th className="py-2 px-4 border-b bg-green-50">API Rate</th>
                  <th className="py-2 px-4 border-b bg-green-50">
                    Delivery Failures
                  </th>
                  <th className="py-2 px-4 border-b bg-green-50">
                    Delivery Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((item, index) => (
                  <tr
                    key={`${item.tenantId}-${item.dealerId}-${index}`}
                    className={
                      item.dealerId === "TOTAL"
                        ? "bg-gray-100 font-bold"
                        : "bg-white"
                    }
                  >
                    <td className="py-2 px-4 border-b">{item.tenantId}</td>
                    <td className="py-2 px-4 border-b">
                      {item.dealerId || "All"}
                    </td>
                    <td className="py-2 px-4 border-b bg-blue-50">
                      {formatNumber(item.threadConnectorTotal)}
                    </td>
                    <td className="py-2 px-4 border-b bg-blue-50">
                      {formatNumber(item.threadConnectorSuccess)}
                    </td>
                    <td className="py-2 px-4 border-b bg-blue-50">
                      {item.threadConnectorFailure > 0 ? (
                        <button
                          onClick={() => handleViewThreadsFailures(item)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {formatNumber(item.threadConnectorFailure)}
                        </button>
                      ) : (
                        formatNumber(item.threadConnectorFailure)
                      )}
                    </td>
                    <td className="py-2 px-4 border-b bg-blue-50">
                      {item.threadConnectorFailureRate}
                    </td>
                    <td className="py-2 px-4 border-b bg-green-50">
                      {formatNumber(item.tmsInitiated)}
                    </td>
                    <td className="py-2 px-4 border-b bg-green-50">
                      {formatNumber(item.gtcInitiated)}
                    </td>
                    <td className="py-2 px-4 border-b bg-green-50">
                      {formatNumber(item.nonThreadsTotal)}
                    </td>
                    <td className="py-2 px-4 border-b bg-green-50">
                      {formatNumber(item.nonThreadsSuccess)}
                    </td>
                    <td className="py-2 px-4 border-b bg-green-50">
                      {item.totalNonThreadsFailure > 0 ? (
                        <>
                          <button
                            onClick={() => handleViewAPIFailures(item)}
                            className="text-blue-600 hover:text-blue-800 hover:underline mr-2"
                          >
                            {formatNumber(item.apiFailures)}
                          </button>
                          +
                          <button
                            onClick={() => handleViewDeliveryFailures(item)}
                            className="text-blue-600 hover:text-blue-800 hover:underline ml-2"
                          >
                            {formatNumber(item.deliveryFailures)}
                          </button>
                          = {formatNumber(item.totalNonThreadsFailure)}
                        </>
                      ) : (
                        formatNumber(item.totalNonThreadsFailure)
                      )}
                    </td>
                    <td className="py-2 px-4 border-b bg-green-50">
                      {item.nonThreadsFailureRate}
                    </td>
                    <td className="py-2 px-4 border-b bg-green-50">
                      {item.apiFailures > 0 ? (
                        <button
                          onClick={() => handleViewAPIFailures(item)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {formatNumber(item.apiFailures)}
                        </button>
                      ) : (
                        formatNumber(item.apiFailures)
                      )}
                    </td>
                    <td className="py-2 px-4 border-b bg-green-50">
                      {item.apiFailureRate}
                    </td>
                    <td className="py-2 px-4 border-b bg-green-50">
                      {item.deliveryFailures > 0 ? (
                        <button
                          onClick={() => handleViewDeliveryFailures(item)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {formatNumber(item.deliveryFailures)}
                        </button>
                      ) : (
                        formatNumber(item.deliveryFailures)
                      )}
                    </td>
                    <td className="py-2 px-4 border-b bg-green-50">
                      {item.deliveryFailureRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Failure Details Modal */}
      <FailureDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        failureType={failureType}
        failureDetails={failureDetails}
        title={modalTitle}
      />
    </div>
  )
}

export default SpecificTenantDealerTab
