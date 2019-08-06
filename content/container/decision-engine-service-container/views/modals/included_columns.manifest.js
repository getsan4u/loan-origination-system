'use strict';
const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/modal/included-columns': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          props: {
            style: {
              'marginBottom': 0,
            }
          },
          children: 'This column indicates whether the field will be included in the model training process. DigiFi suggests excluding certain fields for the following reasons:',
        }, {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'Fields with low Correlations should be excluded.',
          }, {
            component: 'li',
            props: {
              style: {
                'listStyleType': 'none',
              }
            },
            children: 'DigiFi automatically suggests excluding fields with less than 0.1% correlation.',
          }, {
            component: 'li',
            children: 'Fields with String data type and too many unique values should be excluded.',
          }, {
            component: 'li',
            props: {
              style: {
                'listStyleType': 'none',
              }
            },
            children: 'DigiFi automatically suggests excluding fields where (# Unique times 100) > (Observations)',
          }],
        }, {
          component: 'p',
          children: 'You can adjust which fields are included and excluded by clicking the buttons.',
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