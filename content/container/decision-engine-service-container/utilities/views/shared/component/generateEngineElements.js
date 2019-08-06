'use strict';
const cardprops = require('../props/cardprops');

function generateResources(options) {
  return {
    component: 'DynamicLayout',
    thisprops: {
      items: options.items, //['formdata', 'system_of_record_associated_data', 'scorecard_segments',],
    },
    props: {
      'style': {
        'flexDirection': 'column',
      },
      layout: {
        component: 'ResponsiveCard',
        props: Object.assign(cardprops({
        }), {
          display: options.display || false,
        }),
        thisprops: {
          cardTitle: ['title',],
        },
        bindprops: true,
        children: [
          {
            component: 'Content',
            bindprops: true,
            children: [
              {
                component: 'Label',
                props: {
                  style: {
                    fontWeight:'bold',
                  },
                },
                children: 'Description:',
              },
              {
                component: 'RawOutput',
                props: {
                  select: 'description',
                  display: true,
                  type: 'inline',
                },
                thisprops: {
                  description: ['description',],
                },
              },
              {
                component: 'div',
                bindprops: true,
                children: [
                  {
                    component: 'Label',
                    props: {
                      style: {
                        fontWeight:'bold',
                      },
                    },
                    children: 'Source:',
                  },
                  {
                    component: 'RawOutput',
                    props: {
                      select: 'source',
                      display: true,
                      type: 'inline',
                      // type: 'Text',
                    },
                    thisprops: {
                      // children: [ 'source', ],
                      // value: [ 'source', ],
                      source: ['source',],
                    },
                  },
                ],
              },
              {
                component: 'div',
                bindprops: true,
                children: [
                  {
                    component: 'Label',
                    props: {
                      style: {
                        fontWeight:'bold',
                      },
                    },
                    children: 'State Property Name:',
                  },
                  {
                    component: 'RawOutput',
                    props: {
                      select: 'state_property_name',
                      display: true,
                      type: 'inline',
                    },
                    thisprops: {
                      state_property_name: ['state_property_name',],
                    },
                  },
                ],
              },
              {
                component: 'div',
                bindprops: true,
                children: [
                  {
                    component: 'Label',
                    props: {
                      style: {
                        fontWeight:'bold',
                      },
                    },
                    children: 'Source Configuration:',
                  },
                  {
                    component: 'RawOutput',
                    props: {
                      select: 'source_configuration',
                      display: false,
                      type: 'pre',
                    },
                    thisprops: {
                      source_configuration: ['source_configuration',],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  };
}  

function generateParser(options) {
  return {
    component: 'ResponsiveCard',
    props: Object.assign(cardprops({
    }), {
      display: false,
        
    }),
    thisprops:{
      cardTitle:options.cardTitle, //['formdata', 'system_of_record_associated_data', 'parser', 'title',],
    },
    children: [
      {
        component: 'Content',
        thisprops: {
          children: options.description, //['formdata', 'system_of_record_associated_data', 'parser', 'description',],
        },
      },
      {
        component: 'ResponsiveTable',
        props: {
          headers: options.headers,
        },
        thisprops: {
          rows: options.variables, //['formdata', 'system_of_record_associated_data', 'parser', 'variables',],
        },
      },
    ],
  };
}

function generateSegment(options) {
  return {
    component: 'DynamicLayout',
    thisprops: {
      items: options.items, //['formdata', 'system_of_record_associated_data', 'scorecard_segments',],
    },
    props: {
      'style': {
        'flexDirection': 'column',
      },
      layout: {
        component: 'ResponsiveCard',
        props: Object.assign(cardprops({
        }), {
          display: options.display || false,
        }),
        thisprops: {
          cardTitle: ['title',],
        },
        bindprops: true,
        children: [
          {
            component: 'Content',
            bindprops: true,
            children: [
              {
                component: 'RawOutput',
                props: {
                  select: 'description',
                  display: true,
                  type: 'inline',
                },
                thisprops: {
                  description: ['description',],
                },
              },
            ],
          },
          {
            component: 'Title',
            props: {
              size: 'is4',
            },
            children: 'Conditions',
          },
          {
            component: 'ResponsiveTable',
            props: {
              headers: options.conditions, // tableHeaders.segment_score_conditions,
            
            },
            thisprops: {
              rows: ['conditions',],
            },
          },
          {
            component: 'Title',
            props: {
              size: 'is4',
              style: {
                marginTop: '20px',
              },
            },
            children: 'Rules',
          },
          {
            component: 'ResponsiveTable',
            props: {
              headers: options.rule_rulesets, //tableHeaders.segment_score_rule_rulesets,
            },
            thisprops: {
              rows: ['ruleset', 'rules',],
            },
          },
        ],
      },
    },
  };
}

function generateCalculation(options) {
  return {
    component: 'ResponsiveCard',
    props: Object.assign(cardprops({
    }), {
      display: options.display || false,
    }),
    thisprops:{
      cardTitle:options.cardTitle, //['formdata', 'system_of_record_associated_data', 'parser', 'title',],
    },
    children: [
      {
        component: 'Content',
        thisprops: {
          children:options.description, //['formdata', 'system_of_record_associated_data', 'parser', 'description',],
        },
      },
      {
        component: 'ResponsiveTable',
        props: {
          headers: options.headers, // tableHeaders.credit_parser,
        },
        thisprops: {
          rows: options.variables, //['formdata', 'system_of_record_associated_data', 'parser', 'variables',],
        },
      },
    ],
  };
}

module.exports = {
  generateCalculation,
  generateParser,
  generateResources,
  generateSegment,
};
