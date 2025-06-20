import axios from "axios"
import {
  getCurrentMonthRange,
  getDefaultTimeRange
} from "../utils/dateUtils"

// API endpoint for Clickhouse queries
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "https://app.tekioncloud.com/api/apmserving/u/v1/query/clickhouse/raw"

// Note: getCurrentMonthRange and getDefaultTimeRange are used in functions below

// Create axios instance with default headers
const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json"
  }
})

// Add request interceptor to include authentication headers
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

// Enum for failure types
export let FailureType

;(function(FailureType) {
  FailureType["THREADS_API"] = "THREADS_API"
  FailureType["THREADS_DELIVERY"] = "THREADS_DELIVERY"
  FailureType["THREADS_TOTAL"] = "THREADS_TOTAL"
  FailureType["NON_THREADS_API"] = "NON_THREADS_API"
  FailureType["NON_THREADS_DELIVERY"] = "NON_THREADS_DELIVERY"
  FailureType["NON_THREADS_TOTAL"] = "NON_THREADS_TOTAL"
  FailureType["TWILIO_API"] = "TWILIO_API"
  FailureType["TWILIO_DELIVERY"] = "TWILIO_DELIVERY"
  FailureType["TWILIO_TOTAL"] = "TWILIO_TOTAL"
})(FailureType || (FailureType = {}))

// Function to fetch failure details for inbound communications
export async function fetchFailureDetails(failureType, filters) {
  try {
    // For development/testing, return mock data
    if (process.env.NODE_ENV === "development") {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Return mock failure details
      return generateMockFailureDetails(failureType, filters)
    }

    // Build the query based on failure type
    const query = buildFailureDetailsQuery(failureType, filters)

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("Inbound Failure Details API Request Payload:", payload)

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log("Inbound Failure Details API Response:", response.data)

    // Process the raw data into our structured format
    const processedData = processRawFailureDetailsData(response.data.data.data)
    return processedData
  } catch (error) {
    console.error("Error fetching inbound failure details:", error)
    throw error
  }
}

// Function to fetch specific tenant/dealer metrics for inbound communications
export async function fetchSpecificTenantDealerMetrics(
  tenantId,
  dealerId,
  filters
) {
  try {
    // For development/testing, return mock data
    if (process.env.NODE_ENV === "development") {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Return mock specific tenant/dealer metrics
      return generateMockSpecificTenantDealerMetrics(tenantId, dealerId)
    }

    // Build the query for specific tenant/dealer
    const query = buildSpecificTenantDealerQuery(tenantId, dealerId, filters)

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log(
      "Specific Tenant/Dealer Inbound Metrics API Request Payload:",
      payload
    )

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log(
      "Specific Tenant/Dealer Inbound Metrics API Response:",
      response.data
    )

    // Process the raw data into our structured format
    const processedData = processRawSpecificTenantDealerData(
      response.data.data.data,
      tenantId,
      dealerId
    )
    return processedData
  } catch (error) {
    console.error(
      "Error fetching specific tenant/dealer inbound metrics:",
      error
    )
    throw error
  }
}

// Build SQL query for failure details
function buildFailureDetailsQuery(failureType, filters) {
  const {
    startDate: defaultStartDate,
    endDate: defaultEndDate
  } = getCurrentMonthRange()
  const {
    startTime: defaultStartTime,
    endTime: defaultEndTime
  } = getDefaultTimeRange()

  const startDate = filters.startDate || defaultStartDate
  const endDate = filters.endDate || defaultEndDate
  const startTime = filters.startTime || defaultStartTime
  const endTime = filters.endTime || defaultEndTime

  // Convert to timestamp format for the query
  const startTimestamp = `${startDate} ${startTime}:00`
  const endTimestamp = `${endDate} ${endTime}:59`

  let statusFilter = ""
  let messageTypeFilter = ""
  let errorCodeFilter = ""

  // Determine filters based on failure type
  switch (failureType) {
    case FailureType.THREADS_API:
      statusFilter =
        "AND (JSONExtractString(eventMetaData, 'status') = 'FAILED' OR JSONExtractString(eventMetaData, 'errorCode') != '')"
      messageTypeFilter =
        "AND JSONExtractString(eventMetaData, 'messageType') LIKE '%THREAD%'"
      errorCodeFilter =
        "AND (JSONExtractString(eventMetaData, 'errorCode') LIKE '%API%' OR JSONExtractString(eventMetaData, 'errorCode') LIKE '%40%')"
      break
    case FailureType.THREADS_DELIVERY:
      statusFilter =
        "AND (JSONExtractString(eventMetaData, 'status') = 'FAILED' OR JSONExtractString(eventMetaData, 'errorCode') != '')"
      messageTypeFilter =
        "AND JSONExtractString(eventMetaData, 'messageType') LIKE '%THREAD%'"
      errorCodeFilter =
        "AND JSONExtractString(eventMetaData, 'errorCode') NOT LIKE '%API%' AND JSONExtractString(eventMetaData, 'errorCode') NOT LIKE '%40%'"
      break
    case FailureType.THREADS_TOTAL:
      statusFilter =
        "AND (JSONExtractString(eventMetaData, 'status') = 'FAILED' OR JSONExtractString(eventMetaData, 'errorCode') != '')"
      messageTypeFilter =
        "AND JSONExtractString(eventMetaData, 'messageType') LIKE '%THREAD%'"
      break
    case FailureType.NON_THREADS_API:
      statusFilter =
        "AND (JSONExtractString(eventMetaData, 'status') = 'FAILED' OR JSONExtractString(eventMetaData, 'errorCode') != '')"
      messageTypeFilter =
        "AND JSONExtractString(eventMetaData, 'messageType') NOT LIKE '%THREAD%' AND JSONExtractString(eventMetaData, 'messageType') NOT LIKE '%SMS%' AND JSONExtractString(eventMetaData, 'messageType') NOT LIKE '%TWILIO%'"
      errorCodeFilter =
        "AND (JSONExtractString(eventMetaData, 'errorCode') LIKE '%API%' OR JSONExtractString(eventMetaData, 'errorCode') LIKE '%40%')"
      break
    case FailureType.NON_THREADS_DELIVERY:
      statusFilter =
        "AND (JSONExtractString(eventMetaData, 'status') = 'FAILED' OR JSONExtractString(eventMetaData, 'errorCode') != '')"
      messageTypeFilter =
        "AND JSONExtractString(eventMetaData, 'messageType') NOT LIKE '%THREAD%' AND JSONExtractString(eventMetaData, 'messageType') NOT LIKE '%SMS%' AND JSONExtractString(eventMetaData, 'messageType') NOT LIKE '%TWILIO%'"
      errorCodeFilter =
        "AND JSONExtractString(eventMetaData, 'errorCode') NOT LIKE '%API%' AND JSONExtractString(eventMetaData, 'errorCode') NOT LIKE '%40%'"
      break
    case FailureType.NON_THREADS_TOTAL:
      statusFilter =
        "AND (JSONExtractString(eventMetaData, 'status') = 'FAILED' OR JSONExtractString(eventMetaData, 'errorCode') != '')"
      messageTypeFilter =
        "AND JSONExtractString(eventMetaData, 'messageType') NOT LIKE '%THREAD%' AND JSONExtractString(eventMetaData, 'messageType') NOT LIKE '%SMS%' AND JSONExtractString(eventMetaData, 'messageType') NOT LIKE '%TWILIO%'"
      break
    case FailureType.TWILIO_API:
      statusFilter =
        "AND (JSONExtractString(eventMetaData, 'status') = 'FAILED' OR JSONExtractString(eventMetaData, 'errorCode') != '')"
      messageTypeFilter =
        "AND (JSONExtractString(eventMetaData, 'messageType') LIKE '%SMS%' OR JSONExtractString(eventMetaData, 'messageType') LIKE '%TWILIO%')"
      errorCodeFilter =
        "AND (JSONExtractString(eventMetaData, 'errorCode') LIKE '%API%' OR JSONExtractString(eventMetaData, 'errorCode') LIKE '%40%')"
      break
    case FailureType.TWILIO_DELIVERY:
      statusFilter =
        "AND (JSONExtractString(eventMetaData, 'status') = 'FAILED' OR JSONExtractString(eventMetaData, 'errorCode') != '')"
      messageTypeFilter =
        "AND (JSONExtractString(eventMetaData, 'messageType') LIKE '%SMS%' OR JSONExtractString(eventMetaData, 'messageType') LIKE '%TWILIO%')"
      errorCodeFilter =
        "AND JSONExtractString(eventMetaData, 'errorCode') NOT LIKE '%API%' AND JSONExtractString(eventMetaData, 'errorCode') NOT LIKE '%40%'"
      break
    case FailureType.TWILIO_TOTAL:
      statusFilter =
        "AND (JSONExtractString(eventMetaData, 'status') = 'FAILED' OR JSONExtractString(eventMetaData, 'errorCode') != '')"
      messageTypeFilter =
        "AND (JSONExtractString(eventMetaData, 'messageType') LIKE '%SMS%' OR JSONExtractString(eventMetaData, 'messageType') LIKE '%TWILIO%')"
      break
  }

  const tenantFilter = filters.tenantId
    ? `AND tenantId = '${filters.tenantId}'`
    : ""
  const dealerFilter = filters.dealerId
    ? `AND dealerId = '${filters.dealerId}'`
    : ""

  return `
  SELECT
    eventTimestamp,
    tenantId,
    dealerId,
    eventSubType,
    eventMessage,
    eventMetaData,
    JSONExtractString(eventMetaData, 'errorCode') AS errorMessage,
    JSONExtractString(eventMetaData, 'messageType') AS origin
  FROM
    dwh.custom_metrics
  WHERE
    serviceEnvironment LIKE 'prod%' AND
    eventTimestamp > '${startTimestamp}' AND
    eventTimestamp < '${endTimestamp}' AND
    eventType = 'THREADS_CONNECTOR_MESSAGE_CALLBACK' AND
    eventSubType = 'Monthly Inbound Metrics' AND
    eventMetaData LIKE '%direction\\":\\"IN%'
    ${statusFilter}
    ${messageTypeFilter}
    ${errorCodeFilter}
    ${tenantFilter}
    ${dealerFilter}
  ORDER BY
    eventTimestamp DESC
  LIMIT 1000;
  `
}

// Build SQL query for specific tenant/dealer metrics
function buildSpecificTenantDealerQuery(tenantId, dealerId, filters) {
  const {
    startDate: defaultStartDate,
    endDate: defaultEndDate
  } = getCurrentMonthRange()
  const {
    startTime: defaultStartTime,
    endTime: defaultEndTime
  } = getDefaultTimeRange()

  const startDate = filters?.startDate || defaultStartDate
  const endDate = filters?.endDate || defaultEndDate
  const startTime = filters?.startTime || defaultStartTime
  const endTime = filters?.endTime || defaultEndTime

  // Build filters based on what's provided
  const tenantFilter =
    tenantId && tenantId.trim() !== "" ? ` AND tenantId = '${tenantId}'` : ""
  const dealerFilter =
    dealerId && dealerId.trim() !== "" ? ` AND dealerId = '${dealerId}'` : ""

  // Use the same query structure as the Tenant & Dealer page
  return `SELECT tenantId, dealerId, JSONExtractString(JSONExtractString(eventMetaData, 'response'), 'provider') AS providerType, COUNT(*) AS count FROM dwh.custom_metrics WHERE serviceEnvironment LIKE 'prod%' AND eventType = 'THREADS_CONNECTOR_MESSAGE_CALLBACK' AND eventSubType = 'INTEGRATION_MESSAGE_EVENT_PRODUCER' AND eventMetaData LIKE '%direction\\\\\\\\":\\\\\\\\"IN%' AND toUnixTimestamp(eventTimestamp) >= ${Math.floor(
    new Date(`${startDate} ${startTime}:00`).getTime() / 1000
  )} AND toUnixTimestamp(eventTimestamp) <= ${Math.floor(
    new Date(`${endDate} ${endTime}:59`).getTime() / 1000
  )}${tenantFilter}${dealerFilter} GROUP BY tenantId, dealerId, providerType ORDER BY tenantId, dealerId, count DESC`
}

// Process raw failure details data from API response
function processRawFailureDetailsData(rawData) {
  return rawData.map(row => ({
    timestamp: new Date(row.eventTimestamp * 1000).toISOString(),
    tenantId: row.tenantId,
    dealerId: row.dealerId,
    eventSubType: row.eventSubType,
    eventMessage: row.eventMessage,
    errorMessage: row.errorMessage || "No error message available",
    origin: row.origin || "Unknown",
    metadata: row.eventMetaData
  }))
}

// Process raw specific tenant/dealer data from API response
function processRawSpecificTenantDealerData(rawData, tenantId, dealerId) {
  // Initialize metrics
  const metrics = {
    tenantId,
    dealerId,
    // Threads (Inbound)
    threadsInitiated: 0,
    threadsSuccess: 0,
    threadsFailure: 0,
    threadsApiFailure: 0,
    threadsDeliveryFailure: 0,
    threadsFailureRate: "0%",
    // Non-Threads (Inbound)
    nonThreadsInitiated: 0,
    nonThreadsSuccess: 0,
    nonThreadsFailure: 0,
    nonThreadsApiFailure: 0,
    nonThreadsDeliveryFailure: 0,
    nonThreadsFailureRate: "0%",
    // Twilio (Inbound)
    twilioInitiated: 0,
    twilioSuccess: 0,
    twilioFailure: 0,
    twilioApiFailure: 0,
    twilioDeliveryFailure: 0,
    twilioFailureRate: "0%",
    // Totals
    totalInitiated: 0,
    totalSuccess: 0,
    totalFailure: 0,
    totalFailureRate: "0%"
  }

  // Process each row of data (same logic as Tenant & Dealer page)
  rawData.forEach(row => {
    const { providerType, count } = row

    // Ensure count is treated as a number to avoid string concatenation
    const numericCount = Number(count)

    // Process based on provider type (same as Tenant & Dealer page)
    if (providerType === "GTC") {
      metrics.threadsInitiated += numericCount
      metrics.threadsSuccess += numericCount
    } else if (providerType === "TWILIO") {
      metrics.twilioInitiated += numericCount
      metrics.twilioSuccess += numericCount
    }
  })

  // Calculate derived metrics
  metrics.threadsFailure =
    metrics.threadsApiFailure + metrics.threadsDeliveryFailure
  metrics.nonThreadsFailure =
    metrics.nonThreadsApiFailure + metrics.nonThreadsDeliveryFailure
  metrics.twilioFailure =
    metrics.twilioApiFailure + metrics.twilioDeliveryFailure

  metrics.totalInitiated =
    metrics.threadsInitiated +
    metrics.nonThreadsInitiated +
    metrics.twilioInitiated
  metrics.totalSuccess =
    metrics.threadsSuccess + metrics.nonThreadsSuccess + metrics.twilioSuccess
  metrics.totalFailure =
    metrics.threadsFailure + metrics.nonThreadsFailure + metrics.twilioFailure

  // Calculate failure rates
  metrics.threadsFailureRate =
    metrics.threadsInitiated > 0
      ? ((metrics.threadsFailure / metrics.threadsInitiated) * 100).toFixed(1) +
        "%"
      : "0%"

  metrics.nonThreadsFailureRate =
    metrics.nonThreadsInitiated > 0
      ? (
          (metrics.nonThreadsFailure / metrics.nonThreadsInitiated) *
          100
        ).toFixed(1) + "%"
      : "0%"

  metrics.twilioFailureRate =
    metrics.twilioInitiated > 0
      ? ((metrics.twilioFailure / metrics.twilioInitiated) * 100).toFixed(1) +
        "%"
      : "0%"

  metrics.totalFailureRate =
    metrics.totalInitiated > 0
      ? ((metrics.totalFailure / metrics.totalInitiated) * 100).toFixed(1) + "%"
      : "0%"

  return metrics
}

// Generate mock failure details for development/testing
function generateMockFailureDetails(failureType, filters) {
  const mockDetails = []
  const count = Math.floor(Math.random() * 20) + 5 // 5-25 failure records

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
    ) // Last 7 days

    mockDetails.push({
      timestamp: timestamp.toISOString(),
      tenantId:
        filters.tenantId ||
        `TENANT_${String(Math.floor(Math.random() * 5) + 1).padStart(3, "0")}`,
      dealerId:
        filters.dealerId ||
        `DEALER_${String.fromCharCode(
          65 + Math.floor(Math.random() * 5)
        )}${Math.floor(Math.random() * 4) + 1}`,
      eventSubType: failureType.includes("API")
        ? "API_FAILURE"
        : "DELIVERY_FAILURE",
      eventMessage: "TMS_MESSAGE_FAILED",
      errorMessage: generateMockErrorMessage(failureType),
      origin: failureType.includes("THREADS")
        ? "THREADS"
        : failureType.includes("TWILIO")
        ? "TWILIO"
        : "NON_THREADS",
      metadata: JSON.stringify({
        "origin-platform": failureType.includes("THREADS")
          ? "THREADS"
          : "NON_THREADS",
        errorCode: Math.floor(Math.random() * 1000) + 4000,
        retryCount: Math.floor(Math.random() * 3),
        messageId: `msg_${Math.random()
          .toString(36)
          .substring(2, 11)}`
      })
    })
  }

  return mockDetails.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

// Generate mock error messages based on failure type
function generateMockErrorMessage(failureType) {
  const errorMessages = {
    [FailureType.THREADS_API]: [
      "Inbound Threads API rate limit exceeded",
      "Inbound Threads authentication failed",
      "Inbound Threads service temporarily unavailable",
      "Invalid inbound message format for Threads"
    ],
    [FailureType.THREADS_DELIVERY]: [
      "Inbound message delivery timeout for Threads",
      "Recipient unavailable for inbound Threads message",
      "Inbound Threads message blocked by carrier",
      "Invalid recipient number for inbound Threads"
    ],
    [FailureType.THREADS_TOTAL]: [
      "Inbound Threads total failure - API and delivery issues",
      "Combined inbound Threads failures detected",
      "Multiple inbound Threads failure types occurred",
      "Inbound Threads system-wide failure"
    ],
    [FailureType.NON_THREADS_API]: [
      "Inbound Non-Threads API connection timeout",
      "Inbound Non-Threads service authentication error",
      "Invalid inbound request format for Non-Threads",
      "Inbound Non-Threads API quota exceeded"
    ],
    [FailureType.NON_THREADS_DELIVERY]: [
      "Inbound Non-Threads message delivery failed",
      "Carrier rejected inbound Non-Threads message",
      "Inbound Non-Threads recipient not found",
      "Message size limit exceeded for inbound Non-Threads"
    ],
    [FailureType.NON_THREADS_TOTAL]: [
      "Inbound Non-Threads total failure - multiple issues",
      "Combined inbound Non-Threads failures detected",
      "Multiple inbound Non-Threads failure types occurred",
      "Inbound Non-Threads system-wide failure"
    ],
    [FailureType.TWILIO_API]: [
      "Inbound Twilio API authentication failed",
      "Inbound Twilio webhook validation error",
      "Inbound Twilio service unavailable",
      "Invalid inbound Twilio message format"
    ],
    [FailureType.TWILIO_DELIVERY]: [
      "Inbound Twilio message delivery timeout",
      "Inbound Twilio carrier rejection",
      "Invalid phone number for inbound Twilio",
      "Inbound Twilio message blocked"
    ],
    [FailureType.TWILIO_TOTAL]: [
      "Inbound Twilio total failure - API and delivery issues",
      "Combined inbound Twilio failures detected",
      "Multiple inbound Twilio failure types occurred",
      "Inbound Twilio system-wide failure"
    ]
  }

  const messages =
    errorMessages[failureType] || errorMessages[FailureType.THREADS_API]
  return messages[Math.floor(Math.random() * messages.length)]
}

// Generate mock specific tenant/dealer metrics
function generateMockSpecificTenantDealerMetrics(tenantId, dealerId) {
  // Generate random inbound metrics
  const threadsInitiated = 800 + Math.floor(Math.random() * 2000)
  const threadsSuccess = threadsInitiated - Math.floor(Math.random() * 200)
  const threadsFailure = threadsInitiated - threadsSuccess
  const threadsApiFailure = Math.floor(threadsFailure * 0.6)
  const threadsDeliveryFailure = threadsFailure - threadsApiFailure
  const threadsFailureRate =
    ((threadsFailure / threadsInitiated) * 100).toFixed(1) + "%"

  const nonThreadsInitiated = 1200 + Math.floor(Math.random() * 3000)
  const nonThreadsSuccess =
    nonThreadsInitiated - Math.floor(Math.random() * 300)
  const nonThreadsFailure = nonThreadsInitiated - nonThreadsSuccess
  const nonThreadsApiFailure = Math.floor(nonThreadsFailure * 0.6)
  const nonThreadsDeliveryFailure = nonThreadsFailure - nonThreadsApiFailure
  const nonThreadsFailureRate =
    ((nonThreadsFailure / nonThreadsInitiated) * 100).toFixed(1) + "%"

  const twilioInitiated = 500 + Math.floor(Math.random() * 1500)
  const twilioSuccess = twilioInitiated - Math.floor(Math.random() * 150)
  const twilioFailure = twilioInitiated - twilioSuccess
  const twilioApiFailure = Math.floor(twilioFailure * 0.6)
  const twilioDeliveryFailure = twilioFailure - twilioApiFailure
  const twilioFailureRate =
    ((twilioFailure / twilioInitiated) * 100).toFixed(1) + "%"

  const totalInitiated =
    threadsInitiated + nonThreadsInitiated + twilioInitiated
  const totalSuccess = threadsSuccess + nonThreadsSuccess + twilioSuccess
  const totalFailure = threadsFailure + nonThreadsFailure + twilioFailure
  const totalFailureRate =
    ((totalFailure / totalInitiated) * 100).toFixed(1) + "%"

  return {
    tenantId,
    dealerId,
    // GTC - CRM Threads (Inbound)
    threadsInitiated,
    threadsSuccess,
    threadsFailure,
    threadsApiFailure,
    threadsDeliveryFailure,
    threadsFailureRate,
    // GTC - CRM Non-Threads (Inbound)
    nonThreadsInitiated,
    nonThreadsSuccess,
    nonThreadsFailure,
    nonThreadsApiFailure,
    nonThreadsDeliveryFailure,
    nonThreadsFailureRate,
    // Twilio - Non CRM (Inbound)
    twilioInitiated,
    twilioSuccess,
    twilioFailure,
    twilioApiFailure,
    twilioDeliveryFailure,
    twilioFailureRate,
    // Totals
    totalInitiated,
    totalSuccess,
    totalFailure,
    totalFailureRate
  }
}
