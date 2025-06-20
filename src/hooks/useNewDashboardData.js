import { useState, useEffect, useCallback } from "react"
import {
  fetchDashboardData,
  calculateSummaryMetrics,
  prepareChartData
} from "../services/newDashboardService"

export function useNewDashboardData(initialFilters) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters || {})

  // Derived data
  const summaryMetrics = calculateSummaryMetrics(data)
  const chartData = prepareChartData(data)

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDashboardData(filters)
      setData(result)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      )
      console.error("Error fetching dashboard data:", err)
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
    setFilters({})
  }, [])

  // Initial data fetch
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
    refetch: fetchData,
    summaryMetrics,
    chartData
  }
}
