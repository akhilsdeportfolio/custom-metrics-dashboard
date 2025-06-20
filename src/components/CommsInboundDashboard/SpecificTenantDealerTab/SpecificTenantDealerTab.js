
import React, { useState } from "react"
import { downloadCSV } from "../../../utils/csvExport"
// Note: FailureDetailsModal removed for simplified GTC inbound version
import MetricsFilters from "../MetricsFilters"
import { fetchSpecificTenantDealerMetrics } from "../../../services/commsInboundFailureDetailsService"
import {
  getCurrentMonthRange,
  getDefaultTimeRange
} from "../../../utils/dateUtils"

const SpecificTenantDealerTab = () => {
  // State for filters
  const {
    startDate: defaultStartDate,
    endDate: defaultEndDate
  } = getCurrentMonthRange()
  const {
    startTime: defaultStartTime,
    endTime: defaultEndTime
  } = getDefaultTimeRange()

  const [filters, setFilters] = useState({
    tenantId: "",
    dealerId: "",
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    providerType: "ALL"
  })

  // State for metrics data
  const [metricsData, setMetricsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Note: Failure modal functionality removed for simplified GTC inbound version

  // Format number with commas
  const formatNumber = num => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      tenantId: "",
      dealerId: "",
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      providerType: "ALL"
    })
  }

  // Handle form submission
  const handleSubmit = async e => {
    if (e) {
      e.preventDefault()
    }

    if (!filters.tenantId && !filters.dealerId) {
      setError("Either Tenant ID or Dealer ID is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await fetchSpecificTenantDealerMetrics(
        filters.tenantId,
        filters.dealerId,
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
          startTime: filters.startTime,
          endTime: filters.endTime
        }
      )

      setMetricsData(data)
      if (!data) {
        setError("No inbound data found for the specified tenant/dealer")
      }
    } catch (err) {
      console.error(
        "Error fetching specific tenant/dealer inbound metrics:",
        err
      )
      setError("Failed to fetch inbound metrics data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Export data to CSV
  const handleExportCSV = () => {
    if (!metricsData) return

    // Convert TenantDealerMetrics to Record<string, unknown>
    const dataForExport = [
      {
        tenantId: metricsData.tenantId,
        dealerId: metricsData.dealerId,
        // Inbound Threads Metrics
        threadsInitiated: metricsData.threadsInitiated,
        threadsSuccess: metricsData.threadsSuccess,
        threadsApiFailure: metricsData.threadsApiFailure,
        threadsDeliveryFailure: metricsData.threadsDeliveryFailure,
        threadsFailure: metricsData.threadsFailure,
        threadsFailureRate: metricsData.threadsFailureRate,
        // Inbound Non-Threads Metrics
        nonThreadsInitiated: metricsData.nonThreadsInitiated,
        nonThreadsSuccess: metricsData.nonThreadsSuccess,
        nonThreadsApiFailure: metricsData.nonThreadsApiFailure,
        nonThreadsDeliveryFailure: metricsData.nonThreadsDeliveryFailure,
        nonThreadsFailure: metricsData.nonThreadsFailure,
        nonThreadsFailureRate: metricsData.nonThreadsFailureRate,
        // Inbound Twilio Metrics
        twilioInitiated: metricsData.twilioInitiated,
        twilioSuccess: metricsData.twilioSuccess,
        twilioApiFailure: metricsData.twilioApiFailure,
        twilioDeliveryFailure: metricsData.twilioDeliveryFailure,
        twilioFailure: metricsData.twilioFailure,
        twilioFailureRate: metricsData.twilioFailureRate,
        // Totals
        totalInitiated: metricsData.totalInitiated,
        totalSuccess: metricsData.totalSuccess,
        totalFailure: metricsData.totalFailure,
        totalFailureRate: metricsData.totalFailureRate
      }
    ]

    const filename = `specific_inbound_tenant_dealer_metrics_${
      filters.tenantId
    }${filters.dealerId ? `_${filters.dealerId}` : ""}.csv`
    downloadCSV(dataForExport, filename)
  }

  // Note: Summary section removed as requested

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          Specific Tenant/Dealer Inbound Metrics
        </h2>

        {/* Metrics Filters */}
        <MetricsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          showTenantDealerFilters={true}
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmit}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? "Loading..." : "Fetch Inbound Metrics"}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Data Display Section */}
      {metricsData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                Inbound Metrics for Tenant: {metricsData.tenantId}
                {filters.dealerId && ` / Dealer: ${filters.dealerId}`}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Inbound message counts by provider type
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dealer ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    GTC Messages
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                    Twilio Messages
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Total Messages
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metricsData.tenantId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metricsData.dealerId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right bg-blue-50">
                    {formatNumber(metricsData.threadsInitiated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right bg-purple-50">
                    {formatNumber(metricsData.twilioInitiated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right bg-gray-50">
                    {formatNumber(metricsData.totalInitiated)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note: Failure Details Modal removed for simplified GTC inbound version */}
    </div>
  )
}

export default SpecificTenantDealerTab
