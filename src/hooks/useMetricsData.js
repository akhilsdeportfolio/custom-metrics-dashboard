
import { useState, useEffect } from "react"
import { getYearToDateRange } from "../utils/dateUtils"
import {
  fetchMetricsData,
  fetchAllPagesOfMetricsData,
  processMetricsData,
  calculateSummaryMetrics,
  prepareChartData,
  prepareFailureTypesChartData
} from "../services/metricsService"

export function useMetricsData(props) {
  const [rawData, setRawData] = useState([])
  const [processedData, setProcessedData] = useState([])
  const [summaryMetrics, setSummaryMetrics] = useState(null)
  const [chartData, setChartData] = useState([])
  const [failureTypesChartData, setFailureTypesChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagingInfo, setPagingInfo] = useState(null)
  const [hasNextPage, setHasNextPage] = useState(false)

  // Get Year to Date range
  const { startDate, endDate } = getYearToDateRange()

  // Define the specific query from the user with Year to Date filtering
  const specificQuery = `SELECT
  tenantId,
  dealerId,
  serviceName,
  eventSubType,
  eventMessage,
  COUNT(*) AS event_count
FROM
  dwh.custom_metrics
WHERE
  serviceEnvironment LIKE 'prod%' AND
  eventType = 'TEXT_COMMUNICATION' AND
  eventSubType IN ('TEXT_MESSAGE_INITIATED','TEXT_DELIVERY_FAILURE') AND
  eventTimestamp >= '${startDate}' AND
  eventTimestamp <= '${endDate}'
GROUP BY
  tenantId, dealerId, serviceName, eventSubType, eventMessage
ORDER BY
  tenantId, dealerId, event_count DESC;`

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use the specific query or the one provided in props
      const query = props?.customQuery || specificQuery

      // Fetch all pages of data
      const data = await fetchAllPagesOfMetricsData(query)
      setRawData(data)

      // Process the data
      const processed = processMetricsData(data)
      setProcessedData(processed)

      // Calculate summary metrics
      const summary = calculateSummaryMetrics(processed)
      setSummaryMetrics(summary)

      // Prepare chart data
      const chart = prepareChartData(summary)
      setChartData(chart)

      // Prepare failure types chart data
      const failureChart = prepareFailureTypesChartData(summary)
      setFailureTypesChartData(failureChart)

      // Since we've fetched all pages, there are no more pages to fetch
      setPagingInfo(null)
      setHasNextPage(false)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchNextPage = async () => {
    if (!pagingInfo || loading) return

    try {
      setLoading(true)
      setError(null)

      // Use the specific query or the one provided in props
      const query = props?.customQuery || specificQuery

      // Fetch next page of data
      const newData = await fetchMetricsData(query, pagingInfo)

      // Combine with existing data
      const combinedData = [...rawData, ...newData]
      setRawData(combinedData)

      // Process the combined data
      const processed = processMetricsData(combinedData)
      setProcessedData(processed)

      // Calculate summary metrics
      const summary = calculateSummaryMetrics(processed)
      setSummaryMetrics(summary)

      // Prepare chart data
      const chart = prepareChartData(summary)
      setChartData(chart)

      // Prepare failure types chart data
      const failureChart = prepareFailureTypesChartData(summary)
      setFailureTypesChartData(failureChart)

      // Update paging info for next page
      // In a real implementation, you would get this from the API response
      // For now, we'll just set it to null to indicate no more pages
      setPagingInfo(null)
      setHasNextPage(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("An error occurred while fetching the next page")
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    rawData,
    processedData,
    summaryMetrics,
    chartData,
    failureTypesChartData,
    loading,
    error,
    refetch: fetchData,
    fetchNextPage,
    hasNextPage,
    pagingInfo
  }
}
