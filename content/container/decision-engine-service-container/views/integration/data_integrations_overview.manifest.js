'use strict';

const utilities = require('../../utilities');
const styles = utilities.views.constants.styles;

module.exports = {
  containers: {
    '/integration/dataintegrations/:id/overview': {
      layout: {
        component: 'div',
        privileges: [ 101, ],
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: ['integrationdata', 'overview', ],
        },
      },
      resources: {
        integrationdata: {
          url: '/integrations/get_dataintegrations/:id?page=overview',
          options: {
            onSuccess: ['func:window.hideSecurityCert',],
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
        checkdigifisupport: {
          url: '/auth/checkdigifisupport',
          options: {
            onSuccess: [],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        }
      },
      callbacks: ['func:window.hideDataStatus',],
      onFinish: 'render',
      pageData: {
        title: 'DecisionVision | Technical Setup - Overview & Credentials',
        navLabel: 'Technical Setup',
      },
    },
  },
};
