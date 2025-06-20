/**
 * GTC Outbound Error Categorization Rules
 *
 * This file contains the rules for categorizing GTC outbound errors into:
 * - CONTROLLABLE: Errors that can be fixed by updating settings, configuration, or code
 * - NON_CONTROLLABLE: Errors caused by external factors beyond our control
 *
 * Rules are defined as regular expressions that match against error messages.
 * The categorization function checks controllable patterns first, then defaults to non-controllable.
 */

// ============================================================================
// CONTROLLABLE ERROR PATTERNS
// These are errors that can be fixed by updating settings, configuration, or code
// ============================================================================

export const CONTROLLABLE_ERROR_PATTERNS = [
  // Only the specific controllable error patterns requested
  /USER_NOT_MAPPED\s*/i,
  /Phone\s+number\s+\+\d+\s+is\s+not\s+linked\s+to\s+a\s+registered\s+campaign\s+and\s+is\s+sending\s+a\s+message\s+to\s+a\s+phone\s+number\s+in\s+the\s+US\s+region\s*/i,
];

// ============================================================================
// CATEGORIZATION FUNCTION
// ============================================================================

/**
 * Categorizes an error message as either CONTROLLABLE or NON_CONTROLLABLE
 *
 * @param errorMessage - The error message to categorize
 * @returns 'CONTROLLABLE' if the error can be fixed by us, 'NON_CONTROLLABLE' if it's external
 */
export function categorizeErrorMessage(errorMessage) {
  if (!errorMessage || typeof errorMessage !== "string") {
    return "NON_CONTROLLABLE"; // Default for invalid input
  }

  const message = errorMessage.trim();

  // Check controllable patterns first
  for (const pattern of CONTROLLABLE_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return "CONTROLLABLE";
    }
  }

  // If no controllable pattern matches, it's non-controllable
  // Simple logic: only check for specific controllable patterns, everything else is non-controllable
  return "NON_CONTROLLABLE";
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all controllable error patterns for testing or documentation
 */
export function getControllablePatterns() {
  return [...CONTROLLABLE_ERROR_PATTERNS];
}

/**
 * Get all non-controllable error patterns for testing or documentation
 * Since we only check controllable patterns, non-controllable is everything else
 */
export function getNonControllablePatterns() {
  return []; // No specific patterns - everything not controllable is non-controllable
}

/**
 * Test if an error message matches any controllable pattern
 */
export function isControllableError(errorMessage) {
  return categorizeErrorMessage(errorMessage) === "CONTROLLABLE";
}

/**
 * Test if an error message matches any non-controllable pattern
 */
export function isNonControllableError(errorMessage) {
  return categorizeErrorMessage(errorMessage) === "NON_CONTROLLABLE";
}

/**
 * Get a summary of all patterns for debugging
 */
export function getPatternSummary() {
  return {
    controllablePatterns: CONTROLLABLE_ERROR_PATTERNS.length,
    nonControllablePatterns: 0, // No specific patterns - everything else is non-controllable
    totalPatterns: CONTROLLABLE_ERROR_PATTERNS.length,
  };
}
