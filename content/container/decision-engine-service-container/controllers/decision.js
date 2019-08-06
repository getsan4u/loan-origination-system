'use strict';

const url = require('url');
const periodic = require('periodicjs');
const pluralize = require('pluralize');
const capitalize = require('capitalize');
const moment = require('moment');
const utilities = require('../utilities');
const DECISION_CONSTANTS = require('../utilities/views/decision/constants');
const util_helpers = require('../utilities/helpers');
const Busboy = require('busboy');
const CHILD_MAP = require('../utilities/constants').CHILD_MAP;
const controller_helper = require('../utilities/controllers/helper.js');
const { getRuleFromCache, getVariableFromCache, setRuleOnRedis } = require('../utilities/controllers/integration');
const transformhelpers = require('../utilities/transformhelpers');
const logger = periodic.logger;
const csv = require('fast-csv');
const XLSX = require('xlsx');
const util = require('util');
const flatten = require('flat');
const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const runRuleVariableUpdateCron = require('../crons/update_rules_variables.cron')(periodic);

/**
 * Generic find override function that queries index of all entities in a collection (variables, strategies)
 * 
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
async function find(req, res, next) {
  req.controllerData = req.controllerData || {};
  let pathname = url.parse(req.headers.referer).pathname.split('/');
  let { collection, } = controller_helper.findCollectionNameFromReq({ req, });
  let model = `standard_${pluralize(collection)}`;
  if (pathname.indexOf('decision') > -1) {
    let modelData = req.controllerData[ model ];
    let rows = modelData[ model ];
    rows = rows.map(row => {
      row = row.toJSON ? row.toJSON() : row;
      if (collection === 'rulesets' || collection === 'rules') row.formatted_type = capitalize.words(row.type.replace('_', ' '));
      if (collection === 'strategies') row.status = controller_helper.handleStatusDisplay({ status: row.status, locked: row.locked, strategyDisplay: true, });
      row.formatted_createdat = `${transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone)} by ${row.user.creator}`;
      row.formatted_updatedat = `${transformhelpers.formatDateNoTime(row.updatedat, req.user.time_zone)} by ${row.user.updater}`;
      return row;
    });
    const Model = periodic.datas.get(`standard_${pluralize.singular(collection)}`);
    const numItems = await Model.model.countDocuments(req.controllerData.model_query || {});
    const numPages = Math.ceil(numItems / 10);
    req.controllerData = Object.assign({}, req.controllerData, { rows, numItems, numPages, });
    res.status(200).send(req.controllerData);
  } else {
    res.status(500).send({ message: `ERROR in finding ${collection}`, });
  }
}

/**
 * Generic create override function that creates a single entity in a collection (variables, strategies) with versioning
 * 
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
function create(req, res, next) {
  let { collection, core, id, tabname, parsedUrl, } = controller_helper.findCollectionNameFromReq({ req, });
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let pathname = url.parse(req.headers.referer).pathname.split('/');
    let { collection, core, id, tabname, parsedUrl, } = controller_helper.findCollectionNameFromReq({ req, });
    collection = (parsedUrl[ 0 ] === 'standard_variables') ? 'variables' : collection;
    let model = (parsedUrl[ 0 ]) ? pluralize.singular(parsedUrl[ 0 ]) : `standard_${pluralize.singular(collection)}`;
    let Model = periodic.datas.get(model);
    // conditional for new represents creating a new version. else block is a normal modal create
    if (req.query && req.query.type === 'version') {
      let Rule = periodic.datas.get('standard_rule');
      let docId = (req.body.id) ? req.body._id : id;
      let newStrategyVersionDoc;
      let oldDoc;
      let createOptions;
      Model.load({ query: { _id: docId, organization, }, })
        .then(doc => {
          oldDoc = (doc.toJSON) ? doc.toJSON() : doc;
          // doc = controller_helper.clearDependencies({ result: doc, collection })
          // return controller_helper.createNewStrategyVersionModules({ modules: doc.modules, module_run_order: doc.module_run_order });
          return Model.load({ query: { title: oldDoc.title, latest_version: true, organization, }, });
        })
        .then(latest_doc => {
          latest_doc = (latest_doc.toJSON) ? latest_doc.toJSON() : latest_doc;
          latest_doc.version++;
          let version = latest_doc.version;
          let newStrategyModules = Object.keys(oldDoc.modules).reduce((moduleMap, key) => {
            moduleMap[ key ] = oldDoc.modules[ key ].map(module => {
              return Object.assign({}, module, {
                ruleset: [],
                conditions: [],
              })
            })
            return moduleMap;
          }, {});
          createOptions = Object.assign({}, oldDoc, {
            user: { creator: `${req.user.first_name} ${req.user.last_name}`, updater: `${req.user.first_name} ${req.user.last_name}`, },
            display_name: `${oldDoc.display_title} (v${version})`,
            name: `${oldDoc.title.toLowerCase()}_v${version}`,
            locked: false,
            active: false,
            latest_version: true,
            status: null,
            version: version,
            modules: newStrategyModules,
          });
          delete createOptions._id;
          delete createOptions.updatedat;
          delete createOptions.createdat;
          return Model.create(createOptions);
        })
        .then(newStrategy => {
          newStrategyVersionDoc = newStrategy.toJSON ? newStrategy.toJSON() : newStrategy;
          return controller_helper.createNewStrategyVersionModules({ modules: oldDoc.modules, module_run_order: oldDoc.module_run_order, strategyid: newStrategy._id, organization });
        })
        .then(result => {
          let [ updatedModule, strategyVariables, mlmodels, dataintegrations, ] = result;
          newStrategyVersionDoc.modules = updatedModule;
          newStrategyVersionDoc._id = newStrategyVersionDoc._id.toString();
          newStrategyVersionDoc.organization = newStrategyVersionDoc.organization.toString();
          let redirect_path = `/decision/${collection}/${newStrategyVersionDoc._id}/overview`;
          if (typeof CHILD_MAP[ collection ] === 'string') {
            let childCollection = CHILD_MAP[ collection ];
            let childUpdate = (collection === 'rules') ? true : false;
            let variableOptions = { childModel: `standard_${pluralize.singular(childCollection)}`, childId: strategyVariables, parentId: newStrategyVersionDoc._id.toString(), collection, req: {}, childUpdate, };
            let mlmodelOptions = { childModel: 'standard_mlmodel', childId: mlmodels, parentId: newStrategyVersionDoc._id.toString(), collection, req: {}, childUpdate, };
            Promise.all([
              Model.update({ id: newStrategyVersionDoc._id.toString(), updatedoc: newStrategyVersionDoc, }),
              controller_helper.addParentToChild(variableOptions),
              controller_helper.addParentToChild(mlmodelOptions),
              controller_helper.handlePreviousLatestVersion({ title: newStrategyVersionDoc.title, collection, organization: newStrategyVersionDoc.organization.toString() }), ])
              .then(result => {
                return handlePageRedirect({ res, redirect_path, });
              })
              .catch(e => {
                Rule.model.deleteMany({ strategy: newStrategyVersionDoc._id.toString() })
                  .then(() => {
                    return Model.model.deleteOne({ _id: newStrategyVersionDoc._id.toString(), })
                  })
                  .then(() => {
                    return handlePageError({ res, message: `Error updating dependencies on child ${pluralize.singular(collection)}`, });
                  })
                  .catch(() => {
                    logger.warn('Error deleting failed rules and strategy during create new version: ', e);
                    return handlePageError({ res, message: `Error updating dependencies on child ${pluralize.singular(collection)}`, });
                  })
              });
          } else {
            controller_helper.handlePreviousLatestVersion({ title: result.title, collection, organization: newStrategyVersionDoc.organization.toString() })
              .then(handlePageRedirect({ res, redirect_path, }));
          }
        })
        .catch(e => {
          Rule.model.deleteMany({ strategy: newStrategyVersionDoc._id.toString() })
            .then(() => {
              return Model.model.deleteOne({ _id: newStrategyVersionDoc._id.toString(), })
            })
            .then(() => {
              return handlePageError({ res, message: `Error creating new version of ${pluralize.singular(collection)}`, });
            })
            .catch(() => {
              logger.warn('Error deleting failed rules and strategy during create new version: ', e);
              return handlePageError({ res, message: `Error creating new version of ${pluralize.singular(collection)}`, });
            })
        });
    } else {
      req.body.title = req.body.variable_system_name || req.body.name.toLowerCase().replace(/\s+/g, '_');
      req.body = Object.assign({}, req.body, {
        name: `${req.body.title}_v1`,
        createdat: new Date(),
        user: { creator: `${req.user.first_name} ${req.user.last_name}`, updater: `${req.user.first_name} ${req.user.last_name}`, },
        latest_version: true,
        display_name: `${req.body.name} (v1)`,
        display_title: `${req.body.name}`,
        organization,
      });
      let createOptions = req.body;
      Model.create(createOptions)
        .then(result => {
          if (pathname.slice(-2)[ 0 ] === collection && (pathname.slice(-2)[ 1 ] === 'all' || pathname.slice(-2)[ 1 ] === 'latest')) {
            let redirect_path = (collection === 'rules')
              ? `/decision/${collection}/${result.type}/${result._id}/detail`
              : (collection === 'strategies')
                ? `/decision/${collection}/${result._id}/overview`
                : `/decision/${collection}/${result._id}/detail`;
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
          } else {
            res.status(200).send({
              status: 200,
              timeout: 10000,
              type: 'success',
              text: 'Changes saved successfully!',
              successProps: {
                successCallback: 'func:window.closeModalAndCreateNotification',
              },
              responseCallback: 'func:this.props.refresh',
            });
          }
        })
        .catch(e => {
          let message = (e.code === 11000) ? `There is already a ${capitalize.words(pluralize.singular(collection))} with that name. Please use a unique name for new ${capitalize.words(collection)}.` : `Error creating ${pluralize.singular(collection)}`;
          handlePageError({ res, message, });
        });
    }
  } catch (e) {
    handlePageError({ res, message: `Error creating ${pluralize.singular(collection)}`, });
  }
}

/**
 * Generic update override function that updates a single entity in a collection (variables) while handling changelog creation and dependency control
 * 
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
function update(req, res, next) {
  let { collection, core, id, tabname, parsedUrl, } = controller_helper.findCollectionNameFromReq({ req, });
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let pathname = url.parse(req.headers.referer).pathname.split('/');
    collection = req.query.collection || collection;
    let model = `standard_${pluralize.singular(collection)}`;
    let Model = periodic.datas.get(model);
    let ChangeModel = periodic.datas.get('standard_change');
    let Strategy = periodic.datas.get('standard_strategy');
    Model.load({ query: { _id: req.body._id, organization, }, })
      .then(async result => {
        result = result.toJSON ? result.toJSON() : result;
        let strategy_title = (result.strategy && result.strategy.title) ? result.strategy.title : '';
        let strategy_display_title = (result.strategy && result.strategy.display_title) ?
          result.strategy.display_title : '';
        let strategy_display_name = (result.strategy && result.strategy.display_name) ?
          result.strategy.display_name : '';
        result = controller_helper.depopulate(result, [ 'multiple_rules', ]);
        result.organization = result.organization.toString();
        if (result.multiple_rules && result.multiple_rules.length) result.multiple_rules = result.multiple_rules.map(rule => {
          if (DECISION_CONSTANTS.SINGLE_RULE_MODULES[ result.type ]) {
            return Object.assign({}, rule);
          } else {
            return Object.assign({}, rule, { state_property_attribute: rule.state_property_attribute._id, });
          }
        });
        req.body = controller_helper.depopulate(req.body);
        let newVariablesArr;
        let oldVariablesArr;
        let deleteOptions = { earlyReturn: true, };
        let addOptions = { earlyReturn: true, };
        if (collection === 'rules') {
          newVariablesArr = controller_helper.compileRuleVariableIds({ result: req.body, });
          oldVariablesArr = controller_helper.compileRuleVariableIds({ result, });
          deleteOptions = {
            diff: { deletedIds: oldVariablesArr, },
            req,
            childModel: 'standard_variable',
            collection: 'strategies',
            parentId: id,
          };
          addOptions = {
            req,
            childId: newVariablesArr,
            childModel: 'standard_variable',
            collection: 'strategies',
            parentId: id,
          };
        }
        let changeOptions = controller_helper.createChangeOptions({ result, collection, req, strategy_title, strategy_display_title, strategy_display_name, strategyid: id, organization: (organization) ? organization.toString() : 'organization', });
        result.user = Object.assign({}, result.user, { updater: `${req.user.first_name} ${req.user.last_name}`, });
        let updatedoc = Object.assign({}, result, req.body, { updatedat: new Date(), });
        await controller_helper.deleteParentFromChild(deleteOptions);
        await controller_helper.addParentToChild(addOptions);
        return Promise.all([
          ChangeModel.create(changeOptions),
          Model.update({
            id: req.body._id,
            updatedoc,
            skip_xss: true,
          }),
          Strategy.update({
            isPatch: true,
            id: id,
            updatedoc: {
              updatedat: new Date(),
              'user.updater': `${req.user.first_name} ${req.user.last_name}`,
            },
          }),
        ])
          .then(async () => {
            if (collection === 'rules') {
              await controller_helper.modelSave({ Model, id: req.body._id, updatedoc, req, });
              const rule = await Model.model.findOne({ _id: req.body._id }).lean();
              return await setRuleOnRedis(rule, organization);
            } else {
              return;
            }
          })
          .then(() => res.status(200).send({}))
          .catch((e) => {
            logger.warn(e);
            return handlePageError({ res, message: `Error updating ${pluralize.singular(collection)}`, });
          });
      })
      .catch(e => {
        return res.status(404).send({
          status: 404,
          result: 'error',
          data: {
            type: 'error',
            timeout: 10000,
            error: `Error loading ${pluralize.singular(collection)} model for update`,
          },
        });
      });
  } catch (e) {
    return res.status(404).send({
      status: 404,
      result: 'error',
      data: {
        type: 'error',
        timeout: 10000,
        error: `Error updating ${pluralize.singular(collection)}`,
      },
    });
  }
}

function show(req, res, next) {
  res.status(200).send(req.controllerData);
}

/**
 * This function sends a generic response after receiving data
 * @param {object} req express request object
 * @param {object} res express response object
 * @returns {object} a response object that contains the status message and data
 */
const handleControllerDataResponse = function (req, res) {
  delete req.controllerData.authorization_header;
  res.status(200).send((req.controllerData.useSuccessWrapper) ? {
    result: 'success',
    data: req.controllerData,
  } : req.controllerData);
};

/**
 * This function sends a generic redirect after receiving data
 * @param {object} req express request object
 * @param {object} res express response object
 * @returns {object} response object
 */
const handlePageRedirect = function (options) {
  let { res, redirect_path, } = options;
  res.status(200).send({
    status: 200,
    timeout: 10000,
    type: 'success',
    successCallback: 'func:this.props.reduxRouter.push',
    pathname: redirect_path,
  });
};

/**
 * This function sends a generic page error after receiving data
 * @param {object} req express request object
 * @param {object} res express response object
 * @returns {object} a response object that contains the status message and data
 */
const handlePageError = function (options) {
  let { res, message, } = options;
  res.status(404).send({
    status: 404,
    result: 'error',
    data: {
      type: 'error',
      timeout: 10000,
      error: message,
    },
  });
};

/**
 * This function formats the dashboard live strategies table data
 * @param {object} req express request object
 * @param {object} res express response object
 * @returns {object} a response object that contains the status message and data
 */
function fetchDashboardStrategyData(req, res) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const Strategy = periodic.datas.get('standard_strategy');
    let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 5) : 0;
    Strategy.query({
      paginate: true, query: { status: { $in: [ 'active', 'test', ], }, organization, }, sort: { createdat: -1, },
      pagelength: 5,
      skip,
    })
      .then(result => {
        let strategies = result[ '0' ].documents;
        strategies = strategies.map(strategy => {
          strategy = strategy.toJSON();
          strategy.updatedat = moment(strategy.updatedat).format('M/DD/YYYY');
          let lockedStatus = (strategy.locked) ? 'Locked' : 'Not Locked';
          strategy.status = `${capitalize(strategy.status)} | ${lockedStatus}`;
          return strategy;
        });
        req.controllerData = req.controllerData || {};
        req.controllerData = Object.assign({}, req.controllerData, {
          numItems: result.collection_count,
          numPages: result.collection_pages,
          rows: strategies,
        });
        return res.status(200).send(req.controllerData);
      })
      .catch(e => {
        res.status(404).send({
          status: 404,
          result: 'error',
          data: {
            type: 'error',
            timeout: 10000,
            error: e.message,
          },
        });

      });
  } catch (e) {
    res.status(404).send({
      status: 404,
      result: 'error',
      data: {
        type: 'error',
        timeout: 10000,
        error: e.message,
      },
    });
  }
}

/**
 * This function formats the dashboard recent changes table data
 * @param {object} req express request object
 * @param {object} res express response object
 * @returns {object} a response object that contains the status message and data
 */

function fetchDashboardChangeData(req, res) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 5) : 0;
    const Change = periodic.datas.get('standard_change');
    let dateOffset = (24 * 60 * 60 * 1000) * 30;
    let lastThirtyDays = new Date();
    lastThirtyDays.setTime(lastThirtyDays.getTime() - dateOffset);
    Change.query({
      paginate: true, query: {
        entity: 'strategies',
        organization,
        createdat: {
          $gte: lastThirtyDays,
        },
      }, sort: { createdat: -1, },
      pagelength: 5,
      skip,
      limit: 20,
    })
      .then(result => {
        let changes = result[ '0' ].documents;
        changes = changes.map(change => {
          change = change.toJSON();
          change.updatedat = moment(change.updatedat).format('M/DD/YYYY');
          change.type = (change && change.change_type) ? capitalize.words(change.change_type.replace('_', ' ')) : 'Strategies';
          change.name = change.entity_display_name || `${change.before ? change.before.title : change.name}_v.${change.version}`;
          change.changed_by = change.user;
          if (change.entity === 'strategies') {
            let base_route = `strategies/${change.entity_id}/update_history_detail/${change._id}`;
            let additional_route = '';
            if (change.change_type === 'module_detail' && change.before && change.before.module_run_order && change.before.module_run_order.length && change.before.module_run_order[ 0 ].lookup_name) {
              additional_route = `/${change.before.module_run_order[ 0 ].lookup_name}/0`;
            }
            change.end_route = base_route + additional_route;
          }
          return change;
        });
        req.controllerData = req.controllerData || {};
        req.controllerData = Object.assign({}, req.controllerData, {
          numItems: result.collection_count,
          numPages: result.collection_pages,
          rows: changes,
        });
        res.status(200).send(req.controllerData);
      })
      .catch(e => {
        res.status(404).send({
          status: 404,
          result: 'error',
          data: {
            type: 'error',
            timeout: 10000,
            error: e.message,
          },
        });

      });
  } catch (e) {
    res.status(404).send({
      status: 404,
      result: 'error',
      data: {
        type: 'error',
        timeout: 10000,
        error: e.message,
      },
    });
  }
}

/**
 * Formats the pageData on rules management pages
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function formatPageData(req, res) {
  try {
    let pathname = url.parse(req.headers.referer).pathname.split('/');
    let { collection, core, id, tabname, parsedUrl, } = controller_helper.findCollectionNameFromReq({ req, });
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    req.controllerData.data._id = id;
    const idMap = {
      'all': 'All',
      'population': 'Population',
      'requirements': 'Requirements',
      'scorecard': 'Scorecard',
      'output': 'Output',
      'limits': 'Limits',
      'assignments': 'Simple Output',
    };
    collection = (collection === 'rulesets') ? 'Rule Sets' : capitalize.words(collection);
    id = idMap[ id ];
    // req.controllerData.pageTitle = (id) ? `${id} ${collection}` : `${capitalize(tabname)} ${collection}`;
    req.controllerData.pageTitle = 'Rules Management';
    if (req.query.includeParams === 'true') {
      req.controllerData.data = Object.assign({}, req.controllerData.data, controller_helper.findCollectionNameFromReq({ req, }));
    } else if (req.query.addModule === 'true') {
      req.controllerData.data.type = 'requirements';
    }
    res.status(200).send(req.controllerData);
  } catch (e) {
    res.status(404).send({
      status: 404,
      result: 'error',
      data: {
        type: 'error',
        timeout: 10000,
        error: e.message,
      },
    });
  }
}

function getInitCreateFormData(req, res) {
  try {
    let pathname = flatten(Object.assign({}, { pathname: url.parse(req.headers.referer).pathname.split('/'), }));
    let { collection, core, id, tabname, parsedUrl, } = controller_helper.findCollectionNameFromReq({ req, });
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    req.controllerData.data._id = id;
    req.controllerData.pageTitle = '';
    if (req.query.init === 'true') {
      req.controllerData.data = Object.assign({}, req.controllerData.data, { collection, core, id, lookup_name: tabname, parsedUrl, rule_type: 'simple', }, pathname, req.params);
    }
    if (req.query.type === 'calculations' && req.controllerData.formoptions) {
      let options = {
        state_property_attribute: req.controllerData.formoptions.state_property_attribute || [],
        variable_types: req.controllerData.data.variable_types || {},
        required_calculation_variables: req.controllerData.variable_dropdown || [],
      };
      delete req.controllerData.data.formoptions;
      req.controllerData._children = {
        form: controller_helper.generateCalculationForm(options),
      };
      res.status(200).send(req.controllerData);
    } else if (req.query.type === 'assignments' && req.controllerData.formoptions) {
      let options = {
        state_property_attribute: req.controllerData.formoptions.state_property_attribute || [],
        variable_types: req.controllerData.data.variable_types || {},
      };
      req.controllerData.data[ 'rule*0*state_property_attribute_value_comparison' ] = '';
      delete req.controllerData.data.formoptions;
      res.status(200).send(req.controllerData);
    } else {
      res.status(200).send(req.controllerData);
    }
  } catch (e) {
    res.status(404).send({
      status: 404,
      result: 'error',
      data: {
        type: 'error',
        timeout: 10000,
        error: e.message,
      },
    });
  }
}

function getVariableTemplate(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.controllerData.flattenedOutput = [ Object.assign({
    variable_display_name: 'example variable name',
    optional_variable_system_name: 'example_variable_name',
    data_type: 'Number;Boolean;String;Date',
    variable_type: 'Input;Output',
    optional_description: 'example variable description',
  }, req.body.value),
  ];
  req.controllerData.flattenedOutputName = 'bulk_upload_template';
  return next();
}

/**
 * Creates bulk variables for simulation
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function createNewVariables(req, res, next) {
  try {
    const Variable = periodic.datas.get('standard_variable');
    if (req.query.bulk) {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      req.body.data = req.body.data.map(datum => {
        return Object.assign({}, datum, { user: { creator: `${req.user.first_name} ${req.user.last_name}`, updater: `${req.user.first_name} ${req.user.last_name}`, }, organization, });
      });
      let createOptions = {
        newdoc: req.body.data,
        bulk_create: true,
      };
      Variable.create(createOptions)
        .then(result => {
          res.status(200).send({
            status: 200,
            timeout: 10000,
            type: 'success',
            text: 'Changes saved successfully!',
            successProps: {
              successCallback: 'func:window.closeModalAndCreateNotification',
            },
            responseCallback: 'func:this.props.refresh',
          });
        })
        .catch(err => {
          logger.error('Unable to create variables', err);
          return next(err);
        });
    } else {
      return next();
    }
  } catch (e) {
    logger.error('createNewVariables error', e);
    return next(e);
  }
}

/**
 * Add Organization to the query for core controllers
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function addOrganizationToQuery(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization) ? user.association.organization._id.toString() : null;
    req.controllerData = req.controllerData || {};
    req.controllerData.model_query = req.controllerData.model_query || {};
    req.controllerData.model_query = Object.assign({}, req.controllerData.model_query, {
      organization,
    });
    next();
  } catch (e) {
    return res.status(404).send({
      status: 404,
      result: 'error',
      data: {
        type: 'error',
        timeout: 10000,
        error: 'Could not find any documents from this organization',
      },
    });
  }
}

/**
 * Check entity organization id against user's associated organization
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function checkAssociatedOrganization(req, res, next) {
  try {
    let { collection, core, id, tabname, } = controller_helper.findCollectionNameFromReq({ req, });
    let parsedUrl = (req._parsedOriginalUrl.pathname.indexOf('/decision/api') === 0) ? req._parsedOriginalUrl.pathname.replace('/decision/api/', '').trim().split('/') : [];
    if (tabname === 'update_history_detail') {
      return next();
    } else if (parsedUrl.length > 1 && [ 'standard_strategies', 'standard_rules', 'standard_variables', ].indexOf(parsedUrl[ 0 ]) > -1) {
      const Entity = periodic.datas.get(pluralize.singular(parsedUrl[ 0 ]));
      Entity.load({ query: { _id: parsedUrl[ 1 ], }, })
        .then(entity => {
          entity = entity.toJSON ? entity.toJSON() : entity;
          let organizationId = entity.organization ? entity.organization.toString() : '';
          if (!req.user || !req.user.association || !req.user.association.organization || req.user.association.organization._id.toString() !== organizationId) {
            return res.status(400).send({
              message: 'Not an entity belonging to this organization.',
            });
          }
          return next();
        })
        .catch(e => {
          next();
        });
    } else {
      return next();
    }
  } catch (e) {
    return res.status(404).send({
      status: 404,
      result: 'error',
      data: {
        type: 'error',
        timeout: 10000,
        error: 'Could not find any matching document.',
      },
    });
  }
}

function getModuleDropdowns(req, res, next) {
  const DataIntegration = periodic.datas.get('standard_dataintegration');
  const MLModel = periodic.datas.get('standard_mlmodel');
  // const OCRDocument = periodic.datas.get('standard_ocrdocument');
  // const TemplateDocument = periodic.datas.get('standard_templatedocument');
  let user = req.user;
  let organization = (user && user.association && user.association.organization) ? user.association.organization._id.toString() : 'organization';
  Promise.all([ MLModel.query({ query: { organization, status: 'complete', }, limit: 100000, population: 'true' }), DataIntegration.query({ query: { organization, status: 'active', }, limit: 100000, population: 'true' }), ])
    .then(([ mlmodels, dataintegration, ]) => {
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      req.controllerData.formoptions = {
        dataintegration: dataintegration.map(integration => {
          integration = integration.toJSON ? integration.toJSON() : integration;
          return {
            label: integration.name,
            description: integration.description,
            value: integration._id.toString(),
          };
        }),
        integrations_descriptions: dataintegration.reduce((reduced, integration) => {
          integration = integration.toJSON ? integration.toJSON() : integration;
          reduced[ integration._id.toString() ] = integration.description;
          return reduced;
        }, {}),
        artificialintelligence: mlmodels.map(mlmodel => {
          mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
          return {
            label: mlmodel.display_name,
            value: mlmodel._id.toString(),
          };
        }),
        // documentocr: ocrdocuments.map(ocrdoc => {
        //   ocrdoc = ocrdoc.toJSON ? ocrdoc.toJSON() : ocrdoc;
        //   return {
        //     label: ocrdoc.name,
        //     value: ocrdoc._id.toString(),
        //   };
        // }),
        // documentocr_descriptions: ocrdocuments.reduce((reduced, ocrdoc) => {
        //   ocrdoc = ocrdoc.toJSON ? ocrdoc.toJSON() : ocrdoc;
        //   reduced[ ocrdoc._id.toString() ] = ocrdoc.description;
        //   return reduced;
        // }, {}),
        // documentcreation: templatedocuments.map(template => {
        //   template = template.toJSON ? template.toJSON() : template;
        //   return {
        //     label: template.name,
        //     value: template._id.toString(),
        //   };
        // }),
        // documentcreation_descriptions: templatedocuments.reduce((reduced, template) => {
        //   template = template.toJSON ? template.toJSON() : template;
        //   reduced[ template._id.toString() ] = template.description;
        //   return reduced;
        // }, {}),
      };
      next();
    })
    .catch(e => {
      return res.status(500).send({ message: e.message, });
    });
}

/**
 * Checks existing variables to make sure names are unique.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function checkExistingVariables(req, res, next) {
  try {
    const Variable = periodic.datas.get('standard_variable');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let titles = req.body.data.reduce((acc, curr) => {
      acc.push(curr.title);
      return acc;
    }, []);
    const existingVariables = await Variable.query({ query: { title: { $in: titles, }, organization, }, });
    if (existingVariables.length) return next(`The following variables already exist: ${existingVariables.map(tc => tc.title).join(', ')}`);
    return next();
  } catch (e) {
    return res.status(500).send({ message: e.message, });
  }
}

function handleStrategyExport(req, res, next) {
  try {
    if (req.controllerData.compiledStrategy) {
      delete req.controllerData.compiledStrategy.rules;
      delete req.controllerData.compiledStrategy.decline_reasons;
      delete req.controllerData.compiledStrategy.organization;
      delete req.controllerData.compiledStrategy.__v;
      req.controllerData.compiledStrategy.output_variables = req.controllerData.compiledStrategy.output_variables.map(variable => ({
        name: variable.name,
        title: variable.title,
        type: variable.type,
        data_type: variable.data_type,
        version: variable.version,
        display_title: variable.display_title,
      }));
      req.controllerData.compiledStrategy.input_variables = req.controllerData.compiledStrategy.input_variables.map(variable => ({
        name: variable.name,
        title: variable.title,
        type: variable.type,
        data_type: variable.data_type,
        version: variable.version,
        display_title: variable.display_title,
      }));
      req.controllerData.compiledStrategy.module_run_order.map(md => {
        md.segments = md.segments.map(seg => {
          seg.conditions = seg.conditions.map(rule => {
            delete rule.rule_name;
            return rule;
          });
          seg.conditions = seg.ruleset.map(rule => {
            delete rule.rule_name;
            return rule;
          });
          return seg;
        });
        return md;
      });
      let json = JSON.stringify(req.controllerData.compiledStrategy, null, '\t');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-disposition', 'attachment; filename=' + `${req.controllerData.compiledStrategy.display_title} ${new Date()}.json`);
      res.send(json);
    } else {
      return res.status(404).send({
        status: 404,
        result: 'error',
        data: {
          type: 'error',
          timeout: 10000,
          error: 'Could not export the strategy.',
        },
      });
    }
  } catch (e) {
    return res.status(404).send({
      status: 404,
      result: 'error',
      data: {
        type: 'error',
        timeout: 10000,
        error: 'Could not export the strategy.',
      },
    });
  }
}

async function fetchVariableDropdown(req, res) {
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  const Variable = periodic.datas.get('standard_variable');
  let variable_dropdown = [ { label: ' ', value: '', }, ];
  req.controllerData = req.controllerData || {};
  let query = { organization, };
  if ((new RegExp('^[0-9a-fA-F]{24}$')).test(req.query.query)) query[ '$or' ] = [ {
    display_title: new RegExp(req.query.query, 'gi'),
  }, {
    _id: req.query.query,
  }, ];
  else query[ '$or' ] = [ {
    display_title: new RegExp(req.query.query, 'gi'),
  }, {
    title: new RegExp(req.query.query.toLowerCase().replace(/\s+/g, '_'), 'gi'),
  }, ];
  if (req.query.type) query.type = req.query.type;
  let variables = await Variable.query({ query, limit: req.query.limit, sort: 'title', });
  let variables_count = variables.length;
  let variables_to_add = req.query.limit - variables_count;
  if (variables_to_add > 0 && req.query.changed) {
    let front_start_slice_index, back_end_slice_index;
    let half_count_variables_to_add = Math.ceil(variables_to_add / 2);
    let queryOptions = { organization, };
    if (req.query.type) queryOptions.type = req.query.type;
    let allVariables = await Variable.model.find(queryOptions).sort('title');
    if (variables.length) {
      let first_variable_index = allVariables.map(variable => variable.toJSON().title).indexOf(variables[ 0 ].toJSON().title);
      front_start_slice_index = (half_count_variables_to_add > first_variable_index) ? 0 : first_variable_index - half_count_variables_to_add;
      back_end_slice_index = front_start_slice_index + Number(req.query.limit);
      variables = allVariables.slice(front_start_slice_index, back_end_slice_index);
    } else {
      variables = [];
    }
  }
  variables.forEach(variable => {
    if (variable.toJSON) variable = variable.toJSON();
    variable_dropdown.push({
      label: variable.display_title,
      value: variable._id,
    });
  });
  req.controllerData.variable_dropdown = variable_dropdown || [];
  delete req.controllerData.authorization_header;
  res.status(200).send(req.controllerData);
}

async function getUploadedDocumentTemplate(req, res, next) {
  try {
    if (req.headers && req.headers[ 'content-type' ] && req.headers[ 'content-type' ].indexOf('multipart/form-data') === -1) return next('Please upload file');
    const busboy = new Busboy({ headers: req.headers, });
    req.controllerData = req.controllerData || {};
    // busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    //   if (fieldname === 'ocr_id') {
    //     req.controllerData.ocr_id = val;
    //   }
    // });
    let fileurl;
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
      let buffers = [];
      let filesize = 0;
      file.on('data', chunk => {
        filesize += Buffer.byteLength(chunk);
        buffers.push(chunk);
      });
      file.on('end', () => {
        let filebuffers = Buffer.concat(buffers);
        req.controllerData.file = filebuffers;
        let aws_filename = `${filename}_${new Date()}.pdf`;
        util_helpers.uploadAWS({ Key: `templatedocuments/${aws_filename}`, Body: filebuffers, })
          .then(result => {
            fileurl = `templatedocuments/${aws_filename}`;
            req.controllerData.fileurl = fileurl;
            req.controllerData.filename = aws_filename;
            next();
          })
          .catch(e => {
            res.status(500).send({ message: 'Error uploading document template.', });
          });
      });
      file.on('error', (e) => {
        logger.error('reading file error', e);
        return next(e);
      });
    });
    busboy.on('finish', function () {
      if (fileurl) next();
    });
    req.pipe(busboy);

  } catch (e) {
    res.status(500).send({ message: 'Error uploading document template.', });
  }
}

async function downloadDocumentTemplate(req, res) {
  try {
    if (req.params.filename) {
      let fileurl = `templatedocuments/${decodeURI(req.params.filename)}`;
      let filedata = await util_helpers.downloadAWS({ fileurl, });
      let mimetype = mime.lookup(fileurl) || 'application/json';
      res.setHeader('content-type', mimetype);
      res.setHeader('Content-disposition', 'attachment; filename=' + `${decodeURI(req.params.filename)}`);
      res.attachment(decodeURI(req.params.filename));
      res.end(filedata);
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not download file.', });
  }
}

async function getCurrentRulesSegment(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let { collection, core, id, tabname, parsedUrl, } = controller_helper.findCollectionNameFromReq({ req, });
    const Strategy = periodic.datas.get('standard_strategy');
    let strategy = await Strategy.load({ query: { _id: id, }, });
    let refererArr = req.headers.referer.split('/');
    let segment_index = refererArr[ refererArr.length - 1 ];
    if (strategy) {
      req.strategy_organization = (strategy.organization && strategy.organization._id) ? strategy.organization._id.toString() : strategy.organization.toString();
      req.controllerData.strategy = strategy;
      req.controllerData.module_type = strategy.modules[ tabname ][ segment_index ].type;
      req.controllerData.tabname = tabname;
      req.controllerData.segment_index = segment_index;
      req.controllerData.ruleset = strategy.modules[ tabname ][ segment_index ].ruleset;
      req.controllerData.conditions = strategy.modules[ tabname ][ segment_index ].conditions;
      next();
    } else {
      res.status(500).send({ message: 'Could not retrieve current strategy.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not retrieve current strategy.', });
  }
}

async function getUploadedRulesCSV(req, res, next) {
  try {
    let hasError = false;
    req.controllerData = req.controllerData || {};
    var busboy = new Busboy({ headers: req.headers, });
    // busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
    //   if (fieldname === 'selected_model') req.params.id = val;
    //   if (fieldname === 'batch_name' && val !== 'undefined') req.controllerData.batch_name = val;
    // });
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
      let file_data = [];
      let fileTypeArr = filename.trim().split('.');
      let fileType = fileTypeArr[ fileTypeArr.length - 1 ];
      if ([ 'csv', 'xls', 'xlsx', ].indexOf(fileType) === -1) {
        hasError = true;
        req.unpipe(busboy);
        res.set('Connection', 'close');
        res.status(500).send({ message: 'File type must be in .csv, .xls or .xlsx format', });
      } else {
        if (fileType === 'xls' || fileType === 'xlsx') {
          file.on('data', function (chunk) {
            file_data.push(chunk);
          })
            .on('error', function (e) {
              hasError = true;
              req.unpipe(busboy);
              res.set('Connection', 'close');
              res.status(500).send({ message: 'Invalid upload file format.', });
            })
            .on('end', function () {
              var file_buffer = Buffer.concat(file_data);
              var workbook = XLSX.read(file_buffer, { type: 'buffer', });
              let sheet_name = workbook.SheetNames[ 0 ];
              let convertedCSVData = XLSX.utils.sheet_to_csv(workbook.Sheets[ sheet_name ]);
              let converted_csv_rows = [];
              csv.fromString(convertedCSVData)
                .on('data', function (chunk) {
                  if (!transformhelpers.objectOrArrayPropertiesAreEmpty(chunk)) {
                    chunk = chunk.map(cellVal => transformhelpers.filterCSVSpecialCharacters(cellVal, true));
                    converted_csv_rows.push(chunk);
                  }
                })
                .on('end', function () {
                  let csv_headers = converted_csv_rows.shift();

                  req.controllerData = Object.assign({}, req.controllerData, {
                    csv_headers,
                    converted_csv_rows,
                  });
                  if (!hasError) return next();
                });
            });
        } else {
          file.pipe(csv({ headers: true, }))
            .on('data', function (chunk) {
              file_data.push(flatten.unflatten(chunk));
            })
            .on('error', function (e) {
              req.error = 'Invalid upload file format.';
              return req;
            })
            .on('end', function () {
              req.controllerData = Object.assign({}, req.controllerData, {
                file_data,
              });
              return next();
            });
        }
      }
    });
    busboy.on('finish', function () {
    });
    req.pipe(busboy);
  } catch (e) {
    res.status(500).send({ message: 'Error uploading OCR documents', });
  }
}

async function createRules(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const redisClient = periodic.app.locals.redisClient;
    const Rule = periodic.datas.get('standard_rule');
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    if (req.controllerData.new_ruleset && req.controllerData.new_ruleset.length) {
      let createdRules = await Promise.all(req.controllerData.new_ruleset.map(async (rule) => {
        let new_rule = await Rule.create(rule);
        new_rule = new_rule.toJSON ? new_rule.toJSON() : new_rule;
        if (redisClient) {
          setRuleOnRedis(new_rule, organization);
        }
        return new_rule;
      }));
      req.controllerData.new_rule_ids = createdRules.map(rule => rule._id.toString());
      return next();
    } else {
      res.status(500).send({ message: 'No rules to create', });
    }
  } catch (e) {
    res.status(500).send({ message: 'No rules to create', });
  }
}

async function updateStrategyWithNewRules(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let { segment_index, tabname, } = req.controllerData;
    const Strategy = periodic.datas.get('standard_strategy');
    let new_segment = req.controllerData.strategy.modules[ tabname ][ segment_index ];
    if (req.query.type === 'population') new_segment.conditions = req.controllerData.new_rule_ids;
    else new_segment.ruleset = req.controllerData.new_rule_ids;
    await Strategy.model.update({ _id: req.controllerData.strategy._id.toString(), }, {
      $set: { [ `modules.${tabname}.${segment_index}` ]: new_segment, },
    });
    return next();
  } catch (e) {
    res.status(500).send({ message: 'Error updating strategy ruleset with new rules', });
  }
}

async function handleStrategyVariableDependencies(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let Rule = periodic.datas.get('standard_rule');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const oldRuleIds = (req.query.type === 'population') ? req.controllerData.conditions : req.controllerData.ruleset;
    const newRuleIds = req.controllerData.new_rule_ids;
    const newRuleDocs = await getRuleFromCache(newRuleIds, organization);
    const oldRuleDocs = await getRuleFromCache(oldRuleIds, organization);
    const added_variables = [];
    const removed_variables = [];

    for (let i = 0; i < newRuleIds.length; i++) {
      const ruleDoc = newRuleDocs[ i ];
      added_variables.push(...controller_helper.compileRuleVariableIds({ result: ruleDoc, }));
    }

    for (let i = 0; i < oldRuleIds.length; i++) {
      const ruleDoc = oldRuleDocs[ i ];
      removed_variables.push(...controller_helper.compileRuleVariableIds({ result: ruleDoc, }));
    }

    let deleteOptions = {
      req,
      diff: { deletedIds: removed_variables, },
      childModel: 'standard_variable',
      collection: 'strategies',
      parentId: req.controllerData.strategy._id.toString(),
    };

    let addOptions = {
      req,
      childId: added_variables,
      childModel: 'standard_variable',
      collection: 'strategies',
      parentId: req.controllerData.strategy._id.toString(),
    };

    await controller_helper.addParentToChild(addOptions);
    await controller_helper.deleteParentFromChild(deleteOptions);
    return next();
  } catch (e) {
    res.status(500).send({ message: 'Error handling strategy variable dependencies', });
  }
}

async function downloadStandardRulesTemplate(req, res) {
  let typeMap = {
    'scorecard': 'requirements',
    'requirements': 'requirements',
    'outputs': 'outputs',
    'population': 'population',
    'calculations': 'calculations',
    'assignments': 'assignments',
  };
  let filepath = path.join(process.cwd(), `content/files/rules_upload_templates/standard_rules/${typeMap[ req.query.type ]}.csv`);
  // could just res.download(filepath, filename);
  let file = await fs.readFile(filepath);
  let filename = `Rules Upload Template - ${capitalize(req.query.type)}.csv`;
  let contenttype = 'text/csv';
  res.set('Content-Type', contenttype);
  res.attachment(filename);
  res.status(200).send(file).end();
}

async function setQueryForRuleAndVariableCron(req, res, next) {
  req.query = req.query || {};
  req.query.skipUntilIntialized = true;
  next();
}

module.exports = {
  find,
  show,
  create,
  update,
  createRules,
  downloadStandardRulesTemplate,
  getCurrentRulesSegment,
  getUploadedRulesCSV,
  setQueryForRuleAndVariableCron,
  updateStrategyWithNewRules,
  handleStrategyVariableDependencies,
  getUploadedDocumentTemplate,
  downloadDocumentTemplate,
  fetchVariableDropdown,
  getModuleDropdowns,
  checkAssociatedOrganization,
  getInitCreateFormData,
  getVariableTemplate,
  addOrganizationToQuery,
  handleControllerDataResponse,
  fetchDashboardChangeData,
  fetchDashboardStrategyData,
  handlePageError,
  formatPageData,
  createNewVariables,
  checkExistingVariables,
  handleStrategyExport,
};