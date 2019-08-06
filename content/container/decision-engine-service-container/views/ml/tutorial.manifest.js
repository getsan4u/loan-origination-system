'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/ml/tutorial': {
      layout: {
        component: 'Container',
        props: {
          style: { 
          },
        },
        children: [{
          component: 'p',
          children: 'This tutorial walks you through training and using a predictive model.',
        }, {
          component: 'p',
          children: 'The sample data is a lending example that includes borrower information and whether they defaulted on their loan (False = No, True = Yes). This data can train a model that predicts the probability that a future borrower will default. Download the sample data and follow the steps below to complete the tutorial.',
        }, {
          component: 'div',
          props: {
            style: {
              margin: '1rem 0 1.5rem',
            },
          },
          children: [{
            component: 'hr',
            props: {
              style: {
                border: 'none',
                borderBottom: '1px solid #ccc',
              },
            },
          }, ],
        },
        {
          component: 'p',
          children: [{ component: 'span', children: 'Step 1: Model Training', props: { style: { fontWeight: 800, textDecoration: 'underline', }, }, }, {
            component: 'ol',
            children: [{
              component: 'li', children: 'Download the instructions and sample data and close this window',
            }, {
              component: 'li', children: 'Click the TRAIN NEW MODEL button on the Models tab',
            }, {
              component: 'li', children: 'Name your model "Sample ML Model"',
            }, {
              component: 'li', children: 'Select “Binary Model” as the model type',
            }, {
              component: 'li', children: 'Upload the sample data file when prompted to provide historical data',
            }, {
              component: 'li', children: 'Click to train your model and wait until it finishes',
            },],
          }, ],
        }, {
          component: 'p',
          children: [{ component: 'span', children: 'Step 2: Selecting a Model Option', props: { style: { fontWeight: 800, textDecoration: 'underline', }, }, }, {
            component: 'ol',
            children: [{
              component: 'li', children: 'Navigate to your model’s detail page by clicking the corresponding pencil icon',
            }, {
              component: 'li', children: 'Select the model that is performing best on your data set, as indicated by the Accuracy Rate, Predictive Power and Resiliency',
            }, {
              component: 'li', children: 'Save your selection',
            }, ],
          }, ],
        }, {
          component: 'p',
          children: [{ component: 'span', children: 'Step 3: Decision Making', props: { style: { fontWeight: 800, textDecoration: 'underline', }, }, }, {
            component: 'ol',
            children: [{
              component: 'li', children: 'On the Processing, select your model and provide the following input data: accounts_opened: 6 | bankruptcies: 0 | collections: 3 | credit_history: 187 | credit_inquiries_last_6_months: 3 | judgements: 1 | past_due_accounts: 0 | open_accounts: 4 | card_utilization: 0.8746 | tax_liens: 1 | high_credit_limit: 39500 | annual_income: 55000',
            }, {
              component: 'li', children: 'Click the RUN MODEL button to view the model’s decision (the probability of borrower default)',
            }, ],
          }, ],
        }, {
          component: 'Columns',
          props: {
            className: 'modal-footer-btns',
          },
          children: [{
            component: 'Column',
            props: {
              size: 'isNarrow',
            },
            children: [{
              component: 'ResponsiveButton',
              children: 'DOWNLOAD INSTRUCTIONS',
              props: {
                'onclickBaseUrl': '/ml/api/download_tutorial_data?type=ml_models_tutorial&export_format=rtf',
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-primary',
                  style: {
                  },
                },
              },
            }, ],
          }, {
            component: 'Column',
            props: {
              size: 'isNarrow',
            },
            children: [{
              component: 'ResponsiveButton',
              children: 'DOWNLOAD SAMPLE DATA',
              props: {
                'onclickBaseUrl': '/ml/api/download_tutorial_data?type=sample_data&export_format=csv',
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-success',
                  style: {
                  },
                },
              },
            }, ],
          }, ],
        },
        ],
      },
      'resources': {
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      'onFinish': 'render',
    },
  },
};