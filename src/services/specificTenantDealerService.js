import axios from "axios"
import { getCurrentMonthRange, dateTimeToEpoch } from "../utils/dateUtils"

// Get Current Month range
const { startDate, endDate } = getCurrentMonthRange()

// Convert to epoch timestamps
const startTimestamp = dateTimeToEpoch(startDate, "00:00")
const endTimestamp = dateTimeToEpoch(endDate, "23:59")

// API endpoint for Clickhouse queries
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "https://app.tekioncloud.com/api/apmserving/u/v1/query/clickhouse/raw"

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

/**
 * Fetch metrics for a specific tenant and optionally a specific dealer
 * @param tenantId The tenant ID to filter by
 * @param dealerId Optional dealer ID to filter by
 * @returns Promise with the processed metrics data
 */
export async function fetchSpecificTenantDealerMetrics(tenantId, dealerId) {
  try {
    console.log(
      `Fetching metrics for tenant ${tenantId}${
        dealerId ? ` and dealer ${dealerId}` : ""
      }`
    )

    // In development mode, return mock data
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock data in development mode")

      // If dealerId is not provided, generate mock data for multiple dealers
      if (!dealerId) {
        // Generate 3-5 random dealer IDs
        const numDealers = Math.floor(Math.random() * 3) + 3 // 3 to 5 dealers
        const mockDealers = []

        // Create a tenant total object to accumulate values
        const tenantTotal = generateMockSpecificTenantDealerMetrics(
          tenantId,
          ""
        )

        // Reset all numeric values to 0 for accumulation
        const numericKeys = [
          "threadsInitiated",
          "threadsSuccess",
          "threadsFailure",
          "threadsApiFailure",
          "threadsDeliveryFailure",
          "nonThreadsInitiated",
          "nonThreadsSuccess",
          "nonThreadsFailure",
          "nonThreadsApiFailure",
          "nonThreadsDeliveryFailure",
          "twilioInitiated",
          "twilioSuccess",
          "twilioFailure",
          "twilioApiFailure",
          "twilioDeliveryFailure",
          "totalInitiated",
          "totalMessages",
          "successMessages",
          "totalFailures",
          "apiFailures",
          "deliveryFailures",
          "threadConnectorTotal",
          "threadConnectorSuccess",
          "threadConnectorFailure"
        ]

        numericKeys.forEach(key => {
          if (typeof tenantTotal[key] === "number") {
            tenantTotal[key] = 0
          }
        })

        // Set dealerId to 'TOTAL' for the tenant total
        tenantTotal.dealerId = "TOTAL"

        // Add individual dealer metrics and accumulate totals
        for (let i = 1; i <= numDealers; i++) {
          const mockDealerId = `dealer${i}`
          const dealerMetrics = generateMockSpecificTenantDealerMetrics(
            tenantId,
            mockDealerId
          )
          mockDealers.push(dealerMetrics)

          // Accumulate values for tenant total
          const numericKeys = [
            "threadsInitiated",
            "threadsSuccess",
            "threadsFailure",
            "threadsApiFailure",
            "threadsDeliveryFailure",
            "nonThreadsInitiated",
            "nonThreadsSuccess",
            "nonThreadsFailure",
            "nonThreadsApiFailure",
            "nonThreadsDeliveryFailure",
            "twilioInitiated",
            "twilioSuccess",
            "twilioFailure",
            "twilioApiFailure",
            "twilioDeliveryFailure",
            "totalInitiated",
            "totalMessages",
            "successMessages",
            "totalFailures",
            "apiFailures",
            "deliveryFailures",
            "threadConnectorTotal",
            "threadConnectorSuccess",
            "threadConnectorFailure"
          ]

          numericKeys.forEach(key => {
            if (
              typeof dealerMetrics[key] === "number" &&
              typeof tenantTotal[key] === "number"
            ) {
              tenantTotal[key] = tenantTotal[key] + dealerMetrics[key]
            }
          })
        }

        // Recalculate percentages and rates for the tenant total
        if (
          tenantTotal.threadsInitiated &&
          tenantTotal.threadsInitiated > 0 &&
          tenantTotal.threadConnectorFailure
        ) {
          tenantTotal.threadsFailureRate =
            (
              (tenantTotal.threadConnectorFailure /
                tenantTotal.threadsInitiated) *
              100
            ).toFixed(1) + "%"
        }

        if (
          tenantTotal.nonThreadsInitiated &&
          tenantTotal.nonThreadsInitiated > 0 &&
          tenantTotal.nonThreadsFailure
        ) {
          tenantTotal.nonThreadsFailureRate =
            (
              (tenantTotal.nonThreadsFailure /
                tenantTotal.nonThreadsInitiated) *
              100
            ).toFixed(1) + "%"
        }

        if (
          tenantTotal.twilioInitiated &&
          tenantTotal.twilioInitiated > 0 &&
          tenantTotal.twilioFailure
        ) {
          tenantTotal.twilioFailureRate =
            (
              (tenantTotal.twilioFailure / tenantTotal.twilioInitiated) *
              100
            ).toFixed(1) + "%"
        }

        if (
          tenantTotal.totalInitiated &&
          tenantTotal.totalInitiated > 0 &&
          tenantTotal.totalFailures
        ) {
          tenantTotal.failureRate =
            (
              (tenantTotal.totalFailures / tenantTotal.totalInitiated) *
              100
            ).toFixed(1) + "%"
        }

        // Add the tenant total at the beginning of the array
        mockDealers.unshift(tenantTotal)

        return mockDealers
      }

      return generateMockSpecificTenantDealerMetrics(tenantId, dealerId)
    }

    // Build the SQL query
    const query = buildSpecificTenantDealerQuery(tenantId, dealerId)

    // Make the API request
    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("Specific Tenant/Dealer Metrics API Request Payload:", payload)

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log("Specific Tenant/Dealer Metrics API Response:", response.data)

    // Process the response data
    const rawData = response.data.data.data
    if (!rawData || rawData.length === 0) {
      console.log("No data returned from API")
      return []
    }

    // Process the raw data into the required format
    if (dealerId) {
      // If dealer ID is provided, return a single item array with that dealer's metrics
      const metrics = processRawSpecificTenantDealerMetrics(
        rawData,
        tenantId,
        dealerId
      )
      return metrics ? [metrics] : []
    } else {
      // If no dealer ID is provided, process data for all dealers and add a tenant total
      return processRawSpecificTenantDealerMetricsWithTotal(rawData, tenantId)
    }
  } catch (error) {
    console.error("Error fetching specific tenant/dealer metrics:", error)
    throw error
  }
}

/**
 * Build the SQL query for specific tenant/dealer metrics
 * @param tenantId The tenant ID to filter by
 * @param dealerId Optional dealer ID to filter by
 * @returns SQL query string
 */
function buildSpecificTenantDealerQuery(tenantId, dealerId) {
  // Convert date and time to epoch timestamps
  const dateFilter = `
    toUnixTimestamp(eventTimestamp) >= ${startTimestamp} AND
    toUnixTimestamp(eventTimestamp) <= ${endTimestamp}
  `

  // Add tenant and dealer filters
  const tenantFilter = `AND tenantId = '${tenantId}'`
  const dealerFilter = dealerId ? `AND dealerId = '${dealerId}'` : ""

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
    ${dateFilter}
    ${tenantFilter}
    ${dealerFilter}
  GROUP BY
    tenantId, dealerId, eventSubType, eventMessage, origin, providerType
  ORDER BY
    dealerId = 'TOTAL' DESC, tenantId, dealerId, count DESC;
  `
}

/**
 * Process raw metrics data into the required format
 * @param rawData Raw data from the API
 * @param tenantId The tenant ID
 * @param dealerId Optional dealer ID
 * @returns Processed metrics data
 */
function processRawSpecificTenantDealerMetrics(rawData, tenantId, dealerId) {
  // Group data by tenant and dealer
  const groupedByTenantDealer = {}

  // Process each row from the raw data
  rawData.forEach(row => {
    const rowTenantId = row.tenantId
    const rowDealerId = row.dealerId
    const key = `${rowTenantId}|${rowDealerId}`
    const eventSubType = row.eventSubType
    const eventMessage = row.eventMessage
    const origin = (row.origin || "").toUpperCase()
    const providerType = row.providerType
    const count = parseInt(row.count, 10)

    // Initialize tenant/dealer data if it doesn't exist
    if (!groupedByTenantDealer[key]) {
      groupedByTenantDealer[key] = {
        tenantId: rowTenantId,
        dealerId: rowDealerId,
        // GTC - CRM Threads
        threadsInitiated: 0,
        threadsSuccess: 0,
        threadsFailure: 0,
        threadsApiFailure: 0,
        threadsDeliveryFailure: 0,
        // GTC - CRM Non-Threads
        nonThreadsInitiated: 0,
        nonThreadsSuccess: 0,
        nonThreadsFailure: 0,
        nonThreadsApiFailure: 0,
        nonThreadsDeliveryFailure: 0,
        // Twilio - Non CRM
        twilioInitiated: 0,
        twilioSuccess: 0,
        twilioFailure: 0,
        twilioApiFailure: 0,
        twilioDeliveryFailure: 0
      }
    }

    // Process the row based on event type and origin
    // THREADS metrics
    if (
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "THREAD_CONNECTOR_MESSAGE_INITIATED") ||
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "GTC_MESSAGE_INITIATED" &&
        origin === "THREADS")
    ) {
      groupedByTenantDealer[key].threadsInitiated += count
    } else if (
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "THREAD_CONNECTOR_MESSAGE_SUCCESS") ||
      (eventSubType === "TEXT_MESSAGE_INITIATED" &&
        eventMessage === "GTC_MESSAGE_INITIATION_SUCCESS" &&
        origin === "THREADS")
    ) {
      groupedByTenantDealer[key].threadsSuccess += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "API_FAILURE" &&
      origin === "THREADS" &&
      providerType === "GTC"
    ) {
      groupedByTenantDealer[key].threadsApiFailure += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "DELIVERY_FAILURE" &&
      origin === "THREADS" &&
      providerType === "GTC"
    ) {
      groupedByTenantDealer[key].threadsDeliveryFailure += count
    }
    // NON-THREADS metrics
    else if (
      eventSubType === "TEXT_MESSAGE_INITIATED" &&
      eventMessage === "GTC_MESSAGE_INITIATED" &&
      origin !== "THREADS"
    ) {
      groupedByTenantDealer[key].nonThreadsInitiated += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "API_FAILURE" &&
      origin !== "THREADS" &&
      providerType === "GTC"
    ) {
      groupedByTenantDealer[key].nonThreadsApiFailure += count
    } else if (
      eventSubType === "TEXT_DELIVERY_FAILURE" &&
      eventMessage === "DELIVERY_FAILURE" &&
      origin !== "THREADS" &&
      providerType === "GTC"
    ) {
      groupedByTenantDealer[key].nonThreadsDeliveryFailure += count
    }
    // TWILIO metrics
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
  })

  // Get the first (and should be only) entry from the grouped data
  const tdData = Object.values(groupedByTenantDealer)[0] || {
    tenantId,
    dealerId: dealerId || "",
    threadsInitiated: 0,
    threadsSuccess: 0,
    threadsFailure: 0,
    threadsApiFailure: 0,
    threadsDeliveryFailure: 0,
    nonThreadsInitiated: 0,
    nonThreadsSuccess: 0,
    nonThreadsFailure: 0,
    nonThreadsApiFailure: 0,
    nonThreadsDeliveryFailure: 0,
    twilioInitiated: 0,
    twilioSuccess: 0,
    twilioFailure: 0,
    twilioApiFailure: 0,
    twilioDeliveryFailure: 0
  }

  // Calculate failures and success counts
  const threadsFailure =
    tdData.threadsApiFailure + tdData.threadsDeliveryFailure
  const nonThreadsFailure =
    tdData.nonThreadsApiFailure + tdData.nonThreadsDeliveryFailure
  const twilioFailure = tdData.twilioApiFailure + tdData.twilioDeliveryFailure

  const nonThreadsSuccess = Math.max(
    0,
    tdData.nonThreadsInitiated - nonThreadsFailure
  )
  const twilioSuccess = Math.max(0, tdData.twilioInitiated - twilioFailure)

  // Calculate totals
  const totalInitiated =
    tdData.threadsInitiated +
    tdData.nonThreadsInitiated +
    tdData.twilioInitiated
  const totalSuccess = tdData.threadsSuccess + nonThreadsSuccess + twilioSuccess
  const totalFailure = threadsFailure + nonThreadsFailure + twilioFailure

  // Calculate failure rates
  const threadsFailureRate =
    tdData.threadsInitiated > 0
      ? ((threadsFailure / tdData.threadsInitiated) * 100).toFixed(1) + "%"
      : "0%"

  const nonThreadsFailureRate =
    tdData.nonThreadsInitiated > 0
      ? ((nonThreadsFailure / tdData.nonThreadsInitiated) * 100).toFixed(1) +
        "%"
      : "0%"

  const twilioFailureRate =
    tdData.twilioInitiated > 0
      ? ((twilioFailure / tdData.twilioInitiated) * 100).toFixed(1) + "%"
      : "0%"

  const totalFailureRate =
    totalInitiated > 0
      ? ((totalFailure / totalInitiated) * 100).toFixed(1) + "%"
      : "0%"

  // Calculate additional metrics required by the ProcessedMetrics interface
  const successRate =
    totalInitiated > 0
      ? ((totalSuccess / totalInitiated) * 100).toFixed(1) + "%"
      : "0%"

  const apiFailures =
    tdData.threadsApiFailure +
    tdData.nonThreadsApiFailure +
    tdData.twilioApiFailure
  const deliveryFailures =
    tdData.threadsDeliveryFailure +
    tdData.nonThreadsDeliveryFailure +
    tdData.twilioDeliveryFailure

  const apiFailurePercentage =
    totalFailure > 0
      ? ((apiFailures / totalFailure) * 100).toFixed(1) + "%"
      : "0%"

  const deliveryFailurePercentage =
    totalFailure > 0
      ? ((deliveryFailures / totalFailure) * 100).toFixed(1) + "%"
      : "0%"

  const threadConnectorPercentage =
    totalInitiated > 0
      ? ((tdData.threadsInitiated / totalInitiated) * 100).toFixed(1) + "%"
      : "0%"

  const tmsPercentage =
    totalInitiated > 0
      ? ((tdData.twilioInitiated / totalInitiated) * 100).toFixed(1) + "%"
      : "0%"

  const gtcPercentage =
    totalInitiated > 0
      ? ((tdData.nonThreadsInitiated / totalInitiated) * 100).toFixed(1) + "%"
      : "0%"

  return {
    tenantId: tdData.tenantId,
    dealerId: tdData.dealerId,
    totalInitiated,
    totalMessages: totalInitiated,
    successMessages: totalSuccess,
    totalFailures: totalFailure,
    failureRate: totalFailureRate,
    successRate,
    apiFailures,
    deliveryFailures,
    apiFailurePercentage,
    deliveryFailurePercentage,
    threadConnectorTotal: tdData.threadsInitiated,
    threadConnectorSuccess: tdData.threadsSuccess,
    threadConnectorFailure: threadsFailure,
    threadConnectorFailureRate: threadsFailureRate,
    threadConnectorPercentage,
    tmsInitiated: tdData.twilioInitiated,
    tmsPercentage,
    gtcInitiated: tdData.nonThreadsInitiated,
    gtcPercentage,
    // Additional fields from TenantDealerMetrics
    threadsInitiated: tdData.threadsInitiated,
    threadsSuccess: tdData.threadsSuccess,
    threadsFailure,
    threadsApiFailure: tdData.threadsApiFailure,
    threadsDeliveryFailure: tdData.threadsDeliveryFailure,
    threadsFailureRate,
    nonThreadsInitiated: tdData.nonThreadsInitiated,
    nonThreadsSuccess,
    nonThreadsFailure,
    nonThreadsApiFailure: tdData.nonThreadsApiFailure,
    nonThreadsDeliveryFailure: tdData.nonThreadsDeliveryFailure,
    nonThreadsFailureRate,
    twilioInitiated: tdData.twilioInitiated,
    twilioSuccess,
    twilioFailure,
    twilioApiFailure: tdData.twilioApiFailure,
    twilioDeliveryFailure: tdData.twilioDeliveryFailure,
    twilioFailureRate,
    monthsArray: ["2025-01-01"] // Placeholder for compatibility
  }
}

/**
 * Generate mock data for development
 * @param tenantId The tenant ID
 * @param dealerId Optional dealer ID
 * @returns Mock metrics data
 */
/**
 * Process raw metrics data into multiple dealer metrics with a tenant total
 * @param rawData Raw data from the API
 * @param tenantId The tenant ID
 * @returns Array of processed metrics for each dealer and a tenant total
 */
function processRawSpecificTenantDealerMetricsWithTotal(rawData, tenantId) {
  // Group data by dealer ID
  const dealerGroups = {}

  // Group the raw data by dealerId
  rawData.forEach(row => {
    const dealerId = row.dealerId
    if (!dealerGroups[dealerId]) {
      dealerGroups[dealerId] = []
    }
    dealerGroups[dealerId].push(row)
  })

  // Process each dealer group
  const dealerMetrics = []

  // Create a tenant total object to accumulate values
  let tenantTotal = null

  // Process each dealer's data
  Object.entries(dealerGroups).forEach(([dealerId, dealerData]) => {
    const metrics = processRawSpecificTenantDealerMetrics(
      dealerData,
      tenantId,
      dealerId
    )
    if (metrics) {
      dealerMetrics.push(metrics)

      // Initialize tenant total with the first dealer's metrics structure
      if (tenantTotal === null) {
        tenantTotal = {
          ...metrics
        }
        // Reset all numeric values to 0 for accumulation
        const numericKeys = [
          "threadsInitiated",
          "threadsSuccess",
          "threadsFailure",
          "threadsApiFailure",
          "threadsDeliveryFailure",
          "nonThreadsInitiated",
          "nonThreadsSuccess",
          "nonThreadsFailure",
          "nonThreadsApiFailure",
          "nonThreadsDeliveryFailure",
          "twilioInitiated",
          "twilioSuccess",
          "twilioFailure",
          "twilioApiFailure",
          "twilioDeliveryFailure",
          "totalInitiated",
          "totalMessages",
          "successMessages",
          "totalFailures",
          "apiFailures",
          "deliveryFailures",
          "threadConnectorTotal",
          "threadConnectorSuccess",
          "threadConnectorFailure"
        ]

        numericKeys.forEach(key => {
          if (typeof tenantTotal[key] === "number") {
            tenantTotal[key] = 0
          }
        })
        tenantTotal.tenantId = tenantId
        tenantTotal.dealerId = "TOTAL"
      }

      // Accumulate values for tenant total
      const numericKeys = [
        "threadsInitiated",
        "threadsSuccess",
        "threadsFailure",
        "threadsApiFailure",
        "threadsDeliveryFailure",
        "nonThreadsInitiated",
        "nonThreadsSuccess",
        "nonThreadsFailure",
        "nonThreadsApiFailure",
        "nonThreadsDeliveryFailure",
        "twilioInitiated",
        "twilioSuccess",
        "twilioFailure",
        "twilioApiFailure",
        "twilioDeliveryFailure",
        "totalInitiated",
        "totalMessages",
        "successMessages",
        "totalFailures",
        "apiFailures",
        "deliveryFailures",
        "threadConnectorTotal",
        "threadConnectorSuccess",
        "threadConnectorFailure"
      ]

      numericKeys.forEach(key => {
        if (
          typeof metrics[key] === "number" &&
          typeof tenantTotal[key] === "number"
        ) {
          tenantTotal[key] = tenantTotal[key] + metrics[key]
        }
      })
    }
  })

  // Recalculate percentages and rates for the tenant total
  if (tenantTotal !== null) {
    // Calculate failures and success counts
    const threadsApiFailure = tenantTotal.threadsApiFailure || 0
    const threadsDeliveryFailure = tenantTotal.threadsDeliveryFailure || 0
    const nonThreadsApiFailure = tenantTotal.nonThreadsApiFailure || 0
    const nonThreadsDeliveryFailure = tenantTotal.nonThreadsDeliveryFailure || 0
    const twilioApiFailure = tenantTotal.twilioApiFailure || 0
    const twilioDeliveryFailure = tenantTotal.twilioDeliveryFailure || 0

    const threadsFailure = threadsApiFailure + threadsDeliveryFailure
    const nonThreadsFailure = nonThreadsApiFailure + nonThreadsDeliveryFailure
    const twilioFailure = twilioApiFailure + twilioDeliveryFailure

    const nonThreadsInitiated = tenantTotal.nonThreadsInitiated || 0
    const twilioInitiated = tenantTotal.twilioInitiated || 0

    const nonThreadsSuccess = Math.max(
      0,
      nonThreadsInitiated - nonThreadsFailure
    )
    const twilioSuccess = Math.max(0, twilioInitiated - twilioFailure)

    // Update the tenant total with calculated values
    tenantTotal.threadsFailure = threadsFailure
    tenantTotal.nonThreadsFailure = nonThreadsFailure
    tenantTotal.twilioFailure = twilioFailure
    tenantTotal.nonThreadsSuccess = nonThreadsSuccess
    tenantTotal.twilioSuccess = twilioSuccess

    // Calculate failure rates
    const threadsInitiated = tenantTotal.threadsInitiated || 0
    tenantTotal.threadsFailureRate =
      threadsInitiated > 0
        ? ((threadsFailure / threadsInitiated) * 100).toFixed(1) + "%"
        : "0%"

    tenantTotal.nonThreadsFailureRate =
      nonThreadsInitiated > 0
        ? ((nonThreadsFailure / nonThreadsInitiated) * 100).toFixed(1) + "%"
        : "0%"

    tenantTotal.twilioFailureRate =
      twilioInitiated > 0
        ? ((twilioFailure / twilioInitiated) * 100).toFixed(1) + "%"
        : "0%"

    const totalInitiated = tenantTotal.totalInitiated || 0
    const totalFailures = tenantTotal.totalFailures || 0
    tenantTotal.failureRate =
      totalInitiated > 0
        ? ((totalFailures / totalInitiated) * 100).toFixed(1) + "%"
        : "0%"

    // Add the tenant total at the beginning of the array
    dealerMetrics.unshift(tenantTotal)
  }

  return dealerMetrics
}

/**
 * Generate mock data for development
 * @param tenantId The tenant ID
 * @param dealerId Optional dealer ID
 * @returns Mock metrics data
 */
function generateMockSpecificTenantDealerMetrics(tenantId, dealerId) {
  // Generate random values for metrics
  const threadConnectorTotal = Math.floor(Math.random() * 10000) + 1000
  const threadConnectorSuccess = Math.floor(
    Math.random() * threadConnectorTotal
  )
  const threadConnectorFailure = threadConnectorTotal - threadConnectorSuccess
  const threadConnectorFailureRate =
    ((threadConnectorFailure / threadConnectorTotal) * 100).toFixed(2) + "%"

  const tmsInitiated = Math.floor(Math.random() * 5000) + 500
  const gtcInitiated = Math.floor(Math.random() * 5000) + 500
  const apiFailures = Math.floor(Math.random() * 500)
  const deliveryFailures = Math.floor(Math.random() * 500)

  // Calculate additional metrics required by the ProcessedMetrics interface
  const totalInitiated = threadConnectorTotal + tmsInitiated + gtcInitiated
  const totalMessages = totalInitiated
  const totalFailures = apiFailures + deliveryFailures
  const successMessages = tmsInitiated + gtcInitiated - totalFailures

  const failureRate =
    tmsInitiated + gtcInitiated > 0
      ? ((totalFailures / (tmsInitiated + gtcInitiated)) * 100).toFixed(2) + "%"
      : "0%"

  const successRate =
    totalMessages > 0
      ? ((successMessages / totalMessages) * 100).toFixed(2) + "%"
      : "0%"

  const apiFailurePercentage =
    totalFailures > 0
      ? ((apiFailures / totalFailures) * 100).toFixed(2) + "%"
      : "0%"

  const deliveryFailurePercentage =
    totalFailures > 0
      ? ((deliveryFailures / totalFailures) * 100).toFixed(2) + "%"
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
    tenantId,
    dealerId: dealerId || "",
    totalInitiated,
    totalMessages,
    successMessages,
    totalFailures,
    failureRate,
    successRate,
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
    monthsArray: ["2025-01-01"] // Placeholder for compatibility
  }
}
