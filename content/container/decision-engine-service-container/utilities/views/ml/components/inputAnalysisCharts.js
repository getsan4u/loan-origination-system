'use strict';
const CONSTANTS = require('../../../constants');
const capitalize = require('capitalize');
const numeral = require('numeral');
const util = require('util');
const DIGIFI_COLOR = CONSTANTS.DIGIFI_COLOR;
const COLORS = CONSTANTS.CHART_COLORS;

function _generateBinsLabels(bindata, header, num_bins) {
  const header_bin_data = bindata[ header ];
  let bin_labels = [];
  if (header_bin_data.type === 'Number') {
    const bin_size = header_bin_data.bin_size[ num_bins ];
    for (let start = header_bin_data.min; start < header_bin_data.max; start += bin_size) {
      bin_labels.push(`${numeral(start.toFixed(2)).format('0,0[.]00')} to ${numeral((start + bin_size).toFixed(2)).format('0,0[.]00')}`);
    }
  } else {
    bin_labels = header_bin_data.encoders.map(label => label ? label : 'NULL');
  }
  return bin_labels;
}

function _getTotalLoanVolumeChart({ configuration, current_data, providers, modeldata, query, input_analysis }) {
  try {
    if (!input_analysis) return null;
    const input_variable = query.input_variable || 'summary';
    const analysis_results = input_analysis.results;
    const num_bins = query.num_bins || 10;
    const bindata = input_analysis.bindata;
    const chartData = [];
    let yAxisLabel = (configuration.unit === 'count') ? 'Number of Loans' : (configuration.unit === 'dollar') ? 'Total Loan Amount ($)' : '% of Total';
    if (input_variable === 'summary') {

      if (configuration.section === 'total_loan_volume') {
        if (configuration.subsection === 'by_count') {
          chartData.push({
            xaxis: 'Total',
            actual_1: analysis_results.summary.actual_1_count,
            actual_0: analysis_results.summary.actual_0_count,
          });
          yAxisLabel = 'Number of Loans';
        } else if (configuration.subsection === 'by_amt') {
          chartData.push({
            xaxis: 'Total',
            actual_1: analysis_results.summary.actual_1_amt,
            actual_0: analysis_results.summary.actual_0_amt,
          });
          yAxisLabel = 'Total Loan Amount ($)';
        }
      } else if (configuration.section === 'percent_of_total_loan_volume') {
        if (configuration.subsection === 'by_count') {
          chartData.push({
            xaxis: 'Total',
            actual_1: analysis_results.summary.actual_1_count_pct,
            actual_0: analysis_results.summary.actual_0_count_pct,
          });
          yAxisLabel = 'Percent of Loans (by Count)';
        } else if (configuration.subsection === 'by_amt') {
          chartData.push({
            xaxis: 'Total',
            actual_1: analysis_results.summary.actual_1_amt_pct,
            actual_0: analysis_results.summary.actual_0_amt_pct,
          });
          yAxisLabel = 'Percent of Loans (by Amount)';
        }
      }
    } else {
      const bin_labels = _generateBinsLabels(bindata, input_variable, num_bins);
      const input_variable_analysis_by_bins = (bindata[ input_variable ].type === 'Number') ? analysis_results.by_headers[ input_variable ][ num_bins ] : analysis_results.by_headers[ input_variable ][ num_bins ].slice(0, 20);
      if (configuration.section === 'total_loan_volume') {
        if (configuration.subsection === 'by_count') {
          input_variable_analysis_by_bins.forEach((bin_analysis, idx) => {
            chartData.push({
              xaxis: bin_labels[ idx ],
              actual_1: bin_analysis.actual_1_count,
              actual_0: bin_analysis.actual_0_count,
            });
          });
          yAxisLabel = 'Number of Loans';
        } else if (configuration.subsection === 'by_amt') {
          input_variable_analysis_by_bins.forEach((bin_analysis, idx) => {
            chartData.push({
              xaxis: bin_labels[ idx ],
              actual_1: bin_analysis.actual_1_amt,
              actual_0: bin_analysis.actual_0_amt,
            });
          });
          yAxisLabel = 'Total Loan Amount ($)';
        }
      } else if (configuration.section === 'percent_of_total_loan_volume') {
        if (configuration.subsection === 'by_count') {
          input_variable_analysis_by_bins.forEach((bin_analysis, idx) => {
            chartData.push({
              xaxis: bin_labels[ idx ],
              actual_1: bin_analysis.actual_1_count_pct,
              actual_0: bin_analysis.actual_0_count_pct,
            });
          });
          yAxisLabel = 'Percent of Loans (by Count)';
        } else if (configuration.subsection === 'by_amt') {
          input_variable_analysis_by_bins.forEach((bin_analysis, idx) => {
            chartData.push({
              xaxis: bin_labels[ idx ],
              actual_1: bin_analysis.actual_1_amt_pct,
              actual_0: bin_analysis.actual_0_amt_pct,
            });
          });
          yAxisLabel = 'Percent of Loans (by Amount)';
        }
      }
    }
    let chartBars = [ {
      component: 'recharts.Bar',
      props: {
        dataKey: 'actual_1',
        name: 'Charged Off',
        stackId: 'a',
        fill: '#d24d57',
        isAnimationActive: false,
      },
    }, {
      component: 'recharts.Bar',
      props: {
        dataKey: 'actual_0',
        name: 'Fully Paid',
        stackId: 'a',
        fill: DIGIFI_COLOR,
        isAnimationActive: false,
      },
    }, ];

    let chart = {
      component: 'recharts.BarChart',
      props: {
        width: 980,
        height: 500,
        maxBarSize: 100,
        barCategoryGap: '10%',
        data: chartData,
      },
      children: [
        {
          component: 'recharts.Legend',
          props: {
            width: 150,
            iconType: 'square',
            style: {
            },
          },
        },
        {
          component: 'recharts.XAxis',
          hasWindowComponent: true,
          props: {
            dataKey: 'xaxis',
            interval: 0,
            tick: 'func:window.__ra_custom_elements.MLAxisTick',
            windowCompProps: {
              numTicks: chartData.length,
            },
            label: {
              value: '',
              angle: '0',
              position: 'bottom',
              offset: '30',
            },
          },
        }, {
          component: 'recharts.YAxis',
          hasWindowFunc: true,
          props: {
            domain: ((configuration.unit === 'percentage') ? [ 0, 1, ] : [ 0, 'auto', ]),
            tickCount: (configuration.unit === 'percentage') ? 6 : undefined,
            allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
            tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
            label: {
              value: yAxisLabel,
              angle: '-90',
              offset: 0,
              position: 'insideLeft',
            },
          },
        }, {
          component: 'recharts.Tooltip',
          hasWindowFunc: true,
          props: {
            formatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
            itemSorter: 'func:window.tooltipItemSorter',
            itemStyle: {
              margin: 0,
              padding: 0,
            },
          },
        }, ...chartBars, ],
    };
    return chart;
  } catch (e) {
    return e;
  }
}

function _getPopulationAnalysisCharts({ configuration, current_data, providers, modeldata, query, input_analysis }) {
  try {
    if (!input_analysis) return null;
    const input_variable = query.input_variable || 'summary';
    const analysis_results = input_analysis.results;
    const num_bins = query.num_bins || 10;
    const yaxis_scale = query.yaxis_scale || 1;
    const bindata = input_analysis.bindata;
    const chartData = [];
    if (configuration.subsection === 'annual_yield') configuration.subsection_title = 'Annual Yield';
    if (input_variable === 'summary') {
      chartData.push({
        xaxis: 'Total',
        population_metric: analysis_results.summary[ configuration.subsection ],
      });
    } else {
      const bin_labels = _generateBinsLabels(bindata, input_variable, num_bins);
      const input_variable_analysis_by_bins = (bindata[ input_variable ].type === 'Number') ? analysis_results.by_headers[ input_variable ][ num_bins ] : analysis_results.by_headers[ input_variable ][ num_bins ].slice(0, 20);
      input_variable_analysis_by_bins.forEach((bin_analysis, idx) => {
        chartData.push({
          xaxis: bin_labels[ idx ],
          population_metric: bin_analysis[ configuration.subsection ],
        });
      });
    }

    let chartBars = [ {
      component: 'recharts.Bar',
      props: {
        dataKey: 'population_metric',
        name: configuration.subsection_title,
        fill: DIGIFI_COLOR,
        isAnimationActive: false,
      },
    }, ];

    let chart = {
      component: 'recharts.BarChart',
      props: {
        width: 980,
        height: 500,
        maxBarSize: 100,
        barCategoryGap: '10%',
        data: chartData,
      },
      children: [
        {
          component: 'recharts.Legend',
          props: {
            width: 150,
            iconType: 'square',
            style: {
            },
          },
        },
        {
          component: 'recharts.XAxis',
          hasWindowComponent: true,
          props: {
            dataKey: 'xaxis',
            interval: 0,
            tick: 'func:window.__ra_custom_elements.MLAxisTick',
            windowCompProps: {
              numTicks: chartData.length,
            },
            label: {
              value: '',
              angle: '0',
              position: 'bottom',
              offset: '30',
            },
          },
        }, {
          component: 'recharts.YAxis',
          hasWindowFunc: true,
          props: {
            domain: ((configuration.unit === 'percentage') ? [ 0, Number(yaxis_scale), ] : [ 0, 'auto', ]),
            tickCount: (configuration.unit === 'percentage') ? 6 : undefined,
            allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
            tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
            label: {
              value: configuration.subsection_title,
              angle: '-90',
              offset: 0,
              position: 'insideLeft',
            },
          },
        }, {
          component: 'recharts.Tooltip',
          hasWindowFunc: true,
          props: {
            formatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
            itemSorter: 'func:window.tooltipItemSorter',
            itemStyle: {
              margin: 0,
              padding: 0,
            },
          },
        }, ...chartBars, ],
    };
    return chart;
  } catch (e) {
    console.log({ e });
    return e;
  }
}

function _getCumulativeDefaultTimeSeriesCharts({ configuration, current_data, providers, modeldata, query, input_analysis }) {
  try {
    if (!input_analysis) return null;
    const input_variable = query.input_variable || 'summary';
    const analysis_results = input_analysis.results;
    const num_bins = query.num_bins || 10;
    const yaxis_scale = query.yaxis_scale || 1;
    const bindata = input_analysis.bindata;
    const chartData = [];
    const chartLines = [];
    const numMonths = analysis_results.summary.time_series_cdr_count.length;
    const subsection = configuration.subsection;
    let maxCDR = 0;
    if (input_variable === 'summary') {
      analysis_results.summary[ subsection ].forEach((monthCount, idx) => {
        chartData.push({
          xaxis: idx + 1,
          summary: monthCount,
        });
      });
      maxCDR = analysis_results.summary[ subsection ][ analysis_results.summary[ subsection ].length - 1 ];
      chartLines.push({
        component: 'recharts.Line',
        props: {
          strokeWidth: 3,
          dataKey: 'summary',
          type: 'monotone',
          dot: false,
          name: 'summary',
          stroke: DIGIFI_COLOR,
          isAnimationActive: false,
        },
      });
    } else {
      const bin_labels = (bindata[ input_variable ].type === 'Number') ? _generateBinsLabels(bindata, input_variable, num_bins) : _generateBinsLabels(bindata, input_variable, num_bins).slice(0, 20);
      const input_variable_analysis_by_bins = (bindata[ input_variable ].type === 'Number') ? analysis_results.by_headers[ input_variable ][ num_bins ] : analysis_results.by_headers[ input_variable ][ num_bins ].slice(0, 20);
      for (let month = 0; month < numMonths; month++) {
        const monthData = {
          xaxis: month + 1,
        };
        input_variable_analysis_by_bins.forEach((month_cdr, idx) => {
          monthData[ bin_labels[ idx ] ] = month_cdr[ subsection ][ month ];
          if (month === numMonths - 1) maxCDR = Math.max(maxCDR, month_cdr[ subsection ][ month ]);
        });
        chartData.push(monthData);
      }
      bin_labels.forEach((label, idx) => {
        chartLines.push({
          component: 'recharts.Line',
          props: {
            strokeWidth: 3,
            dataKey: label,
            type: 'monotone',
            dot: false,
            name: label,
            stroke: COLORS[ idx ],
            isAnimationActive: false,
          },
        });
      });
    }

    const xAxisTicks = [];
    const yAxisTicks = [];
    // const yAxisInterval = Math.round(maxCDR / 4 * 100) / 100;
    const yAxisInterval = Math.round(Number(yaxis_scale) / 5 * 100) / 100;
    for (let i = 2; i < numMonths; i += 2) xAxisTicks.push(i);
    // for (let i = 0; i <= maxCDR + yAxisInterval; i += yAxisInterval) yAxisTicks.push(i);
    for (let i = 0; i <= Number(yaxis_scale); i += yAxisInterval) yAxisTicks.push(i);
    maxCDR = maxCDR || undefined;

    return {
      component: 'recharts.LineChart',
      props: {
        width: 980,
        height: 500,
        maxBarSize: 100,
        barCategoryGap: '10%',
        data: chartData,
      },
      children: [
        {
          component: 'recharts.Legend',
          props: {
            width: 150,
            iconType: 'square',
            style: {
            },
          },
        },
        {
          component: 'recharts.XAxis',
          hasWindowFunc: true,
          props: {
            dataKey: 'xaxis',
            domain: [ 0, numMonths ],
            tickFormatter: 'func:window.chartCountFormatter',
            ticks: xAxisTicks,
            label: {
              value: '# of Months',
              angle: '0',
              position: 'bottom',
            },
          },
        }, {
          component: 'recharts.YAxis',
          hasWindowFunc: true,
          props: {
            domain: [ 0, Number(yaxis_scale)/*maxCDR + yAxisInterval,*/ ],
            interval: 'preserveStartEnd',
            allowDataOverflow: true,
            tickFormatter: 'func:window.chartPercentageFormatter',
            ticks: yAxisTicks,
            label: {
              value: 'Cumulative Default Rate %',
              angle: '-90',
              position: 'insideLeft',
            },
          },
        }, {
          component: 'recharts.Tooltip',
          hasWindowFunc: true,
          props: {
            formatter: 'func:window.chartPercentageFormatter',
            itemSorter: 'func:window.tooltipItemSorter',
            itemStyle: {
              margin: 0,
              padding: 0,
            },
          },
        }, ...chartLines, ],
    };
  } catch (e) {
    console.log({ e })
  }
}

module.exports = {
  _getTotalLoanVolumeChart,
  _getPopulationAnalysisCharts,
  _getCumulativeDefaultTimeSeriesCharts,
};