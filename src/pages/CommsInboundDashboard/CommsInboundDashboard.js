import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"
import { getCurrentMonthRange } from "../../utils/dateUtils";
import {
  useMonthlyMetricsData,
  useTenantDealerMetricsData,
} from "../../hooks/useCommsInboundMetricsData";
import { useFailureDetails } from "../../hooks/useInboundFailureDetails";
import MetricsTable from "../../components/CommsInboundDashboard/MetricsTable";
import MetricsSummaryCard from "../../components/CommsInboundDashboard/MetricsSummaryCard";
import MetricsFilters from "../../components/CommsInboundDashboard/MetricsFilters";
import TabNavigation from "../../components/CommsInboundDashboard/TabNavigation";
import FailureDetailsModal from "../../components/CommsInboundDashboard/FailureDetailsModal";
import SpecificTenantDealerTab from "../../components/CommsInboundDashboard/SpecificTenantDealerTab";
import { FailureType } from "../../services/commsInboundFailureDetailsService";

export default function CommsInboundDashboardPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("tenant-dealer");

  // Failure details modal state
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [failureModalTitle, setFailureModalTitle] = useState("");

  // Use the failure details hook
  const {
    data: failureDetails,
    loading: failureDetailsLoading,
    error: failureDetailsError,
    fetchDetails: fetchFailureDetails,
    clearDetails: clearFailureDetails,
  } = useFailureDetails();

  // Get Current Month range for display
  const { startDate, endDate } = getCurrentMonthRange();

  // Use our custom hooks to fetch and manage dashboard data
  const {
    data: monthlyData,
    loading: monthlyLoading,
    error: monthlyError,
    filters: monthlyFilters,
    updateFilters: updateMonthlyFilters,
    clearFilters: clearMonthlyFilters,
    refetch: refetchMonthlyData,
    summaryMetrics: monthlySummaryMetrics,
  } = useMonthlyMetricsData();

  const {
    data: tenantDealerData,
    loading: tenantDealerLoading,
    error: tenantDealerError,
    filters: tenantDealerFilters,
    updateFilters: updateTenantDealerFilters,
    clearFilters: clearTenantDealerFilters,
    refetch: refetchTenantDealerData,
    summaryMetrics: tenantDealerSummaryMetrics,
  } = useTenantDealerMetricsData();

  // Check authentication on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("tekion-api-token");
      const userId = localStorage.getItem("userId");
      const tenantId = localStorage.getItem("tenantId");

      setIsAuthenticated(!!token && !!userId && !!tenantId);
    }
  }, []);

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle monthly filter changes
  const handleMonthlyFilterChange = (name, value) => {
    updateMonthlyFilters({ [name]: value });
  };

  // Handle tenant/dealer filter changes
  const handleTenantDealerFilterChange = (name, value) => {
    updateTenantDealerFilters({ [name]: value });
  };

  // Handle failure cell click
  const handleFailureCellClick = async (item, failureType) => {
    console.log("Failure cell clicked:", { item, failureType });

    // Determine the title based on failure type
    let title = "";
    switch (failureType) {
      case FailureType.THREADS_API:
        title = "Inbound Threads API Failures";
        break;
      case FailureType.THREADS_DELIVERY:
        title = "Inbound Threads Delivery Failures";
        break;
      case FailureType.THREADS_TOTAL:
        title = "Inbound Threads Total Failures";
        break;
      case FailureType.NON_THREADS_API:
        title = "Inbound Non-Threads API Failures";
        break;
      case FailureType.NON_THREADS_DELIVERY:
        title = "Inbound Non-Threads Delivery Failures";
        break;
      case FailureType.NON_THREADS_TOTAL:
        title = "Inbound Non-Threads Total Failures";
        break;
      case FailureType.TWILIO_API:
        title = "Inbound Twilio API Failures";
        break;
      case FailureType.TWILIO_DELIVERY:
        title = "Inbound Twilio Delivery Failures";
        break;
      case FailureType.TWILIO_TOTAL:
        title = "Inbound Twilio Total Failures";
        break;
    }

    // Set the modal title
    setFailureModalTitle(title);

    // Prepare filters based on the item and active tab
    const filters = {};

    if (activeTab === "monthly") {
      // For monthly view, use the current monthly filters for date range
      filters.startDate = monthlyFilters.startDate || startDate;
      filters.endDate = monthlyFilters.endDate || endDate;
      filters.startTime = monthlyFilters.startTime || "00:00";
      filters.endTime = monthlyFilters.endTime || "23:59";
    } else {
      // For tenant/dealer view, use the tenant and dealer IDs
      const tdItem = item;
      filters.tenantId = tdItem.tenantId;
      filters.dealerId = tdItem.dealerId;

      // Use the current filters for date range
      filters.startDate = tenantDealerFilters.startDate || startDate;
      filters.endDate = tenantDealerFilters.endDate || endDate;
      filters.startTime = tenantDealerFilters.startTime || "00:00";
      filters.endTime = tenantDealerFilters.endTime || "23:59";
    }

    // Fetch the failure details
    await fetchFailureDetails(failureType, filters);

    // Open the modal
    setIsFailureModalOpen(true);
  };

  // Define simplified monthly metrics table columns - only overall counts
  const monthlyColumns = [
    {
      key: "formattedMonth",
      header: "Month",
      align: "left",
    },
    {
      key: "totalInitiated",
      header: "Total Inbound Messages",
      render: (value) => formatNumber(value),
      align: "right",
      headerClassName: "bg-blue-50",
      cellClassName: "bg-blue-50",
    },
  ];

  // Define tenant/dealer metrics table columns - show provider-specific data based on filter
  const getTenantDealerColumns = () => {
    const currentProviderType = tenantDealerFilters.providerType || "GTC";

    let dataKey;
    let headerText;

    if (currentProviderType === "GTC") {
      dataKey = "threadsInitiated";
      headerText = "GTC Inbound Messages";
    } else if (currentProviderType === "TWILIO") {
      dataKey = "twilioInitiated";
      headerText = "Twilio Inbound Messages";
    } else {
      dataKey = "totalInitiated";
      headerText = "Total Inbound Messages";
    }

    return [
      {
        key: "tenantId",
        header: "Tenant ID",
        align: "left",
      },
      {
        key: "dealerId",
        header: "Dealer ID",
        align: "left",
      },
      {
        key: dataKey,
        header: headerText,
        render: (value) => formatNumber(value),
        align: "right",
        headerClassName: "bg-blue-50",
        cellClassName: "bg-blue-50",
      },
    ];
  };

  const tenantDealerColumns = getTenantDealerColumns();

  // Prepare summary metrics for display
  const summaryMetrics =
    activeTab === "monthly"
      ? monthlySummaryMetrics
      : tenantDealerSummaryMetrics;

  // Simple count-based metrics for monthly tab when provider filter is applied
  const getFilteredSummaryMetrics = () => {
    if (activeTab === "monthly") {
      const currentProviderType = monthlyFilters.providerType || "GTC";

      // Filter monthly data based on provider type and calculate totals
      let filteredTotal = 0;
      if (currentProviderType === "GTC") {
        filteredTotal = monthlyData.reduce(
          (sum, item) => sum + item.threadsInitiated,
          0
        );
        return [
          {
            label: "Total GTC Inbound Messages",
            value: formatNumber(filteredTotal),
          },
        ];
      } else if (currentProviderType === "TWILIO") {
        filteredTotal = monthlyData.reduce(
          (sum, item) => sum + item.twilioInitiated,
          0
        );
        return [
          {
            label: "Total Twilio Inbound Messages",
            value: formatNumber(filteredTotal),
          },
        ];
      } else {
        filteredTotal = monthlyData.reduce(
          (sum, item) => sum + item.totalInitiated,
          0
        );
        return [
          {
            label: "Total Inbound Messages (All Providers)",
            value: formatNumber(filteredTotal),
          },
        ];
      }
    }

    // For tenant-dealer tab, return only total events received (similar to monthly tab)
    if (activeTab === "tenant-dealer") {
      const currentProviderType = tenantDealerFilters.providerType || "GTC";

      // Filter tenant-dealer data based on provider type and calculate totals
      let filteredTotal = 0;
      if (currentProviderType === "GTC") {
        filteredTotal = tenantDealerData.reduce(
          (sum, item) => sum + item.threadsInitiated,
          0
        );
        return [
          {
            label: "Total GTC Events Received",
            value: formatNumber(filteredTotal),
          },
        ];
      } else if (currentProviderType === "TWILIO") {
        filteredTotal = tenantDealerData.reduce(
          (sum, item) => sum + item.twilioInitiated,
          0
        );
        return [
          {
            label: "Total Twilio Events Received",
            value: formatNumber(filteredTotal),
          },
        ];
      } else {
        filteredTotal = tenantDealerData.reduce(
          (sum, item) => sum + item.totalInitiated,
          0
        );
        return [
          {
            label: "Total Events Received (All Providers)",
            value: formatNumber(filteredTotal),
          },
        ];
      }
    }

    // For other tabs (if any), return only total count (no success/failure metrics for inbound flow)
    return [
      {
        label: "Total Events Received",
        value: formatNumber(summaryMetrics.totalThreadsInitiated),
      },
    ];
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Inbound Communication Metrics Dashboard (Current Month: {startDate} to{" "}
          {endDate})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={
              activeTab === "monthly"
                ? refetchMonthlyData
                : refetchTenantDealerData
            }
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={
              activeTab === "monthly" ? monthlyLoading : tenantDealerLoading
            }
          >
            {(activeTab === "monthly" && monthlyLoading) ||
            (activeTab === "tenant-dealer" && tenantDealerLoading)
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
              { id: "tenant-dealer", label: "Tenant & Dealer Inbound Metrics" },
              { id: "specific", label: "Specific Tenant/Dealer Inbound" },
              { id: "monthly", label: "Monthly Inbound Metrics" },
            ]}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId)}
          />

          {/* Filters - Only show for Monthly and Tenant/Dealer tabs */}
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
              showTenantDealerFilters={false}
            />
          )}

          {/* Summary Cards - Show summary cards only for monthly and tenant-dealer tabs */}
          {activeTab !== "specific" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeTab === "monthly" &&
              (!monthlyFilters.providerType ||
                monthlyFilters.providerType === "ALL") ? (
                // Show separate cards for each provider when ALL is selected
                <>
                  <MetricsSummaryCard
                    title="Inbound GTC Messages"
                    metrics={[
                      {
                        label: "Total GTC Messages",
                        value: formatNumber(
                          monthlyData.reduce(
                            (sum, item) => sum + item.threadsInitiated,
                            0
                          )
                        ),
                      },
                    ]}
                    className="border-l-4 border-blue-500"
                  />
                  <MetricsSummaryCard
                    title="Inbound Twilio Messages"
                    metrics={[
                      {
                        label: "Total Twilio Messages",
                        value: formatNumber(
                          monthlyData.reduce(
                            (sum, item) => sum + item.twilioInitiated,
                            0
                          )
                        ),
                      },
                    ]}
                    className="border-l-4 border-purple-500"
                  />
                  <MetricsSummaryCard
                    title="Total Inbound Messages"
                    metrics={[
                      {
                        label: "All Providers Combined",
                        value: formatNumber(
                          monthlyData.reduce(
                            (sum, item) => sum + item.totalInitiated,
                            0
                          )
                        ),
                      },
                    ]}
                    className="border-l-4 border-gray-500"
                  />
                </>
              ) : (
                // Show single card for specific provider or non-monthly tabs
                <MetricsSummaryCard
                  title={
                    activeTab === "monthly"
                      ? `Inbound ${monthlyFilters.providerType} Messages`
                      : activeTab === "tenant-dealer"
                      ? `Inbound ${
                          tenantDealerFilters.providerType || "GTC"
                        } Messages`
                      : "Inbound GTC Messages"
                  }
                  metrics={getFilteredSummaryMetrics()}
                  className="border-l-4 border-blue-500"
                />
              )}
            </div>
          ) : null}

          {/* Data Tables */}
          {activeTab === "monthly" ? (
            <MetricsTable
              data={monthlyData}
              columns={monthlyColumns}
              title="Overall Monthly Inbound Metrics"
              loading={monthlyLoading}
              emptyMessage="No monthly inbound metrics data available"
              exportFilename="monthly-inbound-metrics.csv"
            />
          ) : activeTab === "tenant-dealer" ? (
            <MetricsTable
              data={tenantDealerData}
              columns={tenantDealerColumns}
              title="Tenant & Dealer Inbound Metrics"
              loading={tenantDealerLoading}
              emptyMessage="No tenant/dealer inbound metrics data available"
              exportFilename="tenant-dealer-inbound-metrics.csv"
              onRowClick={(item, columnKey) => {
                // Determine which failure type based on the column key
                if (columnKey === "threadsFailure") {
                  handleFailureCellClick(item, FailureType.THREADS_API);
                } else if (columnKey === "nonThreadsFailure") {
                  handleFailureCellClick(item, FailureType.NON_THREADS_API);
                } else if (columnKey === "twilioFailure") {
                  handleFailureCellClick(item, FailureType.TWILIO_API);
                }
              }}
            />
          ) : (
            <SpecificTenantDealerTab />
          )}

          {/* Failure Details Modal */}
          <FailureDetailsModal
            isOpen={isFailureModalOpen}
            onClose={() => {
              setIsFailureModalOpen(false);
              clearFailureDetails();
            }}
            title={failureModalTitle}
            data={failureDetails}
            loading={failureDetailsLoading}
            error={failureDetailsError}
          />
        </div>
      )}
    </div>
  );
}
