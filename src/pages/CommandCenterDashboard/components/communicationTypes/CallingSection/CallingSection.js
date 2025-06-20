"use client"
import React from "react"

const CallingSection = ({ view, filters }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        📞 Calling Communications
      </h3>

      {/* Simple Placeholder */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="space-y-4">
          <div className="text-6xl">📞</div>
          <h4 className="text-xl font-semibold text-gray-700">
            Calling Metrics
          </h4>
          <p className="text-gray-600">
            <strong>Current View:</strong> {view}
          </p>
          {filters && (filters.tenantId || filters.dealerId) && (
            <p className="text-gray-600">
              <strong>Filters:</strong> Tenant: {filters.tenantId || "All"} /
              Dealer: {filters.dealerId || "All"}
            </p>
          )}
          <div className="text-sm text-gray-500 mt-4">
            <p>
              <strong>Placeholder for:</strong>
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Inbound call metrics (count, answer rate, duration)</li>
              <li>Outbound call metrics (count, connect rate, duration)</li>
              <li>Call state tracking (CONNECTED, DISCONNECTED, BRIDGED)</li>
              <li>Call quality and failure analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallingSection
