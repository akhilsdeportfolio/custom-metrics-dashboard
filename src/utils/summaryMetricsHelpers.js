// Format number utility
const formatNumber = (value) => {
  if (value === 0) return "0";
  if (value < 1000) return value.toString();
  if (value < 1000000) return (value / 1000).toFixed(1) + "K";
  return (value / 1000000).toFixed(1) + "M";
};

// Calculate percentage for controllable/non-controllable errors
const calculateErrorPercentage = (controllable, nonControllable) => {
  const total = controllable + nonControllable;
  if (total === 0) return "0.0%";
  return ((controllable / total) * 100).toFixed(1) + "%";
};

// Create Threads summary metrics
export const createThreadsSummaryMetrics = (summaryMetrics) => [
  {
    label: "Initiated",
    value: formatNumber(summaryMetrics.totalThreadsInitiated),
  },
  { label: "Success", value: formatNumber(summaryMetrics.totalThreadsSuccess) },
  {
    label: "API Failure",
    value: formatNumber(summaryMetrics.totalThreadsApiFailure || 0),
    color: "text-orange-600",
  },
  {
    label: "Delivery Failure",
    value: formatNumber(summaryMetrics.totalThreadsDeliveryFailure || 0),
    color: "text-orange-600",
  },
  {
    label: "Controllable Failure",
    value: `${formatNumber(
      summaryMetrics.totalThreadsControllableError || 0
    )} (${calculateErrorPercentage(
      summaryMetrics.totalThreadsControllableError || 0,
      summaryMetrics.totalThreadsNonControllableError || 0
    )})`,
    color: "text-orange-600",
  },
  {
    label: "Non-Controllable Failure",
    value: `${formatNumber(
      summaryMetrics.totalThreadsNonControllableError || 0
    )} (${calculateErrorPercentage(
      summaryMetrics.totalThreadsNonControllableError || 0,
      summaryMetrics.totalThreadsControllableError || 0
    )})`,
  },
  {
    label: "Total Failure",
    value: formatNumber(summaryMetrics.totalThreadsFailure),
  },
  {
    label: "Failure Rate",
    value: summaryMetrics.threadsFailureRate,
    color: "text-red-600",
  },
];

// Create Non-Threads summary metrics
export const createNonThreadsSummaryMetrics = (summaryMetrics) => [
  {
    label: "Initiated",
    value: formatNumber(summaryMetrics.totalNonThreadsInitiated),
  },
  {
    label: "Success",
    value: formatNumber(summaryMetrics.totalNonThreadsSuccess),
  },
  {
    label: "API Failure",
    value: formatNumber(summaryMetrics.totalNonThreadsApiFailure || 0),
    color: "text-orange-600",
  },
  {
    label: "Delivery Failure",
    value: formatNumber(summaryMetrics.totalNonThreadsDeliveryFailure || 0),
    color: "text-orange-600",
  },
  {
    label: "Total Failure",
    value: formatNumber(summaryMetrics.totalNonThreadsFailure),
  },
  {
    label: "Failure Rate",
    value: summaryMetrics.nonThreadsFailureRate,
    color: "text-red-600",
  },
];

// Create Twilio summary metrics
export const createTwilioSummaryMetrics = (summaryMetrics) => [
  {
    label: "Initiated",
    value: formatNumber(summaryMetrics.totalTwilioInitiated),
  },
  { label: "Success", value: formatNumber(summaryMetrics.totalTwilioSuccess) },
  {
    label: "API Failure",
    value: formatNumber(summaryMetrics.totalTwilioApiFailure || 0),
    color: "text-orange-600",
  },
  {
    label: "Delivery Failure",
    value: formatNumber(summaryMetrics.totalTwilioDeliveryFailure || 0),
    color: "text-orange-600",
  },
  {
    label: "Total Failure",
    value: formatNumber(summaryMetrics.totalTwilioFailure),
  },
  {
    label: "Failure Rate",
    value: summaryMetrics.twilioFailureRate,
    color: "text-red-600",
  },
];

// Tab configuration
export const TAB_CONFIG = [
  { id: "monthly", label: "Monthly Metrics" },
  { id: "tenant-dealer", label: "Tenant & Dealer Metrics" },
  { id: "specific", label: "Specific Tenant/Dealer" },
  { id: "twilio", label: "Twilio Metrics" },
];
