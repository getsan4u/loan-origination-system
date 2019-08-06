'use strict';
const cardprops = require('../../decision/shared/components/cardProps');
const formElements = require('../../decision/shared/components/formElements');
const randomKey = Math.random;

module.exports = {
  component: 'ResponsiveForm',
  props: {
    flattenFormData: true,
    footergroups: false,
    bindprops: true,
    formgroups: [{
      gridProps: {
        key: randomKey(),
      },
      card: {
        doubleCard: true,
        leftDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        rightDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        leftCardProps: cardprops({
          cardTitle: 'Live Strategies',
          cardStyle: {
            marginBottom: 0,
          },
        }),
        rightCardProps: cardprops({
          cardTitle: 'Recent Changes',
          cardStyle: {
            marginBottom: 0,
          },
        }),
      },    
      formElements: [formElements({
        twoColumns: true,
        doubleCard: true,
        left: [{
          type: 'layout',
          value: {
            component: 'ResponsiveTable',
            bindprops: true,
            thisprops: {
              rows: ['live_strategies', 'rows', ],
              numItems: ['live_strategies', 'numItems', ],
              numPages: ['live_strategies', 'numPages', ],
            },
            props: {
              flattenRowData: true,
              limit: 5,
              dataMap: [{
                'key': 'rows',
                value: 'rows',
              }, {
                'key': 'numItems',
                value: 'numItems',
              }, {
                'key': 'numPages',
                value: 'numPages',
              }, ],
              hasPagination: true,
              simplePagination: true,
              baseUrl: '/decision/dashboard/strategies?format=json',
              'tableSearch': false,
              'simpleSearchFilter': false,
              headers: [{
                label: 'Name',
                sortid: 'display_title',
                headerColumnProps: {
                  style: {
                    width: '30%',
                  },
                },
                sortable: false,
              }, {
                label: 'Version',
                sortid: 'version',
                sortable: false,
              }, {
                label: 'Updated',
                sortid: 'updatedat',
                sortable: false,
                headerColumnProps: {
                  style: {
                    width: '25%',
                  },
                },
              }, {
                label: 'Status',
                sortid: 'status',
                sortable: false,
              }, {
                label: ' ',
                headerColumnProps: {
                  style: {
                    width: '50px',
                  },
                },
                buttons: [{
                  passProps: {
                    buttonProps: {
                      icon: 'fa fa-pencil',
                      className: '__icon_button',
                    },
                    onClick: 'func:this.props.reduxRouter.push',
                    'onclickBaseUrl': '/decision/strategies/:id/overview',
                    'onclickLinkParams': [
                      { key: ':id', val: '_id', },
                    ],
                  },
                }, ],
              }, ],
            },
          },
        },
        ],
        right: [
          {
            type: 'layout',
            value: {
              component: 'ResponsiveTable',
              bindprops: true,
              thisprops: {
                rows: ['recent_changes', 'rows', ],
                numItems: ['recent_changes', 'numItems', ],
                numPages: ['recent_changes', 'numPages', ],
              },
              props: {
                flattenRowData: true,
                limit: 5,
                dataMap: [{
                  'key': 'rows',
                  value: 'rows',
                }, {
                  'key': 'numItems',
                  value: 'numItems',
                }, {
                  'key': 'numPages',
                  value: 'numPages',
                }, ],
                hasPagination: true,
                simplePagination: true,
                baseUrl: '/decision/dashboard/changes?format=json',
                'tableSearch': false,
                'simpleSearchFilter': false,
                headers: [{
                  label: 'Date',
                  sortid: 'updatedat',
                  headerColumnProps: {
                    style: {
                      width: '25%',
                    },
                  },
                  sortable: false,
                }, {
                  label: 'Type',
                  sortid: 'type',
                  sortable: false,
                  
                }, {
                  label: 'Name',
                  sortid: 'name',
                  sortable: false,
                  headerColumnProps: {
                    style: {
                      width: '30%',
                    },
                  },
                }, {
                  label: 'User',
                  sortid: 'changed_by',
                  sortable: false,
                }, {
                  label: ' ',
                  headerColumnProps: {
                    style: {
                      width: '50px',
                    },
                  },
                  buttons: [{
                    passProps: {
                      buttonProps: {
                        icon: 'fa fa-pencil',
                        className: '__icon_button',
                      },
                      onClick: 'func:this.props.reduxRouter.push',
                      'onclickBaseUrl': '/decision/:end_route',
                      'onclickLinkParams': [
                        { key: ':end_route', val: 'end_route', },
                      ],
                    },
                  }, ],
                }, ],
              },
            },
          },
        ],
      }), ],
    }, ],
  },
  asyncprops: {
    live_strategies: ['dashboardstrategydata', ],
    recent_changes: ['dashboardchangedata', ],
  },
};