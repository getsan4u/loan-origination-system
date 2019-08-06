'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/intermediaries/:id/applications_dashboard': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: [ 'swimlanedata', '_children' ],
        },
      },
      resources: {
        intermediarydata: '/los/api/intermediaries/:id',
        swimlanedata: '/los/api/intermediaries/:id/applications/swimlane?populate=labels',
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
      callbacks: [ 'func:window.updateGlobalSearchBar' ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
    '/los/intermediaries/:id/applications': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: [ 'pagedata', '_children' ],
        },
      },
      resources: {
        pagedata: '/los/api/intermediaries/:id/applications/table?populate=labels',
        applicationdata: '/los/api/intermediaries/:id/applications?populate=labels&paginate=true',
        intermediarydata: '/los/api/intermediaries/:id',
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
      callbacks: [ 'func:window.updateGlobalSearchBar', ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};