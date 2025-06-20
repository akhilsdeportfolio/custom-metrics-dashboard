
import React from "react"
import {
  getCurrentMonthRange,
  getDefaultTimeRange
} from "../../../../../utils/dateUtils"

const CommandCentreFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  showTenantDealerFilters = false,
  title = "Communication Filters"
}) => {
  const {
    startDate: defaultStartDate,
    endDate: defaultEndDate
  } = getCurrentMonthRange()
  const {
    startTime: defaultStartTime,
    endTime: defaultEndTime
  } = getDefaultTimeRange()

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {showTenantDealerFilters && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant ID
              </label>
              <input
                type="text"
                value={filters.tenantId || ""}
                onChange={e => onFilterChange("tenantId", e.target.value)}
                placeholder="Filter by tenant ID..."
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dealer ID
              </label>
              <input
                type="text"
                value={filters.dealerId || ""}
                onChange={e => onFilterChange("dealerId", e.target.value)}
                placeholder="Filter by dealer ID..."
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.startDate || defaultStartDate}
              onChange={e => onFilterChange("startDate", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <input
              type="time"
              value={filters.startTime || defaultStartTime}
              onChange={e => onFilterChange("startTime", e.target.value)}
              className="w-1/2 p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.endDate || defaultEndDate}
              onChange={e => onFilterChange("endDate", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <input
              type="time"
              value={filters.endTime || defaultEndTime}
              onChange={e => onFilterChange("endTime", e.target.value)}
              className="w-1/2 p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClearFilters}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}

export default CommandCentreFilters
