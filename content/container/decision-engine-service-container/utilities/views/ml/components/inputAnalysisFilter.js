'use strict';
const periodic = require('periodicjs');
const CONSTANTS = require('../../../constants');
const capitalize = require('capitalize');
const PROVIDER_LABEL = require('../../../constants/ml').PROVIDER_LABEL;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];

function _inputVariableFilter({ configuration, data, formdata, query, input_analysis }) {
  if (!input_analysis) return null;
  let input_variables = Object.keys(input_analysis.bindata).map(key => ({ text: key, value: key })).sort((a,b) => a.text.toLowerCase() > b.text.toLowerCase()? 1: -1);
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
      value: (query.input_variable) ? query.input_variable : 'summary',
      options: [ {
        text: 'Summary',
        value: 'summary',
      }, ].concat(input_variables),
      onChange: 'func:window.MLInputVariableDropdownOnClick',
    },
  };
}

function _numBinsFilter({ configuration, data, formdata, query, input_analysis }) {
  if (!query.input_variable || query.input_variable === 'summary') return null;
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
      value: (query.num_bins) ? query.num_bins : '10',
      options: [ {
        text: '5 Bins',
        value: '5',
      }, {
        text: '10 Bins',
        value: '10',
      }, {
        text: '20 Bins',
        value: '20',
      }, ],
      onChange: 'func:window.MLNumBinsDropdownOnClick',
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
  _inputVariableFilter,
  _numBinsFilter,
  _yAxisAutoScalingFilter,
};