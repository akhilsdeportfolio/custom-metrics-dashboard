
import { useState, useEffect } from "react"
import {
  fetchAllPagesOfMonthlySummaryData,
  processMonthlySummaryData
} from "../services/monthlySummaryService"

export function useMonthlySummaryData(props) {
  const [rawData, setRawData] = useState([])
  const [processedData, setProcessedData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use the specific query or the one provided in props
      const query = props?.customQuery

      // Fetch all pages of data
      const data = await fetchAllPagesOfMonthlySummaryData(query)
      setRawData(data)

      // Process the data
      const processed = processMonthlySummaryData(data)
      setProcessedData(processed)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    rawData,
    processedData,
    loading,
    error,
    refetch: fetchData
  }
}
