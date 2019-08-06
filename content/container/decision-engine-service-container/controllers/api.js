'use strict';

const periodic = require('periodicjs');
const Promisie = require('promisie');
const utilities = require('../utilities');
const helpers = utilities.helpers;
const getCollectionCounter = helpers.getCollectionCounter;
const api_utilities = utilities.controllers.api;
const integration_helper = utilities.controllers.integration;
const logger = periodic.logger;
const jsonToXML = require('convertjson2xml').singleton;
const moment = require('moment');
const fs = Promisie.promisifyAll(require('fs-extra'));
const CREDIT_PIPELINE = require('@digifi-los/credit-process');
let credit_engine = CREDIT_PIPELINE(periodic);
const Bluebird = require('bluebird');
const path = require('path');
const flatten = require('flat');

/**
 * 
 * Check if public key exists and is valid.
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
function checkPublicKey(req, res, next) {
  try {
    if (req.body.client_public_key === req.user.public_key) return next();
    else {
      let response = {
        status_code: 401,
        status_message: 'Unauthorized',
        error: [
          {
            message: 'The authentication credentials were incorrect.',
          },
        ],
      };
      if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
        res.set('Content-Type', 'application/xml');
        let xml = jsonToXML(response);
        if (xml instanceof Error) {
          return res.status(401).send(xml.message);
        } else {
          return res.status(401).send(xml);
        }
      } else {
        return res.status(401).send(response);
      }
    }
  } catch (err) {
    logger.error('checkPublicKey error', err);
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(err);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return next(err);
    }
  }
}

/**
 * 
 * Checks if Strategy exists in the system before API call
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
async function checkStrategyExists(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const CompiledStrategies = periodic.datas.get('standard_compiledstrategy');
    let title = `${req.body.strategy_name}`;
    let status = req.body.strategy_status || 'testing';
    req.user = (req.user && req.user.toJSON) ? req.user.toJSON() : req.user;
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : (user && user.association && user.association.organization) ? user.association.organization.toString() : 'organization';
    let query = { title, status, organization, };
    let compiled_strategy = await CompiledStrategies.load({ query, });
    if (!compiled_strategy) {
      let response = {
        status_code: 404,
        status_message: 'Strategy Not Found',
        error: [
          {
            message: 'The requested strategy cannot be found.',
          },
        ],
      };
      if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
        res.set('Content-Type', 'application/xml');
        let xml = jsonToXML(response);
        if (xml instanceof Error) {
          return res.status(404).send(xml.message);
        } else {
          return res.status(404).send(xml);
        }
      } else {
        return res.status(404).send(response);
      }
    }
    req.controllerData.compiled_strategy = compiled_strategy;
    return next();
  } catch (err) {
    logger.warn('Error in checkStrategyExists: ', err);
    return next(err);
  }
}

/**
 * 
 * Checks if API request contains all necessary and properly typed input variables to run a compiled strategy
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
async function checkVariables(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const CompiledStrategies = periodic.datas.get('standard_compiledstrategy');
    let name = `${req.body.strategy_name}`;
    let status = req.body.strategy_status || 'testing';
    req.user = (req.user && req.user.toJSON) ? req.user.toJSON() : req.user;
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = { name, status, organization, };
    let missingVariables = [];
    let mistypedVariables = [];
    let compiled_strategy = await CompiledStrategies.load({ query, });
    if (!compiled_strategy) {
      return res.send({
        status: 404,
        message: 'Strategy not found',
      });
    }

    req.controllerData.compiled_strategy = compiled_strategy;
    let inputVariables = compiled_strategy.input_variables;

    inputVariables.forEach(v => {
      if (v.data_type && v.title && typeof utilities.helpers.flatten(req.body.variables)[ v.title ] === 'undefined') missingVariables.push(`${v.title} (${v.data_type})`);
      if (v.data_type && v.title && utilities.helpers.flatten(req.body.variables)[ v.title ] && typeof utilities.helpers.flatten(req.body.variables)[ v.title ] !== v.data_type.toLowerCase()) mistypedVariables.push(`${v.title} (needs to be ${v.data_type})`);
    });
    let errorArr = [];

    if (missingVariables.length) {
      errorArr.push({
        code: 'missingVariables',
        message: `The following input variables are missing and required: ${missingVariables}.\r\n`,
      });
    }

    if (mistypedVariables.length) {
      errorArr.push({
        code: 'mistypedVariables',
        message: `The following input variables are available in the request, but incorrectly typed: ${mistypedVariables}.\r\n`,
      });
    }

    if (errorArr.length) {
      return res.status(400).send({
        client_id: req.body.client_id,
        request_id: 'placeholder',
        status_code: 400,
        status_message: 'Bad Request',
        request_date: req._startTime,
        response_date: new Date(Date.now()),
        strategy_name: req.body.strategy_name,
        strategy_version: req.controllerData.compiled_strategy.version,
        error: errorArr,
      });
    } else {
      return next();
    }
  } catch (err) {
    logger.error('checkVariables error', err);
    return next(err);
  }
}

function stageRequest(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.controllerData.stagedData = Object.assign({}, req.body.variables, { 'strategy_status': req.body.strategy_status, });
  return next();
}


function stageOCRRequest(req, res, next) {
  req.controllerData = req.controllerData || {};
  return next();
}

/**
 * 
 * Runs credit engine.
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
function runCreditEngine(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let strategy_name = (req.controllerData.compiled_strategy && req.controllerData.compiled_strategy.name) ? req.controllerData.compiled_strategy.name : '';
    let organization = (req.user && req.user.association && req.user.association.organization && req.user.association.organization._id) ? req.user.association.organization._id : '';
    let credit_pipeline = periodic.app.locals.credit_engines[ organization ][ strategy_name ].engine;
    Promisie.all(credit_pipeline(req.controllerData.stagedData))
      .then(results => {
        req.controllerData.creditEngineResponse = results;
        return next();
      })
      .catch(err => {
        logger.error('credit pipeline error: ', err);
        return next(err);
      });
  } catch (err) {
    logger.error('runCreditEngine error', err);
    return next(err);
  }
}

/**
 * 
 * Formats response object.
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
function formatResponse(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.controllerData.case_module_order = (req.controllerData.creditEngineResponse && req.controllerData.creditEngineResponse[ 0 ] && Array.isArray(req.controllerData.creditEngineResponse[ 0 ].processing_detail)) ? [ ...req.controllerData.creditEngineResponse[ 0 ].processing_detail ] : [];
  let response = utilities.controllers.api.formatResponse(req);
  if (response instanceof Error) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(response);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return next(response);
    }
  } else {
    req.controllerData.results = response;
    return next();
  }
}

/**
 * 
 * Formats response object.
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
function batchFormatResponse(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.controllerData.cases_module_order = req.controllerData.results.map(result => result.processing_detail || []);
  let response = utilities.controllers.api.batchFormatBREResponse(req);
  if (response instanceof Error) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(response);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return next(response);
    }
  } else {
    req.controllerData.results = response;
    return next();
  }
}


/**
 * 
 * Put all the variables on req.controllerData.
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 */
function getVariables(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Variable = periodic.datas.get('standard_variable');
  let client = req.controllerData.client;
  let user = req.user;
  let organization = (client && client.association && client.association.organization && client.association.organization._id)
    ? client.association.organization._id.toString()
    : user && user.association && user.association.organization && user.association.organization._id
      ? user.association.organization._id.toString()
      : req.params && req.params.id
        ? req.params.id
        : 'organization';
  Variable.model.find({ organization, })
    .then(variables => {
      req.controllerData.inputVariables = variables.filter(i => i.type === 'Input').sort((a, b) => (a.title.toUpperCase() < b.title.toUpperCase()) ? -1 : (a.title.toUpperCase() > b.title.toUpperCase()) ? 1 : 0);
      req.controllerData.outputVariables = variables.filter(i => i.type === 'Output').sort((a, b) => (a.title.toUpperCase() < b.title.toUpperCase()) ? -1 : (a.title.toUpperCase() > b.title.toUpperCase()) ? 1 : 0);
      return next();
    })
    .catch(err => {
      logger.error('Unable to load variables', err);
      return next(err);
    });
}

/**
 * 
 * Put api tabs on req.controllerData.
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 */
function apiTabs(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const client = req.controllerData.org ? req.controllerData.org.association.client : {};
    const { client_id, public_key, client_secret, } = client;
    let request = {
      'client_id': client_id,
      'client_public_key': public_key,
      'client_secret': client_secret,
      'client_transaction_id': 'your_optional_id',
      'strategy_name': 'your_strategy',
      'strategy_status': 'testing',
      'return_input_variables': false,
      'return_processing_detail': false,
      'return_data_sources': false,
      'variables': req.controllerData.populatedUniqueVar,
    };
    let response = {
      'client_id': client_id || req.params.client_id,
      'status_code': 200,
      'status_message': 'Success',
      'request_date': '2018-01-01T00:00:00.000Z',
      'response_date': '2018-01-01T00:00:00.000Z',
      'request_id': 100000,
      'client_transaction_id': 'your_optional_id',
      'strategy_name': 'your_strategy',
      'strategy_version': 1,
      'strategy_status': 'testing',
      'results': {
        'passed': true,
        'decline_reasons': [],
        'output_variables': {
          'your_first_output_variable': 'string',
          'your_second_output_variable': 0,
          'your_third_output_variable': true,
        },
      },
    };
    req.controllerData.responseFormat = response; // for downloading response format
    req.controllerData.results = Object.assign({}, req.controllerData.results, {
      requestTabs: [ {
        name: 'JSON',
        layout: {
          component: 'CodeMirror',
          props: {
            codeMirrorProps: {
              options: {
                mode: 'javascript',
              },
            },
            value: JSON.stringify(request, null, 2),
          },
        },
      }, {
        name: 'XML',
        layout: {
          component: 'CodeMirror',
          props: {
            codeMirrorProps: {
              options: {
                mode: 'xml',
              },
            },
            value: jsonToXML(request),
          },
        },
      },
      ],
    }, {
        responseTabs: [ {
          name: 'JSON',
          layout: {
            component: 'CodeMirror',
            props: {
              codeMirrorProps: {
                options: {
                  mode: 'javascript',
                },
              },
              value: JSON.stringify(response, null, 2),
            },
          },
        }, {
          name: 'XML',
          layout: {
            component: 'CodeMirror',
            props: {
              codeMirrorProps: {
                options: {
                  mode: 'xml',
                },
              },
              value: jsonToXML(response),
            },
          },
        },
        ],
      });
    return next();
  } catch (err) {
    logger.error('Error with apiTabs', err);
    return next(err);
  }
}

/**
 * 
 * Downloads request and response file.
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 */
function apiDownload(req, res, next) {
  let reqParams = req.params;
  req.controllerData = req.controllerData || {};
  let apiResponse = req.controllerData.responseFormat;
  const exportName = apiResponse
    ? `response_format.${req.params.format}`
    : `request_format.${req.params.format}`;
  const tempdir = path.join(process.cwd(), 'content/files/temp');
  const tempFilepath = path.join(tempdir, exportName);
  const mimetype = (req.params && req.params.format === 'json')
    ? 'application/json'
    : 'application/xml';
  let request;
  switch (req.originalUrl.split('/')[ 4 ]) {
    case 'text_recognition':
      request = {
        'client_id': req.controllerData.client.client_id,
        'client_public_key': req.controllerData.client.public_key,
        'client_secret': req.controllerData.client.client_secret,
        'client_transaction_id': '123',
        'template_name': req.controllerData.compiledStrategy.title,
        'detailed_results': true,
        variables: req.controllerData.populatedUniqueVar,
      };
      break;
    case 'machine_learning':
      request = (reqParams.type === 'individual') ? {
        'client_id': req.controllerData.client.client_id,
        'client_public_key': req.controllerData.client.public_key,
        'client_secret': req.controllerData.client.client_secret,
        'client_transaction_id': '123',
        'return_input_variables': false,
        'return_top_contributors': false,
        'model_name': req.controllerData.mlmodel.name,
        inputs: req.controllerData.populatedUniqueVar,
      } : {
          'client_id': req.controllerData.client.client_id,
          'client_public_key': req.controllerData.client.public_key,
          'client_secret': req.controllerData.client.client_secret,
          'client_transaction_id': '123',
          'return_top_contributors': false,
          'return_input_variables': false,
          global_variables: {},
          variables: [ Object.assign({}, {
            'model_name': req.controllerData.mlmodel.name,
          }, req.controllerData.populatedUniqueVar), ],
        };
      break;
    case 'rules_engine':
      request = (reqParams.type === 'individual') ? {
        'client_id': req.controllerData.client.client_id,
        'client_public_key': req.controllerData.client.public_key,
        'client_secret': req.controllerData.client.client_secret,
        'client_transaction_id': '123',
        'strategy_name': req.controllerData.compiledStrategy.title,
        'strategy_status': 'testing',
        'return_input_variables': false,
        'return_processing_detail': false,
        'return_data_sources': false,
        variables: req.controllerData.populatedUniqueVar,
      } : {
          'client_id': req.controllerData.client.client_id,
          'client_public_key': req.controllerData.client.public_key,
          'client_secret': req.controllerData.client.client_secret,
          'client_transaction_id': '123',
          'return_input_variables': false,
          'return_only_passes': false,
          global_variables: {},
          variables: [ Object.assign({}, {
            'strategy_name': req.controllerData.compiledStrategy.title,
            'strategy_status': 'testing',
          }, req.controllerData.populatedUniqueVar), ],
        };
      break;
  }
  const requestFile = (reqParams && reqParams.format === 'json')
    ? JSON.stringify(apiResponse || request, null, 2)
    : jsonToXML(apiResponse || request);
  const cleanupTempFile = () => {
    let t = setTimeout(() => {
      fs.remove(tempFilepath, (err) => {
        if (err) logger.error(err);
      });
      clearTimeout(t);
    }, 10000);
  };
  fs.ensureDir(tempdir, err => {
    if (err) {
      return next(err);
    }
    fs.outputFileAsync(tempFilepath, requestFile)
      .then(() => {
        res.setHeader('Content-disposition', 'attachment; filename=' + exportName);
        res.setHeader('Content-type', mimetype);
        res.download(tempFilepath, exportName);
        cleanupTempFile();
      })
      .catch(err => {
        logger.error('Unable to output file', err);
        return next(err);
      });
  });
}

/**
 * 
 * Creates hiddendata field for downloading api request.
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 */
function hiddenData(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const client = req.controllerData.org.association.client;
    req.controllerData.results = [
      {
        'form_name': 'client_id',
        'form_static_val': client.client_id,
      },
      {
        'form_name': 'client_secret',
        'form_static_val': client.client_secret,
      },
      {
        'form_name': 'public_key',
        'form_static_val': client.public_key,
      },
    ];
    return next();
  } catch (err) {
    logger.error('hiddenData error', err);
    return next(err);
  }
}

/**
 * 
 * Sends back response.
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
function sendResponse(req, res) {
  req.controllerData = req.controllerData || {};
  if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
    res.set('Content-Type', 'application/xml');
  }
  return res.status(200).send(req.controllerData.results
    ? req.controllerData.results
    : {
      result: 'success',
      data: req.controllerData,
    });
}

function sendSuccess(req, res) {
  return res.status(200).send({ message: 'Success' });
}

async function getModuleCounts(modules) {
  let result = {
    requirements_rule_count: 0,
    scoring_model_count: 0,
    rule_based_output_count: 0,
    simple_output_count: 0,
    calculation_scripts_count: 0,
    data_integration_count: 0,
    email_count: 0,
    text_message_count: 0,
    ai_model_count: 0,
  };

  modules.forEach(module => {
    if (module.type === 'calculations') result.calculation_scripts_count += 1;
    if (module.type === 'assignments') result.simple_output_count += 1;
    if (module.type === 'requirements') result.requirements_rule_count += 1;
    if (module.type === 'scorecard') result.scoring_model_count += 1;
    if (module.type === 'output') result.rule_based_output_count += 1;
    if (module.type === 'email') result.email_count += 1;
    if (module.type === 'textmessage') result.text_message_count += 1;
    if (module.type === 'dataintegration') result.data_integration_count += 1;
    if (module.type === 'artificialintelligence') result.ai_model_count += 1;
    if (module.type === 'documentocr') result.document_ocr_count += 1;
    if (module.type === 'documentcreation') result.document_creation_count += 1;
  });

  return result;
}

async function createAPIRequestRecord(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Request = periodic.datas.get('standard_request');
  let moduleCounts = await getModuleCounts(req.controllerData.compiled_strategy.module_run_order);
  let request_count = await getCollectionCounter('standard_request');
  Request.create({
    newdoc: Object.assign({}, {
      client_id: req.body.client_id,
      request_id: request_count,
      client_transaction_id: req.body.client_transaction_id || null,
      strategy_name: req.body.strategy_name,
      strategy_version: req.controllerData.compiled_strategy.version,
      strategy_status: req.body.strategy_status,
      type: 'Rules Engine - API',
      organization: req.user.association.organization._id,
    }, moduleCounts, {
        overall_count: 1,
      }),
  }).then(createdRequest => {
    req.controllerData.request = createdRequest;
    next();
  });
}

async function createBatchAPIRequestRecord(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Request = periodic.datas.get('standard_request');
  // let moduleCounts = await getModuleCounts(req.controllerData.compiled_strategy.module_run_order);
  let request_count = await getCollectionCounter('standard_request');
  Request.create({
    newdoc: Object.assign({}, {
      client_id: req.body.client_id,
      request_id: request_count,
      client_transaction_id: req.body.client_transaction_id || null,
      type: 'Rules Engine - API - Batch',
      organization: req.user.association.organization._id,
    }),
  }).then(createdRequest => {
    req.controllerData.request = createdRequest;
    next();
  });
}

async function createAPIMLRequestRecord(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Request = periodic.datas.get('standard_request');
  let request_count = await getCollectionCounter('standard_request');
  let createdRequest = await Request.create({
    newdoc: Object.assign({}, {
      client_id: req.body.client_id,
      request_id: request_count,
      client_transaction_id: req.body.client_transaction_id || null,
      type: 'Machine Learning - API',
      organization: req.user.association.organization._id,
    }),
  });
  req.controllerData.request = createdRequest;
  next();
}

async function createAPIMLBatchRequestRecord(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Request = periodic.datas.get('standard_request');
  let request_count = await getCollectionCounter('standard_request');
  let createdRequest = await Request.create({
    newdoc: Object.assign({}, {
      client_id: req.body.client_id,
      request_id: request_count,
      client_transaction_id: req.body.client_transaction_id || null,
      type: 'Machine Learning - API - Batch',
      organization: req.user.association.organization._id,
    }),
  });
  req.controllerData.request = createdRequest;
  next();
}

async function createSimulationRequestRecord(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Request = periodic.datas.get('standard_request');
  let moduleCounts = await getModuleCounts(req.controllerData.compiledStrategy.module_run_order);
  let cs = req.controllerData.compiledStrategy;
  let request_count = await getCollectionCounter('standard_request');
  Request.create({
    newdoc: Object.assign({}, {
      client_id: req.body.client_id,
      request_id: request_count,
      client_transaction_id: req.body.client_transaction_id || null,
      strategy_name: cs.title,
      strategy_version: cs.version,
      strategy_status: cs.status,
      type: 'Online',
      organization: req.user.association.organization._id,
    }, moduleCounts, {
        overall_count: (req.controllerData.testcases && req.controllerData.testcases.length) ? req.controllerData.testcases.length : 1,
      }),
  }).then(createdRequest => {
    req.controllerData.request = createdRequest;
    next();
  });
}

async function updateAPIRequestRecord(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Request = periodic.datas.get('standard_request');
  let result = req.controllerData.results;
  let updatedoc = {
    status_code: result.status_code,
    error: [],
    response_date: result.response_date,
  };
  Request.update({
    id: req.controllerData.request._id.toString(),
    updatedoc,
    isPatch: true,
  })
    .then(() => {
      next();
    })
    .catch(err => {
      next();
    });
}

async function updateSimulationRequestRecord(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Request = periodic.datas.get('standard_request');
  let updatedoc = {
    status_code: 200,
    error: [],
    response_date: Date.now(),
  };
  try {
    await Request.update({
      id: req.controllerData.request._id.toString(),
      updatedoc,
      isPatch: true,
    });
    return next();
  } catch (err) {
    return next(err);
  }
}

async function fetchAllDocumentTemplatesFromAWS(req, res, next) {
  try {
    if (req.controllerData.compiled_strategy && req.controllerData.compiled_strategy.templates && req.controllerData.compiled_strategy.templates.length) {
      await helpers.checkDocumentTemplateFromLocalDirectory({ template: req.controllerData.compiled_strategy.templates, });
    }
    next();
  } catch (e) {
    next();
  }
}

/**
 * Pulls the strategy and compiles it for simulation.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {Function} next Express next function.
 */
async function initializeStrategyForApiCompilation(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const { org, } = req.controllerData;
    const orgId = (org && org._id) ? org._id.toString() : 'organization';
    let strategy = req.controllerData.strategy;
    let compiledStrategy;
    let init_compiled_strategy = Object.assign({}, strategy, { input_variables: [], calculated_variables: [], output_variables: [], rules: [], decline_reasons: [], templates: [], });
    if (strategy && strategy.status) {
      req.controllerData.strategy_status = (strategy.status === 'testing' || strategy.status === 'inactive') ? 'testing' : 'active';
    } else {
      req.controllerData.strategy_status = 'testing';
    }
    compiledStrategy = init_compiled_strategy;
    let dataintegrations = req.controllerData.dataintegrations || [];
    const variableMap = await integration_helper.getAllOrgVariableFromCache(orgId);
    req.controllerData.compiled_strategy = await integration_helper.compileModuleRunOrder(req, compiledStrategy, dataintegrations, variableMap);
    req.controllerData.compiled_order = req.controllerData.compiled_strategy.module_run_order.map(md => ({
      name: md.name,
      display_name: md.display_name,
      type: md.type,
      lookup_name: md.lookup_name,
      active: md.active,
    }));

    req.controllerData.compiled_strategy.output_variables = req.controllerData.compiled_strategy.output_variables || [];

    req.controllerData.compiled_strategy.input_variables = req.controllerData.compiled_strategy.input_variables || [];

    req.controllerData.compiled_strategy.calculated_variables = req.controllerData.compiled_strategy.calculated_variables || [];

    const filteredOutputVariables = req.controllerData.compiled_strategy.output_variables.filter((v, i, a) => a.indexOf(v) === i);
    for (let i = 0; i < filteredOutputVariables.length; i++) {
      filteredOutputVariables[ i ] = variableMap[ filteredOutputVariables[ i ] ];
    }
    req.controllerData.compiled_strategy.output_variables = filteredOutputVariables;

    const filteredInputVariables = req.controllerData.compiled_strategy.input_variables.filter((v, i, a) => a.indexOf(v) === i);
    for (let i = 0; i < filteredInputVariables.length; i++) {
      filteredInputVariables[ i ] = variableMap[ filteredInputVariables[ i ] ];
    }
    req.controllerData.compiled_strategy.input_variables = filteredInputVariables;

    const filteredCalculatedVariables = req.controllerData.compiled_strategy.calculated_variables.filter((v, i, a) => a.indexOf(v) === i);
    for (let i = 0; i < filteredCalculatedVariables.length; i++) {
      filteredCalculatedVariables[ i ] = variableMap[ filteredCalculatedVariables[ i ] ];
    }
    req.controllerData.compiled_strategy.calculated_variables = filteredCalculatedVariables;
    next();
  } catch (err) {
    logger.error('initializeStrategyForCompilation error', err);
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(err);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return next(err);
    }
  }
}

/**
 * Pulls the strategy and compiles it for simulation.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {Function} next Express next function.
 */
async function batchInitializeStrategiesForCompilation(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const { org, } = req.controllerData;
    const orgId = (org && org._id) ? org._id.toString() : 'organization';
    let { uniqueStrategies, dataintegrations, } = req.controllerData;
    const variableMap = await integration_helper.getAllOrgVariableFromCache(orgId);
    let strategies = Object.keys(uniqueStrategies);
    for (let strat of strategies) {
      let statuses = Object.keys(uniqueStrategies[ strat ]);
      for (let status of statuses) {
        let strategy = uniqueStrategies[ strat ][ status ];
        if (strategy === true) next(`Missing strategy ${strat} with status ${status}`);
        let compiledStrategy = Object.assign({}, strategy, { input_variables: [], calculated_variables: [], output_variables: [], rules: [], decline_reasons: [], templates: [], });
        compiledStrategy = await integration_helper.compileModuleRunOrder(req, compiledStrategy, dataintegrations, variableMap);

        compiledStrategy.output_variables = compiledStrategy.output_variables || [];

        compiledStrategy.input_variables = compiledStrategy.input_variables || [];

        compiledStrategy.calculated_variables = compiledStrategy.calculated_variables || [];

        const filteredOutputVariables = compiledStrategy.output_variables.filter((v, i, a) => a.indexOf(v) === i);
        for (let i = 0; i < filteredOutputVariables.length; i++) {
          filteredOutputVariables[ i ] = variableMap[ filteredOutputVariables[ i ] ];
        }
        compiledStrategy.output_variables = filteredOutputVariables;

        const filteredInputVariables = compiledStrategy.input_variables.filter((v, i, a) => a.indexOf(v) === i);
        for (let i = 0; i < filteredInputVariables.length; i++) {
          filteredInputVariables[ i ] = variableMap[ filteredInputVariables[ i ] ];
        }
        compiledStrategy.input_variables = filteredInputVariables;

        const filteredCalculatedVariables = compiledStrategy.calculated_variables.filter((v, i, a) => a.indexOf(v) === i);
        for (let i = 0; i < filteredCalculatedVariables.length; i++) {
          filteredCalculatedVariables[ i ] = variableMap[ filteredCalculatedVariables[ i ] ];
        }
        compiledStrategy.calculated_variables = filteredCalculatedVariables;

        uniqueStrategies[ strat ][ status ] = compiledStrategy;
      }
    }
    return next();
  } catch (err) {
    logger.error('initializeStrategyForCompilation error', err);
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(err);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return next(err);
    }
  }
}

/**
 * Saves strategies data onto req.controllerData.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getApiStrategy(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let user = req.user;
    let status = req.body.strategy_status || 'testing';
    const Strategy = periodic.datas.get('standard_strategy');
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    if (req.body.strategy_name) {
      let query = { title: req.body.strategy_name, status, organization, };
      let strategy = await Strategy.load({ query, });
      strategy = strategy.toJSON ? strategy.toJSON() : strategy;
      req.controllerData.strategy = strategy;
      return next();
    } else {
      throw new Error('Please specify the strategy_name.');
    }
  } catch (e) {
    e.message = 'Unable to find the requested strategy.';
    logger.error('Unable to find the requested strategy', e);
    delete e.stack;
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse('Unable to find the requested strategy.');
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return next('Unable to find the requested strategy.');
    }
  }
}

/**
 * Saves strategies data onto req.controllerData.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getBatchAPIStrategies(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let { uniqueStrategies, } = req.controllerData;
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const Strategy = periodic.datas.get('standard_strategy');
    let query = { status: { $in: [ 'active', 'testing', ], }, organization: organization, };
    let strategies = await Strategy.model.find(query);
    if (uniqueStrategies) {
      strategies.forEach(strat => {
        strat = strat.toJSON ? strat.toJSON() : strat;
        if (uniqueStrategies && uniqueStrategies[ strat.title ] && uniqueStrategies[ strat.title ][ strat.status ]) uniqueStrategies[ strat.title ][ strat.status ] = strat;
      });
      return next();
    }
    return next();
  } catch (e) {
    e.message = 'Unable to find the requested strategy.';
    delete e.stack;
    logger.error('Unable to find the requested strategy', e);
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse('Unable to find the requested strategy.');
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return next('Unable to find the requested strategy.');
    }
  }
}

function mlVariableCheck(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    let mlmodel = req.controllerData.mlmodel;
    let datasource = mlmodel.datasource;
    let ml_input_schema = datasource.included_columns || datasource.strategy_data_schema;
    let strategy_data_schema = JSON.parse(ml_input_schema);
    let mlVariables = Object.keys(strategy_data_schema).filter(variable => variable !== 'historical_result');
    let inputVariables = Object.keys(req.body.inputs);
    let hasAllVariables = true;
    let missingVariables = 'You are missing the following variables: ';
    mlVariables.forEach(variable => {
      if (!inputVariables.includes(variable)) {
        hasAllVariables = false;
        missingVariables = missingVariables + ` ${variable}`;
      } else if (inputVariables.includes(variable) && hasAllVariables) {
        hasAllVariables = true;
      }
    });
    if (!hasAllVariables) {
      if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
        let xmlError = api_utilities.formatXMLErrorResponse(missingVariables);
        res.set('Content-Type', 'application/xml');
        return res.status(400).send(xmlError);
      } else {
        return res.status(400).send({
          status_code: 400,
          status_message: 'Error',
          errors: [ {
            message: missingVariables,
          }, ],
        });
      }
    } else {
      next();
    }
  } catch (err) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(err);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return res.status(401).send({
        error: err,
      });
    }
  }
}

function runApiProcessEngine(req, res, next) {
  req.controllerData = req.controllerData || {};
  let query = {};
  let options = {
    compiledstrategy: req.controllerData.compiled_strategy,
  };
  credit_engine.generateCreditSegments(query, true, options)
    .then(loaded => loaded())
    .then(result => {
      let credit_pipeline = result[ 0 ].engine;
      return Promisie.all(credit_pipeline(req.controllerData.stagedData));
    })
    .then(results => {
      req.controllerData.creditEngineResponse = results;
      return next();
    })
    .catch(err => {
      logger.error('credit pipeline error: ', err);
      if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
        let xmlError = api_utilities.formatXMLErrorResponse(err);
        res.set('Content-Type', 'application/xml');
        return res.status(401).send(xmlError);
      } else {
        return next(err);
      }
    });
}

async function batchStageStrategies(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    req.controllerData.uniqueStrategies = {};
    if (!req.body.variables) req.body.variables = [];
    if (!Array.isArray(req.body.variables)) req.body.variables = [ req.body.variables, ];
    if (req.body.variables.length) {
      req.body.variables.forEach(vars => {
        if (!vars.strategy_name) return next('Missing strategy name on request');
        if (!vars.strategy_status) return next('Missing strategy status on request');
        req.controllerData.uniqueStrategies[ vars.strategy_name ] = req.controllerData.uniqueStrategies[ vars.strategy_name ] || {};
        req.controllerData.uniqueStrategies[ vars.strategy_name ][ vars.strategy_status ] = true;
      });
      next();
    } else {
      if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
        let xmlError = api_utilities.formatXMLErrorResponse({ message: 'Variables must be an array', });
        res.set('Content-Type', 'application/xml');
        return res.status(401).send(xmlError);
      } else {
        return next('Variables must be an array');
      }
    }
  } catch (err) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse({ message: 'Error reading variables.', });
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return next('Error reading variables.');
    }
  }
}

async function batchRunAPIProcessEngine(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { uniqueStrategies, } = req.controllerData;
  let { variables, global_variables, } = req.body;
  req.body.variables = req.body.variables.map((vars, idx) => {
    vars.idx = idx;
    return vars;
  });
  let creditSegments = {};
  let results = await variables.map(async vars => {
    let compiledstrategy = uniqueStrategies[ vars.strategy_name ][ vars.strategy_status ];
    let query = {};
    let options = {
      compiledstrategy,
    };
    vars.strategy_version = compiledstrategy.version;
    creditSegments[ compiledstrategy._id ] = creditSegments[ compiledstrategy._id ] || credit_engine.generateCreditSegments(query, true, options).then(loaded => loaded()).then(result => {
      let credit_pipeline = result[ 0 ].engine;
      return credit_pipeline;
    });

    return await creditSegments[ compiledstrategy._id ].then(pipeline => {
      return pipeline(Object.assign({}, global_variables, vars))
    });
  });
  Promise.all(results).then(finished => {
    finished = finished.map((result => {
      result.idx = result.input_variables.idx;
      delete result.input_variables.idx;
      return result;
    }));
    req.controllerData.results = finished;
    return next();
  });
}

async function limitMaxStrategies(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { org, } = req.controllerData;
  let error = null;
  let stratCount = (req.body && req.body.variables && req.body.variables.length) ? req.body.variables.length : 1;

  if (stratCount && org && org.billing && org.billing.max_api_batch && (stratCount > org.billing.max_api_batch)) {
    error = `Maximum number of strategies exceeded. Please limit batch requests to ${org.billing.max_api_batch} or less. Please contact DigiFi to increase.`;
  }

  if (error) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse({ error, });
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return res.status(401).send({
        error,
      });
    }
  } else {
    return next();
  }
}

async function batchMLVariableCheck(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    let models = req.controllerData.models;

    let datasources = models.map(model => {
      return model.datasource;
    });

    let ml_input_schemas = datasources.map(datasource => {
      let schema = datasource.included_columns || datasource.strategy_data_schema;
      return JSON.parse(schema);
    });

    let mlVariablesByModel = ml_input_schemas.map(schema => {
      return Object.keys(schema).filter(variable => variable !== 'historical_result');
    });

    let mlVariables = Object.keys(strategy_data_schema).filter(variable => variable !== 'historical_result');
    let inputVariables = Object.keys(req.body.inputs);
    let hasAllVariables = true;
    let missingVariables = 'You are missing the following variables: ';
    mlVariables.forEach(variable => {
      if (!inputVariables.includes(variable)) {
        hasAllVariables = false;
        missingVariables = missingVariables + ` ${variable}`;
      } else if (inputVariables.includes(variable) && hasAllVariables) {
        hasAllVariables = true;
      }
    });
    if (!hasAllVariables) {
      return res.status(400).send({
        status_code: 400,
        status_message: 'Error',
        errors: [ {
          message: missingVariables,
        }, ],
      });
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
}

async function batchFormatMLResponse(req, res, next) {
  req.controllerData = req.controllerData || {};
  let response = utilities.controllers.api.batchFormatMLResponse(req);
  if (response instanceof Error) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(response);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return res.status(401).send({
        error: response,
      });
    }
  } else {
    req.controllerData.results = response;
    return next();
  }
}

async function createCaseRecord(req, res, next) {
  req.controllerData = req.controllerData || {};
  const strategy = req.controllerData.strategy || null;
  const strategy_id = (strategy && strategy._id) ? strategy._id.toString() : req.params.id;
  const strategy_name = req.controllerData.strategy && req.controllerData.strategy.display_name ? req.controllerData.strategy.display_name : req.body.strategy_name;
  let { org, results, } = req.controllerData;
  if (org.save_data) {
    let redisClient = periodic.app.locals.redisClient;
    let asyncRedisIncr = Bluebird.promisify(redisClient.incr, { context: redisClient, });
    let case_count = await asyncRedisIncr('individual_case_count');
    const inputs = req.body.variables || {};
    let case_name = req.body.case_name || inputs.case_name || `Individual Case ${case_count}`;
    if (inputs.case_name) delete inputs.case_name;
    const application_id = (req.body && req.body.application_id) ? req.body.application_id : null;
    const Case = periodic.datas.get('standard_case');
    let result = results.results;
    let module_order = req.controllerData.case_module_order || [];
    let compiled_order = req.controllerData.compiled_order || [];
    let newdoc = {
      case_name,
      case_type: 'API',
      inputs,
      outputs: result.output_variables || {},
      module_order,
      compiled_order,
      application: application_id,
      passed: result.passed,
      decline_reasons: result.decline_reasons || [],
      error: (result.message && typeof result.message === 'string') ? [ result.message, ] : [],
      strategy_display_name: strategy_name,
      strategy: strategy_id,
      organization: org,
      processing_type: 'individual',
      user: {
        creator: 'API User',
        updater: 'API User',
      },
    };
    let created = await Case.create({ newdoc, skip_xss: true, });
    req.controllerData.created = created.toJSON ? created.toJSON() : created;
    req.controllerData.results.api_request_record = created._id.toString();
    return next();
  }
  return next();
}

async function createCase(result, module_order, compiled_order, variables, strategy_name, strategy_id, org, application_id = null) {
  let redisClient = periodic.app.locals.redisClient;
  let asyncRedisIncr = Bluebird.promisify(redisClient.incr, { context: redisClient, });
  let case_count = await asyncRedisIncr('individual_case_count');
  const inputs = variables || result.input_variables || {};
  const case_name = inputs.case_name ? inputs.case_name : `Individual Case ${case_count}`;
  // const application_id = (inputs && inputs.application_id) ? inputs.application_id : null;
  if (inputs.case_name) delete inputs.case_name;
  const Case = periodic.datas.get('standard_case');
  let newdoc = {
    case_name,
    case_type: 'API',
    inputs,
    application: application_id,
    outputs: result.output_variables || {},
    module_order: module_order || [],
    compiled_order,
    decline_reasons: result.decline_reasons || [],
    passed: result.passed,
    error: (result.message && typeof result.message === 'string') ? [ result.message, ] : [],
    strategy_display_name: strategy_name,
    strategy: strategy_id,
    organization: org,
    processing_type: 'batch',
    user: {
      creator: 'API User',
      updater: 'API User',
    },
  };
  let created = await Case.create({ newdoc, skip_xss: true, });
  return created;
}

async function createCasesAndBatchRecord(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    let { org, results, request, uniqueStrategies, } = req.controllerData;
    const application_id = req.body && req.body.application_id ? req.body.application_id : null;
    req.controllerData.cases_module_order = req.controllerData.cases_module_order || [];
    if (org.save_data) {
      let resultsArray = results.results;
      const Simulation = periodic.datas.get('standard_simulation');
      let casesMap = await resultsArray.map(async (decision, i) => {
        const module_order = req.controllerData.cases_module_order[ i ] || [];
        let stratInfo = uniqueStrategies[ decision.strategy_name ][ decision.strategy_status ];
        const input_variables = (req.body && req.body.global_variables) ? Object.assign({}, req.body.global_variables, decision.input_variables) : decision.input_variables;
        const compiled_order = (stratInfo.module_run_order) ? stratInfo.module_run_order.map(md => ({
          name: md.name,
          display_name: md.display_name,
          type: md.type,
          lookup_name: md.lookup_name,
          active: md.active,
        })) : [];
        return await createCase(decision, module_order, compiled_order, input_variables, stratInfo.display_name, stratInfo._id, org, application_id)
      });
      let createdCases = await Promise.all(casesMap);
      let Batch = periodic.datas.get('standard_batch');
      let data = await Batch.create({
        newdoc: { organization: org._id, results: createdCases.map(cas => ({ case: cas._id.toString(), case_name: cas.case_name, overall_result: Array.isArray(cas.error) && cas.error.length ? 'Error' : cas.passed ? 'Passed' : 'Failed', })), },
      });
      data = data.toJSON ? data.toJSON() : data;
      let simulation = await Simulation.create({
        newdoc: {
          name: `Batch API Request ${moment().format('YYYY/MM/D hh:mm:ss SSS')}`,
          user: {
            name: 'API User',
            email: 'API User',
          },
          status: 'Complete',
          progress: 100,
          strategy_name: 'Batch API Request',
          strategy_version: 1,
          compiledstrategy: {},
          results: [ {
            _id: data._id
          } ],
          organization: org,
        },
      });
      req.controllerData.results = req.controllerData.results || {};
      req.controllerData.results.api_request_record = simulation._id.toString();
      return next();
    }
    return next();
  } catch (err) {
    logger.warn({ err });
    return next();
  }
}

async function formatIndividualOCRResponse(req, res, next) {
  try {
    let results = req.controllerData.extractedFields[ 0 ];
    req.controllerData.results = results;
    next();
  } catch (e) {
    next();
  }
}

async function getLosProductByName(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const Product = periodic.datas.get('standard_losproduct');
    req.controllerData = req.controllerData || {};
    const product = await Product.model.findOne({ name: req.body.product, organization, }).lean();
    req.controllerData.product = product;
    next();
  } catch (e) {
    res.status(500).send({ message: 'Failed to retrieve requested product' });
  }
}

async function createAPIApplication(req, res, next) {
  try {
    const Application = periodic.datas.get('standard_losapplication');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.body.organization = organization;
    req.body.user = req.body.user || {};
    req.body.user.creator = user.entitytype === 'user' ? `${user.first_name} ${user.last_name}` : user.name;
    req.body.user.updater = user.entitytype === 'user' ? `${user.first_name} ${user.last_name}` : user.name;
    const created = await Application.create({ newdoc: Object.assign({}, req.body), });
    req.controllerData = req.controllerData || {};
    req.controllerData.application = created.toJSON ? created.toJSON() : created;
    next();
  } catch (e) {
    res.status(404).send({ message: 'Failed to create application.', });
  }
}

async function updateApplication(req, res, next) {
  try {
    const Application = periodic.datas.get('standard_losapplication');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.body.organization = organization;
    req.body.user = req.body.user || {};
    req.body.user.updater = user.entitytype === 'user' ? `${user.first_name} ${user.last_name}` : user.name;
    const created = await Application.model.updateOne({ _id: req.params.id, organization, }, { $set: flatten(req.body) });
    req.controllerData = req.controllerData || {};
    req.controllerData.application = created.toJSON ? created.toJSON() : created;
    next();
  } catch (e) {
    res.status(404).send({ message: 'Failed to create application.', });
  }
}

async function getLosApplicationLabelsByName(req, res, next) {
  try {
    if (req.body.labels) {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      const LosApplicationLabel = periodic.datas.get('standard_losapplicationlabel');
      req.controllerData = req.controllerData || {};
      const labels = await LosApplicationLabel.model.find({ name: { $in: req.body.labels, }, organization, }).lean();
      req.controllerData.labels = labels;
    }
    next();
  } catch (e) {
    res.status(500).send({ message: 'Failed to retrieve requested labels' });
  }
}

async function LAPAPIResponse(req, res, next) {
  req.controllerData = req.controllerData || {};
  return res.status(200).send(req.controllerData);
}

module.exports = {
  checkPublicKey,
  checkVariables,
  checkStrategyExists,
  stageRequest,
  runCreditEngine,
  runApiProcessEngine,
  batchStageStrategies,
  batchRunAPIProcessEngine,
  formatIndividualOCRResponse,
  formatResponse,
  batchFormatResponse,
  getVariables,
  apiTabs,
  apiDownload,
  hiddenData,
  sendResponse,
  sendSuccess,
  getApiStrategy,
  getBatchAPIStrategies,
  createAPIRequestRecord,
  createBatchAPIRequestRecord,
  updateAPIRequestRecord,
  createSimulationRequestRecord,
  updateSimulationRequestRecord,
  fetchAllDocumentTemplatesFromAWS,
  initializeStrategyForApiCompilation,
  createAPIMLRequestRecord,
  createAPIMLBatchRequestRecord,
  stageOCRRequest,
  mlVariableCheck,
  batchInitializeStrategiesForCompilation,
  limitMaxStrategies,
  batchMLVariableCheck,
  batchFormatMLResponse,
  createCaseRecord,
  createCasesAndBatchRecord,
  getLosProductByName,
  createAPIApplication,
  getLosApplicationLabelsByName,
  LAPAPIResponse,
  updateApplication,
};