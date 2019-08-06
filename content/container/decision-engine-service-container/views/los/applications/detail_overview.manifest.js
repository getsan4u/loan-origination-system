'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const simpleAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.simpleAsyncHeaderTitle;
const losTabs = utilities.views.los.components.losTabs;
const applicationsTabs = utilities.views.los.components.applicationsTabs;
const notes = utilities.views.los.components.notes;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/applications/:id': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Applications'),
          {
            component: 'Container',
            children: [{
              component: 'Columns',
              props: {
                style: {
                  marginTop: '10px',
                  marginBottom: '10px'
                }
              },
              children: [{
                component: 'Column',
                children: [{
                  component: 'Title',
                  props: {
                    size: 'is3',
                    style: {
                      fontWeight: 600,
                    },
                  },
                  children: [{
                    component: 'ResponsiveButton',
                    asyncprops: {
                      onclickPropObject: ['applicationdata', 'application'],
                    },
                    props: {
                      onClick: 'func:this.props.createModal',
                      onclickProps: {
                        title: 'Edit Application Detail',
                        pathname: '/los/applications/edit/:id',
                        params: [{
                          key: ':id',
                          val: '_id',
                        }, ],
                      },
                      spanProps: {
                        className: '__ra_rb button_page_title',
                      },
                      style: {
                        marginRight: '10px',
                      }
                    },
                    children: [{
                      component: 'span',
                      asyncprops: {
                        children: ['applicationdata', 'data', 'display_title'],
                      },
                    }, ]
                  }, {
                    component: 'div',
                    props: {
                      style: {
                        display: 'inline',
                      }
                    },
                    asyncprops: {
                      _children: ['applicationdata', 'labelFormatted'],
                    },
                  }]
                }, ]
              }]
            }]
          },
          applicationsTabs(''),
          {
            component: 'Container',
            props: {
            },
            children: [ {
              component: 'Columns',
              children: [ {
                component: 'Column',
                props: {
                  style: {},
                },
                asyncprops: {
                  _children: [ 'applicationdata', '_children', ],
                },
              } ],
            },
            notes,
            ],
          },
        ],
      },
      resources: {
        notedata: '/los/api/applications/:id/notes',
        applicationdata: '/los/api/applications/:id',
        casedata: '/los/api/applications/:id/cases?pagination=true',
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