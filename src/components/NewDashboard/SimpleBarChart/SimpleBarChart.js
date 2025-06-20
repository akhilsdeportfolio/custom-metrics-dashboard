
import React from "react"

const SimpleBarChart = ({
  data,
  title,
  color = "#3B82F6", // Default to blue
  height = 200
}) => {
  // Find the maximum value for scaling
  const maxValue = Math.max(...data.map(item => item.value))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-medium mb-4">{title}</h3>

      <div style={{ height: `${height}px` }} className="relative">
        <div className="flex h-full items-end space-x-2">
          {data.map((item, index) => {
            // Calculate the height percentage based on the max value
            const heightPercent =
              maxValue > 0 ? (item.value / maxValue) * 100 : 0

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t transition-all duration-500 ease-in-out hover:opacity-80"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: color,
                    minHeight: "1px" // Ensure bars with very small values are still visible
                  }}
                ></div>
                <div
                  className="text-xs mt-1 w-full text-center truncate"
                  title={item.label}
                >
                  {item.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between pointer-events-none">
          <div className="text-xs text-gray-500">{maxValue}</div>
          <div className="text-xs text-gray-500">
            {Math.round(maxValue / 2)}
          </div>
          <div className="text-xs text-gray-500">0</div>
        </div>
      </div>
    </div>
  )
}

export default SimpleBarChart
