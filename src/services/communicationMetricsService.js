import axios from "axios"
import {
  getCurrentMonthRange,
  getDefaultTimeRange,
  dateTimeToEpoch
} from "../utils/dateUtils"

// API endpoint for Clickhouse queries
// Using our own API route to avoid CORS issues
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

// SQL queries for each metric based on the CSV file
const METRICS_QUERIES = {
  // GTC - CRM Threads
  threadsInitiated: `eventType = 'TEXT_COMMUNICATION' AND (eventSubType = 'THREAD_CONNECTOR_MESSAGE_INITIATED' OR (eventSubType = 'GTC_MESSAGE_INITIATED' AND origin = 'THREADS'))`,
  threadsSuccess: `eventType = 'TEXT_COMMUNICATION' AND (eventSubType = 'THREAD_CONNECTOR_MESSAGE_SUCCESS' OR (eventSubType = 'GTC_MESSAGE_INITIATION_SUCCESS' AND origin = 'THREADS'))`,
  threadsApiFailure: `eventType = 'TEXT_COMMUNICATION' AND eventSubType = 'TEXT_DELIVERY_FAILURE' AND eventMessage = 'API_FAILURE' AND origin = 'THREADS' AND JSONExtractString(eventMetaData, 'deptName') = '' AND JSONExtractString(eventMetaData, 'communicationChannel') = '' AND JSONExtractString(eventMetaData, 'messageId') = '' AND (CASE WHEN JSONExtractString(eventMetaData, 'deptName') = '' AND JSONExtractString(eventMetaData, 'communicationChannel') = '' AND JSONExtractString(eventMetaData, 'messageId') = '' AND eventMessage <> 'TMS_MESSAGE_INITIATED' THEN 'GTC' ELSE 'TWILLIO' END) = 'GTC'`,
  threadsDeliveryFailure: `eventType = 'TEXT_COMMUNICATION' AND eventSubType = 'TEXT_DELIVERY_FAILURE' AND eventMessage = 'DELIVERY_FAILURE' AND origin = 'THREADS' AND JSONExtractString(eventMetaData, 'deptName') = '' AND JSONExtractString(eventMetaData, 'communicationChannel') = '' AND JSONExtractString(eventMetaData, 'messageId') = ''`,

  // GTC - CRM Non-Threads
  nonThreadsInitiated: `eventType = 'TEXT_COMMUNICATION' AND eventSubType = 'GTC_MESSAGE_INITIATED' AND (origin = 'NON_THREADS' OR origin IS NULL OR origin = '')`,
  nonThreadsApiFailure: `eventType = 'TEXT_COMMUNICATION' AND eventSubType = 'TEXT_DELIVERY_FAILURE' AND eventMessage = 'API_FAILURE' AND (origin = 'NON_THREADS' OR origin IS NULL OR origin = '') AND JSONExtractString(eventMetaData, 'deptName') = '' AND JSONExtractString(eventMetaData, 'communicationChannel') = '' AND JSONExtractString(eventMetaData, 'messageId') = ''`,
  nonThreadsDeliveryFailure: `eventType = 'TEXT_COMMUNICATION' AND eventSubType = 'TEXT_DELIVERY_FAILURE' AND eventMessage = 'DELIVERY_FAILURE' AND (origin = 'NON_THREADS' OR origin IS NULL OR origin = '') AND JSONExtractString(eventMetaData, 'deptName') = '' AND JSONExtractString(eventMetaData, 'communicationChannel') = '' AND JSONExtractString(eventMetaData, 'messageId') = ''`,

  // Twilio - Non CRM
  twilioInitiated: `eventType = 'TEXT_COMMUNICATION' AND eventSubType = 'TMS_MESSAGE_INITIATED'`,
  twilioApiFailure: `eventType = 'TEXT_COMMUNICATION' AND eventSubType = 'TEXT_DELIVERY_FAILURE' AND eventMessage = 'API_FAILURE' AND (JSONExtractString(eventMetaData, 'deptName') != '' OR JSONExtractString(eventMetaData, 'communicationChannel') != '')`,
  twilioDeliveryFailure: `eventType = 'TEXT_COMMUNICATION' AND eventSubType = 'TEXT_DELIVERY_FAILURE' AND eventMessage = 'DELIVERY_FAILURE' AND JSONExtractString(eventMetaData, 'messageId') != ''`
}

// Mock data for development
const mockCommunicationMetricsData = [
  {
    id: "1",
    tenantId: "tenant1",
    dealerId: "dealer1",
    // GTC - CRM Threads
    threadsInitiated: 1250,
    threadsSuccess: 1150,
    threadsFailure: 100,
    threadsApiFailure: 60,
    threadsDeliveryFailure: 40,
    // GTC - CRM Non-Threads
    nonThreadsInitiated: 980,
    nonThreadsSuccess: 920,
    nonThreadsFailure: 60,
    nonThreadsApiFailure: 35,
    nonThreadsDeliveryFailure: 25,
    // Twilio - Non CRM
    twilioInitiated: 750,
    twilioSuccess: 700,
    twilioFailure: 50,
    twilioApiFailure: 30,
    twilioDeliveryFailure: 20,
    // Calculated fields
    threadsFailureRate: "8.0%",
    nonThreadsFailureRate: "6.1%",
    twilioFailureRate: "6.7%",
    totalInitiated: 2980,
    totalSuccess: 2770,
    totalFailure: 210,
    totalFailureRate: "7.0%",
    timestamp: "2023-01-15"
  },
  {
    id: "2",
    tenantId: "tenant2",
    dealerId: "dealer2",
    // GTC - CRM Threads
    threadsInitiated: 1540,
    threadsSuccess: 1480,
    threadsFailure: 60,
    threadsApiFailure: 40,
    threadsDeliveryFailure: 20,
    // GTC - CRM Non-Threads
    nonThreadsInitiated: 1120,
    nonThreadsSuccess: 1050,
    nonThreadsFailure: 70,
    nonThreadsApiFailure: 45,
    nonThreadsDeliveryFailure: 25,
    // Twilio - Non CRM
    twilioInitiated: 890,
    twilioSuccess: 850,
    twilioFailure: 40,
    twilioApiFailure: 25,
    twilioDeliveryFailure: 15,
    // Calculated fields
    threadsFailureRate: "3.9%",
    nonThreadsFailureRate: "6.3%",
    twilioFailureRate: "4.5%",
    totalInitiated: 3550,
    totalSuccess: 3380,
    totalFailure: 170,
    totalFailureRate: "4.8%",
    timestamp: "2023-02-20"
  },
  {
    id: "3",
    tenantId: "tenant3",
    dealerId: "dealer3",
    // GTC - CRM Threads
    threadsInitiated: 1320,
    threadsSuccess: 1250,
    threadsFailure: 70,
    threadsApiFailure: 45,
    threadsDeliveryFailure: 25,
    // GTC - CRM Non-Threads
    nonThreadsInitiated: 940,
    nonThreadsSuccess: 890,
    nonThreadsFailure: 50,
    nonThreadsApiFailure: 30,
    nonThreadsDeliveryFailure: 20,
    // Twilio - Non CRM
    twilioInitiated: 680,
    twilioSuccess: 650,
    twilioFailure: 30,
    twilioApiFailure: 18,
    twilioDeliveryFailure: 12,
    // Calculated fields
    threadsFailureRate: "5.3%",
    nonThreadsFailureRate: "5.3%",
    twilioFailureRate: "4.4%",
    totalInitiated: 2940,
    totalSuccess: 2790,
    totalFailure: 150,
    totalFailureRate: "5.1%",
    timestamp: "2023-03-10"
  }
]

// Function to fetch communication metrics data
export async function fetchCommunicationMetricsData(filters) {
  try {
    // For development/testing, use mock data
    if (process.env.NODE_ENV === "development") {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Apply filters to mock data
      let filteredData = [...mockCommunicationMetricsData]

      if (filters?.tenantId) {
        filteredData = filteredData.filter(item =>
          item.tenantId.toLowerCase().includes(filters.tenantId.toLowerCase())
        )
      }

      if (filters?.dealerId) {
        filteredData = filteredData.filter(item =>
          item.dealerId.toLowerCase().includes(filters.dealerId.toLowerCase())
        )
      }

      if (filters?.startDate && filters?.endDate) {
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item.timestamp)
          const startDate = new Date(filters.startDate)
          const endDate = new Date(filters.endDate)
          return itemDate >= startDate && itemDate <= endDate
        })
      }

      return filteredData
    }

    // For production, make the actual API call
    // This is a placeholder for the actual query you would use
    const query = buildMetricsQuery(filters)

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("API Request Payload:", payload)

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log("API Response:", response.data)

    // Process the raw data into our structured format
    const processedData = processRawMetricsData(response.data.data.data)
    return processedData
  } catch (error) {
    console.error("Error fetching communication metrics data:", error)
    throw error
  }
}

// Function to build the metrics query based on filters
function buildMetricsQuery(filters) {
  // This is a simplified example - in a real implementation, you would build a more complex query
  // that fetches all the metrics in one go or uses multiple queries

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
    ${dateFilter}
    ${tenantFilter}
    ${dealerFilter}
  GROUP BY
    tenantId, dealerId, eventSubType, eventMessage, origin, providerType
  ORDER BY
    tenantId, dealerId, count DESC;
  `
}

// Function to process raw metrics data into our structured format
function processRawMetricsData(rawData) {
  // In a real implementation, you would process the raw data from the API
  // and transform it into the CommunicationMetricsItem format

  // Process the raw data, considering the providerType field
  // This is a placeholder for the actual implementation
  console.log(
    "Processing raw data with providerType:",
    rawData.map(row => ({
      eventSubType: row.eventSubType,
      eventMessage: row.eventMessage,
      origin: row.origin,
      providerType: row.providerType
    }))
  )

  // For now, we'll just return the mock data
  return mockCommunicationMetricsData
}

// Function to calculate summary metrics
export function calculateCommunicationSummaryMetrics(data) {
  // Calculate totals
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

  const totalNonThreadsInitiated = data.reduce(
    (sum, item) => sum + item.nonThreadsInitiated,
    0
  )
  const totalNonThreadsSuccess = data.reduce(
    (sum, item) => sum + item.nonThreadsSuccess,
    0
  )
  const totalNonThreadsFailure = data.reduce(
    (sum, item) => sum + item.nonThreadsFailure,
    0
  )
  const totalNonThreadsApiFailure = data.reduce(
    (sum, item) => sum + item.nonThreadsApiFailure,
    0
  )
  const totalNonThreadsDeliveryFailure = data.reduce(
    (sum, item) => sum + item.nonThreadsDeliveryFailure,
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

  // Calculate overall totals
  const totalInitiated =
    totalThreadsInitiated + totalNonThreadsInitiated + totalTwilioInitiated
  const totalSuccess =
    totalThreadsSuccess + totalNonThreadsSuccess + totalTwilioSuccess
  const totalFailure =
    totalThreadsFailure + totalNonThreadsFailure + totalTwilioFailure

  // Calculate failure rates
  const threadsFailureRate =
    totalThreadsInitiated > 0
      ? ((totalThreadsFailure / totalThreadsInitiated) * 100).toFixed(1) + "%"
      : "0%"

  const nonThreadsFailureRate =
    totalNonThreadsInitiated > 0
      ? ((totalNonThreadsFailure / totalNonThreadsInitiated) * 100).toFixed(1) +
        "%"
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
    // GTC - CRM Threads
    totalThreadsInitiated,
    totalThreadsSuccess,
    totalThreadsFailure,
    totalThreadsApiFailure,
    totalThreadsDeliveryFailure,
    threadsFailureRate,

    // GTC - CRM Non-Threads
    totalNonThreadsInitiated,
    totalNonThreadsSuccess,
    totalNonThreadsFailure,
    totalNonThreadsApiFailure,
    totalNonThreadsDeliveryFailure,
    nonThreadsFailureRate,

    // Twilio - Non CRM
    totalTwilioInitiated,
    totalTwilioSuccess,
    totalTwilioFailure,
    totalTwilioApiFailure,
    totalTwilioDeliveryFailure,
    twilioFailureRate,

    // Overall totals
    totalInitiated,
    totalSuccess,
    totalFailure,
    totalFailureRate
  }
}
