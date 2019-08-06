'use strict';

const cardprops = require('../../utilities/views/shared/props/cardprops');
const styles = require('../../utilities/views/constants/styles');
const references = require('../../utilities/views/constants/references');
const periodic = require('periodicjs');
const reactappLocals = periodic.locals.extensions.get('periodicjs.ext.reactapp');
const reactapp = reactappLocals.reactapp();
const plainHeaderTitle = require('../../utilities/views/shared/component/layoutComponents').plainHeaderTitle;
const plainGlobalButtonBar = require('../../utilities/views/shared/component/globalButtonBar').plainGlobalButtonBar;
let randomKey = Math.random;
const utilities = require('../../utilities');
const account_management_tabs = utilities.views.settings.components.account_management_tabs;

module.exports = {
  containers: {
    '/los': {
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
        swimlanedata: '/los/api/applications/swimlane',
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
      callbacks: [],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};