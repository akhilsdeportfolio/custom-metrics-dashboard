import { useState, useCallback } from "react"
import { fetchFailureDetails } from "../services/commsInboundFailureDetailsService"

export function useFailureDetails() {
  const [failureDetails, setFailureDetails] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDetails = useCallback(
    async (tenantId, dealerId, failureType, timeRange) => {
      setLoading(true)
      setError(null)

      try {
        const details = await fetchFailureDetails(
          tenantId,
          dealerId,
          failureType,
          timeRange
        )
        setFailureDetails(details)
        return details
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("An unknown error occurred")
        )
        console.error("Error fetching inbound failure details:", err)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    failureDetails,
    loading,
    error,
    fetchDetails
  }
}
