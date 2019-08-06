'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/optimization/machine_learning_tutorial': {
      layout: {
        component: 'Container',
        props: {
          style: {
          },
        },
        children: [ {
          component: 'p',
          children: 'This tutorial walks you through the process of uploading historical data, training a model, evaluating the results and making a decision.'
        }, {
          component: 'p',
          children: 'The sample data source is a lending example that includes borrower information and whether they defaulted on their loan (0 = No, 1 = Yes). This data can train a model that predicts the probability that a future borrower will default. Download the sample data and follow the steps below to complete the tutorial.'
        },
        {
          component: 'p',
          children: [ { component: 'span', children: 'Step 1: Model Training', props: { style: { fontWeight: 800 } } }, {
            component: 'ul',
            children: [ {
              component: 'li', children: 'Click the ADD DATA SOURCE button and upload this data with the name "Sample ML Data Source"'
            }, {
              component: 'li', children: 'Navigate to the Model Training tab and click the TRAIN MODEL button'
            }, {
              component: 'li', children: 'Select "Binary Model", choose the Sample ML Data Source and provide a model name of "Sample ML Model"'
            }, {
              component: 'li', children: 'When the Status reaches 100%, navigate to the Evaluation tab'
            }, ],
          } ],
        }, {
          component: 'p',
          children: [ { component: 'span', children: 'Step 2: Model Evaluation', props: { style: { fontWeight: 800 } } }, {
            component: 'ul',
            children: [ {
              component: 'li', children: 'Select Sample ML Model, click the EVALUATE MODEL button'
            }, {
              component: 'li', children: 'Review the scorecard and graphs to understand performance'
            }, {
              component: 'li', children: 'After you’ve reviewed the model, navigate to the Processing tab'
            }, ],
          } ],
        }, {
          component: 'p',
          children: [ { component: 'span', children: 'Step 3: Decision Making', props: { style: { fontWeight: 800 } } }, {
            component: 'ul',
            children: [ {
              component: 'li', children: 'On the Individual tab, select your model and provide input data (any data will work)'
            }, {
              component: 'li', children: 'Click the RUN MODEL button to view the model’s decision'
            }, ],
          } ],
        }, {
          component: 'p',
          props: {
          },
          children: 'Repeat this process with your own data to build and use a proprietary model.'
        }, {
          component: 'Columns',
          props: {
            className: 'modal-footer-btns'
          },
          children: [ {
            component: 'Column',
            props: {
              size: 'isNarrow',
            },
            children: [ {
              component: 'ResponsiveButton',
              children: 'DOWNLOAD SAMPLE DATA',
              props: {
                'onclickBaseUrl': '/optimization/api/download_tutorial_data?type=sample_data&export_format=csv',
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-success',
                  style: {
                  },
                },
              },
            }, ]
          }, {
            component: 'Column',
            props: {
              size: 'isNarrow',
            },
            children: [ {
              component: 'ResponsiveButton',
              children: 'DOWNLOAD INSTRUCTIONS',
              props: {
                'onclickBaseUrl': '/optimization/api/download_tutorial_data?type=instructions&export_format=rtf',
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-primary',
                  style: {
                  },
                },
              },
            }, ]
          }, ]
        },
        ],
      },
      'resources': {
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      'onFinish': 'render',
    },
  },
};