'use strict';
const styles = require('../../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/modal/overview-calculation-scripts': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'Calculation Scripts assign the results of calculations to Output Variables.',
        }, {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'The calculations must be written in JavaScript as a single line of code that calculates the Output Variable'
          }, {
            component: 'li',
            children: 'You should not include anything except the actual formula (e.g. do not include a “return” statement)'
          }, {
            component: 'li',
            children: 'When referencing other variables in calculations, you must refer to their Variable System Name. All variables used must be added to the Required Variables list.'
          }]
        }, {
          component: 'p',
          children: 'Below please find an example Calculation Script. This will calculate the Total Price Of Dinner (an Output Variable) as Base Price + Taxes + $3.00.',
        }, {
          component: 'div',
          children: [{
            component: 'img',
            props: {
              src: '/images/elements/calc-script-example.png',
              style: {
                display: 'block',
                margin: '0 auto',
                maxWidth: '400px',
                height: 'auto',
                boxShadow: 'rgba(17, 17, 17, 0.14) 1px 1px 4px 2px',
              }
            }
          }]
        }, {
          component: 'div',
          props: {
            className: 'modal-footer-btns',
          },
          children: [{
            component: 'ResponsiveButton',
            children: 'Close',
            props: {
              buttonProps: {
                color: 'isPrimary'
              },
              onClick: 'func:this.props.hideModal',
              onclickProps: 'last',
            }
          }]
        }],
      },
      'resources': {},
      'callbacks': [],
      'onFinish': 'render',
    },
  },
};
