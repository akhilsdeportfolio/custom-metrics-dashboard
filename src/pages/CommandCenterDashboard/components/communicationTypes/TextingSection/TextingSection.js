import React from "react"
import MetricsTable from "../../../../../components/CommsInboundDashboard/MetricsTable"
import {
  useMonthlyMetricsData as useInboundMonthlyData,
  useTenantDealerMetricsData as useInboundTenantDealerData
} from "../../../../../hooks/useCommsInboundMetricsData"
import {
  useMonthlyMetricsData as useOutboundMonthlyData,
  useTenantDealerMetricsData as useOutboundTenantDealerData
} from "../../../../../hooks/useCommandCentreMetricsData"
import MetricsSummaryCard from "../../../../../components/CommsDashboard/MetricsSummaryCard"

const TextingSection = ({ view, filters }) => {
  // Use existing hooks for inbound and outbound data
  const {
    data: inboundMonthlyData,
    loading: inboundMonthlyLoading
  } = useInboundMonthlyData()

  const {
    data: inboundTenantDealerData,
    loading: inboundTenantDealerLoading,
    summaryMetrics: inboundTenantDealerSummary
  } = useInboundTenantDealerData()

  const {
    data: outboundMonthlyData,
    loading: outboundMonthlyLoading
  } = useOutboundMonthlyData()

  const {
    data: outboundTenantDealerData,
    loading: outboundTenantDealerLoading,
    summaryMetrics: outboundTenantDealerSummary
  } = useOutboundTenantDealerData()

  // Format number with commas
  const formatNumber = num => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Calculate metrics based on view with provider splits
  const getTextingMetrics = () => {
    // Both Overall and Tenant/Dealer should show the same totals
    // They just group the data differently (by month vs by tenant/dealer)

    if (view === "overall") {
      // For Command Centre: Use tenant/dealer summary to ensure consistency with GTC values
      const inboundTotal =
        inboundTenantDealerSummary?.totalThreadsInitiated || 0
      const outboundTotal =
        outboundTenantDealerSummary?.totalThreadsInitiated || 0
      const outboundFailed =
        outboundTenantDealerSummary?.totalThreadsFailure || 0

      // For Command Centre: Use actual query results (with GTC filter)
      const inboundGTC = inboundTenantDealerSummary?.totalThreadsInitiated || 0
      const inboundTwilio =
        inboundTenantDealerSummary?.totalTwilioInitiated || 0
      const outboundGTC =
        outboundTenantDealerSummary?.totalThreadsInitiated || 0
      const outboundTwilio =
        outboundTenantDealerSummary?.totalTwilioInitiated || 0
      const failedGTC = outboundTenantDealerSummary?.totalThreadsFailure || 0
      const failedTwilio = outboundTenantDealerSummary?.totalTwilioFailure || 0

      return {
        inbound: inboundTotal,
        outbound: outboundTotal,
        failedOutbound: outboundFailed,
        inboundGTC,
        inboundTwilio,
        outboundGTC,
        outboundTwilio,
        failedGTC,
        failedTwilio,
        loading: inboundMonthlyLoading || outboundMonthlyLoading
      }
    } else {
      // For Command Centre: Use only GTC data (threadsInitiated) since we have GTC filter
      const inboundTotal =
        inboundTenantDealerSummary?.totalThreadsInitiated || 0
      const outboundTotal =
        outboundTenantDealerSummary?.totalThreadsInitiated || 0
      const outboundFailed =
        outboundTenantDealerSummary?.totalThreadsFailure || 0
      const inboundGTC = inboundTenantDealerSummary?.totalThreadsInitiated || 0
      const inboundTwilio =
        inboundTenantDealerSummary?.totalTwilioInitiated || 0
      const outboundGTC =
        outboundTenantDealerSummary?.totalThreadsInitiated || 0
      const outboundTwilio =
        outboundTenantDealerSummary?.totalTwilioInitiated || 0
      const failedGTC = outboundTenantDealerSummary?.totalThreadsFailure || 0
      const failedTwilio = outboundTenantDealerSummary?.totalTwilioFailure || 0

      return {
        inbound: inboundTotal,
        outbound: outboundTotal,
        failedOutbound: outboundFailed,
        inboundGTC,
        inboundTwilio,
        outboundGTC,
        outboundTwilio,
        failedGTC,
        failedTwilio,
        loading: inboundTenantDealerLoading || outboundTenantDealerLoading
      }
    }
  }

  const textingMetrics = getTextingMetrics()

  // Combine inbound and outbound data for tenant/dealer view
  const getCombinedTenantDealerData = (filterForSpecific = false) => {
    const combinedData = []

    // Create a map to combine data by tenant/dealer combination
    const dataMap = new Map()

    // Filter data for specific view if needed
    const filteredInboundData = filterForSpecific
      ? inboundTenantDealerData.filter(item => {
          const matchesTenant =
            !filters?.tenantId ||
            item.tenantId.toLowerCase().includes(filters.tenantId.toLowerCase())
          const matchesDealer =
            !filters?.dealerId ||
            item.dealerId.toLowerCase().includes(filters.dealerId.toLowerCase())
          return matchesTenant && matchesDealer
        })
      : inboundTenantDealerData

    const filteredOutboundData = filterForSpecific
      ? outboundTenantDealerData.filter(item => {
          const matchesTenant =
            !filters?.tenantId ||
            item.tenantId.toLowerCase().includes(filters.tenantId.toLowerCase())
          const matchesDealer =
            !filters?.dealerId ||
            item.dealerId.toLowerCase().includes(filters.dealerId.toLowerCase())
          return matchesTenant && matchesDealer
        })
      : outboundTenantDealerData

    // Add inbound data (use actual query results)
    filteredInboundData.forEach(item => {
      const key = `${item.tenantId}-${item.dealerId}`
      dataMap.set(key, {
        tenantId: item.tenantId,
        dealerId: item.dealerId,
        inboundGTC: item.threadsInitiated || 0,
        inboundTwilio: item.twilioInitiated || 0,
        outboundGTC: 0,
        outboundTwilio: 0,
        failedGTC: 0,
        failedTwilio: 0
      })
    })

    // Add outbound data (use actual query results)
    filteredOutboundData.forEach(item => {
      const key = `${item.tenantId}-${item.dealerId}`
      const existing = dataMap.get(key)
      if (existing) {
        existing.outboundGTC = item.threadsInitiated || 0
        existing.outboundTwilio = item.twilioInitiated || 0
        existing.failedGTC = item.threadsFailure || 0
        existing.failedTwilio = item.twilioFailure || 0
      } else {
        dataMap.set(key, {
          tenantId: item.tenantId,
          dealerId: item.dealerId,
          inboundGTC: 0,
          inboundTwilio: 0,
          outboundGTC: item.threadsInitiated || 0,
          outboundTwilio: item.twilioInitiated || 0,
          failedGTC: item.threadsFailure || 0,
          failedTwilio: item.twilioFailure || 0
        })
      }
    })

    // Convert map to array and calculate totals and failure rates
    dataMap.forEach(item => {
      const inboundTotal = item.inboundGTC + item.inboundTwilio
      const outboundTotal = item.outboundGTC + item.outboundTwilio
      const failedTotal = item.failedGTC + item.failedTwilio

      // Calculate failure rates for each provider
      const failureRateGTC =
        item.outboundGTC > 0
          ? ((item.failedGTC / item.outboundGTC) * 100).toFixed(1) + "%"
          : "0%"

      const failureRateTwilio =
        item.outboundTwilio > 0
          ? ((item.failedTwilio / item.outboundTwilio) * 100).toFixed(1) + "%"
          : "0%"

      const failureRateOverall =
        outboundTotal > 0
          ? ((failedTotal / outboundTotal) * 100).toFixed(1) + "%"
          : "0%"

      combinedData.push({
        tenantId: item.tenantId,
        dealerId: item.dealerId,
        inboundGTC: item.inboundGTC,
        inboundTwilio: item.inboundTwilio,
        inboundTotal: inboundTotal,
        outboundGTC: item.outboundGTC,
        outboundTwilio: item.outboundTwilio,
        outboundTotal: outboundTotal,
        failureRateGTC: failureRateGTC,
        failureRateTwilio: failureRateTwilio,
        failureRateOverall: failureRateOverall,
        totalMessages: inboundTotal + outboundTotal
      })
    })

    // Sort by total messages descending
    return combinedData.sort((a, b) => b.totalMessages - a.totalMessages)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        📱 Texting Communications
      </h3>

      {/* Summary Cards - Overall Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricsSummaryCard
          title="📥 Inbound Messages"
          metrics={[
            {
              label: "Total Received",
              value: formatNumber(textingMetrics.inbound)
            }
          ]}
          className="border-l-4 border-green-500"
        />
        <MetricsSummaryCard
          title="📤 Outbound Messages"
          metrics={[
            {
              label: "Total Sent",
              value: formatNumber(textingMetrics.outbound)
            },
            {
              label: "Success Rate",
              value:
                textingMetrics.outbound > 0
                  ? `${(
                      ((textingMetrics.outbound -
                        textingMetrics.failedOutbound) /
                        textingMetrics.outbound) *
                      100
                    ).toFixed(1)}%`
                  : "0%"
            }
          ]}
          className="border-l-4 border-blue-500"
        />
        <MetricsSummaryCard
          title="❌ Failed Outbound"
          metrics={[
            {
              label: "Total Failed",
              value: formatNumber(textingMetrics.failedOutbound)
            },
            {
              label: "Failure Rate",
              value:
                textingMetrics.outbound > 0
                  ? `${(
                      (textingMetrics.failedOutbound /
                        textingMetrics.outbound) *
                      100
                    ).toFixed(1)}%`
                  : "0%",
              color: "text-red-600"
            }
          ]}
          className="border-l-4 border-red-500"
        />
      </div>

      {/* Provider-Specific Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* GTC Provider Cards */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            🟢 GTC Provider Metrics
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <MetricsSummaryCard
              title="📥 GTC Inbound"
              metrics={[
                {
                  label: "Messages Received",
                  value: formatNumber(textingMetrics.inboundGTC)
                }
              ]}
              className="border-l-4 border-green-400"
            />
            <MetricsSummaryCard
              title="📤 GTC Outbound"
              metrics={[
                {
                  label: "Messages Sent",
                  value: formatNumber(textingMetrics.outboundGTC)
                },
                {
                  label: "Failure Rate",
                  value:
                    textingMetrics.outboundGTC > 0
                      ? `${(
                          (textingMetrics.failedGTC /
                            textingMetrics.outboundGTC) *
                          100
                        ).toFixed(1)}%`
                      : "0%",
                  color: "text-red-600"
                }
              ]}
              className="border-l-4 border-blue-400"
            />
          </div>
        </div>

        {/* Twilio Provider Cards */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            🟣 Twilio Provider Metrics
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <MetricsSummaryCard
              title="📥 Twilio Inbound"
              metrics={[
                {
                  label: "Messages Received",
                  value: formatNumber(textingMetrics.inboundTwilio)
                }
              ]}
              className="border-l-4 border-purple-400"
            />
            <MetricsSummaryCard
              title="📤 Twilio Outbound"
              metrics={[
                {
                  label: "Messages Sent",
                  value: formatNumber(textingMetrics.outboundTwilio)
                },
                {
                  label: "Failure Rate",
                  value:
                    textingMetrics.outboundTwilio > 0
                      ? `${(
                          (textingMetrics.failedTwilio /
                            textingMetrics.outboundTwilio) *
                          100
                        ).toFixed(1)}%`
                      : "0%",
                  color: "text-red-600"
                }
              ]}
              className="border-l-4 border-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Data Tables based on view */}
      {view === "overall" && (
        <div className="space-y-6">
          <MetricsTable
            data={inboundMonthlyData}
            columns={[
              { key: "formattedMonth", header: "Month", align: "left" },
              {
                key: "totalInitiated",
                header: "Inbound Messages",
                render: value => formatNumber(value),
                align: "right"
              }
            ]}
            title="Monthly Inbound Texting"
            loading={inboundMonthlyLoading}
            emptyMessage="No inbound texting data available"
            exportFilename="monthly-inbound-texting.csv"
          />
          <MetricsTable
            data={outboundMonthlyData}
            columns={[
              { key: "formattedMonth", header: "Month", align: "left" },
              {
                key: "totalInitiated",
                header: "Outbound Messages",
                render: value => formatNumber(value),
                align: "right"
              },
              {
                key: "totalFailure",
                header: "Failed Messages",
                render: value => formatNumber(value),
                align: "right"
              }
            ]}
            title="Monthly Outbound Texting"
            loading={outboundMonthlyLoading}
            emptyMessage="No outbound texting data available"
            exportFilename="monthly-outbound-texting.csv"
          />
        </div>
      )}

      {view === "tenant-dealer" && (
        <div className="space-y-6">
          <MetricsTable
            data={getCombinedTenantDealerData()}
            columns={[
              { key: "tenantId", header: "Tenant ID", align: "left" },
              { key: "dealerId", header: "Dealer ID", align: "left" },
              {
                key: "inboundGTC",
                header: "Inbound GTC",
                render: value => formatNumber(value),
                align: "right"
              },
              {
                key: "inboundTwilio",
                header: "Inbound Twilio",
                render: value => formatNumber(value),
                align: "right"
              },
              {
                key: "inboundTotal",
                header: "Inbound Total",
                render: value => formatNumber(value),
                align: "right"
              },
              {
                key: "outboundGTC",
                header: "Outbound GTC",
                render: value => formatNumber(value),
                align: "right"
              },
              {
                key: "outboundTwilio",
                header: "Outbound Twilio",
                render: value => formatNumber(value),
                align: "right"
              },
              {
                key: "outboundTotal",
                header: "Outbound Total",
                render: value => formatNumber(value),
                align: "right"
              },
              {
                key: "failureRateGTC",
                header: "GTC Failure %",
                align: "right"
              },
              {
                key: "failureRateTwilio",
                header: "Twilio Failure %",
                align: "right"
              },
              {
                key: "failureRateOverall",
                header: "Overall Failure %",
                align: "right"
              },
              {
                key: "totalMessages",
                header: "Total Messages",
                render: value => formatNumber(value),
                align: "right"
              }
            ]}
            title="Tenant & Dealer Texting Metrics"
            loading={inboundTenantDealerLoading || outboundTenantDealerLoading}
            emptyMessage="No texting data available"
            exportFilename="tenant-dealer-texting-metrics.csv"
          />
        </div>
      )}

      {view === "specific" &&
        filters &&
        (filters.tenantId || filters.dealerId) && (
          <div className="space-y-6">
            <MetricsTable
              data={getCombinedTenantDealerData(true)}
              columns={[
                { key: "tenantId", header: "Tenant ID", align: "left" },
                { key: "dealerId", header: "Dealer ID", align: "left" },
                {
                  key: "inboundGTC",
                  header: "Inbound GTC",
                  render: value => formatNumber(value),
                  align: "right"
                },
                {
                  key: "inboundTwilio",
                  header: "Inbound Twilio",
                  render: value => formatNumber(value),
                  align: "right"
                },
                {
                  key: "inboundTotal",
                  header: "Inbound Total",
                  render: value => formatNumber(value),
                  align: "right"
                },
                {
                  key: "outboundGTC",
                  header: "Outbound GTC",
                  render: value => formatNumber(value),
                  align: "right"
                },
                {
                  key: "outboundTwilio",
                  header: "Outbound Twilio",
                  render: value => formatNumber(value),
                  align: "right"
                },
                {
                  key: "outboundTotal",
                  header: "Outbound Total",
                  render: value => formatNumber(value),
                  align: "right"
                },
                {
                  key: "failureRateGTC",
                  header: "GTC Failure %",
                  align: "right"
                },
                {
                  key: "failureRateTwilio",
                  header: "Twilio Failure %",
                  align: "right"
                },
                {
                  key: "failureRateOverall",
                  header: "Overall Failure %",
                  align: "right"
                },
                {
                  key: "totalMessages",
                  header: "Total Messages",
                  render: value => formatNumber(value),
                  align: "right"
                }
              ]}
              title={`Specific Texting Metrics - ${
                filters.tenantId ? `Tenant: ${filters.tenantId}` : ""
              }${filters.tenantId && filters.dealerId ? " / " : ""}${
                filters.dealerId ? `Dealer: ${filters.dealerId}` : ""
              }`}
              loading={
                inboundTenantDealerLoading || outboundTenantDealerLoading
              }
              emptyMessage="No texting data found for the specified tenant/dealer"
              exportFilename={`specific-texting-metrics-${filters.tenantId ||
                "all"}-${filters.dealerId || "all"}.csv`}
            />
          </div>
        )}

      {textingMetrics.loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading texting data...</span>
        </div>
      )}
    </div>
  )
}

export default TextingSection
