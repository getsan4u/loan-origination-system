'use strict';
const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/modal/model-data-type': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'Data types identify the type of data that each field contains and are used to ensure consistency between model training and model execution.',
        }, {
          component: 'p',
          props: {
            style: {
              margin: 0,
            },
          },
          children: 'Data types are automatically assigned and include the following options:',
        }, {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'Number means the column contains only numeric values',
          }, {
            component: 'li',
            children: 'String means the column contains any combination of characters, including letters, numbers and special characters',
          }, {
            component: 'li',
            children: 'Boolean means that the column contains only TRUE or FALSE values',
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
    '/modal/model-correlation': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'Correlations range between 0% and 100% and indicate the strength of the relationship between each predictor variable and the historical result. High correlations signal that the predictor variable greatly influences the result, and vice-versa.',
        }, {
          component: 'p',
          children: 'The correlations that are displayed are calculated after DigiFi’s automatic data transformations.',
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
    '/modal/model-importance': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'The “Importance” column indicates how important each predictor variable is within the model you’re training. It is an approximate measure that can be either Very Low, Low, Medium, High or Very High.',
        }, {
          component: 'p',
          children: 'Importance is relative to each specific model. The most important categories are always classified as Very High, the least important categories are always classified as Very Low, and others in the middle.',
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
    '/modal/model-categorical': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'The “Categorical” column indicates whether each data field contains a discrete number of categories.  It should be checked for every field that contains specific categories.',
        }, {
          component: 'p',
          children: 'If the Data Type is String or Boolean, the “Categorical” column will be checked by default and cannot be edited.',
        }, {
          component: 'p',
          children: 'If the Data Type is Number, DigiFi analyzes the data to estimate whether the field represents specific categories. You then have the option to adjust this by checking the box.',
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