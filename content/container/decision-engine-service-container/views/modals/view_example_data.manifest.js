'use strict';
const styles = require('../../utilities/views/constants/styles');

function _viewExampleDataContent(model_type) {
  return {
    component: 'Hero',
    props: {
      style: {
        margin: 0,
      },
    },
    children: [{
      component: 'p',
      children: 'Please select an option.',
    }, {
      component: 'div',
      props: {
        className: 'modal-footer-btns',
      },
      children: [{
        component: 'ResponsiveButton',
        props: {
          onclickBaseUrl: `/ml/api/download_sample_datasource_data?type=${model_type}`,
          aProps: {
            className: '__re-bulma_button __re-bulma_is-primary',
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
    '/modal/view-example-data-binary': {
      layout: _viewExampleDataContent('binary'),
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/view-example-data-regression': {
      layout: _viewExampleDataContent('linear'),
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/view-example-data-categorical': {
      layout: _viewExampleDataContent('categorical'),
      'resources': {},
      'onFinish': 'render',
    },
  },
};