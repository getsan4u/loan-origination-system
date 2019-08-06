'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const numeral = require('numeral');
const moment = require('moment');
const controller_helpers = require('../controllers/helper.js');
const util = require('util');

/**
 * Determines the variable type (boolean, number, string) given the field and rule data
 * 
 * @param {Object} rule rule object that contains the data and the variable type
 * @param {String} field optional field to extract variable type data from
 * @returns {String} the variable type
 */
function getVariableType(varId, variableMap) {
  if (variableMap && variableMap.byId && variableMap.byId[ varId ] && variableMap.byId[ varId ].data_type) {
    return variableMap.byId[ varId ].data_type;
  } else {
    return "String";
  }
}

/**
 * Coerces standard fields on the rule based on comparator and variable type
 * 
 * @param {Object} rule The rule object to coerce the values
 * @returns {Object} The updated rule with coerced values
 */
function coerceStandardRuleFields(rule, variableMap) {
  let variable_type = (rule.state_property_attribute) ? getVariableType(rule.state_property_attribute.toString(), variableMap) : '';
  let comparatorIsNull = rule.condition_test === 'IS NULL' || rule.condition_test === 'IS NOT NULL';
  if (rule.condition_test === 'RANGE') {
    if (rule.state_property_attribute_value_minimum_type === 'value' && variable_type === 'Number') {
      rule.state_property_attribute_value_minimum = numeral(rule.state_property_attribute_value_minimum).value();
    } else if (rule.state_property_attribute_value_minimum_type === 'value' && variable_type === 'Date') {
      rule.state_property_attribute_value_minimum = moment(rule.state_property_attribute_value_minimum).format('MM/DD/YYYY');
    }
    if (rule.state_property_attribute_value_maximum_type === 'value' && variable_type === 'Number') {
      rule.state_property_attribute_value_maximum = numeral(rule.state_property_attribute_value_maximum).value();
    } else if (rule.state_property_attribute_value_maximum_type === 'value' && variable_type === 'Date') {
      rule.state_property_attribute_value_maximum = moment(rule.state_property_attribute_value_maximum).format('MM/DD/YYYY');
    }
  } else if (rule.state_property_attribute_value_comparison_type === "value" && (rule.condition_test === 'IN' || rule.condition_test === 'NOT IN')) {
    let valueArray;
    if (variable_type === 'Number') {
      valueArray = rule.state_property_attribute_value_comparison.toString().replace(/\s|(;$)/g, "").split(';');
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
      valueArray = rule.state_property_attribute_value_comparison.toString().replace(/(;$)/g, "").split(';');
      valueArray = valueArray.reduce((arr, val) => {
        val = val.trim();
        if (val) {
          arr.push(val);
        } else {
          throw new Error('Please enter non-emtpy string values only.');
        }
        return arr;
      }, []);
      rule.state_property_attribute_value_comparison = valueArray;
    }
  } else if (!comparatorIsNull && rule.state_property_attribute_value_comparison_type === "value" && variable_type === 'Number') {
    rule.state_property_attribute_value_comparison = numeral(rule.state_property_attribute_value_comparison).value();
  } else if (!comparatorIsNull && rule.state_property_attribute_value_comparison_type === "value" && variable_type === 'Boolean') {
    rule.state_property_attribute_value_comparison = (rule.state_property_attribute_value_comparison === 'true');
  } else if (!comparatorIsNull && rule.state_property_attribute_value_comparison_type === "value" && variable_type === 'Date') {
    rule.state_property_attribute_value_comparison = moment(rule.state_property_attribute_value_comparison).format('MM/DD/YYYY');
  } else if (comparatorIsNull) {
    delete rule.state_property_attribute_value_minimum;
    delete rule.state_property_attribute_value_maximum;
    delete rule.state_property_attribute_value_comparison;
  }
  return rule;
}

/**
 * Coerces a field on condition_output field on scorecard and output rules given variable type
 * 
 * @param {String | Number | Boolean} output Condition output field on the rule
 * @param {String} output_type The variable type of the output (e.g. string, number, boolean)
 * @returns Coerced output
 */
function formatConditionOutput(output, output_type) {
  if (output && output_type) {
    if (output_type === 'Number') {
      output = numeral(output).value();
    } else if (output_type === 'Boolean') {
      output = (output === 'true');
    } else if (output_type === 'Date') {
      output = moment(output).format('MM/DD/YYYY');
    }
  }
  return (output !== undefined) ? output : undefined;
}

/**
 * Cleans and formats the rule data on req.body for the update. Handles single and multiple rules
 * 
 * @param {Object} req Express req object
 * @returns {Object} Updated req.body object 
 */
function cleanRuleForUpdate(req) {
  try {
    let name = req.body.name;
    let { collection, core, tabname, id, parsedUrl, } = controller_helpers.findCollectionNameFromReq({ req, });
    req.body.condition_output = req.body.condition_output || [];
    req.body.multiple_rules = req.body.rule.map(rule => {
      rule = coerceStandardRuleFields(rule, req.controllerData.variableMap);
      delete rule.variable_type;
      delete rule.rule_separator;
      return rule;
    });
    req.body.condition_output = req.body.condition_output.map(output => {
      if (req.body.type === 'output') {
        if (output.value_type === 'value') {
          output.variable_id = output.variable.toString();
          output.value = formatConditionOutput(output.value, getVariableType(output.variable_id, req.controllerData.variableMap));
        }
        output.variable_id = output.variable.toString();
        output.variable_display_title = (req.controllerData && req.controllerData.variableMap && req.controllerData.variableMap.byId[ output.variable ]) ? req.controllerData.variableMap.byId[ output.variable ].display_title : output.variable;
        output.variable_title = (req.controllerData && req.controllerData.variableMap && req.controllerData.variableMap.byId[ output.variable ]) ? req.controllerData.variableMap.byId[ output.variable ].title : output.variable;
        output.variable = (req.controllerData && req.controllerData.variableMap && req.controllerData.variableMap.byId[ output.variable ]) ? req.controllerData.variableMap.byId[ output.variable ].name : output.variable;
      } else if (req.body.type === 'requirements') {
        output.variable = 'decline_reason';
        output.variable_title = 'decline_reason';
      } else if (req.body.type === 'scorecard') {
        if (output.value_type === 'value') {
          output.value = formatConditionOutput(output.value, 'Number');
        }
        output.variable = 'weight';
        output.variable_title = 'weight';
      }
      return {
        variable: output.variable,
        variable_id: output.variable_id,
        variable_title: output.variable_title,
        variable_display_title: output.variable_display_title,
        value: output.value,
        value_type: output.value_type,
      };
    });
    return {
      _id: req.body._id,
      multiple_rules: req.body.rule,
      condition_output: req.body.condition_output,
      strategy: id,
      calculation_inputs: req.body.calculation_inputs || [],
      calculation_outputs: req.body.calculation_outputs || [],
    };
  } catch (e) {
    logger.warn(e.message);
    let error_message = e.message.includes('Please')? e.message : 'Error saving the rule.';
    throw new Error(error_message);
  }
}

/**
 * Cleans and formats the rule data on req.body for the update. Handles single and multiple rules
 * 
 * @param {Object} req Express req object
 * @returns {Object} Updated req.body object 
 */
function cleanRuleForCreate(req) {
  try {
    let { collection, core, tabname, id, parsedUrl, } = controller_helpers.findCollectionNameFromReq({ req, });
    req.body.condition_output = req.body.condition_output || [];
    req.body.multiple_rules = req.body.rule.map(rule => {
      rule = coerceStandardRuleFields(rule, req.controllerData.variableMap);
      delete rule.variable_type;
      delete rule.rule_separator;
      return rule;
    });
    req.body.condition_output = req.body.condition_output.map(output => {
      if (req.body.type === 'output') {
        if (output.value_type === 'value') {
          output.variable_id = output.variable.toString();
          output.value = formatConditionOutput(output.value, getVariableType(output.variable_id, req.controllerData.variableMap));
        }
        output.variable_id = output.variable.toString();
        output.variable_display_title = (req.controllerData && req.controllerData.variableMap && req.controllerData.variableMap.byId[ output.variable ]) ? req.controllerData.variableMap.byId[ output.variable ].display_title : output.variable;
        output.variable_title = (req.controllerData && req.controllerData.variableMap && req.controllerData.variableMap.byId[ output.variable ]) ? req.controllerData.variableMap.byId[ output.variable ].title : output.variable;
        output.variable = (req.controllerData && req.controllerData.variableMap && req.controllerData.variableMap.byId[ output.variable ]) ? req.controllerData.variableMap.byId[ output.variable ].name : output.variable;
      } else if (req.body.type === 'requirements') {
        output.variable = 'decline_reason';
        output.variable_title = 'decline_reason';
      } else if (req.body.type === 'scorecard') {
        if (output.value_type === 'value') {
          output.value = formatConditionOutput(output.value, 'Number');
        }
        output.variable = 'weight';
        output.variable_title = 'weight';
      }
      return {
        variable: output.variable,
        variable_id: output.variable_id,
        variable_title: output.variable_title,
        variable_display_title: output.variable_display_title,
        value: output.value,
        value_type: output.value_type,
      };
    });
    return {
      type: req.body.type,
      rule_type: req.body.rule_type,
      multiple_rules: req.body.rule,
      condition_output: req.body.condition_output,
      strategy: id,
      calculation_inputs: req.body.calculation_inputs || [],
      calculation_outputs: req.body.calculation_outputs || [],
    };
  } catch (e) {
    logger.warn(e.message);
    let error_message = e.message.includes('Please')? e.message : 'Error saving the rule.';
    throw new Error(error_message);
  }
}

module.exports = {
  cleanRuleForUpdate,
  cleanRuleForCreate,
};