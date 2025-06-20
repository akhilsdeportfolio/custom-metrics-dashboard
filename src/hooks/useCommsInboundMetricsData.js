import { useState, useEffect, useCallback } from "react"
import {
  fetchMonthlyMetricsData,
  fetchTenantDealerMetricsData,
  calculateMonthlySummaryMetrics,
  calculateTenantDealerSummaryMetrics
} from "../services/commsInboundMetricsService"
import { getCurrentMonthRange, getDefaultTimeRange } from "../utils/dateUtils"

// Hook for monthly metrics data
export function useMonthlyMetricsData() {
  // Get current month range for default filter
  const { startDate, endDate } = getCurrentMonthRange()
  const { startTime, endTime } = getDefaultTimeRange()

  // State for data, loading, error, and filters
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    startDate,
    endDate,
    startTime,
    endTime
  })

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
      console.error("Error fetching monthly inbound metrics data:", err)
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

  // Clear filters
  const clearFilters = useCallback(() => {
    const { startDate, endDate } = getCurrentMonthRange()
    const { startTime, endTime } = getDefaultTimeRange()
    setFilters({
      startDate,
      endDate,
      startTime,
      endTime
    })
  }, [])

  // Refetch data
  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch,
    summaryMetrics
  }
}

// Hook for tenant/dealer metrics data
export function useTenantDealerMetricsData() {
  // Get current month range for default filter
  const { startDate, endDate } = getCurrentMonthRange()
  const { startTime, endTime } = getDefaultTimeRange()

  // State for data, loading, error, and filters
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    startDate,
    endDate,
    startTime,
    endTime,
    tenantId: "",
    dealerId: ""
  })

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
      console.error("Error fetching tenant/dealer inbound metrics data:", err)
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

  // Clear filters
  const clearFilters = useCallback(() => {
    const { startDate, endDate } = getCurrentMonthRange()
    const { startTime, endTime } = getDefaultTimeRange()
    setFilters({
      startDate,
      endDate,
      startTime,
      endTime,
      tenantId: "",
      dealerId: ""
    })
  }, [])

  // Refetch data
  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch,
    summaryMetrics
  }
}
