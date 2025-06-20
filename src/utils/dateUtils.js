/**
 * Get the start and end dates for the current month
 * @returns {Object} Object with startDate and endDate properties
 */
export function getCurrentMonthRange() {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  }
}

/**
 * Get the start and end dates for the year to date
 * @returns {Object} Object with startDate and endDate properties
 */
export function getYearToDateRange() {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), 0, 1)
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(now)
  }
}

/**
 * Get default time range (00:00 to 23:59)
 * @returns {Object} Object with startTime and endTime properties
 */
export function getDefaultTimeRange() {
  return {
    startTime: '00:00',
    endTime: '23:59'
  }
}

/**
 * Format a date as YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convert date and time to epoch timestamp
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {number} Epoch timestamp in seconds
 */
export function dateTimeToEpoch(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  
  const date = new Date(year, month - 1, day, hours, minutes)
  return Math.floor(date.getTime() / 1000)
}

