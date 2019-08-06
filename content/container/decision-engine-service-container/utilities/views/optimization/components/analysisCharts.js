'use strict';
const CONSTANTS = require('../../../constants');
const capitalize = require('capitalize');
const numeral = require('numeral');
const util = require('util');

function _getDataSourceCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let chartData = (configuration.unit === 'count') ? [
    { xaxis: 'Training Data', 'actual_1': training.actual_1_count, 'actual_0': training.actual_0_count, },
    { xaxis: 'Testing Data', 'actual_1': testing.actual_1_count, 'actual_0': testing.actual_0_count, },
  ] : [
    { xaxis: 'Training Data', 'actual_1': training.actual_1_pct, 'actual_0': training.actual_0_pct, },
    { xaxis: 'Testing Data', 'actual_1': testing.actual_1_pct, 'actual_0': testing.actual_0_pct, },
  ];
  let chartBars = [{
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual_1',
      name: 'Event Occurred (Historical Result = 1)',
      stackId: 'a',
      fill: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual_0',
      name: 'Event Did Not Occur (Historical Result = 0)',
      stackId: 'a',
      fill: '#5c198e',
      isAnimationActive: false,
    },
  },];
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
      }, ...chartBars,],
  };
}

function _getCategoricalObservationCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let chartData;
  if (configuration.unit === 'count') {
    let testingCountData = Object.keys(testing.observation_counts).reduce((reduced, key) => {
      let dataKey = key.replace(/ /g, '_');
      reduced[ dataKey ] = testing.observation_counts[ key ];
      return reduced;
    }, { xaxis: 'Testing Data', });
    let trainingCountData = Object.keys(training.observation_counts).reduce((reduced, key) => {
      let dataKey = key.replace(/ /g, '_');
      reduced[ dataKey ] = training.observation_counts[ key ];
      return reduced;
    }, { xaxis: 'Training Data', });
    chartData = [trainingCountData, testingCountData,];
  } else {
    let testingRatesData = Object.keys(testing.observation_rates).reduce((reduced, key) => {
      let dataKey = key.replace(/ /g, '_');
      reduced[ dataKey ] = testing.observation_rates[ key ];
      return reduced;
    }, { xaxis: 'Testing Data', });
    let trainingRatesData = Object.keys(training.observation_rates).reduce((reduced, key) => {
      let dataKey = key.replace(/ /g, '_');
      reduced[ dataKey ] = training.observation_rates[ key ];
      return reduced;
    }, { xaxis: 'Training Data', });
    chartData = [trainingRatesData, testingRatesData,];
  }

  let colorsArr = ['#007aff', '#5c198e', '#00b050', '#68d7e3', '#ffa13b', '#ff6f72',];
  let chartBars = Object.keys(training.observation_counts).reduce((reduced, key, idx) => {
    let dataKey = key.replace(/ /g, '_');
    return reduced.concat({
      component: 'recharts.Bar',
      props: {
        dataKey: dataKey,
        name: key,
        stackId: 'a',
        fill: colorsArr[idx] || '#007aff',
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
      }, ...chartBars,],
  };
}

function _getRocCurveCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let chartA = [{
    false_positive_rate: 1,
    true_positive_rate: 1,
  },].concat(testing.roc_distribution);
  let chartB = [{
    false_positive_rate: 1,
    true_positive_rate: 1,
  },].concat(training.roc_distribution);
  let chartC = [{
    false_positive_rate: 0,
    true_positive_rate: 0,
  }, {
    false_positive_rate: 1,
    true_positive_rate: 1,
  },];
  let chartScatter = [{
    component: 'recharts.Scatter',
    props: {
      data: chartA,
      line: true,
      name: 'Testing Data Set',
      fill: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Scatter',
    props: {
      data: chartB,
      line: true,
      name: 'Training Data Set',
      fill: '#5c198e',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Scatter',
    props: {
      data: chartC,
      line: true,
      name: ' ',
      fill: 'gray',
      isAnimationActive: false,
    },
  },
  ];
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
          domain: [0, 1,],
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
      }, ...chartScatter,],
  };
}

function _getThresholdPercentCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let chartData = Array.apply(null, Array(101)).map((_, i) => {
    let xaxis = (i / 100).toString();
    return {
      xaxis,
      total: current_data.percent_exceeding_threshold_total[ i ],
      actual_1: current_data.percent_exceeding_threshold_actual_1[ i ],
      actual_0: current_data.percent_exceeding_threshold_actual_0[ i ],
    };
  });
  let chartLines = [{
    component: 'recharts.Line',
    props: {
      dataKey: 'actual_1',
      type: 'monotone',
      dot: false,
      name: 'Event Occurred (Historical Result = 1)',
      stroke: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Line',
    props: {
      dataKey: 'actual_0',
      type: 'monotone',
      dot: false,
      name: 'Event Did Not Occur (Historical Result = 0)',
      stroke: '#5c198e',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Line',
    props: {
      dataKey: 'total',
      name: 'Total',
      dot: false,
      type: 'monotone',
      stroke: '#00b050',
      isAnimationActive: false,
    },
  },];
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
          domain: ((configuration.unit === 'percentage') ? [ 0, 1, ] : [ 0, 'auto', ]),
          allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
          tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
          label: {
            value: '% Exceeding Threshold',
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
      }, ...chartLines,],
  };
}

function _getAccuracyRateLineCharts({ configuration, current_data, }) {
  let chartData = Array.apply(null, Array(101)).map((_, i) => {
    let xaxis = ((i) / 100);
    let row = current_data.accuracy_distribution[ i ];
    let { accuracy_rate, error_rate, } = row;
    return {
      xaxis,
      accuracy_rate: accuracy_rate,
      error_rate: error_rate,
    };
  });
  let chartLines = [{
    component: 'recharts.Line',
    props: {
      dataKey: 'accuracy_rate',
      // strokeDasharray: '3 3',
      type: 'monotone',
      dot: false,
      name: 'Accuracy Rate (% Correctly Predicted)',
      stroke: 'green',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Line',
    props: {
      dataKey: 'error_rate',
      // strokeDasharray: '3 3',
      type: 'monotone',
      dot: false,
      name: 'Error Rate (% Incorrectly Predicted)',
      stroke: 'red',
      isAnimationActive: false,
    },
  },
  ];
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
          domain: [0, 1,],
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
            value: '% of Total',
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
      }, ...chartLines,],
  };
}

function _getAccuracyRateAreaCharts({ configuration, current_data, }) {
  let chartData = Array.apply(null, Array(101)).map((_, i) => {
    let xaxis = ((i) / 100).toString();
    let row = current_data.accuracy_distribution[ i ];
    let { accuracy_rate, error_rate, } = row;
    return {
      xaxis,
      accuracy_rate: accuracy_rate,
      error_rate: error_rate,
    };
  });
  let chartLines = [{
    component: 'recharts.Area',
    props: {
      dataKey: 'accuracy_rate',
      type: 'monotone',
      stackId: 'a',
      name: 'Accuracy Rate (% Correctly Predicted)',
      fill: 'green',
      stroke: 'green',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Area',
    props: {
      dataKey: 'error_rate',
      type: 'monotone',
      stackId: 'a',
      name: 'Error Rate (% Incorrectly Predicted)',
      fill: 'red',
      stroke: 'red',
      isAnimationActive: false,
    },
  },
  ];
  return {
    component: 'recharts.AreaChart',
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
          domain: [0, 1,],
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
            value: '% of Total',
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
      }, ...chartLines,],
  };
}

function _getAdvancedMetricsCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let metric = (formdata.navbar && formdata.navbar.metric) ? formdata.navbar.metric : 'true_positive_rate';
  let label_map = {
    'true_positive_rate': 'True Positive Rate (Recall)',
    'true_negative_rate': 'True Negative Rate (Specificity)',
    'false_positive_rate': 'False Positive Rate (Fallout)',
    'false_negative_rate': 'False Negative Rate',
  };
  let chartData = Array.apply(null, Array(101)).map((_, i) => {
    let xaxis = ((i) / 100).toString();
    let row = current_data.accuracy_distribution[ i ];
    return {
      xaxis,
      [metric]: row[metric],
    };
  });
  let chartLines = [
    {
      component: 'recharts.Line',
      props: {
        dataKey: metric,
        type: 'monotone',
        dot: false,
        name: label_map[metric],
        stroke: '#007aff',
        isAnimationActive: false,
      },
    }, 
  ];
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
            value: '% of Total',
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
      }, ...chartLines,],
  };
}

function _getDistributionBarCharts({ configuration, current_data, granularity, }) {
  let options = {
    1: 'one',
    5: 'five',
    10: 'ten',
  };
  let toPercent = (num) => numeral(num).format('0%');
  let bins = Array.apply(null, Array((100 / granularity))).map((_, i) => `${toPercent((granularity / 100) * i)} to ${toPercent((granularity / 100) * (i + 1))}`);
  let chartData = bins.reduce((reduced, bin, idx) => {
    let actual_1 = (configuration.unit === 'count') ? current_data[`actual_1_score_distribution_${options[granularity]}_pct`][ idx ] : current_data[`actual_1_score_distribution_rates_${options[granularity]}_pct`][ idx ];
    let actual_0 = (configuration.unit === 'count') ? current_data[ `actual_0_score_distribution_${options[ granularity ]}_pct` ][ idx ] : current_data[ `actual_0_score_distribution_rates_${options[ granularity ]}_pct` ][ idx ];
    if (configuration.unit === 'percentage' && (actual_1 + actual_0) > 1) actual_1 -= 0.01;
    reduced.push({
      xaxis: bin,
      actual_1,
      actual_0,
    });
    return reduced;
  }, []);

  let numTicks = (chartData.length <= 20) ? 0 : 4;
  let chartBars = [{
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual_1',
      name: 'Event Occurred (Historical Result = 1)',
      stackId: 'a',
      fill: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual_0',
      name: 'Event Did Not Occur (Historical Result = 0)',
      stackId: 'a',
      fill: '#5c198e',
      isAnimationActive: false,
    },
  },];

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
          domain: ((configuration.unit === 'percentage') ? [0, 1,] : [0, 'auto',]),
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
      }, ...chartBars,],
  };
}

function _getDistributionLineCharts({ configuration, current_data, granularity, }) {
  let options = {
    1: 'one',
    5: 'five',
    10: 'ten',
  };
  let bins = Array.apply(null, Array((100 / granularity) + 1)).map((_, i) => `${((granularity / 100) * i).toFixed(2)}`);
  let chartData = bins.reduce((reduced, bin, idx) => {
    let actual_1 = (configuration.unit === 'count') ? current_data[`actual_1_score_distribution_${options[granularity]}_pct`][ idx ] : current_data[`actual_1_score_distribution_rates_${options[granularity]}_pct`][ idx ];
    let actual_0 = (configuration.unit === 'count') ? current_data[`actual_0_score_distribution_${options[granularity]}_pct`][ idx ] : current_data[`actual_0_score_distribution_rates_${options[granularity]}_pct`][ idx ];
    reduced.push({
      xaxis: bin,
      actual_1,
      actual_0,
    });
    return reduced;
  }, []);
  let numTicks = (chartData.length <= 21) ? 0 : 4;  
  let chartBars = [{
    component: 'recharts.Line',
    props: {
      dataKey: 'actual_1',
      name: 'Event Occurred (Historical Result = 1)',
      stroke: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Line',
    props: {
      dataKey: 'actual_0',
      name: 'Event Did Not Occur (Historical Result = 0)',
      stroke: '#5c198e',
      isAnimationActive: false,
    },
  },];



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
          iconType: 'square',
          width: 150,
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
            value: 'Score',
            angle: '0',
            position: 'bottom',
          },
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          domain: ((configuration.unit === 'percentage') ? [0, 1,] : [0, 'auto',]),
          tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
          allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
          label: {
            value: (configuration.unit === 'count') ? 'Number of Records' : 'Percent of Records',
            angle: '-90',
            offset: 0,
            position: 'insideLeft',
          },
        },
      }, {
        component: 'recharts.Tooltip',
        hasWindowFunc: true,
        props: {
          formatter: 'func:window.chartAreaFormatter',
          itemSorter: 'func:window.tooltipItemSorter',
          itemStyle: {
            margin: 0,
            padding: 0,
          },
        },
      }, ...chartBars,],
  };
}

function _getCategoricalDistributionCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let chartData = Object.keys(current_data.prediction_distributions).reduce((reduced, key) => {
    let dataKey = key.replace(/ /g, '_');
    reduced.push({
      xaxis: key,
      actual_value: current_data.prediction_distributions[ key ]
    });
    return reduced;
  }, []);

  let chartBars =[{
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual_value',
      name: 'count',
      fill: '#007aff',
      isAnimationActive: false,
    },
  }];

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
      //     width: 150,
      //     iconType: 'square',
      //     style: {
      //     },
      //   },
      // },
      {
        component: 'recharts.XAxis',
        hasWindowComponent: true,
        props: {
          dataKey: 'xaxis',
          name: 'name',
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
      }, ...chartBars,],
  };
}

function _getDistributionCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let granularity = (formdata.navbar && formdata.navbar.granularity) ? Number(formdata.navbar.granularity) : 10;
  if (formdata.navbar && formdata.navbar.chart_type === 'line') {
    return _getDistributionLineCharts({ configuration, current_data, granularity, });
  } else {
    return _getDistributionBarCharts({ configuration, current_data, granularity, });
  }
}

function _getAccuracyRateCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  if (formdata.navbar && formdata.navbar.chart_type === 'line') {
    return _getAccuracyRateLineCharts({ configuration, current_data, });
  } else {
    return _getAccuracyRateAreaCharts({ configuration, current_data, });
  }
}

function _getSummaryCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let chartData = [
    { xaxis: 'Mean', total: current_data.total_mean, 'actual_1': current_data.actual_1_mean, 'actual_0': current_data.actual_0_mean, },
    { xaxis: 'Median', total: current_data.total_median, 'actual_1': current_data.actual_1_median, 'actual_0': current_data.actual_0_median, },
    { xaxis: 'Minimum', total: current_data.total_minimum, 'actual_1': current_data.actual_1_minimum, 'actual_0': current_data.actual_0_minimum, },
    { xaxis: 'Maximum', total: current_data.total_maximum, 'actual_1': current_data.actual_1_maximum, 'actual_0': current_data.actual_0_maximum, },
  ];
  let chartBars = [{
    component: 'recharts.Bar',
    props: {
      dataKey: 'total',
      name: 'Total (All Observations)',
      fill: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual_1',
      name: 'Event Occurred (Historical Result = 1)',
      fill: '#5c198e',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual_0',
      name: 'Event Did Not Occur (Historical Result = 0)',
      fill: '#00b050',
      isAnimationActive: false,
    },
  },];
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
          iconType: 'square',
          width: 150,
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
          tickCount: 5,
          domain: [ 0, 1, ],
          allowDataOverflow: true,
          tickFormatter: 'func:window.chartPercentageFormatter',
          label: {
            value: 'Predictions',
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
      }, ...chartBars,],
  };
}

function _getRegressionMetricsCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let chartData = [
    { xaxis: 'Mean', total: current_data.actual_mean, },
    { xaxis: 'Median', total: current_data.actual_median, },
    { xaxis: 'Minimum', total: current_data.actual_minimum, },
    { xaxis: 'Maximum', total: current_data.actual_maximum, },
  ];
  let chartBars = [{
    component: 'recharts.Bar',
    props: {
      dataKey: 'total',
      name: 'Total',
      fill: '#007aff',
      isAnimationActive: false,
    },
  },];

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
          domain: ((configuration.unit === 'percentage') ? [ 0, 1, ] : [ 0, 'auto', ]),
          allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
          tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
          label: {
            value: 'Results',
            angle: '-90',
            offset: 0,
            position: 'insideLeft',
          },
        },
      }, {
        component: 'recharts.Tooltip',
        hasWindowFunc: true,
        props: {
          formatter: 'func:window.chartMetricsFormatter',
          itemSorter: 'func:window.tooltipItemSorter',
          itemStyle: {
            margin: 0,
            padding: 0,
          },
        },
      }, ...chartBars,],
  };
}

function _getRegressionDataSourceCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let chartData = [
    { xaxis: 'Training Data', 'total': training.count, },
    { xaxis: 'Testing Data', 'total': testing.count, },
  ];

  let chartBars = [{
    component: 'recharts.Bar',
    props: {
      dataKey: 'total',
      name: 'Total',
      stackId: 'a',
      fill: '#007aff',
      isAnimationActive: false,
    },
  },];
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
          iconType: 'square',
          width: 150,
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
      }, ...chartBars,],
  };
}

function _getRegressionPredictionMetricsCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let chartData = [
    { xaxis: 'Mean', actual: current_data.actual_mean, predicted: current_data.predicted_mean, },
    { xaxis: 'Median', actual: current_data.actual_median, predicted: current_data.predicted_median, },
    { xaxis: 'Minimum', actual: current_data.actual_minimum, predicted: current_data.predicted_minimum, },
    { xaxis: 'Maximum', actual: current_data.actual_maximum, predicted: current_data.predicted_maximum, },
  ];
  let chartBars = [{
    component: 'recharts.Bar',
    props: {
      dataKey: 'actual',
      name: 'Actual',
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
  },];

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
          domain: ((configuration.unit === 'percentage') ? [ 0, 1, ] : [ 0, 'auto', ]),
          allowDataOverflow: ((configuration.unit === 'percentage') ? true : false),
          tickFormatter: `func:window.chart${capitalize(configuration.unit)}Formatter`,
          label: {
            value: 'Results',
            angle: '-90',
            offset: 0,
            position: 'insideLeft',
          },
        },
      }, {
        component: 'recharts.Tooltip',
        hasWindowFunc: true,
        props: {
          formatter: 'func:window.chartMetricsFormatter',
          itemSorter: 'func:window.tooltipItemSorter',
          itemStyle: {
            margin: 0,
            padding: 0,
          },
        },
      }, ...chartBars,],
  };
}

function _getRegressionDistributionCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let chartData = current_data.distributions_count;
  let chartBars = [{
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
  },];

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
      }, ...chartBars,],
  };
}

function _getRegressionPlotCharts({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let regressionNumPoints = (formdata.navbar && formdata.navbar.regressionPlot) ? formdata.navbar.regressionPlot : '1000';
  let currentChart = current_data[`regression_distribution_${regressionNumPoints}`];
  let abs_min = current_data[ `regression_distribution_${regressionNumPoints}_absmax` ];
  let abs_max = current_data[ `regression_distribution_${regressionNumPoints}_absmin` ];
  let chartC = [{
    actual: abs_min,
    predicted: abs_min,
  }, {
    actual: abs_max,
    predicted: abs_max,
  },];
  let chartScatter = [{
    component: 'recharts.Scatter',
    props: {
      data: currentChart,
      line: false,
      name: `${capitalize((formdata && formdata.navbar && formdata.navbar.data_source_type) ? formdata.navbar.data_source_type : 'testing')} Data Set`,
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
  },];
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
          domain: [abs_min, abs_max,],
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
          domain: [abs_min, abs_max,],
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
      }, ...chartScatter,],
  };
}

function _getKSScoreCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let currentChart = current_data.ks_scores;
  currentChart = currentChart.map((el, idx) => {
    return {
      ks_score: el,
      threshold: (idx / 100),
    };
  });

  let chartScatter = [{
    component: 'recharts.Scatter',
    props: {
      data: currentChart,
      line: true,
      name: `${capitalize((formdata && formdata.navbar && formdata.navbar.data_source_type) ? formdata.navbar.data_source_type : 'testing')} Data Set`,
      fill: '#007aff',
      isAnimationActive: false,
    },
  },];

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
          domain: [0, 1,],
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
          domain: [0, 1,],
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
      }, ...chartScatter,],
  };
}

function _getKSCurveCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let chartData = current_data.cumulative_pct_of_ones.map((cumulative_pct_of_ones, i) => {
    return {
      xaxis: i/100,
      cumulative_pct_of_ones,
      cumulative_pct_of_zeros: current_data.cumulative_pct_of_zeros[i],
    };
  });
  let chartLines = [{
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
  },];
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
      }, ...chartLines,],
  };
}

function _getLorenzCurveCharts({ configuration, data, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let currentChart = current_data.cumulative_pct_of_ones.map((cumulative_pct_of_ones, idx) => ({
    cumulative_pct_of_ones,
    cumulative_pct_of_total: current_data.cumulative_pct_of_total[idx],   
  }));
  currentChart.unshift({
    cumulative_pct_of_ones: 0,
    cumulative_pct_of_total: 0,
  });
  let chartC = [{
    cumulative_pct_of_ones: 0,
    cumulative_pct_of_total: 0,
  }, {
    cumulative_pct_of_ones: 1,
    cumulative_pct_of_total: 1,
  },];
  let chartScatter = [{
    component: 'recharts.Scatter',
    props: {
      data: currentChart,
      line: true,
      name: `${capitalize((formdata && formdata.navbar && formdata.navbar.data_source_type) ? formdata.navbar.data_source_type : 'testing')} Data Set`,
      fill: '#007aff',
      isAnimationActive: false,
    },
  }, {
    component: 'recharts.Scatter',
    props: {
      data: chartC,
      line: true,
      name: ' ',
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
          dataKey: 'cumulative_pct_of_total',
          name: '% of Total Observations',
          label: {
            value: '% of Total Observations',
            angle: '0',
            position: 'bottom',
          },
          type: 'number',
          domain: [0, 1,],
          tickFormatter: 'func:window.chartPercentageFormatter',
        },
      }, {
        component: 'recharts.YAxis',
        hasWindowFunc: true,
        props: {
          dataKey: 'cumulative_pct_of_ones',
          // type: 'number',
          name: '% of Observations with historical_result = 1',
          label: {
            value: '% of Observations with historical_result = 1',
            position: 'insideLeft',
            angle: '-90',
            offset: 0,
          },
          allowDataOverflow: true,
          domain: [0, 1,],
          tickFormatter: 'func:window.chartPercentageFormatter',
          type: 'number',
          // tickCount: 5,
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
      }, ...chartScatter,],
  };
}

function _getConfidenceIntervalCharts({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let regressionNumPoints = (formdata.navbar && formdata.navbar.regressionPlot) ? formdata.navbar.regressionPlot : '1000';
  let confidenceIntervalMap = {
    '75': 1.15035,
    '95': 1.95996,
    '99': 2.57583,
  };
  let confidenceIntervalMultiplier = (formdata.navbar && formdata.navbar.confidenceInterval) ? confidenceIntervalMap[formdata.navbar.confidenceInterval] : confidenceIntervalMap['75'];
  let currentChart = current_data[`regression_distribution_${regressionNumPoints}`];
  let rmse = (modeldata.performance_metrics && modeldata.performance_metrics.RegressionRMSE && confidenceIntervalMultiplier) ? Math.floor(Number(modeldata.performance_metrics.RegressionRMSE) * confidenceIntervalMultiplier): 0;
  let abs_min = current_data[ `regression_distribution_${regressionNumPoints}_absmax` ];
  let abs_max = current_data[ `regression_distribution_${regressionNumPoints}_absmin` ];
  let upper_bound_initial_pt = {
    actual: abs_min + rmse,
    predicted: abs_min,
  };
  let upper_bound_final_pt =  {
    actual: abs_max + rmse,
    predicted: abs_max,
  };
  let lower_bound_initial_pt =  {
    actual: abs_min - rmse,
    predicted: abs_min,
  };

  let lower_bound_final_pt =  {
    actual: abs_max - rmse,
    predicted: abs_max,
  };

  let chartUpperBound = [upper_bound_initial_pt, upper_bound_final_pt,];

  let chartLowerBound = [lower_bound_initial_pt, lower_bound_final_pt,];

  let chartC = [{
    actual: abs_min,
    predicted: abs_min,
  }, {
    actual: abs_max,
    predicted: abs_max,
  },];
  let chartScatter = [{
    component: 'recharts.Scatter',
    props: {
      data: currentChart,
      line: false,
      name: `${capitalize((formdata && formdata.navbar && formdata.navbar.data_source_type) ? formdata.navbar.data_source_type : 'testing')} Data Set`,
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
  },];
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
          domain: [abs_min, abs_max,],
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
          domain: [abs_min, abs_max,],
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
      }, ...chartScatter,],
  };
}

function _getCategoricalAccuracyCharts({ configuration, data, formdata, }) {
  let [ testing, training, ] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let categories = current_data.categories;
  let chartData;
  if (configuration.unit === 'count') {
    chartData = Object.keys(current_data.accuracy_counts).map(key => {
      return current_data.accuracy_counts[key].reduce((reduced, val, idx) => {
        reduced[ categories[idx] ] = val;
        return reduced;
      }, { xaxis: key })
    });
  } else {
    chartData = Object.keys(current_data.accuracy_rates).map(key => {
      return current_data.accuracy_rates[key].reduce((reduced, val, idx) => {
        reduced[ categories[idx] ] = val;
        return reduced;
      }, { xaxis: key })
    });
  }

  let colorsArr = ['#007aff', '#5c198e', '#00b050', '#68d7e3', '#ffa13b', '#ff6f72',];
  let chartBars = Object.keys(current_data.accuracy_counts).reduce((reduced, key, idx) => {
    // let dataKey = key.replace(/ /g, '_');
    return reduced.concat({
      component: 'recharts.Bar',
      props: {
        dataKey: key,
        name: key,
        stackId: 'a',
        fill: colorsArr[idx] || '#007aff',
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
      }, ...chartBars,],
  };
}

module.exports = {
  _getConfidenceIntervalCharts,
  _getDataSourceCharts,
  _getCategoricalAccuracyCharts,
  _getCategoricalObservationCharts,
  _getCategoricalDistributionCharts,
  _getRegressionDataSourceCharts,
  _getRegressionDistributionCharts,
  _getRegressionPredictionMetricsCharts,
  _getRegressionMetricsCharts,
  _getRegressionPlotCharts,
  _getRocCurveCharts,
  _getThresholdPercentCharts,
  _getAccuracyRateCharts,
  _getAdvancedMetricsCharts,
  _getDistributionCharts,
  _getSummaryCharts,
  _getKSScoreCharts,
  _getLorenzCurveCharts,
  _getKSCurveCharts,
};