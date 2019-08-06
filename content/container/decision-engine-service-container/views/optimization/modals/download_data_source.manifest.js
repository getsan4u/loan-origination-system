'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/optimization/download_data_source/:id': {
      layout: {
        privileges: [101, 102,],
        component: 'Container',
        props: {
          style: {
          },
        },
        children: [ {
          component: 'span',
          props: {
          },
          children: 'Please select an option.'
        }, {
          component: 'Columns',
          props: {
            className: 'modal-footer-btns'
          },
          children: [ {
            component: 'Column',
            props: {
              size: 'isNarrow',
            },
            children: [ {
              component: 'ResponsiveButton',
              children: 'ALL DATA',
              asyncprops: {
                onclickPropObject: [ 'pagedata', 'data', 'params' ]
              },
              props: {
                'onclickBaseUrl': `/optimization/api/download_datasource/:id?export_format=csv&scope=both`,
                onclickLinkParams: [ { 'key': ':id', 'val': '0', }, ],
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-primary',
                  style: {
                  },
                },
              },
            }, ]
          }, {
            component: 'Column',
            props: {
              size: 'isNarrow',
            },
            children: [ {
              component: 'ResponsiveButton',
              children: 'TESTING DATA',
              asyncprops: {
                onclickPropObject: [ 'pagedata', 'data', 'params' ]
              },
              props: {
                'onclickBaseUrl': `/optimization/api/download_datasource/:id?export_format=csv&scope=testing`,
                onclickLinkParams: [ { 'key': ':id', 'val': '0', }, ],
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-success',
                  style: {
                  },
                },
              },
            }, ]
          }, {
            component: 'Column',
            props: {
              size: 'isNarrow',
            },
            children: [ {
              component: 'ResponsiveButton',
              children: 'TRAINING DATA',
              asyncprops: {
                onclickPropObject: [ 'pagedata', 'data', 'params' ]
              },
              props: {
                'onclickBaseUrl': `/optimization/api/download_datasource/:id?export_format=csv&scope=training`,
                onclickLinkParams: [ { 'key': ':id', 'val': '0', }, ],
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-primary purple',
                  style: {
                  },
                },
              },
            }, ]
          }, ]
        },
        ],
      },
      'resources': {
        [ `pagedata` ]: `/optimization/api/pagedata/:id?format=json`,
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
      'onFinish': 'render',
    },
  },
};