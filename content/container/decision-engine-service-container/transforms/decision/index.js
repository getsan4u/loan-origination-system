'use strict';

const periodic = require('periodicjs');
const rule = require('./rule');
const variable = require('./variable');
const strategy = require('./strategy');
const utilities = require('../../utilities');
const { getRuleFromCache, getVariableFromCache } = require('../../utilities/controllers/integration');
const moment = require('moment');
const pluralize = require('pluralize');
const helpers = utilities.controllers.helper;
const { CHILD_MAP, SEGMENT_TYPE_DB_MAP, } = utilities.constants;
const DECISION_CONSTANTS = utilities.views.decision.constants;
const logger = periodic.logger;
const transformhelpers = utilities.transformhelpers;
const capitalize = require('capitalize');
const url = require('url');
const util = require('util');

/**
 * Populates before and after changes for all collections
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object updated with before and after details on req.controllerData
  */
function populateBeforeAfterChanges(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let { collection, core, tabname, } = helpers.findCollectionNameFromReq({ req, });
      if (tabname === 'update_history_detail') {
        let pathname = url.parse(req.headers.referer).pathname.split('/');
        let change_id = (req.query.change_type && req.query.change_type === 'rules') ? pathname[ pathname.length - 3 ] : pathname[ pathname.length - 1 ];
        const child_collection = CHILD_MAP[ collection ];
        const Change = periodic.datas.get('standard_change');
        const Model = (typeof child_collection === 'string') ? periodic.datas.get(`standard_${pluralize.singular(child_collection)}`) : periodic.datas.get(`standard_${pluralize.singular(collection)}`);
        let moduleTypeMap = {
          'artificialintelligence': 'Artificial Intelligence',
          'requirements': 'Requirements Rules',
          'dataintegration': 'Data Integration',
          'assignments': 'Simple Outputs',
          'calculations': 'Calculation Scripts',
          'email': 'Send Email',
          'textmessage': 'Send Text Message',
          'documentocr': 'Document OCR',
          'documentcreation': 'Document Creation',
          'output': 'Rule-Based Outputs',
          'scoring': 'Scoring Model'
        }
        let beforeIds, afterIds;
        Change.load({ query: { _id: change_id, organization, }, })
          .then(change => {
            change = change.toJSON();
            req.controllerData.data = Object.assign({}, change, {
              comments: change.comments || '',
              beforeArr: (child_collection && change.before && change.before[ child_collection ]) ? change.before[ child_collection ] : [],
              afterArr: (child_collection && change.after && change.after[ child_collection ]) ? change.after[ child_collection ] : [],
              before: change.before || {},
              after: change.after || {},
              change_id: change._id,
              // children: (collection === 'rules') ? helpers.generateRuleUpdateForm(change) : '',
            });
            if (req.controllerData.data.before.type) req.controllerData.data.before.type = capitalize(req.controllerData.data.before.type);
            if (req.controllerData.data.after.type) req.controllerData.data.after.type = capitalize(req.controllerData.data.after.type);
            req.controllerData.data.before.modules_display = (req.controllerData.data.before.module_run_order && req.controllerData.data.before.modules) ? req.controllerData.data.before.module_run_order.reduce((returnData, module_run_element) => {
              let moduleDetail = req.controllerData.data.before.modules[ module_run_element.lookup_name ];
              moduleDetail.forEach(segment => {
                returnData.push({
                  type: (module_run_element.type && moduleTypeMap[ module_run_element.type ]) ? moduleTypeMap[ module_run_element.type ] : capitalize.words(module_run_element.type.replace('_', ' ')),
                  display_name: module_run_element.display_name,
                  segment_name: segment.display_name,
                })
              })
              return returnData;
            }, []) : []

            req.controllerData.data.after.modules_display = (req.controllerData.data.after.module_run_order && req.controllerData.data.after.modules) ? req.controllerData.data.after.module_run_order.reduce((returnData, module_run_element) => {
              let moduleDetail = req.controllerData.data.after.modules[ module_run_element.lookup_name ];
              moduleDetail.forEach(segment => {
                returnData.push({
                  type: (module_run_element.type && moduleTypeMap[ module_run_element.type ]) ? moduleTypeMap[ module_run_element.type ] : capitalize.words(module_run_element.type.replace('_', ' ')),
                  display_name: module_run_element.display_name,
                  segment_name: segment.display_name,
                })
              })
              return returnData;
            }, []) : [];
            req.controllerData.data.after.updatedat = (req.controllerData.data.after.updatedat) ? moment(req.controllerData.data.after.updatedat).format('MM/DD/YYYY') : '';
            req.controllerData.data.before.updatedat = (req.controllerData.data.before.updatedat) ? moment(req.controllerData.data.before.updatedat).format('MM/DD/YYYY') : '';
            return resolve(req);
          })
          .catch(reject);
      } else {
        resolve(req);
      }
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Populates before and after changes for all collections
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object updated with before and after details on req.controllerData
  */
function formatStrategyChangeLogDetails(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      let moduleTypeMap = {
        'artificialintelligence': 'Artificial Intelligence',
        'requirements': 'Requirements Rules',
        'dataintegration': 'Data Integration',
        'assignments': 'Simple Outputs',
        'calculations': 'Calculation Scripts',
        'email': 'Send Email',
        'textmessage': 'Send Text Message',
        'documentocr': 'Document OCR',
        'documentcreation': 'Document Creation',
        'output': 'Rule-Based Outputs',
        'scoring': 'Scoring Model'
      }
      let beforeIds, afterIds;
      const change = req.controllerData.changelog;
      req.controllerData.data = Object.assign({}, change, {
        comments: change.comments || '',
        beforeArr: ('variables' && change.before && change.before[ 'variables' ]) ? change.before[ 'variables' ] : [],
        afterArr: ('variables' && change.after && change.after[ 'variables' ]) ? change.after[ 'variables' ] : [],
        before: change.before || {},
        after: change.after || {},
        change_id: change._id,
      });
      if (req.controllerData.data.before.type) req.controllerData.data.before.type = capitalize(req.controllerData.data.before.type);
      if (req.controllerData.data.after.type) req.controllerData.data.after.type = capitalize(req.controllerData.data.after.type);
      req.controllerData.data.before.modules_display = (req.controllerData.data.before.module_run_order && req.controllerData.data.before.modules) ? req.controllerData.data.before.module_run_order.reduce((returnData, module_run_element) => {
        let moduleDetail = req.controllerData.data.before.modules[ module_run_element.lookup_name ];
        moduleDetail.forEach(segment => {
          returnData.push({
            type: (module_run_element.type && moduleTypeMap[ module_run_element.type ]) ? moduleTypeMap[ module_run_element.type ] : capitalize.words(module_run_element.type.replace('_', ' ')),
            display_name: module_run_element.display_name,
            segment_name: segment.display_name,
          })
        })
        return returnData;
      }, []) : []

      req.controllerData.data.after.modules_display = (req.controllerData.data.after.module_run_order && req.controllerData.data.after.modules) ? req.controllerData.data.after.module_run_order.reduce((returnData, module_run_element) => {
        let moduleDetail = req.controllerData.data.after.modules[ module_run_element.lookup_name ];
        moduleDetail.forEach(segment => {
          returnData.push({
            type: (module_run_element.type && moduleTypeMap[ module_run_element.type ]) ? moduleTypeMap[ module_run_element.type ] : capitalize.words(module_run_element.type.replace('_', ' ')),
            display_name: module_run_element.display_name,
            segment_name: segment.display_name,
          })
        })
        return returnData;
      }, []) : [];
      req.controllerData.data.after.updatedat = (req.controllerData.data.after.updatedat) ? moment(req.controllerData.data.after.updatedat).format('MM/DD/YYYY') : '';
      req.controllerData.data.before.updatedat = (req.controllerData.data.before.updatedat) ? moment(req.controllerData.data.before.updatedat).format('MM/DD/YYYY') : '';
      return resolve(req);

    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Populates ruleset names for strategy update history detail page
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object updated with ruleset names on req.controllerData
 */
function populateRulesetNames(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      let { collection, core, tabname, id, } = helpers.findCollectionNameFromReq({ req, });
      let Ruleset = periodic.datas.get('standard_ruleset');
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      if (collection === 'strategies') {
        let controllerData = req.controllerData.data;
        let conditionsMap = {};
        let rulesetsMap = {};
        let dataKeys = Object.keys(controllerData);
        dataKeys.forEach(key => {
          if ((key.includes('before_') || key.includes('after_')) && controllerData[ key ].length) {
            controllerData[ key ].forEach((el, idx) => {
              let conditionsId = controllerData[ key ][ idx ].conditions;
              let rulesetId = controllerData[ key ][ idx ].ruleset;
              conditionsMap[ conditionsId ] = true;
              rulesetsMap[ rulesetId ] = true;
            });
          }
        });

        Promise.all([ Ruleset.query({ query: { _id: { $in: Object.keys(conditionsMap), }, organization, }, }), Ruleset.query({ query: { _id: { $in: Object.keys(rulesetsMap), }, organization, }, }), ])
          .then(result => {
            let [ conditions, rulesets, ] = result;
            conditions.forEach(condition => conditionsMap[ condition._id ] = condition.name);
            rulesets.forEach(ruleset => rulesetsMap[ ruleset._id ] = ruleset.name);
          })
          .then(() => {
            dataKeys.forEach(key => {
              if ((key.includes('before_') || key.includes('after_')) && controllerData[ key ].length) {
                controllerData[ key ] = controllerData[ key ].map((el, index) => Object.assign({}, el, { conditions: conditionsMap[ controllerData[ key ][ index ].conditions ], ruleset: rulesetsMap[ controllerData[ key ][ index ].ruleset ], parent_id: id, index, }));
              }
            });
            return resolve(req);
          })
          .catch(Promise.reject);
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Generates version table for all collections
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with populated rows for version table display
 */
async function generateVersionTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.rows = req.controllerData.rows || [];
    req.controllerData.rows = req.controllerData.rows.map(version => {
      version.user = version.user.updater || version.user.creator;
      version.status = helpers.handleStatusDisplay({ status: version.status, locked: version.locked, });
      return version;
    });
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function generateChangeLogTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.rows = req.controllerData.rows || [];
    const strategyId = req.params.id || '';
    const changeslogs = req.controllerData.rows.map((changelog, idx) => {
      let endroute;
      if (changelog.change_type === 'process_flow') {
        endroute = `${strategyId}/update_history_detail/${changelog._id}`;
      } else if (changelog.change_type === 'module_detail' && changelog.after && changelog.after.module_run_order && changelog.after.module_run_order[ 0 ] && changelog.after.module_run_order[ 0 ].lookup_name) {
        endroute = `${strategyId}/update_history_detail/${changelog._id}/${changelog.after.module_run_order[ 0 ].lookup_name}/0`;
      } else if (changelog.change_type === 'module_detail' && changelog.before && changelog.before.module_run_order && changelog.before.module_run_order[ 0 ] && changelog.before.module_run_order[ 0 ].lookup_name) {
        endroute = `${strategyId}/update_history_detail/${changelog._id}/${changelog.before.module_run_order[ 0 ].lookup_name}/0`;
      } else {
        endroute = `${strategyId}/update_history_detail/${changelog._id}`;
      }
      changelog = Object.assign({}, {
        endroute,
        index: idx,
        parent_id: strategyId,
        user: changelog.user,
        updatedat: changelog.updatedat,
        change_type: (changelog.change_type !== 'process_flow' && changelog.change_type !== 'module_detail')
          ? DECISION_CONSTANTS.MODULE_TYPE_MAP[ changelog.change_type ]
          : capitalize.words(changelog.change_type.replace('_', ' ')),
      });
      return changelog;
    });
    req.controllerData.rows = changeslogs || [];
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

/**
 * Generates the model query to filter the collection documents that return in the latest or all tabs
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with model query based on tabname
 */
function generateIndexModelQuery(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, id, tabname, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.model_query = req.controllerData.model_query || {};
      if ((collection === 'strategies' || collection === 'variables') && tabname === 'all') delete req.query.type;
      if (req.query) {
        req.query.limit = 10;
        req.query.pagelength = 10;
        req.controllerData = Object.assign({}, req.controllerData, req.query);
        req.controllerData.model_query = (req.query.type) ? Object.assign({}, req.controllerData.model_query, { type: new RegExp(req.query.type, 'gi') }) : req.controllerData.model_query;
        req.controllerData.model_query = req.query.query ? Object.assign({}, req.controllerData.model_query, { $or: [ { name: new RegExp(req.query.query, 'gi'), }, { display_name: new RegExp(req.query.query, 'gi'), }, { display_title: new RegExp(req.query.query, 'gi'), }, { description: new RegExp(req.query.query, 'gi'), }, ], }) : req.controllerData.model_query;
      }
      // if (collection === 'strategies' && [ 'active', 'testing' ].indexOf(tabname) !== -1) {
      //   req.controllerData.model_query = Object.assign({}, req.controllerData.model_query, { status: tabname, });
      // }
      resolve(req);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Prevents a locked entity from being modified
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated status message
 */
function checkLocked(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      if (req.params && req.params.id) {
        collection = req.query.collection || collection;
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        let Model = periodic.datas.get(`standard_${pluralize.singular(collection)}`);
        Model.load({ query: { _id: req.params.id, organization, }, })
          .then(result => {
            if (result.locked) req.error = `This ${pluralize.singular(collection)} is locked and cannot be edited. To make changes, you must create a new version.`;
            if (req.method === 'DELETE' && parsedUrl && parsedUrl[ 0 ] === 'standard_strategies') {
              req.controllerData.deletedStrategy = result.toJSON ? result.toJSON() : result;
            }
            return resolve(req);
          });
      }
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Prevents a locked entity or an entity that contains dependencies from being modified
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated status message
 */
function checkLockedOrDependency(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      if (req.params && req.params.id) {
        collection = req.query.collection || collection;
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        let Model = periodic.datas.get(`standard_${pluralize.singular(collection)}`);
        Model.load({ query: { _id: req.params.id, organization, }, })
          .then(result => {
            let dependencyResult = helpers.checkDependencies({ result, collection, });
            if (result.locked) req.error = `This ${pluralize.singular(collection)} is locked and cannot be edited. To make changes, you must create a new version.`;
            else if (dependencyResult) req.error = `This ${pluralize.singular(collection)} has dependencies and cannot be edited. To make changes, you must create a new version.`;
            return resolve(req);
          })
          .catch(e => Promise.reject(e));
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Prevents an entity that contains dependencies from being modified
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated status message
 */
function checkDependency(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      if (req.params && req.params.id) {
        collection = req.query.collection || collection;
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : null;
        let Model = periodic.datas.get(`standard_${pluralize.singular(collection)}`);
        Model.load({ query: { _id: req.params.id, organization, }, })
          .then(result => {
            let dependencyResult = helpers.checkDependencies({ result, collection, });
            if (dependencyResult) req.error = `This ${pluralize.singular(collection)} has dependencies and cannot be deleted. To make changes, you must create a new version.`;
            return resolve(req);
          })
          .catch(e => Promise.reject(e));
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Stringifies version for display on manifests and sets entity status based on locked flag
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated version and status
 */
function formatVersionAndStatus(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = (req.query.modal === 'true') ? req.controllerData[ pluralize.singular(parsedUrl[ 0 ]) ].toJSON() : req.controllerData[ core ].toJSON();
      req.controllerData.data = Object.assign({}, req.controllerData.data, {
        version: req.controllerData.data.version.toString(),
        status: helpers.handleStatusDisplay({ status: req.controllerData.data.status, locked: req.controllerData.data.locked, collection, }),
        formattedCreatedAt: `${transformhelpers.formatDateNoTime(req.controllerData.data.createdat, req.user.time_zone)} by ${req.controllerData.data.user.creator}`,
        formattedUpdatedAt: `${transformhelpers.formatDateNoTime(req.controllerData.data.updatedat, req.user.time_zone)} by ${req.controllerData.data.user.updater}`,
      });
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Formats the status displayed in DES as Locked/Not Locked/Active/Inactive
 * 
 * @param {Object} req Express request object
 * @returns request object with updated status for dispplay
  */
function formatStatus(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      let pluralizedCore = pluralize(core);
      let entityDocuments = (req.controllerData[ pluralizedCore ] && req.controllerData[ pluralizedCore ][ pluralizedCore ] && req.controllerData[ pluralizedCore ][ pluralizedCore ].documents) ? req.controllerData[ pluralizedCore ][ pluralizedCore ].documents : [];
      entityDocuments = entityDocuments.map(doc => {
        doc = (doc.toJSON) ? doc.toJSON() : doc;
        doc[ 'status' ] = helpers.handleStatusDisplay({ status: doc.status, locked: doc.locked, collection, });
        return doc;
      });
      req.controllerData[ pluralizedCore ][ pluralizedCore ].documents = entityDocuments;
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Populates variable details in segment detail
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated variable names
 */
function populateBeforeAfterVariableMap(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      const Variable = periodic.datas.get('standard_variable');
      if (req.controllerData.data.before && req.controllerData.data.after && tabname === 'update_history_detail') {
        let beforeRules = req.controllerData.data.before.multiple_rules || [];
        let afterRules = req.controllerData.data.after.multiple_rules || [];
        let beforeConditions = Array.isArray(req.controllerData.data.before.condition_output) ? req.controllerData.data.before.condition_output : [ req.controllerData.data.before.condition_output, ];
        let afterConditions = Array.isArray(req.controllerData.data.after.condition_output) ? req.controllerData.data.after.condition_output : [ req.controllerData.data.after.condition_output, ];
        let variableMap = {};
        let allVariables = [];
        [ ...beforeRules, ...afterRules, ].forEach(rule => {
          if (rule && rule.state_property_attribute) allVariables.push(rule.state_property_attribute);
          if (rule && rule.state_property_attribute_minimum && rule.state_property_attribute_minimum_type === 'variable') allVariables.push(rule.state_property_attribute_minimum);
          if (rule && rule.state_property_attribute_maximum && rule.state_property_attribute_maximum_type === 'variable') allVariables.push(rule.state_property_attribute_maximum);
        });

        beforeConditions.concat(afterConditions).forEach(condition => {
          if (condition && condition.value && condition.value_type === 'variable') allVariables.push(condition.value);
          if (condition && condition.variable && condition.variable_type === 'variable') allVariables.push(condition.variable);
        });
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        Variable.model.find({ _id: { $in: allVariables, }, organization, })
          .then(variables => {
            variables.forEach(variable => variableMap[ variable._id ] = variable);
            req.controllerData.variable_map = Object.assign({}, variableMap);
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
 * Generates variable map for all variables that maps id to variable
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated variable map
 */
function populateAllVariablesMap(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      const Variable = periodic.datas.get('standard_variable');
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      if (collection === 'strategies' && tabname !== 'overview' && tabname !== 'versions') {
        let variableMap = {};
        Variable.model.find({ organization, })
          .then(variables => variables.forEach(variable => variableMap[ variable._id ] = variable))
          .then(() => {
            req.controllerData.allVariablesMap = variableMap;
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

async function checkIfEntityDeleted(req) {
  try {
    let { collection, core, tabname, parsedUrl } = helpers.findCollectionNameFromReq({ req });
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    if (collection) {
      const Model = periodic.datas.get(`standard_${pluralize.singular(collection)}`);
      let entity = await Model.load({ query: { _id: req.params.id } });
      entity = entity.toJSON ? entity.toJSON() : entity;
      req.controllerData.data.entity_exists = (entity) ? true : false;
      if (collection === 'strategies' && req.controllerData.data.entity_exists) {
        req.controllerData.data.onclickBaseUrl = `/decision/strategies/${entity._id}/${entity.module_run_order[ 0 ].lookup_name}/0`;
      }
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

function assignNewLatestVersion(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl } = helpers.findCollectionNameFromReq({ req });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      if (collection && req.params.id) {
        let Model = periodic.datas.get(`standard_${pluralize.singular(collection)}`);
        Model.load({ query: { _id: req.params.id, } })
          .then(entity => {
            entity = entity.toJSON ? entity.toJSON() : entity;
            req.controllerData.strategy = entity;
            if (entity.latest_version) return Model.query({ query: { title: entity.title, latest_version: false }, sort: { version: -1 } })
            else return null;
          })
          .then(entities => {
            let new_latest_entity = (entities) ? entities[ 0 ] : null;
            if (new_latest_entity) {
              new_latest_entity = new_latest_entity.toJSON ? new_latest_entity.toJSON() : new_latest_entity;
              return Model.update({
                id: new_latest_entity._id.toString(),
                updatedoc: { 'latest_version': true, },
                isPatch: true,
              });
            } else {
              return resolve(req);
            }
          })
          .then(_ => {
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

function getVariableSystemNameToIdMap(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.query.type === 'createMLModel' || (req.body && (req.body.type === 'artificialintelligence' || req.body.type === 'dataintegration' || req.body.type === 'documentocr' || req.body.type === 'documentcreation'))) {
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        const Variable = periodic.datas.get('standard_variable')
        let variableMap = {};
        Variable.model.find({ organization, })
          .then(variables => variables.forEach(variable => variableMap[ variable.title ] = variable._id.toString()))
          .then(() => {
            req.controllerData.variableMap = variableMap;
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

function getVariableMap(req) {
  return new Promise((resolve, reject) => {
    try {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id)
        ? user.association.organization._id
        : (req.strategy_organization)
          ? req.strategy_organization
          : 'organization';

      const Variable = periodic.datas.get('standard_variable')
      let variableMap = {};
      Variable.model.find({ organization, })
        .then(variables => {
          variables.forEach(variable => {
            variable = variable.toJSON ? variable.toJSON() : variable;
            variableMap[ variable._id.toString() ] = variable;
          })
          req.controllerData.inputVariables = variables;
          req.controllerData.variableMap = variableMap;
          return resolve(req);
        })
        .catch(reject);
    } catch (err) {
      return reject(err);
    }
  });
}

function checkEntityExists(req) {
  return new Promise((resolve, reject) => {
    try {
      let parsedUrl = req._parsedOriginalUrl.pathname.split('/');
      parsedUrl = parsedUrl.slice(parsedUrl.indexOf('api') + 1);
      if (parsedUrl[ 0 ].indexOf('standard') === 0 && req.route.path.indexOf(':id') > 0) {
        const Entity = periodic.datas.get(pluralize.singular(parsedUrl[ 0 ]));
        Entity.load({ query: { _id: req.params.id } })
          .then(entity => {
            if (!entity) throw new Error('Could not find the resource.');
            else {
              entity = entity.toJSON ? entity.toJSON() : entity;
              resolve(req);
            }
          })
          .catch(e => {
            req.error = 'Could not find the resource.';
            return resolve(req);
          });
      } else {
        resolve(req);
      }
    } catch (err) {
      req.error = 'Could not find the resource.';
      return resolve(req);
    }
  });
}

function generateDocumentTemplateRequiredVariable(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.controllerData.template_variables) {
        let { collection, core, id, tabname, } = helpers.findCollectionNameFromReq({ req, });
        let inputs = req.controllerData.template_variables.map(input => ({ display_name: input.name, input_type: 'variable', field_type: input.type, }));
        req.controllerData.pageLayout = utilities.views.decision.modals.document_template_required_variable({ strategy: { _id: id, }, inputs, variable_dropdown: req.controllerData.variable_dropdown || [], fileurl: req.controllerData.fileurl, filename: req.controllerData.filename, });
      }
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

function generateVariableDropdown(req) {
  return new Promise((resolve, reject) => {
    try {
      const Variable = periodic.datas.get('standard_variable')
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      Variable.model.find({ organization, })
        .then(variables => {
          req.controllerData.variable_dropdown = variables.map(variable => {
            variable = variable.toJSON ? variable.toJSON() : variable;
            return {
              label: variable.display_title,
              value: variable._id.toString(),
            }
          });
          return resolve(req);
        })
        .catch(e => {
          req.error = e.message;
          return resolve(req);
        });
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

function generateSystemVariableDropdown(req) {
  return new Promise((resolve, reject) => {
    try {
      const Variable = periodic.datas.get('standard_variable')
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      Variable.model.find({ organization })
        .then(variables => {
          req.controllerData.variable_dropdown = variables.map(variable => {
            variable = variable.toJSON ? variable.toJSON() : variable;
            return {
              label: variable.title,
              value: variable._id.toString(),
            }
          });
          return resolve(req);
        })
        .catch(e => {
          req.error = e.message;
          return resolve(req);
        });
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

function setCalculationVariableDropdown(req) {
  return new Promise((resolve, reject) => {
    try {
      const Variable = periodic.datas.get('standard_variable')
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      Variable.model.find({ organization }).sort('title')
        .then(variables => {
          req.controllerData.formoptions = Object.assign({}, req.controllerData.formoptions, {
            required_calculation_variables: variables.map(variable => {
              variable = variable.toJSON ? variable.toJSON() : variable;
              return {
                label: variable.title,
                value: variable._id.toString(),
              }
            })
          })
          return resolve(req);
        })
        .catch(e => {
          req.error = e.message;
          return resolve(req);
        });
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

async function deleteStrategyFromVariables(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.strategy && req.controllerData.strategy.modules) {
      const user = req.user;
      const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      const Variable = periodic.datas.get('standard_variable');
      let strategy = req.controllerData.strategy;
      let removed_rules = Object.keys(strategy.modules).reduce((returnData, removed_module_name) => {
        let module_rules = strategy.modules[ removed_module_name ].reduce((returnData, segment) => {
          let removed_conditions = segment.conditions || [];
          let removed_ruleset = segment.ruleset || [];
          return returnData.concat(removed_conditions, removed_ruleset);
        }, []);
        return returnData.concat(module_rules);
      }, []);

      let removedRuleDocs = await getRuleFromCache(removed_rules, organization);
      if (!Array.isArray(removedRuleDocs)) removedRuleDocs = [];
      let removed_variables = removed_rules.reduce((returnData, rule, i) => {
        rule = removedRuleDocs[ i ] || rule;
        return returnData.concat(utilities.controllers.helper.compileRuleVariableIds({ result: rule, }));
      }, []);
      let unique_variables = removed_variables.filter((v, i, a) => a.indexOf(v) === i);
      let variables = await Variable.model.find({ _id: { $in: unique_variables, }, });
      await Promise.all(variables.map(async (variable) => {
        variable = variable.toJSON ? variable.toJSON() : variable;
        variable.strategies = variable.strategies.filter(strategy_id => strategy_id.toString() !== strategy._id.toString());
        await Variable.update({ id: variable._id.toString(), updatedoc: variable })
      }))
      return req;
    } else {
      return req;
    }
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

module.exports = {
  assignNewLatestVersion,
  checkDependency,
  checkLocked,
  checkEntityExists,
  checkLockedOrDependency,
  checkIfEntityDeleted,
  deleteStrategyFromVariables,
  formatStatus,
  formatVersionAndStatus,
  generateVersionTable,
  generateChangeLogTable,
  generateIndexModelQuery,
  getVariableMap,
  getVariableSystemNameToIdMap,
  generateVariableDropdown,
  generateSystemVariableDropdown,
  rule,
  variable,
  strategy,
  populateBeforeAfterChanges,
  populateRulesetNames,
  populateBeforeAfterVariableMap,
  generateDocumentTemplateRequiredVariable,
  populateAllVariablesMap,
  setCalculationVariableDropdown,
  formatStrategyChangeLogDetails,
};