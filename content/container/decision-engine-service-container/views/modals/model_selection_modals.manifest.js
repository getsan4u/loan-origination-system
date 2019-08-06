'use strict';
const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/modal/model-accuracy-rate': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'Accuracy Rate ranges from 0% to 100% and represents the percentage of decisions that your model makes correctly when run on testing data. Higher values indicate more accurate models.',
        }, {
          component: 'p',
          props: {
            style: {
              margin: 0,
            },
          },
          children: 'Tips for improving Accuracy Rate:',
        }, {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'Provide additional historical observations when training your model',
          }, {
            component: 'li',
            children: 'Identify more predictor variables that might influence the historical result and include those in your training data',
          }, ],
        }, {
          component: 'p',
          props: {
            style: {
              fontStyle: 'italic',
            },
          },
          children: 'Note: For Binary Models, this represents the maximum Accuracy Rate across potential threshold values. Please refer to the Comparison Charts section for additional detail.',
        }, {
          component: 'div',
          props: {
            className: 'modal-footer-btns',
          },
          children: [{
            component: 'ResponsiveButton',
            props: {
              buttonProps: {
                color: 'isPrimary',
              },
              onClick: 'func:this.props.hideModal',
              onclickProps: 'last',
            },
            children: 'Close Window',
          }, ],
        }, ],
      },
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/model-predictive-power': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'Predictive Power ranges from 0% to 100% and represents the strength of your model when run on testing data. Higher values indicate stronger models.',
        }, {
          component: 'p',
          props: {
            style: {
              margin: 0,
            },
          },
          children: 'Tips for improving Predictive Power:',
        }, {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'Provide additional historical observations when training your model',
          }, {
            component: 'li',
            children: 'Identify more predictor variables that might influence the historical result and include those in your training data',
          }, ],
        }, {
          component: 'div',
          props: {
            className: 'modal-footer-btns',
          },
          children: [{
            component: 'ResponsiveButton',
            props: {
              buttonProps: {
                color: 'isPrimary',
              },
              onClick: 'func:this.props.hideModal',
              onclickProps: 'last',
            },
            children: 'Close Window',
          }, ],
        }, ],
      },
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/model-resiliency': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'Resiliency ranges from 0% to 100% and represents the difference in model performance when run on training and testing data. Higher values indicate more resilient models, with less risk of performing poorly on future decisions.',
        }, {
          component: 'p',
          props: {
            style: {
              margin: 0,
            },
          },
          children: 'Tips for improving Resiliency:',
        }, {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'Provide additional historical observations when training your model',
          }, {
            component: 'li',
            children: 'Provide fewer predictor variables (i.e. too many predictor variables can lead to weak resiliency)',
          }, ],
        }, {
          component: 'div',
          props: {
            className: 'modal-footer-btns',
          },
          children: [{
            component: 'ResponsiveButton',
            props: {
              buttonProps: {
                color: 'isPrimary',
              },
              onClick: 'func:this.props.hideModal',
              onclickProps: 'last',
            },
            children: 'Close Window',
          }, ],
        }, ],
      },
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/model-predictive-power': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'Predictive Power ranges from 0% to 100% and represents the strength of your model when run on testing data. Higher values indicate stronger models.',
        }, {
          component: 'p',
          props: {
            style: {
              margin: 0,
            },
          },
          children: 'Tips for improving Predictive Power:',
        }, {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'Provide additional historical observations when training your model',
          }, {
            component: 'li',
            children: 'Identify more predictor variables that might influence the historical result and include those in your training data',
          }, ],
        }, {
          component: 'div',
          props: {
            className: 'modal-footer-btns',
          },
          children: [{
            component: 'ResponsiveButton',
            props: {
              buttonProps: {
                color: 'isPrimary',
              },
              onClick: 'func:this.props.hideModal',
              onclickProps: 'last',
            },
            children: 'Close Window',
          }, ],
        }, ],
      },
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/model-decision-speed': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: '"Decision Speed" is an estimate of how long each decision will take to process. While all of our models process very quickly, certain algorithms execute faster than others and you may want to consider this when selecting an option.',
        }, {
          component: 'div',
          props: {
            className: 'modal-footer-btns',
          },
          children: [{
            component: 'ResponsiveButton',
            props: {
              buttonProps: {
                color: 'isPrimary',
              },
              onClick: 'func:this.props.hideModal',
              onclickProps: 'last',
            },
            children: 'Close Window',
          }, ],
        }, ],
      },
      'resources': {},
      'onFinish': 'render',
    },
  },
};