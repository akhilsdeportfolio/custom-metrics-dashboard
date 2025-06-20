
import React, { useState } from "react"
import { downloadCSV } from "../../../utils/csvExport"
import FailureDetailsModal from "../FailureDetailsModal"
import MetricsFilters from "../MetricsFilters"
import {
  fetchSpecificTenantDealerMetrics,
  fetchFailureDetails,
  FailureType
} from "../../../pages/commsFailureDetailsService"
import {
  getCurrentMonthRange,
  getDefaultTimeRange,
  dateTimeToEpoch
} from "../../../utils/dateUtils"

const SpecificTenantDealerTab = ({ formatNumber }) => {
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
    endTime: defaultEndTime
  })

  // State for metrics data
  const [metricsData, setMetricsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // State for failure details modal
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false)
  const [failureModalTitle, setFailureModalTitle] = useState("")
  const [failureDetails, setFailureDetails] = useState([])
  const [failureDetailsLoading, setFailureDetailsLoading] = useState(false)
  const [failureDetailsError, setFailureDetailsError] = useState(null)

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
      endTime: defaultEndTime
    })
  }

  // Handle form submission
  const handleSubmit = async e => {
    if (e) {
      e.preventDefault()
    }

    if (!filters.tenantId) {
      setError("Tenant ID is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Convert date and time to epoch timestamps
      const startTimestamp = dateTimeToEpoch(
        filters.startDate,
        filters.startTime
      )
      const endTimestamp = dateTimeToEpoch(filters.endDate, filters.endTime)

      const data = await fetchSpecificTenantDealerMetrics(
        filters.tenantId,
        filters.dealerId,
        startTimestamp,
        endTimestamp
      )

      setMetricsData(data)
      if (!data) {
        setError("No data found for the specified tenant/dealer")
      }
    } catch (err) {
      console.error("Error fetching specific tenant/dealer metrics:", err)
      setError("Failed to fetch metrics data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // State for selected metrics item (not currently used but kept for future functionality)
  const [selectedMetrics, setSelectedMetrics] = useState(null)

  // Handle failure cell click
  const handleFailureCellClick = async (failureType, item) => {
    if (!metricsData || metricsData.length === 0) return

    // Use the provided item or the first item in the metrics array
    const metricsItem = item || metricsData[0]
    setSelectedMetrics(metricsItem)

    // Determine the title based on failure type
    let title = ""
    switch (failureType) {
      case FailureType.THREADS_API:
        title = "Threads API Failures"
        break
      case FailureType.THREADS_DELIVERY:
        title = "Threads Delivery Failures"
        break
      case FailureType.THREADS_TOTAL:
        title = "Threads Total Failures"
        break
      case FailureType.NON_THREADS_API:
        title = "Non-Threads API Failures"
        break
      case FailureType.NON_THREADS_DELIVERY:
        title = "Non-Threads Delivery Failures"
        break
      case FailureType.NON_THREADS_TOTAL:
        title = "Non-Threads Total Failures"
        break
      case FailureType.TWILIO_API:
        title = "Twilio API Failures"
        break
      case FailureType.TWILIO_DELIVERY:
        title = "Twilio Delivery Failures"
        break
      case FailureType.TWILIO_TOTAL:
        title = "Twilio Total Failures"
        break
    }

    // Add tenant/dealer info to title
    title += ` for Tenant ${metricsItem.tenantId}`
    if (metricsItem.dealerId && metricsItem.dealerId !== "TOTAL") {
      title += ` / Dealer ${metricsItem.dealerId}`
    }

    setFailureModalTitle(title)
    setFailureDetailsLoading(true)
    setFailureDetailsError(null)

    try {
      const failureFilters = {
        tenantId: metricsItem.tenantId,
        dealerId:
          metricsItem.dealerId === "TOTAL" ? undefined : metricsItem.dealerId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        startTime: filters.startTime,
        endTime: filters.endTime
      }

      const details = await fetchFailureDetails(failureType, failureFilters)
      setFailureDetails(details)
      setIsFailureModalOpen(true)
    } catch (err) {
      console.error("Error fetching failure details:", err)
      setFailureDetailsError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      )
    } finally {
      setFailureDetailsLoading(false)
    }
  }

  // Export data to CSV
  const handleExportCSV = () => {
    if (!metricsData || metricsData.length === 0) return

    // Convert TenantDealerMetrics array to Record<string, unknown>[]
    const dataForExport = metricsData.map(item => ({
      tenantId: item.tenantId,
      dealerId: item.dealerId,
      // Threads Metrics
      threadsInitiated: item.threadsInitiated,
      threadsSuccess: item.threadsSuccess,
      threadsApiFailure: item.threadsApiFailure,
      threadsDeliveryFailure: item.threadsDeliveryFailure,
      threadsFailure: item.threadsFailure,
      threadsFailureRate: item.threadsFailureRate,
      // Non-Threads Metrics
      nonThreadsInitiated: item.nonThreadsInitiated,
      nonThreadsSuccess: item.nonThreadsSuccess,
      nonThreadsApiFailure: item.nonThreadsApiFailure,
      nonThreadsDeliveryFailure: item.nonThreadsDeliveryFailure,
      nonThreadsFailure: item.nonThreadsFailure,
      nonThreadsFailureRate: item.nonThreadsFailureRate,
      // Twilio Metrics
      twilioInitiated: item.twilioInitiated,
      twilioSuccess: item.twilioSuccess,
      twilioApiFailure: item.twilioApiFailure,
      twilioDeliveryFailure: item.twilioDeliveryFailure,
      twilioFailure: item.twilioFailure,
      twilioFailureRate: item.twilioFailureRate,
      // Totals
      totalInitiated: item.totalInitiated,
      totalSuccess: item.totalSuccess,
      totalFailure: item.totalFailure,
      totalFailureRate: item.totalFailureRate
    }))

    const filename = `specific_tenant_dealer_metrics_${filters.tenantId}${
      filters.dealerId ? `_${filters.dealerId}` : ""
    }.csv`
    downloadCSV(dataForExport, filename)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          Specific Tenant/Dealer Metrics
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
            {loading ? "Loading..." : "Fetch Metrics"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>

      {metricsData && metricsData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                Metrics for Tenant: {metricsData[0].tenantId}
                {filters.dealerId && ` / Dealer: ${filters.dealerId}`}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Each metric group shows: Initiated, Success, API Failure,
                Delivery Failure, Total Failure, and Failure Rate
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
            <table
              className="min-w-full divide-y divide-gray-200"
              style={{ minWidth: "1800px" }}
            >
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dealer ID
                  </th>
                  <th
                    colSpan={6}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50"
                  >
                    Threads Metrics
                  </th>
                  <th
                    colSpan={6}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50"
                  >
                    Non-Threads Metrics
                  </th>
                  <th
                    colSpan={6}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50"
                  >
                    Twilio Metrics
                  </th>
                </tr>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Initiated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Success
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    API Failure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Delivery Failure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Total Failure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Failure Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    Initiated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    Success
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    API Failure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    Delivery Failure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    Total Failure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    Failure Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                    Initiated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                    Success
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                    API Failure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                    Delivery Failure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                    Total Failure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                    Failure Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metricsData.map((item, index) => (
                  <tr
                    key={`${item.tenantId}-${item.dealerId || "all"}-${index}`}
                    className={
                      item.dealerId === "TOTAL"
                        ? "bg-gray-100 font-semibold"
                        : "bg-white"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.tenantId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.dealerId || "All"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-blue-50">
                      {formatNumber(item.threadsInitiated || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-blue-50">
                      {formatNumber(item.threadsSuccess || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-blue-50">
                      <div className="flex items-center">
                        <span>{formatNumber(item.threadsApiFailure || 0)}</span>
                        {(item.threadsApiFailure || 0) > 0 && (
                          <button
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() =>
                              handleFailureCellClick(
                                FailureType.THREADS_API,
                                item
                              )
                            }
                          >
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
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-blue-50">
                      <div className="flex items-center">
                        <span>
                          {formatNumber(item.threadsDeliveryFailure || 0)}
                        </span>
                        {(item.threadsDeliveryFailure || 0) > 0 && (
                          <button
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() =>
                              handleFailureCellClick(
                                FailureType.THREADS_DELIVERY,
                                item
                              )
                            }
                          >
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
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-blue-50">
                      <div className="flex items-center">
                        <span>{formatNumber(item.threadsFailure || 0)}</span>
                        {(item.threadsFailure || 0) > 0 && (
                          <button
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() =>
                              handleFailureCellClick(
                                FailureType.THREADS_TOTAL,
                                item
                              )
                            }
                          >
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
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-blue-50">
                      {item.threadsFailureRate || "0%"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-green-50">
                      {formatNumber(item.nonThreadsInitiated || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-green-50">
                      {formatNumber(item.nonThreadsSuccess || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-green-50">
                      <div className="flex items-center">
                        <span>
                          {formatNumber(item.nonThreadsApiFailure || 0)}
                        </span>
                        {(item.nonThreadsApiFailure || 0) > 0 && (
                          <button
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() =>
                              handleFailureCellClick(
                                FailureType.NON_THREADS_API,
                                item
                              )
                            }
                          >
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
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-green-50">
                      <div className="flex items-center">
                        <span>
                          {formatNumber(item.nonThreadsDeliveryFailure || 0)}
                        </span>
                        {(item.nonThreadsDeliveryFailure || 0) > 0 && (
                          <button
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() =>
                              handleFailureCellClick(
                                FailureType.NON_THREADS_DELIVERY,
                                item
                              )
                            }
                          >
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
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-green-50">
                      <div className="flex items-center">
                        <span>{formatNumber(item.nonThreadsFailure || 0)}</span>
                        {(item.nonThreadsFailure || 0) > 0 && (
                          <button
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() =>
                              handleFailureCellClick(
                                FailureType.NON_THREADS_TOTAL,
                                item
                              )
                            }
                          >
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
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-green-50">
                      {item.nonThreadsFailureRate || "0%"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-purple-50">
                      {formatNumber(item.twilioInitiated || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-purple-50">
                      {formatNumber(item.twilioSuccess || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-purple-50">
                      <div className="flex items-center">
                        <span>{formatNumber(item.twilioApiFailure || 0)}</span>
                        {(item.twilioApiFailure || 0) > 0 && (
                          <button
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() =>
                              handleFailureCellClick(
                                FailureType.TWILIO_API,
                                item
                              )
                            }
                          >
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
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-purple-50">
                      <div className="flex items-center">
                        <span>
                          {formatNumber(item.twilioDeliveryFailure || 0)}
                        </span>
                        {(item.twilioDeliveryFailure || 0) > 0 && (
                          <button
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() =>
                              handleFailureCellClick(
                                FailureType.TWILIO_DELIVERY,
                                item
                              )
                            }
                          >
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
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-purple-50">
                      <div className="flex items-center">
                        <span>{formatNumber(item.twilioFailure || 0)}</span>
                        {(item.twilioFailure || 0) > 0 && (
                          <button
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() =>
                              handleFailureCellClick(
                                FailureType.TWILIO_TOTAL,
                                item
                              )
                            }
                          >
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
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-purple-50">
                      {item.twilioFailureRate || "0%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Failure Details Modal */}
      <FailureDetailsModal
        isOpen={isFailureModalOpen}
        onClose={() => setIsFailureModalOpen(false)}
        title={failureModalTitle}
        data={failureDetails}
        loading={failureDetailsLoading}
        error={failureDetailsError}
      />
    </div>
  )
}

export default SpecificTenantDealerTab
