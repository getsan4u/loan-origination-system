'use strict';

/** Middleware for third party integrations */
const periodic = require('periodicjs');
const logger = periodic.logger;
const utilities = require('../utilities');
const helpers = utilities.helpers;
const controller_helper = utilities.controllers.integration;
const util = require('util');
const moment = require('moment');
const { returnMapById, getOrderedCalculationArray, mapSegmentRules, findUniqueVariable, } = utilities.controllers.api;
const Busboy = require('busboy');
const crypto = require('crypto');
const path = require('path');
const CREDIT_PIPELINE = require('@digifi-los/credit-process');
const pluralize = require('pluralize');
const unflatten = require('flat').unflatten;
const fs = require('fs');
const { promisify } = require('util');
const credit_engine = CREDIT_PIPELINE(periodic);

/**
 * Gets strategies and puts it on req.controllerData.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function.
 */
function getStrategies(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Strategy = periodic.datas.get('standard_strategy');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let query = { organization, };
  Strategy.query({ query, })
    .then(strategies => {
      strategies = strategies.map(strategy => strategy.toJSON());
      let strategydata = strategies.reduce((acc, strategy) => {
        strategy = strategy.toJSON ? strategy.toJSON() : strategy;
        let strategy_status = (strategy.status) ? { [ strategy.status ]: strategy._id.toString(), } : {};
        if (acc[ strategy.display_title ]) {
          acc[ strategy.display_title ].active.push({ label: strategy.version, value: strategy._id.toString(), });
          acc[ strategy.display_title ].testing.push({ label: strategy.version, value: strategy._id.toString(), });
          acc[ strategy.display_title ].status = Object.assign({}, acc[ strategy.display_title ].status, strategy_status);
        } else {
          acc[ strategy.display_title ] = Object.assign({}, {
            active: [ { label: strategy.version, value: strategy._id.toString(), }, ],
            testing: [ { label: strategy.version, value: strategy._id.toString(), }, ],
            status: strategy_status,
          });
        }
        return acc;
      }, {});
      req.controllerData = Object.assign({}, req.controllerData, {
        strategies,
        formdata: {
          strategies: Object.keys(strategydata).map(title => {
            return Object.assign({ title, }, strategydata[ title ].status);
          }),
        },
        formoptions: {
          active: Object.keys(strategydata).map(title => {
            let active = helpers.mergeSort(strategydata[ title ].active, 'label');
            active.unshift({ label: 'None', value: ' ', });
            return active;
          }),
          testing: Object.keys(strategydata).map(title => {
            let testing = helpers.mergeSort(strategydata[ title ].testing, 'label');
            testing.unshift({ label: 'None', value: ' ', });
            return testing;
          }),
        },
      });
      return next();
    })
    .catch(err => {
      logger.error('Unable to get strategies', err);
      return next(err);
    });
}

/**
 * Check to make sure strategy isn't being set to both active and testing.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function.
 */
function checkStrategies(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let activatedStrategies = req.controllerData.formdata.strategies;
    let submittedStrategies = req.body.strategies;
    let addDiff = [];
    let deleteDiff = [];
    submittedStrategies.forEach((submittedStrat, idx) => {
      let diff = helpers.objDiff(activatedStrategies[ idx ], submittedStrat);
      addDiff.push(diff.add);
      deleteDiff.push(diff.delete);
    });
    for (let i = 0; i < addDiff.length; i++) {
      if ([ undefined, ' ', ].indexOf(addDiff[ i ].active) === -1 && addDiff[ i ].active === addDiff[ i ].test) {
        return next('The same version of a Strategy cannot be set as both Active and Testing.');
      }
    }
    req.controllerData.addDiff = addDiff;
    req.controllerData.deleteDiff = deleteDiff;
    return next();
  } catch (err) {
    logger.error('checkStrategies error', err);
    return next('The same version of a Strategy cannot be set as both Active and Testing.');
  }
}

/**
 * Update status and lock strategies.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function.
 */
function activateStrategies(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Strategy = periodic.datas.get('standard_strategy');
    let deleteDiff = req.controllerData.deleteDiff;
    let deactivateStrategies = [];
    const deactivated = [];
    const activated = [];
    deleteDiff.forEach(strat => {
      Object.keys(strat).forEach(status => {
        if (strat[ status ] && strat[ status ] !== ' ') {
          deactivated.push(strat[ status ]);
          deactivateStrategies.push(Strategy.update({ id: strat[ status ], updatedoc: { status: null, }, isPatch: true, }));
        }
      });
    });
    Promise.all(deactivateStrategies)
      .then(() => {
        let addDiff = req.controllerData.addDiff;
        let activatedStrategies = req.controllerData.formdata.strategies;
        let activateStrategies = [];
        addDiff.forEach((strat, idx) => {
          Object.keys(strat).forEach(status => {
            if (strat[ status ] && strat[ status ] !== ' ') {
              let updatedoc = (status === 'active')
                ? { locked: true, status, }
                : { status, };
              activated.push(strat[ status ]);
              activateStrategies.push(Strategy.update({ id: strat[ status ], updatedoc, isPatch: true, }));
            } else if (activatedStrategies[ idx ][ status ]) {
              deactivated.push(activatedStrategies[ idx ][ status ]);
              activateStrategies.push(Strategy.update({ id: activatedStrategies[ idx ][ status ], updatedoc: { status: null, }, isPatch: true, }));
            }
          });
        });
        return Promise.all(activateStrategies)
          .catch(err => {
            logger.error('Unable to activate strategies', err);
            return next('Unable to activate strategies');
          });
      })
      .then(() => {
        req.controllerData.activated = activated;
        req.controllerData.deactivated = deactivated;
        return next();
      })
      .catch(err => {
        logger.error('Unable to deactivate strategies', err);
        return next('Unable to deactivate strategies');
      });
  } catch (err) {
    logger.error('activateStrategies error', err);
    return next('activateStrategies error');
  }
}

async function updateRedisRules(req, res, next) {
  try {
    const Rule = periodic.datas.get('standard_rule');
    const redisClient = periodic.app.locals.redisClient;
    const env = periodic.environment;
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    if (req.controllerData.activated) {
      const activated_rules = await Rule.model.find({ strategy: { $in: req.controllerData.activated } }).lean();
      for (let i = 0; i < activated_rules.length; i++) {
        const fetchedRule = activated_rules[ i ];
        controller_helper.setRuleOnRedis(fetchedRule, organization, true);
      }
    }
    if (req.controllerData.deactivated) {
      const deactivated_rules = await Rule.model.find({ strategy: { $in: req.controllerData.deactivated } }).lean();
      for (let i = 0; i < deactivated_rules.length; i++) {
        const fetchedRule = deactivated_rules[ i ];
        redisClient.del(controller_helper.getRedisRuleKey(fetchedRule._id, organization));
      }
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    return next(e);
  }
}

/**
 * Pulls the strategies to be activated and deletes all the compiled strategies with changed status and creates new set of compiled strategy.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {Function} next Express next function.
 */
function initializeStrategyForCompilation(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Strategy = periodic.datas.get('standard_strategy');
    const Rule = periodic.datas.get('standard_rule');
    const Variable = periodic.datas.get('standard_variable');
    const CompiledStrategy = periodic.datas.get('standard_compiledstrategy');
    let submittedStrat = [];
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData.addDiff = req.controllerData.addDiff || [];
    req.controllerData.addDiff.forEach(strat => {
      Object.keys(strat).map(status => strat[ status ]).filter(id => id !== ' ').forEach(_id => {
        submittedStrat.push(_id.toString());
      });
    });
    req.user = req.user.toJSON ? req.user.toJSON() : req.user;
    Strategy.query({ query: { _id: { $in: submittedStrat, }, organization, }, })
      .then(strats => {
        req.controllerData.compiledstrategies = strats.map(strategy => {
          strategy = strategy.toJSON ? strategy.toJSON() : strategy;
          return Object.assign({}, strategy, { name: (strategy && strategy.name) ? strategy.name : null, input_variables: [], calculated_variables: [], output_variables: [], rules: [], organization, decline_reasons: [], templates: [], });
        });
        // return Promise.all([Rule.query({ query: { organization, },limit: 100000, }), Variable.model.find({ organization, }),]);
        return Promise.resolve();
      })
      .then(result => {
        return next();
      })
      .catch(err => {
        logger.error('Unable to query for strategies', err);
        return next(err);
      });
  } catch (err) {
    logger.error('initializeStrategyForCompilation error', err);
    return next(err);
  }
}

/**
 * Pulls all the rules and variables from compiled strategies and locks them.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {Function} next Express next function.
 */
function lockStrategyDependencies(req, res, next) {
  try {
    const Rule = periodic.datas.get('standard_rule');
    const Variable = periodic.datas.get('standard_variable');
    const lockDependencies = {
      input_variables: [],
      output_variables: [],
      rules: [],
      calculated_variables: [],
    };
    const compiledstrategies = req.controllerData.compiledstrategies;
    if (Array.isArray(compiledstrategies) && compiledstrategies.length) {
      for (let i = 0; i < compiledstrategies.length; i++) {
        const compiledstrategy = compiledstrategies[ i ];
        const { status, rules, input_variables, output_variables, calculated_variables, } = compiledstrategy;
        if (status === 'active') {
          if (Array.isArray(rules)) lockDependencies.rules.push(...rules);
          if (Array.isArray(input_variables)) lockDependencies.input_variables.push(...input_variables);
          if (Array.isArray(output_variables)) lockDependencies.output_variables.push(...output_variables);
          if (Array.isArray(calculated_variables)) lockDependencies.calculated_variables.push(...calculated_variables);
        }
      }
    }

    let ruleUpdateOptions = {
      multi: true,
      query: {
        _id: { $in: lockDependencies.rules, },
      },
      updatedoc: { locked: true, },
    };
    let variableUpdateOptions = {
      multi: true,
      query: {
        _id: { $in: lockDependencies.output_variables.concat(lockDependencies.input_variables, lockDependencies.calculated_variables), },
      },
      updatedoc: { locked: true, },
    };
    Promise.all([ Rule.update(ruleUpdateOptions), Variable.update(variableUpdateOptions), ])
      .then(() => {
        return next();
      })
      .catch(e => {
        logger.error('Error locking Strategy Dependencies', e);
        return next('Error locking Strategy Dependencies');
      });
  } catch (e) {
    logger.error('Error locking Strategy Dependencies', e);
    return next('Error locking Strategy Dependencies');
  }
}

/**
 * Pulls the strategy and compiles it for simulation.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {Function} next Express next function.
 */
async function initializeStrategyForSimulationCompilation(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Strategy = periodic.datas.get('standard_strategy');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let compiledStrategy;
    let strategy_id = req.query.download ? req.params.strategy_id : req.params.id;
    let strategy = await Strategy.load({ query: { _id: strategy_id, }, });
    // .then(strategy => {
    if (!strategy) {
      return next('Unable to query for strategies');
    }
    strategy = strategy.toJSON ? strategy.toJSON() : strategy;
    let init_compiled_strategy = Object.assign({}, strategy, { input_variables: [], calculated_variables: [], output_variables: [], rules: [], decline_reasons: [], templates: [], });
    if (strategy && strategy.status) {
      req.controllerData.strategy_status = (strategy.status === 'testing' || strategy.status === 'inactive') ? 'testing' : 'active';
    } else {
      req.controllerData.strategy_status = 'testing';
    }
    compiledStrategy = init_compiled_strategy;

    let dataintegrations = req.controllerData.dataintegrations || [];

    const variableMap = await controller_helper.getAllOrgVariableFromCache(organization);

    req.controllerData.compiledStrategy = await controller_helper.compileModuleRunOrder(req, compiledStrategy, dataintegrations, variableMap);
    req.controllerData.compiled_order = req.controllerData.compiledStrategy.module_run_order.map(md => ({
      name: md.name,
      display_name: md.display_name,
      type: md.type,
      lookup_name: md.lookup_name,
      active: md.active,
    }));

    req.controllerData.compiledStrategy.output_variables = req.controllerData.compiledStrategy.output_variables || [];

    req.controllerData.compiledStrategy.input_variables = req.controllerData.compiledStrategy.input_variables || [];

    req.controllerData.compiledStrategy.calculated_variables = req.controllerData.compiledStrategy.calculated_variables || [];

    const filteredOutputVariables = req.controllerData.compiledStrategy.output_variables.filter((v, i, a) => a.indexOf(v) === i);
    for (let i = 0; i < filteredOutputVariables.length; i++) {
      filteredOutputVariables[ i ] = variableMap[ filteredOutputVariables[ i ] ];
    }
    req.controllerData.compiledStrategy.output_variables = filteredOutputVariables;

    const filteredInputVariables = req.controllerData.compiledStrategy.input_variables.filter((v, i, a) => a.indexOf(v) === i);
    for (let i = 0; i < filteredInputVariables.length; i++) {
      filteredInputVariables[ i ] = variableMap[ filteredInputVariables[ i ] ];
    }
    req.controllerData.compiledStrategy.input_variables = filteredInputVariables;

    const filteredCalculatedVariables = req.controllerData.compiledStrategy.calculated_variables.filter((v, i, a) => a.indexOf(v) === i);
    for (let i = 0; i < filteredCalculatedVariables.length; i++) {
      filteredCalculatedVariables[ i ] = variableMap[ filteredCalculatedVariables[ i ] ];
    }
    req.controllerData.compiledStrategy.calculated_variables = filteredCalculatedVariables;
    next();
  } catch (err) {
    logger.error('initializeStrategyForCompilation error', err);
    return next(err);
  }
}

/**
 * Gets all data integrations
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getDataIntegrations(req, res, next) {
  req.controllerData = req.controllerData || {};
  const DataIntegration = periodic.datas.get('standard_dataintegration');
  let user = req.user;
  if (req.body && req.body.module_skip && !req.body.module_skip[ req.body.select_testcases ].dataintegration) {
    req.controllerData.dataintegrations = [];
    return next();
  } else {
    let dataintegrations = await DataIntegration.query({ query: {}, });
    dataintegrations = dataintegrations.map(data => data.toJSON ? data.toJSON() : data);
    if ([ 'dataintegrations', ].indexOf(req.query.pagination) !== -1) {
      req.query.pagenum = req.query.pagenum || 1;
      let startIndex = 10 * (req.query.pagenum - 1);
      let endIndex = 10 * req.query.pagenum;
      let rows = helpers.mergeSort(dataintegrations, 'name').reverse().slice(startIndex, endIndex);
      req.controllerData = Object.assign({}, req.controllerData, {
        dataintegrations,
        rows,
        numPages: Math.ceil(dataintegrations.length / 10),
        numItems: dataintegrations.length,
      });
    } else {
      req.controllerData.dataintegrations = dataintegrations;
    }
    return next();
  }
}

/**
 * Gets all vm parsers
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getVMParsers(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Parser = periodic.datas.get('standard_parser');
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    if (req.body && req.body.module_skip && !req.body.module_skip[ req.body.select_testcases ].dataintegration) {
      req.controllerData.parsers = [];
    } else {
      const parsers = await Parser.model.find({ organization, }).lean();
      if ([ 'parsers', ].indexOf(req.query.pagination) !== -1) {
        req.query.pagenum = req.query.pagenum || 1;
        const startIndex = 10 * (req.query.pagenum - 1);
        const endIndex = 10 * req.query.pagenum;
        const rows = helpers.mergeSort(parsers, 'name').reverse().slice(startIndex, endIndex);
        req.controllerData = Object.assign({}, req.controllerData, {
          parsers,
          rows,
          numPages: Math.ceil(parsers.length / 10),
          numItems: parsers.length,
        });
      } else {
        req.controllerData.parsers = parsers;
      }
    }
    return next();
  } catch (e) {
    logger.error('error retrieving vm parsers', e);
    return next(e);
  }
}

/**
 * Gets all data integrations
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function assignVMParserToDataIntegrations(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.dataintegrations && req.controllerData.parsers) {
      const parserMap = {};
      req.controllerData.parsers.forEach(parser => {
        parserMap[ parser._id.toString() ] = parser;
      });
      req.controllerData.dataintegrations = req.controllerData.dataintegrations.map(dataintegration => {
        if (dataintegration.vm_parser && parserMap[ dataintegration.vm_parser ]) {
          dataintegration.vm_parser = parserMap[ dataintegration.vm_parser ];
          dataintegration.outputs.push(...dataintegration.vm_parser.variables);
        }
        return dataintegration;
      });
    }
    next();
  } catch (e) {
    logger.error('error in assigning VMParser To DataIntegrations', e);
    return next(e);
  }
}

/**
 * Get output variables map (id to name map)
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getInputVariablesMap(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Variable = periodic.datas.get('standard_variable');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let query = (req.user) ? { type: 'Input', organization, } : { type: 'Input', };
  let inputVariables = await Variable.model.find(query);
  req.controllerData.inputVariablesMap = inputVariables.reduce((aggregate, variable) => {
    aggregate[ variable._id.toString() ] = variable.title;
    return aggregate;
  }, {});
  return next();
}

/**
 * Get single data integration
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getDataIntegration(req, res, next) {
  req.controllerData = req.controllerData || {};
  const DataIntegration = periodic.datas.get('standard_dataintegration');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let dataintegration = await DataIntegration.load({ query: { _id: req.params.id || req.body.id, }, });
  dataintegration = dataintegration.toJSON ? dataintegration.toJSON() : dataintegration;
  req.controllerData.dataintegration = dataintegration;
  return next();
}

/**
 * Flips integration status.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function flipStatus(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.body = req.controllerData.dataintegration.status === 'active' ? { status: 'inactive', } : { status: 'active', };
  return next();
}

/**
 * Updates data integration.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function updateDataIntegration(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const DataIntegration = periodic.datas.get('standard_dataintegration');
    await DataIntegration.update({
      id: req.params.id || req.body.id,
      updatedoc: req.body,
      isPatch: req.controllerData.isPatch === undefined ? true : req.controllerData.isPatch,
    });
    return next();
  } catch (e) {
    logger.error('Unable to update data integration', e);
    return next(e);
  }
}

/**
 * Checks submitted variables/ values to make sure they match the right type.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function checkVariables(req, res, next) {
  let inputs = req.body.inputs;
  let variableIds = inputs.filter(input => input.input_type === 'variable').map(input => input.input_variable);
  const Variables = periodic.datas.get('standard_variable');
  let variables = await Variables.query({ query: { _id: { $in: variableIds, }, }, });
  variables = variables.reduce((acc, curr) => {
    acc[ curr._id ] = curr.data_type;
    return acc;
  }, {});
  if (req.query.variables === 'required') {
    inputs.forEach(input => {
      if (input.input_type === 'value') {
        let boolCheck = input.data_type === 'Boolean' && [ 'true', 'false', ].indexOf(input.input_value.toLowerCase()) === -1;
        let numCheck = input.data_type === 'Number' && Number.isNaN(Number(input.input_value));
        let dateCheck = input.data_type === 'Date' && !moment(input.input_value.replace(/_/g, '/')).toISOString() && Number.isNaN(Number(input.input_value));
        if (boolCheck || numCheck || dateCheck) return next(`${input.display_name} needs to be a ${input.data_type}.`);
      } else if (input.input_type === 'variable') {
        if (input.data_type !== variables[ input.input_variable ]) return next(`Variable for ${input.display_name} needs to be a ${input.data_type}. Variable's data type is ${variables[ input.input_variable ]} instead`);
      }
      if (input.input_value) {
        switch (input.data_type) {
          case 'Boolean':
            input.input_value = input.input_value.toLowerCase() === 'true' ? true : false;
            break;
          case 'Number':
            input.input_value = Number(input.input_value);
            break;
          default:
            break;
        }
      }
    });
  }
  return next();
}

/**
 * Uploads security certificate.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function uploadSecurityCert(req, res, next) {
  if (req.headers && req.headers[ 'content-type' ] && req.headers[ 'content-type' ].indexOf('multipart/form-data') === -1) return next('Please upload file');
  const busboy = new Busboy({ headers: req.headers, });
  const assetDB = periodic.datas.get('standard_asset');
  const encryption_key = periodic.settings.extensions[ '@digifi-los/reactapp' ].encryption_key_path;
  const pkgCloudClient = await periodic.locals.extensions.get('periodicjs.ext.packagecloud').pkgcloudUtils.getPkgClient();
  const pkgCloudUploadDirectory = periodic.locals.extensions.get('periodicjs.ext.packagecloud').files.pkgCloudUploadDirectory;
  const upload_dir = 'securitycertificates';
  const uploadDir = pkgCloudUploadDirectory({ req, periodic, upload_dir, include_timestamp_in_dir: true, });
  const files = [], cloudfiles = [];
  let newassets;
  busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    const pkgCloudUploadFileName = path.join(uploadDir.upload_path_dir, filename);
    const pkgCloudRemoteBaseURL = pkgCloudClient.publicPath.cdnSslUri + '/';
    const filelocation = pkgCloudRemoteBaseURL + pkgCloudUploadFileName;
    const fileurl = path.join(upload_dir, filename);
    const cipher = crypto.createCipher('aes256', encryption_key);
    const processedFile = {
      fieldname,
      encoding,
      mimetype,
      original_filename: filename,
      filename: filename,
      name: filename,
      fileurl,
      uploaddirectory: upload_dir,
      encrypted_client_side: true,
      client_encryption_algo: 'aes256',
      attributes: Object.assign({}, pkgCloudClient.publicPath, {
        cloudfilepath: pkgCloudUploadFileName,
        cloudcontainername: pkgCloudClient.containerSettings.name,
        location: filelocation,
      }),
    };
    async function finishedUploading() {
      newassets = files.map(file => periodic.core.files.generateAssetFromFile({
        req,
        periodic,
        file,
      }));
      let newassetdocs = await assetDB.create({ bulk_create: true, newdoc: newassets, });
      req.body = {
        credentials: { security_certificate: newassetdocs[ 0 ]._id.toString(), },
      };
      return next();
    }
    const uploadStream = pkgCloudClient.client.upload({
      container: pkgCloudClient.containerSettings.name,
      remote: pkgCloudUploadFileName,
      cacheControl: 'private, max-age=86400',
      contentType: mimetype,
      ServerSideEncryption: 'AES256',
      acl: 'private',
      headers: {
        'cache-control': 'private, max-age=86400',
        'Cache-Control': 'private, max-age=86400',
        'Content-Type': mimetype,
        'x-amz-meta-Cache-Control': 'private, max-age=86400',
        'x-amz-grant-read': 'uri="des-dev.digifi.cc"',
      },
    });
    uploadStream.on('error', (e) => {
      logger.error('packageCloud upload error', e);
      return next(e);
    });
    uploadStream.on('success', (cloudfile) => {
      cloudfiles.push(cloudfile);
      if (cloudfiles.length && files.length) finishedUploading();
    });
    let filesize = 0;
    file.on('data', chunk => {
      filesize += Buffer.byteLength(chunk);
    });
    file.on('end', () => {
      processedFile.size = filesize;
      files.push(processedFile);
      if (cloudfiles.length && files.length) finishedUploading();
    });
    file.on('error', (e) => {
      logger.error('reading file error', e);
      return next(e);
    });
    file.pipe(cipher).pipe(uploadStream);
  });
  busboy.on('finish', function () { });
  req.pipe(busboy);
}

/**
 * Update data integration credentials.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function updateCredentials(req, res, next) {
  req.controllerData = req.controllerData || {};
  let required_credentials = req.controllerData.dataintegration.required_credentials.reduce((acc, curr) => {
    acc[ curr ] = '';
    return acc;
  }, {});
  let body = req.body;
  req.body = req.controllerData.dataintegration;
  if (body[ 'creds.active' ]) {
    let newBody = Object.assign({}, required_credentials, body[ 'creds.active' ]);
    req.body.credentials.active = newBody;
  }
  if (body[ 'creds.testing' ]) {
    let newBody = Object.assign({}, required_credentials, body[ 'creds.testing' ]);
    req.body.credentials.testing = newBody;
  }
  req.controllerData.isPatch = false;
  return next();
}

function reloadCreditEngine(req, res, next) {
  credit_engine.generateCreditSegments({}, true)
    .then(loaded => loaded())
    .then(result => {
      let engines = {};
      result.map(engine => {
        if (engine.organization && engine.organization._id) {
          engines[ engine.organization._id ] = engines[ engine.organization._id ] || {};
          engines[ engine.organization._id ][ engine.engine_name ] = engine;
        }
      });
      periodic.app.locals.credit_engines = engines;
      next();
    })
    .catch(err => {
      logger.error('Unable to generate credit segments', err);
      next('The same version of a Strategy cannot be set as both Active and Testing.');
    });
}

async function getDocusignCredentials(req, res, next) {
  try {
    const Dataintegration = periodic.datas.get('standard_dataintegration');
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const docusignConfig = await Dataintegration.model.findOne({ organization, data_provider: 'DocuSign' }).lean();
    if (docusignConfig) {
      req.controllerData.docusign = docusignConfig;
    } else {
      req.controllerData.docusign = { default_configuration: {} };
    }
    return next();
  } catch (e) {
    logger.error(e.message);
    res.status(500).send('Error retrieving docusign credentials');
  }
}

async function updateDocusignCredentials(req, res, next) {
  try {
    const Dataintegration = periodic.datas.get('standard_dataintegration');
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const docusignConfig = await Dataintegration.model.findOne({ organization, data_provider: 'DocuSign' }).lean();
    if (docusignConfig) {
      const default_configuration = Object.assign({}, docusignConfig.default_configuration, req.body);
      const updatedDoc = await Dataintegration.model.updateOne({ _id: docusignConfig._id, organization }, { $set: { default_configuration } });
      req.controllerData.docusign = updatedDoc;
    } else {
      const newdoc = {
        name: 'DocuSign Credential Document',
        organization,
        data_provider: 'DocuSign',
        description: 'DocuSign Credential Description',
        status: 'inactive',
        required_credentials: [
          'clientId',
          'userId',
          'privateKey',
          'authServer',
          'targetAccountId'
        ],
        request_type: 'json',
        default_configuration: Object.assign({}, req.body, { authServer: 'account.docusign.com', targetAccountId: false }),
        timeout: 10000,
        entitytype: 'dataintegration'
      }
      const created = await Dataintegration.create({ newdoc });
      req.controllerData.docusign = created;
    }
    return next();
  } catch (e) {
    logger.error(e.message);
    res.status(500).send('Error adding or updating docusign credentials');
  }
}

async function downloadDocusignInstructions(req, res) {
  try {
    const filepath = path.join(process.cwd(), 'content/files/tutorial/docusign_instructions.rtf');
    const file = fs.readFileSync(filepath);
    const filename = 'Instructions - DocuSign Setup.rtf';
    const contenttype = 'application/octet-stream';
    res.set('Content-Type', contenttype);
    res.attachment(filename);
    res.status(200).send(file).end();
  } catch (e) {
    logger.error(e.message);
    res.status(500).send('Error retrieving docusign instructions');
  }
}


module.exports = {
  getStrategies,
  checkStrategies,
  activateStrategies,
  initializeStrategyForCompilation,
  initializeStrategyForSimulationCompilation,
  lockStrategyDependencies,
  getDataIntegrations,
  getDataIntegration,
  getInputVariablesMap,
  flipStatus,
  updateDataIntegration,
  checkVariables,
  uploadSecurityCert,
  updateCredentials,
  reloadCreditEngine,
  getDocusignCredentials,
  updateDocusignCredentials,
  downloadDocusignInstructions,
  getVMParsers,
  assignVMParserToDataIntegrations,
  updateRedisRules
};