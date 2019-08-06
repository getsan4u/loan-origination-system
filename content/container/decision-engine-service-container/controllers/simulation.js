'use strict';

const CreateQueueHandlers = require('../utilities/createqueuehandlers');
const periodic = require('periodicjs');
const url = require('url');
const addQueue = require('../utilities/promisequeue').addQueue;
const logger = periodic.logger;
const CREDIT_PIPELINE = require('@digifi-los/credit-process');
const CONTAINER_SETTING = periodic.settings.container[ 'decision-engine-service-container' ];
const Promisie = require('promisie');
const fs = Promisie.promisifyAll(require('fs-extra'));
// const writeFile = Promisie.promisify(fs.writeFile);
const converter = require('json-2-csv');
const unflatten = require('flat').unflatten;
const moment = require('moment');
const path = require('path');
const Bluebird = require('bluebird');
const wkhtmltopdf = require('wkhtmltopdf');
const utilities = require('../utilities');
const bulk_helpers = require('../utilities/controllers/simulation_bulk');
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;
let credit_engine = CREDIT_PIPELINE(periodic);
const MAX_FILESIZE = CONTAINER_SETTING.simulation.upload_filesize_limit;
const MAX_TESTCASES_LIMIT = CONTAINER_SETTING.simulation.testcases_count_limit;
const Busboy = require('busboy');
const csv = require('fast-csv');
const qs = require('qs');
const ejs = require('ejs');
const Zip = require('adm-zip');
const mime = require('mime-types');
const numeral = require('numeral');
const RTree = require('rtree');
let redisClient;

/**
 * Saves compiled strategies data onto req.controllerData.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function getCompiledStrategies(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    const CompiledStrategy = periodic.datas.get('standard_compiledstrategy');
    CompiledStrategy.query({ organization, })
      .then(compiledStrategies => {
        compiledStrategies = (compiledStrategies.toJSON) ? compiledStrategies.toJSON() : compiledStrategies;
        req.controllerData.compiledStrategies = compiledStrategies;
        return next();
      })
      .catch(e => {
        logger.error('Unable to query compiled strategies', e);
        return next(e);
      });
  } catch (e) {
    logger.error('getCompiledStrategies error', e);
    return next(e);
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
function getStrategies(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let user = req.user;
    const Strategy = periodic.datas.get('standard_strategy');
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    if (req.query.download === 'true') organization = req.params.id;
    let queryOptions = ([ 'simulations', 'deleteTestCasesModal', ].indexOf(req.query.pagination) !== -1)
      ? { fields: [ 'display_name', ], query: { organization, }, }
      : { query: { organization, }, };
    Strategy.query(queryOptions)
      .then(strategies => {
        strategies = strategies.map(strategy => strategy.toJSON ? strategy.toJSON() : strategy);
        req.controllerData.strategies = strategies;
        return next();
      })
      .catch(e => {
        logger.error('Unable to query strategies', e);
        return next(e);
      });
  } catch (e) {
    logger.error('getStrategies error', e);
    return next(e);
  }
}



/**
 * Saves specific compiled strategy data onto req.controllerData.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function getCompiledStrategy(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    const CompiledStrategy = periodic.datas.get('standard_compiledstrategy');
    CompiledStrategy.load({ query: { _id: req.params.id, organization, }, })
      .then(compiledStrategy => {
        compiledStrategy = (compiledStrategy.toJSON) ? compiledStrategy.toJSON() : compiledStrategy;
        req.controllerData.compiledStrategy = compiledStrategy;
        return next();
      })
      .catch(e => {
        logger.error('Unable to load compiled strategy', e);
        return next(e);
      });
  } catch (e) {
    logger.error('getCompiledStrategy error', e);
    return next(e);
  }
}

/**
 * Saves test case data onto request object in simulation
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function getTestCasesData(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.query && req.body && req.query.upload && req.query.pagination === 'simulations' && req.body.select_testcases === 'file') {
      return next();
    } else {
      const Testcase = periodic.datas.get('standard_testcase');
      let user = req.user;
      let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 15) : 0;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let queryOptions = ([ 'simulations', 'deleteTestCasesModal', ].indexOf(req.query.pagination) !== -1)
        ? { query: { organization, }, limit: 50000, fields: [ 'displayname', ], }
        : { query: { organization, }, limit: 50000, fields: [ 'displayname', 'createdat', 'user', 'population_tags', 'description', ], };
      if (req.body && req.body.select_testcases) queryOptions = { query: { organization, _id: { $in: req.body.testcases_dropdown, }, }, };
      Testcase.query(queryOptions)
        .then(testcases => {
          if (req.query.query) {
            let query = req.query.query.replace(/[-!$%^&*()_+|~=`{}[\]:/;<>?,.@#]/g, (char) => '\\' + char);
            let searchTerm = RegExp(query, 'i');
            testcases = testcases.filter(tc => {
              if (searchTerm.test(tc.displayname)) return true;
              else if (searchTerm.test(tc.user.creator)) return true;
              else if (searchTerm.test(tc.user.updater)) return true;
              else if (tc.population_tags && tc.population_tags.map(tag => tag.name).reduce((bool, name) => {
                if (searchTerm.test(name)) bool = true;
                return bool;
              }, false)) {
                return true;
              } else if (searchTerm.test(tc.description)) return true;
              else return false;
            });
          }
          if ([ '_id', '-_id', ].includes(req.query.sort) === false && req.query.sort && req.query.sort[ 0 ] === '-') {
            testcases = helpers.mergeSort(testcases, req.query.sort.slice(1)).reverse();
          } else if ([ '_id', '-_id', ].includes(req.query.sort) === false && req.query.sort && req.query.sort[ 0 ] !== '-') {
            testcases = helpers.mergeSort(testcases, req.query.sort);
          }
          req.query.pagenum = req.query.pagenum || 1;
          let startIndex = 15 * (req.query.pagenum - 1);
          let endIndex = 15 * req.query.pagenum;
          if ([ 'testcases', ].indexOf(req.query.pagination) !== -1) {
            let rows = testcases.slice(startIndex, endIndex);
            rows = rows.map(testcase => testcase.toJSON ? testcase.toJSON() : testcase).map(testcase => {
              testcase.joined_population_tags = testcase.population_tags.map(tag => tag.name).join(', ');
              delete testcase.population_tags;
              if (!testcase.description) delete testcase.description;
              return testcase;
            });
            req.controllerData = Object.assign({}, req.controllerData, {
              rows,
              numPages: Math.ceil(testcases.length / 15),
              numItems: testcases.length,
            });
          } else {
            req.controllerData.testcases = testcases;
          }
          return next();
        })
        .catch(e => {
          logger.error('Unable to query cases', e);
          return next(e);
        });
    }
  } catch (e) {
    logger.error('getTestCasesData error', e);
    return next(e);
  }
}

/**
 * Creates single test case for simulation
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function createNewTestCase(req, res, next) {
  try {
    const TestCase = periodic.datas.get('standard_testcase');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let createOptions = Object.assign({}, req.body, { user: { creator: `${req.user.first_name} ${req.user.last_name}`, updater: `${req.user.first_name} ${req.user.last_name}`, }, organization, });
    try {
      let created = await TestCase.create(createOptions);
      let testcase = created.toJSON ? created.toJSON() : created;
      let redirect_path = `/processing/test_cases/${testcase._id}/detail`;
      res.status(200).send({
        status: 200,
        timeout: 10000,
        type: 'success',
        text: 'Changes saved successfully!',
        successProps: {
          successCallback: 'func:window.closeModalAndCreateNotification',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
        pathname: redirect_path,
      });
    } catch (err) {
      logger.error('Unable to create case', err);
      return next('A case already exists with that name. Please provide a unique case name.');
    }
  } catch (e) {
    logger.error('createNewTestCase error', e);
    return next(e);
  }
}

/**
 * Creates new test cases for simulation via bulk upload
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function createNewTestCases(req, res, next) {
  try {
    const TestCase = periodic.datas.get('standard_testcase');
    const PopulationTag = periodic.datas.get('standard_populationtag');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let populationTagMap = req.controllerData.populateTagMap || {};
    req.body.data = req.body.data.map(datum => {
      if (datum.population_tags && datum.population_tags.length) {
        datum.indices = datum.population_tags.reduce((returnData, ptag) => {
          let ptagDoc = populationTagMap[ ptag ];
          let ptag_name = (ptagDoc && ptagDoc.name) ? ptagDoc.name : ptag;
          populationTagMap[ ptag ].max_index = ptagDoc.max_index + 1;
          returnData[ ptag_name ] = ptagDoc.max_index;
          return returnData;
        }, {});
      }
      return Object.assign({}, datum, {
        user: {
          creator: `${req.user.first_name} ${req.user.last_name}`,
          updater: `${req.user.first_name} ${req.user.last_name}`,
        },
        organization,
      });
    });
    let createOptions = {
      newdoc: req.body.data,
      bulk_create: true,
    };
    try {
      let testcases = await TestCase.create(createOptions);
      testcases.forEach(tc => {
        tc.population_tags.forEach(tagId => {
          if (populationTagMap[ tagId ].testcases) populationTagMap[ tagId ].testcases.push(tc._id.toString());
          else populationTagMap[ tagId ].testcases = [ tc._id.toString(), ];
        });
      });
      await Promise.all(Object.keys(populationTagMap).map(tag_id => {
        return PopulationTag.update({
          id: tag_id,
          isPatch: false,
          updatedoc: { max_index: populationTagMap[ tag_id ].max_index, testcases: populationTagMap[ tag_id ].testcases, },
        });
      }));
      res.status(200).send({
        status: 200,
        timeout: 10000,
        type: 'success',
        text: 'Changes saved successfully!',
        successProps: {
          successCallback: 'func:window.closeModalAndCreateNotification',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
        pathname: '/processing/test_cases',
      });
    } catch (err) {
      logger.error('Unable to create testcase', err);
      return next(err);
    }
  } catch (e) {
    logger.error('createNewTestCases error', e);
    return next(e);
  }
}

/**
 * Deletes single test case
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function deleteTestCase(req, res, next) {
  try {
    const TestCase = periodic.datas.get('standard_testcase');
    const PopulationTags = periodic.datas.get('standard_populationtag');
    //update population tags
    let testcase = await TestCase.load({ query: { _id: req.params.id, }, });
    testcase = testcase.toJSON ? testcase.toJSON() : testcase;
    let updatedPopTags = testcase.population_tags.reduce((acc, curr) => {
      if (acc[ curr._id ]) {
        acc[ curr._id ].testcases = acc[ curr._id ].testcases.filter(id => id.toString() !== req.params.id.toString());
      } else {
        curr.testcases = curr.testcases.filter(id => id.toString() !== req.params.id.toString());
        acc[ curr._id ] = curr;
      }
      return acc;
    }, {});
    try {
      await Promise.all(Object.keys(updatedPopTags).map(id => {
        if (updatedPopTags[ id ].testcases.length) {
          return PopulationTags.update({
            id,
            isPatch: false,
            depopulate: false,
            updatedoc: updatedPopTags[ id ],
          });
        } else {
          PopulationTags.delete({ deleteid: id.toString(), });
        }
      }));
    } catch (err) {
      logger.error('Unable to update population tags', err);
      return next(err);
    }
    //delete test case
    await TestCase.delete({ deleteid: req.params.id, });
    return next();
  } catch (e) {
    logger.warn('Failed to delete test case: ', e);
    next(e);
  }
}

/**
 * Deletes single simulation result set
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function deleteSimulation(req, res, next) {
  try {
    const Simulation = periodic.datas.get('standard_simulation');
    Simulation.delete({ deleteid: req.params.id, })
      .then(() => next())
      .catch(e => next(e));
  } catch (e) {
    logger.error('Failed to delete result', e);
    return next(e);
  }
}

/**
 * Deletes single simulation result set
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function deleteBatchSimulation(req, res, next) {
  try {
    const Simulation = periodic.datas.get('standard_simulation');
    const Batch = periodic.datas.get('standard_batch');
    const Case = periodic.datas.get('standard_case');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let simulation = await Simulation.load({ query: { _id: req.params.id, }, });
    simulation = simulation.toJSON ? simulation.toJSON() : simulation;
    let batches = [];
    let cases = [];
    simulation.results.forEach(batch => {
      batches.push(batch._id.toString());
      cases.push(...batch.results.map(el => el.case.toString()));
    });
    await Case.model.deleteMany({ organization, _id: { $in: cases, }, });
    await Batch.model.deleteMany({ organization, _id: { $in: batches, }, });
    await Simulation.delete({ deleteid: req.params.id, organization, });
    next();
  } catch (e) {
    logger.error('Failed to delete result', e);
    return next(e);
  }
}

/**
 * Updates single test case
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function updateTestCase(req, res, next) {
  const TestCase = periodic.datas.get('standard_testcase');
  const PopulationTag = periodic.datas.get('standard_populationtag');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  req.body.user = req.body.user || {};
  req.body.user.updater = `${req.user.first_name} ${req.user.last_name}`;
  req.body.updatedat = new Date();
  try {
    await TestCase.update({
      id: req.params.id,
      updatedoc: req.body,
      isPatch: req.controllerData.isPatch === undefined ? true : req.controllerData.isPatch,
    });
  } catch (e) {
    logger.error('Unable to update testcase', e);
    return next(e);
  }
  try {
    let populationTagMap = req.controllerData.populationTagMap;
    if (populationTagMap) {
      let populationTags = await PopulationTag.query({ query: { _id: { $in: Object.keys(populationTagMap), }, organization, }, });
      let updatedTags = populationTags.map(tag => {
        tag = tag.toJSON ? tag.toJSON() : tag;
        tag.max_index = populationTagMap[ tag._id ].max_index;
        let duplicate = tag.testcases.filter(tc => tc.toString() === req.params.id.toString()).length;
        if (tag.testcases && Array.isArray(tag.testcases) && !duplicate) tag.testcases.push(req.params.id.toString());
        else tag.testcases = [ req.params.id.toString(), ];
        return tag;
      });
      await Promise.all(updatedTags.map(tag => {
        let updatedoc = Object.assign({}, tag);
        delete updatedoc._id;
        return PopulationTag.update({
          id: tag._id,
          isPatch: false,
          depopulate: false,
          updatedoc,
        });
      }));
    }
  } catch (err) {
    logger.error('Unable to update population tag(s)', err);
    return next(err);
  }
  return next();
}

/**
 * Retrieves single test case for test case detail in simulation
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function getSingleTestCaseData(req, res, next) {
  try {
    const TestCase = periodic.datas.get('standard_testcase');
    req.controllerData = req.controllerData || {};
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    TestCase.load({ query: { _id: req.params.id || req.body.id, }, organization, })
      .then(testcase => {
        testcase = testcase.toJSON ? testcase.toJSON() : testcase;
        req.controllerData.testcase = testcase;
        return next();
      })
      .catch(e => {
        logger.error('Unable to load single testcase', e);
        return next(e);
      });
  } catch (e) {
    logger.error('getSingleTestCaseData error', e);
    return next(e);
  }
}

/**
 * Registers the simulation in both Mongo and Redis
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function registerSimulation(req, res, next) {
  req.controllerData = req.controllerData || {};
  redisClient = periodic.app.locals.redisClient;
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  if (req.controllerData.testcases) {
    const Simulation = periodic.datas.get('standard_simulation');
    Simulation.create({
      name: (req.body.batch_name) ? req.body.batch_name : `${req.controllerData.compiledStrategy.title} v${req.controllerData.compiledStrategy.version} - ${transformhelpers.getDateAndTime({ date: new Date(), timezone: user.time_zone })}`,
      user: {
        name: `${req.user.first_name} ${req.user.last_name}`,
        email: `${req.user.email}`,
        _id: `${req.user._id}`,
      },
      status: 'In Progress',
      progress: 0,
      strategy_name: req.controllerData.compiledStrategy.name,
      strategy_version: req.controllerData.compiledStrategy.version,
      compiledstrategy: req.controllerData.compiledStrategy,
      organization,
    })
      .then(simulation => {
        redisClient.set(`${organization}_active_queue`, {
          size: req.controllerData.testcases.length,
          pending: req.controllerData.testcases.length,
          status: 'In progress',
        }, 'EX', 10, (err, reply) => {
          if (err) return next(err);
          else {
            req.controllerData.simulation = Object.assign({}, simulation._doc);
            return next();
          }
        });
      })
      .catch(err => {
        logger.error('registerSimulation error: ', err);
        return next(err);
      });
  } else {
    const Simulation = periodic.datas.get('standard_simulation');
    Simulation.create({
      newdoc: {
        name: (req.body.batch_name) ? req.body.batch_name : `${req.controllerData.compiledStrategy.title} v${req.controllerData.compiledStrategy.version} - ${transformhelpers.getDateAndTime({ date: new Date(), timezone: user.time_zone })}`,
        user: {
          name: `${req.user.first_name} ${req.user.last_name}`,
          email: `${req.user.email}`,
          _id: `${req.user._id}`,
        },
        status: 'In Progress',
        progress: 0,
        strategy_name: req.controllerData.compiledStrategy.name,
        strategy_version: req.controllerData.compiledStrategy.version,
        compiledstrategy: req.controllerData.compiledStrategy,
      },
    })
      .then(simulation => {
        redisClient.set('active_queue', {
          size: 500,
          pending: 500,
          status: 'In progress',
        }, 'EX', 10, (err, reply) => {
          if (err) return next(err);
          else {
            req.controllerData.simulation = Object.assign({}, simulation._doc);
            return next();
          }
        });
      })
      .catch(err => {
        logger.error('registerSimulation error: ', err);
        return next(err);
      });
  }
}

/**
 * Loads the compiled strategy for simulation
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function stageStrategyForSimulation(req, res, next) {
  req.controllerData = req.controllerData || {};
  let query = {};
  let options = {
    compiledstrategy: req.controllerData.compiledStrategy,
  };
  credit_engine.generateCreditSegments(query, true, options)
    .then(loaded => loaded())
    .then(result => {
      req.controllerData.credit_pipeline = result[ 0 ].engine;
      next();
    })
    .catch(err => {
      logger.warn('stageStrategyForSimulation error: ', err);
      next(err);
    });
}

function formatSimulationResult(result) {
  Object.keys(result).forEach(key => {
    if (typeof result[ key ] === 'number' && !isFinite(result[ key ])) {
      result[ key ] = result[ key ].toString();
    }
  });
  return result;
}

function toMB(byteVal) {
  return (byteVal / 1048576).toFixed(2);
}

/**
 * Sends test cases into the promise queue
 * addQueue takes an array of functions that return promises
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function stagePromiseQueue(req, res, next) {
  req.controllerData = req.controllerData || {};
  let user = req.user;
  let organization_name = (user && user.association && user.association.organization && user.association.organization.name) ? user.association.organization.name : null;
  if (req.controllerData.testcases) {
    let credit_pipeline = req.controllerData.credit_pipeline;
    addQueue(req.controllerData.testcases.map((tc, idx) => {
      return function () {
        return new Promise((resolve, reject) => {
          credit_pipeline(tc.value)
            .then(result => {
              result = formatSimulationResult(result);
              if (toMB(process.memoryUsage()[ 'heapUsed' ]) > 800) {
                global.gc();
              }
              resolve(Object.assign({ test_case_name: tc.name, }, result));
            })
            .catch(reject);
        });
      };
    }), req.controllerData.simulation);
    return next();
  }
}

/**
 * Sends success response.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
function handleControllerDataResponse(req, res) {
  req.controllerData = req.controllerData || {};
  delete req.controllerData.authorization_header;
  let controllerData = Object.assign({}, req.controllerData);
  delete req.controllerData;
  delete req.body;
  return res.send((controllerData.useSuccessWrapper) ? {
    result: 'success',
    data: controllerData,
  } : controllerData);
}

/**
 * Sends redirect path back to simulation on success
 * 
 * @param {any} req 
 * @param {any} res 
 */
function directToOutput(req, res) {
  let redirect_path = '/processing/output/results';
  return res.status(200).send({
    status: 200,
    timeout: 10000,
    type: 'success',
    message: 'Created Successfully!',
    pathname: redirect_path,
  });
}

/**
 * Returns all simulations for populating the table
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function returnAllSimulations(req, res, next) {
  let Simulation = periodic.datas.get('standard_simulation');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 15) : 0;
  Simulation.query({
    paginate: true, query: {}, sort: { createdat: -1, },
    pagelength: 15,
    fields: {
      createdat: 1,
      user: 1,
      _id: 1,
      entitytype: 1,
      status: 1,
      name: 1,
    },
    skip,
    organization,
  })
    .then(simulations => {
      req.controllerData = req.controllerData || {};
      let displaySimulations = simulations[ 0 ].documents.map(strategy => strategy.toJSON());
      req.controllerData = Object.assign({}, req.controllerData, {
        rows: displaySimulations,
        numPages: simulations.collection_pages,
        numItems: simulations.collection_count,
      });
      return next();
    })
    .catch(e => {
      logger.error('Unable to query simulation', e);
      return res.status(500).send({
        message: e.message,
      });
    });
}

/**
 * Checks if there is an active simulation
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function checkActiveSimulation(req, res, next) {
  req.controllerData = req.controllerData || {};
  redisClient = periodic.app.locals.redisClient;
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  redisClient.get(`${organization}_active_queue`, (err, result) => {
    if (result) {
      return res.status(404).send({
        message: 'There is already a strategy being processed. Please try again once it has finished.',
      });
    } else {
      return next();
    }
  });
}

/**
 * Setup zip file.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function createZipFile(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.controllerData.zip = new Zip();
  return next();
}

/**
 * Get simulation data.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function getSimulationData(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Simulation = periodic.datas.get('standard_simulation');
    if (req.params.id) {
      let simulation = await Simulation.load({ query: { _id: req.params.id, }, });
      if (!simulation) throw new Error('There is not matching result');
      simulation = simulation.toJSON ? simulation.toJSON() : simulation;
      if (simulation.status !== 'Complete') throw new Error('Batch Simulation is still in progress.');
      req.controllerData.simulation = simulation;
      return next();
    } else {
      return res.status(404).send({
        message: 'Error downloading CSV.',
      });
    }
  } catch (e) {
    next(e);
  }
}

/**
 * Get cases for simulation.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function getCasesFromSimulation(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Case = periodic.datas.get('standard_case');
  try {
    let caseIds = req.controllerData.simulation.results.reduce((acc, batch) => {
      acc.push(...batch.results.map(i => i.case));
      return acc;
    }, []);
    let cases = await Case.model.find({ _id: { $in: caseIds, }, }).populate('files').lean();
    req.controllerData.cases = cases;
    return next();
  } catch (err) {
    logger.error(err);
    return next('Unable to get cases from simulation data');
  }

}

/**
 * Generate download data.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function generateDownloadData(req, res, next) {
  req.controllerData = req.controllerData || {};
  let zip = req.controllerData.zip;
  if (req.params.id) {
    try {
      let flattenedOutput = [];
      let nonVariableKeys = [ 'name', 'passed', 'decline_reasons', 'credit_process', 'error', 'message', 'input_variables', 'output_variables', 'processing_detail', 'data_sources', 'assignments', 'calculations', 'requirements', 'scorecard', 'output', 'communications', 'dataintegration', 'artificialintelligence', 'strategy_status' ];
      let globalSortedOutputVars = [];
      let globalSortedInputVars = [];
      let uniqueVars = [ 'name', 'passed', 'decline_reasons', ];
      let fileUrls = [];
      req.controllerData.cases.forEach(result => {
        result.files.forEach(file => {
          fileUrls.push({
            name: `${result.case_name}/${file.name}.${file.filetype}`,
            fileurl: file.fileurl,
          });
        });
        let sortedInputVariables = {};
        let sortedOutputVariables = {};
        let outputVariables = (result && result.outputs) ? Object.keys(result.outputs).reduce((acc, curr) => {
          if (!nonVariableKeys.includes(curr)) {
            if (!uniqueVars.includes(curr)) uniqueVars.push(curr);
            acc[ curr ] = result.outputs[ curr ];
          }
          return acc;
        }, {}) : [];
        if (result.inputs) {
          Object.keys(result.inputs).sort().forEach(function (key) {
            if (key && key.length && !nonVariableKeys.includes(key)) {
              sortedInputVariables[ key ] = (result.inputs[ key ] && result.inputs[ key ].includes && result.inputs[ key ].includes(',')) ? result.inputs[ key ].replace(/,/g, ' ') : result.inputs[ key ];
            }
          });
        }

        if (outputVariables) {
          Object.keys(outputVariables).sort().forEach(function (key) {
            sortedOutputVariables[ key ] = (outputVariables[ key ] && outputVariables[ key ].includes && outputVariables[ key ].includes(',')) ? outputVariables[ key ].replace(/,/g, ' ') : outputVariables[ key ];
          });
        }

        if (result && !result.inputs && !result.outputs) {
          uniqueVars = [ 'name', 'passed', 'errors', ];
        }
        let x = Object.assign({}, {
          name: result.case_name,
          passed: result.passed,
          decline_reasons: result.decline_reasons ? result.decline_reasons.join(';') : '',
        }, sortedOutputVariables, sortedInputVariables, {
            errors: (result.error && Array.isArray(result.error)) ? result.error[ 0 ] : '',
          });
        globalSortedInputVars.push(...Object.keys(sortedInputVariables) || []);
        globalSortedOutputVars.push(...Object.keys(sortedOutputVariables) || []);
        flattenedOutput.push(x);
      });
      globalSortedInputVars = [ ... new Set(globalSortedInputVars.sort()), ];
      globalSortedOutputVars = [ ... new Set(globalSortedOutputVars.sort()), ];
      req.controllerData.uniqueVars = [ 'name', 'passed', 'decline_reasons', ...globalSortedOutputVars, ...globalSortedInputVars, 'errors', ];
      req.controllerData.flattenedOutput = flattenedOutput;
      req.controllerData.flattenedOutputName = `${req.controllerData.simulation.name.slice(0, 20)}_results`;
      let fileBuffers = await fileUrls.reduce(async (acc, curr) => {
        acc = await acc;
        let dataIntBuffer = await helpers.downloadAWS({ fileurl: curr.fileurl, });
        acc.push(dataIntBuffer);
        return acc;
      }, []);
      fileBuffers.forEach((buff, idx) => {
        zip.addFile(fileUrls[ idx ].name, buff);
      });
      return next();
    } catch (e) {
      return next(e);
    }
  } else {
    return res.status(404).send({
      message: 'Error downloading CSV.',
    });
  }
}

async function generateDownloadCaseData(req, res, next) {
  req.controllerData = req.controllerData || {};
  let zip = req.controllerData.zip;
  if (req.params.id) {
    try {
      let flattenedOutput = [];
      let nonVariableKeys = [ 'name', 'passed', 'decline_reasons', 'credit_process', 'error', 'message', 'input_variables', 'output_variables', 'processing_detail', 'data_sources', 'assignments', 'calculations', 'requirements', 'scorecard', 'output', 'communications', 'dataintegration', 'artificialintelligence', 'selected_strategy', 'strategy_status' ];
      let globalSortedOutputVars = [];
      let globalSortedInputVars = [];
      let uniqueVars = [ 'name', 'passed', 'decline_reasons', ];
      let fileUrls = [];
      let casedata = req.controllerData.data;
      let cleanName = casedata.case_name.replace(/\s+/g, '_').replace(/\//g, '-');
      let sortedInputVariables = {};
      let sortedOutputVariables = {};
      let outputVariables = (casedata && casedata.outputs) ? Object.keys(casedata.outputs).reduce((acc, curr) => {
        if (!nonVariableKeys.includes(curr)) {
          if (!uniqueVars.includes(curr)) uniqueVars.push(curr);
          acc[ curr ] = casedata.outputs[ curr ];
        }
        return acc;
      }, {}) : [];
      if (casedata.inputs) {
        Object.keys(casedata.inputs).sort().forEach(function (key) {
          if (key && key.length && !nonVariableKeys.includes(key)) {
            sortedInputVariables[ key ] = (casedata.inputs[ key ] && casedata.inputs[ key ].includes && casedata.inputs[ key ].includes(',')) ? casedata.inputs[ key ].replace(/,/g, ' ') : casedata.inputs[ key ];
          }
        });
      }

      if (outputVariables) {
        Object.keys(outputVariables).sort().forEach(function (key) {
          sortedOutputVariables[ key ] = (outputVariables[ key ] && outputVariables[ key ].includes && outputVariables[ key ].includes(',')) ? outputVariables[ key ].replace(/,/g, ' ') : outputVariables[ key ];
        });
      }

      if (casedata && !casedata.inputs && !casedata.outputs) {
        uniqueVars = [ 'name', 'passed', 'errors', ];
      }
      let x = Object.assign({}, {
        name: casedata.case_name,
        passed: casedata.passed,
        decline_reasons: casedata.decline_reasons ? casedata.decline_reasons.join(';') : '',
      }, sortedOutputVariables, sortedInputVariables, {
          errors: (casedata.error && Array.isArray(casedata.error)) ? casedata.error[ 0 ] : '',
        });
      globalSortedInputVars.push(...Object.keys(sortedInputVariables) || []);
      globalSortedOutputVars.push(...Object.keys(sortedOutputVariables) || []);
      flattenedOutput.push(x);
      if (Array.isArray(casedata.files) && casedata.files.length) {
        casedata.files.forEach(file => {
          fileUrls.push({
            // name: `${casedata.case_name} / ${file.name}.${file.filetype}`,
            name: `${file.name}.${file.filetype}`,
            fileurl: file.fileurl,
          });
        });
      }
      globalSortedInputVars = [ ... new Set(globalSortedInputVars.sort()), ];
      globalSortedOutputVars = [ ... new Set(globalSortedOutputVars.sort()), ];
      req.controllerData.uniqueVars = [ 'name', 'passed', 'decline_reasons', ...globalSortedOutputVars, ...globalSortedInputVars, 'errors', ];
      req.controllerData.flattenedOutput = flattenedOutput;
      req.controllerData.flattenedOutputName = `${cleanName}_results`;
      let fileBuffers = await fileUrls.reduce(async (acc, curr) => {
        acc = await acc;
        let dataIntBuffer = await helpers.downloadAWS({ fileurl: curr.fileurl, });
        acc.push(dataIntBuffer);
        return acc;
      }, []);
      fileBuffers.forEach((buff, idx) => {
        zip.addFile(fileUrls[ idx ].name, buff);
      });
      return next();
    } catch (e) {
      return next(e);
    }
  } else {
    return res.status(404).send({
      message: 'Error downloading CSV.',
    });
  }
}


async function getSimulationDatas(req, res, next) {
  try {
    let Simulation = periodic.datas.get('standard_simulation');
    const Case = periodic.datas.get('standard_case');
    req.controllerData = req.controllerData || {};
    if (req.query && req.query.simulations) {
      let ordered = req.query.simulations.split(';');
      let simulations = await Simulation.query({ query: { name: { $in: req.query.simulations.split(';'), }, }, });
      await Promise.all(simulations.map(async simulation => {
        simulation = simulation.toJSON ? simulation.toJSON() : simulation;
        let cases = [];
        simulation.results.forEach(result => {
          cases.push(...result.results.map(cs => cs.case));
        });
        cases = await Case.query({ query: { _id: { $in: cases, }, }, population: 'true', });
        cases = cases.map(cs => {
          return cs.toJSON ? cs.toJSON() : cs;
        });
        simulation.results = cases;
        if (simulation.name && ordered.indexOf(simulation.name) >= 0) ordered[ ordered.indexOf(simulation.name) ] = simulation;
      }));
      req.body.navbar = req.body.navbar || {};
      if (req.query.output_variable && req.query.output_variable !== 'undefined') req.body.navbar.output_variable = req.query.output_variable;
      if (req.query.input_variable && req.query.input_variable !== 'undefined') req.body.navbar.input_variable = req.query.input_variable;
      if (req.query.simulation_index) req.body.navbar.simulation_index = req.query.simulation_index;
      req.controllerData.data = ordered;
      next();
    } else {
      req.error = 'Error finding data for export';
      next();
    }
  } catch (e) {
    req.error = 'Error finding data for export';
    next();
  }
}

/**
 * Download CSV file.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function downloadCSV(req, res, next) {
  req.params = req.params || {};
  if (req.controllerData && req.controllerData.flattenedOutput) {
    let name = req.controllerData.flattenedOutputName || 'sample';
    let headers = req.controllerData.uniqueVars;
    let exportData = req.controllerData.flattenedOutput;
    let dateAndTime = transformhelpers.getDateAndTime({ date: new Date(), format: 'YYYY-MM-DD_HH-mm' });
    const exportName = `${dateAndTime}_${name}.${req.query.export_format || '.csv'}`;
    const tempdir = path.join(process.cwd(), 'content/files/temp');
    const tempFilepath = path.join(tempdir, exportName);
    const mimetype = (req.query.export_format === 'csv')
      ? 'text/csv'
      : 'application/json';


    const csv_options = {
      emptyFieldValue: '',
      keys: headers,
      delimiter: {
        array: ';', // Semicolon array value delimiter
      },
      checkSchemaDifferences: false,
    };
    if (req.query.export_format === 'csv') {
      converter.json2csv(exportData, (err, csv) => {
        if (err) {
          next(err);
        } else {
          fs.ensureDir(tempdir, err => {
            if (err) {
              next(err);
            } else {
              fs.outputFileAsync(tempFilepath, csv)
                .then(() => {
                  res.setHeader('Content-disposition', 'attachment; filename=' + exportName);
                  res.setHeader('Content-type', mimetype);
                  res.download(tempFilepath, exportName);
                  helpers.cleanupTempFile(tempFilepath);
                })
                .catch(e => {
                  next(e);
                });
            }
          });
        }
      }, csv_options);
    } else {
      fs.outputJsonAsync(tempFilepath, exportData)
        .then(() => {
          res.setHeader('Content-disposition', 'attachment; filename=' + exportName);
          res.setHeader('Content-type', mimetype);
          res.download(tempFilepath, exportName);
          helpers.cleanupTempFile(tempFilepath);
        })
        .catch(next);
    }
  } else {
    let pathname = req.headers.referer.substring(req.headers.referer.indexOf(req.headers.host) + req.headers.host.length);
    res.status(400).send({
      status: 400,
      data: {
        error: {
          pathname,
          errorCallback: 'func:this.props.reduxRouter.push',
          type: 'error',
          text: 'There is no data to export',
          timeout: 10000,
        },
      },
    });
  }
}

async function sortBatchResults(req, res, next) {
  req.controllerData = req.controllerData || {};
  let cases = req.controllerData.flattenedOutput.map(x => {
    x.idx = Number(x.name.replace('Batch Process ', ''));
    return x;
  });
  req.controllerData.flattenedOutput = cases.sort((a, b) => {
    if (a.idx < b.idx) return -1
    if (a.idx > b.idx) return 1
    return 0;
  });
  req.controllerData.flattenedOutput = req.controllerData.flattenedOutput.map(x => {
    delete x.idx;
    return x;
  });
  next();
}

/**
 * Add csv file to zip file.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function addCSVtoZipFile(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.params = req.params || {};
  let zip = req.controllerData.zip;
  if (req.controllerData && req.controllerData.flattenedOutput) {
    let name = req.controllerData.flattenedOutputName || 'sample';
    let headers = req.controllerData.uniqueVars;
    let exportData = req.controllerData.flattenedOutput;
    let asyncJson2Csv = Bluebird.promisify(converter.json2csv, { context: converter, });
    let cleanName = name.replace(/\s+/g, '_').replace(/\//g, '-');
    const exportName = `${cleanName}.csv`;
    const csv_options = {
      emptyFieldValue: '',
      keys: headers,
      delimiter: {
        array: ';', // Semicolon array value delimiter
      },
      checkSchemaDifferences: false,
    };
    if (req.query.section && req.query.section === 'batch') {
      let csvdata = await Promise.all(req.controllerData.cases.map((cs, idx) => asyncJson2Csv(exportData[ idx ], csv_options)));
      csvdata.forEach((file, idx) => {
        zip.addFile(`${exportData[ idx ].name}/${exportData[ idx ].name.replace(/\s+/g, '_').replace(/\//g, '-')}_results.csv`, new Buffer(`\ufeff${file}`));
      });
      let bulkcsvdata = await asyncJson2Csv(exportData, csv_options);
      zip.addFile(exportName, new Buffer(`\ufeff${bulkcsvdata}`));
      return next();
    } else {
      converter.json2csv(exportData, (err, csv) => {
        if (err) return next(err);
        else {
          zip.addFile(exportName, new Buffer(`\ufeff${csv}`));
          return next();
        }
      }, csv_options);
    }
  } else {
    let pathname = req.headers.referer.substring(req.headers.referer.indexOf(req.headers.host) + req.headers.host.length);
    res.status(400).send({
      status: 400,
      data: {
        error: {
          pathname,
          errorCallback: 'func:this.props.reduxRouter.push',
          type: 'error',
          text: 'There is no data to export',
          timeout: 10000,
        },
      },
    });
  }
}

/**
 * Download zip file.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function downloadZipFile(req, res, next) {
  req.controllerData = req.controllerData || {};
  let name = req.controllerData.flattenedOutputName || 'zipFile';
  let exportName = `${name}.zip`;
  let zipBuffer = req.controllerData.zip.toBuffer();
  res.setHeader('Content-disposition', 'attachment; filename=' + exportName);
  res.setHeader('Content-type', 'application/zip');
  let writeStream = helpers.bufferToStream(zipBuffer).pipe(res);
  writeStream.on('error', next);
  writeStream.on('finish', () => { });
}

function getCompiledStrategyDropdown(req, res, next) {
  const CompiledStrategy = periodic.datas.get('standard_compiledstrategy');
  req.controllerData = req.controllerData || {};
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  CompiledStrategy.query({ organization, })
    .then(compiledstrategies => {
      compiledstrategies = compiledstrategies.map(strategy => strategy.toJSON());
      let strategy = compiledstrategies.map(st => ({ label: `${st.title} v.${st.version_major}`, value: st._id, }));
      req.controllerData.formoptions = {
        strategy,
      };
      next();
    })
    .catch(e => {
      logger.warn('error in getting compiled strategy dropdown', e.message);
      res.status(400).send({
        message: e.message,
      });
    });
}

/**
 * Gets the test case variables and puts it on flattenedOutput.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getTestCaseVariables(req, res, next) {
  req.controllerData = req.controllerData || {};
  let organization = req.params.organization || 'organization';
  if (req.params.id) {
    const TestCase = periodic.datas.get('standard_testcase');
    TestCase.load({ query: { _id: req.params.id, organization, }, })
      .then(testcase => {
        testcase = testcase.toJSON ? testcase.toJSON() : testcase;
        if (!testcase.value) testcase.value = {};
        Object.keys(testcase.value).forEach(key => {
          if (testcase.value[ key ] === null) testcase.value[ key ] = 'null';
        });
        req.controllerData.flattenedOutput = [ testcase.value, ];
        req.controllerData.flattenedOutputName = `${testcase.displayname}_variables`;
        return next();
      })
      .catch(err => {
        logger.error('Unable to load testcase', err);
        return next(err);
      });
  } else {
    return res.status(404).send({
      message: 'Error downloading CSV.',
    });
  }
}

/**
 * Checks the test case variables to make sure the data type is correct.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function checkTestCaseVariables(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let data_types = req.controllerData.data_types;
    let misTypedErr = [];
    let undefinedVariableErr;
    if (req.query.bulk) {
      if (!req.body.data) return next('No file uploaded');
      let valueArr = req.body.data.reduce((acc, curr) => {
        acc.push(curr.value);
        return acc;
      }, []);
      undefinedVariableErr = {};
      valueArr.forEach((value, idx) => {
        Object.keys(value).forEach(key => {
          if (data_types[ key ] === 'Date' && typeof value[ key ] === 'string') value[ key ] = (moment(value[ key ]).toISOString()) ? moment(value[ key ]).toISOString() : value[ key ];
          if ((data_types[ key ] === 'Date' && typeof value[ key ] !== 'string') || (data_types[ key ] === 'Date' && typeof value[ key ] === 'string' && !moment(value[ key ]).toISOString())) {
            misTypedErr.push(`${req.body.data[ idx ].name}'s ${key} (needs to be a valid isodate string)`);
          } else if (data_types[ key ] && data_types[ key ] !== 'Date' && typeof value[ key ] !== data_types[ key ].toLowerCase() && value[ key ] !== null) {
            if (data_types[ key ].toLowerCase() === 'string') value[ key ] = value[ key ].toString();
            else misTypedErr.push(`${req.body.data[ idx ].name}'s ${key} (needs to be a ${data_types[ key ].toLowerCase()})`);
          } else if (data_types[ key ] === undefined) {
            undefinedVariableErr[ key ] = true;
          }
        });
      });
      undefinedVariableErr = Object.keys(undefinedVariableErr);
    } else {
      if (req.query.upload && !req.body.value) return next('No file uploaded');
      let value = req.body.value;
      undefinedVariableErr = [];
      if (value) {
        Object.keys(value).forEach(key => {
          if (data_types[ key ] === 'Date' && typeof value[ key ] === 'string') value[ key ] = (moment(value[ key ]).toISOString()) ? moment(value[ key ]).toISOString() : value[ key ];
          if ((data_types[ key ] === 'Date' && typeof value[ key ] !== 'string') || (data_types[ key ] === 'Date' && typeof value[ key ] === 'string' && value[ key ] !== 'MM/DD/YYYY' && !moment(value[ key ]).toISOString())) {
            misTypedErr.push(`${key} (needs to be a valid isodate string)`);
          } else if (data_types[ key ] && data_types[ key ] !== 'Date' && typeof value[ key ] !== data_types[ key ].toLowerCase() && value[ key ] !== null) {
            if (data_types[ key ].toLowerCase() === 'string') value[ key ] = value[ key ].toString();
            else misTypedErr.push(`${key} (needs to be a ${data_types[ key ].toLowerCase()})`);
          } else if (data_types[ key ] === undefined) {
            undefinedVariableErr.push(key);
          }
        });
      }
    }
    if (undefinedVariableErr.length) return res.status(404).send({ message: `The following fields in your file do not correspond to variable system names: ${undefinedVariableErr.join(', ')}. Please add the variables before uploading.`, });
    if (misTypedErr.length) return res.status(404).send({ message: `The following data types are mistyped: ${misTypedErr.join(', ')}`, });
    return next();
  } catch (err) {
    logger.error('checkTestCaseVariables error', err);
    return next(err);
  }
}

/**
 * Creates single population tag.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function createPopulationTag(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const PopulationTag = periodic.datas.get('standard_populationtag');
    if (req.body.population_tags) {
      let createOptions = {
        newdoc: {
          name: req.body.population_tags,
          user: `${req.user.first_name} ${req.user.last_name}`,
          organization,
        },
      };
      try {
        let result = await PopulationTag.load({ query: { name: req.body.population_tags, organization, }, });
        if (result) return next('Population tag already exists!');
        else await PopulationTag.create(createOptions);
      } catch (err) {
        logger.error('Unable to load/ create population tag', err);
        return next(err);
      }
    }
    return next();
  } catch (err) {
    logger.error('createPopulationTag error', err);
    return next(err);
  }
}

/**
 * Creates multiple population tags.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function createPopulationTags(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.populateTagMap = {};
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const PopulationTag = periodic.datas.get('standard_populationtag');
    if (!req.body.data) return next('No file was uploaded');
    let uniqueTags = req.body.data.reduce((tags, testcase) => {
      if (testcase.population_tags) {
        testcase.population_tags.forEach(tag => {
          tags[ tag ] = true;
        });
      }
      return tags;
    }, {});
    if (Object.keys(uniqueTags).length) {
      let checkPopTags = Object.keys(uniqueTags).map(tagname => {
        return PopulationTag.load({ query: { name: tagname, organization, }, });
      });
      let tagId;
      let newTags;
      try {
        let existingTag = await Promise.all(checkPopTags);
        existingTag = existingTag.filter(tag => tag !== null);
        tagId = existingTag.reduce((acc, curr) => {
          acc[ curr.name ] = curr._id;
          req.controllerData.populateTagMap[ curr._id ] = (curr.max_index) ? { name: curr.name, max_index: curr.max_index, } : { _id: curr._id, max_index: 0, };
          return acc;
        }, {});
        existingTag = existingTag.map(tag => tag.name);
        existingTag.forEach(existing => {
          uniqueTags[ existing ] = false;
        });
        newTags = Object.keys(uniqueTags).filter(tag => uniqueTags[ tag ]);
      } catch (err) {
        logger.error('Unable to load existing population tags', err);
        return next(err);
      }

      try {
        let createNewTags = newTags.map(tagname => {
          return PopulationTag.create({
            newdoc: {
              name: tagname,
              user: `${req.user.first_name} ${req.user.last_name}`,
              organization: req.user.association.organization._id,
            },
          });
        });
        let tags = await Promise.all(createNewTags);
        tags = tags.toJSON ? tags.toJSON() : tags;
        tags.reduce((acc, curr) => {
          acc[ curr.name ] = curr._id;
          req.controllerData.populateTagMap[ curr._id ] = (curr.max_index) ? { name: curr.name, max_index: curr.max_index, } : { _id: curr._id, max_index: 0, };
          return acc;
        }, tagId);
        req.body.data.forEach(testcase => {
          testcase.population_tags = testcase.population_tags.map(tagname => {
            return tagId[ tagname ];
          });
        });
      } catch (err) {
        logger.error('Unable to create population tags for bulk upload', err);
        return next(err);
      }
    }
    return next();
  } catch (err) {
    logger.error('createPopulationTags error', err);
    return next(err);
  }
}

/**
 * Get population tags by organization.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getPopulationTag(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let user = req.user;
    const PopulationTag = periodic.datas.get('standard_populationtag');
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let queryOptions = ([ 'simulations', 'deleteTestCasesModal', ].indexOf(req.query.pagination) !== -1)
      ? { query: { organization, }, fields: [ 'name', ], }
      : { query: { organization, }, };
    PopulationTag.query(queryOptions)
      .then(populationTags => {
        req.controllerData.populationTags = populationTags;
        return next();
      })
      .catch(err => {
        logger.error('Unable to query for population tags', err);
        return next(err);
      });
  } catch (err) {
    logger.error('getPopulationTag error', err);
    return next(err);
  }
}

/**
 * Setup the test case template for csv download.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getTestCaseTemplate(req, res, next) {
  req.controllerData = req.controllerData || {};
  if (req.query.page === 'processing') {
    req.controllerData.flattenedOutput = [ req.body.value, ];
    req.controllerData.flattenedOutputName = 'processing_template';
  } else {
    req.controllerData.flattenedOutput = [ Object.assign({
      name: 'example test case',
      population_tags: 'tag1;tag2',
      description: 'description for example test case',
    }, req.body.value),
    ];
    req.controllerData.flattenedOutputName = 'bulk_upload_template';
  }
  return next();
}

//This needs to be a transfrom
async function fetchSimulationsData(req, res, next) {
  try {
    req.body = unflatten(req.body);
    const Case = periodic.datas.get('standard_case');
    if (req.body.init && !req.body.set) {
      req.controllerData = {
        data: [],
        formdata: {
          init: false,
        },
        navbar: {},
        _children: {
          simulation_chart_card: [],
        },
      };
      res.status(200).send(req.controllerData);
    } else if (req.body.set && Array.isArray(req.body.set) && req.body.set.length) {
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      const Simulation = periodic.datas.get('standard_simulation');
      req.body.set = req.body.set || [];
      let query = { _id: { $in: req.body.set, }, };
      let ordered = [];
      let simulations = await Simulation.query({ query, });
      await Promise.all(simulations.map(async simulation => {
        simulation = simulation.toJSON ? simulation.toJSON() : simulation;
        let cases = [];
        simulation.results.forEach(result => {
          cases.push(...result.results.map(cs => cs.case));
        });
        cases = await Case.query({ query: { _id: { $in: cases, }, }, population: 'true', });
        cases = cases.map(cs => {
          return cs.toJSON ? cs.toJSON() : cs;
        });
        simulation.results = cases;
        if (simulation._id && req.body.set.indexOf(simulation._id.toString()) >= 0) ordered[ req.body.set.indexOf(simulation._id.toString()) ] = simulation;
      }));
      req.controllerData.data = ordered;
      next();
    } else {
      res.status(500).send({
        message: 'Please select a result first.',
      });
    }
  } catch (e) {
    next();
  }
}

function generateResultDropdown(req, res, next) {
  let Simulation = periodic.datas.get('standard_simulation');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  Simulation.query({
    query: { organization, }, sort: { createdat: -1, },
    fields: {
      _id: 1,
      name: 1,
    },
  })
    .then(simulations => {
      req.controllerData = req.controllerData || {};
      let formoptions = simulations.map(simulation => {
        return {
          label: simulation.name,
          value: simulation._id,
        };
      });
      req.controllerData.data = req.controllerData.data || {};
      req.controllerData.formoptions = Object.assign({}, req.controllerData, {
        'set.0': formoptions,
        'set.1': formoptions,
        'set.2': formoptions,
        'set.3': formoptions,
        'set.4': formoptions,
        'set.5': formoptions,
        'set.6': formoptions,
        'set.7': formoptions,
        'set.8': formoptions,
        'set.9': formoptions,
      });
      return next();
    })
    .catch(e => {
      logger.error('Unable to query simulation', e);
      return res.status(500).send({
        message: e.message,
      });
    });
}

// old check simulation
// function checkSimulation(req, res, next) {
//   req.controllerData = req.controllerData || {};
//   if (!req.body.strategy && req.query.pagination === 'simulations') return next('Please select a strategy.');
//   if (!req.body.select_testcases) return next('Please select test cases for the strategy.');
//   if (req.body.select_testcases === 'specific_cases' && !req.body.testcases_dropdown) return next('Please select at least one test case.');
//   if (req.body.select_testcases === 'population' && !req.body.population_tags) return next('Please select at least one population tag.');
//   let user = req.user;
//   let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
//   const Simulation = periodic.datas.get('standard_simulation');
//   const LIMIT = (CONTAINER_SETTING && CONTAINER_SETTING.simulation && CONTAINER_SETTING.simulation.limit) ? CONTAINER_SETTING.simulation.limit : 100;
//   Simulation.model.count({ organization, }, (err, count) => {
//     if (err || count > LIMIT) return next('Results are limited to 100. Please delete a result before running again.');
//     else next();
//   });
// }

function checkSimulation(req, res, next) {
  req.controllerData = req.controllerData || {};
  if (!req.body.strategy && req.query.pagination === 'simulations') return next('Please select a strategy.');
  return next();
  // let user = req.user;
  // let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  // const Simulation = periodic.datas.get('standard_simulation');
  // const LIMIT = (CONTAINER_SETTING && CONTAINER_SETTING.simulation && CONTAINER_SETTING.simulation.limit) ? CONTAINER_SETTING.simulation.limit : 100;
  // Simulation.model.count({ organization, }, (err, count) => {
  //   if (err || count > LIMIT) return next('Results are limited to 100. Please delete a result before running again.');
  //   else next();
  // });
}

/**
 * Gets all simulations.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function getSimulations(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const Simulation = periodic.datas.get('standard_simulation');
    let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 10) : 0;
    let queryOptions = ([ 'simulations', 'deleteTestCasesModal', ].indexOf(req.query.pagination) !== -1)
      ? { query: { organization, }, sort: {}, fields: [ 'name', 'createdat', 'user', 'status', 'progress', 'organization', ], population: 'false', }
      : req.body.query ? { query: Object.assign({}, req.body.query, organization), sort: {}, } : { query: { organization, }, sort: {}, population: 'false', };

    Simulation.query(queryOptions)
      .then(simulations => {
        simulations = simulations.map(simulation => simulation.toJSON ? simulation.toJSON() : simulation);
        simulations = helpers.mergeSort(simulations, 'createdat');
        req.controllerData.simulations = simulations;
        if (req.query.pagination === 'simulations') {
          req.controllerData = Object.assign({}, req.controllerData, {
            rows: simulations.slice(skip),
            numPages: Math.ceil(simulations.length / 10),
            numItems: simulations.length,
          });
        }
        return next();
      })
      .catch(e => {
        logger.error('Unable to query simulations', e);
        return next(e);
      });
  } catch (e) {
    logger.error('getSimulations error', e);
    return next(e);
  }
}

function pullPopulationTags(req, res, next) {
  try {
    const PopulationTag = periodic.datas.get('standard_populationtag');
    if (req.body.population_tags) {
      PopulationTag.query({ query: { _id: { $in: req.body.population_tags, }, }, })
        .then(ptags => {
          req.controllerData = req.controllerData || {};
          req.controllerData.populationTagMap = ptags.reduce((returnData, ptag) => {
            ptag = ptag.toJSON ? ptag.toJSON() : ptag;
            returnData[ ptag._id ] = { max_index: ptag.max_index, name: ptag.name, };
            return returnData;
          }, {});
          next();
        });
    } else {
      next();
    }
  } catch (e) {
    logger.error('pullPopulationTag error', e);
    return next(e);
  }
}

// old runBatchSimulations
// async function runBatchSimulations(req, res, next) {
//   try {
//     req.controllerData = req.controllerData || {};
//     let user = req.user;
//     let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
//     const Testcase = periodic.datas.get('standard_testcase');
//     const Simulation = periodic.datas.get('standard_simulation');
//     const PopulationTag = periodic.datas.get('standard_populationtag');
//     let credit_pipeline = req.controllerData.credit_pipeline;
//     let populationTagMap = req.controllerData.populationTagMap;
//     let offset = 0;
//     let limit = 500;
//     let test_case_length;
//     let query;
//     res.status(200).send({ message: 'OK', });
//     if (req.body && req.body.population_tags && req.body.population_tags.length) {
//       let popTags = await PopulationTag.query({ query: { _id: { $in: req.body.population_tags, }, organization, }, });
//       let totalCount = popTags.reduce((acc, curr) => {
//         acc += curr.testcases.length;
//         return acc;
//       }, 0);
//       await Promise.all(req.body.population_tags.map(async ptag => {
//         ptag = await ptag;
//         let max_index = populationTagMap[ ptag ].max_index;
//         let index_tag_name = `indices.${ptag}`;
//         return await Promisie.doWhilst(async () => {
//           query = { $and: [{ [ `${index_tag_name}` ]: { $gte: offset, }, }, { [ `${index_tag_name}` ]: { $lt: offset + 500, }, },], };
//           let testcases = await Testcase.model.find(query, { 'value': 1, name: 1, }).lean();
//           if (testcases && testcases.length) {
//             testcases = testcases.map(testcase => testcase.toJSON ? testcase.toJSON() : testcase);
//             offset += limit;
//             test_case_length = testcases.length;  
//             return await addQueue({
//               arrayOfPromises: testcases.map((tc) => {
//                 return function () {
//                   return new Promise((resolve, reject) => {
//                     credit_pipeline(Object.assign({}, tc.value, { strategy_status: req.controllerData.strategy_status, }))
//                       .then(result => {
//                         result = formatSimulationResult(result);
//                         resolve(Object.assign({ test_case_name: tc.name, }, result));
//                       })
//                       .catch(reject);
//                   });
//                 };
//               }),
//               mongodoc: req.controllerData.simulation,
//               totalCount,
//               currentCount: testcases.length,
//               organization,
//             });
//           } else {
//             offset += limit;
//             return;
//           }
//         }, () => offset < max_index);
//       }));
//       return next();
//     } else if (req.query.upload && req.body.testcase_file) {
//       test_case_length = req.controllerData.testcases.length;
//       let testcases = req.controllerData.testcases;
//       await Promisie.doWhilst(async () => {
//         await addQueue({
//           arrayOfPromises: testcases.slice(offset, offset + limit).map((tc) => {
//             return function () {
//               return new Promise((resolve, reject) => {
//                 credit_pipeline(Object.assign({}, tc.value, { strategy_status: req.controllerData.strategy_status, }))
//                   .then(result => {
//                     result = formatSimulationResult(result);
//                     resolve(Object.assign({ test_case_name: tc.name, }, result));
//                   })
//                   .catch(reject);
//               });
//             };
//           }),
//           mongodoc: req.controllerData.simulation,
//           currentCount: limit,
//           totalCount: test_case_length,
//           organization,
//         });
//         offset += limit;
//         return offset;
//       }, () => offset < test_case_length);
//       return next();
//     } else {
//       query = { _id: { $in: req.body.testcases_dropdown, }, };
//       let testcases = await Testcase.model.find(query, { 'value': 1, name: 1, }).lean();
//       if (testcases && testcases.length) {
//         testcases = testcases.map(testcase => testcase.toJSON ? testcase.toJSON() : testcase);
//         test_case_length = testcases.length;
//         await addQueue({
//           arrayOfPromises: testcases.map((tc, idx) => {
//             return function () {
//               return new Promise((resolve, reject) => {
//                 credit_pipeline(Object.assign({}, tc.value, { strategy_status: req.controllerData.strategy_status, }))
//                   .then(result => {
//                     result = formatSimulationResult(result);
//                     resolve(Object.assign({ test_case_name: tc.name, }, result));
//                   })
//                   .catch(reject);
//               });
//             };
//           }),
//           mongodoc: req.controllerData.simulation,
//           totalCount: 1,
//           currentCount: 1,
//           organization,
//         });
//       }
//       return next();
//     }
//   } catch (e) {
//     logger.error('runBatchSimulations error', e);
//     return next(e);
//   }
// }

/**
 * Run simulations.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function runBatchSimulations(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let credit_pipeline = req.controllerData.credit_pipeline;
    let offset = 0;
    let limit = 100;
    let test_case_length;
    // res.status(200).send({ message: 'OK', });
    res.status(200).send({
      status: 200,
      timeout: 10000,
      type: 'success',
    });
    test_case_length = req.controllerData.testcases.length;
    let testcases = req.controllerData.testcases;
    testcases = testcases.reverse();
    let currentBatchCases;
    let currentBatchCaseLength;
    await Promisie.doWhilst(async () => {
      currentBatchCases = testcases.slice(offset, offset + limit);
      currentBatchCaseLength = currentBatchCases.length;
      await addQueue({
        arrayOfPromises: currentBatchCases.map((tc) => {
          return function () {
            return new Promise((resolve, reject) => {
              credit_pipeline(Object.assign({}, tc.value, { strategy_status: req.controllerData.strategy_status, }))
                .then(result => {
                  result = formatSimulationResult(result);
                  resolve(Object.assign({ test_case_name: tc.name, }, result));
                })
                .catch(reject);
            });
          };
        }),
        strategy_display_name: req.controllerData.compiledStrategy.display_name,
        compiled_order: req.controllerData.compiled_order,
        strategyId: req.body.strategy,
        mongodoc: req.controllerData.simulation,
        currentCount: currentBatchCaseLength,
        totalCount: test_case_length,
        user,
        organization,
      });
      offset += limit;
      return offset;
    }, () => offset < test_case_length);
    return next();
  } catch (e) {
    logger.error('runBatchSimulations error', e);
    return next(e);
  }
}

/**
 * Save the data integration responses to files.
 * @param {Object} options Contains results array and simulation object
 */
async function saveFiles(options) {
  const File = periodic.datas.get('standard_file');
  let { result, case_name, organization, user, } = options;
  return Promise.all(result.data_sources.map(async data_source => {
    let { name, data, } = data_source;
    let Key, filetype;
    try {
      JSON.parse(data);
      Key = `dataintegrations/${case_name.replace(/\//g, '_')}/${name.replace(/\//g, '_')}_${new Date().getTime()}.json`;
      filetype = 'json';
    } catch (e) {
      Key = `dataintegrations/${case_name.replace(/\//g, '_')}/${name.replace(/\//g, '_')}_${new Date().getTime()}.xml`;
      filetype = 'xml';
    }
    await helpers.uploadAWS({ Key, Body: data, });
    return await File.create({ newdoc: Object.assign({}, { name, fileurl: Key, filetype, organization, user, }), });
  }));
}

async function convertHTMLToPDF({ template, }) {
  return new Promise((resolve, reject) => {
    try {
      let pdfBuffers = [];
      const pdfStream = wkhtmltopdf(template, {
        pageSize: 'letter',
        orientation: 'portrait',
        dpi: 96,
      });
      pdfStream.on('data', chunk => {
        pdfBuffers.push(chunk);
      });
      pdfStream.on('end', async () => {
        pdfBuffers = Buffer.concat(pdfBuffers);
        return resolve(pdfBuffers);
      });
      pdfStream.on('error', (err) => {
        return reject(new Error('Could not generate PDF document'));
      });
    } catch (err) {
      return reject(new Error('Could not generate PDF document'));
    }
  });
}

async function generateEmailAndTextDocuments({ md, case_name, organization, user, }) {
  try {
    const File = periodic.datas.get('standard_file');
    let { type, communication_variables, } = md;
    let configs = communication_variables || {};
    let templatePath, template;
    if (configs && type === 'Email') {
      templatePath = path.join(__dirname, '../views/shared/templates/email.ejs');
      template = await fs.readFileAsync(templatePath, 'utf8');
      let email = ejs.render(template, Object.assign({}, configs, { sentat: new Date(), }));
      let Key = `templates/${organization}/${case_name.toLowerCase().replace(/\s+/g, '_')}/email_${md.name}_${new Date().getTime()}.pdf`;
      let pdfDoc = await convertHTMLToPDF({ template: email, });
      await helpers.uploadAWS({ Key, Body: pdfDoc, });
      return await File.create({ newdoc: Object.assign({}, { name: `${case_name.toLowerCase().replace(/\s+/g, '_')}_${md.name}_${new Date().getTime()}`, fileurl: Key, filetype: 'pdf', organization, user, }), });
    } else if (configs && type === 'Text Message') {
      templatePath = path.join(__dirname, '../views/shared/templates/textmessage.ejs');
      template = await fs.readFileAsync(templatePath, 'utf8');
      let textmessage = ejs.render(template, Object.assign({}, configs, { sentat: new Date(), }));
      let Key = `templates/${organization}/${case_name.toLowerCase().replace(/\s+/g, '_')}/textmessage_${md.name}_${new Date().getTime()}.pdf`;
      let pdfDoc = await convertHTMLToPDF({ template: textmessage, });
      await helpers.uploadAWS({ Key, Body: pdfDoc, });
      return await File.create({ newdoc: Object.assign({}, { name: `${case_name.toLowerCase().replace(/\s+/g, '_')}_${md.name}_${new Date().getTime()}`, fileurl: Key, filetype: 'pdf', organization, user, }), });
    }
  } catch (e) {
    return Promisie.reject(e);
  }
}

async function generateDocumentCreationFile({ md, case_name, organization, user, }) {
  try {
    const File = periodic.datas.get('standard_file');
    let { type, created_document, } = md;
    return await File.create({ newdoc: Object.assign({}, { name: `${case_name.toLowerCase().replace(/\s+/g, '_')}_${md.name}_${new Date().getTime()}`, fileurl: created_document.Key, filetype: 'pdf', organization, user, }), });
  } catch (e) {
    return Promisie.reject(e);
  }
}

async function runIndividualSimulation(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let user = req.user || {};
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let credit_pipeline = req.controllerData.credit_pipeline;
    if (req.controllerData.testcase) {
      let result = await credit_pipeline(Object.assign({}, req.controllerData.testcase, { strategy_status: req.controllerData.strategy_status, }));
      result = formatSimulationResult(result);
      let module_order = result.processing_detail || [];
      let compiled_order = req.controllerData.compiled_order || [];
      let emailModule = [];
      let textmessageModule = [];
      let documentcreationModule = [];
      module_order.forEach((md) => {
        if (md.type === 'Email') emailModule.push(md);
        else if (md.type === 'Text Message') textmessageModule.push(md);
        else if (md.type === 'Document Creation') documentcreationModule.push(md);
      });
      redisClient = periodic.app.locals.redisClient;
      let asyncRedisIncr = Bluebird.promisify(redisClient.incr, { context: redisClient, });
      let case_count = await asyncRedisIncr('individual_case_count');
      let case_name = req.body.case_name || `Individual Case ${case_count}`;
      let files = [];
      if (result.data_sources && result.data_sources.length) {
        files = await saveFiles({ result: result, case_name, organization, user, });
      }
      if (emailModule.length) {
        let templatefiles = await Promise.all(emailModule.map(md => generateEmailAndTextDocuments({ md, case_name, organization, user, })));
        files.push(...templatefiles);
      }
      if (textmessageModule.length) {
        let templatefiles = await Promise.all(textmessageModule.map(md => generateEmailAndTextDocuments({ md, case_name, organization, user, })));
        files.push(...templatefiles);
      }
      if (documentcreationModule.length) {
        let templatefiles = await Promise.all(documentcreationModule.map(md => generateDocumentCreationFile({ md, case_name, organization, user, })));
        files.push(...templatefiles);
      }
      let strategy_display_name = req.controllerData.compiledStrategy.display_name;
      const application_id = (req.query && req.query.application_id) ? req.query.application_id : undefined;
      const Case = periodic.datas.get('standard_case');
      let newdoc = {
        case_name,
        application: application_id,
        inputs: result.input_variables || {},
        outputs: result.output_variables || {},
        module_order,
        compiled_order,
        passed: result.passed,
        decline_reasons: result.decline_reasons || [],
        error: (result.message && typeof result.message === 'string') ? [ result.message, ] : [],
        strategy_display_name,
        strategy: req.params.id,
        organization,
        processing_type: 'individual',
        user: {
          creator: `${user.first_name} ${user.last_name}`,
          updater: `${user.first_name} ${user.last_name}`,
        },
        files: files.map(file => file._id.toString()),
      };
      let created = await Case.create({ newdoc, skip_xss: true });
      req.controllerData.created = created.toJSON ? created.toJSON() : created;
      next();
    } else {
      next();
    }
  } catch (e) {
    logger.error('runBatchSimulations error', e);
    return next(e);
  }
}

/**
 * Delete bulk testcases.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function deleteBulkTestCases(req, res, next) {
  const TestCase = periodic.datas.get('standard_testcase');
  const PopulationTags = periodic.datas.get('standard_populationtag');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  if (req.body.select_testcases === 'specific_cases') {
    if (!req.body.testcases_dropdown) return next('Please select at least one test case.');
    // update population tags
    let testcases = await TestCase.query({ query: { _id: { $in: req.body.testcases_dropdown.map(id => id.toString()), }, }, });
    testcases = testcases.toJSON ? testcases.toJSON() : testcases;
    let updatedPopTags = testcases.reduce((acc, curr) => {
      curr.population_tags.forEach(tag => {
        if (acc[ tag._id ]) {
          acc[ tag._id ].testcases = acc[ tag._id ].testcases.filter(id => id.toString() !== curr._id.toString());
        } else {
          tag.testcases = tag.testcases.filter(id => id.toString() !== curr._id.toString());
          acc[ tag._id ] = tag;
        }
      });
      return acc;
    }, {});
    try {
      await Promise.all(Object.keys(updatedPopTags).map(id => {
        if (updatedPopTags[ id ].testcases.length) {
          return PopulationTags.update({
            id,
            isPatch: false,
            depopulate: false,
            updatedoc: updatedPopTags[ id ],
          });
        } else {
          PopulationTags.delete({ deleteid: id.toString(), });
        }
      }));
    } catch (err) {
      logger.error('Unable to update population tags', err);
      return next(err);
    }
    //delete test cases
    let deleteSpecificTCs = req.body.testcases_dropdown.reduce((acc, curr) => {
      acc.push(TestCase.delete({ deleteid: curr, }));
      return acc;
    }, []);
    try {
      await Promise.all(deleteSpecificTCs);
    } catch (err) {
      logger.error('Unable to delete specific testcases', err);
      return next(err);
    }
    return next();
  } else if (req.body.select_testcases === 'population') {
    if (!req.body.population_tags) return next('Please select at least one population tag.');
    let testcasesId = await TestCase.query({ query: { population_tags: { $in: req.body.population_tags, }, organization, }, limit: 50000, });
    let tcPopulationTags = {};
    let deletePopTC = testcasesId.reduce((acc, curr) => {
      acc.push(TestCase.delete({ deleteid: curr._id.toString(), }));
      curr.population_tags.forEach(tag => tcPopulationTags[ tag._id ] = true);
      return acc;
    }, []);
    req.body.population_tags.forEach(tag => tcPopulationTags[ tag ] = false);
    let tcIds = testcasesId.map(i => i._id.toString());
    let updatedPopTags = await Object.keys(tcPopulationTags).filter(tag => tcPopulationTags[ tag ]).reduce(async (acc, curr) => {
      acc = await acc;
      let tag = await PopulationTags.load({ query: { _id: curr, }, });
      tag = tag.toJSON ? tag.toJSON() : tag;
      tag.testcases = tag.testcases.filter(i => !tcIds.includes(i.toString()));
      acc[ curr ] = tag;
      return acc;
    }, {});
    try {
      await Promise.all(deletePopTC);
      await Promise.all(Object.keys(updatedPopTags).map(id => {
        if (updatedPopTags[ id ].testcases.length) {
          return PopulationTags.update({
            id,
            isPatch: false,
            depopulate: false,
            updatedoc: updatedPopTags[ id ],
          });
        } else {
          PopulationTags.delete({ deleteid: id.toString(), });
        }
      }));
      await Promise.all(req.body.population_tags.map(id => PopulationTags.delete({ deleteid: id.toString(), })));
      return next();
    } catch (err) {
      logger.error('Unable to delete testcases by population tag', err);
      return next(err);
    }
  } else if (req.body.select_testcases === 'all_testcases') {
    try {
      await TestCase.model.deleteMany({ organization, });
      await PopulationTags.model.deleteMany({ organization, });
      return next();
    } catch (err) {
      logger.error('Unable to delete all testcases', err);
      return next(err);
    }
  } else {
    return next();
  }
}

/**
 * Checks the variable.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function checkVariable(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { variable, type, value, } = req.body;
  let boolCheck = type === 'Boolean' && [ 'true', 'false', ].indexOf(value.toLowerCase()) === -1;
  let numCheck = type === 'Number' && Number.isNaN(Number(value));
  let dateCheck = type === 'Date' && !moment(value.replace(/_/g, '/')).toISOString() && Number.isNaN(Number(value));
  if (boolCheck || numCheck || dateCheck) return next(`${variable} needs to be a ${type}.`);
  else return next();
}

/**
 * Edits variable.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function editVariable(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { variable, type, value, } = req.body;
  let inputVarMap = req.controllerData.inputVariables.reduce((reduced, input) => {
    reduced[ input.display_title ] = input.title;
    reduced[ input.title ] = input.title;
    return reduced;
  }, {});
  let newVal;
  switch (type) {
    case 'Boolean':
      newVal = value.toLowerCase() === 'true' ? true : false;
      break;
    case 'Number':
      newVal = Number(value);
      break;
    default:
      newVal = String(value);
  }
  req.params.id = req.body.id;
  req.body = Object.assign({}, req.controllerData.testcase);
  req.body._id = req.body._id.toString();
  req.body.organization = req.body.organization.toString();
  req.body.value = Object.assign({}, req.body.value, { [ inputVarMap[ variable ] ]: newVal, });
  req.controllerData.isPatch = false;
  next();
}

/**
 * Deletes variable.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function deleteVariable(req, res, next) {
  req.controllerData = req.controllerData || {};
  let displayTitleToTitle = req.controllerData.inputVariables.reduce((reduced, input) => {
    reduced[ input.display_title ] = input.title;
    return reduced;
  }, {});
  let variable = req.params.variable;
  req.body = Object.assign({}, req.controllerData.testcase);
  req.body._id = req.body._id.toString();
  req.body.organization = req.body.organization.toString();
  delete req.body.value[ displayTitleToTitle[ variable ] ];
  req.controllerData.isPatch = false;
  next();
}

/**
 * Checks limit on number of test cases.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function checkTestCasesLimit(req, res, next) {
  const TestCase = periodic.datas.get('standard_testcase');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  const existingTestCasesCount = await TestCase.model.count({ organization, });
  const maxTestCasesLimit = MAX_TESTCASES_LIMIT;
  if (req.query.bulk) {
    // bulk upload test case
    let csvCount = req.body.data.length;
    // if (csvCount + existingTestCasesCount > maxTestCasesLimit) return next('Test cases are limited to 100,000. Please delete test cases before adding additional test cases.');
  } else if (!req.query.pagination) {
    //create new test case
    // if (existingTestCasesCount + 1 > maxTestCasesLimit) return next('Test cases are limited to 100,000. Please delete test cases before adding additional test cases.');
  }
  return next();
}

/**
 * Checks existing test cases to make sure names are unique.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function checkExistingTestCases(req, res, next) {
  const TestCase = periodic.datas.get('standard_testcase');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let names = req.body.data.reduce((acc, curr) => {
    acc.push(new RegExp(curr.name, 'i'));
    return acc;
  }, []);
  const existingTestCases = await TestCase.query({ query: { name: { $in: names, }, organization, }, });
  if (existingTestCases.length) return next(`The following testcases already exist: ${existingTestCases.map(tc => tc.name).join(', ')}`);
  return next();
}

function bulkUploadTC(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let org_testcases_count = req.controllerData.testcases_count;
    if (req.headers[ 'content-length' ] > MAX_FILESIZE) {
      res.status(404).send({
        message: `Test cases are limited to ${MAX_FILESIZE / 1048576}MB. Please delete test cases from file before upload.`,
      });
    } else {
      if (req.query.bulk || req.query.upload) {
        if (!/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
          req.error = 'Please upload a CSV.';
          next();
        }
        var busboy = new Busboy({
          headers: req.headers,
        });
        let csvStream = csv({ headers: true, });
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
          let csv_data = [];
          let count = 0;
          let total = org_testcases_count;
          file.pipe(csvStream)
            .transform(function (row) {
              row.population_tags = row.population_tags ? `[${row.population_tags}]` : '';
              let tc_value = {};
              Object.keys(row).forEach(prop => {
                if (prop === 'name' || prop === 'population_tags') {
                  row[ prop ] = transformhelpers.formatCSVRowValue(row[ prop ]);
                } else {
                  tc_value[ prop ] = transformhelpers.formatCSVRowValue(row[ prop ]);
                }
              });
              return Object.assign({}, {
                name: row.name,
                population_tags: row.population_tags || [],
                value: tc_value,
              });
            })
            .on('data', async function (chunk) {
              count++;
              total++;
              // if (total > MAX_TESTCASES_LIMIT) {
              //   csvStream.pause();
              //   csvStream.end();
              //   file.pause();
              //   file.unpipe(csvStream);
              //   res.status(404).send({
              //     message: `Test cases are limited to ${MAX_TESTCASES_LIMIT}. Please delete test cases before adding additional test cases.`,
              //   });
              // } else {
              csv_data.push(chunk);
              if (count === 5000) {
                csvStream.pause();
                await bulk_helpers.handleTestCasesBatch({ rows: csv_data, organization, user, });
                csv_data = [];
                count = 0;
                csvStream.resume();
                // }
              }
            })
            .on('error', (err) => {
              csvStream.pause();
              csvStream.end();
              file.pause();
              file.unpipe(csvStream);
              req.error = err.message;
            })
            .on('end', async function () {
              csvStream.pause();
              await bulk_helpers.handleTestCasesBatch({ rows: csv_data, organization, user, });
              csv_data = [];
              count = 0;
              if (req.error) {
                res.status(404).send({
                  message: 'There was an error in the bulk add process.',
                });
              } else {
                res.status(200).send({
                  status: 200,
                  timeout: 10000,
                  type: 'success',
                  text: 'Changes saved successfully!',
                  successProps: {
                    successCallback: 'func:window.closeModalAndCreateNotification',
                  },
                  responseCallback: 'func:this.props.reduxRouter.push',
                  pathname: '/processing/test_cases',
                });
              }
            });

        });
        req.pipe(busboy);
      } else {
        next();
      }
    }
  } catch (error) {
    res.status(404).send({
      message: 'Error uploading testcases',
    });
  }
}

function getTestCasesCount(req, res, next) {
  try {
    const TestCase = periodic.datas.get('standard_testcase');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    TestCase.model.count({ organization, }, (err, count) => {
      if (err) res.status(404).send({ message: 'Could not find testcases count in the organization', });
      else {
        req.controllerData.testcases_count = count;
        next();
      }
    });
  } catch (e) {
    res.status(404).send({ message: 'Could not find testcases in the organization', });
  }
}

async function getCases(req, res, next) {
  try {
    const Case = periodic.datas.get('standard_case');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    let query = { organization, processing_type: 'individual', };
    let options = { query, limit: 10, population: 'true', };
    if (req.query && req.query.pagination) {
      options.skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 10) : 0;
      options.paginate = true;
      options.sort = { createdat: -1, };
      options.limit = 10;
      options.pagelength = 10;
      options.query = Object.assign({}, options.query, { $or: [ { case_name: new RegExp(req.query.query, 'gi'), }, ], });
      let cases = await Case.query(options);
      const numItems = await Case.model.countDocuments(options.query);
      const numPages = Math.ceil(numItems / 10);
      let rows = cases[ 0 ].documents.map(cs => cs.toJSON ? cs.toJSON() : cs);
      req.controllerData = Object.assign({}, req.controllerData, {
        rows,
        numPages,
        numItems,
      });
      return next();
    } else {
      let cases = await Case.query(options);
      cases = cases.map(cs => {
        cs = cs.toJSON ? cs.toJSON() : cs;
        return cs;
      });
      req.controllerData.cases = cases;
      return next();
    }
  } catch (e) {
    req.error = e.message;
    next();
  }
}

async function getCase(req, res, next) {
  try {
    const Case = periodic.datas.get('standard_case');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    let _id = req.params.case_id ? req.params.case_id : req.params.id;
    let query = req.user ? { _id, organization, } : { _id, };
    let result = await Case.load({ query, });
    result = result.toJSON ? result.toJSON() : result;
    req.controllerData.data = result;
    next();
  } catch (e) {
    req.error = e.message;
    next();
  }
}

async function getCaseApplication(req, res, next) {
  try {
    const Application = periodic.datas.get('standard_losapplication');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    if (req.controllerData.data && req.controllerData.data.entitytype === 'case' && req.controllerData.data.application) {
      const application = await Application.model.findOne({ _id: req.controllerData.data.application.toString(), organization, }).lean();
      req.controllerData.data.application = application;
    }
    next();
  } catch (e) {
    req.error = e.message;
    next();
  }
}

async function getCaseFromQuery(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.query && req.query.case) {
      const Case = periodic.datas.get('standard_case');
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let _id = req.query.case.toString();
      let query = req.user ? { _id, organization, } : { _id, };
      let result = await Case.model.findOne(query).lean();
      req.controllerData.case = result;
    }
    next();
  } catch (e) {
    next();
  }
}

async function getBatchSimulations(req, res, next) {
  try {
    const Simulation = periodic.datas.get('standard_simulation');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = { organization, };
    let options = { query, limit: 10, sort: { createdat: -1, }, };
    if (req.query && req.query.pagination && req.query.pagination === 'batchsimulations') {
      options.skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 10) : 0;
      options.paginate = true;
      options.limit = 10;
      options.pagelength = 10;
      options.query = Object.assign({}, options.query, { $or: [ { name: new RegExp(req.query.query, 'gi'), }, ], });
      options.population = 'true';
      options.fields = {
        'name': 1,
        'progress': 1,
        'createdat': 1,
        'user': 1,
        'status': 1,
        'strategy_name': 1,
        'organization': 1,
      };
    }
    let simulations = await Simulation.query(options);
    const numItems = await Simulation.model.countDocuments(options.query);
    const numPages = Math.ceil(numItems / 10);
    let rows = simulations[ 0 ].documents.map(simulation => simulation.toJSON ? simulation.toJSON() : simulation);
    req.controllerData = Object.assign({}, req.controllerData, {
      rows,
      numPages,
      numItems,
    });
    return next();
  } catch (e) {
    return next(e);
  }
}

async function deleteCase(req, res, next) {
  try {
    const Case = periodic.datas.get('standard_case');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let done = await Case.delete({ deleteid: req.params.id, });
    if (!done) {
      req.error = 'Error in deleting the requested case.';
    }
    next();
  } catch (e) {
    req.error = 'Error in deleting the requested case.';
    next();
  }
}

async function getBatch(req, res, next) {
  try {
    const Simulation = periodic.datas.get('standard_simulation');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    let result = await Simulation.load({ query: { _id: req.params.id, organization, }, });
    result = result.toJSON ? result.toJSON() : result;
    req.controllerData.data = result;
    next();
  } catch (e) {
    req.error = e.message;
    next();
  }
}

async function getFile(req, res, next) {
  const File = periodic.datas.get('standard_file');
  req.controllerData = req.controllerData || {};
  let file = await File.load({ query: { _id: req.params.id, }, });
  file = file.toJSON ? file.toJSON() : file;
  req.controllerData.data = file;
  next();
}

async function getFileFromAWS(req, res) {
  try {
    let fileurl = req.controllerData.data.fileurl;
    let filedata = await helpers.downloadAWS({ fileurl, });
    let mimetype = mime.lookup(fileurl) || 'application/json';
    res.setHeader('content-type', mimetype);
    res.setHeader('Content-disposition', 'attachment; filename=' + `${req.controllerData.data.name}.${mime.extension(mimetype)}`);
    res.attachment(`${req.controllerData.data.name}.${mime.extension(mimetype)}`);
    res.end(filedata);
  } catch (e) {
    res.status(500).send({ message: 'Could not download file.', });
  }
}

async function getOCRDocuments(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    const OCRDocument = periodic.datas.get('standard_ocrdocument');
    let docs = await OCRDocument.query({ query: { organization, }, }) || [];
    docs = docs.map(doc => doc.toJSON ? doc.toJSON() : doc);
    req.controllerData.data = docs;
    next();
  } catch (e) {
    res.status(500).send({ message: 'Could not find ocr documents.', });
  }
}

async function getOCRDocument(req, res, next) {
  try {
    const OCRDocument = periodic.datas.get('standard_ocrdocument');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    let _id = req.body.ocr_id
      ? req.body.ocr_id
      : (req.controllerData.ocr_id)
        ? req.controllerData.ocr_id
        : req.params.id;

    let query = (req.user) ? { organization, _id, } : { _id, };
    let template = await OCRDocument.load({ query, });
    template = template.toJSON ? template.toJSON() : template;
    req.controllerData.data = template;
    next();
  } catch (e) {
    req.error = e.message;
    res.status(500).send({ message: 'Could not fetch OCR templates.', });
  }
}

async function retrieveOCRResults(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.local_image_files && req.controllerData.data) {
      let client = periodic.googlevision;
      let fileContents = await Promise.all(req.controllerData.local_image_files.map(async (image_locations_arr) => {
        return image_locations_arr.map(image_location => {
          return fs.readFileSync(image_location);
        });
      }));

      let ocr_results, ocrRequest;
      req.controllerData.ocr_results = await Promise.all(fileContents.map(async (image_group) => {
        ocrRequest = (image_group.length === 1)
          ? {
            image: {
              content: image_group[ 0 ],
            },
            feature: {
              type: 'DOCUMENT_TEXT_DETECTION',
            },
          }
          : {
            requests: image_group.map(content => {
              return {
                image: { content: content.toString('base64'), },
                features: [ { type: 'DOCUMENT_TEXT_DETECTION', }, ],
              };
            }),
          };

        if (image_group.length > 1) {
          let vision_results = await client.batchAnnotateImages(ocrRequest);
          ocr_results = [ ...vision_results[ 0 ].responses, ];
        } else {
          ocr_results = await client.textDetection(ocrRequest);
        }
        return ocr_results;
      }));
      next();
    }
  } catch (e) {
    req.error = e.message;
    res.status(500).send({ message: 'Could not extract OCR templates.', });
  }
}

function __cleanTextAnnotations(textAnnotations) {
  return textAnnotations.reduce((cleaned, annotation, i) => {
    if (annotation.boundingPoly && i !== 0) {
      let x = annotation.boundingPoly.vertices[ 0 ].x;
      let y = annotation.boundingPoly.vertices[ 0 ].y;
      let w = annotation.boundingPoly.vertices[ 1 ].x - annotation.boundingPoly.vertices[ 0 ].x;
      let h = annotation.boundingPoly.vertices[ 2 ].y - annotation.boundingPoly.vertices[ 0 ].y;
      cleaned.push({
        x,
        y,
        w,
        h,
        data: {
          blockNum: i,
          description: annotation.description, x, y, w, h,
        },
      })
      return cleaned;
    } else return cleaned;
  }, []);
}

async function cleanOCRResults(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.ocr_results && req.controllerData.data) {
      // each of these ocr_results is one to one with a PDF --> it is an array that contains ocr_results of all images from a PDF
      let rtree_matrix = [];
      // generate rtrees for every jpeg
      req.controllerData.ocr_results.forEach((pdf_ocrresult_arr, i) => {
        rtree_matrix[ i ] = rtree_matrix[ i ] || [];
        pdf_ocrresult_arr.forEach(single_page_result => {
          let rTree = RTree();
          let textAnnotations = (single_page_result.textAnnotations)
            ? single_page_result.textAnnotations
            : (single_page_result[ 0 ] && single_page_result[ 0 ].textAnnotations)
              ? single_page_result[ 0 ].textAnnotations
              : [];
          let cleaned_ocr = __cleanTextAnnotations(textAnnotations);
          cleaned_ocr.forEach(node => {
            let { x, y, w, h, data, } = node;
            rTree.insert({ x, y, w, h, }, data);
          });
          rtree_matrix[ i ].push(rTree);
        });
      });
      req.controllerData.rtree_matrix = rtree_matrix;
      next();
    }
  } catch (e) {
    req.error = e.message;
    res.status(500).send({ message: 'Could not extract OCR templates.', });
  }
}

async function extractOCRResults(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.rtree_matrix && req.controllerData.data) {
      let inputVariablesMap = req.controllerData.inputVariablesMap;
      let template = req.controllerData.data.inputs;
      let compiledInputVariables = (req.controllerData.compiledStrategy && req.controllerData.compiledStrategy.input_variables) ? req.controllerData.compiledStrategy.input_variables : [];
      let extractedInputs = [];
      let configMap = {};
      let templateVariables = [];
      let rTreeConfig = req.controllerData.rtree_matrix;
      if (compiledInputVariables.length) {
        compiledInputVariables.forEach(input => templateVariables.push(input.title));
        template.forEach(config => configMap[ inputVariablesMap[ config.input_variable ] ] = '');
      } else {
        template.forEach(config => {
          if (inputVariablesMap && config.input_variable && inputVariablesMap[ config.input_variable ]) templateVariables.push(inputVariablesMap[ config.input_variable ]);
        });
      }

      req.controllerData.rtree_matrix.forEach((rtree_config_set, i) => {
        let extracted = {};
        // rtree_config_set is an array that contains an rtree for every jpg image generated from the uploaded PDF
        let found, rtree, phrase;
        template.forEach(template_config => {
          let { x, y, w, h, page, input_variable, } = template_config;
          rtree = (rTreeConfig && rTreeConfig[ i ]) ? rTreeConfig[ i ][ page ] : rTreeConfig[ i ][ 0 ];
          found = rtree.search({ x, y, w, h }, true);
          found.sort((a, b) => a.leaf.blockNum - b.leaf.blockNum);
          phrase = found.map(fnd => fnd.leaf.description).join(' ');
          if (inputVariablesMap) extracted[ inputVariablesMap[ input_variable ] ] = phrase || '';
          else extracted[ input_variable ] = phrase || '';
        })
        extracted = Object.assign({}, configMap, extracted);
        extractedInputs.push(extracted);
      });
      req.controllerData = Object.assign({}, req.controllerData, { extractedInputs, templateVariables, });
      next();
    }
  } catch (e) {
    req.error = e.message;
    res.status(500).send({ message: 'Could not fetch OCR templates.', });
  }
}

async function getUploadedOCRDocuments(req, res, next) {
  try {
    if (req.headers && req.headers[ 'content-type' ] && req.headers[ 'content-type' ].indexOf('multipart/form-data') === -1) return next('Please upload file');
    const busboy = new Busboy({ headers: req.headers, });
    req.controllerData = req.controllerData || {};
    req.controllerData.original_filenames = [];
    req.controllerData.files = [];
    req.controllerData.mimetype;
    busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      if (fieldname === 'ocr_id') {
        req.controllerData.ocr_id = val;
      }
    });

    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
      let buffers = [];
      let filesize = 0;
      req.controllerData.original_filenames.push(filename);
      file.on('data', chunk => {
        filesize += Buffer.byteLength(chunk);
        buffers.push(chunk);
      });
      file.on('end', () => {
        req.controllerData.mimetype = mimetype;
        req.controllerData.files.push(Buffer.concat(buffers));
      });
      file.on('error', (e) => {
        logger.error('reading file error', e);
        return next(e);
      });
    });

    busboy.on('finish', function () {
      next();
    });
    req.pipe(busboy);

  } catch (e) {
    res.status(500).send({ message: 'Error uploading OCR documents', });
  }
}

async function downloadOCRInputCSV(req, res, next) {
  try {
    if (req.controllerData.extractedInputs && req.controllerData.extractedInputs.length && req.controllerData.ocr_id) {
      let asyncJson2Csv = Bluebird.promisify(converter.json2csv, { context: converter, });
      // const exportName = 'testing.csv';
      const csv_options = {
        emptyFieldValue: '',
        keys: req.controllerData.templateVariables,
        delimiter: {
          array: ';', // Semicolon array value delimiter
        },
        checkSchemaDifferences: false,
      };
      let csvdata = await asyncJson2Csv(req.controllerData.extractedInputs, csv_options);
      req.controllerData.download_file = csvdata;
      next();
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not download OCR downloads.', });
  }
}

function redirectIndividualRunPage(req, res, next) {
  try {
    let pathname = url.parse(req.headers.referer).pathname.split('/');
    let strategy_id = pathname.slice(-1)[ 0 ];
    let extractedInputs = req.controllerData.extractedInputs[ 0 ] || {};
    let input_qs = qs.stringify(extractedInputs, { arrayFormat: 'indices', });
    res.status(200).send({
      status: 200,
      timeout: 10000,
      type: 'success',
      text: 'Changes saved successfully!',
      responseCallback: 'func:this.props.reduxRouter.push',
      pathname: `/decision/processing/individual/run/${strategy_id}?${input_qs}`,
    });
  } catch (e) {
    res.status(500).send({ message: 'Could not generate OCR inputs.', });
  }
}

function redirectSuccessfulIndividualSimulation(req, res) {
  return res.status(200).send({
    status: 200,
    timeout: 10000,
    type: 'success',
    text: 'Changes saved successfully!',
    responseCallback: 'func:this.props.reduxRouter.push',
    pathname: `/decision/processing/individual/results/${req.controllerData.created._id}`,
  });
}

async function fetchAllDocumentTemplatesFromAWS(req, res, next) {
  try {
    if (req.controllerData.compiledStrategy && req.controllerData.compiledStrategy.templates && req.controllerData.compiledStrategy.templates.length) {
      await helpers.checkDocumentTemplateFromLocalDirectory({ template: req.controllerData.compiledStrategy.templates, });
    } else if (req.controllerData.compiledstrategies) {
      await Promise.all(req.controllerData.compiledstrategies.map(compiled => {
        if (compiled.templates && compiled.templates.length) {
          return helpers.checkDocumentTemplateFromLocalDirectory({ template: compiled.templates, });
        } else {
          return;
        }
      }));
    }
    next();
  } catch (e) {
    res.status(500).send({ message: 'Could not find the template for document creation.', });
  }
}

async function createLocalPDF(req, res, next) {
  try {
    if (req.controllerData.files) {
      let local_filenames = [];
      let local_filename;
      await Promise.all(req.controllerData.files.map(async (filebuffer, i) => {
        local_filename = `temp_pdf_file_${new Date().getTime()}_${i}.pdf`;
        local_filenames.push(local_filename);
        await fs.writeFile(path.join(process.cwd(), `content/files/${local_filename}`), filebuffer);
      }));

      req.controllerData.local_filenames = local_filenames;
      next();
    } else {
      res.status(500).send({ message: 'Could not retreive uploaded file.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not create local PDF file.', });
  }
}

async function generateLocalImageFiles(req, res, next) {
  try {
    if (req.controllerData.local_filenames) {
      let PDFImage = require('pdf-image').PDFImage;
      let pdfimage;
      let allFileImagePaths = await Promise.all(req.controllerData.local_filenames.map(async (local_filename, i) => {
        pdfimage = new PDFImage(path.join(process.cwd(), `content/files/${local_filename}`), {
          convertExtension: 'png', convertOptions: {
            '-colorspace': '"RGB"',
            '-interlace': '"none"',
            '-density': '300',
            '-quality': '100',
            '-background': '"#FFFFFF"',
            '-flatten': ''
          }
        });
        let singlefileImagePaths = await pdfimage.convertFile();
        return singlefileImagePaths;
      }));
      req.controllerData.local_image_files = allFileImagePaths;
      next();
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not generate local image files.', });
  }
}

async function clearTempPDFandImageFiles(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let local_filenames = req.controllerData.local_filenames.map(pdf_name => path.join(process.cwd(), `content/files/${pdf_name}`));
    let local_image_files = req.controllerData.local_image_files.reduce((aggregate, image_names) => {
      aggregate.push(...image_names);
      return aggregate;
    }, []);
    await Promise.all([ ...local_filenames, ...local_image_files, ].map(async (filename) => {
      await fs.remove(filename);
    }));
    next();
  } catch (e) {
    res.status(500).send({ message: 'Error in clearTempPDFandImageFiles.', });
  }
}

/** 
 * Retrieves decision cases to be displayed on individual results index page
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function getIndividualDecisionCases(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const DecisionCase = periodic.datas.get('standard_case');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 10) : 0;
    let queryOptions = { query: { organization, processing_type: 'individual', }, sort: { createdat: -1, }, population: 'true', };
    if (req.query && req.query.query) {
      queryOptions.query = Object.assign({}, queryOptions.query, { $or: [ { case_name: new RegExp(req.query.query, 'gi'), }, { strategy_display_name: new RegExp(req.query.query, 'gi'), }, { case_type: new RegExp(req.query.query, 'gi'), } ], });
    }
    const decisioncases = await DecisionCase.model.find(queryOptions.query).collation({ locale: 'en' }).sort('-createdat').skip(skip).limit(10).lean();
    const numItems = await DecisionCase.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 10);
    for (let i = 0; i < decisioncases.length; i++) {
      const decision_case = decisioncases[ i ];
      decision_case.createdat = (decision_case.createdat) ? `${transformhelpers.formatDate(decision_case.createdat, user.time_zone)}` : '';
      decision_case.case_name = decision_case.case_name;
      decision_case.strategy_display_name = decision_case.strategy_display_name;
      decisioncases[ i ] = decision_case;
    }
    if (req.query.pagination === 'decisioncases') {
      req.controllerData = Object.assign({}, req.controllerData, {
        rows: decisioncases,
        numPages,
        numItems,
      });
    }
    next();
  } catch (e) {
    logger.warn('Error finding Decision Cases.');
    res.status(500).send({ message: e.message, });
  }
}

/** 
 * Retrieves decision cases to be displayed on batch results index page
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function getDecisionBatchSimulations(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Simulation = periodic.datas.get('standard_simulation');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 10) : 0;
    let queryOptions = { query: { organization, }, sort: { createdat: -1 }, };
    Simulation.query(queryOptions)
      .then(simulation => {
        if (simulation && simulation.length) {
          simulation = simulation.map(simulation => {
            simulation = simulation.toJSON ? simulation.toJSON() : simulation;
            simulation.createdat = (simulation.createdat) ? `${transformhelpers.formatDate(simulation.createdat, user.time_zone)}` : '';
            simulation.progressBar = {
              progress: simulation.progress,
              state: (simulation.status === 'Error' || simulation.status === 'failed')
                ? 'error'
                : (simulation.status === 'complete' || simulation.status === 'Complete' || simulation.progress === 100)
                  ? 'success'
                  : null,
            };
            return simulation;
          });
          req.controllerData.simulation = simulation;
          if (req.query.pagination === 'decisionbatches') {
            req.controllerData = Object.assign({}, req.controllerData, {
              rows: simulation.slice(skip),
              numPages: Math.ceil(simulation.length / 10),
              numItems: simulation.length,
            });
          }
        }
        return next();
      })
      .catch(e => {
        logger.error('Unable to query standard_simulation', e);
        return next(e);
      });
  } catch (e) {
    logger.warn('Error finding Decision Batches.');
  }
}

function coerceDataType(val, dt) {
  try {
    if (dt === 'Boolean') {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        val = val.toLowerCase();
        if (val === 'true') return true;
        else if (val === 'false') return false;
        else return null;
      } else {
        return null;
      }
    } else if (dt === 'String') {
      return (val.length) ? `${val}` : null;
    } else if (dt === 'Number') {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        if (!val.length) return null;
        val = numeral(val)._value;
        if (!isNaN(val)) return val;
        else return null;
      } else {
        return null;
      }
    } else if (dt === 'Date') {
      return (String(val).length) ? val : null;
    }
  } catch (e) {
    return e;
  }
}

async function coerceTestCases(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let { testcases, variableTitleMap, } = req.controllerData;
    testcases = testcases.map(tc => {
      let values = Object.keys(tc.value);
      let updatedVal = {};
      values.forEach(val => {
        let systemVariable = variableTitleMap[ val ];
        if (systemVariable) {
          let { data_type, } = systemVariable;
          let testcaseValue = tc.value[ val ];
          updatedVal[ val ] = coerceDataType(testcaseValue, data_type);
        }
      });
      tc.value = updatedVal;
      return tc;
    });
    return next();
  } catch (e) {
    return e;
  }
}

module.exports = {
  clearTempPDFandImageFiles,
  createLocalPDF,
  generateLocalImageFiles,
  getFile,
  getOCRDocuments,
  getFileFromAWS,
  deleteCase,
  getCases,
  getCase,
  fetchAllDocumentTemplatesFromAWS,
  getCompiledStrategies,
  getCompiledStrategy,
  getStrategies,
  getTestCasesData,
  createNewTestCase,
  createNewTestCases,
  deleteTestCase,
  deleteSimulation,
  updateTestCase,
  getSingleTestCaseData,
  handleControllerDataResponse,
  stagePromiseQueue,
  registerSimulation,
  runBatchSimulations,
  runIndividualSimulation,
  stageStrategyForSimulation,
  directToOutput,
  pullPopulationTags,
  returnAllSimulations,
  checkActiveSimulation,
  getSimulationData,
  getSimulationDatas,
  downloadCSV,
  getCompiledStrategyDropdown,
  getTestCaseVariables,
  checkTestCaseVariables,
  createPopulationTag,
  createPopulationTags,
  getPopulationTag,
  getTestCaseTemplate,
  fetchSimulationsData,
  generateResultDropdown,
  checkSimulation,
  getSimulations,
  deleteBulkTestCases,
  editVariable,
  deleteVariable,
  checkVariable,
  checkTestCasesLimit,
  checkExistingTestCases,
  bulkUploadTC,
  getTestCasesCount,
  getBatchSimulations,
  deleteBatchSimulation,
  generateDocumentCreationFile,
  getBatch,
  generateDownloadData,
  generateDownloadCaseData,
  getOCRDocument,
  // parseOCRDocument,
  retrieveOCRResults,
  cleanOCRResults,
  extractOCRResults,
  createZipFile,
  sortBatchResults,
  addCSVtoZipFile,
  downloadZipFile,
  getCasesFromSimulation,
  getUploadedOCRDocuments,
  downloadOCRInputCSV,
  redirectIndividualRunPage,
  redirectSuccessfulIndividualSimulation,
  getIndividualDecisionCases,
  getDecisionBatchSimulations,
  coerceTestCases,
  getCaseFromQuery,
  getCaseApplication,
};