import React, { useState } from "react";
import { downloadCSV } from "../../../utils/csvExport";
import FailureDetailsModal from "../FailureDetailsModal";
import {
  fetchAPIFailureDetails,
  fetchDeliveryFailureDetails,
  fetchThreadsFailureDetails,
} from "../../../services/failureDetailsService";

const TenantDealerMetricsTab = ({
  tenantData,
  tenantSortColumn,
  tenantSortDirection,
  handleTenantSortClick,
  formatNumber,
  tenantIdSearch,
  dealerIdSearch,
  handleTenantIdSearchChange,
  handleDealerIdSearchChange,
  clearSearchInputs,
}) => {
  // State for failure details modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [failureType, setFailureType] = useState("API");
  const [failureDetails, setFailureDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState("");

  // Function to open the API failures modal
  const handleViewAPIFailures = async (tenantId, dealerId) => {
    try {
      setIsLoading(true);
      setFailureType("API");

      // Set title based on tenant/dealer selection
      let title = "API Failures";
      if (tenantId) {
        title += ` for Tenant ${tenantId}`;
        if (dealerId) {
          title += ` / Dealer ${dealerId}`;
        }
      }

      setModalTitle(title);

      // Fetch API failure details with tenant and dealer filters
      const details = await fetchAPIFailureDetails(
        undefined,
        tenantId,
        dealerId
      );
      setFailureDetails(details);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching API failure details:", error);
      alert("Failed to load API failure details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to open the delivery failures modal
  const handleViewDeliveryFailures = async (tenantId, dealerId) => {
    try {
      setIsLoading(true);
      setFailureType("Delivery");

      // Set title based on tenant/dealer selection
      let title = "Delivery Failures";
      if (tenantId) {
        title += ` for Tenant ${tenantId}`;
        if (dealerId) {
          title += ` / Dealer ${dealerId}`;
        }
      }

      setModalTitle(title);

      // Fetch delivery failure details with tenant and dealer filters
      const details = await fetchDeliveryFailureDetails(
        undefined,
        tenantId,
        dealerId
      );
      setFailureDetails(details);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching delivery failure details:", error);
      alert("Failed to load delivery failure details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to open the Threads failures modal
  const handleViewThreadsFailures = async (tenantId, dealerId) => {
    try {
      setIsLoading(true);
      setFailureType("Threads");

      // Set title based on tenant/dealer selection
      let title = "Threads Failures";
      if (tenantId) {
        title += ` for Tenant ${tenantId}`;
        if (dealerId) {
          title += ` / Dealer ${dealerId}`;
        }
      }

      setModalTitle(title);

      // Fetch Threads failure details with tenant and dealer filters
      const details = await fetchThreadsFailureDetails(
        undefined,
        tenantId,
        dealerId
      );
      setFailureDetails(details);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching Threads failure details:", error);
      alert("Failed to load Threads failure details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  // Filter and sort tenant data
  const filteredAndSortedTenantData = tenantData
    .filter((item) => {
      // Apply search filters
      const tenantIdMatch =
        tenantIdSearch === "" ||
        String(item.tenantId)
          .toLowerCase()
          .includes(tenantIdSearch.toLowerCase());
      const dealerIdMatch =
        dealerIdSearch === "" ||
        String(item.dealerId)
          .toLowerCase()
          .includes(dealerIdSearch.toLowerCase());
      return tenantIdMatch && dealerIdMatch;
    })
    .sort((a, b) => {
      if (tenantSortColumn === "tenantId" || tenantSortColumn === "dealerId") {
        // Sort by string columns
        const aValue = String(a[tenantSortColumn]);
        const bValue = String(b[tenantSortColumn]);
        return tenantSortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (tenantSortColumn === "threadConnectorFailureRate") {
        // Sort by failure rate (remove % sign and convert to number)
        const aValue = parseFloat(
          String(a.threadConnectorFailureRate).replace("%", "")
        );
        const bValue = parseFloat(
          String(b.threadConnectorFailureRate).replace("%", "")
        );
        return tenantSortDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;
      } else {
        // Sort by other numeric columns
        const aValue = a[tenantSortColumn];
        const bValue = b[tenantSortColumn];
        return tenantSortDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
    });

  // Calculate additional metrics for each tenant/dealer
  const enhancedTenantData = filteredAndSortedTenantData.map((item) => {
    const nonThreadsTotal = item.tmsInitiated + item.gtcInitiated;
    const totalNonThreadsFailure = item.apiFailures + item.deliveryFailures;
    const nonThreadsSuccess = nonThreadsTotal - totalNonThreadsFailure;
    const nonThreadsFailureRate =
      nonThreadsTotal > 0
        ? ((totalNonThreadsFailure / nonThreadsTotal) * 100).toFixed(2) + "%"
        : "0%";
    const apiFailureRate =
      nonThreadsTotal > 0
        ? ((item.apiFailures / nonThreadsTotal) * 100).toFixed(2) + "%"
        : "0%";
    const deliveryFailureRate =
      nonThreadsTotal > 0
        ? ((item.deliveryFailures / nonThreadsTotal) * 100).toFixed(2) + "%"
        : "0%";

    return {
      ...item,
      nonThreadsTotal,
      nonThreadsSuccess,
      totalNonThreadsFailure,
      nonThreadsFailureRate,
      apiFailureRate,
      deliveryFailureRate,
    };
  });

  // Function to handle CSV export
  const handleExportCSV = () => {
    // Create a simplified version of the data for export
    const exportData = enhancedTenantData.map((item) => ({
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
      deliveryFailureRate: item.deliveryFailureRate,
    }));

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
      deliveryFailureRate: "Delivery Failure Rate",
    };

    // Download the CSV
    downloadCSV(exportData, "tenant-dealer-metrics.csv", headers);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Tenant and Dealer Metrics (Overall)
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {enhancedTenantData.length} records{" "}
            {tenantIdSearch || dealerIdSearch ? "found" : "total"}
          </span>
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
      </div>

      {/* Search inputs */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="tenantIdSearch"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search by Tenant ID
          </label>
          <input
            type="text"
            id="tenantIdSearch"
            value={tenantIdSearch}
            onChange={handleTenantIdSearchChange}
            placeholder="Enter Tenant ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="dealerIdSearch"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search by Dealer ID
          </label>
          <input
            type="text"
            id="dealerIdSearch"
            value={dealerIdSearch}
            onChange={handleDealerIdSearchChange}
            placeholder="Enter Dealer ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={clearSearchInputs}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none"
          >
            Clear
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
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200"
                onClick={() => handleTenantSortClick("tenantId")}
              >
                Tenant ID{" "}
                {tenantSortColumn === "tenantId" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200"
                onClick={() => handleTenantSortClick("dealerId")}
              >
                Dealer ID{" "}
                {tenantSortColumn === "dealerId" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-blue-50"
                onClick={() => handleTenantSortClick("threadConnectorTotal")}
              >
                Total{" "}
                {tenantSortColumn === "threadConnectorTotal" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-blue-50"
                onClick={() => handleTenantSortClick("threadConnectorSuccess")}
              >
                Success{" "}
                {tenantSortColumn === "threadConnectorSuccess" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-blue-50"
                onClick={() => handleTenantSortClick("threadConnectorFailure")}
              >
                Failure{" "}
                {tenantSortColumn === "threadConnectorFailure" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-blue-50"
                onClick={() =>
                  handleTenantSortClick("threadConnectorFailureRate")
                }
              >
                Failure Rate{" "}
                {tenantSortColumn === "threadConnectorFailureRate" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleTenantSortClick("tmsInitiated")}
              >
                TMS{" "}
                {tenantSortColumn === "tmsInitiated" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleTenantSortClick("gtcInitiated")}
              >
                GTC{" "}
                {tenantSortColumn === "gtcInitiated" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleTenantSortClick("nonThreadsTotal")}
              >
                Total{" "}
                {tenantSortColumn === "nonThreadsTotal" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleTenantSortClick("nonThreadsSuccess")}
              >
                Success{" "}
                {tenantSortColumn === "nonThreadsSuccess" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleTenantSortClick("totalNonThreadsFailure")}
              >
                Failure{" "}
                {tenantSortColumn === "totalNonThreadsFailure" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleTenantSortClick("nonThreadsFailureRate")}
              >
                Failure Rate{" "}
                {tenantSortColumn === "nonThreadsFailureRate" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleTenantSortClick("apiFailures")}
              >
                API Failures{" "}
                {tenantSortColumn === "apiFailures" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleTenantSortClick("apiFailureRate")}
              >
                API Rate{" "}
                {tenantSortColumn === "apiFailureRate" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleTenantSortClick("deliveryFailures")}
              >
                Delivery Failures{" "}
                {tenantSortColumn === "deliveryFailures" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleTenantSortClick("deliveryFailureRate")}
              >
                Delivery Rate{" "}
                {tenantSortColumn === "deliveryFailureRate" &&
                  (tenantSortDirection === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {enhancedTenantData.map((item, index) => (
              <tr
                key={`${item.tenantId}-${item.dealerId}-${index}`}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="py-2 px-4 border-b">{item.tenantId}</td>
                <td className="py-2 px-4 border-b">{item.dealerId}</td>
                <td className="py-2 px-4 border-b bg-blue-50">
                  {formatNumber(item.threadConnectorTotal)}
                </td>
                <td className="py-2 px-4 border-b bg-blue-50">
                  {formatNumber(item.threadConnectorSuccess)}
                </td>
                <td className="py-2 px-4 border-b bg-blue-50">
                  <button
                    onClick={() =>
                      handleViewThreadsFailures(item.tenantId, item.dealerId)
                    }
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {formatNumber(item.threadConnectorFailure)}
                  </button>
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
                  <button
                    onClick={() =>
                      handleViewAPIFailures(item.tenantId, item.dealerId)
                    }
                    className="text-blue-600 hover:text-blue-800 hover:underline mr-2"
                  >
                    {formatNumber(item.apiFailures)}
                  </button>
                  +
                  <button
                    onClick={() =>
                      handleViewDeliveryFailures(item.tenantId, item.dealerId)
                    }
                    className="text-blue-600 hover:text-blue-800 hover:underline ml-2"
                  >
                    {formatNumber(item.deliveryFailures)}
                  </button>
                  = {formatNumber(item.totalNonThreadsFailure)}
                </td>
                <td className="py-2 px-4 border-b bg-green-50">
                  {item.nonThreadsFailureRate}
                </td>
                <td className="py-2 px-4 border-b bg-green-50">
                  <button
                    onClick={() =>
                      handleViewAPIFailures(item.tenantId, item.dealerId)
                    }
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {formatNumber(item.apiFailures)}
                  </button>
                </td>
                <td className="py-2 px-4 border-b bg-green-50">
                  {item.apiFailureRate}
                </td>
                <td className="py-2 px-4 border-b bg-green-50">
                  <button
                    onClick={() =>
                      handleViewDeliveryFailures(item.tenantId, item.dealerId)
                    }
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {formatNumber(item.deliveryFailures)}
                  </button>
                </td>
                <td className="py-2 px-4 border-b bg-green-50">
                  {item.deliveryFailureRate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Failure Details Modal */}
      <FailureDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        failureType={failureType}
        failureDetails={failureDetails}
        title={modalTitle}
      />
    </div>
  );
};

export default TenantDealerMetricsTab;
