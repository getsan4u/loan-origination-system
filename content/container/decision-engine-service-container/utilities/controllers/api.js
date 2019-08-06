'use strict';

const periodic = require('periodicjs');
const pluralize = require('pluralize');
const jsonToXML = require('convertjson2xml').singleton;
const helpers = require('../helpers');
const transformhelpers = require('../transformhelpers');
const logger = periodic.logger;

/**
 * Creates a dictionary of mongoids that map to documents
 * 
 * @param [Object] result array of mongo documents
 * @return dictionary of mongoids that map to documents
 */
function returnMapById(result) {
  try {
    let mapped = result.reduce((reduced, element) => {
      element = element.toJSON ? element.toJSON() : element;
      reduced[ element._id.toString() ] = element;
      return reduced;
    }, {});
    return mapped;
  } catch (err) {
    logger.error('returnMapById error', err);
  }
}

/**
 * Creates a dictionary of mongoids that map to documents
 * 
 * @param [Object] variables array of calculated variables for a specific type e.g. scorecard
 * @return [Object] array of ordered calculation variable for the credit process
 */
function getOrderedCalculationArray(variables, variableMap) {
  try {
    variables = variables.reduce((reduced, element) => {
      if (element.required_calculated_variables.length) {
        let required_calculated_variables = element.required_calculated_variables.reduce((varList, variableId) => {
          if (element._id.toString() !== variableId.toString()) {
            let variable = variableMap[ variableId.toString() ];
            varList.push({
              title: variable.title,
              state_property_attribute: variable.title.replace(/\s/g, '_'),
              calculation_operation: variable.value,
              data_type: variable.data_type,
              type: variable.type,
            });
          }
          return varList;
        }, []);
        reduced.push(...required_calculated_variables);
      }
      reduced.push({
        title: element.title,
        state_property_attribute: element.title.replace(/\s/g, '_'),
        data_type: element.data_type,
        calculation_operation: element.value,
        type: element.type,
      });
      return reduced;
    }, []);
    return variables;
  } catch (err) {
    logger.error('getOrderedCalculationArray error', err);
  }
}

/**
 * Populates the rules and variables on the segment
 * 
 * @param {Object} segment segment to be populated
 * @param {Object} ruleMap Map of all the rules that are in the strategy
 * @param {Object} variableMap Map of all the variables that are in the strategy
 * @return {Object} populated and trimmed down segment detail object 
 */
function mapSegmentRules(segment, index, ruleMap, variableMap) {
  try {
    let cleanFields = [ 'title', 'name', 'rulesets', 'version', 'description', 'user', 'createdat', 'updatedat', 'required_calculated_variables', 'required_input_variables', '__v', 'locked', 'entitytype', 'latest_version' ];
    segment.conditions.rules = segment.conditions.rules.map(ruleId => {
      let rule = ruleMap[ ruleId.toString() ] ? Object.assign({}, ruleMap[ ruleId.toString() ]) : {};
      rule.state_property_attribute = rule.state_property_attribute ? variableMap[ rule.state_property_attribute._id ].title.replace(/\s/g, '_') : '';
      cleanFields.forEach(field => {
        delete rule[ field ];
      });
      return rule;
    });
    segment.ruleset.rules = segment.ruleset.rules.map(ruleId => {
      let rule = ruleMap[ ruleId.toString() ] ? Object.assign({}, ruleMap[ ruleId.toString() ]) : {};
      rule.state_property_attribute = rule.state_property_attribute ? variableMap[ rule.state_property_attribute._id ].title.replace(/\s/g, '_') : '';
      cleanFields.forEach(field => {
        delete rule[ field ];
      });
      return rule;
    });
    return { name: `${segment.type}_${index}`, conditions: { rules: segment.conditions.rules }, ruleset: { rules: segment.ruleset.rules } };
  } catch (err) {
    logger.error('mapSegmentRules error', err);
  }
}

function findUniqueVariable(array) {
  try {
    let unique = {};
    let distinct = [];
    for (let i = 0; i < array.length; i++) {
      if (!unique[ array[ i ].state_property_attribute ]) {
        distinct.push(array[ i ]);
      }
      unique[ array[ i ].state_property_attribute ] = 1;
    }
    return distinct;
  } catch (err) {
    logger.error('findUniqueVariable error', err);
  }
}

/**
 * Formats response.
 * @param {Object} req Express req object.
 * @returns {Object} Returns formatted response.
 */
function formatResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let body = req.body;
    let results = req.controllerData.creditEngineResponse;
    let formattedResults = Object.assign({}, results[ 0 ]);
    if (req.body.return_input_variables === undefined || req.body.return_input_variables !== true) delete formattedResults.input_variables;
    if (req.body.return_processing_detail === undefined || req.body.return_processing_detail !== true) delete formattedResults.processing_detail;
    if (req.body.return_data_sources === undefined || req.body.return_data_sources !== true) delete formattedResults.data_sources;
    delete formattedResults.credit_process;
    return Object.assign({}, {
      client_id: body.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: JSON.parse(JSON.stringify(req._startTime)),
      response_date: JSON.parse(JSON.stringify(new Date())),
      request_id: null,
      client_transaction_id: (req.body.client_transaction_id) ? `${req.body.client_transaction_id}`: undefined,
      strategy_name: body.strategy_name,
      strategy_version: req.controllerData.compiled_strategy.version,
      strategy_status: body.strategy_status,
      application_id: req.body.application_id || null,
      results: formattedResults,
    });
  } catch (err) {
    logger.error('formatResponse error', err);
    return err;
  }
}

/**
 * Formats batch BRE response.
 * @param {Object} req Express req object.
 * @returns {Object} Returns formatted response.
 */
function batchFormatBREResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.results = req.controllerData.results.map((result, idx) => {
      let input_variables = req.body.variables[ idx ];
      let updatedResult = Object.assign({
        strategy_name: input_variables.strategy_name,
        strategy_version: input_variables.strategy_version,
        strategy_status: input_variables.strategy_status,
      }, result);
      if (req.body.return_input_variables) {
        updatedResult.input_variables = input_variables;
        delete updatedResult.input_variables.strategy_name;
        delete updatedResult.input_variables.strategy_status;
        delete updatedResult.input_variables.strategy_version;
        delete updatedResult.input_variables.idx;
      } else {
        delete updatedResult.input_variables;
      }
      delete updatedResult.idx;
      delete updatedResult.data_sources;
      if(req.body.return_processing_detail === undefined || req.body.return_processing_detail !== true) delete updatedResult.processing_detail;
      return updatedResult;
    }).filter(result => {
      if (req.body.return_only_passes) {
        if(result.passed) return result
      } else {
        return result;
      }
    })

    return Object.assign({}, {
      client_id: req.body.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: JSON.parse(JSON.stringify(req._startTime)),
      response_date: JSON.parse(JSON.stringify(new Date())),
      request_id: null,
      client_transaction_id: (req.body.client_transaction_id) ? `${req.body.client_transaction_id}`: undefined,
      application_id: req.body.application_id || null,
      results: req.controllerData.results,
      global_input_variables: (req.body.return_input_variables) ? req.body.global_variables : undefined,
    });
  } catch (err) {
    logger.error('formatResponse error', err);
    return err;
  }
}

function getMLResults(type, prediction) {
  if (type === 'binary') {
    return prediction.predictedScores[ prediction.predictedLabel ];
  } else if (type === 'categorical') {
    return prediction.predictedLabel;
  } else if (type === 'regression') {
    return prediction.predictedValue;
  } else {
    return 'Error retrieving prediction values';
  }
}

/**
 * Formats machine learning response.
 * @param {Object} req Express req object.
 * @returns {Object} Returns formatted response.
 */
function formatMLResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let body = req.body;
    let MLType = (req.controllerData.data && req.controllerData.data.type) ? req.controllerData.data.type : null; // binary, regression, categorical
    return Object.assign({}, {
      client_id: body.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: JSON.parse(JSON.stringify(req._startTime)),
      response_date: JSON.parse(JSON.stringify(new Date())),
      request_id: req.controllerData.single_ml_result.request_id,
      client_transaction_id: (req.body.client_transaction_id) ? `${req.body.client_transaction_id}` : undefined,
      model_name: req.body.model_name,
      decision: getMLResults(MLType, req.controllerData.single_ml_result.prediction.Prediction),
    });
  } catch (err) {
    logger.error('formatResponse error', err);
    return err;
  }
}

/**
 * Formats batch machine learning response.
 * @param {Object} req Express req object.
 * @returns {Object} Returns formatted response.
 */
function batchFormatMLResponse(req) {
  req.controllerData = req.controllerData || {};
  req.controllerData.batch_results = req.controllerData.batch_results.map((result, idx) => {
    let { ai_prediction_subtitle, ai_prediction_value, ai_categorical_value, binary_value } = transformhelpers.returnAIDecisionResultData(result);
    let input_variables = req.body.variables[ idx ];
    let updatedResult = Object.assign({}, {
      model_name: input_variables.model_name,
      decision: (result.model_type === 'binary')
        ? binary_value :  
        (result.model_type === 'categorical')?
          ai_prediction_value : Number(ai_prediction_value),
      digifi_score: result.digifi_score || null,
    });
    if (req.body.return_input_variables) {
      delete input_variables.model_name;
      updatedResult.input_variables = input_variables;
    }
    
    if (req.body.return_top_contributors) {
      let explainability_results = result.explainability_results;
      let explainability_comparisons;
      if (explainability_results) {
        let input_value = (result.model_type === 'categorical') 
          ? ai_categorical_value 
          : (result.model_type === 'binary') 
            ? binary_value
            : ai_prediction_value;
        
        explainability_comparisons = Object.keys(explainability_results).reduce((aggregate, variable, i) => {
          let reassigned_mlcase = Object.assign({}, result, {
            prediction: explainability_results[ variable ],
          });
          let explainability_prediction = (result.model_type === 'categorical') 
            ? transformhelpers.returnAIDecisionResultData(reassigned_mlcase).ai_categorical_value 
            : (result.model_type === 'binary')
              ? transformhelpers.returnAIDecisionResultData(reassigned_mlcase).binary_value
              : transformhelpers.returnAIDecisionResultData(reassigned_mlcase).ai_prediction_value;
          return aggregate.concat({
            variable,
            decision_impact: (result.model_type === 'regression') ? Number((Number(input_value) - Number(explainability_prediction)).toFixed(2)) : Number((Number(input_value) - Number(explainability_prediction)).toFixed(4)),
          });
        }, []).sort((a, b) => b.decision_impact - a.decision_impact);
        let positive_contributors = explainability_comparisons.filter(config => config.decision_impact > 0);
        let negative_contributors = explainability_comparisons.reverse().filter(config => config.decision_impact < 0)
        updatedResult.top_positive_contributors = positive_contributors.slice(0, 5).reduce((aggregate, config, i) => {
          aggregate[i + 1] = config.variable;
          return aggregate;
        }, {});
        updatedResult.top_negative_contributors = negative_contributors.slice(0, 5).reduce((aggregate, config, i) => {
          aggregate[i + 1] = config.variable;
          return aggregate;
        }, {});
      }
    }

    return updatedResult;
  });

  return Object.assign({}, {
    client_id: req.body.client_id,
    status_code: 200,
    status_message: 'Success',
    request_date: JSON.parse(JSON.stringify(req._startTime)),
    response_date: JSON.parse(JSON.stringify(new Date())),
    request_id: null,
    client_transaction_id: (req.body.client_transaction_id) ? `${req.body.client_transaction_id}` : undefined,
    results: req.controllerData.batch_results,
    global_input_variables: (req.body.return_input_variables) ? req.body.global_variables : undefined,
  });
}

function formatXMLErrorResponse(e) {
  let errorObj = {
    'result': 'error',
    'error': {
      'message': (e && e.message) ? e.message : e,
    },
  };
  let xml = jsonToXML(errorObj);
  return xml;
}


module.exports = {
  returnMapById,
  getOrderedCalculationArray,
  mapSegmentRules,
  findUniqueVariable,
  formatResponse,
  batchFormatBREResponse,
  batchFormatMLResponse,
  formatMLResponse,
  formatXMLErrorResponse,
};