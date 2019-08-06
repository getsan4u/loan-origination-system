'use strict';
const CONSTANTS = require('../../../constants');
const capitalize = require('capitalize');
const util = require('util');
const DIGIFI_COLOR = CONSTANTS.DIGIFI_COLOR;
const SAMPLE_COLORS = CONSTANTS.CHART_COLORS;

function _getLoanVolumeChart({ configuration, providers, modeldata, query, scoredata, }) {
  const type = configuration.subsection;
  const minimum_score = query.minimum_score || 300;
  const max_score = 850;
  const numBins = Math.floor((max_score - minimum_score) / 10) + 1;
  const provider = query.provider || modeldata.selected_provider;
  if (!modeldata[ provider ] || !scoredata || !scoredata.results || !scoredata.results[ `loan_volume_by_${type}_rows_10` ]) return null;
  const bins = scoredata.results[ 'bins_10' ].slice(0, numBins);
  let chartData = bins.reduce((reduced, bin, idx) => {
    reduced.push({
      xaxis: bin,
      charged_off: scoredata.results[ `loan_volume_by_${type}_rows_10` ][ idx ].charged_off,
      fully_paid: scoredata.results[ `loan_volume_by_${type}_rows_10` ][ idx ].fully_paid,
    });
    return reduced;
  }, []);
  // const maxY = Math.max(...scoredata.results[ 'adr_10' ]);
  // const yAxisInterval = maxY / 5;
  // const yAxisTicks = [];
  // for (let i = 0; i < maxY + yAxisInterval; i += yAxisInterval) yAxisTicks.push(i);
  let numTicks = (chartData.length <= 20) ? 0 : 4;
  let chartBars = [ {
    component: 'recharts.Bar',
    props: {
      dataKey: 'fully_paid',
      name: 'Fully Paid',
      stackId: 'a',
      fill: DIGIFI_COLOR,
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Bar',
    props: {
      dataKey: 'charged_off',
      name: 'Charged Off',
      stackId: 'a',
      fill: '#d24d57',
      isAnimationActive: false,
    },
  }, ];

  return {
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
          interval: numTicks,
          // tick: 'func:window.__ra_custom_elements.MLAxisTick',
          windowCompProps: {
            numTicks: chartData.length,
            // disableRotation: true,
            // disableTextFormat: true,
          },
          label: {
            value: 'DigiFi Score',
            angle: '0',
            position: 'bottom',
            offset: '30',
          },
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          domain: [ 0, 'auto', ],
          // tickCount: (configuration.unit === 'percentage') ? 6 : undefined,
          // ticks: yAxisTicks,
          allowDataOverflow: false,
          tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
          label: {
            value: type === 'count' ? 'Number of Loans' : 'Total Loan Amount ($)',
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
}

function _getAnnualDefaultRateChart({ configuration, providers, modeldata, query, scoredata, }) {
  const yaxis_scale = query.yaxis_scale || 1;
  let granularity = query.granularity || 50;
  const provider = query.provider || modeldata.selected_provider;
  const minimum_score = query.minimum_score || 300;
  const max_score = 850;
  const numBins = granularity === 50 ? Math.floor((max_score - minimum_score) / granularity) : Math.floor((max_score - minimum_score) / granularity) + 1;
  if (!modeldata[ provider ] || !scoredata) return null;
  const bins = scoredata.results[ `bins_${granularity}` ].slice(0, numBins);
  // let chartData = [ {
  //   xaxis: '850 - 800',
  //   annual_default_rate: null
  // }]
  let chartData = bins.reduce((reduced, bin, idx) => {
    reduced.push({
      xaxis: bin,
      annual_default_rate: scoredata.results[ `adr_${granularity}` ][ idx ],
    });
    return reduced;
  }, []);
  const maxY = Math.max(...scoredata.results[ `adr_${granularity}` ]);
  const yAxisInterval = maxY / 5;
  const yAxisTicks = [];
  for (let i = 0; i < maxY + yAxisInterval; i += yAxisInterval) yAxisTicks.push(i);
  let numTicks = (chartData.length <= 20) ? 0 : 4;
  let chartBars = [ {
    component: 'recharts.Bar',
    props: {
      dataKey: 'annual_default_rate',
      name: 'Annual Default Rate %',
      stackId: 'a',
      fill: DIGIFI_COLOR,
      isAnimationActive: false,
    },
  }, ];

  return {
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
        component: 'recharts.XAxis',
        hasWindowComponent: true,
        props: {
          dataKey: 'xaxis',
          interval: numTicks,
          tick: 'func:window.__ra_custom_elements.MLAxisTick',
          windowCompProps: {
            numTicks: chartData.length,
            // disableRotation: true,
            // disableTextFormat: true,
          },
          label: {
            value: 'DigiFi Score',
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
            value: 'Annual Default Rate %',
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
}

function _getCumulativeDefaultRateChart({ configuration, providers, modeldata, query, scoredata, }) {
  const yaxis_scale = query.yaxis_scale || 1;
  const type = configuration.subsection;
  const granularity = query.granularity || 50;
  const provider = query.provider || modeldata.selected_provider;
  const minimum_score = query.minimum_score || 300;
  const max_score = 850;
  const numBins = granularity === 50 ? Math.floor((max_score - minimum_score) / granularity) : Math.floor((max_score - minimum_score) / granularity) + 1;
  if (!modeldata[ provider ] || !scoredata) return null;
  const bins = scoredata.results[ `bins_${granularity}` ].slice(0, numBins);
  let chartData = bins.reduce((reduced, bin, idx) => {
    reduced.push({
      xaxis: bin,
      cumulative_default_rate: scoredata.results[ `cdr_by_${type}_rows_${granularity}` ][ idx ],
    });
    return reduced;
  }, []);
  const maxY = Math.max(...scoredata.results[ `cdr_by_${type}_rows_${granularity}` ]);
  let numTicks = (chartData.length <= 20) ? 0 : 4;
  const yAxisInterval = maxY / 5;
  const yAxisTicks = [];
  for (let i = 0; i < maxY + yAxisInterval; i += yAxisInterval) yAxisTicks.push(i);
  let chartBars = [ {
    component: 'recharts.Bar',
    props: {
      dataKey: 'cumulative_default_rate',
      name: `Cumulative Default Rate % By ${capitalize(type)}`,
      stackId: 'a',
      fill: DIGIFI_COLOR,
      isAnimationActive: false,
    },
  }, ];

  return {
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
        component: 'recharts.XAxis',
        hasWindowComponent: true,
        props: {
          dataKey: 'xaxis',
          interval: numTicks,
          tick: 'func:window.__ra_custom_elements.MLAxisTick',
          windowCompProps: {
            numTicks: chartData.length,
            // disableRotation: true,
            // disableTextFormat: true,
          },
          label: {
            value: 'DigiFi Score',
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
            value: 'Cumulative Default Rate %',
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
}

function _getTimeSeriesChart({ configuration, providers, modeldata, query, scoredata, }) {
  try {
    const yaxis_scale = query.yaxis_scale || 1;
    const type = configuration.subsection;
    let granularity = query.granularity || 50;
    const provider = query.provider || modeldata.selected_provider;
    const minimum_score = query.minimum_score || 300;
    const max_score = 850;
    const numBins = granularity === 50 ? Math.floor((max_score - minimum_score) / granularity) : Math.floor((max_score - minimum_score) / granularity) + 1;
    if (!modeldata[ provider ] || !scoredata) return null;
    const bins = scoredata.results[ `bins_${granularity}` ].slice(0, numBins);
    const time_series_data = scoredata.results[ `time_series_${granularity}` ][ `by_${type}` ];
    const line_keys = Object.keys(time_series_data[ time_series_data.length - 1 ]).filter(key => Number(key.split('_')[ 1 ]) < numBins);
    let chartData = time_series_data.map((row, i) => {
      const newRow = {};
      Object.keys(row).filter(key => Number(key.split('_')[ 1 ]) < numBins).forEach(rowKey => {
        newRow[ rowKey ] = row[ rowKey ];
      });
      newRow[ 'xaxis' ] = `${i}`;
      return newRow;
    });
    let chartLines = line_keys.map((line_key, idx) => {
      let line_idx = line_key.split('_')[ 1 ];
      return {
        component: 'recharts.Line',
        props: {
          dataKey: line_key,
          strokeWidth: 3,
          // strokeDasharray: '3 3',
          type: 'monotone',
          dot: false,
          name: bins[ line_idx ],
          stroke: SAMPLE_COLORS[ idx ] || DIGIFI_COLOR,
          isAnimationActive: false,
        },
      };
    });
    return {
      component: 'recharts.LineChart',
      props: {
        width: 980,
        height: 500,
        // maxBarSize: 100,
        // barCategoryGap: '10%',
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
            // tick: 'func:window.__ra_custom_elements.CustomAxisTick',
            windowCompProps: {
              numTicks: chartData.length,
            },
            label: {
              value: '# of Months',
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
            allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
            tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
            label: {
              value: `Cumulative Default Rate % By ${capitalize(type)}`,
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
        }, ...chartLines, ],
    };
  } catch (e) {
    console.log({ e, });
  }
}

function _getModelDriverChart({ configuration, providers, modeldata, query, scoredata, }) {
  try {
    let granularity = query.granularity || 50;
    const provider = query.provider || modeldata.selected_provider;
    const minimum_score = query.minimum_score || 300;
    const max_score = 850;
    const numBins = granularity === 50 ? Math.floor((max_score - minimum_score) / granularity) : Math.floor((max_score - minimum_score) / granularity) + 1;
    if (!modeldata[ provider ] || !scoredata) return null;
    const bins = scoredata.results[ `bins_${granularity}` ].slice(0, numBins);
    const model_driver_data = scoredata.results.model_driver_map[ configuration.subsection_title ][ granularity ].slice(0, numBins);
    if (Array.isArray(model_driver_data) && typeof model_driver_data[ 0 ] === 'object' && model_driver_data[ 0 ] !== null) {
      //categorical
      const categoryLabels = Object.keys(model_driver_data[ 0 ][ configuration.subsection_title ]);
      let chartData = model_driver_data.map((value, i) => {
        const binChartData = {};
        const bindata = value[ configuration.subsection_title ];
        const binSum = categoryLabels.reduce((sum, catLabel) => {
          if (bindata[ catLabel ] === null) return null;
          sum += bindata[ catLabel ];
          return sum;
        }, 0);
        if (binSum !== null) {
          categoryLabels.forEach(catLabel => {
            binChartData[ catLabel ] = bindata[ catLabel ] / binSum;
          });
        }
        binChartData.xaxis = bins[ i ];
        return binChartData;
      });
      let chartBars = categoryLabels.map((label, idx) => {
        return {
          component: 'recharts.Bar',
          props: {
            dataKey: label,
            name: label,
            stackId: 'a',
            fill: SAMPLE_COLORS[ idx ],
            isAnimationActive: false,
          },
        };
      });
      let numTicks = (chartData.length <= 20) ? 0 : 4;
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
              interval: numTicks,
              tick: 'func:window.__ra_custom_elements.CustomAxisTick',
              windowCompProps: {
                numTicks: chartData.length,
              },
              label: {
                value: 'DigiFi Score',
                angle: '0',
                position: 'bottom',
                offset: '30',
              },
            },
          }, {
            component: 'recharts.YAxis',
            hasWindowFunc: true,
            props: {
              // domain: ((configuration.unit === 'percentage') ? [ 0, 1, ] : [ 0, 'auto', ]),
              // tickCount: (configuration.unit === 'percentage') ? 6 : undefined,
              // allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
              tickFormatter: 'func:window.chartPercentageFormatter',
              label: {
                value: 'Percentage of Category',
                angle: '-90',
                offset: 0,
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
          }, ...chartBars, ],
      };
      return chart;
    } else {
      let chartData = model_driver_data.map((value, i) => {
        return {
          xaxis: bins[ i ],
          [ `${configuration.subsection_title}` ]: value,
        };
      });
      let numTicks = (chartData.length <= 20) ? 0 : 4;
      let chartLines = [ {
        component: 'recharts.Line',
        props: {
          strokeWidth: 3,
          dataKey: configuration.subsection_title,
          // strokeDasharray: '3 3',
          type: 'monotone',
          dot: false,
          // name: bins[line_idx],
          stroke: DIGIFI_COLOR,
          isAnimationActive: false,
          connectNulls: true,
        },
      }, ];
      return {
        component: 'recharts.LineChart',
        props: {
          width: 980,
          height: 500,
          // maxBarSize: 100,
          // barCategoryGap: '10%',
          data: chartData,
        },
        children: [
          {
            component: 'recharts.XAxis',
            hasWindowComponent: true,
            props: {
              dataKey: 'xaxis',
              interval: numTicks,
              tick: 'func:window.__ra_custom_elements.CustomAxisTick',
              windowCompProps: {
                numTicks: chartData.length,
              },
              label: {
                value: 'DigiFi Score',
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
              allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
              tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
              label: {
                value: `Average ${configuration.subsection_title}`,
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
          }, ...chartLines, ],
      };
    }

  } catch (e) {
    console.log({ e, });
  }
}

function _getPredictivePowerChart({ configuration, providers, modeldata, query, scoredata, }) {
  try {
    const batch_type = query.batch_type || 'testing';
    const provider = query.provider || modeldata.selected_provider;
    if (!scoredata || !scoredata.results || !modeldata[ provider ] || !modeldata[ provider ][ `batch_${batch_type}_id` ] || !modeldata[ provider ][ `batch_${batch_type}_id` ].results) return null;
    const comparisonScoreInverse = modeldata.comparison_score_inverse === true;
    const comparison_score_roc = (comparisonScoreInverse)
      ? scoredata.results.comparison_score_roc.map(score => {
        return {
          true_positive_rate: 1 - score.true_positive_rate,
          false_positive_rate: 1 - score.false_positive_rate,
        }
      })
      : scoredata.results.comparison_score_roc;

    const provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
    const simpleLine = [ {
      false_positive_rate: 0,
      true_positive_rate: 0,
    }, {
      false_positive_rate: 1,
      true_positive_rate: 1,
    }, ];
    let chartScatter = [ {
      component: 'recharts.Scatter',
      props: {
        data: provider_result.roc_distribution,
        line: true,
        name: 'DigiFi Score',
        fill: DIGIFI_COLOR,
        isAnimationActive: false,
      },
    }, {
      component: 'recharts.Scatter',
      props: {
        data: comparison_score_roc,
        line: true,
        name: 'Comparison Score',
        fill: '#5c198e',
        isAnimationActive: false,
      },
    }, {
      component: 'recharts.Scatter',
      props: {
        data: simpleLine,
        line: true,
        name: '',
        legendType: 'none',
        'strokeDasharray': '5 5',
        dotted: true,
        fill: 'gray',
        isAnimationActive: false,
      },
    }, ];
    return {
      component: 'recharts.ScatterChart',
      props: {
        width: 980,
        height: 500,
      },
      children: [
        {
          component: 'recharts.Legend',
          props: {
            width: 150,
            iconType: 'square',
            // payload: providers.map((provider, idx) => ({
            //   value: PROVIDER_LABEL[ provider ],
            //   type: 'square',
            //   color: PROVIDER_COLORS[ provider ],
            //   id: PROVIDER_LABEL[ provider ],
            // })),
            style: {
            },
          },
        },
        {
          component: 'recharts.XAxis',
          hasWindowFunc: true,
          props: {
            dataKey: 'false_positive_rate',
            // type: 'number',
            name: 'False Positive Rate',
            label: {
              value: 'False Positive Rate',
              angle: '0',
              position: 'bottom',
            },
            domain: [ 0, 1, ],
            tickFormatter: 'func:window.chartPercentageFormatter',
            type: 'number',
            tickCount: 11,
          },
        }, {
          component: 'recharts.YAxis',
          hasWindowFunc: true,
          props: {
            dataKey: 'true_positive_rate',
            name: 'True Positive Rate',
            label: {
              value: 'True Positive Rate',
              angle: '-90',
              offset: 0,
              position: 'insideLeft',
            },
            type: 'number',
            domain: [ 0, 1, ],
            allowDataOverflow: true,
            tickFormatter: 'func:window.chartPercentageFormatter',
            // unit: '%',
            // interval: 0,
            // tick: 'func:window.__ra_custom_elements.CustomAxisTick',
            // windowCompProps: {
            //   numTicks: 100,
            // }
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
        }, ...chartScatter, ],
    };
  } catch (e) {
    console.log({ e });
  }
}

function _getAverageScoreChart({ configuration, providers, modeldata, query, scoredata, }) {
  const batch_type = query.batch_type || 'testing';
  const provider = query.provider || modeldata.selected_provider;
  const minimum_score = query.minimum_score || 300;
  const max_score = 850;
  const numBins = Math.floor((max_score - minimum_score) / 10) + 1;
  if (!modeldata[ provider ] || !scoredata || !scoredata.results || !scoredata.results.average_score_rows) return null;
  const average_score_rows = scoredata.results.average_score_rows.slice(0, numBins).filter(el => !!el).map(row => {
    if (row) row.digifi_score = String(row.digifi_score);
    return row;
  })
  let chartLines = [ {
    component: 'recharts.Line',
    props: {
      strokeWidth: 3,
      dataKey: 'comparison_score',
      // strokeDasharray: '3 3',
      type: 'monotone',
      dot: false,
      // name: bins[line_idx],
      stroke: DIGIFI_COLOR,
      isAnimationActive: false,
      connectNulls: true,
    },
  }, ];
  let numTicks = (average_score_rows.length <= 20) ? 0 : 4;
  return {
    component: 'recharts.LineChart',
    props: {
      width: 980,
      height: 500,
      // maxBarSize: 100,
      // barCategoryGap: '10%',
      data: average_score_rows,
    },
    children: [
      {
        component: 'recharts.XAxis',
        hasWindowComponent: true,
        props: {
          dataKey: 'digifi_score',
          interval: numTicks,
          tick: 'func:window.__ra_custom_elements.CustomAxisTick',
          windowCompProps: {
            numTicks: average_score_rows.length,
          },
          label: {
            value: 'DigiFi Score',
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
          allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
          tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
          label: {
            value: 'Average of Comparison Score',
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
      }, ...chartLines, ],
  };
}

function _getProjectedAnnualDefaultRateChart({ configuration, providers, modeldata, query, scoredata, }) {
  const yaxis_scale = query.yaxis_scale || 1;
  const batch_type = query.batch_type || 'testing';
  const provider = query.provider || modeldata.selected_provider;
  const minimum_score = query.minimum_score || 300;
  const max_score = 850;
  const numBins = Math.floor((max_score - minimum_score) / 10) + 1;
  if (!modeldata[ provider ] || !scoredata || !scoredata.results || !scoredata.results.adr_projected_10) return null;
  const bins = scoredata.results[ 'bins_10' ].slice(0, numBins);
  const adr_projected_10 = scoredata.results.adr_projected_10.slice(0, numBins).reduce((aggregate, score, i) => {
    const binData = {
      digifi_score: bins[ i ],
      projected_adr: score
    }
    aggregate.push(binData);
    return aggregate;
  }, []);
  let chartData = adr_projected_10;
  let numTicks = (chartData.length <= 20) ? 0 : 4;
  let chartBars = [ {
    component: 'recharts.Bar',
    props: {
      dataKey: 'projected_adr',
      name: 'Projected Annual Default Rate %',
      stackId: 'a',
      fill: DIGIFI_COLOR,
      isAnimationActive: false,
    },
  }, ];

  return {
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
        component: 'recharts.XAxis',
        hasWindowComponent: true,
        props: {
          dataKey: 'digifi_score',
          interval: numTicks,
          tick: 'func:window.__ra_custom_elements.CustomAxisTick',
          windowCompProps: {
            numTicks: adr_projected_10.length,
          },
          label: {
            value: 'DigiFi Score',
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
          allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
          tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
          label: {
            value: 'Projected Annual Default Rate %',
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
      },
      ...chartBars, ],
  };
}

module.exports = {
  _getAnnualDefaultRateChart,
  _getCumulativeDefaultRateChart,
  _getLoanVolumeChart,
  _getTimeSeriesChart,
  _getModelDriverChart,
  _getPredictivePowerChart,
  _getAverageScoreChart,
  _getProjectedAnnualDefaultRateChart,
};