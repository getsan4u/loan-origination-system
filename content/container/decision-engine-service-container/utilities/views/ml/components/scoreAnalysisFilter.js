'use strict';
const periodic = require('periodicjs');
const CONSTANTS = require('../../../constants');
const capitalize = require('capitalize');
const PROVIDER_LABEL = require('../../../constants/ml').PROVIDER_LABEL;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];

function _getDataSourceTypeFilter({ configuration, query }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginRight: '5px',
        marginBottom: '5px',
      },
      value: (query.batch_type) ? query.batch_type : 'testing',
      options: [ {
        text: 'Testing Data',
        value: 'testing',
      }, {
        text: 'Training Data',
        value: 'training',
      }, ],
      onChange: 'func:window.MLBatchTypeDropdownOnClick',
    },
  };
}

function _getProviderFilter({ configuration, data, modeldata, formdata, params, query, }) {
  // let providers = [ 'aws', 'sagemaker_ll', 'sagemaker_xgb'];
  let aws_models = modeldata.aws_models || [];
  let digifi_models = modeldata.digifi_models || [];
  aws_models = aws_models.filter(model_name => model_name !== modeldata.selected_provider);
  digifi_models = digifi_models.filter(model_name => model_name !== modeldata.selected_provider);
  const all_training_models = [ modeldata.selected_provider, ...aws_models, ...digifi_models, ].length ? [ modeldata.selected_provider, ...aws_models, ...digifi_models, ] : [ 'aws', 'sagemaker_ll', 'sagemaker_xgb', ];
  // const providers = all_training_models.filter(model_name => modeldata[ model_name ] && (modeldata[ model_name ].status === 'complete' || modeldata[ model_name ].status === 'completed'));
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginRight: '5px',
        marginBottom: '5px',
      },
      value: (query.provider) ? query.provider : all_training_models[0],
      options: all_training_models.map(provider => ({
        text: PROVIDER_LABEL[provider],
        value: provider,  
      })),
      onChange: 'func:window.MLProviderTypeOnDropdownClick',
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
        marginRight: '5px',
        marginBottom: '5px',
      },
      value: (formdata && formdata.navbar && formdata.navbar.chart_type) ? formdata.navbar.chart_type : 'stacked_bar',
      options: [ {
        text: 'Stacked Bar',
        value: 'stacked_bar',
      }, {
        text: 'Line Chart',
        value: 'line',
      }, ],
      onChange: 'func:window.optimizationDistributionChartTypeOnClick',
    },
  };
}

function _getAccuracyRateChartTypeFilter({ configuration, query }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginRight: '5px',
        marginBottom: '5px',
      },
      value: (query.chart_type) ? query.chart_type : 'bar',
      options: [ {
        text: 'Summary',
        value: 'bar',
      }, {
        text: 'Detail',
        value: 'line',
      }, ],
      onChange: 'func:window.MLAccuracyRateChartTypeFilterOnClick',
    },
  };
}

function _getDistributionGranularityFilter({ configuration, data, formdata, query }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginRight: '5px',
        marginBottom: '5px',
      },
      value: (query.granularity) ? Number(query.granularity) : 50,
      options: [ {
        text: '50 Point Intervals',
        value: 50,
      }, {
        text: '20 Point Intervals',
        value: 20,
      }, {
        text: '10 Point Intervals',
        value: 10,
      },],
      onChange: 'func:window.MLDistributionGranularityOnDropdownClick',
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
        marginRight: '5px',
        marginBottom: '5px',
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

function _getRegressionPlotFilter({ configuration, data, formdata, query }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginRight: '5px',
        marginBottom: '5px',
      },
      value: (query.regressionplot)? query.regressionplot : '1000',
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
      onChange: 'func:window.MLRegressionPlotDropdownOnClick',
    },
  };
}

function _getConfidenceIntervalsFilter({ configuration, data, formdata, query }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginRight: '5px',
        marginBottom: '5px',
      },
      value: (query.confidenceinterval) ? query.confidenceinterval : '75',
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
      onChange: 'func:window.MLConfidenceIntervalDropdownOnClick',
    },
  };
}

function _getMinimumScoreFilter({ configuration, data, formdata, query }) {
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginRight: '5px',
        marginBottom: '5px',
      },
      value: (query.minimum_score) ? Number(query.minimum_score) : 300,
      options: [ {
        text: 'Show 800 Minimum',
        value: 800,
      }, {
        text: 'Show 700 Minimum',
        value: 700,
      }, {
        text: 'Show 600 Minimum',
        value: 600,
      }, {
        text: 'Show 500 Minimum',
        value: 500,
      }, {
        text: 'Show 400 Minimum',
        value: 400,
      }, {
        text: 'Show 300 Minimum',
        value: 300,
      },],
      onChange: 'func:window.MLMinimumScoreOnDropdownClick',
    },
  };
}

function _yAxisAutoScalingFilter({ configuration, data, formdata, query, input_analysis }) {
  // if (!query.input_variable || query.input_variable === 'summary') return null;
  return {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginRight: '5px',
        marginBottom: '5px',
      },
      value: (query.yaxis_scale) ? query.yaxis_scale : '1',
      options: [ {
        text: 'Show Max 5%',
        value: '0.05',
      }, {
        text: 'Show Max 10%',
        value: '0.1',
      }, {
        text: 'Show Max 25%',
        value: '0.25',
      }, {
        text: 'Show Max 50%',
        value: '0.5',
      }, {
        text: 'Show Max 100%',
        value: '1',
      },],
      onChange: 'func:window.MLYaxisScaleDropdownOnClick',
    },
  };
}

module.exports = {
  _getConfidenceIntervalsFilter,
  _getDataSourceTypeFilter,
  _getProviderFilter,
  _getDistributionChartTypeFilter,
  _getAccuracyRateChartTypeFilter,
  _getDistributionGranularityFilter,
  _getAdvancedMetricsFilter,
  _getRegressionPlotFilter,
  _getMinimumScoreFilter,
  _yAxisAutoScalingFilter,
};