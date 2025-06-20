import { useState, useEffect, useCallback } from "react";
import {
  fetchMonthlyMetricsData,
  fetchTenantDealerMetricsData,
  calculateMonthlySummaryMetrics,
  calculateTenantDealerSummaryMetrics,
} from "../services/commandCentreMetricsService";
import { getCurrentMonthRange, getDefaultTimeRange } from "../utils/dateUtils";

// Hook for monthly metrics data (THREADS only)
export function useMonthlyMetricsData(initialFilters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get default current month range
  const { startDate: defaultStartDate, endDate: defaultEndDate } =
    getCurrentMonthRange();
  const { startTime: defaultStartTime, endTime: defaultEndTime } =
    getDefaultTimeRange();

  const [filters, setFilters] = useState(
    initialFilters || {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
    }
  );

  // Derived data
  const summaryMetrics = calculateMonthlySummaryMetrics(data);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchMonthlyMetricsData(filters);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
      console.error("Error fetching command centre monthly metrics data:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Refresh data
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    summaryMetrics,
    filters,
    updateFilters,
    refreshData,
  };
}

// Hook for tenant/dealer metrics data (THREADS only)
export function useTenantDealerMetricsData(initialFilters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get default current month range
  const { startDate: defaultStartDate, endDate: defaultEndDate } =
    getCurrentMonthRange();
  const { startTime: defaultStartTime, endTime: defaultEndTime } =
    getDefaultTimeRange();

  const [filters, setFilters] = useState(
    initialFilters || {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
    }
  );

  // Derived data
  const summaryMetrics = calculateTenantDealerSummaryMetrics(data);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchTenantDealerMetricsData(filters);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
      console.error(
        "Error fetching command centre tenant/dealer metrics data:",
        err
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Refresh data
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    summaryMetrics,
    filters,
    updateFilters,
    refreshData,
  };
}
