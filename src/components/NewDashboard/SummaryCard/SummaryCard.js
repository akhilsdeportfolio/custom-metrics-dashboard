
import React from "react"

const SummaryCard = ({ title, value, change, icon, color = "blue" }) => {
  // Define color classes based on the color prop
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200"
  }

  // Determine change indicator
  const renderChangeIndicator = () => {
    if (change === undefined) return null

    const isPositive = change >= 0
    const changeClass = isPositive ? "text-green-600" : "text-red-600"
    const changeIcon = isPositive ? "↑" : "↓"

    return (
      <div className={`text-sm font-medium ${changeClass} flex items-center`}>
        <span className="mr-1">{changeIcon}</span>
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium opacity-80">{title}</h3>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
          {renderChangeIndicator()}
        </div>
        {icon && <div className="text-2xl opacity-80">{icon}</div>}
      </div>
    </div>
  )
}

export default SummaryCard
