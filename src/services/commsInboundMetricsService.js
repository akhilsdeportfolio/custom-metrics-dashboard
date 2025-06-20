import axios from "axios"
import {
  getCurrentMonthRange,
  getDefaultTimeRange
} from "../utils/dateUtils"

// API endpoint for Clickhouse queries
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "https://app.tekioncloud.com/api/apmserving/u/v1/query/clickhouse/raw"

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

// Generate mock monthly data for inbound communications
function generateMonthlyData() {
  const months = []
  const currentDate = new Date()

  // Generate data for the last 12 months
  for (let i = 0; i < 12; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    )
    const monthStr = date
      .toISOString()
      .split("T")[0]
      .substring(0, 7) // YYYY-MM format
    const formattedMonth =
      date.toLocaleString("default", { month: "short" }) +
      " " +
      date.getFullYear()

    // Generate random inbound metrics with some variation
    const threadsInitiated = 800 + Math.floor(Math.random() * 800) // Slightly lower for inbound
    const threadsSuccess = threadsInitiated - Math.floor(Math.random() * 150)
    const threadsFailure = threadsInitiated - threadsSuccess
    const threadsApiFailure = Math.floor(threadsFailure * 0.6)
    const threadsDeliveryFailure = threadsFailure - threadsApiFailure
    const threadsFailureRate =
      ((threadsFailure / threadsInitiated) * 100).toFixed(1) + "%"

    const nonThreadsInitiated = 1200 + Math.floor(Math.random() * 1200)
    const nonThreadsSuccess =
      nonThreadsInitiated - Math.floor(Math.random() * 200)
    const nonThreadsFailure = nonThreadsInitiated - nonThreadsSuccess
    const nonThreadsApiFailure = Math.floor(nonThreadsFailure * 0.6)
    const nonThreadsDeliveryFailure = nonThreadsFailure - nonThreadsApiFailure
    const nonThreadsFailureRate =
      ((nonThreadsFailure / nonThreadsInitiated) * 100).toFixed(1) + "%"

    const twilioInitiated = 500 + Math.floor(Math.random() * 500) // Lower for inbound
    const twilioSuccess = twilioInitiated - Math.floor(Math.random() * 80)
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

    months.push({
      month: monthStr,
      formattedMonth,
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
    })
  }

  // Sort in reverse chronological order (newest first)
  return months.reverse()
}

// Generate mock monthly data
export const mockMonthlyMetricsData = generateMonthlyData()

// Generate mock tenant/dealer data for inbound communications
function generateTenantDealerData() {
  const tenantIds = [
    "TENANT_001",
    "TENANT_002",
    "TENANT_003",
    "TENANT_004",
    "TENANT_005"
  ]
  const dealersByTenant = {
    TENANT_001: ["DEALER_A1", "DEALER_A2", "DEALER_A3"],
    TENANT_002: ["DEALER_B1", "DEALER_B2"],
    TENANT_003: ["DEALER_C1", "DEALER_C2", "DEALER_C3", "DEALER_C4"],
    TENANT_004: ["DEALER_D1", "DEALER_D2"],
    TENANT_005: ["DEALER_E1", "DEALER_E2", "DEALER_E3"]
  }

  const result = []

  // Generate data for each tenant and dealer
  tenantIds.forEach(tenantId => {
    const dealers = dealersByTenant[tenantId] || []

    dealers.forEach(dealerId => {
      // Generate random inbound metrics with some variation
      const threadsInitiated = 800 + Math.floor(Math.random() * 4000)
      const threadsSuccess = threadsInitiated - Math.floor(Math.random() * 400)
      const threadsFailure = threadsInitiated - threadsSuccess
      const threadsApiFailure = Math.floor(threadsFailure * 0.6)
      const threadsDeliveryFailure = threadsFailure - threadsApiFailure
      const threadsFailureRate =
        ((threadsFailure / threadsInitiated) * 100).toFixed(1) + "%"

      const nonThreadsInitiated = 1200 + Math.floor(Math.random() * 6000)
      const nonThreadsSuccess =
        nonThreadsInitiated - Math.floor(Math.random() * 600)
      const nonThreadsFailure = nonThreadsInitiated - nonThreadsSuccess
      const nonThreadsApiFailure = Math.floor(nonThreadsFailure * 0.6)
      const nonThreadsDeliveryFailure = nonThreadsFailure - nonThreadsApiFailure
      const nonThreadsFailureRate =
        ((nonThreadsFailure / nonThreadsInitiated) * 100).toFixed(1) + "%"

      const twilioInitiated = 500 + Math.floor(Math.random() * 2500)
      const twilioSuccess = twilioInitiated - Math.floor(Math.random() * 250)
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

      result.push({
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
      })
    })
  })

  return result
}

// Generate mock tenant/dealer data
export const mockTenantDealerMetricsData = generateTenantDealerData()

// Function to fetch monthly metrics data for inbound communications
export async function fetchMonthlyMetricsData(filters) {
  try {
    // For development/testing, use mock data
    if (process.env.NODE_ENV === "development") {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Apply filters to mock data
      let filteredData = [...mockMonthlyMetricsData]

      if (filters?.startDate && filters?.endDate) {
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item.month)
          const startDate = new Date(filters.startDate)
          const endDate = new Date(filters.endDate)
          return itemDate >= startDate && itemDate <= endDate
        })
      }

      return filteredData
    }

    // For production, make the actual API call
    const query = buildMonthlyInboundMetricsQuery(filters)

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("Monthly Inbound Metrics API Request Payload:", payload)

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log("Monthly Inbound Metrics API Response:", response.data)

    // Process the raw data into our structured format
    const processedData = processRawMonthlyMetricsData(response.data.data.data)
    return processedData
  } catch (error) {
    console.error("Error fetching monthly inbound metrics data:", error)
    throw error
  }
}

// Function to fetch tenant/dealer metrics data for inbound communications
export async function fetchTenantDealerMetricsData(filters) {
  try {
    // For development/testing, use mock data
    if (process.env.NODE_ENV === "development") {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Apply filters to mock data
      let filteredData = [...mockTenantDealerMetricsData]

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

      return filteredData
    }

    // For production, make the actual API call
    const query = buildTenantDealerInboundMetricsQuery(filters)

    const payload = {
      query,
      dbName: "default",
      tableName: "dwh.custom_metrics"
    }

    console.log("Tenant/Dealer Inbound Metrics API Request Payload:", payload)

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log("Tenant/Dealer Inbound Metrics API Response:", response.data)

    // Process the raw data into our structured format
    const processedData = processRawTenantDealerMetricsData(
      response.data.data.data
    )
    return processedData
  } catch (error) {
    console.error("Error fetching tenant/dealer inbound metrics data:", error)
    throw error
  }
}

// Build SQL query for monthly inbound metrics
function buildMonthlyInboundMetricsQuery(filters) {
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

  // Convert to Unix timestamp (using the syntax from your working query)
  const startTimestamp = Math.floor(
    new Date(`${startDate} ${startTime}:00`).getTime() / 1000
  )
  const endTimestamp = Math.floor(
    new Date(`${endDate} ${endTime}:59`).getTime() / 1000
  )

  // Build provider filter for monthly query
  const providerType = filters?.providerType
  let providerFilter = ""
  if (providerType === "GTC") {
    providerFilter = ` AND JSONExtractString(JSONExtractString(eventMetaData, 'response'), 'provider') = 'GTC'`
  } else if (providerType === "TWILIO") {
    providerFilter = ` AND JSONExtractString(JSONExtractString(eventMetaData, 'response'), 'provider') = 'TWILIO'`
  }
  // If providerType is 'ALL' or undefined, no additional filter is added

  // Monthly tab query - apply provider filter when specified
  return `SELECT DATE_TRUNC('month', eventTimestamp) AS month, JSONExtractString(JSONExtractString(eventMetaData, 'response'), 'provider') AS providerType, COUNT(*) AS count FROM dwh.custom_metrics WHERE serviceEnvironment LIKE 'prod%' AND eventType = 'THREADS_CONNECTOR_MESSAGE_CALLBACK' AND eventSubType = 'INTEGRATION_MESSAGE_EVENT_PRODUCER' AND eventMetaData LIKE '%direction\\\\\\\\":\\\\\\\\"IN%' AND toUnixTimestamp(eventTimestamp) >= ${startTimestamp} AND toUnixTimestamp(eventTimestamp) <= ${endTimestamp}${providerFilter} GROUP BY month, providerType ORDER BY month DESC, count DESC`
}

// Build SQL query for tenant/dealer inbound metrics
function buildTenantDealerInboundMetricsQuery(filters) {
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

  // Convert to Unix timestamp (using the syntax from your working query)
  const startTimestamp = Math.floor(
    new Date(`${startDate} ${startTime}:00`).getTime() / 1000
  )
  const endTimestamp = Math.floor(
    new Date(`${endDate} ${endTime}:59`).getTime() / 1000
  )

  // Build provider filter for tenant/dealer query
  const providerType = filters?.providerType
  let providerFilter = ""
  if (providerType === "GTC") {
    providerFilter = ` AND JSONExtractString(JSONExtractString(eventMetaData, 'response'), 'provider') = 'GTC'`
  } else if (providerType === "TWILIO") {
    providerFilter = ` AND JSONExtractString(JSONExtractString(eventMetaData, 'response'), 'provider') = 'TWILIO'`
  }
  // If providerType is 'ALL' or undefined, no additional filter is added

  const tenantFilter = filters?.tenantId
    ? ` AND tenantId = '${filters.tenantId}'`
    : ""
  const dealerFilter = filters?.dealerId
    ? ` AND dealerId = '${filters.dealerId}'`
    : ""

  // Tenant/Dealer tab query - group by tenantId, dealerId, providerType (no month grouping)
  return `SELECT tenantId, dealerId, JSONExtractString(JSONExtractString(eventMetaData, 'response'), 'provider') AS providerType, COUNT(*) AS count FROM dwh.custom_metrics WHERE serviceEnvironment LIKE 'prod%' AND eventType = 'THREADS_CONNECTOR_MESSAGE_CALLBACK' AND eventSubType = 'INTEGRATION_MESSAGE_EVENT_PRODUCER' AND eventMetaData LIKE '%direction\\\\\\\\":\\\\\\\\"IN%' AND toUnixTimestamp(eventTimestamp) >= ${startTimestamp} AND toUnixTimestamp(eventTimestamp) <= ${endTimestamp}${tenantFilter}${dealerFilter}${providerFilter} GROUP BY tenantId, dealerId, providerType ORDER BY tenantId, dealerId, count DESC`
}

// Process raw monthly metrics data from API response
function processRawMonthlyMetricsData(rawData) {
  const groupedByMonth = {}

  console.log("Raw data received:", rawData) // Debug log

  // Process each row of raw data
  rawData.forEach(row => {
    const { month, providerType, count } = row

    console.log("Processing row:", {
      month,
      providerType,
      count,
      countType: typeof count
    }) // Debug log

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
        // For inbound metrics, we'll use threadsInitiated for GTC and twilioInitiated for Twilio
        // This maintains compatibility with existing interfaces
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
    }

    const monthData = groupedByMonth[month]

    // Ensure count is treated as a number to avoid string concatenation
    const numericCount = Number(count)

    // Process based on provider type from the query result
    if (providerType === "GTC") {
      // All inbound GTC messages - use threadsInitiated for GTC inbound
      monthData.threadsInitiated += numericCount
      monthData.threadsSuccess += numericCount
    } else if (providerType === "TWILIO") {
      // All inbound Twilio messages
      monthData.twilioInitiated += numericCount
      monthData.twilioSuccess += numericCount
    }
  })

  // Calculate derived metrics for each month
  const result = Object.values(groupedByMonth).map(monthData => {
    // Calculate failures and success counts
    const threadsFailure =
      monthData.threadsApiFailure + monthData.threadsDeliveryFailure
    const nonThreadsFailure =
      monthData.nonThreadsApiFailure + monthData.nonThreadsDeliveryFailure
    const twilioFailure =
      monthData.twilioApiFailure + monthData.twilioDeliveryFailure

    const nonThreadsSuccess = Math.max(
      0,
      monthData.nonThreadsInitiated - nonThreadsFailure
    )
    const twilioSuccess = Math.max(0, monthData.twilioInitiated - twilioFailure)

    // Calculate totals
    const totalInitiated =
      monthData.threadsInitiated +
      monthData.nonThreadsInitiated +
      monthData.twilioInitiated
    const totalSuccess =
      monthData.threadsSuccess + nonThreadsSuccess + twilioSuccess
    const totalFailure = threadsFailure + nonThreadsFailure + twilioFailure

    // Calculate failure rates
    const threadsFailureRate =
      monthData.threadsInitiated > 0
        ? ((threadsFailure / monthData.threadsInitiated) * 100).toFixed(1) + "%"
        : "0%"

    const nonThreadsFailureRate =
      monthData.nonThreadsInitiated > 0
        ? ((nonThreadsFailure / monthData.nonThreadsInitiated) * 100).toFixed(
            1
          ) + "%"
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
      nonThreadsSuccess,
      nonThreadsFailure,
      nonThreadsFailureRate,
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

// Process raw tenant/dealer metrics data from API response
function processRawTenantDealerMetricsData(rawData) {
  const groupedByTenantDealer = {}

  // Process each row of raw data
  rawData.forEach(row => {
    const { tenantId, dealerId, providerType, count } = row
    const key = `${tenantId}-${dealerId}`

    // Initialize tenant/dealer data if it doesn't exist
    if (!groupedByTenantDealer[key]) {
      groupedByTenantDealer[key] = {
        tenantId,
        dealerId,
        // Initialize all metrics to 0
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
    }

    const tdData = groupedByTenantDealer[key]

    // Ensure count is treated as a number to avoid string concatenation
    const numericCount = Number(count)

    // Process based on provider type
    if (providerType === "GTC") {
      tdData.threadsInitiated += numericCount
      tdData.threadsSuccess += numericCount
    } else if (providerType === "TWILIO") {
      tdData.twilioInitiated += numericCount
      tdData.twilioSuccess += numericCount
    }
  })

  // Calculate derived metrics for each tenant/dealer
  const result = Object.values(groupedByTenantDealer).map(tdData => {
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
    const totalSuccess =
      tdData.threadsSuccess + nonThreadsSuccess + twilioSuccess
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

    return {
      ...tdData,
      threadsFailure,
      threadsFailureRate,
      nonThreadsSuccess,
      nonThreadsFailure,
      nonThreadsFailureRate,
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

// Calculate summary metrics for monthly data
export function calculateMonthlySummaryMetrics(data) {
  const totals = data.reduce(
    (acc, item) => ({
      totalThreadsInitiated: acc.totalThreadsInitiated + item.threadsInitiated,
      totalThreadsSuccess: acc.totalThreadsSuccess + item.threadsSuccess,
      totalThreadsFailure: acc.totalThreadsFailure + item.threadsFailure,
      totalThreadsApiFailure:
        acc.totalThreadsApiFailure + item.threadsApiFailure,
      totalThreadsDeliveryFailure:
        acc.totalThreadsDeliveryFailure + item.threadsDeliveryFailure,

      totalNonThreadsInitiated:
        acc.totalNonThreadsInitiated + item.nonThreadsInitiated,
      totalNonThreadsSuccess:
        acc.totalNonThreadsSuccess + item.nonThreadsSuccess,
      totalNonThreadsFailure:
        acc.totalNonThreadsFailure + item.nonThreadsFailure,
      totalNonThreadsApiFailure:
        acc.totalNonThreadsApiFailure + item.nonThreadsApiFailure,
      totalNonThreadsDeliveryFailure:
        acc.totalNonThreadsDeliveryFailure + item.nonThreadsDeliveryFailure,

      totalTwilioInitiated: acc.totalTwilioInitiated + item.twilioInitiated,
      totalTwilioSuccess: acc.totalTwilioSuccess + item.twilioSuccess,
      totalTwilioFailure: acc.totalTwilioFailure + item.twilioFailure,
      totalTwilioApiFailure: acc.totalTwilioApiFailure + item.twilioApiFailure,
      totalTwilioDeliveryFailure:
        acc.totalTwilioDeliveryFailure + item.twilioDeliveryFailure,

      totalInitiated: acc.totalInitiated + item.totalInitiated,
      totalSuccess: acc.totalSuccess + item.totalSuccess,
      totalFailure: acc.totalFailure + item.totalFailure
    }),
    {
      totalThreadsInitiated: 0,
      totalThreadsSuccess: 0,
      totalThreadsFailure: 0,
      totalThreadsApiFailure: 0,
      totalThreadsDeliveryFailure: 0,
      totalNonThreadsInitiated: 0,
      totalNonThreadsSuccess: 0,
      totalNonThreadsFailure: 0,
      totalNonThreadsApiFailure: 0,
      totalNonThreadsDeliveryFailure: 0,
      totalTwilioInitiated: 0,
      totalTwilioSuccess: 0,
      totalTwilioFailure: 0,
      totalTwilioApiFailure: 0,
      totalTwilioDeliveryFailure: 0,
      totalInitiated: 0,
      totalSuccess: 0,
      totalFailure: 0
    }
  )

  // Calculate failure rates
  const threadsFailureRate =
    totals.totalThreadsInitiated > 0
      ? (
          (totals.totalThreadsFailure / totals.totalThreadsInitiated) *
          100
        ).toFixed(1) + "%"
      : "0%"

  const nonThreadsFailureRate =
    totals.totalNonThreadsInitiated > 0
      ? (
          (totals.totalNonThreadsFailure / totals.totalNonThreadsInitiated) *
          100
        ).toFixed(1) + "%"
      : "0%"

  const twilioFailureRate =
    totals.totalTwilioInitiated > 0
      ? (
          (totals.totalTwilioFailure / totals.totalTwilioInitiated) *
          100
        ).toFixed(1) + "%"
      : "0%"

  const totalFailureRate =
    totals.totalInitiated > 0
      ? ((totals.totalFailure / totals.totalInitiated) * 100).toFixed(1) + "%"
      : "0%"

  return {
    ...totals,
    threadsFailureRate,
    nonThreadsFailureRate,
    twilioFailureRate,
    totalFailureRate
  }
}

// Calculate summary metrics for tenant/dealer data
export function calculateTenantDealerSummaryMetrics(data) {
  const totals = data.reduce(
    (acc, item) => ({
      totalThreadsInitiated: acc.totalThreadsInitiated + item.threadsInitiated,
      totalThreadsSuccess: acc.totalThreadsSuccess + item.threadsSuccess,
      totalThreadsFailure: acc.totalThreadsFailure + item.threadsFailure,
      totalThreadsApiFailure:
        acc.totalThreadsApiFailure + item.threadsApiFailure,
      totalThreadsDeliveryFailure:
        acc.totalThreadsDeliveryFailure + item.threadsDeliveryFailure,

      totalNonThreadsInitiated:
        acc.totalNonThreadsInitiated + item.nonThreadsInitiated,
      totalNonThreadsSuccess:
        acc.totalNonThreadsSuccess + item.nonThreadsSuccess,
      totalNonThreadsFailure:
        acc.totalNonThreadsFailure + item.nonThreadsFailure,
      totalNonThreadsApiFailure:
        acc.totalNonThreadsApiFailure + item.nonThreadsApiFailure,
      totalNonThreadsDeliveryFailure:
        acc.totalNonThreadsDeliveryFailure + item.nonThreadsDeliveryFailure,

      totalTwilioInitiated: acc.totalTwilioInitiated + item.twilioInitiated,
      totalTwilioSuccess: acc.totalTwilioSuccess + item.twilioSuccess,
      totalTwilioFailure: acc.totalTwilioFailure + item.twilioFailure,
      totalTwilioApiFailure: acc.totalTwilioApiFailure + item.twilioApiFailure,
      totalTwilioDeliveryFailure:
        acc.totalTwilioDeliveryFailure + item.twilioDeliveryFailure,

      totalInitiated: acc.totalInitiated + item.totalInitiated,
      totalSuccess: acc.totalSuccess + item.totalSuccess,
      totalFailure: acc.totalFailure + item.totalFailure
    }),
    {
      totalThreadsInitiated: 0,
      totalThreadsSuccess: 0,
      totalThreadsFailure: 0,
      totalThreadsApiFailure: 0,
      totalThreadsDeliveryFailure: 0,
      totalNonThreadsInitiated: 0,
      totalNonThreadsSuccess: 0,
      totalNonThreadsFailure: 0,
      totalNonThreadsApiFailure: 0,
      totalNonThreadsDeliveryFailure: 0,
      totalTwilioInitiated: 0,
      totalTwilioSuccess: 0,
      totalTwilioFailure: 0,
      totalTwilioApiFailure: 0,
      totalTwilioDeliveryFailure: 0,
      totalInitiated: 0,
      totalSuccess: 0,
      totalFailure: 0
    }
  )

  // Calculate failure rates
  const threadsFailureRate =
    totals.totalThreadsInitiated > 0
      ? (
          (totals.totalThreadsFailure / totals.totalThreadsInitiated) *
          100
        ).toFixed(1) + "%"
      : "0%"

  const nonThreadsFailureRate =
    totals.totalNonThreadsInitiated > 0
      ? (
          (totals.totalNonThreadsFailure / totals.totalNonThreadsInitiated) *
          100
        ).toFixed(1) + "%"
      : "0%"

  const twilioFailureRate =
    totals.totalTwilioInitiated > 0
      ? (
          (totals.totalTwilioFailure / totals.totalTwilioInitiated) *
          100
        ).toFixed(1) + "%"
      : "0%"

  const totalFailureRate =
    totals.totalInitiated > 0
      ? ((totals.totalFailure / totals.totalInitiated) * 100).toFixed(1) + "%"
      : "0%"

  return {
    ...totals,
    threadsFailureRate,
    nonThreadsFailureRate,
    twilioFailureRate,
    totalFailureRate
  }
}
