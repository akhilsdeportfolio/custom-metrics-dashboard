import axios from "axios"
import {
  getCurrentMonthRange,
  getDefaultTimeRange,
  dateTimeToEpoch
} from "../utils/dateUtils"

// API endpoint for Clickhouse queries
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "https://app.tekioncloud.com/api/apmserving/u/v1/query/clickhouse/raw"

// Get Current Month range
const { startDate, endDate } = getCurrentMonthRange()
// Get default time range
const { startTime, endTime } = getDefaultTimeRange()

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

// Function to generate current year's monthly data (THREADS only)
function generateCurrentYearMonthlyData() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() // 0-11
  const months = []

  // Generate data for each month from January to current month
  for (let i = 0; i <= currentMonth; i++) {
    const monthDate = new Date(currentYear, i, 1)
    const monthStr = monthDate.toISOString().substring(0, 10) // YYYY-MM-DD
    const formattedMonth =
      monthDate.toLocaleString("default", { month: "short" }) +
      " " +
      currentYear

    // Generate random metrics with some variation (THREADS origin with both GTC and Twilio)
    const threadsInitiated = 1000 + Math.floor(Math.random() * 1000)
    const threadsSuccess = threadsInitiated - Math.floor(Math.random() * 200)
    const threadsFailure = threadsInitiated - threadsSuccess
    const threadsApiFailure = Math.floor(threadsFailure * 0.6)
    const threadsDeliveryFailure = threadsFailure - threadsApiFailure
    const threadsFailureRate =
      ((threadsFailure / threadsInitiated) * 100).toFixed(1) + "%"

    // Twilio metrics - let query determine actual values (likely 0 due to GTC filter)
    const twilioInitiated = Math.floor(Math.random() * 100) // Query will determine actual value
    const twilioSuccess = Math.max(
      0,
      twilioInitiated - Math.floor(Math.random() * 20)
    )
    const twilioFailure = twilioInitiated - twilioSuccess
    const twilioApiFailure = Math.floor(twilioFailure * 0.6)
    const twilioDeliveryFailure = twilioFailure - twilioApiFailure
    const twilioFailureRate =
      twilioInitiated > 0
        ? ((twilioFailure / twilioInitiated) * 100).toFixed(1) + "%"
        : "0%"

    // For Command Centre, totals include whatever query returns (GTC + any Twilio)
    const totalInitiated = threadsInitiated + twilioInitiated
    const totalSuccess = threadsSuccess + twilioSuccess
    const totalFailure = threadsFailure + twilioFailure
    const totalFailureRate =
      totalInitiated > 0
        ? ((totalFailure / totalInitiated) * 100).toFixed(1) + "%"
        : "0%"

    months.push({
      month: monthStr,
      formattedMonth,
      // GTC - CRM Threads (THREADS origin)
      threadsInitiated,
      threadsSuccess,
      threadsFailure,
      threadsApiFailure,
      threadsDeliveryFailure,
      threadsFailureRate,
      // Twilio - Non CRM (THREADS origin)
      twilioInitiated,
      twilioSuccess,
      twilioFailure,
      twilioApiFailure,
      twilioDeliveryFailure,
      twilioFailureRate,
      // Totals (THREADS origin - GTC + Twilio)
      totalInitiated,
      totalSuccess,
      totalFailure,
      totalFailureRate
    })
  }

  // Sort in reverse chronological order (newest first)
  return months.reverse()
}

// Generate mock monthly data with current year's months
export const mockMonthlyMetricsData = generateCurrentYearMonthlyData()

// Function to generate realistic tenant/dealer data (THREADS only)
function generateTenantDealerData() {
  // Create an array of realistic tenant IDs
  const tenantIds = [
    "tekion-us-prod",
    "tekion-ca-prod",
    "tekion-eu-prod",
    "tekion-uk-prod",
    "tekion-au-prod",
    "tekion-in-prod"
  ]

  // Create an array of realistic dealer IDs for each tenant
  const dealersByTenant = {
    "tekion-us-prod": [
      "dealer-10001",
      "dealer-10002",
      "dealer-10003",
      "dealer-10004"
    ],
    "tekion-ca-prod": ["dealer-20001", "dealer-20002", "dealer-20003"],
    "tekion-eu-prod": ["dealer-30001", "dealer-30002"],
    "tekion-uk-prod": ["dealer-40001", "dealer-40002", "dealer-40003"],
    "tekion-au-prod": ["dealer-50001"],
    "tekion-in-prod": ["dealer-60001", "dealer-60002"]
  }

  const result = []

  // Generate data for each tenant and dealer
  tenantIds.forEach(tenantId => {
    const dealers = dealersByTenant[tenantId] || []

    dealers.forEach(dealerId => {
      // Generate random metrics with some variation (THREADS origin with both GTC and Twilio)
      const threadsInitiated = 1000 + Math.floor(Math.random() * 5000)
      const threadsSuccess = threadsInitiated - Math.floor(Math.random() * 500)
      const threadsFailure = threadsInitiated - threadsSuccess
      const threadsApiFailure = Math.floor(threadsFailure * 0.6)
      const threadsDeliveryFailure = threadsFailure - threadsApiFailure
      const threadsFailureRate =
        ((threadsFailure / threadsInitiated) * 100).toFixed(1) + "%"

      // Twilio metrics - let query determine actual values
      const twilioInitiated = Math.floor(Math.random() * 500)
      const twilioSuccess = Math.max(
        0,
        twilioInitiated - Math.floor(Math.random() * 100)
      )
      const twilioFailure = twilioInitiated - twilioSuccess
      const twilioApiFailure = Math.floor(twilioFailure * 0.6)
      const twilioDeliveryFailure = twilioFailure - twilioApiFailure
      const twilioFailureRate =
        twilioInitiated > 0
          ? ((twilioFailure / twilioInitiated) * 100).toFixed(1) + "%"
          : "0%"

      // For Command Centre, totals are just GTC (since Twilio is 0 for THREADS origin)
      const totalInitiated = threadsInitiated + twilioInitiated // = threadsInitiated
      const totalSuccess = threadsSuccess + twilioSuccess // = threadsSuccess
      const totalFailure = threadsFailure + twilioFailure // = threadsFailure
      const totalFailureRate =
        ((totalFailure / totalInitiated) * 100).toFixed(1) + "%"

      result.push({
        tenantId,
        dealerId,
        // GTC - CRM Threads (THREADS origin)
        threadsInitiated,
        threadsSuccess,
        threadsFailure,
        threadsApiFailure,
        threadsDeliveryFailure,
        threadsFailureRate,
        // Twilio - Non CRM (THREADS origin)
        twilioInitiated,
        twilioSuccess,
        twilioFailure,
        twilioApiFailure,
        twilioDeliveryFailure,
        twilioFailureRate,
        // Totals (THREADS origin - GTC + Twilio)
        totalInitiated,
        totalSuccess,
        totalFailure,
        totalFailureRate
      })
    })
  })

  return result
}

// Generate mock tenant/dealer data
export const mockTenantDealerMetricsData = generateTenantDealerData()

// Function to fetch monthly metrics data (THREADS only)
export async function fetchMonthlyMetricsData(filters) {
  try {
    // Using real data - mock data disabled

    // For production, make the actual API call
    const query = buildMonthlyMetricsQuery(filters)

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("Command Centre Monthly Metrics API Request Payload:", payload)

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log("Command Centre Monthly Metrics API Response:", response.data)

    // Process the raw data into our structured format
    const processedData = processRawMonthlyMetricsData(response.data.data.data)
    return processedData
  } catch (error) {
    console.error("Error fetching command centre monthly metrics data:", error)
    throw error
  }
}

// Function to fetch tenant/dealer metrics data (THREADS only)
export async function fetchTenantDealerMetricsData(filters) {
  try {
    // Using real data - mock data disabled

    // For production, make the actual API call
    const query = buildTenantDealerMetricsQuery(filters)

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log(
      "Command Centre Tenant/Dealer Metrics API Request Payload:",
      payload
    )

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log(
      "Command Centre Tenant/Dealer Metrics API Response:",
      response.data
    )

    // Process the raw data into our structured format
    const processedData = processRawTenantDealerMetricsData(
      response.data.data.data
    )
    return processedData
  } catch (error) {
    console.error(
      "Error fetching command centre tenant/dealer metrics data:",
      error
    )
    throw error
  }
}

// Helper functions to build queries and process data (THREADS only)
function buildMonthlyMetricsQuery(filters) {
  // Convert date and time to epoch timestamps
  const startEpoch = dateTimeToEpoch(
    filters?.startDate || startDate,
    filters?.startTime || startTime
  )

  const endEpoch = dateTimeToEpoch(
    filters?.endDate || endDate,
    filters?.endTime || endTime
  )

  const dateFilter = `
    toUnixTimestamp(eventTimestamp) >= ${startEpoch} AND
    toUnixTimestamp(eventTimestamp) <= ${endEpoch}
  `

  return `
  SELECT
    DATE_TRUNC('month', eventTimestamp) AS month,
    eventSubType,
    eventMessage,
    JSONExtractString(eventMetaData, 'origin-platform') AS origin,
    CASE
      WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
           JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
           JSONExtractString(eventMetaData, 'messageId') = '' AND
           eventMessage <> 'TMS_MESSAGE_INITIATED'
      THEN 'GTC'
      ELSE 'TWILLIO'
    END AS providerType,
    COUNT(*) AS count
  FROM
    dwh.custom_metrics
  WHERE
    serviceEnvironment LIKE 'prod%' AND
    eventType = 'TEXT_COMMUNICATION' AND
    JSONExtractString(eventMetaData, 'origin-platform') = 'THREADS' AND
    (CASE
      WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
           JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
           JSONExtractString(eventMetaData, 'messageId') = '' AND
           eventMessage <> 'TMS_MESSAGE_INITIATED'
      THEN 'GTC'
      ELSE 'TWILLIO'
    END) = 'GTC' AND
    ${dateFilter}
  GROUP BY
    month, eventSubType, eventMessage, origin, providerType
  ORDER BY
    month DESC, count DESC;
  `
}

function buildTenantDealerMetricsQuery(filters) {
  // Convert date and time to epoch timestamps
  const startEpoch = dateTimeToEpoch(
    filters?.startDate || startDate,
    filters?.startTime || startTime
  )

  const endEpoch = dateTimeToEpoch(
    filters?.endDate || endDate,
    filters?.endTime || endTime
  )

  const dateFilter = `
    toUnixTimestamp(eventTimestamp) >= ${startEpoch} AND
    toUnixTimestamp(eventTimestamp) <= ${endEpoch}
  `

  const tenantFilter = filters?.tenantId
    ? `AND tenantId = '${filters.tenantId}'`
    : ""
  const dealerFilter = filters?.dealerId
    ? `AND dealerId = '${filters.dealerId}'`
    : ""

  return `
  SELECT
    tenantId,
    dealerId,
    eventSubType,
    eventMessage,
    JSONExtractString(eventMetaData, 'origin-platform') AS origin,
    CASE
      WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
           JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
           JSONExtractString(eventMetaData, 'messageId') = '' AND
           eventMessage <> 'TMS_MESSAGE_INITIATED'
      THEN 'GTC'
      ELSE 'TWILLIO'
    END AS providerType,
    COUNT(*) AS count
  FROM
    dwh.custom_metrics
  WHERE
    serviceEnvironment LIKE 'prod%' AND
    eventType = 'TEXT_COMMUNICATION' AND
    JSONExtractString(eventMetaData, 'origin-platform') = 'THREADS' AND
    (CASE
      WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
           JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
           JSONExtractString(eventMetaData, 'messageId') = '' AND
           eventMessage <> 'TMS_MESSAGE_INITIATED'
      THEN 'GTC'
      ELSE 'TWILLIO'
    END) = 'GTC' AND
    ${dateFilter}
    ${tenantFilter}
    ${dealerFilter}
  GROUP BY
    tenantId, dealerId, eventSubType, eventMessage, origin, providerType
  ORDER BY
    tenantId, dealerId, count DESC;
  `
}

function processRawMonthlyMetricsData(rawData) {
  // Group data by month
  const groupedByMonth = {}

  // Process each row from the raw data
  rawData.forEach(row => {
    const month = row.month
    const eventSubType = row.eventSubType
    const eventMessage = row.eventMessage
    const providerType = row.providerType
    const count = parseInt(row.count, 10)

    // Initialize month data if it doesn't exist
    if (!groupedByMonth[month]) {
      const monthDate = new Date(month)
      const formattedMonth =
        monthDate.toLocaleString("default", { month: "short" }) +
        " " +
        monthDate.getFullYear()

      groupedByMonth[month] = {
        month,
        formattedMonth,
        // GTC - CRM Threads (THREADS origin)
        threadsInitiated: 0,
        threadsSuccess: 0,
        threadsFailure: 0,
        threadsApiFailure: 0,
        threadsDeliveryFailure: 0,
        // Twilio - Non CRM (THREADS origin)
        twilioInitiated: 0,
        twilioSuccess: 0,
        twilioFailure: 0,
        twilioApiFailure: 0,
        twilioDeliveryFailure: 0
      }
    }

    // Process the row based on event type and origin (ALL GTC data - THREADS and NON-THREADS)
    // GTC metrics (all origins)
    if (
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "THREAD_CONNECTOR_MESSAGE_INITIATED") ||
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "GTC_MESSAGE_INITIATED")
    ) {
      groupedByMonth[month].threadsInitiated += count
    } else if (
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "THREAD_CONNECTOR_MESSAGE_SUCCESS") ||
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "GTC_MESSAGE_INITIATION_SUCCESS")
    ) {
      groupedByMonth[month].threadsSuccess += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "API_FAILURE" &&
      providerType === "GTC"
    ) {
      groupedByMonth[month].threadsApiFailure += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "DELIVERY_FAILURE" &&
      providerType === "GTC"
    ) {
      groupedByMonth[month].threadsDeliveryFailure += count
    }
    // TWILIO metrics (query will return 0 due to GTC filter, but keep logic for completeness)
    else if (
      eventSubType === "TEXT_MESSAGE_INITIATED" &&
      eventMessage === "TMS_MESSAGE_INITIATED"
    ) {
      groupedByMonth[month].twilioInitiated += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "API_FAILURE" &&
      providerType === "TWILLIO"
    ) {
      groupedByMonth[month].twilioApiFailure += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "DELIVERY_FAILURE" &&
      providerType === "TWILLIO"
    ) {
      groupedByMonth[month].twilioDeliveryFailure += count
    }
  })

  // Calculate derived metrics for each month
  const result = Object.values(groupedByMonth).map(monthData => {
    // Calculate failures and success counts
    const threadsFailure =
      monthData.threadsApiFailure + monthData.threadsDeliveryFailure
    const twilioFailure =
      monthData.twilioApiFailure + monthData.twilioDeliveryFailure

    const twilioSuccess = Math.max(0, monthData.twilioInitiated - twilioFailure)

    // Calculate totals (THREADS origin - GTC + Twilio)
    const totalInitiated =
      monthData.threadsInitiated + monthData.twilioInitiated
    const totalSuccess = monthData.threadsSuccess + twilioSuccess
    const totalFailure = threadsFailure + twilioFailure

    // Calculate failure rates
    const threadsFailureRate =
      monthData.threadsInitiated > 0
        ? ((threadsFailure / monthData.threadsInitiated) * 100).toFixed(1) + "%"
        : "0%"

    const twilioFailureRate =
      monthData.twilioInitiated > 0
        ? ((twilioFailure / monthData.twilioInitiated) * 100).toFixed(1) + "%"
        : "0%"

    const totalFailureRate =
      totalInitiated > 0
        ? ((totalFailure / totalInitiated) * 100).toFixed(1) + "%"
        : "0%"

    return {
      ...monthData,
      threadsFailure,
      threadsFailureRate,
      twilioSuccess,
      twilioFailure,
      twilioFailureRate,
      totalInitiated,
      totalSuccess,
      totalFailure,
      totalFailureRate
    }
  })

  // Sort by month in descending order (newest first)
  return result.sort(
    (a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()
  )
}

function processRawTenantDealerMetricsData(rawData) {
  // Group data by tenant and dealer
  const groupedByTenantDealer = {}

  // Process each row from the raw data
  rawData.forEach(row => {
    const tenantId = row.tenantId
    const dealerId = row.dealerId
    const key = `${tenantId}|${dealerId}`
    const eventSubType = row.eventSubType
    const eventMessage = row.eventMessage
    const providerType = row.providerType
    const count = parseInt(row.count, 10)

    // Initialize tenant/dealer data if it doesn't exist
    if (!groupedByTenantDealer[key]) {
      groupedByTenantDealer[key] = {
        tenantId,
        dealerId,
        // GTC - CRM Threads (THREADS origin)
        threadsInitiated: 0,
        threadsSuccess: 0,
        threadsFailure: 0,
        threadsApiFailure: 0,
        threadsDeliveryFailure: 0,
        // Twilio - Non CRM (THREADS origin)
        twilioInitiated: 0,
        twilioSuccess: 0,
        twilioFailure: 0,
        twilioApiFailure: 0,
        twilioDeliveryFailure: 0
      }
    }

    // Process the row based on event type and origin (ALL GTC data - THREADS and NON-THREADS)
    // GTC metrics (all origins)
    if (
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "THREAD_CONNECTOR_MESSAGE_INITIATED") ||
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "GTC_MESSAGE_INITIATED")
    ) {
      groupedByTenantDealer[key].threadsInitiated += count
    } else if (
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "THREAD_CONNECTOR_MESSAGE_SUCCESS") ||
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "GTC_MESSAGE_INITIATION_SUCCESS")
    ) {
      groupedByTenantDealer[key].threadsSuccess += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "API_FAILURE" &&
      providerType === "GTC"
    ) {
      groupedByTenantDealer[key].threadsApiFailure += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "DELIVERY_FAILURE" &&
      providerType === "GTC"
    ) {
      groupedByTenantDealer[key].threadsDeliveryFailure += count
    }
    // TWILIO metrics (query will return 0 due to GTC filter, but keep logic for completeness)
    else if (
      eventSubType === "TEXT_MESSAGE_INITIATED" &&
      eventMessage === "TMS_MESSAGE_INITIATED"
    ) {
      groupedByTenantDealer[key].twilioInitiated += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "API_FAILURE" &&
      providerType === "TWILLIO"
    ) {
      groupedByTenantDealer[key].twilioApiFailure += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "DELIVERY_FAILURE" &&
      providerType === "TWILLIO"
    ) {
      groupedByTenantDealer[key].twilioDeliveryFailure += count
    }
    // No Twilio processing - Command Centre only shows GTC data
  })

  // Calculate derived metrics for each tenant/dealer
  const result = Object.values(groupedByTenantDealer).map(tdData => {
    // Calculate failures and success counts
    const threadsFailure =
      tdData.threadsApiFailure + tdData.threadsDeliveryFailure
    const twilioFailure = tdData.twilioApiFailure + tdData.twilioDeliveryFailure

    const twilioSuccess = Math.max(0, tdData.twilioInitiated - twilioFailure)

    // Calculate totals (THREADS origin - GTC + Twilio)
    const totalInitiated = tdData.threadsInitiated + tdData.twilioInitiated
    const totalSuccess = tdData.threadsSuccess + twilioSuccess
    const totalFailure = threadsFailure + twilioFailure

    // Calculate failure rates
    const threadsFailureRate =
      tdData.threadsInitiated > 0
        ? ((threadsFailure / tdData.threadsInitiated) * 100).toFixed(1) + "%"
        : "0%"

    const twilioFailureRate =
      tdData.twilioInitiated > 0
        ? ((twilioFailure / tdData.twilioInitiated) * 100).toFixed(1) + "%"
        : "0%"

    const totalFailureRate =
      totalInitiated > 0
        ? ((totalFailure / totalInitiated) * 100).toFixed(1) + "%"
        : "0%"

    return {
      ...tdData,
      threadsFailure,
      threadsFailureRate,
      twilioSuccess,
      twilioFailure,
      twilioFailureRate,
      totalInitiated,
      totalSuccess,
      totalFailure,
      totalFailureRate
    }
  })

  // Sort by tenant ID and dealer ID
  return result.sort((a, b) => {
    if (a.tenantId !== b.tenantId) {
      return a.tenantId.localeCompare(b.tenantId)
    }
    return a.dealerId.localeCompare(b.dealerId)
  })
}

// Function to calculate summary metrics for monthly data (THREADS origin with GTC + Twilio)
export function calculateMonthlySummaryMetrics(data) {
  // Calculate totals across all months (THREADS origin)
  const totalThreadsInitiated = data.reduce(
    (sum, item) => sum + item.threadsInitiated,
    0
  )
  const totalThreadsSuccess = data.reduce(
    (sum, item) => sum + item.threadsSuccess,
    0
  )
  const totalThreadsFailure = data.reduce(
    (sum, item) => sum + item.threadsFailure,
    0
  )
  const totalThreadsApiFailure = data.reduce(
    (sum, item) => sum + item.threadsApiFailure,
    0
  )
  const totalThreadsDeliveryFailure = data.reduce(
    (sum, item) => sum + item.threadsDeliveryFailure,
    0
  )

  const totalTwilioInitiated = data.reduce(
    (sum, item) => sum + item.twilioInitiated,
    0
  )
  const totalTwilioSuccess = data.reduce(
    (sum, item) => sum + item.twilioSuccess,
    0
  )
  const totalTwilioFailure = data.reduce(
    (sum, item) => sum + item.twilioFailure,
    0
  )
  const totalTwilioApiFailure = data.reduce(
    (sum, item) => sum + item.twilioApiFailure,
    0
  )
  const totalTwilioDeliveryFailure = data.reduce(
    (sum, item) => sum + item.twilioDeliveryFailure,
    0
  )

  // Calculate overall totals (THREADS origin - GTC + Twilio)
  const totalInitiated = totalThreadsInitiated + totalTwilioInitiated
  const totalSuccess = totalThreadsSuccess + totalTwilioSuccess
  const totalFailure = totalThreadsFailure + totalTwilioFailure

  // Calculate failure rates
  const threadsFailureRate =
    totalThreadsInitiated > 0
      ? ((totalThreadsFailure / totalThreadsInitiated) * 100).toFixed(1) + "%"
      : "0%"

  const twilioFailureRate =
    totalTwilioInitiated > 0
      ? ((totalTwilioFailure / totalTwilioInitiated) * 100).toFixed(1) + "%"
      : "0%"

  const totalFailureRate =
    totalInitiated > 0
      ? ((totalFailure / totalInitiated) * 100).toFixed(1) + "%"
      : "0%"

  return {
    totalThreadsInitiated,
    totalThreadsSuccess,
    totalThreadsFailure,
    totalThreadsApiFailure,
    totalThreadsDeliveryFailure,
    threadsFailureRate,

    totalTwilioInitiated,
    totalTwilioSuccess,
    totalTwilioFailure,
    totalTwilioApiFailure,
    totalTwilioDeliveryFailure,
    twilioFailureRate,

    totalInitiated,
    totalSuccess,
    totalFailure,
    totalFailureRate
  }
}

// Function to calculate summary metrics for tenant/dealer data (THREADS only)
export function calculateTenantDealerSummaryMetrics(data) {
  // This is similar to the monthly summary calculation
  return calculateMonthlySummaryMetrics(data)
}
