'use strict';
const styles = require('../../../constants').styles;
const randomKey = Math.random;
const cardprops = require('./cardProps');
const formElements = require('./formElements');
const pluralize = require('pluralize');

function updateHistoryDetailStrategyTable(options) {
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
        cardTitle: `${options.title} (Before Change)`,
        cardStyle: {
          marginBottom: 0,
        },
      }),
      rightCardProps: cardprops({
        cardTitle: `${options.title}  (After Change)`,
        cardStyle: {
          marginBottom: 0,
        },
      }),
    },
    formElements: [formElements({
      twoColumns: true,
      doubleCard: true,
      left: [
        {
          type: 'datatable',
          name: `before_${options.tablename}`,
          useInputRows: false,
          addNewRows: false,
          label: ' ',
          labelProps: {
            style: {
              flex: 1,
            },
          },
          passProps: {
            turnOffTableSort: true,
          },
          layoutProps: {},
          headers: [ {
            label: `Population Rule Set`,
            sortid: 'conditions',
            sortable: false,
          }, {
            label: `Process Rule Set`,
            sortid: 'ruleset',
            sortable: false,
          }, {
            label: '',
            headerColumnProps: {
              style: {
                width: '45px'
              },
            },
            columnProps: {
              style: {
                whiteSpace: 'nowrap',
              }
            },
            buttons: [{
              passProps: {
                buttonProps: {
                  icon: 'fa fa-pencil',
                  className: '__icon_button'
                },
                onClick: 'func:this.props.reduxRouter.push',
                'onclickBaseUrl': `/decision/strategies/:id/segments/:category/:index`,
                'onclickLinkParams': [
                  {key: ':id', val: 'parent_id'}, 
                  {key: ':category', val: 'type'}, 
                  {key: ':index', val: 'index'}, 
                ],
              },
            }]
          }, ]
        }
      ],
      right: [
        {
          type: 'datatable',
          name: `after_${options.tablename}`,
          useInputRows: false,
          addNewRows: false,
          label: ' ',
          labelProps: {
            style: {
              flex: 1,
            },
          },
          passProps: {
            turnOffTableSort: true,
          },
          layoutProps: {},
          headers: [ {
            label: `Population Rule Set`,
            sortid: 'conditions',
            sortable: false,
          }, {
            label: `Process Rule Set`,
            sortid: 'ruleset',
            sortable: false,
          }, {
            label: ' ',
            headerColumnProps: {
              style: {
                width: '45px'
              }
            },
            buttons: [{
              children: 'View',
              passProps: {
                buttonProps: {
                  className: '__icon_button',
                  icon: 'fa fa-pencil'
                },
                onClick: 'func:this.props.reduxRouter.push',
                'onclickBaseUrl': `/decision/strategies/:id/segments/:category/:index`,
                'onclickLinkParams': [
                  {key: ':id', val: 'parent_id'}, 
                  {key: ':category', val: 'type'}, 
                  {key: ':index', val: 'index'}, 
                ],
              },
            }]
          }, ]
        }
      ],
    }), ],
  }
}

module.exports = updateHistoryDetailStrategyTable;