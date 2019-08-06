'use strict';
const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/modal/binary-model': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'Binary Models predict the probability that an event will occur based on a set of predictive input data.',
        }, {
          component: 'p',
          props: {
            style: {
              margin: 0,
            },
          },
          children: 'They are used in a wide range of applications, including:',
        }, {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'Estimating the probability that a borrower will default',
          }, {
            component: 'li',
            children: 'Predicting the odds of a transaction being fraudulent',
          }, {
            component: 'li',
            children: 'Determining the likelihood that equipment will fail',
          }, ],
        }, {
          component: 'p',
          children: 'To train a Binary Model, you need historical observations that include predictive information and whether the event occurred or not.',
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
              onclickBaseUrl: '/ml/api/download_sample_datasource_data?type=binary',
              aProps: {
                className: '__re-bulma_button __re-bulma_is-success',
                token: true,
              },
            },
            children: 'Download Sample Data',
          },],

        }, ],
      },
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/linear-model': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'Linear Models predict the most likely numeric value based on a set of predictive input data.',
        }, {
          component: 'p',
          props: {
            style: {
              margin: 0,
            },
          },
          children: 'They are used in a wide range of applications, including:',
        }, {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'Forecasting sales for companies or specific products',
          }, {
            component: 'li',
            children: 'Estimating how long a piece of equipment will last',
          }, {
            component: 'li',
            children: 'Predicting the payment on an insurance claim',
          }, ],
        }, {
          component: 'p',
          children: 'To train a Linear Model, you need historical observations that include predictive information and the numeric value that occurred.',
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
            }, ],
            props: {
              className: '__re-bulma_button __re-bulma_is-primary',
              href: 'https://docs.digifi.io/docs/training-an-ml-model',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          }, {
            component: 'ResponsiveButton',
            props: {
              onclickBaseUrl: '/ml/api/download_sample_datasource_data?type=linear',
              aProps: {
                className: '__re-bulma_button __re-bulma_is-success',
                token: true,
              },
            },
            children: 'Download Sample Data',
          },],

        }, ],
      },
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/categorical-model': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'Categorical Models predict the most likely result among a defined set of categories, based on a set of predictive input data.',
        }, {
          component: 'p',
          props: {
            style: {
              margin: 0,
            },
          },
          children: 'They are used in a wide range of applications, including:',
        }, {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'Predicting which product a customer will purchase',
          }, {
            component: 'li',
            children: 'Estimating the most likely diagnosis for a patient',
          }, {
            component: 'li',
            children: 'Determining whether to email, call or text a borrower',
          },],
        }, {
          component: 'p',
          children: 'To train a Categorical Model, you need historical observations that include predictive information and the actual historical result that occurred.',
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
              onclickBaseUrl: '/ml/api/download_sample_datasource_data?type=categorical',
              aProps: {
                className: '__re-bulma_button __re-bulma_is-success',
                token: true,
              },
            },
            children: 'Download Sample Data',
          },],

        },],
      },
      'resources': {},
      'onFinish': 'render',
    },
  },
};