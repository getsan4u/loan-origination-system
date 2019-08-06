'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const utilities = require('../../utilities');
const { getRuleFromCache, getVariableFromCache } = require('../../utilities/controllers/integration');
const Promisie = require('promisie');
const transformhelpers = utilities.transformhelpers;
const strategytransformhelpers = utilities.transforms.strategy;
const helpers = utilities.controllers.helper;
const { COMPARATOR_MAP, } = utilities.constants;
const DECISION_CONSTANTS = utilities.views.decision.constants;
const capitalize = require('capitalize');
const moment = require('moment');
const numeral = require('numeral');
const url = require('url');
const flatten = require('flat');
const segment_manifests = require('../../views/decision/manifests/strategy/components/segment_manifests');
const util = require('util');
const styles = utilities.views.constants.styles;
const STATIC_VARIABLE_LABEL_MAP = DECISION_CONSTANTS.STATIC_VARIABLE_LABEL_MAP;
const randomKey = Math.random;

/**
 * Populates rules dropdown to be displayed and selected from on a ruleset
 * 
 * @param {any} req Express request object
 * @returns {Object} request object with populated variables dropdown on req.controllerData
 */
function generateRuleDropdown(req) {
  return new Promise((resolve, reject) => {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
    let pathname = flatten(Object.assign({}, { pathname: url.parse(req.headers.referer).pathname.split('/'), }));
    const Variable = periodic.datas.get('standard_variable');
    const Rule = periodic.datas.get('standard_rule');
    let Model = (req.params.type === 'calculations') ? Variable : Rule;
    let query = (req.params.type === 'calculations') ? { type: 'Calculated', organization, } : { type: req.params.type, organization, };
    if (req.query.modal === 'true' && collection === 'strategies') {
      Model.query({ query, })
        .then(rules => {
          let ruleDropdown = rules.map(rule => {
            rule = rule.toJSON ? rule.toJSON() : rule;
            return { label: rule.display_name, value: rule._id, };
          }).sort((a, b) => (a.label > b.label) ? 1 : -1);
          let formoptions = { rule: ruleDropdown, };
          let _id = req.params.id;
          req.controllerData = Object.assign({}, req.controllerData, {
            formoptions,
            data: Object.assign({}, {
              _id,
              type: req.params.type,
            }, pathname),
          });
          resolve(req);
        })
        .catch(reject);
    } else {
      resolve(req);
    }
  });
}

function __getDeleteSegmentButton(segmentType) {
  return {
    passProps: {
      buttonProps: {
        icon: 'fa fa-trash',
        color: 'isLink',
      },
      style: {
        display: null,
      },
      onClick: 'func:this.props.fetchAction',
      onclickBaseUrl: `/decision/api/standard_strategies/:id/segments/${segmentType}/:index?method=delete`,
      onclickLinkParams: [ { key: ':id', val: '_id', }, { 'key': ':index', 'val': 'index', }, ],
      fetchProps: {
        method: 'PUT',
      },
      successProps: {
        successCallback: 'func:window.pushToNewRoute',
      },
      confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
        title: 'Delete Population Segment',
        textContent: [ {
          component: 'p',
          children: 'Do you want to permanently delete this population segment?',
          props: {
            style: {
              textAlign: 'left',
              marginBottom: '1.5rem',
            },
          },
        },
        ],
      }),
    },
  };
}

function __getSegmentUpButton(segmentType) {
  return {
    passProps: {
      buttonProps: {
        className: 'segment-up-btn',
        icon: 'fa fa-arrow-up',
        color: 'isLink',
      },
      style: {
        display: null,
      },
      onClick: 'func:this.props.fetchAction',
      onclickBaseUrl: `/decision/api/standard_strategies/:id/${segmentType}/:index?method=moveSegmentUp`,
      onclickLinkParams: [ { key: ':id', val: '_id', }, { 'key': ':index', 'val': 'index', }, ],
      fetchProps: {
        method: 'PUT',
      },
      successProps: {
        successCallback: 'func:this.props.refresh',
      },
    },
  };
}

function __getSegmentDownButton(segmentType) {
  return {
    passProps: {
      buttonProps: {
        className: 'segment-down-btn',
        icon: 'fa fa-arrow-down',
        color: 'isLink',
      },
      style: {
        display: null,
      },
      onClick: 'func:this.props.fetchAction',
      onclickBaseUrl: `/decision/api/standard_strategies/:id/${segmentType}/:index?method=moveSegmentDown`,
      onclickLinkParams: [ { key: ':id', val: '_id', }, { 'key': ':index', 'val': 'index', }, ],
      fetchProps: {
        method: 'PUT',
      },
      successProps: {
        successCallback: 'func:this.props.refresh',
      },
    },
  };
}

function generateOutputVariablesOptions(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      if (collection === 'strategies' && req.controllerData.data && !req.query.copySegment && tabname !== 'overview' && tabname !== 'versions' && tabname !== 'update_history_detail') {
        let url = req.headers.referer.split('/');
        let index = url[ url.length - 1 ];
        let Rule = periodic.datas.get('standard_rule');
        let currentSegment = (req.controllerData.data.modules[ tabname ] && req.controllerData.data.modules[ tabname ].length) ? req.controllerData.data.modules[ tabname ][ index ] : {};
        let Variable = periodic.datas.get('standard_variable');
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        if (currentSegment && (currentSegment.type === 'scorecard' || currentSegment.type === 'artificialintelligence')) {
          Variable.model.find({ type: 'Output', organization, })
            .then(variables => {
              let outputVariablesMap = variables.sort((a, b) => (a.title.toUpperCase() < b.title.toUpperCase()) ? -1 : 1).map(variable => {
                return {
                  label: variable.display_title,
                  value: variable._id,
                  data_type: variable.data_type,
                };
              });
              req.controllerData.outputVariablesMap = outputVariablesMap;
              return resolve(req);
            })
            .catch(e => reject(e));
        } else {
          return resolve(req);
        }
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

function formatMultipleRulesTable(inner_rule, rule, variablesMap) {
  if (DECISION_CONSTANTS.SINGLE_RULE_MODULES[ rule.type ]) {
    const VAR_MAP = STATIC_VARIABLE_LABEL_MAP[ rule.type ];
    let state_property_attribute = VAR_MAP[ inner_rule.static_state_property_attribute ] || {};
    return Object.assign({}, inner_rule, {
      state_property_attribute: state_property_attribute,
      state_property_attribute_value_comparison: `${helpers.checkIfVariable({ value: inner_rule.state_property_attribute_value_comparison, type: inner_rule.state_property_attribute_value_comparison_type, variablesMap, test: inner_rule.condition_test, data_type: state_property_attribute.data_type, })}`,
      // condition_test: COMPARATOR_MAP[ inner_rule.condition_test ],
    });
  } else {
    return Object.assign({}, inner_rule, {
      state_property_attribute: (inner_rule.state_property_attribute && inner_rule.state_property_attribute.display_title)
        ? inner_rule.state_property_attribute.display_title
        : variablesMap[ inner_rule.state_property_attribute ] && variablesMap[ inner_rule.state_property_attribute ].display_title
          ? variablesMap[ inner_rule.state_property_attribute ].display_title
          : '',
      state_property_attribute_value_comparison: (inner_rule.condition_test === 'RANGE')
        ? `${helpers.checkIfVariable({ value: inner_rule.state_property_attribute_value_minimum, type: inner_rule.state_property_attribute_value_minimum_type, variablesMap, data_type: inner_rule.state_property_attribute.data_type, })} to ${helpers.checkIfVariable({ value: inner_rule.state_property_attribute_value_maximum, type: inner_rule.state_property_attribute_value_maximum_type, variablesMap, data_type: inner_rule.state_property_attribute.data_type, })}`
        : `${helpers.checkIfVariable({ value: inner_rule.state_property_attribute_value_comparison, type: inner_rule.state_property_attribute_value_comparison_type, variablesMap, test: inner_rule.condition_test, data_type: inner_rule.state_property_attribute.data_type, })}`,
      condition_test: COMPARATOR_MAP[ inner_rule.condition_test ],
    });
  }
}

/**
 * Populate details on strategy segment page
 * 
 * @param {Object} req Express request object
 * @returns request object with populated segment details
 */
async function populateSegment(req) {
  try {
    let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
    req.controllerData = req.controllerData || {};
    if (collection === 'strategies' && req.controllerData.data && tabname && (tabname.split('_').slice(-2)[ 0 ] !== 'artificialintelligence') && (tabname.split('_').slice(-2)[ 0 ] !== 'dataintegration') && (tabname.split('_').slice(-2)[ 0 ] !== 'documentocr') && (tabname.split('_').slice(-2)[ 0 ] !== 'documentcreation') && !req.query.copySegment && tabname !== 'overview' && tabname !== 'versions' && tabname !== 'update_history_detail') {
      let url = req.headers.referer.split('/');
      let index = url[ url.length - 1 ];
      let Rule = periodic.datas.get('standard_rule');
      let Variable = periodic.datas.get('standard_variable');
      let currentSegment = (req.controllerData.data.modules && req.controllerData.data.modules[ tabname ] && req.controllerData.data.modules[ tabname ].length) ? req.controllerData.data.modules[ tabname ][ index ] : {};
      if (currentSegment && Object.keys(currentSegment).length) {
        currentSegment = currentSegment.toJSON ? currentSegment.toJSON() : currentSegment;
        let ruleIdMap = {};
        let variablesMap = req.controllerData.allVariablesMap;
        let rulesetRules = currentSegment.ruleset;
        let conditionRules = currentSegment.conditions;
        let allRules = rulesetRules.concat(conditionRules).filter(id => !!id);
        let user = req.user;
        let strategy = req.controllerData.data;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        const rules = await getRuleFromCache(allRules, organization);
        if (rules && rules.length) rules.forEach(rule => ruleIdMap[ rule._id ] = rule);
        if (DECISION_CONSTANTS.SINGLE_RULE_MODULES[ currentSegment.type ] && currentSegment.ruleset && currentSegment.ruleset.length && currentSegment.ruleset[ 0 ]) {
          req.controllerData.data.default_rule_id = ruleIdMap[ currentSegment.ruleset[ 0 ] ]._id.toString();
        }
        currentSegment.ruleset = rulesetRules.map((rule_id, i) => {
          let rule = ruleIdMap[ rule_id ];
          let multiple_rules = rule.multiple_rules.map(inner_rule => formatMultipleRulesTable(inner_rule, rule, variablesMap));
          let condition_outputs = (rule.type === 'output')
            ? rule.condition_output.map(output => Object.assign({}, output, {
              value: (output.value_type === 'variable' && variablesMap[ output.value ]) ? `${output.variable_display_title} = ${variablesMap[ output.value ].display_title}`
                : `${output.variable_display_title} = ${(typeof output.value === 'string' && moment(output.value, moment.ISO_8601, true).isValid()) ? transformhelpers.formatDateNoTime(output.value, user.time_zone) : output.value}`,
            }))
            : rule.condition_output.map(output => Object.assign({}, output, {
              value: (output.value_type === 'variable' && variablesMap[ output.value ])
                ? variablesMap[ output.value ].display_title
                : (typeof output.value === 'string' && moment(output.value, moment.ISO_8601, true).isValid())
                  ? transformhelpers.formatDateNoTime(output.value, user.time_zone)
                  : output.value,
            }));
          return Object.assign({}, rule, {
            index: i,
            display_name: {
              component: 'ResponsiveButton',
              children: rule.display_name,
              props: {
                aProps: {},
                'onclickBaseUrl': `/decision/rules/${rule.type}/${rule._id}/detail`,
              },
            },
            strategy_id: parsedUrl[ 1 ],
            multiple_rules,
            condition_output_display: (condition_outputs.length) ?
              helpers.formatDataTableRulesTableCellNoAndOr({
                rules: condition_outputs,
                field_name: 'value',
              }) :
              '',
            buttons: [ {
              component: 'ResponsiveButton',
              props: {
                style: {
                  width: 'auto',
                },
                buttonProps: {
                  className: '__icon_button icon-pencil-content',
                },
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  pathname: `/decision/rules/${rule.type}/${rule_id}`,
                  title: 'Edit Rule',
                },
              },
            }, {
              component: 'ResponsiveButton',
              props: {
                onclickProps: {
                  title: 'Delete Rule',
                },
                style: {
                  width: 'auto',
                },
                buttonProps: {
                  color: 'isDanger',
                  className: '__icon_button icon-trash-content',
                },
                onClick: 'func:this.props.fetchAction',
                onclickBaseUrl: `/decision/api/standard_strategies/${parsedUrl[ 1 ]}/segments/${currentSegment.type}/${i}?method=deleteRule&conditions=false`,
                fetchProps: {
                  method: 'PUT',
                },
                confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                  title: 'Delete Rule',
                  textContent: [ {
                    component: 'p',
                    children: 'Do you want to permanently delete this rule?',
                    props: {
                      style: {
                        textAlign: 'left',
                        marginBottom: '1.5rem',
                      },
                    },
                  },
                  ],
                }),
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
              },
            }, ],
          }, (currentSegment.type === 'requirements' || currentSegment.type === 'scorecard' || currentSegment.type === 'output') ? {
            combined_value_comparison_property: helpers.formatVariableComparisonValueTableCell({
              rules: multiple_rules,
              currentRule: rule,
              field_name: [ 'state_property_attribute', 'condition_test', 'state_property_attribute_value_comparison', ],
            }),
          } : {
                state_property_attribute: (multiple_rules.length)
                  ? helpers.formatRulesTableCell({
                    currentRule: rule,
                    rules: multiple_rules,
                    field_name: 'state_property_attribute',
                  })
                  : rule.state_property_attribute,
                condition_test: (multiple_rules.length)
                  ? helpers.formatRulesTableCellNoAndOr({ rules: multiple_rules, field_name: 'condition_test', })
                  : rule.condition_test,
                state_property_attribute_value_comparison: (multiple_rules.length)
                  ? helpers.formatRulesTableCellNoAndOr({
                    rules: multiple_rules,
                    field_name: 'state_property_attribute_value_comparison',
                  })
                  : rule.state_property_attribute_value_comparison,
              });
        });
        currentSegment.conditions = conditionRules.map((rule_id, i) => {
          let rule = ruleIdMap[ rule_id ];
          let multiple_rules = rule.multiple_rules.map(inner_rule => formatMultipleRulesTable(inner_rule, rule, variablesMap));
          return Object.assign({}, rule, {
            index: i,
            display_name: {
              component: 'ResponsiveButton',
              children: rule.display_name,
              props: {
                aProps: {},
                'onclickBaseUrl': `/decision/rules/${rule.type}/${rule._id}/detail`,
              },
            },
            combined_value_comparison_property: helpers.formatVariableComparisonValueTableCell({
              rules: multiple_rules,
              currentRule: rule,
              field_name: [ 'state_property_attribute', 'condition_test', 'state_property_attribute_value_comparison', ],
            }),
            strategy_id: parsedUrl[ 1 ],
            multiple_rules,
            buttons: [ {
              component: 'ResponsiveButton',
              props: {
                style: {
                  width: 'auto',
                },
                buttonProps: {
                  className: '__icon_button icon-pencil-content',
                },
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  pathname: `/decision/rules/${rule.type}/${rule_id}`,
                  title: 'Edit Rule',
                },
              },
            }, {
              component: 'ResponsiveButton',
              props: {
                onclickProps: {
                  title: 'Delete Rule',
                },
                buttonProps: {
                  color: 'isDanger',
                  className: '__icon_button icon-trash-content',
                },
                onClick: 'func:this.props.fetchAction',
                onclickBaseUrl: `/decision/api/standard_strategies/${parsedUrl[ 1 ]}/segments/${currentSegment.type}/${i}?method=deleteRule&conditions=true`,
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
                confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                  title: 'Delete Rule',
                  textContent: [ {
                    component: 'p',
                    children: 'Do you want to permanently delete this rule?',
                    props: {
                      style: {
                        textAlign: 'left',
                        marginBottom: '1.5rem',
                      },
                    },
                  },
                  ],
                }),
              },
            }, ],
          });
        });
        let type = (currentSegment.type) ? currentSegment.type : tabname.replace('_segments', '');
        let segment_rules = [];
        let data = req.controllerData.data;
        let module_run_order = data.module_run_order;
        let modules = data.modules;
        if (currentSegment.type === 'scorecard') {
          let outputVarsTypeNumber = req.controllerData.outputVariablesMap.filter(variable => variable.data_type === 'Number');
          req.controllerData.data.segment_initial_score = currentSegment.initial_score || 0;
          req.controllerData.data.segment_output_variable = currentSegment.output_variable;
          req.controllerData.formsettings = Object.assign({}, req.controllerData.formsettings, {
            segment_output_variable: outputVarsTypeNumber,
          });
        }
        if (DECISION_CONSTANTS.SINGLE_RULE_MODULES[ currentSegment.type ] && currentSegment.ruleset && currentSegment.ruleset.length && currentSegment.ruleset[ 0 ]) {
          req.controllerData.data.ruleset_simple = currentSegment.ruleset[ 0 ].multiple_rules;
        }
        req.controllerData.data = Object.assign({}, req.controllerData.data, {
          type: type.split('_').map(w => capitalize(w)).join(' '),
          index,
          conditions: currentSegment.conditions,
          ruleset: currentSegment.ruleset,
          segment_name: currentSegment.display_name,
          segment_description: currentSegment.description,
          segment_type: capitalize(currentSegment.type),
          title: data.title,
          version: data.version,
          _id: data._id,
          children: segment_manifests[ currentSegment.type ],
          onclickBaseUrl: `/decision/strategies/${data._id}/${module_run_order[ 0 ].lookup_name}/0`,
          nav_sections: module_run_order.map(module_run_element => {
            let buttons = (module_run_element.type === 'artificialintelligence' || module_run_element.type === 'dataintegration') ? [ __getDeleteSegmentButton(module_run_element.lookup_name) ] : [ __getSegmentUpButton(module_run_element.lookup_name), __getSegmentDownButton(module_run_element.lookup_name), __getDeleteSegmentButton(module_run_element.lookup_name), ]
            return {
              title: module_run_element.display_name,
              baseURL: `/decision/strategies/${data._id}/${module_run_element.lookup_name}/:index`,
              buttons,
              // toggle: `has_${module_run_element.lookup_name}`,
            };
          }),
          // toggle_data: module_run_order.reduce((returnData, module_run_element) => {
          //   returnData[ `has_${module_run_element.lookup_name}` ] = module_run_element.active;
          //   return returnData;
          // }, {}),
          all_segments: module_run_order.reduce((returnData, module_run_element) => {
            returnData.push(modules[ module_run_element.lookup_name ].map((seg, index) => ({ index, name: seg.display_name, _id: seg._id, type: seg.type, })));
            return returnData;
          }, []),
          has_population: currentSegment.conditions.length ? 'on' : 0,
        });
        return req;
      } else {
        return req;
      }
    } else {
      if (req.controllerData && req.controllerData.data && req.controllerData.data.module_run_order.length) {
        req.controllerData.data.onclickBaseUrl = `/decision/strategies/${req.controllerData.data._id}/${req.controllerData.data.module_run_order[ 0 ].lookup_name}/0`;
        return req;
      } else {
        return req;
      }
    }
  } catch (err) {
    console.log({ err });
    return err;
  }
}

async function populateArtificialIntelligenceAndDataIntegrationSegment(req) {
  try {
    let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
    req.controllerData = req.controllerData || {};
    if (collection === 'strategies' && req.controllerData.data && tabname && (tabname.split('_').slice(-2)[ 0 ] && DECISION_CONSTANTS.NON_STANDARD_MODULES[ tabname.split('_').slice(-2)[ 0 ] ]) && !req.query.copySegment && tabname !== 'overview' && tabname !== 'versions' && tabname !== 'update_history_detail') {
      let url = req.headers.referer.split('/');
      let index = url[ url.length - 1 ];
      let Rule = periodic.datas.get('standard_rule');
      let Variable = periodic.datas.get('standard_variable');
      let currentSegment = (req.controllerData.data.modules && req.controllerData.data.modules[ tabname ] && req.controllerData.data.modules[ tabname ].length) ? req.controllerData.data.modules[ tabname ][ index ] : {};
      if (currentSegment && Object.keys(currentSegment).length) {
        currentSegment = currentSegment.toJSON ? currentSegment.toJSON() : currentSegment;
        let ruleIdMap = {};
        let variablesMap = req.controllerData.allVariablesMap;
        let rulesetRules = currentSegment.ruleset;
        let conditionRules = currentSegment.conditions;
        let allRules = rulesetRules.concat(conditionRules).filter(id => !!id);
        let user = req.user;
        let strategy = req.controllerData.data;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        const rules = await getRuleFromCache(allRules, organization);
        if (rules && rules.length) rules.forEach(rule => ruleIdMap[ rule._id ] = rule);
        currentSegment.conditions = conditionRules.map((rule_id, i) => {
          let rule = ruleIdMap[ rule_id ];
          let multiple_rules = rule.multiple_rules.map(inner_rule => formatMultipleRulesTable(inner_rule, rule, variablesMap));
          return Object.assign({}, rule, {
            index: i,
            display_name: {
              component: 'ResponsiveButton',
              children: rule.display_name,
              props: {
                aProps: {},
                'onclickBaseUrl': `/decision/rules/${rule.type}/${rule._id}/detail`,
              },
            },
            combined_value_comparison_property: helpers.formatVariableComparisonValueTableCell({
              rules: multiple_rules,
              currentRule: rule,
              field_name: [ 'state_property_attribute', 'condition_test', 'state_property_attribute_value_comparison', ],
            }),
            strategy_id: parsedUrl[ 1 ],
            multiple_rules,
            buttons: [ {
              component: 'ResponsiveButton',
              props: {
                style: {
                  width: 'auto',
                },
                buttonProps: {
                  className: '__icon_button icon-pencil-content',
                },
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  pathname: `/decision/rules/${rule.type}/${rule_id}`,
                  title: 'Edit Rule',
                },
              },
            }, {
              component: 'ResponsiveButton',
              props: {
                onclickProps: {
                  title: 'Delete Rule',
                },
                buttonProps: {
                  color: 'isDanger',
                  className: '__icon_button icon-trash-content',
                },
                onClick: 'func:this.props.fetchAction',
                onclickBaseUrl: `/decision/api/standard_strategies/${parsedUrl[ 1 ]}/segments/${currentSegment.type}/${i}?method=deleteRule&conditions=true`,
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
                confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                  title: 'Delete Rule',
                  textContent: [ {
                    component: 'p',
                    children: 'Do you want to permanently delete this rule?',
                    props: {
                      style: {
                        textAlign: 'left',
                        marginBottom: '1.5rem',
                      },
                    },
                  },
                  ],
                }),
              },
            }, ],
          });
        });
        let type = (currentSegment.type) ? currentSegment.type : tabname.replace('_segments', '');
        let segment_rules = [];
        let data = req.controllerData.data;
        let module_run_order = data.module_run_order;
        let modules = data.modules;
        let inputs = [];
        let outputs = [];
        let _children = segment_manifests[ currentSegment.type ];
        if (currentSegment.type === 'dataintegration') {
          inputs = currentSegment.inputs.map(input => {
            if (variablesMap[ input.input_variable ]) {
              return {
                input_variable: variablesMap[ input.input_variable ].display_title,
                data_type: input.data_type,
                display_name: input.display_name,
              };
            } else return input;
          });
          outputs = currentSegment.outputs.map(output => {
            if (variablesMap[ output.output_variable ]) {
              return {
                output_variable: variablesMap[ output.output_variable ].display_title,
                data_type: output.data_type,
                api_name: output.api_name,
                display_name: output.display_name,
              };
            } else return output;
          });
        }
        if (currentSegment.type === 'artificialintelligence') {
          inputs = currentSegment.inputs.map(variable_element => {
            if (variablesMap[ variable_element.system_variable_id ]) {
              variable_element.system_variable_id = variablesMap[ variable_element.system_variable_id ].display_title;
              return variable_element;
            } else return variable_element;
          });
          outputs = currentSegment.outputs.map(output => {
            if (variablesMap[ output.output_variable ]) {
              return {
                output_variable: variablesMap[ output.output_variable ].display_title,
                data_type: output.data_type,
                display_name: output.display_name,
              };
            } else return output;
          });
          req.controllerData.data.segment_output_variable = currentSegment.output_variable;
          req.controllerData.formsettings = Object.assign({}, req.controllerData.formsettings, {
            segment_output_variable: req.controllerData.outputVariablesMap,
          });
        }
        if (currentSegment.type === 'documentcreation') {
          if (currentSegment.inputs && currentSegment.inputs.length) {
            inputs = currentSegment.inputs.map(input => {
              if (variablesMap[ input.input_variable ]) {
                return {
                  input_variable: variablesMap[ input.input_variable ].display_title,
                  data_type: input.data_type,
                  display_name: input.display_name,
                };
              } else return input;
            });
            _children = _children({ init: false, currentSegment, });
          } else {
            _children = _children({ init: true, currentSegment, });
          }
        }
        req.controllerData.data = Object.assign({}, req.controllerData.data, {
          type: (type === 'artificialintelligence') ? 'Artificial Intelligence' : 'Data Integration',
          model_type: (currentSegment.model_type) ? capitalize(currentSegment.model_type) : '',
          index,
          inputs,
          outputs,
          conditions: currentSegment.conditions,
          ruleset: [],
          segment_name: currentSegment.display_name,
          segment_description: currentSegment.description,
          segment_type: capitalize(currentSegment.type),
          title: data.title,
          version: data.version,
          _id: data._id,
          children: _children,
          onclickBaseUrl: `/decision/strategies/${data._id}/${module_run_order[ 0 ].lookup_name}/0`,
          nav_sections: module_run_order.map(module_run_element => {
            let buttons = (module_run_element.type === 'artificialintelligence' || module_run_element.type === 'dataintegration') ? [ __getDeleteSegmentButton(module_run_element.lookup_name) ] : [ __getSegmentUpButton(module_run_element.lookup_name), __getSegmentDownButton(module_run_element.lookup_name), __getDeleteSegmentButton(module_run_element.lookup_name), ]
            return {
              title: module_run_element.display_name,
              baseURL: `/decision/strategies/${data._id}/${module_run_element.lookup_name}/:index`,
              buttons,
              toggle: `has_${module_run_element.lookup_name}`,
            };
          }),
          toggle_data: module_run_order.reduce((returnData, module_run_element) => {
            returnData[ `has_${module_run_element.lookup_name}` ] = module_run_element.active;
            return returnData;
          }, {}),
          all_segments: module_run_order.reduce((returnData, module_run_element) => {
            returnData.push(modules[ module_run_element.lookup_name ].map((seg, index) => ({ index, name: seg.display_name, _id: seg._id, type: seg.type, })));
            return returnData;
          }, []),
          has_population: currentSegment.conditions.length ? 'on' : 0,
        });
        return req;
      } else {
        return req;
      }
    } else {
      if (req.controllerData && req.controllerData.data && req.controllerData.data.module_run_order.length) {
        req.controllerData.data.onclickBaseUrl = `/decision/strategies/${req.controllerData.data._id}/${req.controllerData.data.module_run_order[ 0 ].lookup_name}/0`;
        return req;
      } else {
        return req;
      }
    }
  } catch (err) {
    return err;
  }
}


/**
 * Formats the module details and run order for the Drag and Drop table
 * 
 * @param {Object} req Express request object
 * @returns request object with formatted module details
 */

function formatModuleRunOrder(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData) {
        req.controllerData.data.has_modules = (req.controllerData.data.module_run_order && req.controllerData.data.module_run_order.length) ? true : false;
        let strategy_id = req.controllerData.data._id;
        const md_type_map = DECISION_CONSTANTS.MODULE_TYPE_MAP;
        req.controllerData.data.formatted_module_run_order = (req.controllerData.data.module_run_order) ? req.controllerData.data.module_run_order.map((md, i) => {
          let md_type = md_type_map[ md.type ];
          let md_display = (md.active) ? md_type : `${md_type} Disabled`;
          let display_name = md.display_name;
          return {
            module_index: i,
            module: {
              component: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                },
              },
              children: [ {
                component: 'span',
                props: {
                  style: {
                    width: '45px',
                    height: '45px',
                    backgroundImage: 'url(' + styles.moduleIcons[ md.type ] + ')',
                    backgroundSize: '100% 200%',
                    backgroundPosition: 'top',
                    margin: 'auto 10px auto -5px',
                    flex: 'none',
                  },
                },
              }, {
                component: 'div',
                children: [ {
                  component: 'div',
                  props: {
                    style: {
                      fontStyle: 'italic',
                      fontWeight: 'normal',
                      color: styles.colors.gray,
                    },
                  },
                  children: md_display,
                }, {
                  component: 'div',
                  props: {
                    style: {
                      fontWeight: 700,
                    },
                  },
                  // children: md.display_name,
                  children: [ {
                    component: 'ResponsiveButton',
                    props: {
                      style: {
                        width: 'auto',
                      },
                      onClick: 'func:window.createDecisionModuleEditModal',
                      onclickProps: {
                        pathname: `/decision/strategy/${strategy_id}/modules/${md.lookup_name}`,
                        title: 'Edit Process Module',
                        data: Object.assign({}, md, { strategy_id, }),
                      },
                    },
                    children: md.display_name,
                  }, ],
                }, {
                  component: 'div',
                  props: {
                    style: {
                      fontWeight: 'normal',
                    },
                  },
                  children: md.description,
                }, ],
              }, ],
            },
            buttons: [ {
              component: 'ResponsiveButton',
              props: {
                style: {
                  width: 'auto',
                },
                buttonProps: {
                  className: '__icon_button icon-pencil-content',
                },
                onClick: 'func:this.props.reduxRouter.push',
                onclickBaseUrl: `/decision/strategies/${strategy_id}/${md.lookup_name}/0`,
              },
            }, {
              component: 'ResponsiveButton',
              props: {
                onClick: 'func:this.props.fetchAction',
                onclickBaseUrl: `/decision/api/standard_strategies/${strategy_id}/${md.lookup_name}?format=json&method=deleteModule`,
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
                confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                  title: 'Delete Process Module',
                  textContent: [ {
                    component: 'p',
                    children: 'Do you want to permanently delete this process module?',
                    props: {
                      style: {
                        textAlign: 'left',
                        marginBottom: '1.5rem',
                      },
                    },
                  },
                  ],
                }),
                style: {
                  width: 'auto',
                },
                buttonProps: {
                  color: 'isDanger',
                  className: '__icon_button icon-trash-content',
                },
              },
            }, ],
            active: md.active,
            type: md.type,
          };
        }) : [];
        return resolve(req);
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

function checkSegmentLength(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.query && req.query.method === 'delete') {
        const Strategy = periodic.datas.get('standard_strategy');
        let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
        let segment_type = parsedUrl.slice(3)[ 0 ];
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        Strategy.load({ query: { _id: req.params.id, organization, }, })
          .then(strategy => {
            if (strategy.modules[ segment_type ].length <= 1) req.error = 'There must be at least one segment available in a module. Please disable or delete the module in the process flow page if you would like to remove it from your strategy.';
            else req.body.redirect_index = strategy.modules[ segment_type ].length - 2;
            return resolve(req);
          });
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

function stageStrategyReqBody(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.body) {
        req.body = Object.assign({}, req.body, {
          modules: {},
        });
        return resolve(req);
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

async function filterCurrentSegment(req) {
  try {
    let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
    let url = req.headers.referer.split('/');
    const segment_index = url[ url.length - 1 ];
    const strategy_id = parsedUrl[ 1 ];
    if (req.controllerData.data && req.controllerData.data.strategies.length) {
      const current_strategy = req.controllerData.data.strategies.find((strategy) => strategy._id.toString() === strategy_id);
      const current_module = current_strategy.modules[ tabname ];
      current_module.splice(Number(segment_index), 1);
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function generateStrategySegmentDropdown(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
    if (req.controllerData.data && req.controllerData.data.strategies.length) {
      let strategies = req.controllerData.data.strategies;
      const formoptions = [];
      strategies.forEach((strategy, idx) => {
        if (strategy.module_run_order && strategy.module_run_order.length) {
          strategy.module_run_order.forEach((md, i) => {
            let module_name = md.display_name || `Module ${i + 1}`;
            let moduleArr = strategy.modules[ md.lookup_name ];
            if (md.type === req.params.type) {
              if (md.type === 'documentcreation') {
                moduleArr.forEach((segment, index) => {
                  formoptions.push({
                    label: `${strategy.display_title} v${strategy.version} | ${segment.display_name}`,
                    value: JSON.stringify({
                      name: `${strategy.name} | ${segment.name}`,
                      segment_type: req.params.type,
                      conditions: [],
                      ruleset: [],
                      inputs: strategy.modules[ md.lookup_name ][ index ].inputs || [],
                      fileurl: strategy.modules[ md.lookup_name ][ index ].fileurl,
                      filename: strategy.modules[ md.lookup_name ][ index ].filename,
                      copysegment_name: segment.name,
                    }),
                  })
                });
              } else {
                moduleArr.forEach((segment, index) => {
                  formoptions.push({
                    label: `${strategy.display_title} v${strategy.version} | ${module_name} | ${segment.display_name}`,
                    value: JSON.stringify({
                      name: `${strategy.name} | ${segment.name}`,
                      segment_type: req.params.type,
                      ruleset: strategy.modules[ md.lookup_name ][ index ].ruleset,
                      conditions: strategy.modules[ md.lookup_name ][ index ].conditions,
                      copysegment_name: segment.name,
                    }),
                  });
                });
              }
            } else if (req.params.type === 'population' && Array.isArray(moduleArr)) {
              moduleArr.forEach((segment, index) => {
                if (segment.conditions && segment.conditions.length) {
                  formoptions.push({
                    label: `${strategy.display_title} v${strategy.version} | ${module_name} | ${segment.display_name}`,
                    value: JSON.stringify({
                      name: `${strategy.name} | ${segment.name}`,
                      segment_type: req.params.type,
                      ruleset: strategy.modules[ md.lookup_name ][ index ].ruleset,
                      conditions: strategy.modules[ md.lookup_name ][ index ].conditions,
                      copysegment_name: segment.name,
                    }),
                  });
                }
              });
            }
          });
        }
      });
      req.controllerData.data.formoptions = {
        copysegment: formoptions,
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function generateVariableFormOptions(req) {
  if (req.controllerData.inputVariables) {
    let numInputOptions = [ { 'label': ' ', 'value': '', }, ], boolInputOptions = [ { 'label': ' ', 'value': '', }, ], stringInputOptions = [ { 'label': ' ', 'value': '', }, ], dateInputOptions = [ { 'label': ' ', 'value': '', }, ];
    req.controllerData.inputVariables.forEach(i => {
      switch (i.data_type) {
        case 'Number':
          numInputOptions.push({
            label: i.display_title,
            value: i._id.toString(),
          });
          break;
        case 'Boolean':
          boolInputOptions.push({
            label: i.display_title,
            value: i._id.toString(),
          });
          break;
        case 'String':
          stringInputOptions.push({
            label: i.display_title,
            value: i._id.toString(),
          });
          break;
        case 'Date':
          dateInputOptions.push({
            label: i.display_title,
            value: i._id.toString(),
          });
          break;
        default:
          stringInputOptions.push({
            label: i.display_title,
            value: i._id.toString(),
          });
      }
    });
    req.controllerData = Object.assign({}, req.controllerData, {
      numInputOptions,
      boolInputOptions,
      stringInputOptions,
      dateInputOptions,
    });
  }
  if (req.controllerData.outputVariables) {
    let numOutputOptions = [ { 'label': ' ', 'value': '', }, ], boolOutputOptions = [ { 'label': ' ', 'value': '', }, ], stringOutputOptions = [ { 'label': ' ', 'value': '', }, ], dateOutputOptions = [ { 'label': ' ', 'value': '', }, ];
    req.controllerData.outputVariables.forEach(i => {
      switch (i.data_type) {
        case 'Number':
          numOutputOptions.push({
            label: i.display_title,
            value: i._id.toString(),
          });
          break;
        case 'Boolean':
          boolOutputOptions.push({
            label: i.display_title,
            value: i._id.toString(),
          });
          break;
        case 'String':
          stringOutputOptions.push({
            label: i.display_title,
            value: i._id.toString(),
          });
          break;
        case 'Date':
          dateOutputOptions.push({
            label: i.display_title,
            value: i._id.toString(),
          });
          break;
        default:
          stringOutputOptions.push({
            label: i.display_title,
            value: i._id.toString(),
          });
      }
    });
    req.controllerData = Object.assign({}, req.controllerData, {
      numOutputOptions,
      boolOutputOptions,
      stringOutputOptions,
      dateOutputOptions,
    });
  }
  return req;
}

async function generateRequiredMLVariablesModal(req) {
  req.controllerData = req.controllerData || {};
  let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
  if (tabname && req.controllerData.data && req.controllerData.data.modules && req.controllerData.data.modules[ tabname ] && req.query.type === 'artificialintelligence' && !req.query.variable_type) {
    let strategy = req.controllerData.data;
    let currentSegment = strategy.modules[ tabname ];
    let inputs = currentSegment[ 0 ].inputs;
    let { numInputOptions, boolInputOptions, stringInputOptions, dateInputOptions, numOutputOptions, boolOutputOptions, stringOutputOptions, dateOutputOptions, } = req.controllerData;

    const numOptions = numInputOptions.concat(numOutputOptions);
    const boolOptions = boolInputOptions.concat(boolOutputOptions);
    const dateOptions = dateInputOptions.concat(dateOutputOptions);
    const stringOptions = stringInputOptions.concat(stringOutputOptions);
    req.controllerData.requiredVariablesModal = [ {
      'component': 'ResponsiveForm',
      'thisprops': {},
      'asyncprops': {},
      hasWindowFunc: true,
      'props': {
        'onSubmit': {
          'url': `/decision/api/standard_strategies/${strategy._id.toString()}/edit_mlmodel_variables?variables=required`,
          'errorCallback': 'func:this.props.createNotification',
          'options': {
            'method': 'PUT',
          },
          successCallback: [ 'func:this.props.refresh', 'func:this.props.hideModal', 'func:this.props.createNotification', ],
          successProps: [ null, 'last', {
            type: 'success',
            text: 'Changes saved successfully!',
            timeout: 10000,
          },
          ],
        },
        formdata: inputs.reduce((acc, curr, idx) => {
          acc[ `variables.${idx}.system_variable_id` ] = curr.system_variable_id ? curr.system_variable_id : '';
          acc[ `variables.${idx}.input_type` ] = curr.input_type ? curr.input_type : 'variable';
          return acc;
        }, {}),
        'formgroups': inputs.map((input, idx) => {
          return {
            'gridProps': {
              'key': randomKey(),
            },
            'formElements': [ {
              'layoutProps': {
                style: {
                  display: [ 'variable', undefined, ].indexOf(input.input_type) !== -1 ? 'block' : 'none',
                },
              },
              'type': 'dropdown',
              'name': `variables.${idx}.system_variable_id`,
              customLabel: {
                component: 'span',
                children: [ {
                  component: 'span',
                  children: input.model_variable_name,
                }, {
                  component: 'span',
                  props: {
                    style: {
                      fontStyle: 'italic',
                      fontWeight: 'normal',
                      color: '#ccc',
                      marginLeft: '7px',
                    },
                  },
                  children: input.data_type,
                }, ],
              },
              'passProps': {
                'className': input.model_variable_name.toLowerCase().replace(/[\W]+/g, '_'),
                'fluid': true,
                'selection': true,
                search: true,
              },
              'options': input.data_type === 'Number'
                ? numOptions
                : input.data_type === 'Boolean'
                  ? boolOptions
                  : input.data_type === 'Date'
                    ? dateOptions
                    : stringOptions,
            },
            input.data_type === 'Boolean'
              ? {
                'layoutProps': {
                  style: {
                    display: [ 'value', ].indexOf(input.input_type) !== -1 ? 'block' : 'none',
                  },
                },
                'type': 'dropdown',
                'name': `variables.${idx}.system_variable_id`,
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: input.model_variable_name,
                  }, {
                    component: 'span',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        fontWeight: 'normal',
                        color: '#ccc',
                        marginLeft: '7px',
                      },
                    },
                    children: input.data_type,
                  }, ],
                },
                'passProps': {
                  'className': input.model_variable_name.toLowerCase().replace(/[\W]+/g, '_'),
                  'fluid': true,
                  'selection': true,
                  search: true,
                },
                'options': [ { 'label': ' ', 'value': '', }, { 'label': 'true', 'value': 'true', }, { 'label': 'false', 'value': 'false', }, ],
              }
              : input.data_type === 'Date'
                ? {
                  'layoutProps': {
                    style: {
                      display: [ 'value', ].indexOf(input.input_type) !== -1 ? 'block' : 'none',
                    },
                    'className': input.model_variable_name.toLowerCase().replace(/[\W]+/g, '_'),
                  },
                  'type': 'singleDatePicker',
                  'name': `variables.${idx}.system_variable_id`,
                  leftIcon: 'fas fa-calendar-alt',
                  customLabel: {
                    component: 'span',
                    children: [ {
                      component: 'span',
                      children: input.model_variable_name,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          fontStyle: 'italic',
                          fontWeight: 'normal',
                          color: '#ccc',
                          marginLeft: '7px',
                        },
                      },
                      children: input.data_type,
                    }, ],
                  },
                  passProps: {
                    hideKeyboardShortcutsPanel: true,
                  },
                }
                : {
                  'type': 'text',
                  'name': `variables.${idx}.system_variable_id`,
                  customLabel: {
                    component: 'span',
                    children: [ {
                      component: 'span',
                      children: input.model_variable_name,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          fontStyle: 'italic',
                          fontWeight: 'normal',
                          color: '#ccc',
                          marginLeft: '7px',
                        },
                      },
                      children: input.data_type,
                    }, ],
                  },
                  'layoutProps': {
                    style: {
                      display: input.input_type === 'value' ? 'block' : 'none',
                    },
                  },
                  passProps: {
                    'className': input.model_variable_name.toLowerCase().replace(/[\W]+/g, '_'),
                  },
                },
            {
              'layoutProps': {
                size: 'is4',
                style: {
                  marginLeft: '7px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: 'flex-end',
                },
              },
              customOnChange: 'func:window.requiredVariablesModal',
              'type': 'dropdown',
              customLabel: (idx === 0)
                ? {
                  component: 'ResponsiveButton',
                  props: {
                    onClick: 'func:window.closeModalAndCreateNewModal',
                    onclickProps: {
                      title: 'Create New Variable',
                      pathname: '/decision/variables/create',
                    },
                  },
                  children: 'Create New Variable',
                }
                : 'Input Type',
              labelProps: (idx === 0)
                ? {
                  style: {
                    textAlign: 'right',
                    fontWeight: 'normal',
                  },
                }
                : {
                  style: {
                    visibility: 'hidden',
                  },
                },
              'name': `variables.${idx}.input_type`,
              'passProps': {
                'className': input.model_variable_name.toLowerCase().replace(/[\W]+/g, '_'),
                'fluid': true,
                'selection': true,
              },
              'options': [ {
                'label': 'Variable',
                'value': 'variable',
              },
              {
                'label': 'Value',
                'value': 'value',
              },
              ],
            },
            ],
          };
        }).concat([ {
          'gridProps': {
            'key': randomKey(),
            'className': 'modal-footer-btns',
          },
          'formElements': [ {
            'name': 'saveRequiredVariables',
            'type': 'submit',
            'value': 'SAVE CHANGES',
            'passProps': {
              'color': 'isPrimary',
            },
            'layoutProps': {
              'style': {
                'textAlign': 'center',
              },
            },
          }, ],
        }, ]),
      },
    }, ];
  }
  return req;
}

async function generateReceivedMLVariablesModal(req) {
  req.controllerData = req.controllerData || {};
  let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
  if (tabname && req.controllerData.data && req.controllerData.data.modules && req.controllerData.data.modules[ tabname ] && req.query.type === 'artificialintelligence' && req.query.variable_type === 'output') {
    let strategy = req.controllerData.data;
    let currentSegment = strategy.modules[ tabname ];
    let outputs = currentSegment[ 0 ].outputs;
    let { numOutputOptions, boolOutputOptions, stringOutputOptions, dateOutputOptions, } = req.controllerData;

    req.controllerData.receivedVariablesModal = [ {
      'component': 'ResponsiveForm',
      'thisprops': {},
      'asyncprops': {},
      hasWindowFunc: true,
      'props': {
        'onSubmit': {
          'url': `/decision/api/standard_strategies/${strategy._id.toString()}/edit_mlmodel_variables?variables=required&variable_type=output`,
          'errorCallback': 'func:this.props.createNotification',
          'options': {
            'method': 'PUT',
          },
          successCallback: [ 'func:this.props.refresh', 'func:this.props.hideModal', 'func:this.props.createNotification', ],
          successProps: [ null, 'last', {
            type: 'success',
            text: 'Changes saved successfully!',
            timeout: 10000,
          },
          ],
        },
        formdata: outputs.reduce((acc, curr, idx) => {
          acc[ `variables.${idx}.output_variable` ] = curr.output_variable ? curr.output_variable : '';
          return acc;
        }, {}),
        'formgroups': outputs.map((output, idx) => {
          return {
            'gridProps': {
              'key': randomKey(),
            },
            'formElements': [ {
              'type': 'dropdown',
              'name': `variables.${idx}.output_variable`,
              customLabel: {
                component: 'span',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'flex-end',
                  },
                },
                children: idx === 0
                  ? [ {
                    component: 'span',
                    props: {
                      style: {
                        flex: '1 1 auto',
                      },
                    },
                    children: [ {
                      component: 'span',
                      children: output.display_name,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          fontStyle: 'italic',
                          fontWeight: 'normal',
                          color: '#ccc',
                          marginLeft: '7px',
                        },
                      },
                      children: output.data_type,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          display: 'block',
                          fontWeight: 'normal',
                        },
                      },
                      children: output.description,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          display: 'block',
                          fontWeight: 'normal',
                        },
                      },
                      children: output.example ? `e.g. ${output.example}` : '',
                    }, ],
                  }, {
                    component: 'span',
                    props: {
                      style: {
                        flex: 'none',
                        fontWeight: 'normal',
                      },
                    },
                    children: [ {
                      component: 'ResponsiveButton',
                      props: {
                        onClick: 'func:window.closeModalAndCreateNewModal',
                        onclickProps: {
                          title: 'Create New Variable',
                          pathname: '/decision/variables/create',
                        },
                      },
                      children: 'Create New Variable',
                    }, ],
                  }, ]
                  : [ {
                    component: 'div',
                    children: [ {
                      component: 'div',
                      children: [ {
                        component: 'span',
                        children: output.display_name,
                      }, {
                        component: 'span',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            fontWeight: 'normal',
                            color: '#ccc',
                            marginLeft: '7px',
                          },
                        },
                        children: output.data_type,
                      },
                      ],
                    }, {
                      component: 'div',
                      props: {
                        style: {
                          fontWeight: 'normal',
                        },
                      },
                      children: output.description,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          display: 'block',
                          fontWeight: 'normal',
                        },
                      },
                      children: output.example ? `e.g. ${output.example}` : '',
                    },
                    ],
                  },
                  ],
              },
              'passProps': {
                'className': output.display_name.toLowerCase().replace(/[\W]+/g, '_'),
                'fluid': true,
                'selection': true,
                search: true,
              },
              'options': output.data_type === 'Number'
                ? numOutputOptions
                : output.data_type === 'Boolean'
                  ? boolOutputOptions
                  : output.data_type === 'Date'
                    ? dateOutputOptions
                    : stringOutputOptions,
            },
            ],
          };
        }).concat([ {
          'gridProps': {
            'key': randomKey(),
            'className': 'modal-footer-btns',
          },
          'formElements': [ {
            'name': 'saveRequiredVariables',
            'type': 'submit',
            'value': 'SAVE CHANGES',
            'passProps': {
              'color': 'isPrimary',
            },
            'layoutProps': {
              'style': {
                'textAlign': 'center',
              },
            },
          },
          ],
        },
        ]),
      },
    },
    ];
  }
  return req;
}

async function generateReceivedIntegrationVariablesModal(req) {
  req.controllerData = req.controllerData || {};
  let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
  if (tabname && req.controllerData.data && req.controllerData.data.modules && req.controllerData.data.modules[ tabname ] && req.query.type === 'dataintegration' && req.query.variable_type === 'output') {
    let strategy = req.controllerData.data;
    let currentSegment = strategy.modules[ tabname ];
    let outputs = currentSegment[ 0 ].outputs;
    let { numOutputOptions, boolOutputOptions, stringOutputOptions, dateOutputOptions, } = req.controllerData;

    req.controllerData.receivedVariablesModal = [ {
      'component': 'ResponsiveForm',
      'thisprops': {},
      'asyncprops': {},
      hasWindowFunc: true,
      'props': {
        'onSubmit': {
          'url': `/decision/api/standard_strategies/${strategy._id.toString()}/edit_integration_variables?variables=required&variable_type=output`,
          'errorCallback': 'func:this.props.createNotification',
          'options': {
            'method': 'PUT',
          },
          successCallback: [ 'func:this.props.refresh', 'func:this.props.hideModal', 'func:this.props.createNotification', ],
          successProps: [ null, 'last', {
            type: 'success',
            text: 'Changes saved successfully!',
            timeout: 10000,
          },
          ],
        },
        formdata: outputs.reduce((acc, curr, idx) => {
          acc[ `variables.${idx}.output_variable` ] = curr.output_variable ? curr.output_variable : '';
          return acc;
        }, {}),
        'formgroups': outputs.map((output, idx) => {
          return {
            'gridProps': {
              'key': randomKey(),
            },
            'formElements': [ {
              'type': 'dropdown',
              'name': `variables.${idx}.output_variable`,
              customLabel: {
                component: 'span',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'flex-end',
                  },
                },
                children: idx === 0
                  ? [ {
                    component: 'span',
                    props: {
                      style: {
                        flex: '1 1 auto',
                      },
                    },
                    children: [ {
                      component: 'span',
                      children: output.display_name,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          fontStyle: 'italic',
                          fontWeight: 'normal',
                          color: '#ccc',
                          marginLeft: '7px',
                        },
                      },
                      children: output.data_type,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          display: 'block',
                          fontWeight: 'normal',
                        },
                      },
                      children: output.description,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          display: 'block',
                          fontWeight: 'normal',
                        },
                      },
                      children: output.example ? `e.g. ${output.example}` : '',
                    }, ],
                  }, {
                    component: 'span',
                    props: {
                      style: {
                        flex: 'none',
                        fontWeight: 'normal',
                      },
                    },
                    children: [ {
                      component: 'ResponsiveButton',
                      props: {
                        onClick: 'func:window.closeModalAndCreateNewModal',
                        onclickProps: {
                          title: 'Create New Variable',
                          pathname: '/decision/variables/create',
                        },
                      },
                      children: 'Create New Variable',
                    }, ],
                  }, ]
                  : [ {
                    component: 'div',
                    children: [ {
                      component: 'div',
                      children: [ {
                        component: 'span',
                        children: output.display_name,
                      }, {
                        component: 'span',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            fontWeight: 'normal',
                            color: '#ccc',
                            marginLeft: '7px',
                          },
                        },
                        children: output.data_type,
                      },
                      ],
                    }, {
                      component: 'div',
                      props: {
                        style: {
                          fontWeight: 'normal',
                        },
                      },
                      children: output.description,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          display: 'block',
                          fontWeight: 'normal',
                        },
                      },
                      children: output.example ? `e.g. ${output.example}` : '',
                    },
                    ],
                  },
                  ],
              },
              'passProps': {
                'className': output.api_name.toLowerCase().replace(/[\W]+/g, '_'),
                'fluid': true,
                'selection': true,
                search: true,
              },
              'options': output.data_type === 'Number'
                ? numOutputOptions
                : output.data_type === 'Boolean'
                  ? boolOutputOptions
                  : output.data_type === 'Date'
                    ? dateOutputOptions
                    : stringOutputOptions,
            },
            ],
          };
        }).concat([ {
          'gridProps': {
            'key': randomKey(),
            'className': 'modal-footer-btns',
          },
          'formElements': [ {
            'name': 'saveRequiredVariables',
            'type': 'submit',
            'value': 'SAVE CHANGES',
            'passProps': {
              'color': 'isPrimary',
            },
            'layoutProps': {
              'style': {
                'textAlign': 'center',
              },
            },
          },
          ],
        },
        ]),
      },
    },
    ];
  }
  return req;
}

async function generateRequiredIntegrationVariablesModal(req) {
  req.controllerData = req.controllerData || {};
  let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
  if (tabname && req.controllerData.data && req.controllerData.data.modules && req.controllerData.data.modules[ tabname ] && req.query.type === 'dataintegration' && req.query.variable_type === 'input') {
    let strategy = req.controllerData.data;
    let currentSegment = strategy.modules[ tabname ];
    let inputs = currentSegment[ 0 ].inputs;
    let { numInputOptions, boolInputOptions, stringInputOptions, dateInputOptions, } = req.controllerData;
    req.controllerData.requiredVariablesModal = [ {
      'component': 'ResponsiveForm',
      'thisprops': {},
      'asyncprops': {},
      hasWindowFunc: true,
      'props': {
        'onSubmit': {
          'url': `/decision/api/standard_strategies/${strategy._id.toString()}/edit_integration_variables?variables=required&variable_type=input`,
          'errorCallback': 'func:this.props.createNotification',
          'options': {
            'method': 'PUT',
          },
          successCallback: [ 'func:this.props.refresh', 'func:this.props.hideModal', 'func:this.props.createNotification', ],
          successProps: [ null, 'last', {
            type: 'success',
            text: 'Changes saved successfully!',
            timeout: 10000,
          },
          ],
        },
        formdata: inputs.reduce((acc, curr, idx) => {
          acc[ `variables.${idx}.input_variable` ] = curr.input_variable ? curr.input_variable : '';
          acc[ `variables.${idx}.input_type` ] = curr.input_type ? curr.input_type : 'variable';
          return acc;
        }, {}),
        'formgroups': inputs.map((input, idx) => {
          return {
            'gridProps': {
              'key': randomKey(),
            },
            'formElements': [ {
              'layoutProps': {
                style: {
                  display: [ 'variable', undefined, ].indexOf(input.input_type) !== -1 ? 'block' : 'none',
                },
              },
              'type': 'dropdown',
              'name': `variables.${idx}.input_variable`,
              customLabel: {
                component: 'span',
                children: [ {
                  component: 'div',
                  children: [ {
                    component: 'span',
                    children: input.display_name,
                  }, {
                    component: 'span',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        fontWeight: 'normal',
                        color: '#ccc',
                        marginLeft: '7px',
                      },
                    },
                    children: input.data_type,
                  },
                  ],
                }, {
                  component: 'div',
                  props: {
                    style: {
                      fontWeight: 'normal',
                    },
                  },
                  children: input.description,
                }, {
                  component: 'div',
                  props: {
                    style: {
                      fontWeight: 'normal',
                    },
                  },
                  children: input.example ? `e.g. ${input.example}` : '',
                },
                ],
              },
              'passProps': {
                'className': input.display_name.toLowerCase().replace(/[\W]+/g, '_'),
                'fluid': true,
                'selection': true,
                search: true,
              },
              'options': input.data_type === 'Number'
                ? numInputOptions
                : input.data_type === 'Boolean'
                  ? boolInputOptions
                  : input.data_type === 'Date'
                    ? dateInputOptions
                    : stringInputOptions,
            },
            input.data_type === 'Boolean'
              ? {
                'layoutProps': {
                  style: {
                    display: [ 'value', ].indexOf(input.input_type) !== -1 ? 'block' : 'none',
                  },
                },
                'type': 'dropdown',
                'name': `variables.${idx}.input_variable`,
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'div',
                    children: [ {
                      component: 'span',
                      children: input.display_name,
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          fontStyle: 'italic',
                          fontWeight: 'normal',
                          color: '#ccc',
                          marginLeft: '7px',
                        },
                      },
                      children: input.data_type,
                    },
                    ],
                  }, {
                    component: 'div',
                    props: {
                      style: {
                        fontWeight: 'normal',
                      },
                    },
                    children: input.description,
                  }, {
                    component: 'div',
                    props: {
                      style: {
                        fontWeight: 'normal',
                      },
                    },
                    children: input.example ? `e.g. ${input.example}` : '',
                  },
                  ],
                },
                'passProps': {
                  'className': input.display_name.toLowerCase().replace(/[\W]+/g, '_'),
                  'fluid': true,
                  'selection': true,
                  search: true,
                },
                'options': [ { 'label': ' ', 'value': '', }, { 'label': 'true', 'value': 'true', }, { 'label': 'false', 'value': 'false', }, ],
              }
              : input.data_type === 'Date'
                ? {
                  type: 'singleDatePicker',
                  'name': `variables.${idx}.input_variable`,
                  leftIcon: 'fas fa-calendar-alt',
                  customLabel: {
                    component: 'span',
                    children: [ {
                      component: 'div',
                      children: [ {
                        component: 'span',
                        children: input.display_name,
                      }, {
                        component: 'span',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            fontWeight: 'normal',
                            color: '#ccc',
                            marginLeft: '7px',
                          },
                        },
                        children: input.data_type,
                      },
                      ],
                    }, {
                      component: 'div',
                      props: {
                        style: {
                          fontWeight: 'normal',
                        },
                      },
                      children: input.description,
                    }, {
                      component: 'div',
                      props: {
                        style: {
                          fontWeight: 'normal',
                        },
                      },
                      children: input.example ? `e.g. ${input.example}` : '',
                    },
                    ],
                  },
                  'layoutProps': {
                    style: {
                      display: input.input_type === 'value' ? 'block' : 'none',
                    },
                    'className': input.display_name.toLowerCase().replace(/[\W]+/g, '_'),
                  },
                  passProps: {
                    hideKeyboardShortcutsPanel: true,
                  },
                }
                : {
                  'type': 'text',
                  'name': `variables.${idx}.input_variable`,
                  customLabel: {
                    component: 'span',
                    children: [ {
                      component: 'div',
                      children: [ {
                        component: 'span',
                        children: input.display_name,
                      }, {
                        component: 'span',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            fontWeight: 'normal',
                            color: '#ccc',
                            marginLeft: '7px',
                          },
                        },
                        children: input.data_type,
                      },
                      ],
                    }, {
                      component: 'div',
                      props: {
                        style: {
                          fontWeight: 'normal',
                        },
                      },
                      children: input.description,
                    }, {
                      component: 'div',
                      props: {
                        style: {
                          fontWeight: 'normal',
                        },
                      },
                      children: input.example ? `e.g. ${input.example}` : '',
                    },
                    ],
                  },
                  'layoutProps': {
                    style: {
                      display: input.input_type === 'value' ? 'block' : 'none',
                    },
                  },
                  passProps: {
                    'className': input.display_name.toLowerCase().replace(/[\W]+/g, '_'),
                  },
                },
            {
              'layoutProps': {
                size: 'is4',
                style: {
                  marginLeft: '7px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: 'flex-end',
                  fontWeight: 'normal',
                },
              },
              customOnChange: 'func:window.requiredVariablesModal',
              'type': 'dropdown',
              customLabel: (idx === 0)
                ? {
                  component: 'ResponsiveButton',
                  props: {
                    onClick: 'func:window.closeModalAndCreateNewModal',
                    onclickProps: {
                      title: 'Create New Variable',
                      pathname: '/decision/variables/create',
                    },
                  },
                  children: 'Create New Variable',
                }
                : 'Input Type',
              labelProps: (idx === 0)
                ? {
                  style: {
                    textAlign: 'right',
                    fontWeight: 'normal',
                  },
                }
                : {
                  style: {
                    visibility: 'hidden',
                  },
                },
              'name': `variables.${idx}.input_type`,
              'passProps': {
                'className': input.display_name.toLowerCase().replace(/[\W]+/g, '_'),
                'fluid': true,
                'selection': true,
              },
              'options': [ {
                'label': 'Variable',
                'value': 'variable',
              },
              {
                'label': 'Value',
                'value': 'value',
              },
              ],
            },
            ],
          };
        }).concat([ {
          'gridProps': {
            'key': randomKey(),
            'className': 'modal-footer-btns',
          },
          'formElements': [ {
            'name': 'saveRequiredVariables',
            'type': 'submit',
            'value': 'SAVE CHANGES',
            'passProps': {
              'color': 'isPrimary',
            },
            'layoutProps': {
              'style': {
                'textAlign': 'center',
              },
            },
          }, ],
        }, ]),
      },
    }, ];
  }
  return req;
}

function generateStrategyModuleDropdown(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      if (req.controllerData.data && req.controllerData.data.strategies.length) {
        let strategies = req.controllerData.data.strategies;
        let formoptions = strategies.reduce((returnData, strategy, idx) => {
          if (strategy.module_run_order && strategy.module_run_order.length) {
            let formattedModules = strategy.module_run_order.map((md, i) => {
              let module_name = md.display_name || `Module ${i + 1}`;
              let moduleArr = strategy.modules[ md.lookup_name ];
              return {
                label: `${strategy.display_name} | ${module_name}`,
                value: JSON.stringify({
                  module: strategy.modules[ md.lookup_name ],
                  description: md.description,
                  display_name: md.display_name,
                  active: md.active,
                  name: md.name,
                  type: md.type,
                  lookup_name: md.lookup_name,
                }),
              };
            });
            returnData.push(...formattedModules);
            return returnData;
          } else {
            return returnData;
          }
        }, []);
        req.controllerData.data.formoptions = {
          copymodule: formoptions,
        };
      }
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Populates variable dropdown to be displayed and selected from on a rule or calculationset
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with populated variables dropdown on req.controllerData
  */
function generateVariableDropdown(req) {
  return new Promise((resolve, reject) => {
    if (req.query.init || req.query.type === 'calculations') {
      const Variable = periodic.datas.get('standard_variable');
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : null;
      Variable.model.find({ organization, })
        .then(variables => {
          let variableDropdown;
          let outputDropdown = [];
          if (req.params && (req.params.type === 'assignments' || req.params.type === 'calculations' || req.params.type === 'output')) {
            variableDropdown = variables.filter(variable => variable.type === 'Output').map(variable => ({ label: variable.display_title, value: variable._id, })).sort((a, b) => (a.label > b.label) ? 1 : -1);
          } else {
            outputDropdown = variables.filter(variable => variable.type === 'Output').map(variable => ({ label: variable.display_title, value: variable._id, })).sort((a, b) => (a.label > b.label) ? 1 : -1);
            variableDropdown = variables.map(variable => ({ label: variable.display_title, value: variable._id, })).sort((a, b) => (a.label > b.label) ? 1 : -1);
          }
          variableDropdown.unshift({
            label: ' ',
            value: '',
            disabled: true,
          });
          req.controllerData.data.variable_types = variables.reduce((collection, variable) => {
            variable = variable.toJSON ? variable.toJSON() : variable;
            collection[ variable._id.toString() ] = variable.data_type;
            return collection;
          }, {});
          req.controllerData.data = Object.assign({}, {
            'rule_type': '',
            'variable_types': {},
            'rule*0*state_property_attribute': '',
          }, req.controllerData.data);
          req.controllerData.formoptions = {
            state_property_attribute: [],
            output_variables: [],
          };
          return resolve(req);
        })
        .catch(reject);
    } else {
      return resolve(req);
    }

  });
}

/**
 * Checks if string is valid JavaScript when converted to a function
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with populated variables dropdown on req.controllerData
  */
function checkIfValidJavaScript(req) {
  return new Promise((resolve, reject) => {
    if (req.body && req.body.type === 'calculations') {
      let javascriptString = 'return ' + req.body[ 'rule*0*state_property_attribute_value_comparison' ];
      try {
        new Function(javascriptString);
      } catch (e) {
        req.error = 'There is a syntax error in your calculation. If you continue to experience this issue, please contact DigiFi Support.';
        return resolve(req);
      }
      return resolve(req);
    } else {
      return resolve(req);
    }
  });
}

function stageStrategyDecisionProcessUpdate(req) {
  return new Promise((resolve, reject) => {
    const Strategy = periodic.datas.get('standard_strategy');
    const DataIntegration = periodic.datas.get('standard_dataintegration');
    const MLModel = periodic.datas.get('standard_mlmodel');
    const OCRDocument = periodic.datas.get('standard_ocrdocument');
    const TemplateDocument = periodic.datas.get('standard_templatedocument');
    let user = req.user;
    let strat;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    Strategy.load({ query: { _id: req.params.id, organization, }, })
      .then(strategy => {
        strat = strategy;
        if (req.query.method === 'create' && req.body.type === 'dataintegration') {
          return DataIntegration.load({ query: { _id: req.body.integration_name, }, population: 'vm_parser' });
        } else if (req.query.method === 'create' && req.body.type === 'artificialintelligence') {
          return MLModel.load({ query: { _id: req.body.model_name, }, });
        } else {
          return null;
        }
      })
      .then(result => {
        let strategy = strat.toJSON ? strat.toJSON() : strat;
        let inputs, outputs;
        result = (result && result.toJSON) ? result.toJSON() : result;
        if (req.query.method === 'create') {
          strategy.module_run_order = strategy.module_run_order || [];
          strategy.modules = strategy.modules || {};
          if (req.body.type === 'dataintegration' && result) {
            req.body.name = result.name;
            inputs = [];
            outputs = [];
            result.inputs.forEach(variable => {
              let input_variable = (variable.input_variable && variable.input_variable._id) ? variable.input_variable._id.toString() : '';
              inputs.push({ data_type: variable.data_type, input_variable, description: variable.description, example: variable.example, input_name: variable.input_name, display_name: variable.display_name, input_type: variable.input_type || 'variable', });
            });
            result.outputs.forEach(variable => {
              let output_variable = (variable.output_variable && variable.output_variable._id) ? variable.output_variable._id.toString() : '';
              outputs.push({ api_name: variable.api_name, display_name: variable.display_name, description: variable.description, example: variable.example, data_type: variable.data_type, output_variable, });
            });
            req.body.dataintegration_id = req.body.integration_name;
            if (result.vm_parser && Array.isArray(result.vm_parser.variables)) {
              result.vm_parser.variables.forEach(variable => {
                let vm_parser_variable = { vm_parser: true, api_name: variable.api_name, display_name: variable.display_name, description: variable.description, example: variable.example, data_type: variable.data_type, output_variable: '', };
                outputs.push(vm_parser_variable);
              });
            }
          }

          if (req.body.type === 'artificialintelligence' && result) {
            if (result.datasource.strategy_data_schema) {
              let ml_input_schema = result.datasource.included_columns || result.datasource.strategy_data_schema;
              let modelMap = JSON.parse(ml_input_schema);
              inputs = [];
              outputs = (result.industry)
                ? [ {
                  display_name: 'DigiFi Score',
                  data_type: 'Number',
                  output_type: 'variable',
                }, {
                  display_name: 'Annual Default Rate',
                  data_type: 'Number',
                  output_type: 'variable',
                }, ]
                : [ {
                  display_name: 'Prediction',
                  data_type: (result.type === 'binary' || result.type === 'regression') ? 'Number' : 'String',
                  output_type: 'variable',
                }, ];
              for (let i = 1; i < 6; i++) {
                outputs.push({
                  display_name: `Top Increase Factor ${i}`,
                  data_type: 'String',
                  output_type: 'variable',
                })
              }
              for (let i = 1; i < 6; i++) {
                outputs.push({
                  display_name: `Top Decrease Factor ${i}`,
                  data_type: 'String',
                  output_type: 'variable',
                })
              }

              Object.keys(modelMap).forEach((key, idx) => {
                if (key !== 'historical_result') {
                  let { variable_id, data_type, } = modelMap[ key ];
                  inputs.push({ model_variable_name: key, system_variable_id: variable_id, data_type, input_type: 'variable', });
                }
              });
            }
            req.body.real_time_prediction_id = result.real_time_prediction_id;
            req.body.real_time_endpoint = result.real_time_endpoint;
            req.body.model_type = result.type;
            req.body.name = result.display_name;
            req.body.description = result.description;
            req.body.model_id = result._id.toString();
          }

          // if (req.body.type === 'documentocr' && result) {
          //   req.body.name = result.name;
          //   outputs = [];
          //   result.outputs.forEach(variable => {
          //     outputs.push({ output_name: variable.output_name, display_name: variable.display_name, description: variable.description, data_type: variable.data_type, output_type: 'variable', output_variable: '', });
          //   });
          //   req.body.name = result.display_name;
          //   req.body.description = result.description;
          // }

          if (req.body.type === 'documentcreation' && result) {
            req.body.name = result.name;
            inputs = [];
            outputs = [];
            // result.inputs.forEach(variable => {
            //   inputs.push({ input_name: variable.input_name, display_name: variable.display_name, description: variable.description, data_type: variable.data_type, input_type: 'variable', input_variable: '', field_type: variable.field_type, });
            // });
            req.body.description = result.description;
            req.body.filename = result.filename;
          }
          let clean_name = req.body.name.replace(/\s+/g, '_').toLowerCase();
          let new_module_name = `${clean_name}_${req.body.type}_${strategy.module_run_order.length}`;
          let new_module = (req.body.type === 'artificialintelligence')
            ? {
              [ new_module_name ]: [ {
                name: clean_name,
                description: req.body.description,
                display_name: req.body.name,
                type: req.body.type,
                real_time_prediction_id: req.body.real_time_prediction_id,
                real_time_endpoint: req.body.real_time_endpoint,
                model_type: req.body.model_type,
                mlmodel_id: req.body.model_id,
                conditions: [],
                inputs: inputs || null,
                outputs: outputs || null,
                ruleset: Array.isArray(req.body.ruleset) ? req.body.ruleset : [],
              }, ],
            }
            : (req.body.type === 'documentcreation') ? {
              [ new_module_name ]: [ {
                name: clean_name,
                description: req.body.description,
                display_name: req.body.name,
                type: req.body.type,
                conditions: [],
                fileurl: null,
                filename: null,
                inputs: inputs || null,
                outputs: outputs || null,
                ruleset: Array.isArray(req.body.ruleset) ? req.body.ruleset : [],
              }, ],
            }
              :
              {
                [ new_module_name ]: [ {
                  name: clean_name,
                  description: req.body.description,
                  display_name: req.body.name,
                  dataintegration_id: req.body.dataintegration_id || null,
                  type: req.body.type,
                  conditions: [],
                  inputs: inputs || null,
                  outputs: outputs || null,
                  ruleset: Array.isArray(req.body.ruleset) ? req.body.ruleset : [],
                }, ],
              };
          if (req.body.type === 'scorecard') new_module[ new_module_name ][ 0 ].initial_score = 0;
          strategy.module_run_order.push({
            type: req.body.type,
            name: clean_name,
            active: true,
            display_name: req.body.name,
            lookup_name: new_module_name,
            description: req.body.description,
          });

          strategy.modules = Object.assign({}, strategy.modules, new_module);
          req.body = strategy;
          resolve(req);
        } else {
          resolve(req);
        }
      })
      .catch(e => {
        reject(e);
      });
  });
}

function getModuleDropdown(req) {
  return new Promise((resolve, reject) => {
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    if (req.controllerData && req.controllerData.data) {
      let [ module_name, segment_index, ] = req.headers.referer.split('/').slice(-2);
      let moduleRunOrder = req.controllerData.data.module_run_order;
      let moduleMap = req.controllerData.data.modules;
      let display_module_element = moduleRunOrder.filter(module_run_element => module_run_element.lookup_name === module_name)[ 0 ];
      req.controllerData.data = { module_name: module_name, display_module_name: display_module_element.display_name, _id: req.controllerData.data._id, redirect_index: moduleMap[ module_name ].length, };
      resolve(req);
    } else {
      resolve(req);
    }
  });
}

function generateUpdateHistoryDetail(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      let module_segment_details = req.headers.referer.split('/').slice(-2);
      let module_name = module_segment_details[ 0 ];
      let segment_index = module_segment_details[ 1 ];
      if (collection === 'strategies' && req.query && req.query.page === 'updateHistoryDetail' && req.controllerData.data.before && req.controllerData.data.after) {
        req.controllerData.data = req.controllerData.data.toJSON ? req.controllerData.data.toJSON() : req.controllerData.data;
        let change_type = req.controllerData.data.change_type;
        req.controllerData.data.change_type = DECISION_CONSTANTS.MODULE_TYPE_MAP[ change_type ];
        let currentBeforeSegment = (req.controllerData.data.before.modules && req.controllerData.data.before.modules[ module_name ] && req.controllerData.data.before.modules[ module_name ][ segment_index ])
          ? req.controllerData.data.before.modules[ module_name ][ segment_index ]
          : undefined;
        let currentAfterSegment = (req.controllerData.data.after.modules && req.controllerData.data.after.modules[ module_name ] && req.controllerData.data.after.modules[ module_name ][ segment_index ])
          ? req.controllerData.data.after.modules[ module_name ][ segment_index ]
          : undefined;
        let ruleMap = req.controllerData.ruleMap;
        let strategy_id = req.params.id;
        let change_id = req.controllerData.data.change_id;
        let before_module_run_order = req.controllerData.data.before.module_run_order;
        let before_modules = req.controllerData.data.before.modules;
        let childMap = ruleMap;
        if (change_type === 'module_detail' && currentBeforeSegment && currentAfterSegment) {
          let variablesMap = req.controllerData.allVariablesMap;
          currentBeforeSegment.ruleset = currentBeforeSegment.ruleset.map(rule_id => childMap[ rule_id ]);
          currentBeforeSegment.conditions = currentBeforeSegment.conditions.map(condition_id => childMap[ condition_id ]);
          currentAfterSegment.ruleset = currentAfterSegment.ruleset.map(rule_id => childMap[ rule_id ]);
          currentAfterSegment.conditions = currentAfterSegment.conditions.map(condition_id => childMap[ condition_id ]);
          currentBeforeSegment.ruleset = currentBeforeSegment.ruleset.filter(rule => !!rule);
          currentBeforeSegment.conditions = currentBeforeSegment.conditions.filter(rule => !!rule);
          currentAfterSegment.ruleset = currentAfterSegment.ruleset.filter(rule => !!rule);
          currentBeforeSegment.ruleset = currentBeforeSegment.ruleset.map((rule, i) => {
            rule = rule.toJSON ? rule.toJSON() : rule;
            let multiple_rules = rule.multiple_rules.map(inner_rule => {
              inner_rule = inner_rule.toJSON ? inner_rule.toJSON() : inner_rule;
              return Object.assign({}, inner_rule, {
                state_property_attribute: (inner_rule.static_state_property_attribute) ? inner_rule.static_state_property_attribute : (inner_rule.state_property_attribute && inner_rule.state_property_attribute.display_title) ? inner_rule.state_property_attribute.display_title : '',
                state_property_attribute_value_comparison: (inner_rule.condition_test === 'RANGE')
                  ? `${helpers.checkIfVariable({ value: inner_rule.state_property_attribute_value_minimum, type: inner_rule.state_property_attribute_value_minimum_type, variablesMap, })} to ${helpers.checkIfVariable({ value: inner_rule.state_property_attribute_value_maximum, type: inner_rule.state_property_attribute_value_maximum_type, variablesMap, })}`
                  : `${helpers.checkIfVariable({ value: inner_rule.state_property_attribute_value_comparison, type: inner_rule.state_property_attribute_value_comparison_type, variablesMap, test: inner_rule.condition_test, })}`,
                condition_test: COMPARATOR_MAP[ inner_rule.condition_test ],
              });
            });

            let condition_outputs = (rule.type === 'output')
              ? rule.condition_output.map(output => Object.assign({}, output, {
                value: (output.value_type === 'variable') ? `${output.variable_display_title} = ${variablesMap[ output.value ].display_title}`
                  : `${output.variable_display_title} = ${(typeof output.value === 'string' && moment(output.value, moment.ISO_8601, true).isValid()) ? transformhelpers.formatDateNoTime(output.value, req.user.time_zone) : output.value}`,
              }))
              : rule.condition_output.map(output => Object.assign({}, output, {
                value: (output.value_type === 'variable')
                  ? variablesMap[ output.value ].display_title
                  : (typeof output.value === 'string' && moment(output.value, moment.ISO_8601, true).isValid())
                    ? transformhelpers.formatDateNoTime(output.value, req.user.time_zone)
                    : output.value,
              }));

            return Object.assign({}, rule, {
              index: i,
              display_name: {
                component: 'ResponsiveButton',
                children: rule.display_name,
                props: {
                  aProps: {},
                  'onclickBaseUrl': `/decision/rules/${rule.type}/${rule._id}/detail`,
                },
              },
              condition_output_display: (condition_outputs.length)
                ? helpers.formatDataTableRulesTableCellNoAndOr({ rules: condition_outputs, field_name: 'value', })
                : '',
              combined_value_comparison_property: helpers.formatVariableComparisonValueTableCell({
                rules: multiple_rules,
                currentRule: rule,
                field_name: [ 'state_property_attribute', 'condition_test', 'state_property_attribute_value_comparison', ],
              }),
              state_property_attribute: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCell({ currentRule: rule, rules: multiple_rules, field_name: 'state_property_attribute', })
                : rule.state_property_attribute,
              state_property_attribute_value_comparison: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCellNoAndOr({ rules: multiple_rules, field_name: 'state_property_attribute_value_comparison', })
                : rule.state_property_attribute_value_comparison,
              condition_test: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCellNoAndOr({ rules: multiple_rules, field_name: 'condition_test', })
                : rule.condition_test,
              strategy_id: parsedUrl[ 1 ],
              multiple_rules,
            });
          });
          currentAfterSegment.ruleset = currentAfterSegment.ruleset.map((rule, i) => {
            // let rule = ruleIdMap[ rule_id ];
            rule = rule.toJSON ? rule.toJSON() : rule;
            let multiple_rules = rule.multiple_rules.map(inner_rule => {
              inner_rule = inner_rule.toJSON ? inner_rule.toJSON() : inner_rule;
              return Object.assign({}, inner_rule, {
                state_property_attribute: (inner_rule.static_state_property_attribute) ? inner_rule.static_state_property_attribute : (inner_rule.state_property_attribute && inner_rule.state_property_attribute.display_title) ? inner_rule.state_property_attribute.display_title : '',
                state_property_attribute_value_comparison: (inner_rule.condition_test === 'RANGE')
                  ? `${helpers.checkIfVariable({ value: inner_rule.state_property_attribute_value_minimum, type: inner_rule.state_property_attribute_value_minimum_type, variablesMap, })} to ${helpers.checkIfVariable({ value: inner_rule.state_property_attribute_value_maximum, type: inner_rule.state_property_attribute_value_maximum_type, variablesMap, })}`
                  : `${helpers.checkIfVariable({ value: inner_rule.state_property_attribute_value_comparison, type: inner_rule.state_property_attribute_value_comparison_type, variablesMap, test: inner_rule.condition_test, })}`,
                condition_test: COMPARATOR_MAP[ inner_rule.condition_test ],
              });
            });
            let condition_outputs = (rule.type === 'output')
              ? rule.condition_output.map(output => Object.assign({}, output, {
                value: (output.value_type === 'variable') ? `${output.variable_display_title} = ${variablesMap[ output.value ].display_title}`
                  : `${output.variable_display_title} = ${(typeof output.value === 'string' && moment(output.value, moment.ISO_8601, true).isValid()) ? transformhelpers.formatDateNoTime(output.value, req.user.time_zone) : output.value}`,
              }))
              : rule.condition_output.map(output => Object.assign({}, output, {
                value: (output.value_type === 'variable')
                  ? variablesMap[ output.value ].display_title
                  : (typeof output.value === 'string' && moment(output.value, moment.ISO_8601, true).isValid())
                    ? transformhelpers.formatDateNoTime(output.value, req.user.time_zone)
                    : output.value,
              }));

            return Object.assign({}, rule, {
              index: i,
              display_name: {
                component: 'ResponsiveButton',
                children: rule.display_name,
                props: {
                  aProps: {},
                  'onclickBaseUrl': `/decision/rules/${rule.type}/${rule._id}/detail`,
                },
              },
              condition_output_display: (condition_outputs.length)
                ? helpers.formatDataTableRulesTableCellNoAndOr({ rules: condition_outputs, field_name: 'value', })
                : '',
              combined_value_comparison_property: helpers.formatVariableComparisonValueTableCell({
                rules: multiple_rules,
                currentRule: rule,
                field_name: [ 'state_property_attribute', 'condition_test', 'state_property_attribute_value_comparison', ],
              }),
              state_property_attribute: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCell({ currentRule: rule, rules: multiple_rules, field_name: 'state_property_attribute', })
                : rule.state_property_attribute,
              state_property_attribute_value_comparison: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCellNoAndOr({ rules: multiple_rules, field_name: 'state_property_attribute_value_comparison', })
                : rule.state_property_attribute_value_comparison,
              condition_test: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCellNoAndOr({ rules: multiple_rules, field_name: 'condition_test', })
                : rule.condition_test,
              strategy_id: parsedUrl[ 1 ],
              multiple_rules,
            });
          });
          currentAfterSegment.conditions = currentAfterSegment.conditions.filter(rule => !!rule);
          currentBeforeSegment.conditions = currentBeforeSegment.conditions.map((rule, i) => {
            // let rule = ruleIdMap[ rule_id ];
            rule = rule.toJSON ? rule.toJSON() : rule;
            let multiple_rules = rule.multiple_rules.map(rule => Object.assign({}, rule, {
              state_property_attribute: (rule.state_property_attribute && rule.state_property_attribute.display_title) ? rule.state_property_attribute.display_title : '',
              state_property_attribute_value_comparison: (rule.condition_test === 'RANGE')
                ? `${helpers.checkIfVariable({ value: rule.state_property_attribute_value_minimum, type: rule.state_property_attribute_value_minimum_type, variablesMap, })} to ${helpers.checkIfVariable({ value: rule.state_property_attribute_value_maximum, type: rule.state_property_attribute_value_maximum_type, variablesMap, })}`
                : `${helpers.checkIfVariable({ value: rule.state_property_attribute_value_comparison, type: rule.state_property_attribute_value_comparison_type, variablesMap, test: rule.condition_test, })}`,
              condition_test: COMPARATOR_MAP[ rule.condition_test ],
            }));
            return Object.assign({}, rule, {
              index: i,
              display_name: {
                component: 'ResponsiveButton',
                children: rule.display_name,
                props: {
                  aProps: {},
                  'onclickBaseUrl': `/decision/rules/${rule.type}/${rule._id}/detail`,
                },
              },
              combined_value_comparison_property: helpers.formatVariableComparisonValueTableCell({
                rules: multiple_rules,
                currentRule: rule,
                field_name: [ 'state_property_attribute', 'condition_test', 'state_property_attribute_value_comparison', ],
              }),
              state_property_attribute: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCell({ currentRule: rule, rules: multiple_rules, field_name: 'state_property_attribute', })
                : rule.state_property_attribute,
              state_property_attribute_value_comparison: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCellNoAndOr({ rules: multiple_rules, field_name: 'state_property_attribute_value_comparison', })
                : rule.state_property_attribute_value_comparison,
              condition_test: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCellNoAndOr({ rules: multiple_rules, field_name: 'condition_test', })
                : rule.condition_test,
              strategy_id: parsedUrl[ 1 ],
              multiple_rules,
            });
          });
          currentAfterSegment.conditions = currentAfterSegment.conditions.map((rule, i) => {
            // let rule = ruleIdMap[ rule_id ];
            rule = rule.toJSON ? rule.toJSON() : rule;
            let multiple_rules = rule.multiple_rules.map(rule => Object.assign({}, rule, {
              state_property_attribute: (rule.state_property_attribute && rule.state_property_attribute.display_title) ? rule.state_property_attribute.display_title : '',
              state_property_attribute_value_comparison: (rule.condition_test === 'RANGE')
                ? `${helpers.checkIfVariable({ value: rule.state_property_attribute_value_minimum, type: rule.state_property_attribute_value_minimum_type, variablesMap, })} to ${helpers.checkIfVariable({ value: rule.state_property_attribute_value_maximum, type: rule.state_property_attribute_value_maximum_type, variablesMap, })}`
                : `${helpers.checkIfVariable({ value: rule.state_property_attribute_value_comparison, type: rule.state_property_attribute_value_comparison_type, test: rule.condition_test, variablesMap, })}`,
              condition_test: COMPARATOR_MAP[ rule.condition_test ],
            }));
            return Object.assign({}, rule, {
              index: i,
              display_name: {
                component: 'ResponsiveButton',
                children: rule.display_name,
                props: {
                  aProps: {},
                  'onclickBaseUrl': `/decision/rules/${rule.type}/${rule._id}/detail`,
                },
              },
              combined_value_comparison_property: helpers.formatVariableComparisonValueTableCell({
                rules: multiple_rules,
                currentRule: rule,
                field_name: [ 'state_property_attribute', 'condition_test', 'state_property_attribute_value_comparison', ],
              }),
              state_property_attribute: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCell({ currentRule: rule, rules: multiple_rules, field_name: 'state_property_attribute', })
                : rule.state_property_attribute,
              state_property_attribute_value_comparison: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCellNoAndOr({ rules: multiple_rules, field_name: 'state_property_attribute_value_comparison', })
                : rule.state_property_attribute_value_comparison,
              condition_test: (multiple_rules.length)
                ? helpers.formatDataTableRulesTableCellNoAndOr({ rules: multiple_rules, field_name: 'condition_test', })
                : rule.condition_test,
              strategy_id: parsedUrl[ 1 ],
              multiple_rules,
            });
          });
          let before_inputs, before_outputs, after_inputs, after_outputs;
          if (currentBeforeSegment.type === 'dataintegration' && currentAfterSegment.type === 'dataintegration') {
            before_inputs = currentBeforeSegment.inputs.map(input => {
              if (variablesMap[ input.input_variable ]) {
                return {
                  input_variable: variablesMap[ input.input_variable ].display_title,
                  data_type: input.data_type,
                  display_name: input.display_name,
                };
              } else return input;
            });
            before_outputs = currentBeforeSegment.outputs.map(output => {
              if (variablesMap[ output.output_variable ]) {
                return {
                  output_variable: variablesMap[ output.output_variable ].display_title,
                  data_type: output.data_type,
                  api_name: output.api_name,
                };
              } else return output;
            });
            after_inputs = currentAfterSegment.inputs.map(input => {
              if (variablesMap[ input.input_variable ]) {
                return {
                  input_variable: variablesMap[ input.input_variable ].display_title,
                  data_type: input.data_type,
                  display_name: input.display_name,
                };
              } else return input;
            });
            after_outputs = currentAfterSegment.outputs.map(output => {
              if (variablesMap[ output.output_variable ]) {
                return {
                  output_variable: variablesMap[ output.output_variable ].display_title,
                  data_type: output.data_type,
                  api_name: output.api_name,
                };
              } else return output;
            });
          }
          if (currentBeforeSegment.type === 'artificialintelligence' && currentAfterSegment.type === 'artificialintelligence') {
            before_inputs = currentBeforeSegment.inputs.map(input => {
              if (variablesMap[ input.system_variable_id ]) {
                return {
                  system_variable_id: variablesMap[ input.system_variable_id ].display_title,
                  data_type: input.data_type,
                  model_variable_name: input.model_variable_name,
                };
              } else return input;
            });
            after_inputs = currentAfterSegment.inputs.map(input => {
              if (variablesMap[ input.system_variable_id ]) {
                return {
                  system_variable_id: variablesMap[ input.system_variable_id ].display_title,
                  data_type: input.data_type,
                  model_variable_name: input.model_variable_name,
                };
              } else return input;
            });
          }
          if (currentBeforeSegment.type === 'documentcreation' && currentAfterSegment.type === 'documentcreation') {
            currentBeforeSegment.inputs = currentBeforeSegment.inputs || [];
            currentAfterSegment.inputs = currentAfterSegment.inputs || [];
            before_inputs = currentBeforeSegment.inputs.map(input => {
              if (variablesMap[ input.input_variable ]) {
                return {
                  input_variable: variablesMap[ input.input_variable ].display_title,
                  data_type: input.data_type,
                  display_name: input.display_name,
                };
              } else return input;
            });
            after_inputs = currentAfterSegment.inputs.map(input => {
              if (variablesMap[ input.input_variable ]) {
                return {
                  input_variable: variablesMap[ input.input_variable ].display_title,
                  data_type: input.data_type,
                  display_name: input.display_name,
                };
              } else return input;
            });
          }
          req.controllerData.data.update_history_detail = ([ 'textmessage', 'email', 'requirements', 'output', 'calculations', 'assignments', 'scorecard', ].includes(currentBeforeSegment.type || currentAfterSegment.type))

            ? helpers.createStrategyUpdateHistoryDetailWithRules({ before: currentBeforeSegment, after: currentAfterSegment, })
            : (currentBeforeSegment.type === 'dataintegration' || currentBeforeSegment.type === 'artificialintelligence')
              ? helpers.createStrategyUpdateHistoryDetailWithInputsAndOutputs({ before: currentBeforeSegment, after: currentAfterSegment, })
              : (currentBeforeSegment.type === 'documentocr') ? helpers.createStrategyUpdateHistoryDetailWithOutputs({ before: currentBeforeSegment, after: currentAfterSegment, })
                : helpers.createStrategyUpdateHistoryDetailWithInputs({ before: currentBeforeSegment, after: currentAfterSegment, });

          req.controllerData.data = Object.assign({}, req.controllerData.data, {
            before_ruleset: currentBeforeSegment.ruleset,
            before_inputs,
            before_outputs,
            after_inputs,
            after_outputs,
            after_ruleset: currentAfterSegment.ruleset,
            before_conditions: currentBeforeSegment.conditions,
            after_conditions: currentAfterSegment.conditions,
            formattedUpdatedAt: `${transformhelpers.formatDateNoTime(new Date(req.controllerData.data.before.updatedat), req.user.time_zone)} by ${req.controllerData.data.user.updater || req.controllerData.data.before.user.updater}`,
            _id: strategy_id,
            nav_sections: before_module_run_order.map(module_run_element => {
              return {
                title: module_run_element.display_name,
                baseURL: `/decision/strategies/${strategy_id}/update_history_detail/${change_id}/${module_run_element.lookup_name}/:index`,
                toggle: `has_${module_run_element.lookup_name}`,
              };
            }),
            toggle_data: before_module_run_order.reduce((returnData, module_run_element) => {
              returnData[ `has_${module_run_element.lookup_name}` ] = true;
              return returnData;
            }, {}),
            all_segments: before_module_run_order.reduce((returnData, module_run_element) => {
              returnData.push(before_modules[ module_run_element.lookup_name ].map((seg, index) => ({ index, name: seg.display_name, _id: seg._id, type: seg.type, })));
              return returnData;
            }, []),
            has_population: currentBeforeSegment.conditions.length ? 'on' : 0,
          });
          return resolve(req);
        } else if (collection === 'strategies' && change_type === 'process_flow') {
          req.controllerData.data.update_history_detail = helpers.createStrategyUpdateHistoryDetailWithoutRules();
          req.controllerData.data = Object.assign({}, req.controllerData.data, {
            formattedUpdatedAt: `${transformhelpers.formatDateNoTime(new Date(req.controllerData.data.before.updatedat), req.user.time_zone)} by ${req.controllerData.data.user.updater || req.controllerData.data.before.user.updater}`,
            _id: strategy_id,
          });
          return resolve(req);
        } else {
          if (req.controllerData.data.before && req.controllerData.data.before.rule_type) req.controllerData.data.display_rule_type = capitalize(req.controllerData.data.before.rule_type.toLowerCase());
          return resolve(req);
        }
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

function generateRuleMap(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      const Rule = periodic.datas.get('standard_rule');
      let ruleMap = {};
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : null;
      Rule.query({ query: { organization, }, limit: 100000 })
        .then(rules => {
          rules.forEach(rule => ruleMap[ rule._id ] = rule);
          return;
        })
        .then(() => {
          req.controllerData.ruleMap = ruleMap;
          return resolve(req);
        })
        .catch(e => reject(e));

    } catch (err) {
      return reject(err);
    }
  });
}

function generateVariableMap(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      if (collection === 'strategies' && req.query && req.query.page === 'updateHistoryDetail') {
        const Variable = periodic.datas.get('standard_variable');
        let variableMap = {};
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        Variable.model.find({ organization, })
          .then(variables => variables.forEach(variable => variableMap[ variable._id ] = variable))
          .then(() => {
            req.controllerData.variableMap = variableMap;
            return resolve(req);
          })
          .catch(e => reject(e));
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

function generateInputVariableMap(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      if (collection === 'strategies' && req.body && req.body.type === 'calculations') {
        const Variable = periodic.datas.get('standard_variable');
        let inputVariableMap = {};
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        Variable.model.find({ organization, type: 'Input', })
          .then(variables => variables.forEach(variable => inputVariableMap[ variable._id ] = variable))
          .then(() => {
            req.controllerData.inputVariableMap = inputVariableMap;
            return resolve(req);
          })
          .catch(e => reject(e));
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

function createRuleCopies(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, id, } = helpers.findCollectionNameFromReq({ req, });
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      if (req.query && req.query.method === 'copy' && req.body.copysegment) {
        req.body = JSON.parse(req.body.copysegment);
        strategytransformhelpers.copySegment({ segment: req.body, strategyid: id, copysegment_name: req.body.copysegment_name, organization, })
          .then(segment => {
            if (segment) {
              req.body.conditions = segment.conditions || [];
              req.body.ruleset = segment.ruleset || [];
              resolve(req);
            } else {
              reject(new Error('Could not find matching segment'));
            }
          })
          .catch(reject);
      } else if (req.query && req.query.method === 'copyModule' && req.body.copymodule) {
        req.body = JSON.parse(req.body.copymodule);
        return Promise.all(req.body.module.map((segment, idx) => {
          return strategytransformhelpers.copySegment({ segment: segment, strategyid: id, copysegment_name: segment.name, organization })
            .then(segment => {
              if (segment) {
                req.body.module[ idx ].conditions = segment.conditions || [];
                req.body.module[ idx ].ruleset = segment.ruleset || [];
              } else {
                reject(new Error('Could not find matching module'));
              }
            })
            .catch(reject);
        }))
          .then(() => {
            resolve(req);
          })
          .catch(reject);
      } else {
        resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

function updateMlAndVariableDependencies(req) {
  return new Promise((resolve, reject) => {
    try {
      req.body = req.body || {};
      req.controllerData = req.controllerData || {};
      if (req.err) {
        return resolve(req);
      } else if (req.query.method === 'create' && req.controllerData.type === 'artificialintelligence' && req.controllerData.required_variables && req.controllerData.mlmodel) {
        const Variable = periodic.datas.get('standard_variable');
        const MLModel = periodic.datas.get('standard_mlmodel');
        let variables = (req.controllerData.mlmodel.variables.length) ? [] : req.controllerData.required_variables.filter(variable => typeof variable === 'string');
        // MLModel.update({ id: req.controllerData.mlmodel._id.toString(), isPatch: true, updatedoc: { updatedat: new Date(), variables } }),
        Variable.update({ query: { _id: { $in: variables, }, }, multi: true, updatedoc: { updatedat: new Date(), mlmodels: [ req.controllerData.mlmodel._id.toString(), ], }, })
          .then(() => {
            delete req.controllerData.required_variables;
            delete req.controllerData.mlmodel;
            delete req.controllerData.type;
            return resolve(req);
          })
          .catch(reject);
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

function generateDocumentOCRVariablesModal(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.inputVariables && req.controllerData.outputVariables && req.query.type === 'ocrdocument') {
        let currentDoc = req.controllerData.doc;
        let outputs = currentDoc.outputs;
        let { numInputOptions, boolInputOptions, stringInputOptions, dateInputOptions, } = req.controllerData;
        req.controllerData.receivedVariablesModal = [ {
          'component': 'ResponsiveForm',
          hasWindowFunc: true,
          'props': {
            'onSubmit': {
              'url': `/optimization/api/documents/${currentDoc._id.toString()}/edit_ocrdocument_variables?type=ocrdocument`,
              'errorCallback': 'func:this.props.createNotification',
              'options': {
                'method': 'PUT',
              },
              successCallback: [ 'func:this.props.refresh', 'func:this.props.hideModal', 'func:this.props.createNotification', ],
              successProps: [ null, 'last', {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              },
              ],
            },
            formdata: outputs.reduce((acc, curr, idx) => {
              acc[ `variables.${idx}.output_variable` ] = curr.output_variable ? curr.output_variable : '';
              return acc;
            }, {}),
            'formgroups': outputs.map((output, idx) => {
              return {
                'gridProps': {
                  'key': randomKey(),
                },
                'formElements': [ {
                  'type': 'dropdown',
                  'name': `variables.${idx}.output_variable`,
                  customLabel: {
                    component: 'span',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'flex-end',
                      },
                    },
                    children: idx === 0
                      ? [ {
                        component: 'span',
                        props: {
                          style: {
                            flex: '1 1 auto',
                          },
                        },
                        children: [ {
                          component: 'span',
                          children: output.display_name,
                        }, {
                          component: 'span',
                          props: {
                            style: {
                              fontStyle: 'italic',
                              fontWeight: 'normal',
                              color: '#ccc',
                              marginLeft: '7px',
                            },
                          },
                          children: output.data_type,
                        }, {
                          component: 'span',
                          props: {
                            style: {
                              display: 'block',
                              fontWeight: 'normal',
                            },
                          },
                          children: output.description,
                        }, {
                          component: 'span',
                          props: {
                            style: {
                              display: 'block',
                              fontWeight: 'normal',
                            },
                          },
                          children: output.example ? `e.g. ${output.example}` : '',
                        }, ],
                      }, {
                        component: 'span',
                        props: {
                          style: {
                            flex: 'none',
                            fontWeight: 'normal',
                          },
                        },
                        children: [ {
                          component: 'ResponsiveButton',
                          props: {
                            onClick: 'func:window.closeModalAndCreateNewModal',
                            onclickProps: {
                              title: 'Create New Variable',
                              pathname: '/decision/variables/create',
                            },
                          },
                          children: 'Create New Variable',
                        }, ],
                      }, ]
                      : [ {
                        component: 'div',
                        children: [ {
                          component: 'div',
                          children: [ {
                            component: 'span',
                            children: output.display_name,
                          }, {
                            component: 'span',
                            props: {
                              style: {
                                fontStyle: 'italic',
                                fontWeight: 'normal',
                                color: '#ccc',
                                marginLeft: '7px',
                              },
                            },
                            children: output.data_type,
                          },
                          ],
                        }, {
                          component: 'div',
                          props: {
                            style: {
                              fontWeight: 'normal',
                            },
                          },
                          children: output.description,
                        }, {
                          component: 'span',
                          props: {
                            style: {
                              display: 'block',
                              fontWeight: 'normal',
                            },
                          },
                          children: output.example ? `e.g. ${output.example}` : '',
                        },
                        ],
                      },
                      ],
                  },
                  'passProps': {
                    'fluid': true,
                    'selection': true,
                    search: true,
                  },
                  'options': output.data_type === 'Number'
                    ? numInputOptions
                    : output.data_type === 'Boolean'
                      ? boolInputOptions
                      : output.data_type === 'Date'
                        ? dateInputOptions
                        : stringInputOptions,
                },
                ],
              };
            }).concat([ {
              'gridProps': {
                'key': randomKey(),
                'className': 'modal-footer-btns',
              },
              'formElements': [ {
                'name': 'saveRequiredVariables',
                'type': 'submit',
                'value': 'SAVE CHANGES',
                'passProps': {
                  'color': 'isPrimary',
                },
                'layoutProps': {
                  'style': {
                    'textAlign': 'center',
                  },
                },
              },
              ],
            },
            ]),
          },
        },
        ];
      }
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

function generateDocumentCreationVariablesModal(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      if (tabname && req.controllerData.data && req.controllerData.data.modules && req.controllerData.data.modules[ tabname ] && req.query.type === 'documentcreation') {
        let strategy = req.controllerData.data;
        let currentSegment = strategy.modules[ tabname ];
        let inputs = currentSegment[ 0 ].inputs;
        let { numInputOptions, boolInputOptions, stringInputOptions, dateInputOptions, } = req.controllerData;
        let requiredVariablesModalForm = utilities.views.decision.modals.document_template_required_variable;
        let variable_dropdown = req.controllerData.inputVariables.concat(req.controllerData.outputVariables).map(variable => ({ label: variable.display_title, value: variable._id.toString(), }));
        req.controllerData.requiredVariablesModal = [ requiredVariablesModalForm({ inputs, strategy, variable_dropdown, filename: currentSegment.filename, fileurl: currentSegment.fileurl, }), ];
      }
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

function populateRequiredCalculationVariables(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData.data = req.controllerData.data || {};
      if (req.controllerData.standard_rule) {
        let rule = req.controllerData.standard_rule;
        req.controllerData.required_calculation_variables = [ ...rule.calculation_inputs, ...rule.calculation_outputs, ];
        return resolve(req);
      } else {
        return resolve(req);
      }
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

async function formatStrategyGeneralInfo(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.data) {
      const strategy = req.controllerData.data;
      req.controllerData.data = {
        _id: strategy._id,
        display_title: strategy.display_title,
        version: String(strategy.version),
        status: strategy.status,
        has_modules: (strategy.module_run_order && strategy.module_run_order.length) ? true : false,
        onclickBaseUrl: (strategy.module_run_order && strategy.module_run_order.length)? `/decision/strategies/${strategy._id}/${strategy.module_run_order[ 0 ].lookup_name}/0` : '',
      };
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

module.exports = {
  checkIfValidJavaScript,
  createRuleCopies,
  checkSegmentLength,
  filterCurrentSegment,
  generateRuleDropdown,
  generateDocumentOCRVariablesModal,
  generateDocumentCreationVariablesModal,
  generateStrategySegmentDropdown,
  generateStrategyModuleDropdown,
  generateVariableFormOptions,
  generateRequiredMLVariablesModal,
  generateReceivedMLVariablesModal,
  generateRequiredIntegrationVariablesModal,
  generateReceivedIntegrationVariablesModal,
  generateVariableDropdown,
  generateOutputVariablesOptions,
  generateRuleMap,
  generateInputVariableMap,
  generateVariableMap,
  generateUpdateHistoryDetail,
  getModuleDropdown,
  populateSegment,
  populateArtificialIntelligenceAndDataIntegrationSegment,
  formatModuleRunOrder,
  stageStrategyReqBody,
  stageStrategyDecisionProcessUpdate,
  updateMlAndVariableDependencies,
  populateRequiredCalculationVariables,
  formatStrategyGeneralInfo,
};