'use strict';
const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/modal/column-unique-counts': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: 'This column indicates the number of unique values in each field.',
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