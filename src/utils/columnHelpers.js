import React from "react"

// Format number utility
export const formatNumber = value => {
  if (value === 0) return "0"
  if (value < 1000) return value.toString()
  if (value < 1000000) return (value / 1000).toFixed(1) + "K"
  return (value / 1000000).toFixed(1) + "M"
}

// Drill-down button component
export const DrillDownButton = ({ onClick }) => (
  <button
    className="ml-2 text-blue-500 hover:text-blue-700"
    onClick={e => {
      e.stopPropagation()
      onClick()
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 inline"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  </button>
)

// Clickable error button component
export const ClickableErrorButton = ({
  value,
  className,
  backgroundColor,
  onClick
}) => {
  // If there's an onClick handler, render as button, otherwise as span
  if (onClick) {
    return (
      <button
        className={`font-bold hover:underline bg-transparent border-none p-0 ${className} ${backgroundColor ||
          ""}`}
        onClick={onClick}
      >
        {formatNumber(value)}
      </button>
    )
  }

  // For display-only (like monthly table), render as span with inherited background
  return (
    <span className={`font-bold bg-inherit ${className}`}>
      {formatNumber(value)}
    </span>
  )
}

// Failure cell with drill-down component
export const FailureCellWithDrillDown = ({ value, onDrillDown }) => (
  <div className="flex items-center justify-end">
    <span>{formatNumber(value)}</span>
    {value > 0 && <DrillDownButton onClick={onDrillDown} />}
  </div>
)
