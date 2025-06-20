import axios from "axios"
import {
  getCurrentMonthRange,
  getDefaultTimeRange,
  dateTimeToEpoch
} from "../utils/dateUtils"

// API endpoint for Clickhouse queries
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "https://app.tekioncloud.com/api/apmserving/u/v1/query/clickhouse/raw"

// Note: getCurrentMonthRange and getDefaultTimeRange are used in functions below

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

// Failure type enum
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

// Function to fetch failure details
export async function fetchFailureDetails(failureType, filters) {
  try {
    // For development/testing, use mock data
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock data for failure details:", failureType)
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Return mock data based on failure type
      const mockData = generateMockFailureDetails(failureType)
      console.log("Generated mock data:", mockData)
      return mockData
    }

    // For production, make the actual API call
    const query = buildFailureDetailsQuery(failureType, filters)

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("Failure Details API Request Payload:", payload)

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log("Failure Details API Response:", response.data)

    // Process the raw data into our structured format
    const processedData = processRawFailureDetails(response.data.data.data)
    return processedData
  } catch (error) {
    console.error("Error fetching failure details:", error)
    throw error
  }
}

// Function to build the failure details query
function buildFailureDetailsQuery(failureType, filters) {
  // Convert date and time to epoch timestamps
  const startEpoch =
    filters?.startDate && filters?.startTime
      ? dateTimeToEpoch(filters.startDate, filters.startTime)
      : undefined

  const endEpoch =
    filters?.endDate && filters?.endTime
      ? dateTimeToEpoch(filters.endDate, filters.endTime)
      : undefined

  // Build date filter
  const dateFilter =
    startEpoch && endEpoch
      ? `toUnixTimestamp(eventTimestamp) >= ${startEpoch} AND toUnixTimestamp(eventTimestamp) <= ${endEpoch}`
      : "1=1" // Default to true if no date filters

  // Build tenant and dealer filters
  const tenantFilter = filters?.tenantId
    ? `AND tenantId = '${filters.tenantId}'`
    : ""
  const dealerFilter = filters?.dealerId
    ? `AND dealerId = '${filters.dealerId}'`
    : ""

  // Build failure type specific conditions
  let failureCondition = ""

  switch (failureType) {
    case FailureType.THREADS_API:
      failureCondition = `
        eventType = 'TEXT_COMMUNICATION' AND
        eventSubType = 'TEXT_DELIVERY_FAILURE' AND
        eventMessage = 'API_FAILURE' AND
        JSONExtractString(eventMetaData, 'origin-platform') = 'THREADS' AND
        (CASE
          WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
               JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
               JSONExtractString(eventMetaData, 'messageId') = '' AND
               eventMessage <> 'TMS_MESSAGE_INITIATED'
          THEN 'GTC'
          ELSE 'TWILLIO'
        END) = 'GTC'
      `
      break
    case FailureType.THREADS_DELIVERY:
      failureCondition = `
        eventType = 'TEXT_COMMUNICATION' AND
        eventSubType = 'TEXT_DELIVERY_FAILURE' AND
        eventMessage = 'DELIVERY_FAILURE' AND
        JSONExtractString(eventMetaData, 'origin-platform') = 'THREADS' AND
        (CASE
          WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
               JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
               JSONExtractString(eventMetaData, 'messageId') = '' AND
               eventMessage <> 'TMS_MESSAGE_INITIATED'
          THEN 'GTC'
          ELSE 'TWILLIO'
        END) = 'GTC'
      `
      break
    case FailureType.THREADS_TOTAL:
      failureCondition = `
        eventType = 'TEXT_COMMUNICATION' AND
        eventSubType = 'TEXT_DELIVERY_FAILURE' AND
        (eventMessage = 'API_FAILURE' OR eventMessage = 'DELIVERY_FAILURE') AND
        JSONExtractString(eventMetaData, 'origin-platform') = 'THREADS' AND
        (CASE
          WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
               JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
               JSONExtractString(eventMetaData, 'messageId') = '' AND
               eventMessage <> 'TMS_MESSAGE_INITIATED'
          THEN 'GTC'
          ELSE 'TWILLIO'
        END) = 'GTC'
      `
      break
    case FailureType.NON_THREADS_API:
      failureCondition = `
        eventType = 'TEXT_COMMUNICATION' AND
        eventSubType = 'TEXT_DELIVERY_FAILURE' AND
        eventMessage = 'API_FAILURE' AND
        JSONExtractString(eventMetaData, 'origin-platform') <> 'THREADS' AND
        (CASE
          WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
               JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
               JSONExtractString(eventMetaData, 'messageId') = '' AND
               eventMessage <> 'TMS_MESSAGE_INITIATED'
          THEN 'GTC'
          ELSE 'TWILLIO'
        END) = 'GTC'
      `
      break
    case FailureType.NON_THREADS_DELIVERY:
      failureCondition = `
        eventType = 'TEXT_COMMUNICATION' AND
        eventSubType = 'TEXT_DELIVERY_FAILURE' AND
        eventMessage = 'DELIVERY_FAILURE' AND
        JSONExtractString(eventMetaData, 'origin-platform') <> 'THREADS' AND
        (CASE
          WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
               JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
               JSONExtractString(eventMetaData, 'messageId') = '' AND
               eventMessage <> 'TMS_MESSAGE_INITIATED'
          THEN 'GTC'
          ELSE 'TWILLIO'
        END) = 'GTC'
      `
      break
    case FailureType.NON_THREADS_TOTAL:
      failureCondition = `
        eventType = 'TEXT_COMMUNICATION' AND
        eventSubType = 'TEXT_DELIVERY_FAILURE' AND
        (eventMessage = 'API_FAILURE' OR eventMessage = 'DELIVERY_FAILURE') AND
        JSONExtractString(eventMetaData, 'origin-platform') <> 'THREADS' AND
        (CASE
          WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
               JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
               JSONExtractString(eventMetaData, 'messageId') = '' AND
               eventMessage <> 'TMS_MESSAGE_INITIATED'
          THEN 'GTC'
          ELSE 'TWILLIO'
        END) = 'GTC'
      `
      break
    case FailureType.TWILIO_API:
      failureCondition = `
        eventType = 'TEXT_COMMUNICATION' AND
        eventSubType = 'TEXT_DELIVERY_FAILURE' AND
        eventMessage = 'API_FAILURE' AND
        (CASE
          WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
               JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
               JSONExtractString(eventMetaData, 'messageId') = '' AND
               eventMessage <> 'TMS_MESSAGE_INITIATED'
          THEN 'GTC'
          ELSE 'TWILLIO'
        END) = 'TWILLIO'
      `
      break
    case FailureType.TWILIO_DELIVERY:
      failureCondition = `
        eventType = 'TEXT_COMMUNICATION' AND
        eventSubType = 'TEXT_DELIVERY_FAILURE' AND
        eventMessage = 'DELIVERY_FAILURE' AND
        (CASE
          WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
               JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
               JSONExtractString(eventMetaData, 'messageId') = '' AND
               eventMessage <> 'TMS_MESSAGE_INITIATED'
          THEN 'GTC'
          ELSE 'TWILLIO'
        END) = 'TWILLIO'
      `
      break
    case FailureType.TWILIO_TOTAL:
      failureCondition = `
        eventType = 'TEXT_COMMUNICATION' AND
        eventSubType = 'TEXT_DELIVERY_FAILURE' AND
        (eventMessage = 'API_FAILURE' OR eventMessage = 'DELIVERY_FAILURE') AND
        (CASE
          WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND
               JSONExtractString(eventMetaData, 'communicationChannel') = '' AND
               JSONExtractString(eventMetaData, 'messageId') = '' AND
               eventMessage <> 'TMS_MESSAGE_INITIATED'
          THEN 'GTC'
          ELSE 'TWILLIO'
        END) = 'TWILLIO'
      `
      break
    default:
      failureCondition = "1=1" // Default to true
  }

  return `
  SELECT
    eventMessage,
    CONCAT(JSONExtractString(eventMetaData, 'errorMessage'), ' ', JSONExtractString(eventMetaData, 'deliveryStatusDescription')) as errorMessage,
    JSONExtractString(eventMetaData, 'origin-platform') as origin,
    count(*) as count
  FROM
    dwh.custom_metrics
  WHERE
    serviceEnvironment LIKE 'prod%' AND
    ${failureCondition} AND
    ${dateFilter}
    ${tenantFilter}
    ${dealerFilter}
  GROUP BY
    eventMessage, errorMessage, origin
  ORDER BY
    count DESC
  LIMIT 100;
  `
}

// Function to process raw failure details data
function processRawFailureDetails(rawData) {
  return rawData.map(item => ({
    eventMessage: item.eventMessage || "",
    origin: item.origin || "",
    errorMessage: item.errorMessage || "Unknown error",
    count: Number(item.count) || 0
  }))
}

/**
 * Fetch metrics for a specific tenant and optional dealer
 * @param tenantId The tenant ID to filter by
 * @param dealerId Optional dealer ID to filter by
 * @param startTimestamp Optional start timestamp (epoch) for filtering
 * @param endTimestamp Optional end timestamp (epoch) for filtering
 * @returns Promise resolving to TenantDealerMetrics array or null if no data found
 */
export async function fetchSpecificTenantDealerMetrics(
  tenantId,
  dealerId,
  startTimestamp,
  endTimestamp
) {
  try {
    // For development/testing, use mock data
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Using mock data for specific tenant/dealer metrics: ${tenantId}${
          dealerId ? `/${dealerId}` : ""
        }`
      )
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // If dealerId is not provided, generate mock data for multiple dealers
      if (!dealerId) {
        // Generate 3-5 random dealer IDs
        const numDealers = Math.floor(Math.random() * 3) + 3 // 3 to 5 dealers
        const mockDealers = []

        // Create a tenant total object to accumulate values
        const tenantTotal = {
          tenantId,
          dealerId: "TOTAL",
          threadsInitiated: 0,
          threadsSuccess: 0,
          threadsFailure: 0,
          threadsApiFailure: 0,
          threadsDeliveryFailure: 0,
          threadsFailureRate: "0%",
          nonThreadsInitiated: 0,
          nonThreadsSuccess: 0,
          nonThreadsFailure: 0,
          nonThreadsApiFailure: 0,
          nonThreadsDeliveryFailure: 0,
          nonThreadsFailureRate: "0%",
          twilioInitiated: 0,
          twilioSuccess: 0,
          twilioFailure: 0,
          twilioApiFailure: 0,
          twilioDeliveryFailure: 0,
          twilioFailureRate: "0%",
          totalInitiated: 0,
          totalSuccess: 0,
          totalFailure: 0,
          totalFailureRate: "0%"
        }

        // Add individual dealer metrics and accumulate totals
        for (let i = 1; i <= numDealers; i++) {
          const mockDealerId = `dealer${i}`
          const dealerMetrics = generateMockSpecificTenantDealerMetrics(
            tenantId,
            mockDealerId
          )
          mockDealers.push(dealerMetrics)

          // Accumulate values for tenant total
          tenantTotal.threadsInitiated += dealerMetrics.threadsInitiated
          tenantTotal.threadsSuccess += dealerMetrics.threadsSuccess
          tenantTotal.threadsFailure += dealerMetrics.threadsFailure
          tenantTotal.threadsApiFailure += dealerMetrics.threadsApiFailure
          tenantTotal.threadsDeliveryFailure +=
            dealerMetrics.threadsDeliveryFailure

          tenantTotal.nonThreadsInitiated += dealerMetrics.nonThreadsInitiated
          tenantTotal.nonThreadsSuccess += dealerMetrics.nonThreadsSuccess
          tenantTotal.nonThreadsFailure += dealerMetrics.nonThreadsFailure
          tenantTotal.nonThreadsApiFailure += dealerMetrics.nonThreadsApiFailure
          tenantTotal.nonThreadsDeliveryFailure +=
            dealerMetrics.nonThreadsDeliveryFailure

          tenantTotal.twilioInitiated += dealerMetrics.twilioInitiated
          tenantTotal.twilioSuccess += dealerMetrics.twilioSuccess
          tenantTotal.twilioFailure += dealerMetrics.twilioFailure
          tenantTotal.twilioApiFailure += dealerMetrics.twilioApiFailure
          tenantTotal.twilioDeliveryFailure +=
            dealerMetrics.twilioDeliveryFailure

          tenantTotal.totalInitiated += dealerMetrics.totalInitiated
          tenantTotal.totalSuccess += dealerMetrics.totalSuccess
          tenantTotal.totalFailure += dealerMetrics.totalFailure
        }

        // Recalculate failure rates for the tenant total
        tenantTotal.threadsFailureRate =
          tenantTotal.threadsInitiated > 0
            ? (
                (tenantTotal.threadsFailure / tenantTotal.threadsInitiated) *
                100
              ).toFixed(1) + "%"
            : "0%"

        tenantTotal.nonThreadsFailureRate =
          tenantTotal.nonThreadsInitiated > 0
            ? (
                (tenantTotal.nonThreadsFailure /
                  tenantTotal.nonThreadsInitiated) *
                100
              ).toFixed(1) + "%"
            : "0%"

        tenantTotal.twilioFailureRate =
          tenantTotal.twilioInitiated > 0
            ? (
                (tenantTotal.twilioFailure / tenantTotal.twilioInitiated) *
                100
              ).toFixed(1) + "%"
            : "0%"

        tenantTotal.totalFailureRate =
          tenantTotal.totalInitiated > 0
            ? (
                (tenantTotal.totalFailure / tenantTotal.totalInitiated) *
                100
              ).toFixed(1) + "%"
            : "0%"

        // Add the tenant total at the beginning of the array
        mockDealers.unshift(tenantTotal)

        return mockDealers
      }

      // If dealerId is provided, return a single item array
      const mockData = generateMockSpecificTenantDealerMetrics(
        tenantId,
        dealerId
      )
      return [mockData]
    }

    // For production, make the actual API call
    // If timestamps are not provided, use current month range as default
    let effectiveStartTimestamp = startTimestamp
    let effectiveEndTimestamp = endTimestamp

    if (!effectiveStartTimestamp || !effectiveEndTimestamp) {
      // Get current month range for default date range
      const { startDate, endDate } = getCurrentMonthRange()
      const { startTime, endTime } = getDefaultTimeRange()

      // Convert date and time to epoch timestamps
      effectiveStartTimestamp = dateTimeToEpoch(startDate, startTime)
      effectiveEndTimestamp = dateTimeToEpoch(endDate, endTime)
    }

    console.log(
      `Using time range: ${effectiveStartTimestamp} to ${effectiveEndTimestamp}`
    )

    // Build the query
    const query = `
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
      toUnixTimestamp(eventTimestamp) >= ${effectiveStartTimestamp} AND
      toUnixTimestamp(eventTimestamp) <= ${effectiveEndTimestamp} AND
      tenantId = '${tenantId}'
      ${dealerId ? `AND dealerId = '${dealerId}'` : ""}
    GROUP BY
      tenantId, dealerId, eventSubType, eventMessage, origin, providerType
    ORDER BY
      tenantId, dealerId, count DESC;
    `

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
      return null
    }

    // Process the raw data into the required format
    if (dealerId) {
      // If dealerId is provided, return a single item array
      const processedData = processRawSpecificTenantDealerMetrics(
        rawData,
        tenantId,
        dealerId
      )
      return [processedData]
    } else {
      // If no dealerId is provided, process data for all dealers
      return processRawSpecificTenantDealerMetricsForAllDealers(
        rawData,
        tenantId
      )
    }
  } catch (error) {
    console.error("Error fetching specific tenant/dealer metrics:", error)
    throw error
  }
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

  // Calculate totals
  const totalInitiated =
    tdData.threadsInitiated +
    tdData.nonThreadsInitiated +
    tdData.twilioInitiated
  const totalSuccess = tdData.threadsSuccess + nonThreadsSuccess + twilioSuccess
  const totalFailure = threadsFailure + nonThreadsFailure + twilioFailure
  const totalFailureRate =
    totalInitiated > 0
      ? ((totalFailure / totalInitiated) * 100).toFixed(1) + "%"
      : "0%"

  return {
    tenantId: tdData.tenantId,
    dealerId: tdData.dealerId,
    // GTC - CRM Threads
    threadsInitiated: tdData.threadsInitiated,
    threadsSuccess: tdData.threadsSuccess,
    threadsFailure,
    threadsApiFailure: tdData.threadsApiFailure,
    threadsDeliveryFailure: tdData.threadsDeliveryFailure,
    threadsFailureRate,
    // GTC - CRM Non-Threads
    nonThreadsInitiated: tdData.nonThreadsInitiated,
    nonThreadsSuccess,
    nonThreadsFailure,
    nonThreadsApiFailure: tdData.nonThreadsApiFailure,
    nonThreadsDeliveryFailure: tdData.nonThreadsDeliveryFailure,
    nonThreadsFailureRate,
    // Twilio - Non CRM
    twilioInitiated: tdData.twilioInitiated,
    twilioSuccess,
    twilioFailure,
    twilioApiFailure: tdData.twilioApiFailure,
    twilioDeliveryFailure: tdData.twilioDeliveryFailure,
    twilioFailureRate,
    // Totals
    totalInitiated,
    totalSuccess,
    totalFailure,
    totalFailureRate
  }
}

/**
 * Generate mock specific tenant/dealer metrics for development
 * @param tenantId The tenant ID
 * @param dealerId Optional dealer ID
 * @returns Mock metrics data
 */
function generateMockSpecificTenantDealerMetrics(tenantId, dealerId) {
  // Generate random values for metrics
  const threadsInitiated = Math.floor(Math.random() * 10000) + 1000
  const threadsSuccess = Math.floor(Math.random() * threadsInitiated)
  const threadsApiFailure = Math.floor(
    Math.random() * (threadsInitiated - threadsSuccess) * 0.7
  )
  const threadsDeliveryFailure =
    threadsInitiated - threadsSuccess - threadsApiFailure
  const threadsFailure = threadsApiFailure + threadsDeliveryFailure
  const threadsFailureRate =
    ((threadsFailure / threadsInitiated) * 100).toFixed(1) + "%"

  const nonThreadsInitiated = Math.floor(Math.random() * 5000) + 500
  const nonThreadsApiFailure = Math.floor(Math.random() * 300)
  const nonThreadsDeliveryFailure = Math.floor(Math.random() * 200)
  const nonThreadsFailure = nonThreadsApiFailure + nonThreadsDeliveryFailure
  const nonThreadsSuccess = nonThreadsInitiated - nonThreadsFailure
  const nonThreadsFailureRate =
    ((nonThreadsFailure / nonThreadsInitiated) * 100).toFixed(1) + "%"

  const twilioInitiated = Math.floor(Math.random() * 5000) + 500
  const twilioApiFailure = Math.floor(Math.random() * 250)
  const twilioDeliveryFailure = Math.floor(Math.random() * 150)
  const twilioFailure = twilioApiFailure + twilioDeliveryFailure
  const twilioSuccess = twilioInitiated - twilioFailure
  const twilioFailureRate =
    ((twilioFailure / twilioInitiated) * 100).toFixed(1) + "%"

  // Calculate totals
  const totalInitiated =
    threadsInitiated + nonThreadsInitiated + twilioInitiated
  const totalSuccess = threadsSuccess + nonThreadsSuccess + twilioSuccess
  const totalFailure = threadsFailure + nonThreadsFailure + twilioFailure
  const totalFailureRate =
    ((totalFailure / totalInitiated) * 100).toFixed(1) + "%"

  return {
    tenantId,
    dealerId: dealerId || "",
    // GTC - CRM Threads
    threadsInitiated,
    threadsSuccess,
    threadsFailure,
    threadsApiFailure,
    threadsDeliveryFailure,
    threadsFailureRate,
    // GTC - CRM Non-Threads
    nonThreadsInitiated,
    nonThreadsSuccess,
    nonThreadsFailure,
    nonThreadsApiFailure,
    nonThreadsDeliveryFailure,
    nonThreadsFailureRate,
    // Twilio - Non CRM
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

/**
 * Process raw metrics data into multiple dealer metrics with a tenant total
 * @param rawData Raw data from the API
 * @param tenantId The tenant ID
 * @returns Array of processed metrics for each dealer and a tenant total
 */
function processRawSpecificTenantDealerMetricsForAllDealers(rawData, tenantId) {
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
  const tenantTotal = {
    tenantId,
    dealerId: "TOTAL",
    threadsInitiated: 0,
    threadsSuccess: 0,
    threadsFailure: 0,
    threadsApiFailure: 0,
    threadsDeliveryFailure: 0,
    threadsFailureRate: "0%",
    nonThreadsInitiated: 0,
    nonThreadsSuccess: 0,
    nonThreadsFailure: 0,
    nonThreadsApiFailure: 0,
    nonThreadsDeliveryFailure: 0,
    nonThreadsFailureRate: "0%",
    twilioInitiated: 0,
    twilioSuccess: 0,
    twilioFailure: 0,
    twilioApiFailure: 0,
    twilioDeliveryFailure: 0,
    twilioFailureRate: "0%",
    totalInitiated: 0,
    totalSuccess: 0,
    totalFailure: 0,
    totalFailureRate: "0%"
  }

  // Process each dealer's data
  Object.entries(dealerGroups).forEach(([dealerId, dealerData]) => {
    const metrics = processRawSpecificTenantDealerMetrics(
      dealerData,
      tenantId,
      dealerId
    )
    dealerMetrics.push(metrics)

    // Accumulate values for tenant total
    tenantTotal.threadsInitiated += metrics.threadsInitiated
    tenantTotal.threadsSuccess += metrics.threadsSuccess
    tenantTotal.threadsFailure += metrics.threadsFailure
    tenantTotal.threadsApiFailure += metrics.threadsApiFailure
    tenantTotal.threadsDeliveryFailure += metrics.threadsDeliveryFailure

    tenantTotal.nonThreadsInitiated += metrics.nonThreadsInitiated
    tenantTotal.nonThreadsSuccess += metrics.nonThreadsSuccess
    tenantTotal.nonThreadsFailure += metrics.nonThreadsFailure
    tenantTotal.nonThreadsApiFailure += metrics.nonThreadsApiFailure
    tenantTotal.nonThreadsDeliveryFailure += metrics.nonThreadsDeliveryFailure

    tenantTotal.twilioInitiated += metrics.twilioInitiated
    tenantTotal.twilioSuccess += metrics.twilioSuccess
    tenantTotal.twilioFailure += metrics.twilioFailure
    tenantTotal.twilioApiFailure += metrics.twilioApiFailure
    tenantTotal.twilioDeliveryFailure += metrics.twilioDeliveryFailure

    tenantTotal.totalInitiated += metrics.totalInitiated
    tenantTotal.totalSuccess += metrics.totalSuccess
    tenantTotal.totalFailure += metrics.totalFailure
  })

  // Recalculate failure rates for the tenant total
  tenantTotal.threadsFailureRate =
    tenantTotal.threadsInitiated > 0
      ? (
          (tenantTotal.threadsFailure / tenantTotal.threadsInitiated) *
          100
        ).toFixed(1) + "%"
      : "0%"

  tenantTotal.nonThreadsFailureRate =
    tenantTotal.nonThreadsInitiated > 0
      ? (
          (tenantTotal.nonThreadsFailure / tenantTotal.nonThreadsInitiated) *
          100
        ).toFixed(1) + "%"
      : "0%"

  tenantTotal.twilioFailureRate =
    tenantTotal.twilioInitiated > 0
      ? (
          (tenantTotal.twilioFailure / tenantTotal.twilioInitiated) *
          100
        ).toFixed(1) + "%"
      : "0%"

  tenantTotal.totalFailureRate =
    tenantTotal.totalInitiated > 0
      ? ((tenantTotal.totalFailure / tenantTotal.totalInitiated) * 100).toFixed(
          1
        ) + "%"
      : "0%"

  // Add the tenant total at the beginning of the array
  dealerMetrics.unshift(tenantTotal)

  return dealerMetrics
}

// Function to generate mock failure details for development
function generateMockFailureDetails(failureType) {
  const mockData = []

  // Common error messages by failure type
  const errorMessages = {
    [FailureType.THREADS_API]: [
      "Authentication failed",
      "Rate limit exceeded",
      "Invalid request parameters",
      "Service unavailable",
      "Connection timeout",
      "Internal server error"
    ],
    [FailureType.THREADS_DELIVERY]: [
      "Recipient opted out",
      "Carrier rejected",
      "Destination unreachable",
      "Message blocked by carrier",
      "Invalid phone number",
      "Delivery timed out"
    ],
    [FailureType.THREADS_TOTAL]: [
      "Authentication failed",
      "Rate limit exceeded",
      "Invalid request parameters",
      "Recipient opted out",
      "Carrier rejected",
      "Destination unreachable",
      "Message blocked by carrier"
    ],
    [FailureType.NON_THREADS_API]: [
      "API key expired",
      "Invalid API credentials",
      "Request validation failed",
      "Service temporarily unavailable",
      "Rate limit exceeded",
      "Bad request format"
    ],
    [FailureType.NON_THREADS_DELIVERY]: [
      "Number not in service",
      "Message rejected by carrier",
      "Recipient blacklisted",
      "Message content rejected",
      "Delivery attempt failed",
      "Unknown carrier error"
    ],
    [FailureType.NON_THREADS_TOTAL]: [
      "API key expired",
      "Invalid API credentials",
      "Number not in service",
      "Message rejected by carrier",
      "Recipient blacklisted",
      "Delivery attempt failed"
    ],
    [FailureType.TWILIO_API]: [
      "Invalid Twilio credentials",
      "Account suspended",
      "Invalid phone number format",
      "Insufficient funds",
      "API request limit reached",
      "Invalid message parameters"
    ],
    [FailureType.TWILIO_DELIVERY]: [
      "Undelivered message",
      "Carrier filtered message",
      "Recipient unavailable",
      "Message expired",
      "Destination not reachable",
      "Delivery failed"
    ],
    [FailureType.TWILIO_TOTAL]: [
      "Invalid Twilio credentials",
      "Account suspended",
      "Undelivered message",
      "Carrier filtered message",
      "Recipient unavailable",
      "Message expired"
    ]
  }

  // Set event message based on failure type
  let eventMessage = ""
  if (failureType.includes("TOTAL")) {
    // For TOTAL types, we'll create a mix of API and DELIVERY failures
    eventMessage = Math.random() > 0.5 ? "API_FAILURE" : "DELIVERY_FAILURE"
  } else {
    eventMessage = failureType.includes("API")
      ? "API_FAILURE"
      : "DELIVERY_FAILURE"
  }

  const origin = failureType.includes("THREADS")
    ? "THREADS"
    : failureType.includes("NON_THREADS")
    ? "NON_THREADS"
    : ""

  // Generate mock data entries - one for each error message type with random counts
  for (const errorMessage of errorMessages[failureType]) {
    mockData.push({
      eventMessage,
      errorMessage,
      origin,
      count: Math.floor(Math.random() * 100) + 1 // Random count between 1 and 100
    })
  }

  // Sort by count (highest first)
  return mockData.sort((a, b) => b.count - a.count)
}
