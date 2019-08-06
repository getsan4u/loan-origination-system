'use strict';

const periodic = require('periodicjs');
const pluralize = require('pluralize');
const helpers = require('../helpers');
const util = require('util');
const logger = periodic.logger;
const { promisify } = require('util');

function updateVariableList(varId, compiledstrategy, variableMap) {
  if (varId && variableMap[ varId ]) {
    let variable = variableMap[ varId ];
    if (variable.type === 'Input') {
      compiledstrategy.input_variables.push(varId);
    } else if (variable.type === 'Output') {
      compiledstrategy.output_variables.push(varId);
    }
    return variable.title;
  } else {
    return varId;
  }
}

/**
 * Compiles calculation rules and creats condition output map and list of input and output variables
 * 
 * @param [Object] compiledstrategy strategy object to be updated
 * @param [Object] rule current rule to be compiled
 * @param [Object] variableMap key value pair of variable id and variable object
 * @param [Object] segment module segment that contains the current rule
 * @returns {Array} array of calculated variables
 */
async function compiledCalculationRuleDetail(compiledstrategy, rule, segment, variableMap) {
  try {
    let current_rule = (rule && rule.multiple_rules && rule.multiple_rules.length) ? rule.multiple_rules[ 0 ] : null;
    if (current_rule && current_rule.state_property_attribute) {
      let output_variable = (current_rule.state_property_attribute && current_rule.state_property_attribute.hasOwnProperty('_id')) ? current_rule.state_property_attribute : variableMap[ current_rule.state_property_attribute.toString() ];
      compiledstrategy.output_variables.push(output_variable._id);
      if (rule.calculation_inputs) compiledstrategy.input_variables.push(...rule.calculation_inputs);
      let operation = `${pluralize.singular(rule.type)}_operation`;
      if (current_rule.state_property_attribute_value_comparison_type === 'value') {
        let value_comparison = (typeof current_rule.state_property_attribute_value_comparison === 'string') ? `return '${current_rule.state_property_attribute_value_comparison}'` : `return ${current_rule.state_property_attribute_value_comparison}`;
        return {
          rule_name: rule.title,
          variable_name: output_variable.title,
          variable_type: output_variable.data_type,
          [ `${operation}` ]: value_comparison,
        };
      } else {
        updateVariableList(current_rule.state_property_attribute_value_comparison, compiledstrategy, variableMap);
        return {
          rule_name: rule.title,
          variable_name: output_variable.title,
          variable_type: output_variable.data_type,
          [ `${operation}` ]: (segment.type === 'assignments') ? `return ${variableMap[ current_rule.state_property_attribute_value_comparison ].title}` : `return ${current_rule.state_property_attribute_value_comparison}`
        };
      }
    } else {
      throw new Error('No output variable has been assigned');
    }
  } catch (e) {
    throw new Error(e.message);
  }
}

/**
 * Compiles multiple rules into separate rules and creats condition output map and list of input and output variables
 * 
 * @param [Object] compiledstrategy strategy object to be updated
 * @param [Object] rule current rule to be compiled
 * @param [Object] variableMap key value pair of variable id and variable object
 * @param [Object] segment module segment that contains the current rule
 * @returns {Array} array of rules broken out from rule.multiple_rules
 */
async function compileRuleDetail(compiledstrategy, rule, segment, variableMap) {
  try {
    compiledstrategy.rules.push(rule._id.toString());
    if (rule.multiple_rules && Array.isArray(rule.multiple_rules)) {
      const compiled_condition_output = {
        condition_output_types: {},
        condition_output: {},
      };
      for (let i = 0; i < rule.condition_output.length; i++) {
        const output = rule.condition_output[ i ];
        compiled_condition_output.condition_output_types[ output.variable_title ] = output.value_type;
        if (output.variable_id) {
          updateVariableList(output.variable_id, compiledstrategy, variableMap)
        }
        if (output.value_type === 'variable') {
          compiled_condition_output.condition_output[ output.variable_title ] = updateVariableList(output.value, compiledstrategy, variableMap);
        } else {
          compiled_condition_output.condition_output[ output.variable_title ] = output.value;
        }
        if (output.variable_title === 'decline_reason') {
          compiledstrategy.decline_reasons.push(compiled_condition_output.condition_output[ output.variable_title ]);
        }
      }
      let rule_name = rule.title;
      let rule_type = rule.rule_type;
      const innerStatePropertyAttributes = rule.multiple_rules.map(rule => variableMap[ rule.state_property_attribute ]);
      for (let i = 0; i < rule.multiple_rules.length; i++) {
        const innerrule = rule.multiple_rules[ i ];
        let formatted_rule = {};
        let copiedInnerRule = Object.assign({}, innerrule);
        copiedInnerRule.state_property_attribute = Object.assign({}, innerStatePropertyAttributes[ i ]);
        formatted_rule.variable_name = (copiedInnerRule.static_state_property_attribute) ? copiedInnerRule.static_state_property_attribute : copiedInnerRule.state_property_attribute.title;
        if (copiedInnerRule.state_property_attribute && copiedInnerRule.state_property_attribute.type === 'Input') {
          compiledstrategy.input_variables.push(copiedInnerRule.state_property_attribute._id.toString());
        } else if (copiedInnerRule.state_property_attribute && copiedInnerRule.state_property_attribute.type === 'Output') {
          compiledstrategy.output_variables.push(copiedInnerRule.state_property_attribute._id.toString());
        }
        if (copiedInnerRule.type === 'scorecard') {
          formatted_rule.output_variable = segment.output_variable;
          formatted_rule.initial_score = segment.initial_score;
        }
        if (copiedInnerRule.condition_test === 'RANGE') {
          formatted_rule.value_minimum = (copiedInnerRule.state_property_attribute_value_minimum_type === 'variable') ? updateVariableList(copiedInnerRule.state_property_attribute_value_minimum, compiledstrategy, variableMap) : copiedInnerRule.state_property_attribute_value_minimum;
          formatted_rule.value_minimum_type = copiedInnerRule.state_property_attribute_value_minimum_type;
          formatted_rule.value_maximum = (copiedInnerRule.state_property_attribute_value_maximum_type === 'variable') ? updateVariableList(copiedInnerRule.state_property_attribute_value_maximum, compiledstrategy, variableMap) : copiedInnerRule.state_property_attribute_value_maximum;
          formatted_rule.value_maximum_type = copiedInnerRule.state_property_attribute_value_maximum_type;
        } else if (copiedInnerRule.condition_test === 'IS NULL' || copiedInnerRule.condition_test === 'IS NOT NULL') {
          formatted_rule.value_comparison = null;
        } else {
          formatted_rule.value_comparison_type = copiedInnerRule.state_property_attribute_value_comparison_type || 'value';
          formatted_rule.value_comparison = (copiedInnerRule.state_property_attribute_value_comparison_type === 'variable') ? updateVariableList(copiedInnerRule.state_property_attribute_value_comparison, compiledstrategy, variableMap) : copiedInnerRule.state_property_attribute_value_comparison;
        }
        formatted_rule.condition_test = copiedInnerRule.condition_test;
        rule.multiple_rules[ i ] = Object.assign({}, formatted_rule, {
          rule_type,
          rule_name,
        }, compiled_condition_output);
      }
      return rule.multiple_rules;
    } else {
      throw new Error('multiple_rules is not an array');
    }
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getRuleFromCache(rules, orgId) {
  try {
    if (Array.isArray(rules) && !rules.length) return [];
    const redisClient = periodic.app.locals.redisClient;
    const Rule = periodic.datas.get('standard_rule');
    const Strategy = periodic.datas.get('standard_strategy');
    const asyncJsonMget = promisify(redisClient.mget).bind(redisClient);
    const asyncJsonGet = promisify(redisClient.get).bind(redisClient);
    if (rules === null || rules === undefined) throw new Error('Invalid Rule');
    if (Array.isArray(rules)) { //if you are searching for array for rules
      const fetchedRules = new Array(rules.length);
      const missingRules = {};
      const ruleRedisKeys = rules.map(ruleid => getRedisRuleKey(ruleid, orgId));
      const redisRules = await asyncJsonMget(...ruleRedisKeys);
      for (let i = 0; i < redisRules.length; i++) {
        if (redisRules[ i ]) {
          fetchedRules[ i ] = JSON.parse(redisRules[ i ]);
        } else {
          missingRules[ rules[ i ] ] = i;
        }
      }
      if (Object.keys(missingRules).length) {
        const active_testing_strategies = await Strategy.model.find({ organization: orgId, $or: [ { status: 'active' }, { status: 'testing' } ] }, { _id: 1 }).lean();
        const strategySet = new Set();
        active_testing_strategies.forEach(strat => {
          strategySet.add(strat._id.toString());
        });
        const fetchedDBRules = await Rule.model.find({ _id: { $in: Object.keys(missingRules) } }).lean();
        fetchedDBRules.forEach(fetchedRule => {
          if (fetchedRule && fetchedRule._id && missingRules.hasOwnProperty(fetchedRule._id)) {
            if (strategySet.has(fetchedRule.strategy.toString())) {
              setRuleOnRedis(fetchedRule, orgId, true);
            } else {
              setRuleOnRedis(fetchedRule, orgId);
            }
            let idx = missingRules[ fetchedRule._id ];
            fetchedRules[ idx ] = fetchedRule;
            delete missingRules[ fetchedRule._id ];
          } else {
            throw new Error('Rule does not exist');
          }
        });
      }
      if (Object.keys(missingRules).length) throw new Error('Not all the rules exist');
      return fetchedRules;
    } else { //you are searching for a single rule by id
      const redisRule = await asyncJsonGet(getRedisRuleKey(rules, orgId));
      if (redisRule) return JSON.parse(redisRule);
      const fetchedDBRule = await Rule.model.findOne({
        _id: rules,
      }).populate('strategy').lean();
      if (fetchedDBRule.strategy && (fetchedDBRule.strategy.status === 'active' || fetchedDBRule.strategy.status === 'testing')) {
        setRuleOnRedis(fetchedDBRule, orgId, true);
      } else {
        setRuleOnRedis(fetchedDBRule, orgId);
      }
      return fetchedDBRule;
    }
  } catch (e) {
    return e;
  }
}

async function getVariableFromCache(variables, orgId) {
  try {
    if (Array.isArray(variables) && !variables.length) return [];
    const Variable = periodic.datas.get('standard_variable');
    if (variables === null || variables === undefined) throw new Error('Invalid Variable');
    if (Array.isArray(variables)) {
      const foundVariables = new Array(variables.length).fill(null);
      const variableArrPositions = {};
      for (let i = 0; i < variables.length; i++) {
        if (!variables[ i ]) continue;
        variableArrPositions[ variables[ i ] ] = i;
      }
      const fetchedDBVariables = await Variable.model.find({ _id: { $in: variables } }).lean();
      let foundCount = 0;
      for (let i = 0; i < fetchedDBVariables.length; i++) {
        const foundDBVariable = fetchedDBVariables[ i ];
        if (foundDBVariable) {
          foundCount++;
          const varId = foundDBVariable._id.toString();
          const varPosition = variableArrPositions[ varId ];
          foundVariables[ varPosition ] = foundDBVariable;
        }
      }
      if (foundCount !== variables.length) {
        throw new Error('Could not find all the variables');
      }
      return foundVariables;
    } else {
      const fetchedDBVariable = await Variable.model.findOne({
        _id: variables,
      }).lean();
      return fetchedDBVariable;
    }
  } catch (e) {
    return e;
  }
}

async function getAllOrgVariableFromCache(orgId) {
  try {
    const Variable = periodic.datas.get('standard_variable');
    const allOrganizationVariables = await Variable.model.find({ organization: orgId }, { data_type: 1, type: 1, title: 1, display_title: 1, organization: 1, }).lean();
    const variableMap = {};
    if (Array.isArray(allOrganizationVariables)) {
      for (const variable of allOrganizationVariables) {
        variableMap[ variable._id.toString() ] = variable;
      }
    }
    return variableMap;
  } catch (e) {
    throw e;
  }
}

async function populateRules({ arr, compiledstrategy, segment, func, variableMap }) {
  try {
    const organization = (compiledstrategy && compiledstrategy.organization && typeof compiledstrategy.organization === 'string') ? compiledstrategy.organization : compiledstrategy.organization._id.toString();
    const rulesArr = await getRuleFromCache(arr, organization);
    const flattendArr = []; //multiple rules have been flattened
    for (let i = 0; i < rulesArr.length; i++) {

      const innerRules = await func(compiledstrategy, Object.assign({}, rulesArr[ i ]), segment, variableMap);
      if (Array.isArray(innerRules)) flattendArr.push(...innerRules);
      else flattendArr.push(innerRules);
    }
    return flattendArr;
  } catch (e) {
    throw e;
  }
}
/**
 * Iterates through the strategy module segments and calls the rule detail compiling function for conditions and ruleset
 * 
 * @param [Object] compiledstrategy strategy object to be updated
 * @param [Object] variableMap key value pair of variable id and variable object
 * @param [Object] ruleMap key value pair of rule id and rule object
 * @param [Object] segment module segment that contains the current rule
 * @returns {Array} segments updated segments for the module
 */
async function populateSegments(compiledstrategy, segments, variableMap) {
  try {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[ i ];
      if (segment.type === 'calculations') {
        segment.conditions = await populateRules({ arr: segment.conditions, compiledstrategy, segment, func: compileRuleDetail, variableMap });
        segment.ruleset = await populateRules({ arr: segment.ruleset, compiledstrategy, segment, func: compiledCalculationRuleDetail, variableMap });
      } else if (segment.type === 'assignments') {
        segment.conditions = await populateRules({ arr: segment.conditions, compiledstrategy, segment, func: compileRuleDetail, variableMap });
        segment.ruleset = await populateRules({ arr: segment.ruleset, compiledstrategy, segment, func: compiledCalculationRuleDetail, variableMap });
      } else if (segment.type === 'email' || segment.type === 'text') {
        segment.conditions = await populateRules({ arr: segment.conditions, compiledstrategy, segment, func: compileRuleDetail, variableMap });
        segment.ruleset = await populateRules({ arr: segment.ruleset, compiledstrategy, segment, func: compileRuleDetail, variableMap });
      } else if (segment.type === 'artificialintelligence') {
        if (segment.output_variable) {
          compiledstrategy.output_variables.push(segment.output_variable);
          // const output_variable = await getVariableFromCache(segment.output_variable);
          const output_variable = variableMap[ segment.output_variable ];
          const output_variable_title = output_variable.title;
          segment.output_variable = output_variable_title;
        }

        const fetchedInputVariables = segment.inputs.map(input => variableMap[ input.system_variable_id ]);

        for (let i = 0; i < segment.inputs.length; i++) {
          const input_variable = segment.inputs[ i ];
          const fullVariable = fetchedInputVariables[ i ];
          if (input_variable.input_type === 'variable') {
            if (fullVariable && fullVariable.type === 'Input') {
              compiledstrategy.input_variables.push(input_variable.system_variable_id)
            } else if (fullVariable && fullVariable.type === 'Output') {
              compiledstrategy.output_variables.push(input_variable.system_variable_id);
            }
            segment.inputs[ i ] = Object.assign({}, input_variable, { system_variable_id: (fullVariable) ? fullVariable.title : '' });
          } else if (input_variable.input_type === 'value') {
            segment.inputs[ i ] = input_variable;
          }
        }

        const fetchedOutputVariables = segment.outputs.map(outputs => variableMap[ outputs.system_variable_id ]);

        for (let i = 0; i < segment.outputs.length; i++) {
          const output_variable = segment.outputs[ i ];
          const fullVariable = fetchedOutputVariables[ i ];
          if (output_variable.input_type === 'variable') {
            if (fullVariable && fullVariable.type === 'Output') {
              compiledstrategy.output_variables.push(output_variable.output_variable);
            }
            segment.outputs[ i ] = Object.assign({}, output_variable, { output_variable: (fullVariable) ? fullVariable.title : '' });
          } else if (output_variable.input_type === 'value') {
            segment.outputs[ i ] = output_variable;
          }
        }

      } else if (segment.type === 'documentcreation') {
        segment.templatedoc = segment.filename;
        compiledstrategy.templates.push({
          fileurl: `templatedocuments/${segment.filename}`,
          filename: segment.filename,
        });

        const fetchedInputVariables = segment.inputs.map(input => variableMap[ input.system_variable_id ]);

        for (let i = 0; i < segment.inputs.length; i++) {
          const input_variable = segment.inputs[ i ];
          const fullVariable = fetchedInputVariables[ i ];
          if (input_variable.input_type === 'variable') {
            if (fullVariable && fullVariable.type === 'Input') {
              compiledstrategy.input_variables.push(input_variable.system_variable_id)
            } else if (fullVariable && fullVariable.type === 'Output') {
              compiledstrategy.output_variables.push(input_variable.system_variable_id);
            }
            segment.inputs[ i ] = Object.assign({}, input_variable, { system_variable_id: (fullVariable) ? fullVariable.title : '' });
          } else if (input_variable.input_type === 'value') {
            segment.inputs[ i ] = input_variable;
          }
        }
      } else {
        segment.conditions = await populateRules({ arr: segment.conditions, compiledstrategy, segment, func: compileRuleDetail, variableMap });
        segment.ruleset = await populateRules({ arr: segment.ruleset, compiledstrategy, segment, func: compileRuleDetail, variableMap });
        if (segment.type === 'scorecard' && segment.output_variable) {
          const output_variable = variableMap[ segment.output_variable ];
          segment.output_variable = output_variable.title;
          if (output_variable.type === 'Output') {
            compiledstrategy.output_variables.push(output_variable._id.toString());
          } else if (output_variable.type === 'Input') {
            compiledstrategy.input_variables.push(output_variable._id.toString());
          }
        }
        if (segment.type === 'scorecard' && !isNaN(segment.initial_score)) {
          segment.ruleset.unshift({
            variable_name: 'constant',
            condition_output: {
              weight: Number(segment.initial_score),
            }
          });
        }
      }
      segments[ i ] = segment;
    }
    return segments;
  } catch (e) {
    return e;
  }
}

/**
 * Iterates through module run order and grabs the module segment details from the modules map
 * 
 * @param [Object] req Express request object
 * @param [Object] compiledstrategy strategy object to be compiled
 * @return [Object] compiledstrategy updated strategy object
 */
async function compileModuleRunOrder(req, compiledstrategy, dataintegrations = [], variableMap = {}) {
  let modules = compiledstrategy.modules;
  const organization = (compiledstrategy && compiledstrategy.organization && typeof compiledstrategy.organization === 'string') ? compiledstrategy.organization : compiledstrategy.organization._id.toString();
  let dataintegrationMap = {};
  dataintegrations.forEach(di => dataintegrationMap[ di._id.toString() ] = di);
  // const variableMap = await getAllOrgVariableFromCache(organization);
  const activePopulatedModules = [];
  for (let i = 0; i < compiledstrategy.module_run_order.length; i++) {
    const md = compiledstrategy.module_run_order[ i ];
    const dataintegration_id = compiledstrategy.modules[ md.lookup_name ][ 0 ].dataintegration_id;
    if (md.type === 'dataintegration') {
      if (md.active) {
        compiledstrategy.modules[ md.lookup_name ][ 0 ].inputs.forEach(input => {
          if (input && input.input_type === 'variable' && input.input_variable) compiledstrategy.input_variables.push(input.input_variable);
        });
        compiledstrategy.modules[ md.lookup_name ][ 0 ].outputs.forEach(output => {
          if (output && output.output_variable) compiledstrategy.output_variables.push(output.output_variable);
        });

        md.credentials = (dataintegrationMap[ dataintegration_id ] && dataintegrationMap[ dataintegration_id ].credentials && dataintegrationMap[ dataintegration_id ].credentials[ compiledstrategy.status ])
          ? dataintegrationMap[ dataintegration_id ].credentials[ compiledstrategy.status ]
          : {};
        md.dataintegration = dataintegrationMap[ dataintegration_id ];
      }
    }
    if (md.active) {
      md.segments = await populateSegments(compiledstrategy, modules[ md.lookup_name ], variableMap);
      activePopulatedModules.push(md);
    }
  }
  compiledstrategy.module_run_order = activePopulatedModules;
  compiledstrategy.input_variables = compiledstrategy.input_variables.map(variable => variable.toString()).filter((v, i, a) => a.indexOf(v.toString()) === i);
  delete compiledstrategy.updatedat;
  delete compiledstrategy.createdat;
  delete compiledstrategy.modules;
  return compiledstrategy;
}

function setRuleOnRedis(rule, orgId, persist) {
  try {
    const env = periodic.environment;
    const redisClient = periodic.app.locals.redisClient;
    const ruleId = rule._id.toString();
    if (redisClient) {
      const ruleKey = getRedisRuleKey(ruleId, orgId);
      if (persist) {
        redisClient.set(ruleKey, JSON.stringify(rule));
      } else {
        redisClient.set(ruleKey, JSON.stringify(rule), 'EX', 21600);
      }
    }
  } catch (e) {
    return e;
  }
}

function getRedisRuleKey(ruleId, orgId) {
  const env = periodic.environment;
  return `${env}_${orgId}_rule_${ruleId}`;
}

function getRedisVariableKey(varId, orgId) {
  const env = periodic.environment;
  return `${env}_${orgId}_variable_${varId}`;
}

module.exports = {
  getVariableFromCache,
  getAllOrgVariableFromCache,
  getRuleFromCache,
  compileRuleDetail,
  populateSegments,
  compileModuleRunOrder,
  setRuleOnRedis,
  getRedisRuleKey,
  getRedisVariableKey,
};