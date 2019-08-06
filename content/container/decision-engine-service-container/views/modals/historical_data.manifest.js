'use strict';
const styles = require('../../utilities/views/constants/styles');

function _getHistoricalDataContent(modelTypeRequirement, model_type) {
  return {
    component: 'Hero',
    props: {
      style: {
        margin: 0,
      },
    },
    children: [{
      component: 'p',
      children: 'Historical data is required to train your predictive model and it must contain historical observations with predictor variables and historical results.',
    }, {
      component: 'ul',
      children: [{
        component: 'li',
        children: 'Predictor Variables will be used to predict the outcome. We suggest providing a range of variables that you believe may have influenced the result.',
      }, {
        component: 'li',
        children: 'Historical Results are the actual historical outcomes. You must provide one historical result per observation and it must be labeled “historical_result”',
      },],
    }, {
      component: 'p',
      props: {
        style: {
          margin: 0,
          textDecoration: 'underline',
        },
      },
      children: 'File Format Requirements',
    }, {
      component: 'ul',
      children: [{
        component: 'li',
        children: 'CSV, XLS or XLSX file formats are accepted',
      }, {
        component: 'li',
        children: 'The first row must include field names and following rows must contain historical observations',
      }, {
        component: 'li',
        children: modelTypeRequirement,
      },],
    }, {
      component: 'div',
      props: {
        className: 'modal-footer-btns',
      },
      children: [{
        component: 'a',
        children: [{
          component: 'span',
          children: 'User Guide',
        }, {
          component: 'Icon',
          props: {
            icon: 'fa fa-external-link',
          },
        },],
        props: {
          className: '__re-bulma_button __re-bulma_is-primary',
          href: 'https://docs.digifi.io/docs/training-an-ml-model',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }, {
        component: 'ResponsiveButton',
        props: {
          onclickBaseUrl: `/ml/api/download_sample_datasource_data?type=${model_type}`,
          aProps: {
            className: '__re-bulma_button __re-bulma_is-primary purple',
            token: true,
          },
        },
        children: 'Download Sample Data',
      }, {
        component: 'ResponsiveButton',
        children: 'DOWNLOAD TEMPLATE',
        props: {
          'onclickBaseUrl': '/optimization/api/download_data_source_template?format=json&export_format=csv',
          // onClick: 'func:window.hideModal',
          aProps: {
            className: '__re-bulma_button __re-bulma_is-success',
          },
        },
      },],

    },],
  };
}

module.exports = {
  'containers': {
    '/modal/historical-data-binary': {
      layout: _getHistoricalDataContent('You must include a historical result field labeled “historical_result”.  Set this to true for historical observations where the event occurred and to false for observations where the event did not occur', 'binary'),
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/historical-data-regression': {
      layout: _getHistoricalDataContent('You must include a historical result field labeled “historical_result”.  Set this to the actual numeric result that occurred in the observation', 'linear'),
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/historical-data-categorical': {
      layout: _getHistoricalDataContent('You must include a historical result field labeled “historical_result”.  Set this the actual categorical result that occurred in the observation', 'categorical'),
      'resources': {},
      'onFinish': 'render',
    },
  },
};