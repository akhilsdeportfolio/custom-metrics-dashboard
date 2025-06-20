import React, { useState, useEffect } from "react"
import {Link} from "react-router-dom"
import { getCurrentMonthRange } from "../../utils/dateUtils"
import {
  useMonthlyMetricsData,
  useTenantDealerMetricsData
} from "../../hooks/useCommsMetricsData"
import { useFailureDetails } from "../../hooks/useFailureDetails"
import MetricsTable from "../../components/CommsDashboard/MetricsTable"
import MetricsSummaryCard from "../../components/CommsDashboard/MetricsSummaryCard"
import MetricsFilters from "../../components/CommsDashboard/MetricsFilters"
import TabNavigation from "../../components/CommsDashboard/TabNavigation"
import FailureDetailsModal from "../../components/CommsDashboard/FailureDetailsModal"
import SpecificTenantDealerTab from "../../components/CommsDashboard/SpecificTenantDealerTab"
import { FailureType } from "../../services/commsFailureDetailsService"
import {
  createThreadsSummaryMetrics,
  createNonThreadsSummaryMetrics,
  createTwilioSummaryMetrics
} from "../../utils/summaryMetricsHelpers"
import { formatNumber, FailureCellWithDrillDown } from "../../utils/columnHelpers"

export default function CommsDashboardPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState("monthly")

  // Failure details modal state
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false)
  const [failureModalTitle, setFailureModalTitle] = useState("")

  // Use the failure details hook
  const {
    data: failureDetails,
    loading: failureDetailsLoading,
    error: failureDetailsError,
    fetchDetails: fetchFailureDetails,
    clearDetails: clearFailureDetails
  } = useFailureDetails()

  // Get Current Month range for display
  const { startDate, endDate } = getCurrentMonthRange()

  // Use our custom hooks to fetch and manage dashboard data
  // Only fetch monthly data when on monthly tab
  const {
    data: monthlyData,
    loading: monthlyLoading,
    error: monthlyError,
    filters: monthlyFilters,
    updateFilters: updateMonthlyFilters,
    clearFilters: clearMonthlyFilters,
    refetch: refetchMonthlyData,
    summaryMetrics: monthlySummaryMetrics
  } = useMonthlyMetricsData(undefined, activeTab === "monthly")

  // Only fetch tenant/dealer data when on tenant-dealer or twilio tabs
  const {
    data: tenantDealerData,
    loading: tenantDealerLoading,
    error: tenantDealerError,
    filters: tenantDealerFilters,
    updateFilters: updateTenantDealerFilters,
    clearFilters: clearTenantDealerFilters,
    refetch: refetchTenantDealerData,
    summaryMetrics: tenantDealerSummaryMetrics
  } = useTenantDealerMetricsData(
    undefined,
    activeTab === "tenant-dealer" || activeTab === "twilio"
  )

  // Check authentication on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("tekion-api-token")
      const userId = localStorage.getItem("userId")
      const tenantId = localStorage.getItem("tenantId")

      setIsAuthenticated(!!token && !!userId && !!tenantId)
    }
  }, [])

  // Handle monthly filter changes
  const handleMonthlyFilterChange = (name, value) => {
    updateMonthlyFilters({ [name]: value })
  }

  // Handle tenant/dealer filter changes
  const handleTenantDealerFilterChange = (name, value) => {
    updateTenantDealerFilters({ [name]: value })
  }

  // Handle failure cell click
  const handleFailureCellClick = async (item, failureType) => {
    console.log("Failure cell clicked:", { item, failureType })

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
      case FailureType.THREADS_CONTROLLABLE:
        title = "Threads Controllable Failures"
        break
      case FailureType.THREADS_NON_CONTROLLABLE:
        title = "Threads Non-Controllable Failures"
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

    // Set the modal title
    setFailureModalTitle(title)

    // Prepare filters based on the item and active tab
    const filters = {}

    if (activeTab === "monthly") {
      // For monthly view, use the current monthly filters for date range
      filters.startDate = monthlyFilters.startDate || startDate
      filters.endDate = monthlyFilters.endDate || endDate
      filters.startTime = monthlyFilters.startTime || "00:00"
      filters.endTime = monthlyFilters.endTime || "23:59"
    } else {
      // For tenant/dealer view, use the tenant and dealer IDs
      const tdItem = item
      filters.tenantId = tdItem.tenantId
      filters.dealerId = tdItem.dealerId

      // Use the current filters for date range
      filters.startDate = tenantDealerFilters.startDate || startDate
      filters.endDate = tenantDealerFilters.endDate || endDate
      filters.startTime = tenantDealerFilters.startTime || "00:00"
      filters.endTime = tenantDealerFilters.endTime || "23:59"
    }

    // Fetch the failure details
    await fetchFailureDetails(failureType, filters)

    // Open the modal
    setIsFailureModalOpen(true)
  }

  // Define monthly metrics table columns
  const monthlyColumns = [
    {
      key: "formattedMonth",
      header: "Month",
      align: "left"
    },
    {
      key: "threadsInitiated",
      header: "Threads Initiated",
      render: value => formatNumber(value),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsSuccess",
      header: "Threads Success",
      render: value => formatNumber(value),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsApiFailure",
      header: "Threads API Failure",
      render: (value, item) => (
        <FailureCellWithDrillDown
          value={value}
          onDrillDown={() =>
            handleFailureCellClick(item, FailureType.THREADS_API)
          }
        />
      ),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsDeliveryFailure",
      header: "Threads Delivery Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.THREADS_DELIVERY)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsControllableError",
      header: "Threads Controllable Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.THREADS_CONTROLLABLE)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsNonControllableError",
      header: "Threads Non-Controllable Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(
                  item,
                  FailureType.THREADS_NON_CONTROLLABLE
                )
              }}
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
      ),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsFailure",
      header: "Threads Total Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.THREADS_TOTAL)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsFailureRate",
      header: "Threads Failure Rate",
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "nonThreadsInitiated",
      header: "Non-Threads Initiated",
      render: value => formatNumber(value),
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    },
    {
      key: "nonThreadsSuccess",
      header: "Non-Threads Success",
      render: value => formatNumber(value),
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    },
    {
      key: "nonThreadsApiFailure",
      header: "Non-Threads API Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.NON_THREADS_API)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    },
    {
      key: "nonThreadsDeliveryFailure",
      header: "Non-Threads Delivery Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.NON_THREADS_DELIVERY)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    },
    {
      key: "nonThreadsFailure",
      header: "Non-Threads Total Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.NON_THREADS_TOTAL)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    },
    {
      key: "nonThreadsFailureRate",
      header: "Non-Threads Failure Rate",
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    }
  ]

  // Define tenant/dealer metrics table columns
  const tenantDealerColumns = [
    {
      key: "tenantId",
      header: "Tenant ID",
      align: "left"
    },
    {
      key: "dealerId",
      header: "Dealer ID",
      align: "left"
    },
    {
      key: "threadsInitiated",
      header: "Threads Initiated",
      render: value => formatNumber(value),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsSuccess",
      header: "Threads Success",
      render: value => formatNumber(value),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsApiFailure",
      header: "Threads API Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.THREADS_API)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsDeliveryFailure",
      header: "Threads Delivery Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.THREADS_DELIVERY)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsControllableError",
      header: "Threads Controllable Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.THREADS_CONTROLLABLE)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsNonControllableError",
      header: "Threads Non-Controllable Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(
                  item,
                  FailureType.THREADS_NON_CONTROLLABLE
                )
              }}
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
      ),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsFailure",
      header: "Threads Total Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.THREADS_TOTAL)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "threadsFailureRate",
      header: "Threads Failure Rate",
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50"
    },
    {
      key: "nonThreadsInitiated",
      header: "Non-Threads Initiated",
      render: value => formatNumber(value),
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    },
    {
      key: "nonThreadsSuccess",
      header: "Non-Threads Success",
      render: value => formatNumber(value),
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    },
    {
      key: "nonThreadsApiFailure",
      header: "Non-Threads API Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.NON_THREADS_API)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    },
    {
      key: "nonThreadsDeliveryFailure",
      header: "Non-Threads Delivery Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.NON_THREADS_DELIVERY)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    },
    {
      key: "nonThreadsFailure",
      header: "Non-Threads Total Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.NON_THREADS_TOTAL)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    },
    {
      key: "nonThreadsFailureRate",
      header: "Non-Threads Failure Rate",
      align: "right",
      headerClassName: "bg-green-50",
      cellClassName: "bg-green-50"
    }
  ]

  // Define Twilio-only table columns
  const twilioColumns = [
    {
      key: "tenantId",
      header: "Tenant ID",
      align: "left"
    },
    {
      key: "dealerId",
      header: "Dealer ID",
      align: "left"
    },
    {
      key: "twilioInitiated",
      header: "Twilio Initiated",
      render: value => formatNumber(value),
      align: "right",
      headerClassName: "bg-purple-50",
      cellClassName: "bg-purple-50"
    },
    {
      key: "twilioSuccess",
      header: "Twilio Success",
      render: value => formatNumber(value),
      align: "right",
      headerClassName: "bg-purple-50",
      cellClassName: "bg-purple-50"
    },
    {
      key: "twilioApiFailure",
      header: "Twilio API Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.TWILIO_API)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-purple-50",
      cellClassName: "bg-purple-50",
      isClickable: true
    },
    {
      key: "twilioDeliveryFailure",
      header: "Twilio Delivery Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.TWILIO_DELIVERY)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-purple-50",
      cellClassName: "bg-purple-50",
      isClickable: true
    },
    {
      key: "twilioFailure",
      header: "Twilio Total Failure",
      render: (value, item) => (
        <div className="flex items-center justify-end">
          <span>{formatNumber(value)}</span>
          {value > 0 && (
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={e => {
                e.stopPropagation()
                handleFailureCellClick(item, FailureType.TWILIO_TOTAL)
              }}
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
      ),
      align: "right",
      headerClassName: "bg-purple-50",
      cellClassName: "bg-purple-50",
      isClickable: true
    },
    {
      key: "twilioFailureRate",
      header: "Twilio Failure Rate",
      align: "right",
      headerClassName: "bg-purple-50",
      cellClassName: "bg-purple-50"
    }
  ]

  // Prepare summary metrics for display
  const summaryMetrics =
    activeTab === "monthly" ? monthlySummaryMetrics : tenantDealerSummaryMetrics

  const threadsSummaryMetrics = createThreadsSummaryMetrics(summaryMetrics)
  const nonThreadsSummaryMetrics = createNonThreadsSummaryMetrics(
    summaryMetrics
  )
  const twilioSummaryMetrics = createTwilioSummaryMetrics(summaryMetrics)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Communication Metrics Dashboard (Current Month: {startDate} to{" "}
          {endDate})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (activeTab === "monthly") {
                refetchMonthlyData()
              } else if (
                activeTab === "tenant-dealer" ||
                activeTab === "twilio"
              ) {
                refetchTenantDealerData()
              }
            }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={
              (activeTab === "monthly" && monthlyLoading) ||
              ((activeTab === "tenant-dealer" || activeTab === "twilio") &&
                tenantDealerLoading)
            }
          >
            {(activeTab === "monthly" && monthlyLoading) ||
            ((activeTab === "tenant-dealer" || activeTab === "twilio") &&
              tenantDealerLoading)
              ? "Loading..."
              : "Refresh Data"}
          </button>
          <Link
            to="/dashboard"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Main Dashboard
          </Link>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Authentication Required</p>
          <p>
            Please return to the home page to enter your authentication details.
          </p>
        </div>
      ) : (activeTab === "monthly" && monthlyError) ||
        (activeTab === "tenant-dealer" && tenantDealerError) ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error Loading Data</p>
          <p>
            {activeTab === "monthly"
              ? monthlyError?.message
              : tenantDealerError?.message}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <TabNavigation
            tabs={[
              { id: "monthly", label: "Monthly Metrics" },
              { id: "tenant-dealer", label: "Tenant & Dealer Metrics" },
              { id: "specific", label: "Specific Tenant/Dealer" },
              { id: "twilio", label: "Twilio Metrics" }
            ]}
            activeTab={activeTab}
            onTabChange={tabId => setActiveTab(tabId)}
          />

          {/* Filters - Show for Monthly, Tenant/Dealer, and Twilio tabs */}
          {activeTab !== "specific" && (
            <MetricsFilters
              filters={
                activeTab === "monthly" ? monthlyFilters : tenantDealerFilters
              }
              onFilterChange={
                activeTab === "monthly"
                  ? handleMonthlyFilterChange
                  : handleTenantDealerFilterChange
              }
              onClearFilters={
                activeTab === "monthly"
                  ? clearMonthlyFilters
                  : clearTenantDealerFilters
              }
              showTenantDealerFilters={
                activeTab === "tenant-dealer" || activeTab === "twilio"
              }
            />
          )}

          {/* Summary Cards - Show different cards based on active tab */}
          {activeTab === "twilio" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricsSummaryCard
                title="Twilio - Non CRM"
                metrics={twilioSummaryMetrics}
                className="border-l-4 border-purple-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricsSummaryCard
                title="GTC - CRM Threads"
                metrics={threadsSummaryMetrics}
                className="border-l-4 border-blue-500"
              />
              <MetricsSummaryCard
                title="GTC - CRM Non-Threads"
                metrics={nonThreadsSummaryMetrics}
                className="border-l-4 border-green-500"
              />
            </div>
          )}

          {/* Data Tables */}
          {activeTab === "monthly" ? (
            <MetricsTable
              data={monthlyData}
              columns={monthlyColumns}
              title="Monthly Metrics"
              loading={monthlyLoading}
              emptyMessage="No monthly metrics data available"
              exportFilename="monthly-metrics.csv"
              onRowClick={(item, columnKey) => {
                // Determine which failure type based on the column key
                if (columnKey === "threadsFailure") {
                  handleFailureCellClick(item, FailureType.THREADS_API)
                } else if (columnKey === "threadsControllableError") {
                  handleFailureCellClick(item, FailureType.THREADS_CONTROLLABLE)
                } else if (columnKey === "threadsNonControllableError") {
                  handleFailureCellClick(
                    item,
                    FailureType.THREADS_NON_CONTROLLABLE
                  )
                } else if (columnKey === "nonThreadsFailure") {
                  handleFailureCellClick(item, FailureType.NON_THREADS_API)
                } else if (columnKey === "twilioFailure") {
                  handleFailureCellClick(item, FailureType.TWILIO_API)
                }
              }}
            />
          ) : activeTab === "tenant-dealer" ? (
            <MetricsTable
              data={tenantDealerData}
              columns={tenantDealerColumns}
              title="Tenant & Dealer Metrics"
              loading={tenantDealerLoading}
              emptyMessage="No tenant/dealer metrics data available"
              exportFilename="tenant-dealer-metrics.csv"
              onRowClick={(item, columnKey) => {
                // Determine which failure type based on the column key
                if (columnKey === "threadsFailure") {
                  handleFailureCellClick(item, FailureType.THREADS_API)
                } else if (columnKey === "threadsControllableError") {
                  handleFailureCellClick(item, FailureType.THREADS_CONTROLLABLE)
                } else if (columnKey === "threadsNonControllableError") {
                  handleFailureCellClick(
                    item,
                    FailureType.THREADS_NON_CONTROLLABLE
                  )
                } else if (columnKey === "nonThreadsFailure") {
                  handleFailureCellClick(item, FailureType.NON_THREADS_API)
                } else if (columnKey === "twilioFailure") {
                  handleFailureCellClick(item, FailureType.TWILIO_API)
                }
              }}
            />
          ) : activeTab === "twilio" ? (
            <MetricsTable
              data={tenantDealerData}
              columns={twilioColumns}
              title="Twilio Metrics"
              loading={tenantDealerLoading}
              emptyMessage="No Twilio metrics data available"
              exportFilename="twilio-metrics.csv"
              onRowClick={(item, columnKey) => {
                // Determine which failure type based on the column key
                if (columnKey === "twilioApiFailure") {
                  handleFailureCellClick(item, FailureType.TWILIO_API)
                } else if (columnKey === "twilioDeliveryFailure") {
                  handleFailureCellClick(item, FailureType.TWILIO_DELIVERY)
                } else if (columnKey === "twilioFailure") {
                  handleFailureCellClick(item, FailureType.TWILIO_TOTAL)
                }
              }}
            />
          ) : (
            <SpecificTenantDealerTab formatNumber={formatNumber} />
          )}

          {/* Failure Details Modal */}
          <FailureDetailsModal
            isOpen={isFailureModalOpen}
            onClose={() => {
              setIsFailureModalOpen(false)
              clearFailureDetails()
            }}
            title={failureModalTitle}
            data={failureDetails}
            loading={failureDetailsLoading}
            error={failureDetailsError}
          />
        </div>
      )}
    </div>
  )
}
