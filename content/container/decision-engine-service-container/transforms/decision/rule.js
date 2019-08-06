'use strict';
const periodic = require('periodicjs');
const utilities = require('../../utilities');
const { getRuleFromCache, getVariableFromCache } = require('../../utilities/controllers/integration');
const numeral = require('numeral');
const moment = require('moment');
const capitalize = require('capitalize');
const unflatten = require('flat').unflatten;
const flatten = require('flat');
const helpers = utilities.controllers.helper;
const transformhelpers = utilities.transformhelpers;
const DECISION_CONSTANTS = utilities.views.decision.constants;
const { RULES_TEMPLATE_DOWNLOAD_CONSTANTS, COMPARATOR_MAP, RULES_TEMPLATE_COMPARATOR_MAP } = utilities.constants;
const util = require('util');
const Json2csvParser = require('json2csv').Parser;
const randomKey = Math.random;
const ruleHelpers = utilities.transforms.rule;

/**
 * Populates variable dropdown to be displayed and selected from on a rule or calculationset
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with populated variables dropdown on req.controllerData
  */
function generateVariableDropdown(req) {
  return new Promise((resolve, reject) => {
    let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
    const Variable = periodic.datas.get('standard_variable');
    if ((req.query.modal !== 'true' || parsedUrl[ 0 ] === 'standard_variables') && (collection !== 'rules' || (tabname !== 'detail' && tabname !== 'update_history_detail'))) {
      resolve(req);
    } else {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      let ruleData = req.controllerData.standard_rule || req.controllerData.data;
      ruleData = ruleData.toJSON ? ruleData.toJSON() : ruleData;
      let creator = ruleData.user.creator || ruleData.after.user.creator;
      let updater = ruleData.user.updater || ruleData.user;
      ruleData.formattedCreatedAt = `${transformhelpers.formatDateNoTime(ruleData.createdat, user.time_zone)} by ${creator}`;
      ruleData.formattedUpdatedAt = `${transformhelpers.formatDateNoTime(ruleData.updatedat, user.time_zone)} by ${updater}`;
      req.controllerData.data = ruleData;
      Variable.model.find({ organization, })
        .then(variables => {
          let outputDropdown = [];
          let variableDropdown = variables.map(variable => ({ label: variable.display_title, value: variable._id, })).sort((a, b) => (a.label > b.label) ? 1 : -1);
          variableDropdown.unshift({
            label: ' ',
            value: '',
            disabled: true,
          });
          req.controllerData.data.variable_types = variables.reduce((collection, variable) => {
            variable = variable.toJSON ? variable.toJSON() : variable;
            if (variable.type === 'Output') outputDropdown.push({
              label: variable.display_title,
              value: variable._id,
            });
            collection[ variable._id.toString() ] = variable.data_type;
            return collection;
          }, {});
          req.controllerData.data.variable_type = req.controllerData.data.state_property_attribute ? req.controllerData.data.variable_types[ req.controllerData.data.state_property_attribute ] : '';
          req.controllerData.formoptions = {
            state_property_attribute: variableDropdown,
          };
          if (ruleData.type === 'output') req.controllerData.formoptions.output_variables = outputDropdown;
          resolve(req);
        })
        .catch(reject);
    }
  });
}

/**
 * Formats request body for an edit/create of a rule to handle saving condition_group_id and condition outputs according to credit engine
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated req body for rule update or create
 */
function stageRuleReqBodyForUpdate(req) {
  return new Promise((resolve, reject) => {
    try {
      req.body = unflatten(req.body);
      req.controllerData = req.controllerData || {};
      if (req.body.required_calculation_variables && req.body.required_calculation_variables.length) {
        let inputVariableMap = req.controllerData.inputVariableMap || {};
        req.body.required_calculation_variables = req.body.required_calculation_variables.filter(variable => !!variable);
        req.body.calculation_inputs = req.body.required_calculation_variables.filter(variable => !!inputVariableMap[variable]);
        req.body.calculation_outputs = req.body.required_calculation_variables.filter(variable => !inputVariableMap[variable]);
        delete req.body.required_calculation_variables;
      }
      req.body = Object.keys(req.body).reduce((reduced, formname) => {
        let formVal = req.body[ formname ];
        formname = formname.replace(/\*/g, '.');
        reduced[ formname ] = formVal;
        return reduced;
      }, {});
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
      req.body = unflatten(req.body);
      if (req.body.rule && Array.isArray(req.body.rule)) req.body.rule = req.body.rule.filter(el => !!el);
      if (req.body && req.body.display_title && req.body.version) {
        req.body.display_name = `${req.body.display_title} (v${req.body.version})`;
      }
      if (req.body && req.body.type) {
        req.body = (req.query.method === 'addRule') ? ruleHelpers.cleanRuleForCreate(req) : ruleHelpers.cleanRuleForUpdate(req);
      }
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

/**
 * Formats request body for an edit/create of a rule to handle saving condition_group_id and condition outputs according to credit engine
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated req body for rule update or create
 */
function stageRuleReqBodyForCreate(req) {
  return new Promise((resolve, reject) => {
    try {
      let name = (req.method === 'POST') ? `${req.body.name}v1` : req.body.name;
      let cleanName = name.replace(/\s+/g, '_');
      if (req.body && req.body.type) {
        let type = req.body.type;
        req.body = helpers.coerceFormData({ req, }).body;
        if (type !== 'limits') req.body = Object.assign({}, req.body, { condition_output: `${cleanName}_pass`, });
      }
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Populates required_input_variables and required_calculated_variables on a rule prior to saving
 * 
 * @param {Object} req Express request object
 * @returns request object with required input and calculated variables populated on request body prior to save
 */
function populateRuleRequiredVariables(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.body.state_property_attribute) {
        let Variable = periodic.datas.get('standard_variable');
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        Variable.load({ query: { _id: req.body.state_property_attribute, organization, }, })
          .then(result => {
            result = (result.toJSON) ? result.toJSON() : result;
            req.body.required_input_variables = result.required_input_variables.map(el => el._id);
            req.body.required_calculated_variables = result.required_calculated_variables.map(el => el._id);
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

/**
 * Unflattens request body
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with unflatted req body
 */
function unflattenReqBody(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.body) {
        req.body = unflatten(req.body);
      }
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

function formatInnerRuleDetail(reduced, inner_rule, idx, variableTypeMap, outer_rule) {
  let variable_type = (inner_rule.state_property_attribute && inner_rule.state_property_attribute._id) ? inner_rule.state_property_attribute.type : variableTypeMap[ inner_rule.state_property_attribute ];
  if (DECISION_CONSTANTS.SINGLE_RULE_MODULES[ outer_rule.type ]) {
    inner_rule = inner_rule.toJSON ? inner_rule.toJSON() : inner_rule;
    reduced[ `rule*${idx}` ] = inner_rule;
  } else {
    inner_rule = inner_rule.toJSON ? inner_rule.toJSON() : inner_rule;
    inner_rule.state_property_attribute = inner_rule.state_property_attribute._id.toString();
    inner_rule.variable_type = variable_type;
    if (Array.isArray(inner_rule.state_property_attribute_value_comparison)) {
      inner_rule.state_property_attribute_value_comparison = inner_rule.state_property_attribute_value_comparison.join('; ');
    } else if (inner_rule.state_property_attribute_value_comparison !== undefined) {
      inner_rule.state_property_attribute_value_comparison = inner_rule.state_property_attribute_value_comparison.toString();
    }
    if (inner_rule.state_property_attribute_value_minimum !== undefined) inner_rule.state_property_attribute_value_minimum = inner_rule.state_property_attribute_value_minimum.toString();
    if (inner_rule.state_property_attribute_value_maximum !== undefined) inner_rule.state_property_attribute_value_maximum = inner_rule.state_property_attribute_value_maximum.toString();
    reduced[ `rule*${idx}` ] = inner_rule;
  }
  return reduced;
}

/**
 * Formats formdata for rule detail page
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with unflatted req body
 */
function formatRuleDetail(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, category, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      if (parsedUrl[ 0 ] === 'standard_rules' && req.controllerData.data) {
        req.controllerData.data = req.controllerData.data.toJSON ? req.controllerData.data.toJSON() : req.controllerData.data;
        if (req.controllerData.data.type === 'calculations') {
          req.controllerData = Object.assign({}, req.controllerData, {
            formoptions: {
              'rule*0*state_property_attribute': req.controllerData.formoptions.state_property_attribute,
            },
          });
        }
        const ruleTypeMap = {
          'simple': 'Simple',
          'OR': 'Combination Rule: OR',
          'AND': 'Combination Rule: AND',
        };
        req.controllerData.data.required_calculation_variables = req.controllerData.required_calculation_variables ||[];
        req.controllerData.data.rule_type_display = (req.controllerData.data.rule_type) ? ruleTypeMap[ req.controllerData.data.rule_type ] : '';
        let variable_type = (req.controllerData.data.variable_types) ? req.controllerData.data.variable_types[ req.controllerData.data.state_property_attribute ] : '';
        if (variable_type === 'Boolean' && req.controllerData.data.state_property_attribute_value_comparison !== undefined) {
          req.controllerData.data.state_property_attribute_value_comparison = req.controllerData.data.state_property_attribute_value_comparison.toString();
        }
        req.controllerData.data.rule_index = (req.controllerData.data.multiple_rules && req.controllerData.data.multiple_rules.length) ? req.controllerData.data.multiple_rules.length - 1 : 0;
        req.controllerData.data.output_index = (req.controllerData.data.condition_output && req.controllerData.data.condition_output.length) ? req.controllerData.data.condition_output.length - 1 : 0;
        let rules;
        let outer_rule = req.controllerData.data;
        rules = req.controllerData.data.multiple_rules.reduce((reduced, inner_rule, idx) => {
          return formatInnerRuleDetail(reduced, inner_rule, idx, req.controllerData.data.variable_types, outer_rule);
        }, {});
        rules = flatten(rules);
        rules = Object.keys(rules).reduce((reduced, key) => {
          let val = rules[ key ];
          key = key.replace(/\./g, '*');
          reduced[ key ] = val;
          return reduced;
        }, {});
        let condition_output = req.controllerData.data.condition_output.reduce((reduced, output, idx) => {
          reduced[ `condition_output*${idx}*variable` ] = (req.controllerData.variableMap && req.controllerData.variableMap.byName[ output.variable ]) ? req.controllerData.variableMap.byName[ output.variable ]._id.toString() : output.variableMap;
          reduced[ `condition_output*${idx}*value` ] = (output && output.value !== undefined && !Array.isArray(output.value)) ? String(output.value) : '';
          reduced[ `condition_output*${idx}*value_type` ] = output.value_type;
          return reduced;
        }, {});
        delete req.controllerData.data.multiple_rules;
        delete req.controllerData.data.condition_output;
        req.controllerData.data = Object.assign({}, req.controllerData.data, rules, condition_output);
      }
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Creates a map of variable by Id and Name for easy lookup in transforms
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with unflatted req body
 */
function getVariableMap(req) {
  return new Promise((resolve, reject) => {
    const Variable = periodic.datas.get('standard_variable');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    if (req.controllerData.inputVariables) {
      req.controllerData.variableMap = req.controllerData.inputVariables.reduce((reduced, variable) => {
        variable = variable.toJSON ? variable.toJSON() : variable;
        reduced.byId[ variable._id.toString() ] = variable;
        reduced.byName[ variable.name ] = variable;
        return reduced;
      }, {
        byId: {},
        byName: {},
      });
      resolve(req);
    } else {
      Variable.model.find({ organization, })
        .then(variables => {
          req.controllerData.variableMap = variables.reduce((reduced, variable) => {
            variable = variable.toJSON ? variable.toJSON() : variable;
            reduced.byId[ variable._id.toString() ] = variable;
            reduced.byName[ variable.name ] = variable;
            return reduced;
          }, {
            byId: {},
            byName: {},
          });
          resolve(req);
        })
        .catch(reject);
    }
  });
}

/**
 * Dynamically generates before and after changes to be displayed on rule update detail page.
 * 
 * @param {any} req Express request object
 * @returns updated request object
 */
function generateRuleUpdateHistoryForm(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      let change_type = req.controllerData.data.change_type;
      let module_type = (req.controllerData.data.before && req.controllerData.data.before.type)
        ? req.controllerData.data.before.type
        : (req.controllerData.data.after && req.controllerData.data.after.type)
          ? req.controllerData.data.after.type
          : null;
      const labelMap = {
        'condition_test': 'Comparison',
        'state_property_attribute': 'Variable',
        'state_property_attribute_value_comparison': 'Value',
        'state_property_attribute_miniumum': 'Minimum',
        'state_property_attribute_maximum': 'Maximum',
        'decline_reason': 'Decline Reason',
        'weight': 'Weight',
      };

      const rulesOrder = [
        'state_property_attribute',
        'condition_test',
        'state_property_attribute_value_comparison',
        'state_property_attribute_miniumum',
        'state_property_attribute_maximum',
      ];

      const comparatorMap = {
        'EQUAL': '=',
        'NOT EQUAL': '<>',
        'CAP': '<=',
        'FLOOR': '>=',
        'GT': '>',
        'LT': '<',
        'RANGE': 'RANGE',
        'IN': 'IN',
        'NOT IN': 'NOT IN',
        'IS NULL': 'IS NULL',
        'IS NOT NULL': 'IS NOT NULL',
      };

      if (req.controllerData.variable_map && tabname === 'update_history_detail' && collection === 'strategies' && change_type && (change_type !== 'process_flow' && change_type !== 'module_detail')) {
        let variableMap = req.controllerData.allVariablesMap;
        let beforeRules = req.controllerData.data.before.multiple_rules || [];
        let beforeConditions = Array.isArray(req.controllerData.data.before.condition_output) ? req.controllerData.data.before.condition_output : [req.controllerData.data.before.condition_output, ];
        let afterRules = req.controllerData.data.after.multiple_rules || [];
        let afterConditions = Array.isArray(req.controllerData.data.after.condition_output) ? req.controllerData.data.after.condition_output : [req.controllerData.data.after.condition_output, ];

        let beforeRulesSeparator = {
          type: 'layout',
          value: {
            component: 'p',
            children: `--------------------------------------------------- ${req.controllerData.data.before.rule_type} ---------------------------------------------------`,
          },
        };
        let afterRulesSeparator = {
          type: 'layout',
          value: {
            component: 'p',
            children: `--------------------------------------------------- ${req.controllerData.data.after.rule_type} ---------------------------------------------------`,
          },
        };

        let leftRulesConfigs = beforeRules.reduce((returnData, currentRule, idx) => {
          rulesOrder.forEach(key => {
            if (currentRule[ key ] !== undefined && (key === 'state_property_attribute' || key === 'state_property_attribute_minimum' || key === 'state_property_attribute_maximum')) returnData.push({ label: labelMap[ key ], name: variableMap[ currentRule[ key ] ].display_title, });
            else if (currentRule[key] !== undefined && (key === 'state_property_attribute_value_comparison') && currentRule['state_property_attribute_value_comparison_type'] === 'variable')
              returnData.push({ label: labelMap[key], name: variableMap[currentRule[key]].display_title, });
            else if (currentRule[ key ] !== undefined && (key === 'condition_test')) returnData.push({ label: labelMap[ key ], name: comparatorMap[ currentRule[ key ] ], });
            else if (currentRule[ key ] !== undefined) returnData.push({ label: labelMap[ key ], name: currentRule[ key ], });
          });
          if (idx < beforeRules.length - 1) returnData.push(beforeRulesSeparator);
          return returnData;
        }, (module_type && module_type !== 'Assignments' && module_type !== 'Calculations')
          ? [{
            type: 'layout',
            value: {
              component: 'p',
              children: '------------------------------------------- RULE PASSES IF -------------------------------------------',
            },
          }, ]
          : []); 
        let rightRulesConfigs = afterRules.reduce((returnData, currentRule, idx) => {
          rulesOrder.forEach(key => {
            if (currentRule[ key ] !== undefined && (key === 'state_property_attribute' || key === 'state_property_attribute_minimum' || key === 'state_property_attribute_maximum')) returnData.push({ label: labelMap[ key ], name: variableMap[ currentRule[ key ] ].display_title, });
            else if (currentRule[ key ] !== undefined && key === 'state_property_attribute_value_comparison' && currentRule['state_property_attribute_value_comparison_type'] === 'variable') returnData.push({ label: labelMap[ key ], name: variableMap[ currentRule[ key ] ].display_title, });
            else if (currentRule[ key ] !== undefined && (key === 'condition_test')) returnData.push({ label: labelMap[ key ], name: comparatorMap[ currentRule[ key ] ], });
            else if (currentRule[ key ] !== undefined) returnData.push({ label: labelMap[ key ], name: currentRule[ key ], });
          });
          if (idx < afterRules.length - 1) returnData.push(afterRulesSeparator);
          return returnData;
        }, (module_type && module_type !== 'Assignments' && module_type !== 'Calculations')
          ? [{
            type: 'layout',
            value: {
              component: 'p',
              children: '------------------------------------------- RULE PASSES IF -------------------------------------------',
            },
          }, ]
          : []); 
        let leftConditionsConfigs = beforeConditions.reduce((returnData, currentCondition, idx) => {
          if (currentCondition.value !== undefined && currentCondition.value_type && currentCondition.variable) {
            if (currentCondition.variable === 'decline_reason' || currentCondition.variable === 'weight') {
              returnData.push({
                label: labelMap[ currentCondition.variable ],
                name: (currentCondition.value_type === 'variable')
                  ? variableMap[ currentCondition.value ].display_title
                  : currentCondition.value.toString(),
              });
            } else {
              returnData.push({
                label: currentCondition.variable,
                name: (currentCondition.value_type === 'variable')
                  ? variableMap[ currentCondition.value ]
                  : currentCondition.value.toString(),
              });
            }
            return returnData;
          } else {
            return returnData;
          }
        }, []);
        let rightConditionsConfigs = afterConditions.reduce((returnData, currentCondition, idx) => {
          if (currentCondition.value !== undefined && currentCondition.value_type && currentCondition.variable) {
            if (currentCondition.variable === 'decline_reason' || currentCondition.variable === 'weight') {
              returnData.push({
                label: labelMap[ currentCondition.variable ],
                name: (currentCondition.value_type === 'variable')
                  ? variableMap[ currentCondition.value ].display_title
                  : currentCondition.value.toString(),
              });
            } else {
              returnData.push({
                label: currentCondition.variable,
                name: (currentCondition.value_type === 'variable')
                  ? variableMap[ currentCondition.value ]
                  : currentCondition.value.toString(),
              });
            }
            return returnData;
          } else {
            return returnData;
          }
        }, []);
        if (module_type && module_type !== 'Assignments' && module_type !== 'Calculations') {
          leftRulesConfigs.push({
            type: 'layout',
            value: {
              'component': 'div',
              'children': [
                {
                  'component': 'h3',
                  'children': 'Result (Before Change)',
                }, ],
            },
          });
          rightRulesConfigs.push({
            type: 'layout',
            value: {
              'component': 'div',
              'children': [
                {
                  'component': 'h3',
                  'children': 'Result (After Change)',
                }, ],
            },
          });
        }
        leftRulesConfigs.push(...leftConditionsConfigs);
        rightRulesConfigs.push(...rightConditionsConfigs);
        req.controllerData.data.update_history_detail = helpers.generateRuleUpdateForm({ leftRulesConfigs, rightRulesConfigs, });
        let formattedUpdatedAt = req.controllerData.data.after.updatedat || req.controllerData.data.before.updatedat;
        let updater = req.controllerData.data.after.user.updater || req.controllerData.data.before.user.updater;
        let ruleType = req.controllerData.data.after.type ? req.controllerData.data.after.type.toLowerCase() : req.controllerData.data.before.type.toLowerCase();
        req.controllerData.data = Object.assign({}, req.controllerData.data, {
          formattedUpdatedAt: `${transformhelpers.formatDateNoTime(formattedUpdatedAt)} by ${updater}`,
          _id: req.headers.referer.split('/').slice(-3)[ 0 ],
          type: ruleType,
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

function createInitialRule(req) {
  return new Promise((resolve, reject) => {
    try {
      const Rule = periodic.datas.get('standard_rule');
      let { collection, core, id, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      let module_type = req.body.type;
      if (req.body.module_name && req.query.method === 'addSegment') {
        let [parsed_module_type, module_index, ] = req.body.module_name.split('_').slice(-2);
        module_type = parsed_module_type;
      }
      if (DECISION_CONSTANTS.SINGLE_RULE_MODULES[ module_type ] && (req.query.method === 'addSegment' || req.query.method === 'create')) {
        let name = `${module_type}_${req.body.name.replace(/\s+/g, '_').toLowerCase()}_rule_${Math.random()}`;
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        let createOptions;
        if (module_type === 'textmessage') createOptions = {
          name,
          title: name,
          display_title: '',
          display_name: '',
          type: module_type,
          rule_type: 'AND',
          user: { creator: `${req.user.first_name} ${req.user.last_name}`, updater: `${req.user.first_name} ${req.user.last_name}`, },
          multiple_rules: [{
            static_state_property_attribute: 'to',
            state_property_attribute_value_comparison: '',
            state_property_attribute_value_comparison_type: 'value',
          }, {
            static_state_property_attribute: 'body',
            state_property_attribute_value_comparison: '',
            state_property_attribute_value_comparison_type: 'value',
          }, ],
          organization,
          strategy: req.params.id,
        };
        else if (module_type === 'email') createOptions = {
          name,
          title: name,
          display_title: '',
          display_name: '',
          type: module_type,
          rule_type: 'AND',
          user: { creator: `${req.user.first_name} ${req.user.last_name}`, updater: `${req.user.first_name} ${req.user.last_name}`, },
          multiple_rules: [{
            static_state_property_attribute: 'to',
            state_property_attribute_value_comparison: '',
            state_property_attribute_value_comparison_type: 'value',
          }, {
            static_state_property_attribute: 'subject',
            state_property_attribute_value_comparison: '',
            state_property_attribute_value_comparison_type: 'value',
          }, {
            static_state_property_attribute: 'html',
            state_property_attribute_value_comparison: '',
            state_property_attribute_value_comparison_type: 'value',
          }, ],
          organization,
          strategy: req.params.id,
        };
        Rule.create(createOptions)
          .then(created => {
            created = created.toJSON ? created.toJSON() : created;
            req.body.ruleset = req.body.ruleset || [];
            req.body.ruleset.push(created._id.toString());
            resolve(req);
          })
          .catch(e => {
            reject(e);
          });
      } else {
        resolve(req);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function __coerceStandardRuleFields(rule, variableMap) {
  try{

    let variable_type = (rule.state_property_attribute) ? variableMap[rule.state_property_attribute].data_type : '';
    let comparatorIsNull = rule.condition_test === 'IS NULL' || rule.condition_test === 'IS NOT NULL';
    if (rule.condition_test === 'RANGE') {
      if (rule.state_property_attribute_value_minimum_type === 'value' && variable_type === 'Number') {
        rule.state_property_attribute_value_minimum = numeral(rule.state_property_attribute_value_minimum).value();
      }
      if (rule.state_property_attribute_value_maximum_type === 'value' && variable_type === 'Number') {
        rule.state_property_attribute_value_maximum = numeral(rule.state_property_attribute_value_maximum).value();
      }
    } else if (rule.state_property_attribute_value_comparison_type === 'value' && (rule.condition_test === 'IN' || rule.condition_test === 'NOT IN')) {
      let valueArray;
      if (variable_type === 'Number') {
        valueArray = rule.state_property_attribute_value_comparison.toString().replace(/\s|(;$)/g, '').split(';');
        valueArray = valueArray.reduce((arr, val) => {
          val = val.trim();
          if (val && !isNaN(Number(val))) {
            arr.push(Number(val));
          } else {
            throw new Error('Please enter number values only.');
          }
          return arr;
        }, []);
        rule.state_property_attribute_value_comparison = valueArray;
      } else {
        valueArray = rule.state_property_attribute_value_comparison.toString().replace(/(;$)/g, '').split(';');
        valueArray = valueArray.reduce((arr, val) => {
          val = val.trim();
          if (val) {
            arr.push(val);
          } else {
            throw new Error('Please enter non-empty string values only.');
          }
          return arr;
        }, []);
        rule.state_property_attribute_value_comparison = valueArray;
      }
    } else if (!comparatorIsNull && rule.state_property_attribute_value_comparison_type === 'value' && variable_type === 'Number') {
      rule.state_property_attribute_value_comparison = numeral(rule.state_property_attribute_value_comparison).value();
    } else if (!comparatorIsNull && rule.state_property_attribute_value_comparison_type === 'value' && variable_type === 'Boolean') {
      rule.state_property_attribute_value_comparison = (rule.state_property_attribute_value_comparison.toLowerCase() === 'true');
    } else if (comparatorIsNull) {
      delete rule.state_property_attribute_value_minimum;
      delete rule.state_property_attribute_value_maximum;
      delete rule.state_property_attribute_value_comparison;
    }
    if(variableMap[rule.state_property_attribute]) {
      rule.state_property_attribute = variableMap[rule.state_property_attribute]._id.toString();
      return rule;
    } else{
      return new Error(`The variable ${rule.state_property_attribute} does not exist in the system`);
    }
  } catch(e){
    return e;
  }
}

function __formatConditionOutput(output, output_type) {
  if (output && output_type) {
    if (output_type === 'Number') {
      output = numeral(output).value();
    } else if (output_type === 'Boolean') {
      output = (output === 'true');
    }
  }
  return (output !== undefined) ? output : undefined;
}

const BLANK_RULE = {
  calculation_inputs : [],
  calculation_outputs : [],
  condition_output: [],
  type: '',
  version: 1,
  locked: false,
  entitytype: 'rule',
  rule_type: '',
  multiple_rules: [],
  strategy: '',
  name: '',
  user: {
    creator: '',
    updater: '',
  },
  latest_version: true,
  title: '',
  organization: '',
};


async function generateRuleObjectsForCreate(req) {
  try {
    req.controllerData = req.controllerData || {};
    let variableTitleMap = req.controllerData.variableTitleMap;
    let hasError = null;
    let user = req.user;
    let { tabname, module_type, } = req.controllerData;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let new_variables = [];
    let rules = req.controllerData.file_data.reduce((aggregate, rule, i) => {
      rule.output = rule.output || [];
      rule.condition = rule.condition || [];
      rule.calculation_inputs = rule.calculation_inputs || [];
      rule.calculation_outputs = rule.calculation_outputs || [];
      let new_rule = Object.assign({}, BLANK_RULE);
      new_rule.rule_type = rule.rule_type || 'simple';
      new_rule.type = (req.query.type === 'population')? 
        'population' : req.controllerData.module_type;
      new_rule.strategy = req.controllerData.strategy._id.toString();
      new_rule.user = {
        creator: `${user.first_name} ${user.last_name}`,
        updater: `${user.first_name} ${user.last_name}`,
      };
      new_rule.organization = organization;
      new_rule.name = `strategy${req.controllerData.strategy._id.toString()}_${tabname}_${new Date().getTime()}_${i}`;      
      new_rule.title = `strategy${req.controllerData.strategy._id.toString()}_${tabname}_${new Date().getTime()}_${i}`;     
      
      new_rule.calculation_inputs = rule.calculation_inputs.reduce((new_calculation_inputs, calculation_input, k) => {
        if (calculation_input.variable_system_name && !hasError) {
          if (!variableTitleMap[calculation_input.variable_system_name]) {
            hasError = `The variable ${calculation_input.variable_system_name} does not exist in the system`;
          }
          if (!hasError) {
            new_variables.push(variableTitleMap[calculation_input.variable_system_name]._id.toString());
            new_calculation_inputs.push(variableTitleMap[calculation_input.variable_system_name]._id.toString());
          }
        }
        return new_calculation_inputs;
      }, []);

      new_rule.calculation_outputs = rule.calculation_outputs.reduce((new_calculation_outputs, calculation_output, k) => {
        if (calculation_output.variable_system_name && !hasError) {
          if (!variableTitleMap[calculation_output.variable_system_name]) {
            hasError = `The variable ${calculation_output.variable_system_name} does not exist in the system`;
          }
          if (!hasError) {
            new_variables.push(variableTitleMap[calculation_output.variable_system_name]._id.toString());
            new_calculation_outputs.push(variableTitleMap[calculation_output.variable_system_name]._id.toString());
          }
        }
        return new_calculation_outputs;
      }, []);
       
      new_rule.condition_output = rule.output.reduce((new_outputs, output, j) => {
        let new_output = {};
        if (output.variable_system_name && !hasError) {
          if (!variableTitleMap[output.variable_system_name] && (req.controllerData.module_type !== 'scorecard' && req.controllerData.module_type !== 'requirements')) {
            hasError = `The variable ${output.variable_system_name} does not exist in the system`;
          }
          if (!hasError) {
            if (req.controllerData.module_type === 'scorecard' || req.controllerData.module_type === 'requirements') {
              if(output.value_type === 'variable'){
                if(variableTitleMap[output.value]){
                  new_output = {
                    variable: req.controllerData.module_type === 'scorecard' ? 'weight' : 'decline_reason',
                    variable_title: req.controllerData.module_type === 'scorecard' ? 'weight' : 'decline_reason',
                    value : variableTitleMap[output.value]._id.toString(),
                    value_type : 'variable',
                  };
                } else hasError = `The variable ${output.value} does not exist in the system`;
              } else{
                new_output = {
                  variable: req.controllerData.module_type === 'scorecard' ? 'weight' : 'decline_reason',
                  variable_title: req.controllerData.module_type === 'scorecard' ? 'weight' : 'decline_reason',
                  value : output.value,
                  value_type : 'value',
                };
              }
            } else {
              new_variables.push(variableTitleMap[output.variable_system_name]._id.toString());
              if(output.value_type === 'variable'){
                if(variableTitleMap[output.value]){
                  new_output = {
                    variable: variableTitleMap[output.variable_system_name].name,
                    variable_id: variableTitleMap[output.variable_system_name]._id.toString(),
                    variable_title: variableTitleMap[output.variable_system_name].title,
                    variable_display_title : variableTitleMap[output.variable_system_name].display_title,
                    value : variableTitleMap[output.value]._id.toString(),
                    value_type : 'variable',
                  };
                } else hasError = `The variable ${output.value} does not exist in the system`;
              } else{
                new_output = {
                  variable: variableTitleMap[output.variable_system_name].name,
                  variable_id: variableTitleMap[output.variable_system_name]._id.toString(),
                  variable_title: variableTitleMap[output.variable_system_name].title,
                  variable_display_title : variableTitleMap[output.variable_system_name].display_title,
                  value : output.value,
                  value_type : 'value',
                };
              }
            }
            if (module_type === 'output') {
              if (output.value_type === 'value') {
                new_output.value = __formatConditionOutput(new_output.value, variableTitleMap[new_output.variable_title].data_type);
              }
            } else if (module_type === 'scorecard') {
              if (new_output.value_type === 'value') {
                new_output.value = __formatConditionOutput(new_output.value, 'Number');
              }
            }
            new_outputs.push(new_output);
          }
        }
        return new_outputs;
      }, []);

      new_rule.multiple_rules = rule.condition.reduce((new_conditions, condition, j) => {
        let new_condition = {};
        if (condition.variable_system_name && !hasError) {
          if (!variableTitleMap[condition.variable_system_name]) {
            hasError = `The variable ${condition.variable_system_name} does not exist in the system`;
          }
          if (!hasError) {
            new_variables.push(variableTitleMap[condition.variable_system_name]._id.toString());
            if (module_type === 'calculations') {
              new_condition = {
                state_property_attribute : variableTitleMap[condition.variable_system_name]._id.toString(),
                condition_test : 'EQUAL',
                state_property_attribute_value_comparison_type : 'javascript',
                state_property_attribute_value_comparison : condition.value,
              };
            } else if (module_type === 'assignments') {
              if(condition.value_type === 'variable'){
                if(variableTitleMap[condition.value]){
                  new_condition = {
                    state_property_attribute : condition.variable_system_name,
                    state_property_attribute_value_comparison : variableTitleMap[condition.value]._id.toString(),
                    state_property_attribute_value_comparison_type : 'variable',
                  };
                } else hasError = `The variable ${condition.value} does not exist in the system`;
              } else{
                new_condition = {
                  state_property_attribute : condition.variable_system_name,
                  state_property_attribute_value_comparison : condition.value,
                  state_property_attribute_value_comparison_type : 'value',
                };
              }
            } else {
              new_condition = {
                state_property_attribute : condition.variable_system_name,
                condition_test : RULES_TEMPLATE_COMPARATOR_MAP[condition.type] || condition.type,
                state_property_attribute_value_comparison : condition.value || undefined,
                state_property_attribute_value_comparison_type : 'value',
                state_property_attribute_value_minimum: condition.minimum || undefined,
                state_property_attribute_value_minimum_type: 'value',
                state_property_attribute_value_maximum: condition.maximum || undefined,
                state_property_attribute_value_maximum_type: 'value',
              };
              if(condition.value_type === 'variable'){
                if(variableTitleMap[condition.value]){
                  new_condition.state_property_attribute_value_comparison = variableTitleMap[new_condition.state_property_attribute_value_comparison]._id.toString();
                  new_condition.state_property_attribute_value_comparison_type = 'variable';
                } else hasError = `The variable ${condition.value} does not exist in the system`;
              }
              if(condition.minimum_type === 'variable'){
                if(variableTitleMap[condition.minimum]){
                  new_condition.state_property_attribute_value_minimum = variableTitleMap[new_condition.state_property_attribute_value_minimum]._id.toString();
                  new_condition.state_property_attribute_value_minimum_type = 'variable';
                } else hasError = `The variable ${condition.minimum} does not exist in the system`;
              }
              if(condition.maximum_type === 'variable'){
                if(variableTitleMap[condition.maximum]){
                  new_condition.state_property_attribute_value_maximum = variableTitleMap[new_condition.state_property_attribute_value_maximum]._id.toString();
                  new_condition.state_property_attribute_value_maximum_type = 'variable';
                } else hasError = `The variable ${condition.maximum} does not exist in the system`;
              }
            }
            
            if (module_type === 'calculations') {
              try {
                new Function(new_condition.value);
              } catch(e) {
                hasError = `There is a syntax error in row ${j + 1} of your calculations upload. If you continue to experience this issue, please contact DigiFi Support.`;
              }
            } else {
              new_condition = __coerceStandardRuleFields(new_condition, variableTitleMap);
            }
            new_conditions.push(new_condition);
          }
        }
        return new_conditions;
      }, []);
      aggregate.push(new_rule);
      return aggregate;
    }, []);
    
    if (hasError) {
      req.error = hasError;
    }

    req.controllerData = Object.assign({}, req.controllerData, {
      new_ruleset: rules,
      new_variables,
    });
    return req;
  } catch(e) {
    req.error = e.message;
    return req;
  }
}
/**
 * {
 *  condition: [],
 *  output: [],
 *  rule_type: simple OR AND,
 * }
 */

async function prepareCSVContentForDownload(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { tabname, segment_index, } = req.controllerData;
    const Rule = periodic.datas.get('standard_rule');
    let module_type = (req.query.type === 'population') ? 'population' : req.controllerData.module_type;
    let rules = (req.query.type === 'population') ? req.controllerData.conditions : req.controllerData.ruleset;
    let config = RULES_TEMPLATE_DOWNLOAD_CONSTANTS[module_type];
    let fields = transformhelpers.generateJSONtoCSVFields(config);
    let variableMap = req.controllerData.variableMap;
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let downloadContent = [];
    if (rules.length) {
      const populated_rules = await getRuleFromCache(rules, organization);
      downloadContent = populated_rules.reduce((allRules, rule, i) => {
        rule.condition_output = rule.condition_output || [];
        rule.multiple_rules = rule.multiple_rules || [];
        rule.calculation_inputs = rule.calculation_inputs || [];
        rule.calculation_outputs = rule.calculation_outputs || [];
        let new_rule = {
          calculation_inputs: [],
          calculation_outputs: [],
          condition: [],
          output: [],
          rule_type: rule.rule_type,
        };

        new_rule.calculation_inputs = rule.calculation_inputs.reduce((download_calculation_inputs, calculation_input, i) => {
          let new_calculation_input = {
            variable_system_name: variableMap[calculation_input.toString()].title,
          };
          download_calculation_inputs.push(new_calculation_input);
          return download_calculation_inputs;
        }, []);

        new_rule.calculation_outputs = rule.calculation_outputs.reduce((download_calculation_outputs, calculation_output, i) => {
          let new_calculation_output = {
            variable_system_name: variableMap[calculation_output.toString()].title,
          };
          download_calculation_outputs.push(new_calculation_output);
          return download_calculation_outputs;
        }, []);

        new_rule.condition = rule.multiple_rules.reduce((download_conditions, condition, i) => {
          const variable_system_name = variableMap[condition.state_property_attribute] ? variableMap[condition.state_property_attribute].title : '';
          let new_condition = {
            variable_system_name,
            type: COMPARATOR_MAP[condition.condition_test] || '',
            value: (condition.state_property_attribute_value_comparison_type === 'variable' && variableMap[condition.state_property_attribute_value_comparison])?  variableMap[condition.state_property_attribute_value_comparison].title : condition.state_property_attribute_value_comparison,
            value_type: condition.state_property_attribute_value_comparison_type || '',
            minimum: (condition.state_property_attribute_value_minimum_type === 'variable' && variableMap[condition.state_property_attribute_value_minimum])? variableMap[condition.state_property_attribute_value_minimum].title : condition.state_property_attribute_value_minimum,
            minimum_type: condition.state_property_attribute_value_minimum_type,
            maximum: (condition.state_property_attribute_value_maximum_type === 'variable' && variableMap[condition.state_property_attribute_value_maximum])? variableMap[condition.state_property_attribute_value_maximum].title : condition.state_property_attribute_value_maximum,
            maximum_type: condition.state_property_attribute_value_maximum_type,
          };
          if (new_condition.value !== undefined && Array.isArray(new_condition.value)) {
            new_condition.value = new_condition.value.join(';');
          }
          download_conditions.push(new_condition);
          return download_conditions;
        }, []);
        new_rule.output = rule.condition_output.reduce((download_outputs, output, i) => {
          let new_output;
          if (module_type === 'requirements' || module_type === 'scorecard') {
            new_output = {
              variable_system_name: output.variable_title,
              value: (output.value_type === 'variable' && variableMap[output.value])? variableMap[output.value].title : output.value,
              value_type: output.value_type,
            };
          } else {
            new_output = {
              variable_system_name: output.variable_title,
              value: (output.value_type === 'variable' && variableMap[output.value])? variableMap[output.value].title : output.value,
              value_type: output.value_type,
            };
          }
          if (new_output.value !== undefined && Array.isArray(new_output.value)) {
            new_output.value = new_output.value.join(';');
          }
          download_outputs.push(new_output);
          return download_outputs;
        }, []);

        allRules.push(new_rule);
        return allRules;
      }, []);
    } 

    let json2csvParser = new Json2csvParser({ fields, });
    let csv = json2csvParser.parse(downloadContent);
    req.controllerData.download_content = csv;
    req.controllerData.doc = { name: `${req.controllerData.strategy.modules[tabname][segment_index].display_name} ${capitalize(module_type)} Download Template`, };
    return req;
  } catch(e) {
    console.log({ e });
    req.error = e.message;
    return req;
  }
}

/**
 * Prevents a locked entity from being modified
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated status message
 */
async function checkStrategyLocked(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.strategy_id) {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let Strategy = periodic.datas.get('standard_strategy');
      let strategy = await Strategy.load({ query: { _id: req.strategy_id, organization, }, });
      strategy = strategy.toJSON ? strategy.toJSON() : strategy;
      if (strategy && strategy.locked) req.error = 'This strategy is locked and cannot be edited. To make changes, you must create a new version of the current strategy.';
      return req;
    } else {
      return req;
    }
  } catch (err) {
    return err;
  }
}

/**
 * Prevents a locked entity from being modified
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated status message
 */
async function getRule(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.params && req.params.id) {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let Rule = periodic.datas.get('standard_rule');
      let rule = await Rule.load({ query: { _id: req.params.id, organization, }, population: 'true' });
      rule = rule.toJSON ? rule.toJSON() : rule;
      if (rule && rule.strategy) req.strategy_id = rule.strategy.toString();
      return req;
    } else {
      return req;
    }
  } catch (err) {
    return err;
  }
}

module.exports = {
  getRule,
  createInitialRule,
  formatRuleDetail,
  checkStrategyLocked,
  generateRuleObjectsForCreate,
  generateVariableDropdown,
  populateRuleRequiredVariables,
  stageRuleReqBodyForCreate,
  stageRuleReqBodyForUpdate,
  unflattenReqBody,
  getVariableMap,
  generateRuleUpdateHistoryForm,
  prepareCSVContentForDownload,
};