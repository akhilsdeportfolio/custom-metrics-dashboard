import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"
import { getYearToDateRange } from "../../utils/dateUtils";
import { useNewDashboardData } from "../../hooks/useNewDashboardData";
import SummaryCard from "../../components/NewDashboard/SummaryCard";
import SimpleBarChart from "../../components/NewDashboard/SimpleBarChart";
import DataTable from "../../components/NewDashboard/DataTable";

export default function NewDashboardPage() {
  const [authInfo, setAuthInfo] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get Year to Date range for display
  const { startDate, endDate } = getYearToDateRange();

  // Use our custom hook to fetch and manage dashboard data
  const {
    data: dashboardData,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch: fetchDashboardData,
    summaryMetrics,
    chartData,
  } = useNewDashboardData();

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

  // Handle category filter change
  const handleCategoryFilterChange = (e) => {
    updateFilters({ category: e.target.value });
  };

  // Handle date range filter changes
  const handleDateRangeChange = (type, value) => {
    updateFilters({
      [type === "start" ? "startDate" : "endDate"]: value,
    });
  };

  // Define table columns
  const columns = [
    {
      key: "id",
      header: "ID",
      sortable: true,
      align: "left",
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      align: "left",
    },
    {
      key: "metric1",
      header: "Metric 1",
      sortable: true,
      align: "right",
      render: (value) => formatNumber(value),
    },
    {
      key: "metric2",
      header: "Metric 2",
      sortable: true,
      align: "right",
      render: (value) => formatNumber(value),
    },
    {
      key: "metric3",
      header: "Metric 3",
      sortable: true,
      align: "right",
      render: (value) => formatNumber(value),
    },
    {
      key: "timestamp",
      header: "Date",
      sortable: true,
      align: "left",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          New Metrics Dashboard (YTD: {startDate} to {endDate})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchDashboardData}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh Data"}
          </button>
          <Link
            href="/dashboard"
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
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error Loading Data</p>
          <p>{error.message}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={filters.category || ""}
                  onChange={handleCategoryFilterChange}
                  placeholder="Filter by category..."
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    handleDateRangeChange("start", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => handleDateRangeChange("end", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Dashboard Content */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                  title="Total Metric 1"
                  value={formatNumber(summaryMetrics.totalMetric1)}
                  change={summaryMetrics.growthMetric1}
                  color="blue"
                />
                <SummaryCard
                  title="Total Metric 2"
                  value={formatNumber(summaryMetrics.totalMetric2)}
                  change={summaryMetrics.growthMetric2}
                  color="green"
                />
                <SummaryCard
                  title="Average Metric 3"
                  value={summaryMetrics.avgMetric3.toFixed(1)}
                  change={summaryMetrics.growthMetric3}
                  color="purple"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SimpleBarChart
                  data={chartData.metric1ChartData}
                  title="Metric 1 by Category"
                  // Blue
                  color="#3B82F6"
                  height={200}
                />
                <SimpleBarChart
                  data={chartData.metric2ChartData}
                  title="Metric 2 by Category"
                  // Green
                  color="#10B981"
                  height={200}
                />
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Detailed Data</h2>
                  <DataTable
                    data={dashboardData}
                    columns={columns}
                    keyExtractor={(item) => item.id}
                    initialSortColumn="timestamp"
                    initialSortDirection="desc"
                    pageSize={10}
                    onRowClick={(item) => console.log("Clicked row:", item)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
