'use strict';

const moment = require('moment');
const styles = require('../../../../constants').styles;
const capitalize = require('capitalize');
const randomKey = Math.random;
const cardprops = require('../cardProps');
const formElements = require('../formElements');
const CONSTANTS = require('../../../constants');
const commentsModal = require('../../../modals/comment');

const standardHeader = (options) => {
  return [{
      label: 'Population',
      sortid: `${options.name}_conditions`,
      sortable: false,
      formtype: 'select',
      defaultValue: '',
    }, {
      label: options.ruleset,
      sortid: `${options.name}_ruleset`,
      sortable: false,
      formtype: 'select',
      defaultValue: '',
    }, {
      label: ' ',
      headerColumnProps: {
        style: {
          width: '80px',
        }
      },
      columnProps: {
        style: {
          whiteSpace: 'nowrap',
        }
      },
      sortable: false,
      buttons: [
        {
          passProps: {
            buttonProps: {
              icon: 'fa fa-pencil',
              className: '__icon_button'
            },
            onClick: 'func:this.props.reduxRouter.push',
            onclickBaseUrl: `/decision/strategies/:id/segments/${options.name}/:index`,
            onclickLinkParams: [ { 'key': ':id', 'val': 'strategy_id', }, {
              'key': ':index',
              'val': 'index',
            }, ],
          }
        }, {
          passProps: {
            onclickProps: {
              title: 'Delete Rule Set',
            },
            buttonProps: {
              icon: 'fa fa-trash',
              color: 'isDanger',
              className: '__icon_button'
            },
            onClick: 'func:this.props.fetchAction',
            onclickBaseUrl: `/decision/api/standard_strategies/:id/segments/${options.name}/:index?method=delete`,
            onclickLinkParams: [ { 'key': ':id', 'val': 'strategy_id', }, {
              'key': ':index',
              'val': 'index',
            }, ],
            fetchProps: {
              method: 'PUT',
            },
            successProps: {
              success: {
                notification: {
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                  type: 'success',
                },
              },
              successCallback: 'func:this.props.refresh',
            },
            confirmModal: styles.defaultconfirmModalStyle,
          },
        }]
    }, ];
}

const cardSettings = [
  {
    left: {
      cardTitle: 'Minimum Requirements',
      name: 'requirements',
      headers: standardHeader({ name: 'requirements', ruleset: 'Minimum Requirements'  }),
      tableHeaderType: {
        'name': 'readonly',
        'conditions': 'select',
        'ruleset': 'select',
        'view': 'layout',
      },
    },
    right: {
      cardTitle: 'Scorecard',
      name: 'scorecard',
      headers: standardHeader({ name: 'scorecard', ruleset: 'Scorecard' }),
      tableHeaderType: {
        'name': 'readonly',
        'conditions': 'select',
        'ruleset': 'select',
        'view': 'layout',
      },
    },
  }, {
    left: {
      cardTitle: 'Output',
      name: 'output',
      headers: standardHeader({ name: 'output', ruleset: 'Output' }),
      tableHeaderType: {
        'name': 'readonly',
        'conditions': 'select',
        'ruleset': 'select',
        'view': 'layout',
      },
    },
    right: {
      cardTitle: 'Limits',
      name: 'limits',
      headers: standardHeader({ name: 'limits' , ruleset: 'Limits'}),
      tableHeaderType: {
        'name': 'readonly',
        'conditions': 'select',
        'ruleset': 'select',
        'view': 'layout',
      },
    },
  }
];

function generateSections(options) {
  // let { cardTitle, name, headers, tableHeaderType } = options;
  let { left, right } = options;
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
        cardTitle: left.cardTitle,
        cardStyle: {
          marginBottom: 0,
        },
      }),
      rightCardProps: cardprops({
        cardTitle: right.cardTitle,
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
            rows: [ 'formdata', left.name ],
            numItems: [ 'formdata', `${left.name}_numItems` ],
            numPages: [ 'formdata', `${left.name}_numPages` ],
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
            // baseUrl: `/decision/dashboard/strategies?format=json`,
            'tableSearch': false,
            'simpleSearchFilter': false,
            headers: left.headers,
          }
        }
      }],
      right: [ {
        type: 'layout',
        value: {
          component: 'ResponsiveTable',
          bindprops: true,
          thisprops: {
            rows: [ 'formdata', right.name ],
            numItems: [ 'formdata', `${right.name}_numItems` ],
            numPages: [ 'formdata', `${right.name}_numPages` ],
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
            // baseUrl: `/decision/dashboard/strategies?format=json`,
            'tableSearch': false,
            'simpleSearchFilter': false,
            headers: right.headers,
          }
        }
      } ],
    }) ]
  };
}

const RULESET_CONFIGS = {
  'strategy': cardSettings.map(generateSections)
};

module.exports = RULESET_CONFIGS;