

import React, { useState } from "react"
import CommandCentreFilters from "../CommandCentreFilters"
import {
  getCurrentMonthRange,
  getDefaultTimeRange
} from "../../../../../utils/dateUtils"
import TextingSection from "../TextingSection"
import CallingSection from "../CallingSection"
import EmailingSection from "../EmailingSection"

const TenantDealerDashboard = () => {
  // Filter state - only date/time filters for Command Centre
  const [filters, setFilters] = useState(() => {
    const { startDate, endDate } = getCurrentMonthRange()
    const { startTime, endTime } = getDefaultTimeRange()

    return {
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
      startDate,
      endDate,
      startTime,
      endTime
    })
  }

  return (
    <div className="space-y-8">
      {/* Date Range Filters */}
      <CommandCentreFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        showTenantDealerFilters={false}
        title="Tenant & Dealer Communication Filters"
      />

      {/* Texting Section - Using existing queries and tables */}
      <TextingSection view="tenant-dealer" filters={filters} />

      {/* Calling Section - Placeholder for future implementation */}
      <CallingSection view="tenant-dealer" filters={filters} />

      {/* Emailing Section - Placeholder for future implementation */}
      <EmailingSection view="tenant-dealer" filters={filters} />
    </div>
  )
}

export default TenantDealerDashboard
