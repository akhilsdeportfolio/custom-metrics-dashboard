import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMetricsData } from "../../hooks/useMetricsData";
import { useMonthlySummaryData } from "../../hooks/useMonthlySummaryData";
import { getYearToDateRange } from "../../utils/dateUtils";
import TabNavigation from "../../components/Dashboard/TabNavigation";
import MonthlyMetricsTab from "../../components/Dashboard/MonthlyMetricsTab";
import TenantDealerMetricsTab from "../../components/Dashboard/TenantDealerMetricsTab";
import SpecificTenantDealerTab from "../../components/Dashboard/SpecificTenantDealerTab";

export default function DashboardPage() {
  const [authInfo, setAuthInfo] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("monthly");

  // Sorting state for Monthly Summary table
  const [monthlySortColumn, setMonthlySortColumn] = useState("month");
  const [monthlySortDirection, setMonthlySortDirection] = useState("desc");

  // Sorting state for Tenant/Dealer table
  const [tenantSortColumn, setTenantSortColumn] = useState(
    "threadConnectorTotal"
  );
  const [tenantSortDirection, setTenantSortDirection] = useState("desc");

  // Search state for Tenant/Dealer table
  const [tenantIdSearch, setTenantIdSearch] = useState("");
  const [dealerIdSearch, setDealerIdSearch] = useState("");

  // Get Year to Date range for display
  const { startDate, endDate } = getYearToDateRange();

  // Fetch tenant/dealer metrics (without month granularity)
  const {
    processedData,
    loading: tenantLoading,
    error: tenantError,
    refetch: tenantRefetch,
  } = useMetricsData();

  // Fetch monthly summary metrics
  const {
    processedData: monthlyData,
    loading: monthlyLoading,
    error: monthlyError,
    refetch: monthlyRefetch,
  } = useMonthlySummaryData();

  // Check authentication on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("tekion-api-token");
      const userId = localStorage.getItem("userId");
      const tenantId = localStorage.getItem("tenantId");
      const tenantName = localStorage.getItem("tenantName");
      const dealerId = localStorage.getItem("dealerId");
      const roleId = localStorage.getItem("roleId");

      const info = {
        "API Token": token,
        "User ID": userId,
        "Tenant ID": tenantId,
        "Tenant Name": tenantName,
        "Dealer ID": dealerId,
        "Role ID": roleId,
      };

      setAuthInfo(info);
      setIsAuthenticated(!!token && !!userId && !!tenantId);
    }
  }, []);

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle sorting for Monthly Summary table
  const handleMonthlySortClick = (column) => {
    if (monthlySortColumn === column) {
      // Toggle direction if same column is clicked
      setMonthlySortDirection(monthlySortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to descending
      setMonthlySortColumn(column);
      setMonthlySortDirection("desc");
    }
  };

  // Handle sorting for Tenant/Dealer table
  const handleTenantSortClick = (column) => {
    if (tenantSortColumn === column) {
      // Toggle direction if same column is clicked
      setTenantSortDirection(tenantSortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to descending
      setTenantSortColumn(column);
      setTenantSortDirection("desc");
    }
  };

  // Handle search input changes
  const handleTenantIdSearchChange = (e) => {
    setTenantIdSearch(e.target.value);
  };

  const handleDealerIdSearchChange = (e) => {
    setDealerIdSearch(e.target.value);
  };

  // Clear search inputs
  const clearSearchInputs = () => {
    setTenantIdSearch("");
    setDealerIdSearch("");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Threads Metrics Dashboard (YTD: {startDate} to {endDate})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              tenantRefetch();
              monthlyRefetch();
            }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={tenantLoading || monthlyLoading}
          >
            {tenantLoading || monthlyLoading ? "Loading..." : "Refresh Data"}
          </button>

          <Link
            to="/comms-dashboard"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Communication Metrics Outbound
          </Link>
          <Link
            to="/comms-inbound-dashboard"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Communication Metrics Inbound
          </Link>
          <Link
            to="/command-centre-dashboard"
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            📊 Command Centre
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
      ) : tenantError || monthlyError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error Loading Data</p>
          <p>{tenantError?.message || monthlyError?.message}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Authentication Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(authInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b pb-2">
                  <span className="font-medium">{key}:</span>
                  <span className={value ? "text-green-600" : "text-red-600"}>
                    {value
                      ? typeof value === "string" && value.length > 10
                        ? value.substring(0, 10) + "..."
                        : value
                      : "Not set"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {tenantLoading || monthlyLoading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading all pages of data...</p>
              <p className="text-sm text-gray-500 mt-2">
                This may take a moment as we fetch and process all available
                data.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Tabs */}
              <TabNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "monthly" && (
                  <MonthlyMetricsTab
                    monthlyData={monthlyData}
                    monthlySortColumn={monthlySortColumn}
                    monthlySortDirection={monthlySortDirection}
                    handleMonthlySortClick={handleMonthlySortClick}
                    formatNumber={formatNumber}
                  />
                )}

                {activeTab === "tenant" && (
                  <TenantDealerMetricsTab
                    tenantData={processedData}
                    tenantSortColumn={tenantSortColumn}
                    tenantSortDirection={tenantSortDirection}
                    handleTenantSortClick={handleTenantSortClick}
                    formatNumber={formatNumber}
                    tenantIdSearch={tenantIdSearch}
                    dealerIdSearch={dealerIdSearch}
                    handleTenantIdSearchChange={handleTenantIdSearchChange}
                    handleDealerIdSearchChange={handleDealerIdSearchChange}
                    clearSearchInputs={clearSearchInputs}
                  />
                )}

                {activeTab === "specific" && (
                  <SpecificTenantDealerTab formatNumber={formatNumber} />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
