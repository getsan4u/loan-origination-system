'use strict';
const styles = require('../../../../constants').styles;
const randomKey = Math.random;
const cardprops = require('../cardProps');
const formElements = require('../formElements');
const pluralize = require('pluralize');

function strategyVersionUpdateHistoryTable(options) {
  let { collection, location } = options;
  let versionOnclickBaseUrl, updateHistoryOnclickBaseUrl;
  let versionOnclickParams, updateHistoryOnclickParams;
  versionOnclickBaseUrl = `/decision/${collection}/:id/${location}`;
  updateHistoryOnclickBaseUrl = `/decision/${collection}/:endroute`;
  versionOnclickParams = [ { 'key': ':id', 'val': '_id', }, ];
  updateHistoryOnclickParams = [
    { key: ':endroute', val: 'endroute' },
  ];

  return {
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
        cardTitle: `Versions`,
        cardStyle: {
          marginBottom: 0,
        },
      }),
      rightCardProps: cardprops({
        cardTitle: `Update History`,
        cardStyle: {
          marginBottom: 0,
        },
      }),
    },
    formElements: [ formElements({
      twoColumns: true,
      doubleCard: true,
      left: [ {
        type: 'layout',
        value: {
          component: 'ResponsiveTable',
          bindprops: true,
          thisprops: {
            rows: [ 'versions', 'rows', ],
            numItems: [ 'versions', 'numItems' ],
            numPages: [ 'versions', 'numPages' ],
          },
          props: {
            flattenRowData: true,
            limit: 5,
            dataMap: [ {
              'key': 'rows',
              value: 'rows',
            }, {
              'key': 'numItems',
              value: 'numItems',
            }, {
              'key': 'numPages',
              value: 'numPages',
            }],
            hasPagination: true,
            simplePagination: true,
            // baseUrl: `/decision/api/standard_${options.collection}/:id`,
            'tableSearch': false,
            'simpleSearchFilter': false,
            headers: [ {
              label: 'Version',
              sortid: 'version',
              headerColumnProps: {
                style: {
                  width: '15%',
                }
              },
            }, {
              label: 'Updated Date',
              momentFormat: styles.momentFormat.birthdays,
              sortid: 'updatedat',
              sortable: false,
            }, {
              label: 'Updated By',
              sortid: 'user',
              sortable: false,
            }, {
              label: 'Status',
              sortid: 'status',
              sortable: false,
            }, {
              label: ' ',
              headerColumnProps: {
                style: {
                  width: '40px',
                }
              },
              columnProps: {
                style: {
                  whiteSpace: 'nowrap',
                }
              },
              buttons: [ {
                passProps: {
                  buttonProps: {
                    icon: 'fa fa-pencil',
                    className: '__icon_button'
                  },
                  onClick: 'func:this.props.reduxRouter.push',
                  onclickBaseUrl: versionOnclickBaseUrl,
                  onclickLinkParams: versionOnclickParams
                },
              },
              ],
            }, ],
          }
        }
      }
      ],
      right: [
        {
          type: 'layout',
          value: {
            component: 'ResponsiveTable',
            bindprops: true,
            thisprops: {
              rows: [ 'changelogs', 'rows', ],
              numItems: [ 'changelogs', 'numItems' ],
              numPages: [ 'changelogs', 'numPages' ],
            },
            props: {
              flattenRowData: true,
              limit: 5,
              dataMap: [ {
                'key': 'rows',
                value: 'rows',
              }, {
                'key': 'numItems',
                value: 'numItems',
              }, {
                'key': 'numPages',
                value: 'numPages',
              }],
              hasPagination: true,
              simplePagination: true,
              // baseUrl: `/decision/api/standard_${options.collection}/:id`,
              'tableSearch': false,
              'simpleSearchFilter': false,
              headers: [ {
                label: 'Date',
                sortid: 'updatedat',
                momentFormat: styles.momentFormat.birthdays,
                sortable: false,
              }, {
                label: 'User',
                sortid: 'user',
                sortable: false,
              }, {
                label: 'Update Type',
                sortid: 'change_type',
                sortable: false,
              }, {
                label: ' ',
                headerColumnProps: {
                  style: {
                    width: '40px'
                  },
                },
                columnProps: {
                  style: {
                    whiteSpace: 'nowrap',
                  }
                },
                buttons: [ {
                  passProps: {
                    buttonProps: {
                      icon: 'fa fa-pencil',
                      className: '__icon_button'
                    },
                    onClick: 'func:this.props.reduxRouter.push',
                    'onclickBaseUrl': updateHistoryOnclickBaseUrl,
                    'onclickLinkParams': updateHistoryOnclickParams,
                  },
                }]
              }, ]
            }
          }
        }
      ],
    }), ],
  }
}

const VERSION_CONFIGS = {
  'variable':  [],
  rule: [],
  strategy: [strategyVersionUpdateHistoryTable({ collection: 'strategies', location: 'overview' })]
};

module.exports = VERSION_CONFIGS;