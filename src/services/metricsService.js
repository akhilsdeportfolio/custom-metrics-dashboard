import axios from "axios"
import { getYearToDateRange } from "../utils/dateUtils"

// API endpoint for Clickhouse queries
// Using our own API route to avoid CORS issues
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "https://app.tekioncloud.com/api/apmserving/u/v1/query/clickhouse/raw"

// Get Year to Date range
const { startDate, endDate } = getYearToDateRange()

// Default query for tenant/dealer metrics (without month granularity)
const DEFAULT_QUERY = `SELECT
  tenantId,
  dealerId,
  serviceName,
  eventSubType,
  eventMessage,
  JSONExtractString(eventMetaData, 'origin-platform') as origin,
  COUNT(*) AS event_count
FROM
  dwh.custom_metrics
WHERE
  serviceEnvironment LIKE 'prod%' AND
  eventType = 'TEXT_COMMUNICATION' AND
  (
    eventSubType IN ('TEXT_MESSAGE_INITIATED','TEXT_DELIVERY_FAILURE')
    OR (eventSubType = 'GTC_MESSAGE_INITIATED')
  ) AND
  eventTimestamp >= '${startDate}' AND
  eventTimestamp <= '${endDate}'
GROUP BY
  tenantId, dealerId, serviceName, eventSubType, eventMessage, origin
ORDER BY
  tenantId, dealerId, event_count DESC;`

// Create axios instance with default config
const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
    accept: "application/json, text/plain, */*",
    applicationid: "ARC_NA",
    clientid: "web",
    locale: "en_US",
    productids: "ARC",
    program: "DEFAULT",
    subapplicationid: "US"
  }
})

// Add request interceptor for authentication
apiClient.interceptors.request.use(config => {
  // In a real application, these values would be dynamically obtained
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("tekion-api-token")
    const userId = localStorage.getItem("userId")
    const tenantId = localStorage.getItem("tenantId")
    const tenantName = localStorage.getItem("tenantName")
    const dealerId = localStorage.getItem("dealerId")
    const roleId = localStorage.getItem("roleId")

    if (token) config.headers["tekion-api-token"] = token
    if (userId) {
      config.headers["userid"] = userId
      config.headers["original-userid"] = userId
    }
    if (tenantId) config.headers["original-tenantid"] = tenantId
    if (tenantName) config.headers["tenantname"] = tenantName
    if (dealerId) config.headers["dealerid"] = dealerId
    if (roleId) config.headers["roleid"] = roleId
  }

  return config
})

// Function to fetch metrics data with optional custom query and pagination
export async function fetchMetricsData(customQuery, pagingInfo) {
  try {
    // For development/testing, use the sample response
    if (process.env.NODE_ENV === "development") {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Use sample data from a local file
      const response = await fetch("/sample_response.json")
      const data = await response.json()
      return data.data.data
    }

    // For production, make the actual API call
    const payload = {
      query: customQuery || DEFAULT_QUERY,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    // Add pagination info if available
    if (pagingInfo) {
      payload.pagingInfo = pagingInfo
    }

    console.log("API Request Payload:", payload)

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log("API Response:", response.data)

    return response.data.data.data
  } catch (error) {
    console.error("Error fetching metrics data:", error)
    throw error
  }
}

// Function to fetch all pages of metrics data
export async function fetchAllPagesOfMetricsData(customQuery) {
  try {
    let allData = []

    // For development/testing with sample data
    if (process.env.NODE_ENV === "development") {
      // In development mode, we'll simulate fetching all pages by using the sample data
      console.log("Development mode: Using sample data for all pages")

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Use sample data from a local file
      const response = await fetch("/sample_response.json")
      const data = await response.json()
      return data.data.data
    }

    // For production environment
    // First, make the initial API call
    const payload = {
      query: customQuery || DEFAULT_QUERY,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    // For the first API call, we don't want to pass any pagination info
    // This ensures we start from the beginning of the data

    console.log("Initial API Request Payload:", payload)

    let response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    // Add the first page of data
    allData = [...allData, ...response.data.data.data]

    // Get pagination info from the response
    let nextToken = response.data.data.nextToken
    const queryExecutionId = response.data.data.queryExecutionId

    console.log("Initial response nextToken:", nextToken)

    // Continue fetching pages until nextToken is null
    while (nextToken) {
      console.log(`Fetching next page with token: ${nextToken}`)

      // Prepare the next request with pagination info
      const nextPayload = {
        query: customQuery || DEFAULT_QUERY,
        dbName: "default",
        tableName: "dwh.custom_metrics",
        pagingInfo: {
          queryExecutionId,
          nextToken
        }
      }

      // Make the next request
      response = await apiClient.post(API_ENDPOINT, nextPayload)

      if (response.data.status !== "success") {
        throw new Error(`Query execution failed: ${response.data.status}`)
      }

      // Add the next page of data
      allData = [...allData, ...response.data.data.data]

      // Update nextToken for the next iteration
      nextToken = response.data.data.nextToken
      console.log("Updated nextToken:", nextToken)
    }

    console.log(`Fetched a total of ${allData.length} items across all pages`)
    return allData
  } catch (error) {
    console.error("Error fetching all pages of metrics data:", error)
    throw error
  }
}

// Function to process raw metrics data
export function processMetricsData(data) {
  // Group data by tenant and dealer
  const groupedData = {}

  data.forEach(item => {
    const key = `${item.tenantId}_${item.dealerId}`

    if (!groupedData[key]) {
      groupedData[key] = {
        tenantId: item.tenantId,
        dealerId: item.dealerId,
        // Initialize counters for all message types
        totalInitiated: 0,
        // Thread connector metrics
        threadConnectorInitiated: 0,
        threadConnectorSuccess: 0,
        // Message type metrics
        tmsInitiated: 0,
        gtcInitiated: 0,
        // Failure metrics
        apiFailures: 0,
        deliveryFailures: 0,
        // Month tracking for time-based analysis
        months: new Set()
      }
    }

    // Since we're not using month-level granularity in this service anymore,
    // we'll just add a placeholder month for compatibility
    groupedData[key].months.add("2025-01-01")

    // Count by message types
    if (item.eventSubType === "TEXT_MESSAGE_INITIATED") {
      const count = parseInt(item.event_count)
      groupedData[key].totalInitiated += count
      const origin = item.origin || ""
      const originUpper = origin.toUpperCase()

      if (item.eventMessage === "USER_NOT_MAPPED" && origin === "") {
        // TEXT_MESSAGE_INITIATED with USER_NOT_MAPPED and empty origin goes to THREADS FAILURE, THREADS API_FAILURE
        // We don't have a separate counter for THREADS API_FAILURE in the current data structure
        // This would need to be added if we want to track it separately
        // For now, we'll count it as a general failure
        groupedData[key].apiFailures += count
      } else if (item.eventMessage === "THREAD_CONNECTOR_MESSAGE_INITIATED") {
        // THREAD_CONNECTOR_MESSAGE_INITIATED always goes to THREADS Total
        groupedData[key].threadConnectorInitiated += count
      } else if (item.eventMessage === "THREAD_CONNECTOR_MESSAGE_SUCCESS") {
        // THREAD_CONNECTOR_MESSAGE_SUCCESS always goes to THREADS Success
        groupedData[key].threadConnectorSuccess += count
      } else if (item.eventMessage === "TMS_MESSAGE_INITIATED") {
        if (originUpper === "THREADS") {
          // TMS_MESSAGE_INITIATED with THREADS origin goes to THREADS Total
          groupedData[key].threadConnectorInitiated += count
        } else {
          // TMS_MESSAGE_INITIATED with any other origin goes to NON-THREADS Total
          groupedData[key].tmsInitiated += count
        }
      } else if (item.eventMessage === "GTC_MESSAGE_INITIATED") {
        if (originUpper === "THREADS") {
          // GTC_MESSAGE_INITIATED with THREADS origin goes to THREADS Total
          groupedData[key].threadConnectorInitiated += count
        } else {
          // GTC_MESSAGE_INITIATED with any other origin goes to NON-THREADS Total
          groupedData[key].gtcInitiated += count
        }
      } else if (
        item.eventMessage === "GTC_MESSAGE_INITIATION_SUCCESS" &&
        originUpper === "THREADS"
      ) {
        // GTC_MESSAGE_INITIATION_SUCCESS with THREADS origin goes to THREADS Success
        groupedData[key].threadConnectorSuccess += count
      }
    }

    // Count failures by type
    if (item.eventSubType === "TEXT_DELIVERY_FAILURE") {
      const count = parseInt(item.event_count)
      const origin = item.origin || ""
      const originUpper = origin.toUpperCase()

      if (item.eventMessage === "API_FAILURE") {
        if (originUpper === "THREADS") {
          // API_FAILURE with THREADS origin goes to THREADS FAILURE
          // We don't have a separate counter for THREADS API_FAILURE in the current data structure
          // This would need to be added if we want to track it separately
        } else {
          // API_FAILURE with any other origin goes to NON-THREADS FAILURE, NON-THREADS API_FAILURE
          groupedData[key].apiFailures += count
        }
      } else if (item.eventMessage === "DELIVERY_FAILURE") {
        if (originUpper === "THREADS") {
          // DELIVERY_FAILURE with THREADS origin goes to THREADS TOTAL
          // We don't have a separate counter for THREADS DELIVERY_FAILURE in the current data structure
          // This would need to be added if we want to track it separately
        } else {
          // DELIVERY_FAILURE with any other origin goes to NON-THREADS TOTAL, NON-THREADS DELIVERY_FAILURE
          groupedData[key].deliveryFailures += count
        }
      }
    }
  })

  // Calculate derived metrics
  return Object.values(groupedData).map(metric => {
    // Convert months Set to array for easier handling
    const monthsArray = Array.from(metric.months)

    // Thread connector metrics
    const threadConnectorTotal = metric.threadConnectorInitiated
    const threadConnectorFailure =
      threadConnectorTotal - metric.threadConnectorSuccess
    const threadConnectorFailureRate =
      threadConnectorTotal > 0
        ? ((threadConnectorFailure / threadConnectorTotal) * 100).toFixed(2) +
          "%"
        : "0%"

    // Total message metrics
    // Total Messages = All messages with eventSubType = 'TEXT_MESSAGE_INITIATED'
    const totalMessages = metric.totalInitiated
    const totalNonThreadsMessages = metric.tmsInitiated + metric.gtcInitiated

    // Total Failures = All messages with eventSubType = 'TEXT_DELIVERY_FAILURE'
    const totalFailures = metric.apiFailures + metric.deliveryFailures

    // Success Messages = Total Messages - Total Failures
    const successMessages = totalNonThreadsMessages - totalFailures

    // Failure rates
    const failureRate =
      totalNonThreadsMessages > 0
        ? ((totalFailures / totalNonThreadsMessages) * 100).toFixed(2) + "%"
        : "0%"

    // Success rate
    const successRate =
      totalMessages > 0
        ? ((successMessages / totalMessages) * 100).toFixed(2) + "%"
        : "0%"

    // Message type breakdown
    const tmsPercentage =
      totalMessages > 0
        ? ((metric.tmsInitiated / totalMessages) * 100).toFixed(2) + "%"
        : "0%"

    const gtcPercentage =
      totalMessages > 0
        ? ((metric.gtcInitiated / totalMessages) * 100).toFixed(2) + "%"
        : "0%"

    const threadConnectorPercentage =
      totalMessages > 0
        ? ((threadConnectorTotal / totalMessages) * 100).toFixed(2) + "%"
        : "0%"

    // Failure type breakdown
    const apiFailurePercentage =
      totalFailures > 0
        ? ((metric.apiFailures / totalFailures) * 100).toFixed(2) + "%"
        : "0%"

    const deliveryFailurePercentage =
      totalFailures > 0
        ? ((metric.deliveryFailures / totalFailures) * 100).toFixed(2) + "%"
        : "0%"

    // Create and return the processed metrics object
    return {
      tenantId: metric.tenantId,
      dealerId: metric.dealerId,
      totalInitiated: metric.totalInitiated,
      totalMessages,
      successMessages,
      totalFailures,
      failureRate,
      successRate,
      apiFailures: metric.apiFailures,
      deliveryFailures: metric.deliveryFailures,
      apiFailurePercentage,
      deliveryFailurePercentage,
      threadConnectorTotal,
      threadConnectorSuccess: metric.threadConnectorSuccess,
      threadConnectorFailure,
      threadConnectorFailureRate,
      threadConnectorPercentage,
      tmsInitiated: metric.tmsInitiated,
      tmsPercentage,
      gtcInitiated: metric.gtcInitiated,
      gtcPercentage,
      monthsArray
    }
  })
}

// Function to calculate summary metrics
export function calculateSummaryMetrics(processedData) {
  // Calculate basic sums
  const totalMessages = processedData.reduce(
    (sum, item) => sum + (item.totalMessages || 0),
    0
  )
  const successMessages = processedData.reduce(
    (sum, item) => sum + (item.successMessages || 0),
    0
  )
  const failedMessages = processedData.reduce(
    (sum, item) => sum + (item.totalFailures || 0),
    0
  )
  const apiFailures = processedData.reduce(
    (sum, item) => sum + (item.apiFailures || 0),
    0
  )
  const deliveryFailures = processedData.reduce(
    (sum, item) => sum + (item.deliveryFailures || 0),
    0
  )
  const threadConnectorTotal = processedData.reduce(
    (sum, item) => sum + (item.threadConnectorTotal || 0),
    0
  )
  const threadConnectorSuccess = processedData.reduce(
    (sum, item) => sum + (item.threadConnectorSuccess || 0),
    0
  )
  const threadConnectorFailure = processedData.reduce(
    (sum, item) => sum + (item.threadConnectorFailure || 0),
    0
  )
  const tmsInitiated = processedData.reduce(
    (sum, item) => sum + (item.tmsInitiated || 0),
    0
  )
  const gtcInitiated = processedData.reduce(
    (sum, item) => sum + (item.gtcInitiated || 0),
    0
  )

  // Collect all unique months
  const allMonths = new Set()
  processedData.forEach(item => {
    if (item.monthsArray && item.monthsArray.length > 0) {
      item.monthsArray.forEach(month => allMonths.add(month))
    }
  })

  // Calculate percentages
  const successRate =
    totalMessages > 0
      ? ((successMessages / totalMessages) * 100).toFixed(2) + "%"
      : "0%"

  const failureRate =
    totalMessages > 0
      ? ((failedMessages / totalMessages) * 100).toFixed(2) + "%"
      : "0%"

  const apiFailurePercentage =
    failedMessages > 0
      ? ((apiFailures / failedMessages) * 100).toFixed(2) + "%"
      : "0%"

  const deliveryFailurePercentage =
    failedMessages > 0
      ? ((deliveryFailures / failedMessages) * 100).toFixed(2) + "%"
      : "0%"

  const threadConnectorFailureRate =
    threadConnectorTotal > 0
      ? ((threadConnectorFailure / threadConnectorTotal) * 100).toFixed(2) + "%"
      : "0%"

  const threadConnectorPercentage =
    totalMessages > 0
      ? ((threadConnectorTotal / totalMessages) * 100).toFixed(2) + "%"
      : "0%"

  const tmsPercentage =
    totalMessages > 0
      ? ((tmsInitiated / totalMessages) * 100).toFixed(2) + "%"
      : "0%"

  const gtcPercentage =
    totalMessages > 0
      ? ((gtcInitiated / totalMessages) * 100).toFixed(2) + "%"
      : "0%"

  return {
    totalMessages,
    successMessages,
    failedMessages,
    successRate,
    failureRate,
    apiFailures,
    deliveryFailures,
    apiFailurePercentage,
    deliveryFailurePercentage,
    threadConnectorTotal,
    threadConnectorSuccess,
    threadConnectorFailure,
    threadConnectorFailureRate,
    threadConnectorPercentage,
    tmsInitiated,
    tmsPercentage,
    gtcInitiated,
    gtcPercentage,
    uniqueMonths: Array.from(allMonths).sort()
  }
}

// Function to prepare chart data for Threads
export function prepareChartData(summaryMetrics) {
  return [
    { name: "Threads Success", value: summaryMetrics.threadConnectorSuccess },
    { name: "Threads Failure", value: summaryMetrics.threadConnectorFailure }
  ]
}

// Function to prepare failure types chart data (not used in current view)
export function prepareFailureTypesChartData(summaryMetrics) {
  return [
    { name: "Threads Success", value: summaryMetrics.threadConnectorSuccess },
    { name: "Threads Failure", value: summaryMetrics.threadConnectorFailure }
  ]
}
