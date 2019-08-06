'use strict';
// const pluralize = require('pluralize');
// const capitalize = require('capitalize');
const sharedComponents = require('./sharedComponents');
// const getCalculationDatalist = sharedComponents.getCalculationDatalist;
// const getDatalist = sharedComponents.getDatalist;  
const getCardFormgroup = sharedComponents.getCardFormgroup;  
const tableheaders = require('../component/tableHeaders');

function getSegmentRuleset(options) {
  return getCardFormgroup({
    title: options.title,
    displayCard: false,
    elements: [
      (options.newEntity)
        ? {
          type: 'layout',
          value: {
            component:'span',
          },
        }
        : {
          type:'layout',
          value: {
            component: 'div',
            props: {
              style: {
                display:'flex',
              },
            },
            children: [
              sharedComponents.getDownloadButton({
                entity:'segments',
                prop:'ruleset.rules',
                format:'csv',
                label:'Export CSV',
              }),
              sharedComponents.getDownloadButton({
                entity:'segments',
                prop:'ruleset.rules',
                format:'json',
                label: 'Export JSON',
                style: { marginLeft: '10px', },
              }),
            ],
          },
        },
      {
        type: 'text',
        name: 'ruleset.name',
        label: 'Rule Set Name',
      },
      {
        type: 'text',
        name: 'ruleset.title',
        label: 'Rule Set Title',
      },
      {
        'type': 'datatable',
        'addNewRows': true,
        'rowButtons': true,
        'selectEntireRow': false,
        flattenRowData: options.flattenRowData || false,
        headers: options.headers,
        label: 'Ruleset',
        'name': 'ruleset.rules',
        passProps: Object.assign({}, {
          replaceButton: true,
          uploadAddButton: false,
        }, options.passProps),
      },
    ],
  });
}

module.exports = {
  creditengine: function (/*schema, label, options, newEntity*/) {
    return [
      getCardFormgroup({
        title: 'Product Mapping',
        elements: [
          {
            'type': 'datatable',
            layoutProps: {},
            'addNewRows': true,
            'rowButtons': true,
            'selectEntireRow': false,
            'flattenRowData': false,
            // 'useInputRows': true,
            headers: tableheaders.external_products,
            label:'External Products',
            'name': 'external_products',
            passProps: {
              replaceButton: true,
              uploadAddButton: false,
            },
          },
        ],
      }),
    ];
  },
  parser: function (/*schema, label, options, newEntity*/) {
    return [
      getCardFormgroup({
        title: 'Parsed Variables',
        elements: [
          {
            type:'layout',
            value: {
              component: 'div',
              props: {
                style: {
                  display:'flex',
                },
              },
              children: [
                sharedComponents.getDownloadButton({
                  entity:'parsers',
                  prop:'variables',
                  format:'csv',
                  label:'Export CSV',
                }),
                sharedComponents.getDownloadButton({
                  entity:'parsers',
                  prop:'variables',
                  format:'json',
                  label: 'Export JSON',
                  style: { marginLeft: '10px', },
                }),
              ],
            },
          },
          {
            'type': 'datatable',
            layoutProps: {},
            'addNewRows': true,
            'rowButtons': true,
            'selectEntireRow': false,
            'flattenRowData': false,
            headers: tableheaders.credit_parser,
            useInputRows:false,
            // 'selectOptionSortId':'favorite',
            // 'tableHeaderType':{
            //   'food':'select',
            //   'recipe':'textarea',
            // },
            // 'ignoreTableHeaders':['favorite',],
            label:'Variables',
            'name': 'variables',
            passProps: {
              replaceButton: true,
              uploadAddButton: false,
            },
          },
        ],
      }),
    ];
  },
  resource: function (/*schema, label, options, newEntity*/) {
    return [
      getCardFormgroup({
        title: 'Resource Variables',
        elements: [
          {
            type:'layout',
            value: {
              component: 'div',
              props: {
                style: {
                  display:'flex',
                },
              },
              children: [
                sharedComponents.getDownloadButton({
                  entity:'resources',
                  prop:'conditions',
                  format:'csv',
                  label:'Export CSV',
                }),
                sharedComponents.getDownloadButton({
                  entity:'resources',
                  prop:'conditions',
                  format:'json',
                  label: 'Export JSON',
                  style: { marginLeft: '10px', },
                }),
              ],
            },
          },
          {
            type: 'code',
            name: 'source_configuration',
            label: 'Source Configuration',
            stringify: true,
          },
          {
            'type': 'datatable',
            layoutProps: {},
            'addNewRows': true,
            'rowButtons': true,
            'selectEntireRow': false,
            'flattenRowData': false,
            headers: tableheaders.credit_parser,
            label:'Variables',
            'name': 'variables',
            passProps: {
              replaceButton: true,
              uploadAddButton: false,
            },
          },
        ],
      }),
    ];
  },
  calculation: function (/*schema, label, options, newEntity*/) {
    return [
      getCardFormgroup({
        title: 'Calculated Variables',
        elements: [
          {
            type:'layout',
            value: {
              component: 'div',
              props: {
                style: {
                  display:'flex',
                },
              },
              children: [
                sharedComponents.getDownloadButton({
                  entity:'calculations',
                  prop:'variables',
                  format:'csv',
                  label:'Export CSV',
                }),
                sharedComponents.getDownloadButton({
                  entity:'calculations',
                  prop:'variables',
                  format:'json',
                  label: 'Export JSON',
                  style: { marginLeft: '10px', },
                }),
              ],
            },
          },
          {
            'type': 'datatable',
            layoutProps: {},
            'addNewRows': true,
            'rowButtons': true,
            'selectEntireRow': false,
            'flattenRowData': false,
            useInputRows:true,
            headers: tableheaders.scorecard_calculations,
            label:'Variables',
            'name': 'variables',
            passProps: {
              replaceButton: true,
              uploadAddButton: false,
            },
          },
        ],
      }),
    ];
  },
  segment: function (schema, label, options, newEntity) {
    return [
      getCardFormgroup({
        title: 'Segment Conditions',
        elements: [
          (newEntity)
            ? {
              type: 'layout',
              value: {
                component:'span',
              },
            }
            : {
              type:'layout',
              value: {
                component: 'div',
                props: {
                  style: {
                    display:'flex',
                  },
                },
                children: [
                  sharedComponents.getDownloadButton({
                    entity:'segments',
                    prop:'conditions',
                    format:'csv',
                    label:'Export CSV',
                  }),
                  sharedComponents.getDownloadButton({
                    entity:'segments',
                    prop:'conditions',
                    format:'json',
                    label: 'Export JSON',
                    style: { marginLeft: '10px', },
                  }),
                ],
              },
            },
          {
            'type': 'datatable',
            layoutProps: {},
            'addNewRows': true,
            'rowButtons': true,
            'selectEntireRow': false,
            'flattenRowData': false,
            headers: tableheaders.segment_score_conditions,
            label:'Conditions',
            'name': 'conditions',
            passProps: {
              replaceButton: true,
              uploadAddButton: false,
            },
          },
        ],
      }),
      getSegmentRuleset({
        title: 'Requirements Rules',
        headers: tableheaders.segment_mcr_rule_rulesets,
      }),
      getSegmentRuleset({
        title: 'Scorecard Rules',
        headers: tableheaders.segment_score_rule_rulesets,
      }),
      getSegmentRuleset({
        title: 'Output Rules',
        headers: tableheaders.segment_output_rule_rulesets,
      }),
      getSegmentRuleset({
        title: 'Limit Rules',
        headers: tableheaders.segment_limits_rule_rulesets,
      }),
      getSegmentRuleset({
        title: 'Adverse Rules',
        headers: tableheaders.segment_adverse_rule_rulesets,
      }),
      getSegmentRuleset({
        title: 'Pipeline Functions',
        flattenRowData: true,
        newEntity,
        headers: tableheaders.segment_pipeline_rule_rulesets,
        passProps: {
          useInputRows: true,
          flattenRowDataOptions: {
            maxDepth: 1,
          },
        },
      }),
    ];
  },
};
