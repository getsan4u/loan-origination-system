'use strict';

const utilities = require('../../../../utilities');
const styles = utilities.views.constants.styles;

module.exports = {
  containers: {
    '/ocr/templates/:id/:page': {
      layout: {
        component: 'div',
        privileges: [ 101, 102],
        asyncprops: {
          _children: ['templatedata', '_children']
        },
        props: {
          style: styles.pageContainer,
        },
      },
      resources: {
        templatedata: {
          url: '/ocr/api/templates/:id/:page?',
          options: {
            // onSuccess: ['func:window.hideSecurityCert',],
          },
        },
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: [ 'func:window.setHeaders',],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | OCR Text Recognition',
        navLabel: 'OCR Text Recognition',
      },
    },
  },
};