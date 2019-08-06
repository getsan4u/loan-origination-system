'use strict';
const CONSTANTS = require('../../../constants');
const capitalize = require('capitalize');

function _getDataSourceTypeFilter({ configuration, data, formdata }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginBottom: '20px',
      },
      value: (formdata && formdata.navbar && formdata.navbar.data_source_type) ? formdata.navbar.data_source_type : 'testing',
      options: [ {
        text: 'Testing Data',
        value: 'testing',
      }, {
        text: 'Training Data',
        value: 'training',
      }, ],
      onSubmit: null,
      name: 'data_source_type',
      onChange: 'func:window.optimizationDataSourceDropdownOnClick',
    },
  };
}

function _getDistributionChartTypeFilter({ configuration, data, formdata }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginBottom: '20px',
      },
      value: (formdata && formdata.navbar && formdata.navbar.chart_type) ? formdata.navbar.chart_type : 'stacked_bar',
      options: [ {
        text: 'Stacked Bar',
        value: 'stacked_bar',
      }, {
        text: 'Line Chart',
        value: 'line',
      }, ],
      onSubmit: null,
      name: 'chart_type',
      onChange: 'func:window.optimizationDistributionChartTypeOnClick',
    },
  };
}

function _getAccuracyRateChartTypeFilter({ configuration, data, formdata }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginBottom: '20px',
      },
      value: (formdata && formdata.navbar && formdata.navbar.chart_type) ? formdata.navbar.chart_type : 'stacked_area',
      options: [ {
        text: 'Stacked Area Chart',
        value: 'stacked_area',
      }, {
        text: 'Line Chart',
        value: 'line',
      }, ],
      onSubmit: null,
      name: 'chart_type',
      onChange: 'func:window.optimizationDistributionChartTypeOnClick',
    },
  };
}

function _getDistributionGranularityFilter({ configuration, data, formdata }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginBottom: '20px',
      },
      value: (formdata && formdata.navbar && formdata.navbar.granularity) ? formdata.navbar.granularity : 10,
      options: [ {
        text: '10% Intervals',
        value: 10,
      }, {
        text: '5% Intervals',
        value: 5,
      }, {
        text: '1% Intervals',
        value: 1,
      },],
      onSubmit: null,
      name: 'granularity',
      onChange: 'func:window.optimizationDistributionGranularityOnClick',
    },
  };
}

function _getAdvancedMetricsFilter({ configuration, data, formdata }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginBottom: '20px',
      },
      value: (formdata && formdata.navbar && formdata.navbar.metric) ? formdata.navbar.metric : 'true_positive_rate',
      options: [ {
        text: 'True Positive Rate (Recall)',
        value: 'true_positive_rate',
      }, {
        text: 'True Negative Rate (Specificity)',
        value: 'true_negative_rate',
      }, {
        text: 'False Positive Rate (Fallout)',
        value: 'false_positive_rate',
      },  {
        text: 'False Negative Rate',
        value: 'false_negative_rate',
      },],
      onSubmit: null,
      name: 'metric',
      onChange: 'func:window.optimizationAdvanceMetricsOnClick',
    },
  };
}

function _getRegressionPlotFilter({ configuration, data, formdata }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginBottom: '20px',
      },
      value: (formdata && formdata.navbar && formdata.navbar.regressionPlot) ? formdata.navbar.regressionPlot : '1000',
      options: [ {
        text: '1000 Observations',
        value: '1000',
      }, {
        text: '500 Observations',
        value: '500',
      }, {
        text: '100 Observations',
        value: '100',
      },  ],
      onSubmit: null,
      name: 'regressionPlot',
      onChange: 'func:window.optimizationRegressionPlotOnClick',
    },
  };
}

function __getConfidenceIntervalsFilter({ configuration, data, formdata }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginBottom: '20px',
      },
      value: (formdata && formdata.navbar && formdata.navbar.confidenceInterval) ? formdata.navbar.confidenceInterval : '75',
      options: [ {
        text: '75% Confidence Band',
        value: '75',
      }, {
        text: '95% Confidence Band',
        value: '95',
      }, {
        text: '99% Confidence Band',
        value: '99',
      },],
      onSubmit: null,
      name: 'confidenceInterval',
      onChange: 'func:window.optimizationConfidenceIntervalOnClick',
    },
  };
}

// navbar: {
//   confidenceInterval,
//   regressionPlot,
//   metric,
//   granularity,
//   chart_type,
//   data_source_type,
// }
module.exports = {
  __getConfidenceIntervalsFilter,
  _getDataSourceTypeFilter,
  _getDistributionChartTypeFilter,
  _getAccuracyRateChartTypeFilter,
  _getDistributionGranularityFilter,
  _getAdvancedMetricsFilter,
  _getRegressionPlotFilter,
};