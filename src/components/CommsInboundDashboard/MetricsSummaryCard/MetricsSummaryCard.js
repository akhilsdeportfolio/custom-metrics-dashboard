
import React from "react"

const MetricsSummaryCard = ({ title, metrics, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
    >
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-sm text-gray-600">{metric.label}</span>
              <span
                className={`text-xl font-semibold ${metric.color || ""}`}
                style={{
                  color: !metric.color?.startsWith("text-")
                    ? metric.color
                    : undefined
                }}
              >
                {typeof metric.value === "number" && metric.isPercentage
                  ? `${metric.value.toFixed(1)}%`
                  : metric.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MetricsSummaryCard
