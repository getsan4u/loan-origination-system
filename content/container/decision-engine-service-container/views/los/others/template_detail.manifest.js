'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const simpleAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.simpleAsyncHeaderTitle;
const losTabs = utilities.views.los.components.losTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/others/templates/:id/:page': {
      layout: {
        component: 'div',
        privileges: [ 101, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Other'),
          simpleAsyncHeaderTitle({
            type: 'template',
            title: true,
          }),
          styles.fullPageDivider,
          {
            component: 'Container',
            children: [ {
              component: 'Columns',
              children: [ {
                component: 'Column',
                asyncprops: {
                  _children: [ 'templatedata', '_children', ]
                },
              },
              ],
            },
            ],
          },
        ]
      },
      resources: {
        templatedata: '/los/api/templates/:id/:page',
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
      callbacks: [],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};