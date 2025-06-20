import { useState, useEffect, useCallback } from "react"
import {
  fetchMonthlyMetricsData,
  fetchTenantDealerMetricsData,
  calculateMonthlySummaryMetrics,
  calculateTenantDealerSummaryMetrics
} from "../services/commsMetricsService"
import { getCurrentMonthRange, getDefaultTimeRange } from "../utils/dateUtils"

// Hook for monthly metrics data
export function useMonthlyMetricsData(initialFilters, enabled = true) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get default current month range
  const {
    startDate: defaultStartDate,
    endDate: defaultEndDate
  } = getCurrentMonthRange()
  const {
    startTime: defaultStartTime,
    endTime: defaultEndTime
  } = getDefaultTimeRange()

  const [filters, setFilters] = useState(
    initialFilters || {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime
    }
  )

  // Derived data
  const summaryMetrics = calculateMonthlySummaryMetrics(data)

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchMonthlyMetricsData(filters)
      setData(result)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      )
      console.error("Error fetching monthly metrics data:", err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Update filters
  const updateFilters = useCallback(newFilters => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime
    })
  }, [defaultStartDate, defaultEndDate, defaultStartTime, defaultEndTime])

  // Initial data fetch - only if enabled
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [fetchData, enabled])

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch: fetchData,
    summaryMetrics
  }
}

// Hook for tenant/dealer metrics data
export function useTenantDealerMetricsData(initialFilters, enabled = true) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get default current month range
  const {
    startDate: defaultStartDate,
    endDate: defaultEndDate
  } = getCurrentMonthRange()
  const {
    startTime: defaultStartTime,
    endTime: defaultEndTime
  } = getDefaultTimeRange()

  const [filters, setFilters] = useState(
    initialFilters || {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime
    }
  )

  // Derived data
  const summaryMetrics = calculateTenantDealerSummaryMetrics(data)

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchTenantDealerMetricsData(filters)
      setData(result)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      )
      console.error("Error fetching tenant/dealer metrics data:", err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Update filters
  const updateFilters = useCallback(newFilters => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime
    })
  }, [defaultStartDate, defaultEndDate, defaultStartTime, defaultEndTime])

  // Initial data fetch - only if enabled
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [fetchData, enabled])

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch: fetchData,
    summaryMetrics
  }
}
