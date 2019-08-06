'use strict';

const utilities = require('../../../../utilities');
const styles = utilities.views.constants.styles;

module.exports = {
  'containers': {
    [ '/ocr/processing/batch/:id' ]: {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: ['pagedata', 'layout']
        }
      },
      'resources': {
        [ 'pagedata' ]: '/ocr/api/processing/batch/:id?format=json&type=ocr',
        casedata: '/ocr/api/processing/batch/:id/cases?format=json',
        checkdata: {
          url: '/auth/run_checks',
          settings: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      'callbacks': [ 'func:window.globalBarSaveBtn', 'func:window.setHeaders', ],
      pageData: {
        title: 'DigiFi | OCR Text Recognition',
        navLabel: 'OCR Text Recognition',
      },
      'onFinish': 'render',
    },
  },
};
