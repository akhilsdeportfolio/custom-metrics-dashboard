import { useState, useCallback } from "react"
import { fetchFailureDetails } from "../pages/commsFailureDetailsService"

export function useFailureDetails() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Function to fetch failure details
  const fetchDetails = useCallback(async (failureType, filters) => {
    console.log("Fetching failure details:", { failureType, filters })
    setLoading(true)
    setError(null)

    try {
      const result = await fetchFailureDetails(failureType, filters)
      console.log("Failure details fetched:", result)
      setData(result)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      )
      console.error("Error fetching failure details:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Function to clear failure details
  const clearDetails = useCallback(() => {
    setData([])
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    fetchDetails,
    clearDetails
  }
}
