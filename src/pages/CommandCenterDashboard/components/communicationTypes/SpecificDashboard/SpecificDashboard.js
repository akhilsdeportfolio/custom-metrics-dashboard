

import React, { useState } from "react"
import CommandCentreFilters from "../CommandCentreFilters"
import {
  getCurrentMonthRange,
  getDefaultTimeRange
} from "../../../../../utils/dateUtils"
import TextingSection from "../TextingSection"
import CallingSection from "../CallingSection"
import EmailingSection from "../EmailingSection"

const SpecificDashboard = () => {
  // Filter state
  const [filters, setFilters] = useState(() => {
    const { startDate, endDate } = getCurrentMonthRange()
    const { startTime, endTime } = getDefaultTimeRange()

    return {
      tenantId: "",
      dealerId: "",
      startDate,
      endDate,
      startTime,
      endTime
    }
  })

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Clear filters
  const clearFilters = () => {
    const { startDate, endDate } = getCurrentMonthRange()
    const { startTime, endTime } = getDefaultTimeRange()

    setFilters({
      tenantId: "",
      dealerId: "",
      startDate,
      endDate,
      startTime,
      endTime
    })
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <CommandCentreFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        showTenantDealerFilters={true}
        title="Specific Communication Filters"
      />

      {/* Show content only if tenant or dealer ID is provided */}
      {filters.tenantId || filters.dealerId ? (
        <div className="space-y-8">
          {/* Texting Section - Using existing queries and tables */}
          <TextingSection view="specific" filters={filters} />

          {/* Calling Section - Placeholder for future implementation */}
          <CallingSection view="specific" filters={filters} />

          {/* Emailing Section - Placeholder for future implementation */}
          <EmailingSection view="specific" filters={filters} />
        </div>
      ) : (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p className="font-bold">Tenant or Dealer ID Required</p>
          <p>
            Please enter either a Tenant ID or Dealer ID to view specific
            communication metrics.
          </p>
        </div>
      )}
    </div>
  )
}

export default SpecificDashboard
