'use strict';
const CONSTANTS = require('../../../constants');
const capitalize = require('capitalize');
const numeral = require('numeral');
const util = require('util');
const COLORS = [ '#007aff', '#5c198e', '#00b050', '#68d7e3', '#ffa13b', '#ff6f72', ];
const PROVIDER_LABEL = require('../../../constants/ml').PROVIDER_LABEL;
const PROVIDER_COLORS = require('../../../constants/ml').PROVIDER_COLORS;

function _getAccuracyRateLineCharts({ configuration, current_data, providers, modeldata, query, }) {
  let batch_type = query.batch_type || 'testing';
  let chartData = Array.apply(null, Array(101)).map((_, i) => {
    let row = { xaxis: ((i) / 100), };
    providers.forEach(provider => {
      let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
      row[ provider ] = provider_result.accuracy_distribution[ i ].accuracy_rate;
    });
    return row;
  });
  let chartLines = providers.map((provider, idx) => {
    return {
      component: 'recharts.Line',
      props: {
        dataKey: provider,
        // strokeDasharray: '3 3',
        type: 'monotone',
        dot: false,
        name: `${PROVIDER_LABEL[ provider ]}`,
        stroke: PROVIDER_COLORS[ provider ],
        isAnimationActive: false,
      },
    };
  });
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
          domain: [ 0, 1, ],
          tickFormatter: 'func:window.chartPercentageFormatter',
          interval: 9,
          label: {
            value: 'Probability Threshold',
            angle: '0',
            position: 'bottom',
            offset: '20',
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
            value: 'Accuracy Rate (% Correct)',
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

function _getAccuracyRateBarCharts({ configuration, providers, modeldata, query, }) {
  let batch_type = query.batch_type || 'testing';
  let chartBars = [ {
    component: 'recharts.Bar',
    props: {
      dataKey: 'accuracy',
      name: 'Accuracy Rate',
      fill: COLORS[ 0 ],
      isAnimationActive: false,
    },
    children: providers.map((provider, idx) => ({
      component: 'recharts.Cell',
      props: {
        fill: PROVIDER_COLORS[ provider ],
      },
    })),
  }, ];
  let chartData;
  if (modeldata.type === 'binary') {
    chartData = providers.map(provider => {
      if (!modeldata[ provider ]) return { xaxis: PROVIDER_LABEL[ provider ], };
      let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
      let accuracy = Math.max(...provider_result.accuracy_distribution.map(row => row.accuracy_rate));
      return {
        xaxis: PROVIDER_LABEL[ provider ],
        accuracy,
      };
    });
  } else if (modeldata.type === 'categorical') {
    chartData = providers.map(provider => {
      if (!modeldata[ provider ]) return { xaxis: PROVIDER_LABEL[ provider ], };
      let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
      let numCats = provider_result.categories.length;
      let accuracy = (provider_result.categories) ? Number((provider_result.categories.reduce((sum, category, i) => sum + provider_result.accuracy_rates[ category ][ i ], 0) / numCats).toFixed(2)) : 'N/A';
      // let trainingAccuracyAverage = (batch_training_id.results.categories) ? 100 * Number((batch_training_id.results.categories.reduce((sum, category, i) => sum + batch_training_id.results.accuracy_rates[ category ][ i ], 0) / numCats).toFixed(0)) : 'N/A';
      // let testingAccuracyAverage = (batch_testing_id.results.categories) ? 100 * Number((batch_testing_id.results.categories.reduce((sum, category, i) => sum + batch_testing_id.results.accuracy_rates[ category ][ i ], 0) / numCats).toFixed(0)) : 'N/A';
      // let resilienceDiff = (typeof trainingAccuracyAverage === 'number' && typeof testingAccuracyAverage === 'number') ? Math.abs(trainingAccuracyAverage - testingAccuracyAverage) : 'N/A';
      return {
        xaxis: PROVIDER_LABEL[ provider ],
        accuracy,
      };
    });
  }

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
      // {
      //   component: 'recharts.Legend',
      //   props: {
      //     iconType: 'square',
      //     width: 150,
      //     style: {
      //     },
      //   },
      // },
      {
        component: 'recharts.XAxis',
        hasWindowComponent: true,
        props: {
          dataKey: 'xaxis',
          interval: 0,
          tick: 'func:window.__ra_custom_elements.CustomAxisTick',
          windowCompProps: {
            numTicks: chartData.length,
          },
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          tickCount: 5,
          domain: [ 0, 1, ],
          allowDataOverflow: true,
          tickFormatter: 'func:window.chartPercentageFormatter',
          label: {
            value: 'Accuracy Rate (% Correct)',
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
}

function _getAccuracyRateCharts({ configuration, data, formdata, providers, modeldata, query, }) {
  if (configuration.index % 2 === 1) {
    return _getAccuracyRateBarCharts({ configuration, providers, modeldata, query, });
  } else {
    return _getAccuracyRateLineCharts({ configuration, providers, modeldata, query, });
  }
}

function _getPredictivePowerChart({ configuration, providers, modeldata, query, }) {
  let batch_type = query.batch_type || 'testing';
  let chart_type = query.chart_type;
  if (configuration.index % 2 === 1) {
    let simpleLine = [ {
      false_positive_rate: 0,
      true_positive_rate: 0,
    }, {
      false_positive_rate: 1,
      true_positive_rate: 1,
    }, ];
    let chartScatter = providers.map((provider, idx) => {
      if (!modeldata[ provider ]) return null;
      let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
      return {
        component: 'recharts.Scatter',
        props: {
          data: provider_result.roc_distribution,
          line: true,
          name: PROVIDER_LABEL[ provider ],
          fill: PROVIDER_COLORS[ provider ],
          isAnimationActive: false,
        },
      };
    }).concat([ {
      component: 'recharts.Scatter',
      props: {
        data: simpleLine,
        line: true,
        name: 'Predicted',
        legendType: 'none',
        'strokeDasharray': '5 5',
        dotted: true,
        fill: 'gray',
        isAnimationActive: false,
      },
    }, ]);
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
            payload: providers.map((provider, idx) => ({
              value: PROVIDER_LABEL[ provider ],
              type: 'square',
              color: PROVIDER_COLORS[ provider ],
              id: PROVIDER_LABEL[ provider ],
            })),
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
  } else {
    let chartBars, chartData;
    if (modeldata.type === 'regression') {
      chartBars = [ {
        component: 'recharts.Bar',
        props: {
          dataKey: 'r_squared',
          name: 'Predictive Power',
          fill: COLORS[ 0 ],
          isAnimationActive: false,
        },
        children: providers.map((provider, idx) => ({
          component: 'recharts.Cell',
          props: {
            fill: PROVIDER_COLORS[ provider ],
          },
        })),
      }, ];
      chartData = providers.map(provider => {
        if (!modeldata[ provider ]) return { xaxis: PROVIDER_LABEL[ provider ], };
        let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
        return {
          xaxis: PROVIDER_LABEL[ provider ],
          r_squared: provider_result.r_squared,
        };
      });
    } else if (modeldata.type === 'categorical') {
      chartBars = [ {
        component: 'recharts.Bar',
        props: {
          dataKey: 'macro_avg_f1_score',
          name: 'Predictive Power',
          fill: COLORS[ 0 ],
          isAnimationActive: false,
        },
        children: providers.map((provider, idx) => ({
          component: 'recharts.Cell',
          props: {
            fill: PROVIDER_COLORS[ provider ],
          },
        })),
      }, ];
      chartData = providers.map(provider => {
        if (!modeldata[ provider ]) return { xaxis: PROVIDER_LABEL[ provider ], };
        let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
        return {
          xaxis: PROVIDER_LABEL[ provider ],
          macro_avg_f1_score: provider_result.macro_avg_f1_score.toFixed(2),
        };
      });
    } else {
      chartBars = [ {
        component: 'recharts.Bar',
        props: {
          dataKey: 'auc',
          name: 'Predictive Power',
          fill: COLORS[ 0 ],
          isAnimationActive: false,
        },
        children: providers.map((provider, idx) => ({
          component: 'recharts.Cell',
          props: {
            fill: PROVIDER_COLORS[ provider ],
          },
        })),
      }, ];
      chartData = providers.map(provider => {
        if (!modeldata[ provider ]) return { xaxis: PROVIDER_LABEL[ provider ], };
        let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
        return {
          xaxis: PROVIDER_LABEL[ provider ],
          auc: provider_result.auc,
        };
      });
    }

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
        // {
        //   component: 'recharts.Legend',
        //   props: {
        //     iconType: 'square',
        //     width: 150,
        //     style: {
        //     },
        //   },
        // },
        {
          component: 'recharts.XAxis',
          hasWindowComponent: true,
          props: {
            dataKey: 'xaxis',
            interval: 0,
            tick: 'func:window.__ra_custom_elements.CustomAxisTick',
            windowCompProps: {
              numTicks: chartData.length,
            },
          },
        }, {
          component: 'recharts.YAxis',
          hasWindowFunc: true,
          props: {
            tickCount: 5,
            domain: [ 0, 1, ],
            allowDataOverflow: true,
            // tickFormatter: 'func:window.chartPercentageFormatter',
            label: {
              value: 'Predictive Power',
              angle: '-90',
              offset: 0,
              position: 'insideLeft',
            },
          },
        }, {
          component: 'recharts.Tooltip',
          hasWindowFunc: true,
          props: {
            // formatter: 'func:window.chartPercentageFormatter',
            itemSorter: 'func:window.tooltipItemSorter',
            itemStyle: {
              margin: 0,
              padding: 0,
            },
          },
        }, ...chartBars, ],
    };
  }
}

function _getDistributionBarCharts({ configuration, providers, modeldata, query, }) {
  let batch_type = query.batch_type || 'testing';
  let granularity = query.granularity || 10;
  const provider = query.provider || providers[ 0 ];
  if (!modeldata[ provider ]) return null;
  let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
  let options = {
    1: 'one',
    5: 'five',
    10: 'ten',
  };
  let toPercent = (num) => numeral(num).format('0%');
  let bins = Array.apply(null, Array((100 / granularity))).map((_, i) => `${toPercent((granularity / 100) * i)} to ${toPercent((granularity / 100) * (i + 1))}`);
  let chartData = bins.reduce((reduced, bin, idx) => {
    let actual_1 = (configuration.unit === 'count') ? provider_result[ `actual_1_score_distribution_${options[ granularity ]}_pct` ][ idx ] : provider_result[ `actual_1_score_distribution_rates_${options[ granularity ]}_pct` ][ idx ];
    let actual_0 = (configuration.unit === 'count') ? provider_result[ `actual_0_score_distribution_${options[ granularity ]}_pct` ][ idx ] : provider_result[ `actual_0_score_distribution_rates_${options[ granularity ]}_pct` ][ idx ];
    if (configuration.unit === 'percentage' && (actual_1 + actual_0) > 1) actual_1 -= 0.01;
    reduced.push({
      xaxis: bin,
      actual_1,
      actual_0,
    });
    return reduced;
  }, []);

  let numTicks = (chartData.length <= 20) ? 0 : 4;
  let chartBars = [ {
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual_1',
      name: 'Historical Result = TRUE',
      stackId: 'a',
      fill: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual_0',
      name: 'Historical Result = FALSE',
      stackId: 'a',
      fill: '#5c198e',
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
          tick: 'func:window.__ra_custom_elements.MLAxisTick',
          windowCompProps: {
            numTicks: chartData.length,
            // disableRotation: true,
            // disableTextFormat: true,
          },
          label: {
            value: 'Predicted Probability',
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
            value: (configuration.unit === 'count') ? 'Count' : '% of Total',
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

function _getDistributionCharts({ configuration, providers, modeldata, query, }) {
  return _getDistributionBarCharts({ configuration, providers, modeldata, query, });
}

function _getResiliencyBarCharts({ configuration, providers, modeldata, query, }) {
  let chartBars = [ {
    component: 'recharts.Bar',
    props: {
      dataKey: 'resiliency',
      name: 'Resiliency',
      fill: COLORS[ 0 ],
      isAnimationActive: false,
    },
    children: providers.map((provider, idx) => ({
      component: 'recharts.Cell',
      props: {
        fill: PROVIDER_COLORS[ provider ],
      },
    })),
  }, ];
  let chartData;
  if (modeldata.type === 'binary') {
    chartData = providers.map(provider => {
      if (!modeldata[ provider ]) return { xaxis: PROVIDER_LABEL[ provider ], };
      let training_results = modeldata[ provider ].batch_training_id.results;
      let testing_results = modeldata[ provider ].batch_testing_id.results;
      let ks_training_max_score = Math.max(...training_results.ks_scores);
      let ks_test_max_score = Math.max(...testing_results.ks_scores);
      let training_auc = training_results.auc;
      let testing_auc = testing_results.auc;
      let resiliency = (1 - Math.abs(training_auc - testing_auc)).toFixed(2);
      return {
        xaxis: PROVIDER_LABEL[ provider ],
        resiliency,
      };
    });
  } else if (modeldata.type === 'categorical') {
    chartData = providers.map(provider => {
      if (!modeldata[ provider ]) return { xaxis: PROVIDER_LABEL[ provider ], };
      let numCats = modeldata[ provider ][ 'batch_training_id' ].results.categories.length;
      let training_results = modeldata[ provider ].batch_training_id.results;
      let testing_results = modeldata[ provider ].batch_testing_id.results;
      let trainingAccuracyAverage = (training_results.categories) ? Number((training_results.categories.reduce((sum, category, i) => sum + training_results.accuracy_rates[ category ][ i ], 0) / numCats).toFixed(2)) : 'N/A';
      let testingAccuracyAverage = (testing_results.categories) ? Number((testing_results.categories.reduce((sum, category, i) => sum + testing_results.accuracy_rates[ category ][ i ], 0) / numCats).toFixed(2)) : 'N/A';
      let resiliency = (typeof trainingAccuracyAverage === 'number' && typeof testingAccuracyAverage === 'number') ? 1 - Math.abs(trainingAccuracyAverage - testingAccuracyAverage) : 'N/A';
      return {
        xaxis: PROVIDER_LABEL[ provider ],
        resiliency,
      };
    });
  } else {
    chartData = providers.map(provider => {
      if (!modeldata[ provider ]) return { xaxis: PROVIDER_LABEL[ provider ], };
      let training_results = modeldata[ provider ].batch_training_id.results;
      let testing_results = modeldata[ provider ].batch_testing_id.results;
      let resiliency = (typeof training_results.r_squared === 'number' && typeof testing_results.r_squared === 'number') ? 1 - Math.abs(((training_results.r_squared - testing_results.r_squared)).toFixed(2)) : 'N/A';
      return {
        xaxis: PROVIDER_LABEL[ provider ],
        resiliency,
      };
    });
  }

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
      // {
      //   component: 'recharts.Legend',
      //   props: {
      //     iconType: 'square',
      //     width: 150,
      //     style: {
      //     },
      //   },
      // },
      {
        component: 'recharts.XAxis',
        hasWindowComponent: true,
        props: {
          dataKey: 'xaxis',
          interval: 0,
          tick: 'func:window.__ra_custom_elements.CustomAxisTick',
          windowCompProps: {
            numTicks: chartData.length,
          },
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          tickCount: 5,
          domain: [ 0, 1, ],
          allowDataOverflow: true,
          tickFormatter: 'func:window.chartPercentageFormatter',
          label: {
            value: '% Difference (Test vs. Train)',
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
}

function _getCategoricalAccuracyCharts({ configuration, providers, modeldata, query, }) {
  let provider = query.provider || providers[ 0 ];
  let batch_type = query.batch_type || 'testing';
  if (!modeldata[ provider ]) return null;
  let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
  let categories = provider_result.categories;
  let chartData;
  if (configuration.unit === 'count') {
    chartData = Object.keys(provider_result.accuracy_counts).map(key => {
      return provider_result.accuracy_counts[ key ].reduce((reduced, val, idx) => {
        reduced[ categories[ idx ] ] = val;
        return reduced;
      }, { xaxis: key, });
    });
  } else {
    chartData = Object.keys(provider_result.accuracy_rates).map(key => {
      return provider_result.accuracy_rates[ key ].reduce((reduced, val, idx) => {
        reduced[ categories[ idx ] ] = val;
        return reduced;
      }, { xaxis: key })
    });
  }

  let colorsArr = [ '#007aff', '#5c198e', '#00b050', '#68d7e3', '#ffa13b', '#ff6f72', ];
  let chartBars = Object.keys(provider_result.accuracy_counts).reduce((reduced, key, idx) => {
    return reduced.concat({
      component: 'recharts.Bar',
      props: {
        dataKey: key,
        name: key,
        stackId: 'a',
        fill: colorsArr[ idx ] || '#007aff',
        isAnimationActive: false,
      },
    });
  }, []);

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
          interval: 0,
          tick: 'func:window.__ra_custom_elements.CustomAxisTick',
          windowCompProps: {
            numTicks: chartData.length,
          },
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          label: {
            value: (configuration.unit === 'count') ? 'Count' : '% of Total',
            angle: '-90',
            offset: 0,
            position: 'insideLeft',
          },
          allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
          domain: ((configuration.unit === 'percentage') ? [0, 1,] : [0, 'auto',]),
          tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
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

function _getDecisionSpeedCharts({ configuration, providers, modeldata, query, }) {
  const provider = query.provider || providers[ 0 ];
  let batch_type = query.batch_type || 'testing';
  return null;
  if (!modeldata[ provider ]) return null;
}

function _getRegressionConfidenceIntervalCharts({ configuration, providers, modeldata, query, }) {
  const provider = query.provider || providers[ 0 ];
  let batch_type = query.batch_type || 'testing';
  if (!modeldata[ provider ]) return null;
  let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
  let regressionNumPoints = (query.regressionplot) ? query.regressionplot : '1000';
  let confidenceIntervalMap = {
    '75': 1.15035,
    '95': 1.95996,
    '99': 2.57583,
  };
  let confidenceIntervalMultiplier = (query.confidenceinterval) ? confidenceIntervalMap[ query.confidenceinterval ] : confidenceIntervalMap[ '75' ];
  let currentChart = provider_result[ `regression_distribution_${regressionNumPoints}` ];
  let rmse = (provider_result && provider_result.rmse && confidenceIntervalMultiplier) ? Math.floor(Number(provider_result.rmse) * confidenceIntervalMultiplier) : 0;
  let abs_min = provider_result[ `regression_distribution_${regressionNumPoints}_absmax` ];
  let abs_max = provider_result[ `regression_distribution_${regressionNumPoints}_absmin` ];
  let upper_bound_initial_pt = {
    actual: abs_min + rmse,
    predicted: abs_min,
  };
  let upper_bound_final_pt = {
    actual: abs_max + rmse,
    predicted: abs_max,
  };
  let lower_bound_initial_pt = {
    actual: abs_min - rmse,
    predicted: abs_min,
  };

  let lower_bound_final_pt = {
    actual: abs_max - rmse,
    predicted: abs_max,
  };

  let chartUpperBound = [ upper_bound_initial_pt, upper_bound_final_pt, ];

  let chartLowerBound = [ lower_bound_initial_pt, lower_bound_final_pt, ];

  let chartC = [ {
    actual: abs_min,
    predicted: abs_min,
  }, {
    actual: abs_max,
    predicted: abs_max,
  }, ];
  let chartScatter = [ {
    component: 'recharts.Scatter',
    props: {
      data: currentChart,
      line: false,
      name: `${capitalize(batch_type)} Data Set`,
      fill: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Scatter',
    props: {
      data: chartC,
      line: true,
      'strokeDasharray': '5 5',
      name: 'Predicted Value',
      dotted: true,
      fill: 'gray',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Scatter',
    props: {
      data: chartUpperBound,
      line: true,
      // 'strokeDasharray': '5 5',
      name: 'Upper Bound',
      dotted: true,
      fill: 'green',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Scatter',
    props: {
      data: chartLowerBound,
      line: true,
      // 'strokeDasharray': '5 5',
      name: 'Lower Bound',
      dotted: true,
      fill: '#5c198e',
      isAnimationActive: false,
    },
  }, ];
  let increment = Math.floor((abs_max - abs_min) / 5);
  let ticks = Array.apply(null, Array(6)).map((_, i) => (i * increment + abs_min));
  return {
    component: 'recharts.ScatterChart',
    props: {
      width: 980,
      height: 980,
    },
    children: [
      {
        component: 'recharts.Legend',
        props: {
          iconType: 'square',
          width: 150,
          style: {
          },
        },
      },
      {
        component: 'recharts.XAxis',
        hasWindowFunc: true,
        props: {
          dataKey: 'predicted',
          // type: 'number',
          name: 'Predicted Value',
          label: {
            value: 'Predicted Value',
            angle: '0',
            position: 'bottom',
          },
          domain: [ abs_min, abs_max, ],
          tickFormatter: 'func:window.chartCountFormatter',
          type: 'number',
          ticks,
          // tickCount: 5,
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          dataKey: 'actual',
          name: 'Actual Value',
          label: {
            value: 'Actual Value',
            angle: '-90',
            offset: 0,
            position: 'insideLeft',
          },
          type: 'number',
          domain: [ abs_min, abs_max, ],
          tickFormatter: 'func:window.chartCountFormatter',
          ticks,
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
}

function _getResiliencyScatterCharts({ configuration, providers, modeldata, query, }) {
  let simpleLine = [ {
    false_positive_rate: 0,
    true_positive_rate: 0,
  }, {
    false_positive_rate: 1,
    true_positive_rate: 1,
  }, ];
  const BATCH_TYPES = [ 'training', 'testing', ];
  const provider = query.provider || providers[ 0 ];
  let providerdata = modeldata[ provider ];
  let chartScatter = BATCH_TYPES.map((batch_type, idx) => {
    if (!providerdata[ `batch_${batch_type}_id` ]) return null;
    let provider_result = providerdata[ `batch_${batch_type}_id` ].results;
    return {
      component: 'recharts.Scatter',
      props: {
        data: provider_result.roc_distribution,
        line: true,
        name: capitalize(batch_type),
        fill: COLORS[ idx ],
        isAnimationActive: false,
      },
    };
  }).concat([ {
    component: 'recharts.Scatter',
    props: {
      data: simpleLine,
      line: true,
      name: 'Predicted',
      legendType: 'none',
      'strokeDasharray': '5 5',
      dotted: true,
      fill: 'gray',
      isAnimationActive: false,
    },
  }, ]);
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
          payload: BATCH_TYPES.map((batch_type, idx) => ({
            value: capitalize(batch_type),
            type: 'square',
            color: COLORS[ idx ],
            id: capitalize(batch_type),
          })),
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
}

function _getKSScoreCharts({ configuration, providers, modeldata, query, }) {
  // const provider = query.provider || providers[0];
  let batch_type = query.batch_type || 'testing';
  // let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
  // let currentChart = provider_result.ks_scores;
  // currentChart = currentChart.map((el, idx) => {
  //   return {
  //     ks_score: el,
  //     threshold: (idx / 100),
  //   };
  // });
  let chartScatter = providers.map(provider => {
    let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
    let currentChart = provider_result.ks_scores;
    currentChart = currentChart.map((el, idx) => {
      return {
        ks_score: el,
        threshold: (idx / 100),
      };
    });
    return {
      component: 'recharts.Scatter',
      props: {
        data: currentChart,
        line: true,
        name: PROVIDER_LABEL[ provider ],
        fill: PROVIDER_COLORS[ provider ],
        isAnimationActive: false,
      },
    };
  });
  // let chartScatter = [{
  //   component: 'recharts.Scatter',
  //   props: {
  //     data: currentChart,
  //     line: true,
  //     name: `${capitalize(batch_type)} Data Set`,
  //     fill: '#007aff',
  //     isAnimationActive: false,
  //   },
  // },];

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
          iconType: 'square',
          width: 150,
          style: {
          },
        },
      },
      {
        component: 'recharts.XAxis',
        hasWindowFunc: true,
        props: {
          dataKey: 'threshold',
          // type: 'number',
          name: 'Threshold',
          label: {
            value: 'Threshold',
            angle: '0',
            position: 'bottom',
          },
          domain: [ 0, 1, ],
          tickFormatter: 'func:window.chartPercentageFormatter',
          type: 'number',
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          dataKey: 'ks_score',
          name: 'K-S Score',
          label: {
            value: 'K-S Score',
            angle: '-90',
            offset: 0,
            position: 'insideLeft',
          },
          type: 'number',
          domain: [ 0, 1, ],
          tickFormatter: 'func:window.chartPercentageFormatter',
          // ticks
          // allowDataOverflow: true,
          // allowDecimals: true,
          // interval: 0,
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
}

function _getKSCurveCharts({ configuration, providers, modeldata, query, }) {
  let batch_type = query.batch_type || 'testing';
  const provider = query.provider || providers[ 0 ];
  let current_data = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
  let chartData = current_data.cumulative_pct_of_ones.map((cumulative_pct_of_ones, i) => {
    return {
      xaxis: i / 100,
      cumulative_pct_of_ones,
      cumulative_pct_of_zeros: current_data.cumulative_pct_of_zeros[ i ],
    };
  });
  let chartLines = [ {
    component: 'recharts.Line',
    props: {
      dataKey: 'cumulative_pct_of_ones',
      type: 'monotone',
      dot: false,
      name: '% of Observations with historical_result = 1',
      stroke: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Line',
    props: {
      dataKey: 'cumulative_pct_of_zeros',
      type: 'monotone',
      dot: false,
      name: '% of Observations with historical_result = 0',
      stroke: '#5c198e',
      isAnimationActive: false,
    },
  }, ];
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
        hasWindowComponent: true,
        props: {
          dataKey: 'xaxis',
          interval: 49,
          label: {
            value: 'Threshold Value',
            angle: '0',
            position: 'bottom',
            offset: '20',
          },
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          domain: [ 0, 1, ],
          allowDataOverflow: true,
          tickFormatter: 'func:window.chartPercentageFormatter',
          label: {
            value: 'Cumulative Probability',
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
      }, ...chartLines, ],
  };
}

function _getRegressionDistributionCharts({ configuration, providers, modeldata, query, }) {
  let batch_type = query.batch_type || 'testing';
  const provider = query.provider || providers[ 0 ];
  let current_data = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
  let chartData = current_data.distributions_count;
  let chartBars = [ {
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual',
      name: 'Actual Results',
      fill: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Bar',
    props: {
      dataKey: 'predicted',
      name: 'Predicted',
      fill: '#5c198e',
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
          dataKey: 'interval',
          interval: 0,
          tick: 'func:window.__ra_custom_elements.CustomAxisTick',
          windowCompProps: {
            numTicks: chartData.length,
          },
          label: {
            value: 'Result (Range)',
            angle: '0',
            position: 'bottom',
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
            value: 'Count',
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

function _getResiliencyScatterRegressionCharts({ configuration, providers, modeldata, query, }) {
  const provider = query.provider || providers[ 0 ];
  if (!modeldata[ provider ]) return null;
  let regressionNumPoints = (query.regressionplot) ? query.regressionplot : '1000';
  let confidenceIntervalMap = {
    '75': 1.15035,
    '95': 1.95996,
    '99': 2.57583,
  };
  query.confidenceinterval = '75';
  let confidenceIntervalMultiplier = (query.confidenceinterval) ? confidenceIntervalMap[ query.confidenceinterval ] : confidenceIntervalMap[ '75' ];
  let training = {}, testing = {};
  if (modeldata[ provider ][ 'batch_training_id' ] && modeldata[ provider ][ 'batch_training_id' ].results) {
    let provider_result = modeldata[ provider ][ 'batch_training_id' ].results;
    training.currentChart = provider_result[ `regression_distribution_${regressionNumPoints}` ];
    let rmse = (provider_result && provider_result.rmse && confidenceIntervalMultiplier) ? Math.floor(Number(provider_result.rmse) * confidenceIntervalMultiplier) : 0;
    let abs_max = provider_result[ `regression_distribution_${regressionNumPoints}_absmax` ];
    let abs_min = provider_result[ `regression_distribution_${regressionNumPoints}_absmin` ];
    // training.upper_bound_initial_pt = {
    //   actual: abs_min + rmse,
    //   predicted: abs_min,
    // };
    // training.upper_bound_final_pt = {
    //   actual: abs_max + rmse,
    //   predicted: abs_max,
    // };
    // training.lower_bound_initial_pt = {
    //   actual: abs_min - rmse,
    //   predicted: abs_min,
    // };
    // training.lower_bound_final_pt = {
    //   actual: abs_max - rmse,
    //   predicted: abs_max,
    // };
    training.abs_min = abs_min;
    training.abs_max = abs_max;
  }
  if (modeldata[ provider ][ 'batch_testing_id' ] && modeldata[ provider ][ 'batch_testing_id' ].results) {
    let provider_result = modeldata[ provider ][ 'batch_testing_id' ].results;
    testing.currentChart = provider_result[ `regression_distribution_${regressionNumPoints}` ];
    let rmse = (provider_result && provider_result.rmse && confidenceIntervalMultiplier) ? Math.floor(Number(provider_result.rmse) * confidenceIntervalMultiplier) : 0;
    let abs_max = provider_result[ `regression_distribution_${regressionNumPoints}_absmax` ];
    let abs_min = provider_result[ `regression_distribution_${regressionNumPoints}_absmin` ];
    testing.abs_min = abs_min;
    testing.abs_max = abs_max;
  }
  // let chartUpperBound = [Math.min(training.upper_bound_initial_pt, testing.upper_bound_initial_pt), Math.max(training.upper_bound_final_pt, testing.upper_bound_final_pt),];
  // let chartLowerBound = [Math.min(training.lower_bound_initial_pt, testing.lower_bound_initial_pt), Math.max(training.lower_bound_final_pt, testing.lower_bound_final_pt),];
  let chartScatter = [ {
    component: 'recharts.Scatter',
    props: {
      data: training.currentChart,
      line: false,
      name: `${capitalize('training')} Data Set`,
      fill: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Scatter',
    props: {
      data: testing.currentChart,
      line: false,
      name: `${capitalize('testing')} Data Set`,
      fill: 'green',
      isAnimationActive: false,
    },
  }, ];
  let abs_max = Math.max(training.abs_max, testing.abs_max);
  let abs_min = Math.min(training.abs_min, testing.abs_min);
  let increment = Math.floor((abs_max - abs_min) / 5);
  let ticks = Array.apply(null, Array(6)).map((_, i) => (i * increment + abs_min));
  return {
    component: 'recharts.ScatterChart',
    props: {
      width: 980,
      height: 980,
    },
    children: [
      {
        component: 'recharts.Legend',
        props: {
          iconType: 'square',
          width: 150,
          style: {
          },
        },
      },
      {
        component: 'recharts.XAxis',
        hasWindowFunc: true,
        props: {
          dataKey: 'predicted',
          name: 'Predicted Value',
          label: {
            value: 'Predicted Value',
            angle: '0',
            offset: 0,
            position: 'bottom',
          },
          domain: [ abs_min, abs_max, ],
          tickFormatter: 'func:window.chartCountFormatter',
          type: 'number',
          ticks,
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          dataKey: 'actual',
          name: 'Actual Value',
          label: {
            value: 'Actual Value',
            angle: '-90',
            offset: 0,
            position: 'insideLeft',
          },
          type: 'number',
          domain: [ abs_min, abs_max, ],
          tickFormatter: 'func:window.chartCountFormatter',
          ticks,
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
}

function __getCategoricalAccuracyRateCharts({ configuration, providers, modeldata, query, }) {
  let batch_type = query.batch_type || 'testing';
  let chartBars, chartData;
  chartBars = [ {
    component: 'recharts.Bar',
    props: {
      dataKey: 'accuracy_rate',
      name: 'Accuracy Rate',
      fill: COLORS[ 0 ],
      isAnimationActive: false,
    },
    children: providers.map((provider, idx) => ({
      component: 'recharts.Cell',
      props: {
        fill: PROVIDER_COLORS[ provider ],
      },
    })),
  }, ];

  chartData = providers.map(provider => {
    if (!modeldata[ provider ]) return { xaxis: PROVIDER_LABEL[ provider ], };
    let provider_result = modeldata[ provider ][ `batch_${batch_type}_id` ].results;
    let numCats = provider_result.categories.length;
    return {
      xaxis: PROVIDER_LABEL[ provider ],
      accuracy_rate: provider_result.categories ? Number((provider_result.categories.reduce((sum, category, i) => sum + provider_result.accuracy_rates[ category ][ i ], 0) / numCats).toFixed(2)) : 0,
    };
  });

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
          interval: 0,
          tick: 'func:window.__ra_custom_elements.CustomAxisTick',
          windowCompProps: {
            numTicks: chartData.length,
          },
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          tickCount: 5,
          domain: [ 0, 1, ],
          allowDataOverflow: true,
          tickFormatter: 'func:window.chartPercentageFormatter',
          label: {
            value: 'Accuracy Rate',
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
}

module.exports = {
  _getPredictivePowerChart,
  __getCategoricalAccuracyRateCharts,
  _getAccuracyRateCharts,
  _getDistributionCharts,
  _getResiliencyBarCharts,
  _getResiliencyScatterCharts,
  _getCategoricalAccuracyCharts,
  _getRegressionConfidenceIntervalCharts,
  _getDecisionSpeedCharts,
  _getResiliencyScatterRegressionCharts,
  // _getKSScoreCharts,
  _getRegressionDistributionCharts,
  _getKSCurveCharts,
};