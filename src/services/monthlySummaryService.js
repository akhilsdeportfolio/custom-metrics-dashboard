
import axios from "axios"
import { getYearToDateRange } from "../utils/dateUtils"

// API endpoint for Clickhouse queries
// Using our own API route to avoid CORS issues
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "https://app.tekioncloud.com/api/apmserving/u/v1/query/clickhouse/raw"

// Get Year to Date range
const { startDate, endDate } = getYearToDateRange()

// Default query for monthly summary metrics
const MONTHLY_SUMMARY_QUERY = `
SELECT
  DATE_TRUNC('month', eventTimestamp) AS month,
  eventSubType,
  eventMessage,
  JSONExtractString(eventMetaData, 'origin-platform') as origin,
  COUNT(*) AS event_count
FROM
  dwh.custom_metrics
WHERE
  serviceEnvironment = 'prod' AND
  eventType = 'TEXT_COMMUNICATION' AND
  (
    eventSubType IN ('TEXT_MESSAGE_INITIATED','TEXT_DELIVERY_FAILURE')
    OR (eventSubType = 'GTC_MESSAGE_INITIATED')
  ) AND
  eventTimestamp >= '${startDate}' AND
  eventTimestamp <= '${endDate}'
GROUP BY
  DATE_TRUNC('month', eventTimestamp), eventSubType, eventMessage, origin
ORDER BY
  month, event_count DESC;
`

// API client for making requests
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

// Set authentication headers if available
if (typeof window !== "undefined") {
  const token = localStorage.getItem("tekion-api-token")
  const userId = localStorage.getItem("userId")
  const tenantId = localStorage.getItem("tenantId")
  const tenantName = localStorage.getItem("tenantName")
  const dealerId = localStorage.getItem("dealerId")
  const roleId = localStorage.getItem("roleId")

  if (token) apiClient.defaults.headers.common["tekion-api-token"] = token
  if (userId) {
    apiClient.defaults.headers.common["userid"] = userId
    apiClient.defaults.headers.common["original-userid"] = userId
  }
  if (tenantId)
    apiClient.defaults.headers.common["original-tenantid"] = tenantId
  if (tenantName) apiClient.defaults.headers.common["tenantname"] = tenantName
  if (dealerId) apiClient.defaults.headers.common["dealerid"] = dealerId
  if (roleId) apiClient.defaults.headers.common["roleid"] = roleId
}

// Function to fetch monthly summary metrics
export async function fetchMonthlySummaryData(customQuery) {
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
      query: customQuery || MONTHLY_SUMMARY_QUERY,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("Monthly Summary API Request Payload:", payload)

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log("Monthly Summary API Response:", response.data)

    return response.data.data.data
  } catch (error) {
    console.error("Error fetching monthly summary data:", error)
    throw error
  }
}

// Function to fetch all pages of monthly summary data
export async function fetchAllPagesOfMonthlySummaryData(customQuery) {
  try {
    // For development/testing with sample data
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Using sample data for monthly summary")

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
      query: customQuery || MONTHLY_SUMMARY_QUERY,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("Initial Monthly Summary API Request Payload:", payload)

    let response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    // Add the first page of data
    let allData = [...response.data.data.data]

    // Get pagination info from the response
    let nextToken = response.data.data.nextToken
    const queryExecutionId = response.data.data.queryExecutionId

    console.log("Initial monthly summary response nextToken:", nextToken)

    // Continue fetching pages until nextToken is null
    while (nextToken) {
      console.log(
        `Fetching next page of monthly summary with token: ${nextToken}`
      )

      // Prepare the next request with pagination info
      const nextPayload = {
        query: customQuery || MONTHLY_SUMMARY_QUERY,
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
      console.log("Updated monthly summary nextToken:", nextToken)
    }

    console.log(
      `Fetched a total of ${allData.length} monthly summary items across all pages`
    )
    return allData
  } catch (error) {
    console.error("Error fetching all pages of monthly summary data:", error)
    throw error
  }
}

// Function to process monthly summary data
export function processMonthlySummaryData(data) {
  // Group data by month
  const groupedData = {}

  data.forEach(item => {
    const month = item.month

    if (!groupedData[month]) {
      groupedData[month] = {
        month,
        threadConnectorInitiated: 0,
        threadConnectorSuccess: 0,
        tmsInitiated: 0,
        gtcInitiated: 0,
        apiFailures: 0,
        deliveryFailures: 0
      }
    }

    // Count by message types
    if (item.eventSubType === "TEXT_MESSAGE_INITIATED") {
      const count = parseInt(item.event_count)
      const origin = item.origin || ""
      const originUpper = origin.toUpperCase()

      if (item.eventMessage === "USER_NOT_MAPPED" && origin === "") {
        // TEXT_MESSAGE_INITIATED with USER_NOT_MAPPED and empty origin goes to THREADS FAILURE, THREADS API_FAILURE
        // We don't have a separate counter for THREADS API_FAILURE in the current data structure
        // This would need to be added if we want to track it separately
        // For now, we'll count it as a general failure
        groupedData[month].apiFailures += count
      } else if (item.eventMessage === "THREAD_CONNECTOR_MESSAGE_INITIATED") {
        // THREAD_CONNECTOR_MESSAGE_INITIATED always goes to THREADS Total
        groupedData[month].threadConnectorInitiated += count
      } else if (item.eventMessage === "THREAD_CONNECTOR_MESSAGE_SUCCESS") {
        // THREAD_CONNECTOR_MESSAGE_SUCCESS always goes to THREADS Success
        groupedData[month].threadConnectorSuccess += count
      } else if (item.eventMessage === "TMS_MESSAGE_INITIATED") {
        if (originUpper === "THREADS") {
          // TMS_MESSAGE_INITIATED with THREADS origin goes to THREADS Total
          groupedData[month].threadConnectorInitiated += count
        } else {
          // TMS_MESSAGE_INITIATED with any other origin goes to NON-THREADS Total
          groupedData[month].tmsInitiated += count
        }
      } else if (item.eventMessage === "GTC_MESSAGE_INITIATED") {
        if (originUpper === "THREADS") {
          // GTC_MESSAGE_INITIATED with THREADS origin goes to THREADS Total
          groupedData[month].threadConnectorInitiated += count
        } else {
          // GTC_MESSAGE_INITIATED with any other origin goes to NON-THREADS Total
          groupedData[month].gtcInitiated += count
        }
      } else if (
        item.eventMessage === "GTC_MESSAGE_INITIATION_SUCCESS" &&
        originUpper === "THREADS"
      ) {
        // GTC_MESSAGE_INITIATION_SUCCESS with THREADS origin goes to THREADS Success
        groupedData[month].threadConnectorSuccess += count
      }
    }
    // Count failures by type
    else if (item.eventSubType === "TEXT_DELIVERY_FAILURE") {
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
          groupedData[month].apiFailures += count
        }
      } else if (item.eventMessage === "DELIVERY_FAILURE") {
        if (originUpper === "THREADS") {
          // DELIVERY_FAILURE with THREADS origin goes to THREADS TOTAL
          // We don't have a separate counter for THREADS DELIVERY_FAILURE in the current data structure
          // This would need to be added if we want to track it separately
        } else {
          // DELIVERY_FAILURE with any other origin goes to NON-THREADS TOTAL, NON-THREADS DELIVERY_FAILURE
          groupedData[month].deliveryFailures += count
        }
      }
    }
  })

  // Calculate derived metrics
  return Object.values(groupedData)
    .map(metric => {
      // Thread connector metrics
      const threadConnectorTotal = metric.threadConnectorInitiated
      const threadConnectorSuccess = metric.threadConnectorSuccess
      const threadConnectorFailure =
        threadConnectorTotal - threadConnectorSuccess
      const threadConnectorFailureRate =
        threadConnectorTotal > 0
          ? ((threadConnectorFailure / threadConnectorTotal) * 100).toFixed(2) +
            "%"
          : "0%"

      // TMS and GTC metrics
      const tmsTotal = metric.tmsInitiated
      const gtcTotal = metric.gtcInitiated
      const nonThreadsTotal = tmsTotal + gtcTotal

      // Failure metrics
      const apiFailures = metric.apiFailures
      const deliveryFailures = metric.deliveryFailures
      const totalNonThreadsFailure = apiFailures + deliveryFailures
      const nonThreadsSuccess = nonThreadsTotal - totalNonThreadsFailure

      // Failure rates
      const nonThreadsFailureRate =
        nonThreadsTotal > 0
          ? ((totalNonThreadsFailure / nonThreadsTotal) * 100).toFixed(2) + "%"
          : "0%"

      const apiFailureRate =
        nonThreadsTotal > 0
          ? ((apiFailures / nonThreadsTotal) * 100).toFixed(2) + "%"
          : "0%"

      const deliveryFailureRate =
        nonThreadsTotal > 0
          ? ((deliveryFailures / nonThreadsTotal) * 100).toFixed(2) + "%"
          : "0%"

      // Create and return the processed metrics object
      return {
        month: metric.month,
        threadConnectorTotal,
        threadConnectorSuccess,
        threadConnectorFailure,
        threadConnectorFailureRate,
        tmsTotal,
        gtcTotal,
        nonThreadsTotal,
        apiFailures,
        deliveryFailures,
        totalNonThreadsFailure,
        nonThreadsSuccess,
        nonThreadsFailureRate,
        apiFailureRate,
        deliveryFailureRate
      }
    })
    .sort((a, b) => a.month.localeCompare(b.month))
}
