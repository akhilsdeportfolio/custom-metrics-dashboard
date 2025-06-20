import axios from "axios"
import { getYearToDateRange } from "../utils/dateUtils"

// API endpoint for Clickhouse queries
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "https://app.tekioncloud.com/api/apmserving/u/v1/query/clickhouse/raw"

// Get Year to Date range
const { startDate } = getYearToDateRange()

// Convert date to Unix timestamp (seconds since epoch)
const getUnixTimestamp = dateStr => {
  return Math.floor(new Date(dateStr).getTime() / 1000)
}

// Start timestamp for queries
const startTimestamp = getUnixTimestamp(startDate)

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

    console.log("Auth Info from localStorage:", {
      token: token ? `${token.substring(0, 10)}...` : null,
      userId,
      tenantId,
      tenantName,
      dealerId,
      roleId
    })

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

  console.log("Request Config:", {
    url: config.url,
    method: config.method,
    headers: config.headers
  })

  return config
})

// Function to generate Threads failures query with optional month, tenant, and dealer filters
const getThreadsFailuresQuery = (month, tenantId, dealerId) => {
  // Base query
  let query = `
  SELECT
    JSONExtractString(eventMetaData, 'errorMessage') as ThreadsFailureMessage,
    JSONExtractString(eventMetaData, 'origin-platform') as origin,
    eventMessage,
    eventSubType,
    count(*) as count
  FROM
    dwh.custom_metrics
  WHERE
    serviceEnvironment LIKE 'prod%'
    AND eventType = 'TEXT_COMMUNICATION'
    AND (
      -- THREAD_CONNECTOR messages always go to THREADS
      (eventSubType = 'TEXT_MESSAGE_INITIATED' AND eventMessage = 'THREAD_CONNECTOR_MESSAGE_INITIATED')
      OR (eventSubType = 'TEXT_MESSAGE_INITIATED' AND eventMessage = 'THREAD_CONNECTOR_MESSAGE_SUCCESS')
      -- TMS and GTC messages with THREADS origin go to THREADS
      OR (eventSubType = 'TEXT_MESSAGE_INITIATED' AND eventMessage = 'TMS_MESSAGE_INITIATED' AND JSONExtractString(eventMetaData, 'origin-platform') = 'THREADS')
      OR (eventSubType = 'TEXT_MESSAGE_INITIATED' AND eventMessage = 'GTC_MESSAGE_INITIATED')
      OR (eventSubType = 'TEXT_MESSAGE_INITIATED' AND eventMessage = 'GTC_MESSAGE_INITIATION_SUCCESS')
      -- USER_NOT_MAPPED with empty origin goes to THREADS FAILURE
      OR (eventSubType = 'TEXT_MESSAGE_INITIATED' AND eventMessage = 'USER_NOT_MAPPED' AND (JSONExtractString(eventMetaData, 'origin-platform') = '' OR JSONExtractString(eventMetaData, 'origin-platform') IS NULL))
      -- Failures with THREADS origin go to THREADS
      OR (eventSubType = 'TEXT_DELIVERY_FAILURE' AND JSONExtractString(eventMetaData, 'origin-platform') = 'THREADS')
    )`

  // Add timestamp filter
  if (month) {
    // Convert month to start and end timestamps
    const monthDate = new Date(month)
    const startOfMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    )
    const endOfMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
      23,
      59,
      59
    )

    const monthStartTimestamp = getUnixTimestamp(startOfMonth.toISOString())
    const monthEndTimestamp = getUnixTimestamp(endOfMonth.toISOString())

    query += `
    AND eventTimestamp >= ${monthStartTimestamp}
    AND eventTimestamp <= ${monthEndTimestamp}`
  } else {
    // Use year-to-date filter if no month specified
    query += `
    AND eventTimestamp > ${startTimestamp}`
  }

  // Add tenant filter if specified
  if (tenantId) {
    query += `
    AND tenantId = '${tenantId}'`
  }

  // Add dealer filter if specified
  if (dealerId) {
    query += `
    AND dealerId = '${dealerId}'`
  }

  // Add grouping and ordering
  query += `
  GROUP BY
    ThreadsFailureMessage, origin, eventMessage, eventSubType
  ORDER BY
    count DESC`

  return query
}

// Function to generate API failures query with optional month, tenant, and dealer filters
const getAPIFailuresQuery = (month, tenantId, dealerId) => {
  // Base query
  let query = `
  SELECT
    JSONExtractString(eventMetaData, 'errorMessage') as GTCAPIFailureMessage,
    JSONExtractString(eventMetaData, 'origin-platform') as origin,
    eventMessage,
    count(*) as count
  FROM
    dwh.custom_metrics
  WHERE
    serviceEnvironment LIKE 'prod%'
    AND eventType = 'TEXT_COMMUNICATION'
    AND eventSubType = 'TEXT_DELIVERY_FAILURE'
    AND eventMessage = 'API_FAILURE'
    AND (JSONExtractString(eventMetaData, 'origin-platform') = ''
         OR JSONExtractString(eventMetaData, 'origin-platform') = 'NON-THREADS'
         OR JSONExtractString(eventMetaData, 'origin-platform') IS NULL)`

  // Add timestamp filter
  if (month) {
    // Convert month to start and end timestamps
    const monthDate = new Date(month)
    const startOfMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    )
    const endOfMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
      23,
      59,
      59
    )

    const monthStartTimestamp = getUnixTimestamp(startOfMonth.toISOString())
    const monthEndTimestamp = getUnixTimestamp(endOfMonth.toISOString())

    query += `
    AND eventTimestamp >= ${monthStartTimestamp}
    AND eventTimestamp <= ${monthEndTimestamp}`
  } else {
    // Use year-to-date filter if no month specified
    query += `
    AND eventTimestamp > ${startTimestamp}`
  }

  // Add tenant filter if specified
  if (tenantId) {
    query += `
    AND tenantId = '${tenantId}'`
  }

  // Add dealer filter if specified
  if (dealerId) {
    query += `
    AND dealerId = '${dealerId}'`
  }

  // Add grouping and ordering
  query += `
  GROUP BY
    GTCAPIFailureMessage, origin, eventMessage
  ORDER BY
    count DESC`

  return query
}

// Function to generate delivery failures query with optional month, tenant, and dealer filters
const getDeliveryFailuresQuery = (month, tenantId, dealerId) => {
  // Base query
  let query = `
  SELECT
    JSONExtractString(eventMetaData, 'deliveryStatusDescription') as GTCDeliveryFailureMessage,
    JSONExtractString(eventMetaData, 'origin-platform') as origin,
    eventMessage,
    count(*) as count
  FROM
    dwh.custom_metrics
  WHERE
    serviceEnvironment LIKE 'prod%'
    AND eventType = 'TEXT_COMMUNICATION'
    AND eventSubType = 'TEXT_DELIVERY_FAILURE'
    AND eventMessage = 'DELIVERY_FAILURE'
    AND (JSONExtractString(eventMetaData, 'origin-platform') = ''
         OR JSONExtractString(eventMetaData, 'origin-platform') = 'NON-THREADS'
         OR JSONExtractString(eventMetaData, 'origin-platform') IS NULL)`

  // Add timestamp filter
  if (month) {
    // Convert month to start and end timestamps
    const monthDate = new Date(month)
    const startOfMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    )
    const endOfMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
      23,
      59,
      59
    )

    const monthStartTimestamp = getUnixTimestamp(startOfMonth.toISOString())
    const monthEndTimestamp = getUnixTimestamp(endOfMonth.toISOString())

    query += `
    AND eventTimestamp >= ${monthStartTimestamp}
    AND eventTimestamp <= ${monthEndTimestamp}`
  } else {
    // Use year-to-date filter if no month specified
    query += `
    AND eventTimestamp > ${startTimestamp}`
  }

  // Add tenant filter if specified
  if (tenantId) {
    query += `
    AND tenantId = '${tenantId}'`
  }

  // Add dealer filter if specified
  if (dealerId) {
    query += `
    AND dealerId = '${dealerId}'`
  }

  // Add grouping and ordering
  query += `
  GROUP BY
    GTCDeliveryFailureMessage, origin, eventMessage
  ORDER BY
    count DESC`

  return query
}

// Fetch API failure details
export async function fetchAPIFailureDetails(month, tenantId, dealerId) {
  try {
    // For development/testing, return mock data
    if (process.env.NODE_ENV === "development") {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Return mock data with month filter if provided
      const mockData = [
        {
          message: "Rate limit exceeded",
          origin: "ARC",
          eventMessage: "API_FAILURE",
          count: 720
        },
        {
          message: "Authentication failed",
          origin: "ARC",
          eventMessage: "API_FAILURE",
          count: 520
        },
        {
          message: "Invalid request parameters",
          origin: "CRM",
          eventMessage: "API_FAILURE",
          count: 480
        },
        {
          message: "Internal server error",
          origin: "CRM",
          eventMessage: "API_FAILURE",
          count: 280
        },
        {
          message: "Message too long",
          origin: "ARC",
          eventMessage: "API_FAILURE",
          count: 180
        },
        {
          message: "Connection timeout",
          origin: "ARC",
          eventMessage: "API_FAILURE",
          count: 150
        },
        {
          message: "Invalid API key",
          origin: "CRM",
          eventMessage: "API_FAILURE",
          count: 120
        },
        {
          message: "Service unavailable",
          origin: "ARC",
          eventMessage: "API_FAILURE",
          count: 90
        }
      ]

      // If month is provided, filter the mock data (just reduce counts for demo)
      if (month) {
        const monthName = new Date(month).toLocaleDateString("en-US", {
          month: "long"
        })
        console.log(`Filtering API failures for month: ${monthName}`)
        return mockData.map(item => ({
          ...item,
          count: Math.floor(item.count * 0.3), // Reduce counts to simulate month filtering
          month: monthName // Add month info
        }))
      }

      return mockData
    }

    // For production, make the actual API call
    const query = getAPIFailuresQuery(month, tenantId, dealerId)
    console.log("API Failures Query:", query)

    // Log tenant and dealer filters if provided
    if (tenantId || dealerId) {
      console.log("API Failures Filters:", { tenantId, dealerId })
    }

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("API Failures Payload:", JSON.stringify(payload, null, 2))
    console.log(
      "API Failures Headers:",
      JSON.stringify(apiClient.defaults.headers, null, 2)
    )

    console.log("Making API Failures request to:", API_ENDPOINT)
    const response = await apiClient.post(API_ENDPOINT, payload)
    console.log("API Failures Response Status:", response.status)
    console.log(
      "API Failures Response Data:",
      JSON.stringify(response.data, null, 2)
    )

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    // Transform the response data
    const transformedData = response.data.data.data.map(item => ({
      message: item.GTCAPIFailureMessage || "Unknown",
      origin: item.origin || "Unknown",
      eventMessage: item.eventMessage || "",
      count: parseInt(item.count, 10)
    }))

    console.log("API Failures Transformed Data:", transformedData)
    return transformedData
  } catch (error) {
    console.error("Error fetching API failure details:", error)
    throw error
  }
}

// Fetch Threads failure details
export async function fetchThreadsFailureDetails(month, tenantId, dealerId) {
  try {
    // For development/testing, return mock data
    if (process.env.NODE_ENV === "development") {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Return mock data with month filter if provided
      const mockData = [
        {
          message: "Invalid phone number format",
          origin: "THREADS",
          eventMessage: "API_FAILURE",
          count: 450
        },
        {
          message: "Service unavailable",
          origin: "THREADS",
          eventMessage: "API_FAILURE",
          count: 350
        },
        {
          message: "Network timeout",
          origin: "THREADS",
          eventMessage: "API_FAILURE",
          count: 280
        },
        {
          message: "Authentication failed",
          origin: "THREADS",
          eventMessage: "API_FAILURE",
          count: 220
        },
        {
          message: "Message too long",
          origin: "THREADS",
          eventMessage: "DELIVERY_FAILURE",
          count: 180
        },
        {
          message: "Rate limit exceeded",
          origin: "THREADS",
          eventMessage: "API_FAILURE",
          count: 150
        },
        {
          message: "Invalid request parameters",
          origin: "THREADS",
          eventMessage: "API_FAILURE",
          count: 120
        },
        {
          message: "Internal server error",
          origin: "THREADS",
          eventMessage: "API_FAILURE",
          count: 90
        }
      ]

      // If month is provided, filter the mock data (just reduce counts for demo)
      if (month) {
        const monthName = new Date(month).toLocaleDateString("en-US", {
          month: "long"
        })
        console.log(`Filtering Threads failures for month: ${monthName}`)
        return mockData.map(item => ({
          ...item,
          count: Math.floor(item.count * 0.3), // Reduce counts to simulate month filtering
          month: monthName // Add month info
        }))
      }

      return mockData
    }

    // For production, make the actual API call
    const query = getThreadsFailuresQuery(month, tenantId, dealerId)
    console.log("Threads Failures Query:", query)

    // Log tenant and dealer filters if provided
    if (tenantId || dealerId) {
      console.log("Threads Failures Filters:", { tenantId, dealerId })
    }

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("Threads Failures Payload:", JSON.stringify(payload, null, 2))
    console.log(
      "Threads Failures Headers:",
      JSON.stringify(apiClient.defaults.headers, null, 2)
    )

    console.log("Making Threads Failures request to:", API_ENDPOINT)
    const response = await apiClient.post(API_ENDPOINT, payload)
    console.log("Threads Failures Response Status:", response.status)
    console.log(
      "Threads Failures Response Data:",
      JSON.stringify(response.data, null, 2)
    )

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    // Transform the response data
    const transformedData = response.data.data.data.map(item => ({
      message: item.ThreadsFailureMessage || "Unknown",
      origin: item.origin || "Unknown",
      eventMessage: item.eventMessage || "",
      eventSubType: item.eventSubType || "",
      count: parseInt(item.count, 10)
    }))

    console.log("Threads Failures Transformed Data:", transformedData)
    return transformedData
  } catch (error) {
    console.error("Error fetching Threads failure details:", error)
    throw error
  }
}

// Fetch delivery failure details
export async function fetchDeliveryFailureDetails(month, tenantId, dealerId) {
  try {
    // For development/testing, return mock data
    if (process.env.NODE_ENV === "development") {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Return mock data with month filter if provided
      const mockData = [
        {
          message: "Recipient opted out",
          origin: "ARC",
          eventMessage: "DELIVERY_FAILURE",
          count: 760
        },
        {
          message: "Carrier rejected",
          origin: "CRM",
          eventMessage: "DELIVERY_FAILURE",
          count: 540
        },
        {
          message: "Destination unreachable",
          origin: "ARC",
          eventMessage: "DELIVERY_FAILURE",
          count: 420
        },
        {
          message: "Delivery timed out",
          origin: "CRM",
          eventMessage: "DELIVERY_FAILURE",
          count: 320
        },
        {
          message: "Unknown failure",
          origin: "ARC",
          eventMessage: "DELIVERY_FAILURE",
          count: 210
        },
        {
          message: "Invalid phone number",
          origin: "CRM",
          eventMessage: "DELIVERY_FAILURE",
          count: 180
        },
        {
          message: "Message blocked by carrier",
          origin: "ARC",
          eventMessage: "DELIVERY_FAILURE",
          count: 150
        },
        {
          message: "Recipient blacklisted",
          origin: "CRM",
          eventMessage: "DELIVERY_FAILURE",
          count: 120
        }
      ]

      // If month is provided, filter the mock data (just reduce counts for demo)
      if (month) {
        const monthName = new Date(month).toLocaleDateString("en-US", {
          month: "long"
        })
        console.log(`Filtering delivery failures for month: ${monthName}`)
        return mockData.map(item => ({
          ...item,
          count: Math.floor(item.count * 0.3), // Reduce counts to simulate month filtering
          month: monthName // Add month info
        }))
      }

      return mockData
    }

    // For production, make the actual API call
    const query = getDeliveryFailuresQuery(month, tenantId, dealerId)
    console.log("Delivery Failures Query:", query)

    // Log tenant and dealer filters if provided
    if (tenantId || dealerId) {
      console.log("Delivery Failures Filters:", { tenantId, dealerId })
    }

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("Delivery Failures Payload:", JSON.stringify(payload, null, 2))
    console.log(
      "Delivery Failures Headers:",
      JSON.stringify(apiClient.defaults.headers, null, 2)
    )

    console.log("Making Delivery Failures request to:", API_ENDPOINT)
    const response = await apiClient.post(API_ENDPOINT, payload)
    console.log("Delivery Failures Response Status:", response.status)
    console.log(
      "Delivery Failures Response Data:",
      JSON.stringify(response.data, null, 2)
    )

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    // Transform the response data
    const transformedData = response.data.data.data.map(item => ({
      message: item.GTCDeliveryFailureMessage || "Unknown",
      origin: item.origin || "Unknown",
      eventMessage: item.eventMessage || "",
      count: parseInt(item.count, 10)
    }))

    console.log("Delivery Failures Transformed Data:", transformedData)
    return transformedData
  } catch (error) {
    console.error("Error fetching delivery failure details:", error)
    throw error
  }
}
