import React, { useState } from "react";
import CommandCentreFilters from "../CommandCentreFilters";
import {
  getCurrentMonthRange,
  getDefaultTimeRange,
} from "../../../../../utils/dateUtils";
import TextingSection from "../../communicationTypes/TextingSection";
import CallingSection from "../../communicationTypes/CallingSection";
import EmailingSection from "../../communicationTypes/EmailingSection";

const OverallDashboard = () => {
  // Filter state - only date/time filters for Command Centre
  const [filters, setFilters] = useState(() => {
    const { startDate, endDate } = getCurrentMonthRange();
    const { startTime, endTime } = getDefaultTimeRange();

    return {
      startDate,
      endDate,
      startTime,
      endTime,
    };
  });

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Clear filters
  const clearFilters = () => {
    const { startDate, endDate } = getCurrentMonthRange();
    const { startTime, endTime } = getDefaultTimeRange();

    setFilters({
      startDate,
      endDate,
      startTime,
      endTime,
    });
  };

  return (
    <div className="space-y-8">
      {/* Date Range Filters */}
      <CommandCentreFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        showTenantDealerFilters={false}
        title="Overall Communication Filters"
      />

      <TextingSection view="overall" filters={filters} />

      <CallingSection view="overall" filters={filters} />

      <EmailingSection view="overall" filters={filters} />
    </div>
  );
};

export default OverallDashboard;
