import axios from "axios"
import { getYearToDateRange } from "../utils/dateUtils"

// API endpoint for Clickhouse queries
// Using our own API route to avoid CORS issues
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "https://app.tekioncloud.com/api/apmserving/u/v1/query/clickhouse/raw"

// Get Year to Date range
const { startDate, endDate } = getYearToDateRange()

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

// Mock data for development
const mockDashboardData = [
  {
    id: "1",
    category: "Category A",
    metric1: 1250,
    metric2: 850,
    metric3: 95,
    timestamp: "2023-01-15"
  },
  {
    id: "2",
    category: "Category B",
    metric1: 980,
    metric2: 720,
    metric3: 87,
    timestamp: "2023-02-20"
  },
  {
    id: "3",
    category: "Category C",
    metric1: 1540,
    metric2: 1120,
    metric3: 92,
    timestamp: "2023-03-10"
  },
  {
    id: "4",
    category: "Category D",
    metric1: 890,
    metric2: 640,
    metric3: 78,
    timestamp: "2023-04-05"
  },
  {
    id: "5",
    category: "Category E",
    metric1: 1320,
    metric2: 940,
    metric3: 89,
    timestamp: "2023-05-12"
  },
  {
    id: "6",
    category: "Category F",
    metric1: 1100,
    metric2: 800,
    metric3: 91,
    timestamp: "2023-06-18"
  },
  {
    id: "7",
    category: "Category G",
    metric1: 1450,
    metric2: 1050,
    metric3: 94,
    timestamp: "2023-07-22"
  },
  {
    id: "8",
    category: "Category H",
    metric1: 950,
    metric2: 700,
    metric3: 85,
    timestamp: "2023-08-30"
  },
  {
    id: "9",
    category: "Category I",
    metric1: 1200,
    metric2: 880,
    metric3: 90,
    timestamp: "2023-09-14"
  },
  {
    id: "10",
    category: "Category J",
    metric1: 1050,
    metric2: 760,
    metric3: 88,
    timestamp: "2023-10-25"
  },
  {
    id: "11",
    category: "Category K",
    metric1: 1380,
    metric2: 980,
    metric3: 93,
    timestamp: "2023-11-08"
  },
  {
    id: "12",
    category: "Category L",
    metric1: 920,
    metric2: 680,
    metric3: 82,
    timestamp: "2023-12-19"
  }
]

// Function to fetch dashboard data
export async function fetchDashboardData(filters) {
  try {
    // For development/testing, use mock data
    if (process.env.NODE_ENV === "development") {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Apply filters to mock data
      let filteredData = [...mockDashboardData]

      if (filters?.category) {
        filteredData = filteredData.filter(item =>
          item.category.toLowerCase().includes(filters.category.toLowerCase())
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
    const query = `
    SELECT
      id,
      category,
      metric1,
      metric2,
      metric3,
      timestamp
    FROM
      your_table_name
    WHERE
      timestamp >= '${filters?.startDate || startDate}' AND
      timestamp <= '${filters?.endDate || endDate}'
      ${filters?.category ? `AND category LIKE '%${filters.category}%'` : ""}
    ORDER BY
      timestamp DESC
    `

    const payload = {
      query,
      dbName: "default",
      tableName: "your_table_name"
    }

    console.log("API Request Payload:", payload)

    const response = await apiClient.post(API_ENDPOINT, payload)

    if (response.data.status !== "success") {
      throw new Error(`Query execution failed: ${response.data.status}`)
    }

    console.log("API Response:", response.data)

    return response.data.data.data
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    throw error
  }
}

// Function to get summary metrics
export function calculateSummaryMetrics(data) {
  // Calculate totals
  const totalMetric1 = data.reduce((sum, item) => sum + item.metric1, 0)
  const totalMetric2 = data.reduce((sum, item) => sum + item.metric2, 0)
  const totalMetric3 = data.reduce((sum, item) => sum + item.metric3, 0)

  // Calculate averages
  const avgMetric1 = data.length > 0 ? totalMetric1 / data.length : 0
  const avgMetric2 = data.length > 0 ? totalMetric2 / data.length : 0
  const avgMetric3 = data.length > 0 ? totalMetric3 / data.length : 0

  // Find min and max values
  const minMetric1 =
    data.length > 0 ? Math.min(...data.map(item => item.metric1)) : 0
  const maxMetric1 =
    data.length > 0 ? Math.max(...data.map(item => item.metric1)) : 0

  // Calculate month-over-month growth (mock calculation)
  const mockGrowthMetric1 = 5.2 // 5.2% growth
  const mockGrowthMetric2 = -2.1 // 2.1% decline
  const mockGrowthMetric3 = 3.7 // 3.7% growth

  return {
    totalMetric1,
    totalMetric2,
    totalMetric3,
    avgMetric1,
    avgMetric2,
    avgMetric3,
    minMetric1,
    maxMetric1,
    growthMetric1: mockGrowthMetric1,
    growthMetric2: mockGrowthMetric2,
    growthMetric3: mockGrowthMetric3
  }
}

// Function to prepare chart data
export function prepareChartData(data) {
  // Group data by category
  const categoryData = data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        metric1: 0,
        metric2: 0,
        metric3: 0
      }
    }

    acc[item.category].metric1 += item.metric1
    acc[item.category].metric2 += item.metric2
    acc[item.category].metric3 += item.metric3

    return acc
  }, {})

  // Convert to chart format
  const metric1ChartData = Object.entries(categoryData).map(
    ([category, values]) => ({
      label: category,
      value: values.metric1
    })
  )

  const metric2ChartData = Object.entries(categoryData).map(
    ([category, values]) => ({
      label: category,
      value: values.metric2
    })
  )

  const metric3ChartData = Object.entries(categoryData).map(
    ([category, values]) => ({
      label: category,
      value: values.metric3
    })
  )

  return {
    metric1ChartData,
    metric2ChartData,
    metric3ChartData
  }
}
