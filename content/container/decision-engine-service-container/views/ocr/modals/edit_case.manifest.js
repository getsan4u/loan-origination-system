'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/ocr/processing/batch/:id/cases/:caseid': {
      layout: {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: [ 'pagedata', 'pageLayout', ],
        },
      },
      'resources': {
        pagedata: '/ocr/api/processing/batch/:id/cases/:caseid',
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
      callbacks: [ 'func:window.setHeaders', ],
      'onFinish': 'render',
    },
  },
};