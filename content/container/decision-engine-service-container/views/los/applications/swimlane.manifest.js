'use strict';

const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;

module.exports = {
  containers: {
    '/los/applicationsdashboard': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: ['swimlanedata', '_children'],
        },
      },
      resources: {
        swimlanedata: '/los/api/applications/swimlane?populate=labels',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: ['func:window.updateGlobalSearchBar'],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};