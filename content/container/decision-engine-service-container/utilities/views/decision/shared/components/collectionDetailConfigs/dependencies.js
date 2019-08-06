'use strict';
const moment = require('moment');
const styles = require('../../../../constants').styles;
const capitalize = require('capitalize');
const randomKey = Math.random;
const cardprops = require('../cardProps');
const formElements = require('../formElements');
const CONSTANTS = require('../../../constants');
const ACTIVE_TABS = CONSTANTS.ACTIVE_TABS;
const findTabs = require('../findTabs');

const variable = [
  {
    card: {
      props: cardprops({
        cardTitle: 'Variable Dependencies (Rules)',
        cardStyle: {
          marginBottom: 0,
        }
      }),
    },
    formElements: [ {
      type: 'layout',
      value: findTabs({
        tabnames: [ 'input', 'output' ], outerTabs: ACTIVE_TABS({}), baseURL: `decision/variables/:id/dependencies`
      }).outerTabs,
    },
    {
      type: 'datatable',
      name: 'rules',
      flattenRowData: true,
      useInputRows: false,
      addNewRows: false,
      ignoreTableHeaders: [ '_id', ],
      headers: [
        {
          label: 'Rule Name',
          sortid: 'name',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '30%'
            },
          },
        }, {
          label: 'Version Number',
          sortid: 'version',
          sortable: false,
        }, {
          label: 'Create Date',
          momentFormat: styles.momentFormat.birthdays,
          sortid: 'createdat',
          sortable: false,
        }, {
          label: 'Updated Date',
          momentFormat: styles.momentFormat.birthdays,
          sortid: 'updatedat',
          sortable: false,
        }, {
          label: 'Description',
          sortid: 'description',
          sortable: false,
          headerColumnProps: {
          style: {
            width: '20%'
          },
        },
        }, {
          label: ' ',
          headerColumnProps: {
            style: {
              width: '45px',
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
              onclickBaseUrl: '/decision/rules/:id/overview',
              onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
            },
          },
          ],
        }, ],
    }]
  },
];

const rule = {
  gridProps: {
    key: randomKey(),
  },
  card: {
    props: cardprops({
      cardTitle: 'Dependencies',
      cardStyle: {
        marginBottom: 0,
      }
    }),
  },
  formElements: [{
    type: 'layout',
    value: {
      component: 'ResponsiveTable',
      bindprops: true,
      thisprops: {
        rows: [ 'formdata', 'rulesets', ],
        numItems: [ 'formdata', 'numItems' ],
        numPages: [ 'formdata', 'numPages' ],
      },
      props: {
        flattenRowData: true,
        limit: 5,
        numItems: 5,
        numPages: 1,
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
        headers: [
          {
            label: 'Rule Set Name',
            sortid: 'name',
            sortable: false,
            headerColumnProps: {
              style: {
                width: '30%'
              },
            },
          },
          {
            label: 'Version',
            sortid: 'version',
            sortable: false,
          }, {
            label: 'Type',
            sortid: 'type',
            sortable: false,
          }, {
            label: 'Status',
            sortid: 'status',
            sortable: false,
          }, {
            label: 'Updated Date',
            momentFormat: styles.momentFormat.birthdays,
            sortid: 'updatedat',
            sortable: false,
          }, {
            label: 'Description',
            sortid: 'description',
            sortable: false,
            headerColumnProps: {
              style: {
                width: '20%'
              },
            },
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
                onclickBaseUrl: '/decision/rulesets/:id/detail',
                onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
              },
            },
            ],
          }, ],
      }
    }
  }
  ]
}

const DEPENDENCY_CONFIGS = {
  variable,
  rule,
  'strategy': [],
};

module.exports = DEPENDENCY_CONFIGS;