import React, { useState } from "react"
import { downloadCSV } from "../../../utils/csvExport"
import FailureDetailsModal from "../FailureDetailsModal"
import {
  fetchAPIFailureDetails,
  fetchDeliveryFailureDetails,
  fetchThreadsFailureDetails
} from "../../../services/failureDetailsService"

const MonthlyMetricsTab = ({
  monthlyData,
  monthlySortColumn,
  monthlySortDirection,
  handleMonthlySortClick,
  formatNumber
}) => {
  // State for failure details modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [failureType, setFailureType] = useState("API")
  const [failureDetails, setFailureDetails] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [modalTitle, setModalTitle] = useState("")

  // Function to open the API failures modal
  const handleViewAPIFailures = async month => {
    try {
      setIsLoading(true)
      setFailureType("API")
      setModalTitle(
        month
          ? `API Failures for ${new Date(month).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long"
            })}`
          : "API Failures (All Months)"
      )

      // Fetch API failure details with optional month filter
      const details = await fetchAPIFailureDetails(month)
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
  const handleViewDeliveryFailures = async month => {
    try {
      setIsLoading(true)
      setFailureType("Delivery")
      setModalTitle(
        month
          ? `Delivery Failures for ${new Date(month).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long" }
            )}`
          : "Delivery Failures (All Months)"
      )

      // Fetch delivery failure details with optional month filter
      const details = await fetchDeliveryFailureDetails(month)
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
  const handleViewThreadsFailures = async month => {
    try {
      setIsLoading(true)
      setFailureType("API")
      setModalTitle(
        month
          ? `Threads Failures for ${new Date(month).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long" }
            )}`
          : "Threads Failures (All Months)"
      )

      // Fetch Threads failure details with optional month filter
      const details = await fetchThreadsFailureDetails(month)
      setFailureDetails(details)
      setIsModalOpen(true)
    } catch (error) {
      console.error("Error fetching Threads failure details:", error)
      alert("Failed to load Threads failure details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  // Sort monthly data
  const sortedMonthlyData = [...monthlyData].sort((a, b) => {
    if (monthlySortColumn === "month") {
      // Sort by date
      return monthlySortDirection === "asc"
        ? new Date(a.month).getTime() - new Date(b.month).getTime()
        : new Date(b.month).getTime() - new Date(a.month).getTime()
    } else if (
      monthlySortColumn === "threadConnectorFailureRate" ||
      monthlySortColumn === "nonThreadsFailureRate" ||
      monthlySortColumn === "apiFailureRate" ||
      monthlySortColumn === "deliveryFailureRate"
    ) {
      // Sort by failure rate (remove % sign and convert to number)
      const aValue = parseFloat(String(a[monthlySortColumn]).replace("%", ""))
      const bValue = parseFloat(String(b[monthlySortColumn]).replace("%", ""))
      return monthlySortDirection === "asc" ? aValue - bValue : bValue - aValue
    } else {
      // Sort by other numeric columns
      const aValue = a[monthlySortColumn]
      const bValue = b[monthlySortColumn]
      return monthlySortDirection === "asc" ? aValue - bValue : bValue - aValue
    }
  })

  // Function to handle CSV export
  const handleExportCSV = () => {
    // Define custom headers for better readability in the CSV
    const headers = {
      month: "Month",
      threadConnectorTotal: "Total Threads Messages",
      threadConnectorSuccess: "Threads Success Messages",
      threadConnectorFailure: "Threads Failure Count",
      threadConnectorFailureRate: "Threads Failure Rate",
      tmsTotal: "Total TMS Messages",
      gtcTotal: "Total GTC Messages",
      nonThreadsTotal: "Total Non-Threads Messages",
      nonThreadsSuccess: "Non-Threads Success",
      totalNonThreadsFailure: "Non-Threads Failure",
      nonThreadsFailureRate: "Non-Threads Failure Rate",
      apiFailures: "API Failures",
      apiFailureRate: "API Failure Rate",
      deliveryFailures: "Delivery Failures",
      deliveryFailureRate: "Delivery Failure Rate"
    }

    // Format the month in a more readable way for the CSV
    const exportData = sortedMonthlyData.map(item => ({
      month: new Date(item.month).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long"
      }),
      threadConnectorTotal: item.threadConnectorTotal,
      threadConnectorSuccess: item.threadConnectorSuccess,
      threadConnectorFailure: item.threadConnectorFailure,
      threadConnectorFailureRate: item.threadConnectorFailureRate,
      tmsTotal: item.tmsTotal,
      gtcTotal: item.gtcTotal,
      nonThreadsTotal: item.nonThreadsTotal,
      nonThreadsSuccess: item.nonThreadsSuccess,
      totalNonThreadsFailure: item.totalNonThreadsFailure,
      nonThreadsFailureRate: item.nonThreadsFailureRate,
      apiFailures: item.apiFailures,
      apiFailureRate: item.apiFailureRate,
      deliveryFailures: item.deliveryFailures,
      deliveryFailureRate: item.deliveryFailureRate
    }))

    // Download the CSV
    downloadCSV(exportData, "monthly-metrics.csv", headers)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Monthly Summary Metrics</h2>
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
              <th
                rowSpan={2}
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200"
                onClick={() => handleMonthlySortClick("month")}
              >
                Month{" "}
                {monthlySortColumn === "month" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
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
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-blue-50"
                onClick={() => handleMonthlySortClick("threadConnectorTotal")}
              >
                Total{" "}
                {monthlySortColumn === "threadConnectorTotal" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-blue-50"
                onClick={() => handleMonthlySortClick("threadConnectorSuccess")}
              >
                Success{" "}
                {monthlySortColumn === "threadConnectorSuccess" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-blue-50"
                onClick={() => handleMonthlySortClick("threadConnectorFailure")}
              >
                Failure{" "}
                {monthlySortColumn === "threadConnectorFailure" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-blue-50"
                onClick={() =>
                  handleMonthlySortClick("threadConnectorFailureRate")
                }
              >
                Failure Rate{" "}
                {monthlySortColumn === "threadConnectorFailureRate" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleMonthlySortClick("tmsTotal")}
              >
                TMS{" "}
                {monthlySortColumn === "tmsTotal" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleMonthlySortClick("gtcTotal")}
              >
                GTC{" "}
                {monthlySortColumn === "gtcTotal" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleMonthlySortClick("nonThreadsTotal")}
              >
                Total{" "}
                {monthlySortColumn === "nonThreadsTotal" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleMonthlySortClick("nonThreadsSuccess")}
              >
                Success{" "}
                {monthlySortColumn === "nonThreadsSuccess" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleMonthlySortClick("totalNonThreadsFailure")}
              >
                Failure{" "}
                {monthlySortColumn === "totalNonThreadsFailure" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleMonthlySortClick("nonThreadsFailureRate")}
              >
                Failure Rate{" "}
                {monthlySortColumn === "nonThreadsFailureRate" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleMonthlySortClick("apiFailures")}
              >
                API Failures{" "}
                {monthlySortColumn === "apiFailures" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleMonthlySortClick("apiFailureRate")}
              >
                API Rate{" "}
                {monthlySortColumn === "apiFailureRate" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleMonthlySortClick("deliveryFailures")}
              >
                Delivery Failures{" "}
                {monthlySortColumn === "deliveryFailures" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="py-2 px-4 border-b cursor-pointer hover:bg-gray-200 bg-green-50"
                onClick={() => handleMonthlySortClick("deliveryFailureRate")}
              >
                Delivery Rate{" "}
                {monthlySortColumn === "deliveryFailureRate" &&
                  (monthlySortDirection === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMonthlyData.map((item, index) => (
              <tr
                key={`month-${item.month}-${index}`}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="py-2 px-4 border-b">
                  {new Date(item.month).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long"
                  })}
                </td>
                <td className="py-2 px-4 border-b bg-blue-50">
                  {formatNumber(item.threadConnectorTotal)}
                </td>
                <td className="py-2 px-4 border-b bg-blue-50">
                  {formatNumber(item.threadConnectorSuccess)}
                </td>
                <td className="py-2 px-4 border-b bg-blue-50">
                  <button
                    onClick={() => handleViewThreadsFailures(item.month)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {formatNumber(item.threadConnectorFailure)}
                  </button>
                </td>
                <td className="py-2 px-4 border-b bg-blue-50">
                  {item.threadConnectorFailureRate}
                </td>
                <td className="py-2 px-4 border-b bg-green-50">
                  {formatNumber(item.tmsTotal)}
                </td>
                <td className="py-2 px-4 border-b bg-green-50">
                  {formatNumber(item.gtcTotal)}
                </td>
                <td className="py-2 px-4 border-b bg-green-50">
                  {formatNumber(item.nonThreadsTotal)}
                </td>
                <td className="py-2 px-4 border-b bg-green-50">
                  {formatNumber(item.nonThreadsSuccess)}
                </td>
                <td className="py-2 px-4 border-b bg-green-50">
                  <button
                    onClick={() => handleViewAPIFailures(item.month)}
                    className="text-blue-600 hover:text-blue-800 hover:underline mr-2"
                  >
                    {formatNumber(item.apiFailures)}
                  </button>
                  +
                  <button
                    onClick={() => handleViewDeliveryFailures(item.month)}
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
                    onClick={() => handleViewAPIFailures(item.month)}
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
                    onClick={() => handleViewDeliveryFailures(item.month)}
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
  )
}

export default MonthlyMetricsTab
