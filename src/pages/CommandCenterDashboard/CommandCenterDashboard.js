import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getCurrentMonthRange } from "../../utils/dateUtils"
import TabNavigation from "../../components/CommsInboundDashboard/TabNavigation"
import OverallDashboard from "./components/communicationTypes/OverallDashboard"
import TenantDealerDashboard from "./components/communicationTypes/TenantDealerDashboard"
import SpecificDashboard from "./components/communicationTypes/SpecificDashboard"

export default function CommandCentreDashboardPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState("overall")

  // Get Current Month range for display
  const { startDate, endDate } = getCurrentMonthRange()

  // Check authentication on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("tekion-api-token")
      const userId = localStorage.getItem("userId")
      const tenantId = localStorage.getItem("tenantId")

      setIsAuthenticated(!!token && !!userId && !!tenantId)
    }
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Command Centre Dashboard (Current Month: {startDate} to {endDate})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Data
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
      ) : (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <TabNavigation
            tabs={[
              { id: "overall", label: "📊 Overall" },
              { id: "tenant-dealer", label: "🏢 Tenant & Dealer" },
              { id: "specific", label: "🔍 Specific" }
            ]}
            activeTab={activeTab}
            onTabChange={tabId => setActiveTab(tabId)}
          />

          {/* Tab Content */}
          {activeTab === "overall" && <OverallDashboard />}
          {activeTab === "tenant-dealer" && <TenantDealerDashboard />}
          {activeTab === "specific" && <SpecificDashboard />}
        </div>
      )}
    </div>
  )
}
