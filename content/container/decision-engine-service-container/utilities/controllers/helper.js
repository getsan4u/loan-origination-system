'use strict';

const periodic = require('periodicjs');
const pluralize = require('pluralize');
const CONSTANTS = require('../constants');
const DECISION_CONSTANTS = require('../views/decision/constants');
const mongoose = require('mongoose');
const { CHILD_MAP, PARENT_MAP, } = require('../constants');
const url = require('url');
const logger = periodic.logger;
const numeral = require('numeral');
const SKIP_NUMERIC_COERCION = CONSTANTS.SKIP_NUMERIC_COERCION;
const formElements = require('../views/decision/shared/components/formElements');
const transformhelpers = require('../transformhelpers');
const moment = require('moment');
const randomKey = Math.random;
const unflatten = require('flat').unflatten;
const cardprops = require('../views/decision/shared/components/cardProps');
const capitalize = require('capitalize');
const strategytransformhelpers = require('../transforms/strategy');
const util = require('util');
const styles = require('../views/constants').styles;

/**
 * Formats the core controller response
 * @param {Object} options Options that will be used in formatting the response
 * @param {string} options.model Singular model name e.g. standard_strategy
 * @param {Boolean} options.mongodoc If this flag is set to true, the results will be returned as mongo documents, otherwise, converted to JSON
 * @param {Object} req Express req object to retrieve the result returned by the core controller
 * @return {Object} Returns updated express req object
 */
function formatCoreDataResponse(options) {
  let { model, mongodoc, req, } = options;
  let model_name = pluralize(model);
  if (req.controllerData && req.controllerData[ model_name ]) {
    let modelData = req.controllerData[ model_name ];
    modelData = (modelData[ model_name ] && modelData[ model_name ].documents) ?
      modelData[ model_name ].documents : [];
    modelData = (mongodoc) ? modelData : modelData.map(doc => doc.toJSON ? doc.toJSON() : doc);
    req.controllerData = Object.assign({}, req.controllerData, { [ model_name ]: modelData, });
    return req;
  } else {
    return req;
  }
}

/**
 * Formats the core controller response
 * @param {Object} options Options that will be used in formatting the response
 * @param {string} options.req Express req object to retrieve the result returned by the core controller
 * @return {String} Returns name of the collection
 */
function findCollectionNameFromReq(options) {
  let { req, } = options;
  let pathname = url.parse(req.headers.referer).pathname.split('/');
  let parsedUrl = req._parsedOriginalUrl.pathname.split('/');
  parsedUrl = parsedUrl.slice(parsedUrl.indexOf('api') + 1);
  let decision_route = pathname.slice(pathname.indexOf('decision') + 1);
  if (decision_route.length < 3) {
    let [ collection, tabname, ] = decision_route;
    let core = `standard_${pluralize.singular(collection)}`;
    return { collection, core, tabname, parsedUrl, };
  } else if (decision_route[ 0 ] === 'rules' && decision_route.length > 3) {
    let [ collection, category, id, tabname, ] = decision_route;
    let core = `standard_${pluralize.singular(collection)}`;
    return { collection, core, category, id, tabname, parsedUrl, };
  } else {
    let [ collection, id, tabname, ] = decision_route;
    let core = `standard_${pluralize.singular(collection)}`;
    return { collection, core, id, tabname, parsedUrl, };
  }
}

/**
 * Populates index and collection id on each changelog row
 * 
 * @param {Object} options.data Data on req controller to be used for id
 * @param {Object} options.req Express request object
 * @returns [Object] array of row data, each populated with index and id
 */
function populateIdAndIndex(options) {
  try {
    let { data, req, } = options;
    let controllerData = req.controllerData;
    let populatedData = data.map((row, i) => {
      let endroute;
      if (row.change_type === 'process_flow') {
        endroute = `${controllerData.data._id}/update_history_detail/${row._id}`;
      } else if (row.change_type === 'module_detail' && row.after && row.after.module_run_order && row.after.module_run_order[ 0 ] && row.after.module_run_order[ 0 ].lookup_name) {
        endroute = `${controllerData.data._id}/update_history_detail/${row._id}/${row.after.module_run_order[ 0 ].lookup_name}/0`;
      } else if (row.change_type === 'module_detail' && row.before && row.before.module_run_order && row.before.module_run_order[ 0 ] && row.before.module_run_order[ 0 ].lookup_name) {
        endroute = `${controllerData.data._id}/update_history_detail/${row._id}/${row.before.module_run_order[ 0 ].lookup_name}/0`;
      } else {
        endroute = `${controllerData.data._id}/update_history_detail/${row._id}`;
      }
      row = Object.assign(row, {
        index: i,
        parent_id: (controllerData && controllerData.data) ? controllerData.data._id : '',
        type: (controllerData && controllerData.data) ? controllerData.data.type : '',
        endroute,
        change_type: (row.change_type !== 'process_flow' && row.change_type !== 'module_detail')
          ? DECISION_CONSTANTS.MODULE_TYPE_MAP[ row.change_type ]
          : capitalize.words(row.change_type.replace('_', ' ')),
      });
      return row;
    });
    return populatedData;
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Creates changelog options before changelog creation
 * 
 * @param {Object} options.result populated collection entity
 * @param {String} options.collection string collection name
 * @param {Object} options.req Express request object
 * @param {String} options.createdat create date for changelog
 * @returns {Object} createOptions used to stage a document before creation
 */
function createChangeOptions(options) {
  try {
    let { result, collection, strategyid, strategy_display_title, strategy_display_name, req, createdat, after, organization, strategy_title, } = options;
    after = after || Object.assign({}, result, req.body);
    let queryMap = {
      'addSegment': 'process_flow',
      'delete': 'process_flow',
      'deleteModule': 'process_flow',
      'updateModuleOrder': 'process_flow',
      'editModule': 'process_flow',
      'create': 'process_flow',
      'copy': 'module_detail',
      'addRule': 'module_detail',
      'deleteRule': 'module_detail',
      'editSegment': 'module_detail',
      'moveSegmentUp': 'process_flow',
      'moveSegmentDown': 'process_flow',
      'editRule': result.type,
    };
    let createOptions = {
      name: `strategies_change_log_${strategyid || result._id}`,
      entity: 'strategies',
      entity_id: strategyid || result._id,
      entity_display_title: strategy_display_title || after.display_title,
      entity_display_name: strategy_display_name || after.display_name,
      entity_title: strategy_title || result.title,
      change_type: (req.query && req.query.method && queryMap[ req.query.method ])
        ? (queryMap[ req.query.method ])
        : (req.query.variables)
          ? 'module_detail'
          : 'process_flow',
      version: result.version,
      user: `${req.user.first_name} ${req.user.last_name}`,
      createdat: createdat || new Date(),
      before: result,
      after,
      comments: req.body.comments,
      organization,
    };
    return createOptions;
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Identifies child array deletions to later be used for updating child dependencies
 * 
 * @param [Object] options.current current child array ids
 * @param [Object] options.newArray new child array ids (submitted through interface)
 * @returns [String] deletedIds an array of ids that have been deleted
 * @returns {Boolean} exists boolean that shows if array deletions exist
  */
function findArrayDeletions(options) {
  try {
    let { current, newArray, } = options;
    if (current.length > newArray.length) {
      let deletedIds = [];
      let newHash = {};
      newArray.forEach(el => newHash[ el ] = true);
      current.forEach(el => {
        if (!newHash[ el ]) deletedIds.push(el);
      });
      return { deletedIds, exists: deletedIds.length > 0, };
    } else {
      return { exists: false, };
    }
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Identifies if there is a change in the variable of a rule when a rule is being updated
 * 
 * @param {String} options.current current variable id on rule
 * @param {String} options.newVar new variable id on rule
 * @returns {Boolean} exists boolean that shows if a variable change has been made on a rule
 */
function findVariableChange(options) {
  try {
    let { current, newVar, } = options;
    if (!current || (current && newVar && current !== newVar)) {
      return { oldVar: current, newVar, exists: true, };
    } else {
      return { exists: false, };
    }
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Checks if dependencies exist on an entity
 * 
 * @param {Object} options.result populated collection entity
 * @param {String} options.collection string collection name
 * @returns {Boolean} cannotModify boolean that determines if entity can be modified or not based on presence of dependencies
 */
function checkDependencies(options) {
  try {
    let { result, collection, } = options;
    let parent = PARENT_MAP[ collection ];
    let cannotModify = false;
    if (Array.isArray(parent)) {
      parent.forEach(el => {
        if (result[ el ].length) cannotModify = true;
      });
    } else if (typeof parent === 'string') {
      if (result[ parent ].length) cannotModify = true;
    }
    return cannotModify;
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Adds parent reference to child dependencies array (E.g. Adding a rule to a variable's rules array, Adding a ruleset to a rule's rulesets array, Adding a strategy to a ruleset's strategies array)
 * 
 * @param {Boolean} options.earlyReturn set to true to skip function
 * @param {String} options.childId id of child document
 * @param {String} options.parentId id of parent document
 * @param {Object} options.req Express request object
 * @param {String} options.collection name of current collection
 * @returns resolved Promise (update on the child's dependency array occurs in this function)
 */
async function addParentToChild(options) {
  try {
    if (options.earlyReturn) {
      return Promise.resolve(true);
    } else {
      let { childId, req, childModel, collection, parentId, } = options;
      parentId = parentId || req.body._id;
      if (childId && parentId && childModel) {
        let ChildModel = periodic.datas.get(childModel);
        if (Array.isArray(childId)) {
          let childResults = await ChildModel.query({ query: { _id: { $in: childId, }, }, });
          return Promise.all(childResults.map(async childResult => {
            childResult = childResult.toJSON ? childResult.toJSON() : childResult;
            childResult.strategies = childResult.strategies || [];
            childResult.strategies = childResult.strategies.map(strategy => {
              if (strategy._id) return strategy._id.toString();
              else return strategy.toString();
            });
            childId.forEach(id => {
              if (childResult._id.toString() === id.toString()) childResult.strategies.push(parentId);
            });
            childResult.organization = (childResult.organization && childResult.organization._id) ? childResult.organization._id.toString() : childResult.organization.toString();
            childResult._id = childResult._id.toString();
            return await ChildModel.update({ id: childResult._id, updatedoc: childResult, });
          }));
        } else {
          let childResult = await ChildModel.load({ query: { _id: childId, }, });
          childResult = childResult.toJSON();
          if (childResult.multiple_rules && childResult.multiple_rules.length) childResult.multiple_rules.forEach(rule => delete rule._id);
          let exists = false;
          childResult[ `${collection}` ].forEach(el => {
            if (el._id.toString() === parentId.toString()) exists = true;
          });
          if (!exists) {
            childResult[ `${collection}` ].push(parentId);
          }
          if (options.childUpdate) {
            await ChildModel.update({ id: childResult._id, updatedoc: childResult, });
          } else {
            return childResult;
          }
        }
      } else {
        return Promise.resolve(true);
      }
    }
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Deletes parent reference from child dependencies array (E.g. Deleting a rule from a variable's rules array, Deleting a ruleset from a rule's rulesets array, Deleting a strategy from a ruleset's strategies array)
 * 
 * @param {Object} options.diff diff object that contains child ids to modify
 * @param {String} options.childModel child model string 
 * @param {String} options.parentId id of parent document
 * @param {Object} options.req Express request object
 * @param {String} options.collection name of current collection
 * @returns resolved Promise (update on the child's dependency array occurs in this function)
 */
async function deleteParentFromChild(options) {
  try {
    if (options.earlyReturn) {
      return Promise.resolve(true);
    } else {
      let { diff, req, childModel, collection, parentId, } = options;
      parentId = parentId || req.body._id;
      if (diff && diff.deletedIds.length && parentId && childModel && collection) {
        let ChildModel = periodic.datas.get(childModel);
        let childResults = await ChildModel.query({ query: { _id: { $in: diff.deletedIds, }, }, });
        return Promise.all(childResults.map(async childResult => {
          childResult = childResult.toJSON ? childResult.toJSON() : childResult;
          childResult[ `${collection}` ] = childResult[ `${collection}` ] || [];
          childResult[ `${collection}` ] = childResult[ `${collection}` ].map(childDoc => {
            if (childDoc._id) return childDoc._id.toString();
            else return childDoc.toString();
          });
          diff.deletedIds.forEach(id => {
            if (id.toString() === childResult._id.toString()) childResult[ `${collection}` ].splice(childResult[ `${collection}` ].indexOf(parentId), 1);
          });
          childResult.organization = (childResult.organization && childResult.organization._id) ? childResult.organization._id.toString() : childResult.organization.toString();
          return await ChildModel.update({ id: childResult._id.toString(), updatedoc: childResult, });
        }));
      } else {
        return Promise.resolve(true);
      }
    }
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Clears dependencies on a document that is passed in
 * 
 * @param {Object} options.result Current document to be modified
 * @param {String} options.collection Current collection used to determine which dependency array to clear
 * @returns {Object} result result object cleared dependencies
 */
function clearDependencies(options) {
  try {
    let { result, collection, } = options;
    let parent = PARENT_MAP[ collection ];
    if (Array.isArray(parent)) {
      parent.forEach(el => {
        result[ el ] = [];
      });
    } else if (typeof parent === 'string') {
      result[ parent ] = [];
    }
    return result;
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Changes parent reference on child dependencies array (E.g. Changing a rule on a variable's rules array)
 * 
 * @param {Object} options.diff diff object that contains child ids to modify
 * @param {String} options.childModel child model string 
 * @param {Object} options.req Express request object
 * @param {String} options.collection name of current collection
 * @returns resolved Promise (update on the child's dependency array occurs in this function)
 */
function changeParentOnChild(options) {
  try {
    let { diff, req, childModel, collection, } = options;
    let childCollection = (typeof collection === 'string') ? CHILD_MAP[ collection ] : 'child dependency';
    if (diff && diff.newVar && req.body && childModel && collection) {
      let ChildModel = periodic.datas.get(childModel);
      let query = (diff.oldVar && diff.newVar) ? { _id: { $in: [ diff.oldVar, diff.newVar, ], }, } : { _id: { $in: [ diff.newVar, ], }, };
      return ChildModel.query(query)
        .then(childResults => {
          childResults = childResults.map(childResult => {
            childResult = childResult.toJSON();
            if (childResult.multiple_rules && childResult.multiple_rules.length) childResult.multiple_rules.forEach(rule => delete rule._id);
            let oldVar = (diff.oldVar) ? diff.oldVar.toString() : diff.oldVar;
            if (childResult._id.toString() === oldVar) childResult[ `${collection}` ].splice(childResult[ `${collection}` ].indexOf(req.body._id), 1);
            else if (!childResult[ `${collection}` ].includes(req.body._id.toString())) childResult[ `${collection}` ].push(req.body._id);
            return childResult;
          });
          Promise.resolve(childResults.map(childResult => {
            ChildModel.update({ id: childResult._id, updatedoc: childResult, });
          }));
        });
    } else {
      return Promise.reject(new Error('Error in changeParentOnChild function'));
    }
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Depopulates a populated mongoose document
 * @param  {Object} data The mongoose document that should be depopulated
 * @return {Object}      Returns a fully depopulated mongoose document
 */
function depopulate(data, exceptions = []) {
  let depopulated = (Array.isArray(data)) ? [] : {};
  for (let key in data) {
    if ((exceptions.indexOf(key) === -1) && data[ key ] && typeof data[ key ] === 'object' && key !== '_id' && key !== 'organization') {
      if (data[ key ] instanceof Date) depopulated[ key ] = data[ key ];
      else if (data[ key ]._id && mongoose.Types.ObjectId.isValid(data[ key ]._id.toString())) depopulated[ key ] = data[ key ]._id.toString();
      else depopulated[ key ] = depopulate(data[ key ]);
    } else depopulated[ key ] = data[ key ];
  }
  return depopulated;
}

/**
 * Formats the req.body before the standard update method using the loaded entity
 * @param  {Object} options options for formatting the req.body
 * @param  {Object} options.entity loaded entity to be updated
 * @param  {Object} options.req Express req object that contains req.body to be updated
 * @return {Object} Returns the updated Express req object
 */
function formatReqBody(options) {
  try {
    let { req, entity, } = options;
    let { collection, core, id, tabname, parsedUrl, } = findCollectionNameFromReq({ req, });
    let [ dependency_type, segment_type, index, ] = parsedUrl.slice(2);
    let refererArr = req.headers.referer.split('/');
    let module_key = refererArr[ refererArr.length - 2 ];
    let segment_index = refererArr[ refererArr.length - 1 ];
    if (req.query.method === 'moveSegmentUp' && req.params[ '0' ]) {
      let module_data = req.params[ '0' ];
      let [ module_name, current_segment_idx, ] = module_data.split('/');
      let strategy = entity;
      let current_module = strategy.modules[ module_name ];
      if (segment_index !== undefined) {
        current_segment_idx = Number(current_segment_idx);
        let temp = current_module[ current_segment_idx ];
        current_module[ current_segment_idx ] = current_module[ current_segment_idx - 1 ];
        current_module[ current_segment_idx - 1 ] = temp;
      }
      return strategy;
    } else if (req.query.method === 'moveSegmentDown' && req.params[ '0' ]) {
      let module_data = req.params[ '0' ];
      let [ module_name, current_segment_idx, ] = module_data.split('/');
      let strategy = entity;
      let current_module = strategy.modules[ module_name ];
      if (current_segment_idx !== undefined) {
        current_segment_idx = Number(current_segment_idx);
        let temp = current_module[ current_segment_idx ];
        current_module[ current_segment_idx ] = current_module[ current_segment_idx + 1 ];
        current_module[ current_segment_idx + 1 ] = temp;
      }
      return strategy;
    } else if (req.query.variables === 'required') {
      let current_segment = entity.modules[ tabname ][ 0 ];
      let unflattenedReqBody = unflatten(req.body);
      if (req.query.variable_type === 'input') {
        if (parsedUrl.includes('edit_documentcreation_variables')) {
          current_segment = entity.modules[ tabname ][ segment_index ];
          current_segment.inputs = unflattenedReqBody.variables;
          current_segment.fileurl = unflattenedReqBody.fileurl;
          current_segment.filename = unflattenedReqBody.filename;
        } else {
          current_segment.inputs = current_segment.inputs.map((input, idx) => {
            if (unflattenedReqBody.variables[ idx ] && unflattenedReqBody.variables[ idx ].input_variable) {
              if (unflattenedReqBody.variables[ idx ].input_type === 'value' && input.data_type === 'Date') {
                unflattenedReqBody.variables[ idx ].input_variable = moment(unflattenedReqBody.variables[ idx ].input_variable).format('MM/DD/YYYY');
              }
              return Object.assign({}, input, unflattenedReqBody.variables[ idx ]);
            } else {
              return Object.assign({}, input, unflattenedReqBody.variables[ idx ], { input_variable: '', });
            }
          });
        }
      } else if (req.query.variable_type === 'output') {
        current_segment.outputs = current_segment.outputs.map((output, idx) => {
          if (unflattenedReqBody.variables && unflattenedReqBody.variables[ idx ] && unflattenedReqBody.variables[ idx ].output_variable) {
            if (unflattenedReqBody.variables[ idx ].output_type === 'value' && output.data_type === 'Date') {
              unflattenedReqBody.variables[ idx ].output_variable = moment(unflattenedReqBody.variables[ idx ].output_variable).format('MM/DD/YYYY');
            }
            return Object.assign({}, output, unflattenedReqBody.variables[ idx ]);
          } else {
            return Object.assign({}, output, { output_variable: '', });
          }
        });
      } else {
        current_segment.inputs = current_segment.inputs.map((input, idx) => {
          if (unflattenedReqBody.variables[ idx ].system_variable_id) {
            return Object.assign({}, input, unflattenedReqBody.variables[ idx ]);
          } else {
            return Object.assign({}, input, unflattenedReqBody.variables[ idx ], { system_variable_id: '', });
          }
        });
      }
      delete req.body.variables;
      return entity;
    }
    if (req.query.method === 'updateModuleOrder') {
      let new_module_run_order = [];
      let new_module = {};
      req.body.updated_formatted_module_run_order.forEach((module, idx) => {
        let current_module = entity.module_run_order[ module.module_index ];
        let module_detail = entity.modules[ current_module.lookup_name ];
        let new_module_name = `${current_module.name}_${current_module.type}_${idx}`;
        new_module[ new_module_name ] = module_detail;
        current_module.lookup_name = new_module_name;
        new_module_run_order.push(current_module);
      });
      entity.modules = new_module;
      entity.module_run_order = new_module_run_order;
      return entity;
    }
    if (req.query && req.query.method === 'copyModule') {
      req.body.module.forEach(segment => {
        segment.conditions = segment.conditions.map(segment => segment._id.toString());
        segment.ruleset = segment.ruleset.map(segment => segment._id.toString());
      });
      let entity_modules_length = entity.module_run_order.length;
      let new_lookup_name = `${req.body.name}_${req.body.type}_${entity_modules_length}`;
      entity.modules = entity.modules || {};
      entity.modules[ new_lookup_name ] = req.body.module;
      entity.module_run_order.push({
        description: req.body.description,
        lookup_name: new_lookup_name,
        display_name: req.body.display_name,
        active: req.body.active,
        name: req.body.name,
        type: req.body.type,
      });
      delete req.body.description;
      delete req.body.display_name;
      delete req.body.active;
      delete req.body.name;
      delete req.body.lookup_name;
      return entity;
    }
    if (req.query.method === 'copy' && req.query.entity === 'segment') {
      if (req.body.segment_type === 'population') {
        req.body.conditions = req.body.conditions.map(rl => (rl._id) ? rl._id.toString() : rl);
        entity.modules[ module_key ][ segment_index ].conditions = req.body.conditions || [];
        delete req.body.ruleset;
      } else if (req.body.segment_type === 'documentcreation') {
        entity.modules[ module_key ][ segment_index ].inputs = req.body.inputs || [];
        entity.modules[ module_key ][ segment_index ].filename = req.body.filename;
        entity.modules[ module_key ][ segment_index ].fileurl = req.body.fileurl;
      } else {
        req.body.ruleset = req.body.ruleset.map(rl => (rl._id) ? rl._id.toString() : rl);
        entity.modules[ module_key ][ segment_index ].ruleset = req.body.ruleset || [];
        delete req.body.conditions;
      }
      return entity;
    }
    if (!req.body.has_population && req.body.conditions && req.body.conditions.length) {
      req.body.prev_conditions = req.body.prev_conditions || [];
      req.body.prev_conditions = req.body.conditions.slice();
      req.body.conditions = [];
    }
    if (req.query && req.query.method && req.query.method === 'delete') {
      if (dependency_type === 'segments') {
        entity.modules[ segment_type ] = entity.modules[ segment_type ].filter((seg, idx) => (Number(index) !== idx));
        return Object.assign({}, entity);
      } else {
        return req.body;
      }
    } else if (req.query.method === 'addSegment' && entity.modules && req.body.module_name && entity.modules[ req.body.module_name ]) {
      let clean_name = req.body.name.replace(/\s+/g, '_').toLowerCase();
      let [ module_type, module_index, ] = req.body.module_name.split('_').slice(-2);
      let new_segment = {
        name: clean_name,
        type: module_type,
        display_name: req.body.name,
        conditions: [],
        ruleset: Array.isArray(req.body.ruleset) ? req.body.ruleset : [],
        description: req.body.description,
      };
      entity.modules[ req.body.module_name ].push(new_segment);
      return entity;
    } else if (req.query && req.query.method && req.query.method === 'deleteRule') {
      let changedRulesArr = (req.query.conditions && req.query.conditions !== 'false') ? 'conditions' : 'ruleset';
      entity.modules[ module_key ][ segment_index ][ changedRulesArr ] = entity.modules[ module_key ][ segment_index ][ changedRulesArr ].filter((seg, idx) => (Number(index) !== idx));
      return entity;
    } else if (collection === 'strategies' && req.query.method === 'addRule' && entity.modules) {
      entity = entity.toJSON ? entity.toJSON() : entity;
      if (req.body.type === 'population') {
        entity.modules[ module_key ][ segment_index ].conditions.push(req.body.rule.toString());
      } else {
        entity.modules[ module_key ][ segment_index ].ruleset.push(req.body.rule.toString());
      }
      return entity;
    } else if (collection === 'strategies' && req.query.method === 'editSegment') {
      if (req.body.updated_ruleset && Array.isArray(req.body.updated_ruleset)) {
        req.body.updated_ruleset = req.body.updated_ruleset.map(rule => rule._id);
        entity.modules[ module_key ][ segment_index ].ruleset = req.body.updated_ruleset;
      } else if (req.body.updated_conditions && Array.isArray(req.body.updated_conditions)) {
        req.body.updated_conditions = req.body.updated_conditions.map(condition => condition._id);
        entity.modules[ module_key ][ segment_index ].conditions = req.body.updated_conditions;
      } else {
        entity.modules[ module_key ][ segment_index ].name = (req.body.segment_name) ? req.body.segment_name.replace(/\s+/g, '_').toLowerCase() : entity.modules[ module_key ][ segment_index ].name;
        entity.modules[ module_key ][ segment_index ].display_name = (req.body.segment_name) ? req.body.segment_name : entity.modules[ module_key ][ segment_index ].display_name;
        entity.modules[ module_key ][ segment_index ].description = req.body.segment_description;
        if (entity.modules[ module_key ][ segment_index ].type === 'scorecard') {
          entity.modules[ module_key ][ segment_index ].initial_score = req.body.segment_initial_score || entity.modules[ module_key ][ segment_index ].initial_score;
          entity.modules[ module_key ][ segment_index ].output_variable = req.body.segment_output_variable || entity.modules[ module_key ][ segment_index ].output_variable;
        }
        if (entity.modules[ module_key ][ segment_index ].type === 'artificialintelligence') {
          entity.modules[ module_key ][ segment_index ].output_variable = req.body.segment_output_variable || entity.modules[ module_key ][ segment_index ].output_variable;
        }
      }
      return entity;
    } else if (req.query.method === 'editModule' && req.body.lookup_name) {
      let idx;
      let before_module = entity.module_run_order.find((md, index) => {
        if (md.lookup_name === req.body.lookup_name) {
          idx = index;
          return md;
        }
      });
      let new_module_name = req.body.display_name.replace(/\s+/g, '_').toLowerCase();
      let new_module_lookup_name = `${new_module_name}_${req.body.type}_${idx}`;
      let after_module = Object.assign({}, before_module, {
        name: new_module_name,
        description: req.body.description,
        active: req.body.active ? true : false,
        lookup_name: new_module_lookup_name,
        display_name: req.body.display_name,
      });
      let module_detail = entity.modules[ req.body.lookup_name ].slice();
      entity.module_run_order[ idx ] = after_module;
      delete entity.modules[ req.body.lookup_name ];
      entity.modules[ new_module_lookup_name ] = module_detail;
      return entity;
    } else if (req.query.method === 'deleteModule' && req.params[ '0' ]) {
      entity.module_run_order = entity.module_run_order.filter((element, index) => element.lookup_name !== req.params[ '0' ]);
      let new_module_map = {};
      entity.module_run_order.map((md, index) => {
        let new_lookup_name = `${md.name}_${md.type}_${index}`;
        new_module_map[ new_lookup_name ] = entity.modules[ md.lookup_name ];
        md.lookup_name = new_lookup_name;
        return md;
      });
      entity.modules = new_module_map;
      return entity;
    } else {
      req.body = Object.assign({}, entity, req.body);
      return req.body;
    }
  } catch(e) {
    logger.warn('Error formatting req body: ', e);
  }
}

/**
 * Compares before and after and returns array of differences
 * @param  {Object} options options for calculating the difference
 * @param  {*} options.before before change for comparison
 * @param  {*} options.after after change for comparison
 * @param  {Object} options.prop optional property on before and after that is the target of comparison
 * @return {Array} Returns an array of differences e.g. [{before: 'hello', after: 'goodbye'}]
 */
function getDiff(options) {
  let diff = [];
  let { before, after, prop, } = options;
  if (before && after && (typeof before !== typeof after)) {
    return undefined;
  } else {
    if (Array.isArray(before)) {
      before.forEach((beforeElement, index) => {
        beforeElement = prop ? beforeElement[ prop ] : beforeElement;
        let afterElement = prop ? after[ index ][ prop ] : after[ index ];
        beforeElement = beforeElement ? beforeElement.toString() : '';
        afterElement = afterElement ? afterElement.toString() : '';
        if (beforeElement !== afterElement) {
          diff.push({ before: beforeElement, after: afterElement, });
        }
      });
      return diff;
    } else {
      before = before ? before.toString() : '';
      after = after ? after.toString() : '';
      diff.push({ before, after, });
      return diff;
    }
  }
}

async function handleOtherChanges(options) {
  try {
    let { Strategy, before, after, req, } = options;
    if (req.query.method === 'create' && req.body && req.body.module_run_order && req.body.module_run_order.length && (req.body.module_run_order[ req.body.module_run_order.length - 1 ].type === 'artificialintelligence' || req.body.module_run_order[ req.body.module_run_order.length - 1 ].type === 'dataintegration')) {
      let segment_lookup_name = req.body.module_run_order[ req.body.module_run_order.length - 1 ].lookup_name;
      let current_segment = req.body.modules[ segment_lookup_name ][ 0 ];
      let model_type = current_segment.type;
      const inputVarMap = {
        'artificialintelligence': 'system_variable_id',
        'dataintegration': 'input_variable',
      };
      const added_variables = current_segment.inputs.reduce((returnData, input) => {
        if (input.input_type === 'variable' && input[ inputVarMap[ model_type ] ]) returnData.push(input[ inputVarMap[ model_type ] ]);
        return returnData;
      }, []);

      const addOptions = {
        req,
        childId: added_variables,
        childModel: 'standard_variable',
        collection: 'strategies',
        parentId: req.params.id,
      };

      const modelIntegrationAddOptions = {
        req,
        childId: (model_type === 'artificialintelligence') ? [ current_segment.mlmodel_id, ] : [ current_segment.dataintegration_id, ],
        childModel: (model_type === 'artificialintelligence') ? 'standard_mlmodel' : 'standard_dataintegration',
        collection: 'strategies',
        parentId: req.params.id,
      };

      await addParentToChild(addOptions);
      return await addParentToChild(modelIntegrationAddOptions);
    } else if (!req.body.has_population && req.body.prev_conditions) {
      const deletedIds = req.body.prev_conditions.map(rule => rule._id);
      const ruleDeleteOptions = {
        req,
        diff: { deletedIds, },
        childModel: 'standard_rule',
        collection: 'strategies',
        parentId: req.params.id,
      };
      return await deleteParentFromChild(ruleDeleteOptions);
    } else {
      return;
    }
  } catch (e) {
    logger.warn('error in handle Other: ', e);
  }
}

async function handleSegmentDeletion(options) {
  let { before, after, entity, segment_type, index, req, Strategy, Rule, } = options;
  if (entity === 'segments') {
    let rules = [];
    let removed_segment = before.modules[ segment_type ][ index ];
    if (removed_segment.conditions.length) rules.push(...removed_segment.conditions);
    if (removed_segment.ruleset.length) rules.push(...removed_segment.ruleset);

    rules = await Rule.query({ query: { _id: { $in: rules }}});
    const removed_variables = rules.reduce((returnData, rule) => {
      returnData.push(...compileRuleVariableIds({ result: rule, }));
      return returnData;
    }, []);

    const deleteOptions = {
      diff: { deletedIds: removed_variables, },
      req,
      childModel: 'standard_variable',
      collection: 'strategies',
      parentId: req.params.id,
    };
    return await deleteParentFromChild(deleteOptions);
  } else {
    return Promise.reject(new Error('could not delete segment'));
  }
}

async function handleModuleDeletion(options) {
  let { before, after, entity, index, req, Strategy, Rule, } = options;
  try {
    let rules = [];
    if (req.params[ '0' ] && before.modules[ req.params[ '0' ] ].length) {
      let modelIntegrationDeleteOptions;
      let module_name = req.params[ '0' ];
      let removed_module = before.modules[ module_name ];
      let module_type = removed_module[ 0 ].type;
      if (removed_module.length) rules.push(...removed_module.reduce((returnData, segment) => {
        returnData.push(...segment.conditions);
        return returnData;
      }, []));
      if (removed_module.length) rules.push(...removed_module.reduce((returnData, segment) => {
        returnData.push(...segment.ruleset);
        return returnData;
      }, []));
      rules = await Rule.query({ query: { _id: { $in: rules }}});
      const removed_variables = rules.reduce((returnData, rule) => {
        returnData.push(...compileRuleVariableIds({ result: rule, }));
        return returnData;
      }, []);

      if (removed_module[ 0 ] && removed_module[ 0 ].inputs && (module_type === 'artificialintelligence' || module_type === 'dataintegration')) {
        const inputVarMap = {
          'artificialintelligence': 'system_variable_id',
          'dataintegration': 'input_variable',
        };
        const inputVariables = removed_module[ 0 ].inputs.reduce((returnData, input) => {
          if (input.input_type === 'variable' && input[ inputVarMap[ module_type ] ]) returnData.push(input[ inputVarMap[ module_type ] ]);
          return returnData;
        }, []);
        removed_variables.push(...inputVariables);

        modelIntegrationDeleteOptions = {
          req,
          diff: (module_type === 'artificialintelligence') ? { deletedIds: [ removed_module[ 0 ].mlmodel_id, ], } : { deletedIds: [ removed_module[ 0 ].dataintegration_id, ], },
          childModel: (module_type === 'artificialintelligence') ? 'standard_mlmodel' : 'standard_dataintegration',
          collection: 'strategies',
          parentId: req.params.id,
        };
      }

      if (removed_module[ 0 ] && removed_module[ 0 ].outputs && module_type === 'dataintegration') {
        const outputVariables = removed_module[ 0 ].outputs.reduce((returnData, output) => {
          if (output.output_variable) returnData.push(output.output_variable);
          return returnData;
        }, []);
        removed_variables.push(...outputVariables);
      }

      const deleteOptions = {
        diff: { deletedIds: removed_variables, },
        req,
        childModel: 'standard_variable',
        collection: 'strategies',
        parentId: req.params.id,
      };

      if (modelIntegrationDeleteOptions && modelIntegrationDeleteOptions.childModel && modelIntegrationDeleteOptions.childModel !== 'standard_dataintegration') {
        await deleteParentFromChild(deleteOptions);
        return await deleteParentFromChild(modelIntegrationDeleteOptions);
      } else return await deleteParentFromChild(deleteOptions);
    } else {
      return Promise.reject(new Error('could not delete module'));
    }
  } catch (e) {
    return Promise.reject(new Error('could not delete module'));
  }
}

async function handleRuleDeletion(options) {
  let { before, after, entity, segment_type, index, req, Strategy, Rule, } = options;
  if (entity === 'segments') {
    let rules = [];
    let refererArr = req.headers.referer.split('/');
    let module_key = refererArr[ refererArr.length - 2 ];
    let segment_index = refererArr[ refererArr.length - 1 ];
    let removed_rule = (req.query.conditions === 'true')
      ? before.modules[ module_key ][ segment_index ][ 'conditions' ][ index ]
      : before.modules[ module_key ][ segment_index ][ 'ruleset' ][ index ];
    
    removed_rule = await Rule.load({ query: { _id: removed_rule }});
    const removed_variables = compileRuleVariableIds({ result: removed_rule });
    const deleteOptions = {
      diff: { deletedIds: removed_variables, },
      req,
      childModel: 'standard_variable',
      collection: 'strategies',
      parentId: req.params.id,
    };
    return await deleteParentFromChild(deleteOptions);
  } else {
    return Promise.reject(new Error('could not delete segment'));
  }
}

async function handleSegmentAddition(options) {
  try {
    let { before, after, req, Strategy, Rule, } = options;
    let added_variables = [];
    if (req.body[ 'conditions' ]) {
      const conditionRules = await Rule.query({ query: { _id: { $in: req.body[ 'conditions' ] }}});
      added_variables = conditionRules.reduce((returnData, rule) => {
        returnData.push(...compileRuleVariableIds({ result: rule, }));
        return returnData;
      }, []);
    } else if (req.body.rule) {
      const rule = await Rule.load({ query: { _id: req.body.rule }});
      added_variables.push(...compileRuleVariableIds({ result: rule, }));
    }

    let addOptions = {
      req,
      childId: added_variables,
      childModel: 'standard_variable',
      collection: 'strategies',
      parentId: req.params.id,
    };
    return await addParentToChild(addOptions);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function handleModuleCopyChanges(options) {
  try {
    let { before, after, entity, index, req, Strategy, Rule, } = options;
    let { collection, core, id, tabname, parsedUrl, } = findCollectionNameFromReq({ req, });
    let refererArr = req.headers.referer.split('/');
    let module_type = req.body.module[ 0 ].type;
    let modelIntegrationAddOptions;

    let added_rules = req.body.module.reduce((returnData, segment) => {
      returnData.push(...segment.conditions, ...segment.ruleset);
      return returnData;
    }, []);

    added_rules = await Rule.query({ query: { _id: { $in: added_rules }}});
    const added_variables = added_rules.reduce((returnData, rule) => {
      returnData.push(...compileRuleVariableIds({ result: rule, }));
      return returnData;
    }, []);

    if (req.body.module[ 0 ] && req.body.module[ 0 ].inputs && (module_type === 'artificialintelligence' || module_type === 'dataintegration')) {
      let inputVariables;
      const inputVarMap = {
        'artificialintelligence': 'system_variable_id',
        'dataintegration': 'input_variable',
      };
      inputVariables = req.body.module[ 0 ].inputs.reduce((returnData, input) => {
        if (input.input_type === 'variable' && inputVarMap[ module_type ] && input[ inputVarMap[ module_type ] ]) returnData.push(input[ inputVarMap[ module_type ] ]);
        return returnData;
      }, []);
      added_variables.push(...inputVariables);

      modelIntegrationAddOptions = {
        req,
        childId: (module_type === 'artificialintelligence') ? [ req.body.module[ 0 ].mlmodel_id, ] : [ req.body.module[ 0 ].dataintegration_id, ],
        childModel: (module_type === 'artificialintelligence') ? 'standard_mlmodel' : 'standard_dataintegration',
        collection: 'strategies',
        parentId: req.params.id,
      };
    }

    if (req.body.module[ 0 ] && req.body.module[ 0 ].outputs && req.body.module[ 0 ].type === 'dataintegration') {
      const outputVariables = req.body.module[ 0 ].outputs.reduce((returnData, output) => {
        if (output.output_variable) returnData.push(output.output_variable);
        return returnData;
      }, []);
      added_variables.push(...outputVariables);
    }

    const addOptions = {
      req,
      childId: added_variables,
      childModel: 'standard_variable',
      collection: 'strategies',
      parentId: req.params.id,
    };
    if (modelIntegrationAddOptions && modelIntegrationAddOptions.childModel && modelIntegrationAddOptions.childModel !== 'standard_dataintegration') {
      await addParentToChild(addOptions);
      return await addParentToChild(modelIntegrationAddOptions);
    } else return await addParentToChild(addOptions);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function handleSegmentCopyChanges(options) {
  try {
    let { before, after, entity, index, req, Strategy, Rule, } = options;
    let { collection, core, id, tabname, parsedUrl, } = findCollectionNameFromReq({ req, });
    let refererArr = req.headers.referer.split('/');
    let module_key = refererArr[ refererArr.length - 2 ];
    let segment_index = refererArr[ refererArr.length - 1 ];
    let removed_rules = (req.body.segment_type === 'population')
      ? before.modules[ module_key ][ segment_index ][ 'conditions' ]
      : before.modules[ module_key ][ segment_index ][ 'ruleset' ];

    let added_rules = (req.body.segment_type === 'population')
      ? req.body.conditions
      : req.body.ruleset;
    
    added_rules = await Rule.query({ query: { _id: { $in: added_rules }}});
    removed_rules = await Rule.query({ query: { _id: { $in: removed_rules }}});

    const added_variables = added_rules.reduce((returnData, rule) => {
      returnData.push(...compileRuleVariableIds({ result: rule, }));
      return returnData;
    }, []);

    const removed_variables = removed_rules.reduce((returnData, rule) => {
      returnData.push(...compileRuleVariableIds({ result: rule, }));
      return returnData;
    }, []);

    const deleteOptions = {
      req,
      diff: { deletedIds: removed_variables, },
      childModel: 'standard_variable',
      collection: 'strategies',
      parentId: req.params.id,
    };

    const addOptions = {
      req,
      childId: added_variables,
      childModel: 'standard_variable',
      collection: 'strategies',
      parentId: req.params.id,
    };
    await deleteParentFromChild(deleteOptions);
    return await addParentToChild(addOptions);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function handleRequiredVariablesEdit(options) {
  try {
    let { before, after, entity, index, req, Strategy, Rule, } = options;
    let { collection, core, id, tabname, parsedUrl, } = findCollectionNameFromReq({ req, });
    let module_type = before.modules[ tabname ][ 0 ].type;
    let before_variable_inputs = before.modules[ tabname ][ 0 ].inputs || [];
    let after_variable_inputs = after.modules[ tabname ][ 0 ].inputs || [];
    let before_variable_outputs = before.modules[ tabname ][ 0 ].outputs || [];
    let after_variable_outputs = after.modules[ tabname ][ 0 ].outputs || [];
    let removed_variables = [];
    let added_variables = [];

    let inputVarMap = {
      'artificialintelligence': 'system_variable_id',
      'dataintegration': 'input_variable',
      'documentcreation': 'input_variable',
    };

    if (req.query.variable_type === 'output') {
      before_variable_outputs.forEach((before_output, idx) => {
        if (before_output.output_variable && before_output.output_variable !== after_variable_outputs[ idx ].output_variable) {
          removed_variables.push(before_output.output_variable);
        }
      });

      after_variable_outputs.forEach((after_output, idx) => {
        if (after_output.output_variable && after_output.output_variable !== before_variable_outputs[ idx ].output_variable) {
          added_variables.push(after_output.output_variable);
        }
      });
    } else {
      before_variable_inputs.forEach((before_input, idx) => {
        if (before_input.input_type === 'variable' && before_input[ inputVarMap[ module_type ] ] && before_input[ inputVarMap[ module_type ] ] !== after_variable_inputs[ idx ][ inputVarMap[ module_type ] ]) {
          removed_variables.push(before_input[ inputVarMap[ module_type ] ]);
        }
      });

      after_variable_inputs.forEach((after_input, idx) => {
        if (after_input.input_type === 'variable' && after_input[ inputVarMap[ module_type ] ] && (before_variable_inputs[ idx ] === undefined || after_input[ inputVarMap[ module_type ] ] !== before_variable_inputs[ idx ][ inputVarMap[ module_type ] ])) {
          added_variables.push(after_input[ inputVarMap[ module_type ] ]);
        }
      });
    }

    let deleteOptions = {
      req,
      diff: { deletedIds: removed_variables, },
      childModel: 'standard_variable',
      collection: 'strategies',
      parentId: req.params.id,
    };

    let addOptions = {
      req,
      childId: added_variables,
      childModel: 'standard_variable',
      collection: 'strategies',
      parentId: req.params.id,
    };
    await deleteParentFromChild(deleteOptions);
    return await addParentToChild(addOptions);
  } catch (e) {
    return e;
  }
}

async function handleStrategyUpdate(options) {
  let { req, before, after, } = options;
  const Strategy = periodic.datas.get('standard_strategy');
  const Rule = periodic.datas.get('standard_rule');
  let { collection, core, id, tabname, parsedUrl, } = findCollectionNameFromReq({ req, });
  if (req.query.method === 'add' || req.query.method === 'addRule' || req.query.type === 'add') {
    return await handleSegmentAddition({ before, after, req, Strategy, Rule, });
  } else if (req.query.variables === 'required') {
    return await handleRequiredVariablesEdit({ before, after, req, Strategy, });
  } else if (req.query.method === 'deleteRule') {
    let [ entity, segment_type, index, ] = parsedUrl.slice(2);
    return await handleRuleDeletion({ before, after, entity, segment_type, index, req, Strategy, Rule, });
  } else if (req.query.method === 'delete') {
    let [ entity, segment_type, index, ] = parsedUrl.slice(2);
    return await handleSegmentDeletion({ before, after, entity, segment_type, index, req, Strategy, Rule, });
  } else if (req.query.method === 'deleteModule') {
    let [ entity, segment_type, index, ] = parsedUrl.slice(2);
    return await handleModuleDeletion({ before, after, entity, segment_type, index, req, Strategy, Rule, });
  } else if (req.query.method === 'copyModule') {
    let [ entity, segment_type, index, ] = parsedUrl.slice(2);
    return await handleModuleCopyChanges({ before, after, entity, segment_type, index, req, Strategy, Rule, });
  } else if (req.query.method === 'copy') {
    let [ entity, segment_type, index, ] = parsedUrl.slice(2);
    return await handleSegmentCopyChanges({ before, after, entity, segment_type, index, req, Strategy, Rule, });
  } else {
    return await handleOtherChanges({ Rule, Strategy, before, after, req, });
  }
}

/**
 * Coerces field value into a Number if it can be coerced otherwise returns the value in string format
 * @param {String} field_name 
 * @param {String} field_value 
 * @return {Number|String} returns coerced value
 */
function coerceNumericValues(field_name, field_value) {
  if (!isNaN(Number(field_value)) && SKIP_NUMERIC_COERCION.indexOf(field_name) === -1) {
    return Number(field_value);
  } else if (SKIP_NUMERIC_COERCION.indexOf(field_name) !== -1) {
    return field_value.replace(/"/g, '');
  } else {
    return field_value;
  }
}

/**
 * Coerces Rule update/create req.body data to correct data type
 * @param {Object} options 
 * @param {Object} options.req Express Req Object
 * @returns {Object} returns Express Req Object after updating its req.body
 */
function coerceFormData(options) {
  try {
    let { req, } = options;
    let variable_type = (req.body.variable_type && Array.isArray(req.body.variable_type.children) && req.body.variable_type.children[ 1 ]) ? req.body.variable_type.children[ 1 ].props.value : '';
    delete req.body.variable_type;
    let comparatorIsNull = req.body.condition_test === 'IS NULL' || req.body.condition_test === 'IS NOT NULL';
    if (req.body.condition_test === 'RANGE') {
      req.body.state_property_attribute_value_minimum = numeral(req.body.state_property_attribute_value_minimum).value();
      req.body.state_property_attribute_value_maximum = numeral(req.body.state_property_attribute_value_maximum).value();
    } else if (!comparatorIsNull && variable_type === 'Number') {
      req.body.state_property_attribute_value_comparison = numeral(req.body.state_property_attribute_value_comparison).value();
    } else if (!comparatorIsNull && variable_type === 'Boolean') {
      req.body.state_property_attribute_value_comparison = (req.body.state_property_attribute_value_comparison === 'true');
    }
    if (req.body.type === 'output' && req.body.condition_output.weight) {
      req.body.condition_output.annual_interest_rate = numeral(req.body.condition_output.annual_interest_rate).value();
      req.body.condition_output.variable_interest_rate = numeral(req.body.condition_output.variable_interest_rate).value();
      req.body.condition_output.marginal_interest_rate = numeral(req.body.condition_output.marginal_interest_rate).value();
      req.body.condition_output.origination_fee_rate = numeral(req.body.condition_output.origination_fee_rate).value();
      req.body.condition_output.apr = numeral(req.body.condition_output.apr).value();
      req.body.condition_output.term = numeral(req.body.condition_output.term).value();
    } else if (req.body.type === 'scorecard' && req.body.condition_output.weight) {
      req.body.condition_output.weight = numeral(req.body.condition_output.weight).value();
    }
    return req;

  } catch (e) {
    return options.req;
  }
}

/**
 * Helper function that modifies latest_version of any document while creating a new version
 * 
 * @param {String} options.collection Current collection name
 * @param {String} options.title Title of current document
 */
function handlePreviousLatestVersion(options) {
  try {
    let { title, collection, organization } = options;
    let model = `standard_${pluralize.singular(collection)}`;
    let Model = periodic.datas.get(model);
    let query = { title: title, organization };
    let sort = { version: -1, };
    return Model.query({ query, sort, })
      .then(result => {
        let prevLatest = result[ 1 ];
        prevLatest.latest_version = false;
        prevLatest.save();
      })
      .catch(Promise.reject);
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Helper function that modifies required_input_variables or required_calculated_variables arrays on variable collection when creating new version of a variable
 * 
 * @param {Object} options.result The original document in the db 
 * @param {String} options.collection Current collection name
 * @param {String} options.prevId id of previous version of current variable
 * @returns {Object} result Updated result object
 */
function handleVariablesArr(options) {
  try {
    let { result, collection, prevId, } = options;
    if (collection === 'variables') {
      if (result.type === 'Input') {
        result.required_input_variables.splice(result.required_input_variables.indexOf(prevId), 1);
        result.required_input_variables = [ ...result.required_input_variables, result._id, ];
      } else if (result.type === 'Calculated') {
        result.required_calculated_variables.splice(result.required_calculated_variables.indexOf(prevId), 1);
        result.required_calculated_variables = [ ...result.required_calculated_variables, result._id, ];
      }
      return result;
    } else {
      return result;
    }
  } catch (e) {
    logger.warn('Error in handlevariablsarr: ', e);
    return Promise.reject(e);
  }
}

/**
 * 
 * Formats updatedoc combining original document with req.body
 * @param {Object} options.req Express req object
 * @param {Object} options.originaldoc The original document in the db 
 */
function formatUpdateDoc(options) {
  let { req, originaldoc, } = options;
  let { collection, core, id, tabname, parsedUrl, } = findCollectionNameFromReq({ req, });
  if (collection === 'rules') {
    if (req.body.condition_test === 'IS NULL' || req.body.condition_test === 'IS NOT NULL') {
      originaldoc.state_property_attribute_value_minimum = undefined;
      originaldoc.state_property_attribute_value_maximum = undefined;
      originaldoc.state_property_attribute_value_comparison = undefined;
    } else if (req.body.condition_test === 'RANGE') {
      originaldoc.state_property_attribute_value_comparison = undefined;
    } else {
      originaldoc.state_property_attribute_value_minimum = undefined;
      originaldoc.state_property_attribute_value_maximum = undefined;
    }
  }
}

function modelSave(options) {
  let { Model, updatedoc, id, req, } = options;
  Model.load({ query: { _id: id, }, })
    .then(result => {
      formatUpdateDoc({ req, originaldoc: result, });
      result.save();
    })
    .catch(e => Promise.reject(e));
}

/**
 * Formats the status for display
 * 
 * @param {Boolean} options.locked boolean describing if a document is locked or not locked
 * @param {Boolean} options.active boolean describing if a document is active or not active
 * @param {String} options.collection current document collection name
 * @returns {String} final_status status to be displayed
 */
function handleStatusDisplay(options) {
  try {
    let final_status;
    let locked;
    let active;
    if (options.collection === 'strategies' || options.strategyDisplay) {
      active = (options.status === 'active')
        ? 'Active'
        : (options.status === 'testing')
          ? 'Testing'
          : 'Inactive';
      locked = (options.locked) ? 'Locked' : 'Not Locked';
      final_status = `${active} | ${locked}`;
    } else {
      final_status = (options.locked) ? 'Locked' : 'Not Locked';
    }
    return final_status;
  } catch (e) {
    return Promise.reject(e);
  }
}

function compileStrategyRuleIds(options) {
  try {
    let { result, } = options;
    if (result) {
      let moduleMap = result.modules;
      let all_rules = result.module_run_order.reduce((returnData, module_run_element) => {
        let segment_rules = [];
        if (moduleMap[ module_run_element.lookup_name ].length) {
          moduleMap[ module_run_element.lookup_name ].forEach(seg => segment_rules.push(...seg.conditions, ...seg.ruleset));
          returnData.push(...segment_rules);
          return returnData;
        } else {
          return returnData;
        }
      }, []);
      return all_rules;
    } else {
      return [];
    }
  } catch (e) {
    return Promise.reject(e);
  }
}

function compileRuleVariableIds(options) {
  try {
    let { result, } = options;
    const variableMap = (periodic && periodic.locals && periodic.locals.app && periodic.locals.app.variableMap) ? periodic.locals.app.variableMap : {};
    if (result && (result.multiple_rules || result.condition_output) && Array.isArray(result.multiple_rules) && Array.isArray(result.condition_output)) {
      let all_variables = [];
      result.multiple_rules.forEach(rule => {
        if (variableMap[ rule ]) rule = variableMap[ rule ];
        if (rule.state_property_attribute) {
          if (typeof rule.state_property_attribute === 'string' || !rule.state_property_attribute._id) {
            all_variables.push(rule.state_property_attribute.toString());
          } else {
            all_variables.push(rule.state_property_attribute._id.toString());
          }
        }
        if (rule.condition_test === 'RANGE' && rule.state_property_attribute_value_minimum_type === 'variable') {
          if (typeof rule.state_property_attribute_value_minimum === 'string') {
            all_variables.push(rule.state_property_attribute_value_minimum);
          } else {
            all_variables.push(rule.state_property_attribute_value_minimum._id.toString());
          }
        }
        if (rule.condition_test === 'RANGE' && rule.state_property_attribute_value_maximum_type === 'variable') {
          if (typeof rule.state_property_attribute_value_maximum === 'string') {
            all_variables.push(rule.state_property_attribute_value_maximum);
          } else {
            all_variables.push(rule.state_property_attribute_value_maximum._id.toString());
          }
        }
        if (rule.state_property_value_comparison && rule.state_property_value_comparison_type === 'variable') {
          if (typeof rule.state_property_value_comparison === 'string') {
            all_variables.push(rule.state_property_value_comparison);
          } else {
            all_variables.push(rule.state_property_value_comparison._id.toString());
          }
        }
      });

      result.condition_output.forEach(rule => {
        if (rule.variable_id) all_variables.push(rule.variable_id);
        if (rule.value_type === 'variable' && rule.value) all_variables.push(rule.value);
      });

      if ((result.calculation_inputs && result.calculation_inputs.length) || (result.calculation_outputs && result.calculation_outputs.length)) {
        let calculation_inputs = result.calculation_inputs || [];
        let calculation_outputs = result.calculation_outputs || [];
        all_variables.push(...calculation_inputs, ...calculation_outputs);
      }
      return all_variables;
    } else {
      return [];
    }
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Formats Table Cells that include 'ANDs' and 'ORs'
 * 
 * @param [Object] options.rules rules array
 * @param {String} options.field_name column name for each rule
 * @returns components to populate table cells with 'ANDs' and 'ORs'
 */
function formatRulesTableCell(options) {
  try {
    let { rules, field_name, currentRule, } = options;
    return rules.reduce((returnData, rule, idx) => {
      if (idx === rules.length - 1) {
        returnData.push({
          component: 'div',
          props: {
            style: {
              minHeight: '18px',
            },
          },
          children: rule[ field_name ],
        });
        return returnData;
      } else {
        returnData.push({
          component: 'div',
          props: {
            style: {
              minHeight: '18px',
            },
          },
          children: rule[ field_name ],
        }, {
            component: 'span',
            props: {
              style: {
                fontStyle: 'italic',
                color: DECISION_CONSTANTS.SINGLE_RULE_MODULES[ currentRule.type ] ? 'white' : styles.colors.gray,
                minHeight: '18px',
              },
            },
            children: (currentRule.rule_type && currentRule.rule_type !== 'simple') ? currentRule.rule_type.toLowerCase() : 'and',
          });
        return returnData;
      }
    }, []);
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Formats Table Cells that do not include 'ANDs' and 'ORs'
 * 
 * @param [Object] options.rules rules array
 * @param {String} options.field_name column name for each rule
 * @returns components to populate table cells without 'ANDs' and 'ORs'
 */
function formatRulesTableCellNoAndOr(options) {
  try {
    let { rules, field_name, } = options;
    return rules.reduce((returnData, rule, idx) => {
      if (idx === rules.length - 1) {
        returnData.push({
          component: 'div',
          props: {
            style: {
              minHeight: '18px',
            },
          },
          children: rule[ field_name ],
        });
        return returnData;
      } else {
        returnData.push({
          component: 'div',
          props: {
            style: {
              minHeight: '18px',
            },
          },
          children: rule[ field_name ],
        }, {
            component: 'div',
            props: {
              style: {
                minHeight: '18px',
              },
            },
            children: '',
          });
        return returnData;
      }
    }, []);
  } catch (e) {
    return Promise.reject(e);
  }
}
/**
 * Formats Table Cells that include 'ANDs' and 'ORs'
 * 
 * @param [Object] options.rules rules array
 * @param {String} options.field_name column name for each rule
 * @returns components to populate table cells with 'ANDs' and 'ORs'
 */
function formatDataTableRulesTableCell(options) {
  try {
    let { rules, field_name, currentRule, } = options;
    return {
      component: 'div',
      children: rules.reduce((returnData, rule, idx) => {
        if (idx === rules.length - 1) {
          returnData.push({
            component: 'div',
            props: {
              style: {
                minHeight: '18px',
              },
            },
            children: rule[ field_name ],
          });
          return returnData;
        } else {
          returnData.push({
            component: 'div',
            props: {
              style: {
                minHeight: '18px',
              },
            },
            children: rule[ field_name ],
          }, {
              component: 'span',
              props: {
                style: {
                  fontStyle: 'italic',
                  color: DECISION_CONSTANTS.SINGLE_RULE_MODULES[ currentRule.type ] ? 'white' : styles.colors.gray,
                  minHeight: '18px',
                },
              },
              children: (currentRule.rule_type && currentRule.rule_type !== 'simple') ? currentRule.rule_type.toLowerCase() : 'and',
            });
          return returnData;
        }
      }, []),
    };
  } catch (e) {
    return Promise.reject(e);
  }
}
/**
 * Formats Table Cells for Variable, Comparison and Value Columns with multilines
 * 
 * @param [Object] options.rules rules array
 * @param {String} options.field_name column name for each rule
 * @returns components to populate table cells with Variable, Comparison and Value Columns
 */
function formatVariableComparisonValueTableCell(options) {
  try {
    let { rules, field_name, currentRule, } = options;
    return {
      component: 'Columns',
      props: {
        isMultiline: true,
        responsive: 'isMobile',
        style: {
          margin: 0,
          padding: '10px 0',
        },
      },
      children: rules.reduce((returnData, rule, idx) => {
        if (idx === rules.length - 1) {
          returnData.push({
            component: 'Column',
            props: {
              size: 'is5',
              style: {
                padding: 0,
                paddingRight: '5px',
              },
            },
            children: rule[ field_name[ 0 ] ],
          }, {
              component: 'Column',
              props: {
                size: 'is3',
                style: {
                  padding: 0,
                  paddingRight: '5px',
                },
              },
              children: rule[ field_name[ 1 ] ],
            }, {
              component: 'Column',
              props: {
                size: 'is4',
                style: {
                  padding: 0,
                },
              },
              children: rule[ field_name[ 2 ] ],
            });
          return returnData;
        } else {
          returnData.push({
            component: 'Column',
            props: {
              size: 'is5',
              style: {
                padding: 0,
                paddingRight: '5px',
              },
            },
            children: [ {
              component: 'div',
              children: rule[ field_name[ 0 ] ],
            }, ],
          }, {
              component: 'Column',
              props: {
                size: 'is3',
                style: {
                  padding: 0,
                  paddingRight: '5px',
                },
              },
              children: [ {
                component: 'div',
                children: rule[ field_name[ 1 ] ],
              }, ],
            }, {
              component: 'Column',
              props: {
                size: 'is4',
                style: {
                  padding: 0,
                },
              },
              children: [ {
                component: 'div',
                children: rule[ field_name[ 2 ] ],
              }, ],
            }, {
              component: 'Column',
              props: {
                size: 'is12',
                style: {
                  padding: 0,
                },
              },
              children: [ {
                component: 'span',
                props: {
                  style: {
                    fontStyle: 'italic',
                    color: DECISION_CONSTANTS.SINGLE_RULE_MODULES[ currentRule.type ] ? 'white' : styles.colors.gray,
                    minHeight: '18px',
                  },
                },
                children: (currentRule.rule_type && currentRule.rule_type !== 'simple') ? currentRule.rule_type.toLowerCase() : 'and',
              }, ],
            });
          return returnData;
        }
      }, []),
    };
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Formats Table Cells that do not include 'ANDs' and 'ORs'
 * 
 * @param [Object] options.rules rules array
 * @param {String} options.field_name column name for each rule
 * @returns components to populate table cells without 'ANDs' and 'ORs'
 */
function formatDataTableRulesTableCellNoAndOr(options) {
  try {
    let { rules, field_name, } = options;
    return {
      component: 'div',
      children: rules.reduce((returnData, rule, idx) => {
        if (idx === rules.length - 1) {
          returnData.push({
            component: 'div',
            props: {
              style: {
                minHeight: '18px',
              },
            },
            children: rule[ field_name ],
          });
          return returnData;
        } else {
          returnData.push({
            component: 'div',
            props: {
              style: {
                minHeight: '18px',
              },
            },
            children: rule[ field_name ],
          }, {
              component: 'div',
              props: {
                style: {
                  minHeight: '18px',
                },
              },
              children: '',
            });
          return returnData;
        }
      }, []),
    };
  } catch (e) {
    return Promise.reject(e);
  }
}

function formatPricingConditionOutputs(options) {
  try {
    let { condition_output, } = options;
    if (Array.isArray(condition_output)) {
      return condition_output.reduce((returnData, condition, idx) => {
        returnData.push({
          component: 'div',
          props: {},
          children: condition_output[ idx ],
        });
        return returnData;
      }, []);
    }
    return condition_output.reduce((returnData, condition, idx) => {
      returnData.push({
        component: 'div',
        props: {},
        children: condition_output[ idx ],
      });
      return returnData;
    }, []);
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Generates responsive form from the backend for rule update history detail page
 * 
 * @param [Object] options.leftRulesConfigs Left card configurations array
 * @param [Object] options.rightRulesConfigs Right card configurations array
 * @returns responsive form
 */
function generateRuleUpdateForm({ leftRulesConfigs, rightRulesConfigs, leftConditionsConfigs, rightConditionsConfigs, }) {
  try {
    if (leftRulesConfigs || rightRulesConfigs || leftConditionsConfigs || rightConditionsConfigs) {
      return [ {
        component: 'ResponsiveForm',
        props: {
          flattenFormData: true,
          footergroups: false,
          onSubmit: {},
          formgroups: [
            __ruleUpdateOverview(),
            __ruleUpdateDoubleCard({ leftRulesConfigs, rightRulesConfigs, }),
          ],
        },
        asyncprops: {
          formdata: [ 'strategydata', 'data', ],
        },
      }, ];
    }
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Generates rule update history detail overview card
 * 
 * @returns overview card 
 */
function __ruleUpdateOverview() {
  return {
    gridProps: {
      key: randomKey(),
    },
    card: {
      twoColumns: true,
      props: cardprops({
        cardTitle: 'Update Overview',
      }),
    },
    formElements: [ formElements({
      twoColumns: true,
      left: [
        {
          label: 'Strategy Name',
          name: 'entity_display_title',
          passProps: {
            state: 'isDisabled',
          },
        }, {
          label: 'Module Type',
          name: 'change_type',
          passProps: {
            state: 'isDisabled',
          },
        },
      ],
      right: [ {
        label: 'Rule Type',
        name: 'display_rule_type',
        passProps: {
          state: 'isDisabled',
        },
      }, {
        label: 'Updated',
        name: 'formattedUpdatedAt',
        passProps: {
          state: 'isDisabled',
        },
      }, ],
    }), ],
  };
}

/**
 * Generates rule update double card for rule update history detail page
 * 
 * @param [Object] options.leftRulesConfigs Left card configurations array
 * @param [Object] options.rightRulesConfigs Right card configurations array
 * @returns double card with left and right formElements populated
 */
function __ruleUpdateDoubleCard(options) {
  let { leftRulesConfigs, rightRulesConfigs, } = options;
  let multipleRulesFormElements = formElements({
    twoColumns: true,
    doubleCard: true,
    left: options.leftRulesConfigs.map(config => {
      return {
        label: config.label || '',
        value: config.value || config.name,
        type: config.type || 'text',
        passProps: Object.assign({}, {
          className: '__re-bulma_control',
          state: 'isDisabled',
        }, config.passProps),
      };
    }),
    right: options.rightRulesConfigs.map(config => {
      return {
        label: config.label || '',
        value: config.value || config.name,
        type: config.type || 'text',
        passProps: Object.assign({}, {
          className: '__re-bulma_control',
          state: 'isDisabled',
        }, config.passProps),
      };
    }),
  });

  return {
    gridProps: {
      key: randomKey(),
    },
    card: {
      doubleCard: true,
      leftDoubleCardColumn: {
        style: {
          display: 'flex',
        },
      },
      rightDoubleCardColumn: {
        style: {
          display: 'flex',
        },
      },
      leftCardProps: cardprops({
        cardTitle: 'Rule (Before Change)',
        cardStyle: {
          marginBottom: 0,
        },
      }),
      rightCardProps: cardprops({
        cardTitle: 'Rule (After Change)',
        cardStyle: {
          marginBottom: 0,
        },
      }),
    },
    formElements: [
      multipleRulesFormElements,
    ],
  };
}



function __strategyUpdateDoubleCard(options) {
  let { leftTitle, leftStrategyConfigs, rightTitle, rightStrategyConfigs, } = options;
  let moduleTypeMap = {
    'artificialintelligence': 'Artificial Intelligence',
    'requirements': 'Requirements Rules',
    'dataintegration_input': 'Data Integration - Required',
    'dataintegration_output': 'Data Integration - Received',
    'assignments': 'Simple Outputs',
    'calculations': 'Calculation Scripts',
    'email': 'Send Email',
    'textmessage': 'Send Text Message',
    'output': 'Rule-Based Outputs',
    'scoring': 'Scoring Model',
    'documentocr': 'Document OCR',
    'documentcreation': 'Document Creation',
  };
  let headers = CONSTANTS.UPDATE_HISTORY_HEADERS[ leftTitle.toLowerCase() ];
  let strategyFormElements = formElements({
    twoColumns: true,
    doubleCard: true,
    left: leftStrategyConfigs.map(config => {
      return {
        label: config.label || '',
        name: config.value || config.name,
        type: config.type || 'text',
        flattenRowData: true,
        useInputRows: false,
        addNewRows: false,
        headers,
        passProps: Object.assign({}, {
          className: '__re-bulma_control',
          state: 'isDisabled',
        }, config.passProps),
      };
    }),
    right: rightStrategyConfigs.map(config => {
      return {
        label: config.label || '',
        name: config.value || config.name,
        type: config.type || 'text',
        flattenRowData: true,
        useInputRows: false,
        addNewRows: false,
        headers,
        passProps: Object.assign({}, {
          className: '__re-bulma_control',
          state: 'isDisabled',
        }, config.passProps),
      };
    }),
  });

  return {
    gridProps: {
      key: randomKey(),
    },
    card: {
      doubleCard: true,
      leftDoubleCardColumn: {
        style: {
          display: 'flex',
        },
      },
      rightDoubleCardColumn: {
        style: {
          display: 'flex',
        },
      },
      leftCardProps: cardprops({
        cardTitle: `${(moduleTypeMap[ leftTitle ]) ? moduleTypeMap[ leftTitle ] : capitalize(leftTitle)} (Before Change)`,
        cardStyle: {
          marginBottom: 0,
        },
      }),
      rightCardProps: cardprops({
        cardTitle: `${(moduleTypeMap[ rightTitle ]) ? moduleTypeMap[ rightTitle ] : capitalize(rightTitle)} (After Change)`,
        cardStyle: {
          marginBottom: 0,
        },
      }),
    },
    formElements: [
      strategyFormElements,
    ],
  };
}

function __strategyUpdateOverview() {
  return {
    gridProps: {
      key: randomKey(),
    },
    card: {
      twoColumns: true,
      props: cardprops({
        cardTitle: 'Update Overview',
      }),
    },
    formElements: [ formElements({
      twoColumns: true,
      left: [
        {
          label: 'Strategy Name',
          name: 'after.display_title',
          passProps: {
            state: 'isDisabled',
          },
        }, {
          label: 'Version Number',
          name: 'after.version',
          passProps: {
            state: 'isDisabled',
          },
        },
      ],
      right: [ {
        label: 'Updated Date',
        name: 'after.updatedat',
        passProps: {
          state: 'isDisabled',
        },
      }, {
        label: 'Updated By',
        name: 'after.user.updater',
        passProps: {
          state: 'isDisabled',
        },
      }, ],
    }), ],
  };
}

function createStrategyUpdateHistoryDetailWithInputsAndOutputs(options) {
  try {
    let { before, after, } = options;

    return [ {
      component: 'div',
      props: {
        style: {
          display: 'flex',
          alignItems: 'flex-start',
        },
      },
      children: [ {
        component: 'ResponsiveNavBar',
        asyncprops: {
          navData: [ 'strategydata', 'data', 'all_segments', ],
          _id: [ 'strategydata', 'data', '_id', ],
          toggleData: [ 'strategydata', 'data', 'toggle_data', ],
          navSections: [ 'strategydata', 'data', 'nav_sections', ],
        },
        props: {
          params: [ { key: ':id', val: '_id', }, { 'key': ':index', 'val': 'index', }, ],
          accordionProps: {
            className: 'strategy-sidebar',
            style: {
              flex: '0 0 auto',
            },
          },
          sectionProps: {
            fitted: true,
          },
        },
      }, {
        component: 'ResponsiveForm',
        props: {
          flattenFormData: true,
          footergroups: false,
          onSubmit: {},
          formgroups: [
            __strategyUpdateOverview(),
            __strategyUpdateDoubleCard({ leftTitle: `${before.type}_input`, leftStrategyConfigs: [ { name: 'before_inputs', type: 'datatable', }, ], rightTitle: `${after.type}_input`, rightStrategyConfigs: [ { name: 'after_inputs', type: 'datatable', }, ], }),
            __strategyUpdateDoubleCard({ leftTitle: `${before.type}_output`, leftStrategyConfigs: [ { name: 'before_outputs', type: 'datatable', }, ], rightTitle: `${after.type}_output`, rightStrategyConfigs: [ { name: 'after_outputs', type: 'datatable', }, ], }),
            __strategyUpdateDoubleCard({ leftTitle: 'Population', leftStrategyConfigs: [ { name: 'before_conditions', type: 'datatable', }, ], rightTitle: 'Population', rightStrategyConfigs: [ { name: 'after_conditions', type: 'datatable', }, ], }),
          ],
        },
        asyncprops: {
          formdata: [ 'strategydata', 'data', ],
        },
      }, ],
    }, ];
  } catch (e) {
    return Promise.reject(e);
  }
}

function createStrategyUpdateHistoryDetailWithOutputs(options) {
  try {
    let { before, after, } = options;

    return [ {
      component: 'div',
      props: {
        style: {
          display: 'flex',
          alignItems: 'flex-start',
        },
      },
      children: [ {
        component: 'ResponsiveNavBar',
        asyncprops: {
          navData: [ 'strategydata', 'data', 'all_segments', ],
          _id: [ 'strategydata', 'data', '_id', ],
          toggleData: [ 'strategydata', 'data', 'toggle_data', ],
          navSections: [ 'strategydata', 'data', 'nav_sections', ],
        },
        props: {
          params: [ { key: ':id', val: '_id', }, { 'key': ':index', 'val': 'index', }, ],
          accordionProps: {
            className: 'strategy-sidebar',
            style: {
              flex: '0 0 auto',
            },
          },
          sectionProps: {
            fitted: true,
          },
        },
      }, {
        component: 'ResponsiveForm',
        props: {
          flattenFormData: true,
          footergroups: false,
          onSubmit: {},
          formgroups: [
            __strategyUpdateOverview(),
            __strategyUpdateDoubleCard({ leftTitle: before.type, leftStrategyConfigs: [ { name: 'before_outputs', type: 'datatable', }, ], rightTitle: after.type, rightStrategyConfigs: [ { name: 'after_outputs', type: 'datatable', }, ], }),
            __strategyUpdateDoubleCard({ leftTitle: 'Population', leftStrategyConfigs: [ { name: 'before_conditions', type: 'dndtable', }, ], rightTitle: 'Population', rightStrategyConfigs: [ { name: 'after_conditions', type: 'dndtable', }, ], }),
          ],
        },
        asyncprops: {
          formdata: [ 'strategydata', 'data', ],
        },
      }, ],
    }, ];
  } catch (e) {
    return Promise.reject(e);
  }
}

function createStrategyUpdateHistoryDetailWithInputs(options) {
  try {
    let { before, after, } = options;

    return [ {
      component: 'div',
      props: {
        style: {
          display: 'flex',
          alignItems: 'flex-start',
        },
      },
      children: [ {
        component: 'ResponsiveNavBar',
        asyncprops: {
          navData: [ 'strategydata', 'data', 'all_segments', ],
          _id: [ 'strategydata', 'data', '_id', ],
          toggleData: [ 'strategydata', 'data', 'toggle_data', ],
          navSections: [ 'strategydata', 'data', 'nav_sections', ],
        },
        props: {
          params: [ { key: ':id', val: '_id', }, { 'key': ':index', 'val': 'index', }, ],
          accordionProps: {
            className: 'strategy-sidebar',
            style: {
              flex: '0 0 auto',
            },
          },
          sectionProps: {
            fitted: true,
          },
        },
      }, {
        component: 'ResponsiveForm',
        props: {
          flattenFormData: true,
          footergroups: false,
          onSubmit: {},
          formgroups: [
            __strategyUpdateOverview(),
            __strategyUpdateDoubleCard({ leftTitle: before.type, leftStrategyConfigs: [ { name: 'before_inputs', type: 'datatable', }, ], rightTitle: after.type, rightStrategyConfigs: [ { name: 'after_inputs', type: 'datatable', }, ], }),
            __strategyUpdateDoubleCard({ leftTitle: 'Population', leftStrategyConfigs: [ { name: 'before_conditions', type: 'dndtable', }, ], rightTitle: 'Population', rightStrategyConfigs: [ { name: 'after_conditions', type: 'dndtable', }, ], }),
          ],
        },
        asyncprops: {
          formdata: [ 'strategydata', 'data', ],
        },
      }, ],
    }, ];
  } catch (e) {
    return Promise.reject(e);
  }
}

function createStrategyUpdateHistoryDetailWithRules(options) {
  try {
    let { before, after, } = options;
    return [ {
      component: 'div',
      props: {
        style: {
          display: 'flex',
          alignItems: 'flex-start',
        },
      },
      children: [ {
        component: 'ResponsiveNavBar',
        asyncprops: {
          navData: [ 'strategydata', 'data', 'all_segments', ],
          _id: [ 'strategydata', 'data', '_id', ],
          toggleData: [ 'strategydata', 'data', 'toggle_data', ],
          navSections: [ 'strategydata', 'data', 'nav_sections', ],
        },
        props: {
          params: [ { key: ':id', val: '_id', }, { 'key': ':index', 'val': 'index', }, ],
          accordionProps: {
            className: 'strategy-sidebar',
            style: {
              flex: '0 0 auto',
            },
          },
          sectionProps: {
            fitted: true,
          },
        },
      }, {
        component: 'ResponsiveForm',
        props: {
          flattenFormData: true,
          footergroups: false,
          onSubmit: {},
          formgroups: [
            __strategyUpdateOverview(),
            __strategyUpdateDoubleCard({ leftTitle: before.type, leftStrategyConfigs: [ { name: 'before_ruleset', type: 'datatable', }, ], rightTitle: after.type, rightStrategyConfigs: [ { name: 'after_ruleset', type: 'datatable', }, ], }),
            __strategyUpdateDoubleCard({ leftTitle: 'Population', leftStrategyConfigs: [ { name: 'before_conditions', type: 'datatable', }, ], rightTitle: 'Population', rightStrategyConfigs: [ { name: 'after_conditions', type: 'datatable', }, ], }),
          ],
        },
        asyncprops: {
          formdata: [ 'strategydata', 'data', ],
        },
      }, ],
    }, ];
  } catch (e) {
    return Promise.reject(e);
  }
}

function createStrategyUpdateHistoryDetailWithoutRules(options) {
  try {
    return [ {
      component: 'ResponsiveForm',
      props: {
        flattenFormData: true,
        footergroups: false,
        onSubmit: {},
        formgroups: [
          __strategyUpdateOverview(),
        ],
      },
      asyncprops: {
        formdata: [ 'strategydata', 'data', ],
      },
    }, {
      component: 'div',
      props: {
        style: {
          display: 'flex',
          alignItems: 'stretch',
        },
      },
      children: [ {
        component: 'ResponsiveCard',
        props: cardprops({
          cardTitle: 'Process (Before Change)',
          cardStyle: {
            marginRight: '10px',
          },
        }),
        children: [ {
          component: 'ResponsiveTable',
          props: {
            flattenRowData: true,
            limit: 20,
            hasPagination: false,
            // simplePagination: true,
            headerLinkProps: {
              style: {
                textDecoration: 'none',
                // color: styles.colors.darkGreyText,
              },
            },
            headers: [ {
              label: 'Module Type',
              sortid: 'type',
              sortable: false,
            }, {
              label: 'Module Name',
              sortid: 'display_name',
              sortable: false,
            }, {
              label: 'Population Segment Name',
              sortid: 'segment_name',
              sortable: false,
            }, ],
          },
          asyncprops: {
            'rows': [
              'strategydata', 'data', 'before', 'modules_display',
            ],
          },
        },
        ],
      }, {
        component: 'ResponsiveCard',
        props: cardprops({
          cardTitle: 'Process (After Change)',
          cardStyle: {},
        }),
        children: [ {
          component: 'ResponsiveTable',
          props: {
            flattenRowData: true,
            limit: 20,
            hasPagination: false,
            // simplePagination: true,
            headerLinkProps: {
              style: {
                textDecoration: 'none',
                // color: styles.colors.darkGreyText,
              },
            },
            headers: [ {
              label: 'Module Type',
              sortid: 'type',
              sortable: false,
            }, {
              label: 'Module Name',
              sortid: 'display_name',
              sortable: false,
            }, {
              label: 'Population Segment Name',
              sortid: 'segment_name',
              sortable: false,
            }, ],
          },
          asyncprops: {
            'rows': [
              'strategydata', 'data', 'after', 'modules_display',
            ],
          },
        },
        ],
      }, ],
    }, ];
  } catch (e) {
    return Promise.reject(e);
  }
}

function checkIfVariable(options) {
  try {
    let { value, type, variablesMap, test, data_type, } = options;
    if (!value && value !== undefined) return value.toString();
    if (value === undefined) return '';
    if (variablesMap && type === 'variable' && variablesMap[ value ]) {
      if (test === 'IN') return variablesMap[ value ].display_title.join(';');
      else return variablesMap[ value ].display_title;
    } else if (test === 'IN') {
      return value.join(';');
    } else if (typeof value === 'string' && moment(value, moment.ISO_8601, true).isValid()) {
      return transformhelpers.formatDateNoTime(value);
    } else if ([ 'javascript', ].indexOf(type) > -1) {
      return value;
    } else {
      return value || '';
    }
  } catch (e) {
    return Promise.reject(e);
  }
}

function buildCodeTabs(options) {
  let { label, mode, asyncprops, thisprops, edit, } = options;
  asyncprops = asyncprops ? asyncprops : {};
  thisprops = thisprops ? thisprops : {};
  return {
    name: label,
    layout: {
      component: 'ResponsiveForm',
      asyncprops,
      thisprops,
      props: {
        footergroups: false,
        useFormOptions: false,
        useDynamicData: true,
        onSubmit: 'func:window.calcFormSubmit',
        hiddenFields: [ {
          form_name: 'rule*0*state_property_attribute_value_comparison_type',
          form_static_val: mode,
        }, ],
        formgroups: [ {
          gridProps: {
            key: randomKey(),
            className: '__dynamic_form_elements',
          },
          formElements: [ {
            type: 'code',
            name: 'rule*0*state_property_attribute_value_comparison',
            codeMirrorProps: {
              options: {
                mode,
              },
            },
          }, ],
        },
        {
          gridProps: {
            key: randomKey(),
            className: 'modal-footer-btns',
          },
          formElements: [ {
            type: 'submit',
            value: (options.edit) ? 'SAVE CHANGES' : 'ADD CALCULATION SCRIPT',
            passProps: {
              color: 'isPrimary',
            },
            layoutProps: {
              style: {
                textAlign: 'center',
                padding: 0,
              },
            },
          }, ],
        },
        ],
      },
    },
  };
}

function generateCalculationForm(options) {
  let { state_property_attribute, variable_types, required_calculation_variables, } = options;
  return [ {
    component: 'ResponsiveForm',
    asyncprops: {
      formdata: [ 'pagedata', 'data', ],
    },
    hasWindowFunc: true,
    props: {
      footergroups: false,
      useFormOptions: false,
      useDynamicData: true,
      ref: 'func:window.addRef',
      validations: [ {
        name: 'rule*0*state_property_attribute',
        constraints: {
          'rule*0*state_property_attribute': {
            presence: {
              message: '^Output Variable is required.',
            },
          },
        },
      }, ],
      hiddenFields: [ {
        form_name: 'type',
        form_static_val: 'calculations',
      }, {
        form_name: 'rule*0*condition_test',
        form_static_val: 'EQUAL',
      }, {
        form_name: 'rule_type',
        form_static_val: 'simple',
      }, {
        form_name: 'rule*0*state_property_attribute',
        form_val: 'rule*0*state_property_attribute',
      }, {
        form_name: 'rule*0*state_property_attribute_value_comparison_type',
        form_val: 'rule*0*state_property_attribute_value_comparison_type',
      }, {
        form_name: 'rule*0*state_property_attribute_value_comparison',
        form_val: 'rule*0*state_property_attribute_value_comparison',
      }, {
        form_name: 'required_calculation_variables',
        form_val: 'required_calculation_variables',
      }, ],
      onSubmit: {
        url: '/decision/api/standard_strategies/:id/:name/:segment_index/createRule?format=json&method=addRule',
        params: [
          { 'key': ':id', 'val': 'id', }, { 'key': ':name', 'val': 'pathname.4', }, { 'key': ':segment_index', 'val': 'pathname.5', },
        ],
        options: {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        },
        success: true,
        successCallback: 'func:this.props.hideModal',
        successProps: 'last',
        responseCallback: 'func:this.props.refresh',
      },
      formgroups: [ {
        gridProps: {
          key: randomKey(),
          className: '__dynamic_form_elements',
        },
        formElements: [ {
          name: 'rule*0*state_property_attribute',
          value: '',
          errorIconRight: true,
          label: 'Output Variable',
          validateOnChange: true,
          errorIcon: 'fa fa-exclamation',
          validIcon: 'fa fa-check',
          // disableOnChange: true,
          customOnChange: 'func:window.calculationDropdownOnChange',
          type: 'remote_dropdown',
          passProps: {
            emptyQuery: true,
            search: true,
            multiple: false,
            debounce: 250,
            searchProps: {
              baseUrl: '/decision/api/variable_dropdown?type=Output',
              limit: 100,
              sort: 'display_title',
              response_field: 'variable_dropdown',
            },
          },
          layoutProps: {
            style: {
              width: '70%',
              paddingRight: '7px',
            },
          },
          options: state_property_attribute,
        }, {
          type: 'layout',
          passProps: {
            className: '__re-bulma_column',
          },
          layoutProps: {
            style: {
              width: '30%',
            },
          },
          value: {
            component: 'div',
            props: {
              className: '__re-bulma_control __form_element_has_value',
            },
            children: [ {
              component: 'label',
              props: {
                className: '__re-bulma_label',
                style: {
                  textAlign: 'right',
                },
              },
              children: [ {
                component: 'ResponsiveButton',
                children: 'Create New Variable',
                props: {
                  onClick: 'func:window.closeModalAndCreateNewModal',
                  onclickProps: {
                    title: 'Create New Variable',
                    pathname: '/decision/variables/create',
                  },
                  style: {
                    display: 'inline-block',
                    lineHeight: 1,
                    fontWeight: 'normal',
                    cursor: 'pointer',
                    border: 'transparent',
                  },
                },
              }, ],
            },
            {
              component: 'Input',
              props: {
                readOnly: true,
                value: '',
              },
            }, ],
          },
        }, {
          type: 'layout',
          value: {
            component: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                margin: '10px 0px',
                position: 'relative',
              },
            },
            children: [ {
              component: 'hr',
              props: {
                style: {
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: '1px dashed rgb(187, 187, 187)',
                  borderLeft: 'none',
                  borderImage: 'initial',
                  width: '100%',
                },
              },
            }, {
              component: 'span',
              children: 'EQUALS',
              props: {
                style: {
                  padding: '0px 20px',
                  background: 'white',
                  position: 'absolute',
                  color: 'rgb(187, 187, 187)',
                  fontWeight: '900',
                  fontSize: '13px',
                },
              },
            }, ],
          },
        }, {
          name: 'required_calculation_variables',
          // value: '',
          errorIconRight: true,
          label: 'Required Variables',
          validateOnChange: true,
          errorIcon: 'fa fa-exclamation',
          validIcon: 'fa fa-check',
          // disableOnChange: true,
          customOnChange: 'func:window.calculationRequiredVariablesDropdownOnChange',
          type: 'dropdown',
          passProps: {
            selection: true,
            fluid: true,
            search: true,
            multiple: true,
          },
          layoutProps: {
            style: {
              width: '100%',
              // paddingRight: '7px',
            },
          },
          options: required_calculation_variables,
        }, ],
      }, ],
    },
  },
  {
    component: 'ResponsiveTabs',
    asyncprops: {
      formdata: [ 'ruledata', 'data', ],
    },
    props: {
      tabsProps: {
        tabStyle: 'isBoxed',
      },
      isButton: false,
      tabs: [ {
        edit: true,
        label: 'JavaScript',
        mode: 'javascript',
        thisprops: {
          formdata: [ 'formdata', ],
        },
      },
        //   {
        //     label: 'Python', mode: 'python', thisprops: {
        //   formdata: ['formdata']
        // },}, { label: 'R', mode: 'r', thisprops: {
        //   formdata: ['formdata']
        // }, }, { label: 'SAS', mode: 'sas', thisprops: {
        //   formdata: ['formdata']
        //   },
        //   },
      ].map(buildCodeTabs),
    },
  },
    // {
    //   component: 'ResponsiveTabs',
    //   bindprops: true,
    //   props: {
    //     tabsProps: {
    //       tabStyle: 'isBoxed',
    //     },
    //     style: {
    //       padding: '5px 10px',
    //     },
    //     isButton: false,
    //     tabs: [ { label: 'JavaScript', mode: 'javascript', },
    //       // { label: 'Python', mode: 'python' },
    //       // { label: 'R', mode: 'r' },
    //       // { label: 'SAS', mode: 'sas' },
    //     ].map(buildCodeTabs),
    //   },
    // },
  ];
}

async function createNewStrategyVersionModules(options) {
  try {
    let { modules, module_run_order, strategyid, organization } = options;
    let strategyVariables = [];
    let mlmodels = [];
    let dataintegrations = [];
    let allSegRules;
    let inputVarMap = {
      'artificialintelligence': 'system_variable_id',
      'dataintegration': 'input_variable',
    };
    async function moduleGenerator(options) {
      try {
        let { segments, } = options;
        let created_module = await Promise.all(segments.map(segment => strategytransformhelpers.copySegment({ segment, strategyid, copysegment_name: segment.name, organization })));
        return created_module;
      } catch (e) {
        return Promise.reject(e);
      }
    }
    if (modules && module_run_order && strategyid) {
      let createdModules = await Promise.all(module_run_order.map((module_run_element) => moduleGenerator({ segments: modules[ module_run_element.lookup_name ], })));
      module_run_order.forEach((module_run_element, mdidx) => {
        modules[ module_run_element.lookup_name ].map((segment, segidx) => {
          let inputs = segment.inputs;
          let outputs = segment.outputs;
          let model_type = segment.type;
          let newSegment = createdModules[ mdidx ][ segidx ];
          if (newSegment) {
            let inputVariables, outputVariables;
            allSegRules = [ ...newSegment.conditions, ...newSegment.ruleset, ];
            allSegRules.forEach(rule => {
              strategyVariables.push(...compileRuleVariableIds({ result: rule, }));
            });
            if (inputs && inputs.length) {
              inputVariables = inputs.reduce((returnData, input) => {
                if (input.input_type === 'variable' && input[ inputVarMap[ model_type ] ]) returnData.push(input[ inputVarMap[ model_type ] ]);
                return returnData;
              }, []);
              strategyVariables.push(...inputVariables);
            }
            if (outputs && outputs.length) {
              outputVariables = outputs.reduce((returnData, output) => {
                if (output.output_variable) returnData.push(output.output_variable);
                return returnData;
              }, []);
              strategyVariables.push(...outputVariables);
            }
            if (segment.mlmodel_id) mlmodels.push(segment.mlmodel_id);
            if (segment.dataintegration_id) dataintegrations.push(segment.dataintegration_id);
            modules[ module_run_element.lookup_name ][ segidx ].conditions = newSegment.conditions.map(condition => condition._id.toString()) || [];
            modules[ module_run_element.lookup_name ][ segidx ].ruleset = newSegment.ruleset.map(rule => rule._id.toString()) || [];
          } else {
            return Promise.reject(new Error('Could not find matching module'));
          }
        });
      });
    }
    return [ modules, strategyVariables, mlmodels, dataintegrations, ];
  } catch (err) {
    return Promise.reject(err);
  }
}

function getDeleteRulesArray(options) {
  try {
    let { req, strategy, } = options;
    let deleteRules = [];
    let { collection, core, id, tabname, parsedUrl, } = findCollectionNameFromReq({ req, });
    let [ dependency_type, module_name, index, ] = parsedUrl.slice(2);
    let refererArr = req.headers.referer.split('/');
    let module_key = refererArr[ refererArr.length - 2 ];
    let segment_index = refererArr[ refererArr.length - 1 ];
    if (req.query.method === 'delete') {
      //segment
      let segment = strategy.modules[ module_name ][ index ];
      deleteRules.push(...segment.conditions, ...segment.ruleset);
    } else if (req.query.method === 'deleteRule') {
      //rule
      let changedRulesArr = (req.query.conditions && req.query.conditions === 'false') ? 'ruleset' : 'conditions';
      let rule = strategy.modules[ module_key ][ segment_index ][ changedRulesArr ][ index ];
      deleteRules.push(rule);
    } else if (req.query.method === 'deleteModule') {
      //module
      const moduleLookupNameArr = req.params[ '0' ].split('_');
      let idx = moduleLookupNameArr[ moduleLookupNameArr.length - 1 ];
      let deleted_module = strategy.module_run_order[ idx ];
      let deleted_module_detail = strategy.modules[ deleted_module.lookup_name ];
      deleted_module_detail.forEach(segment => {
        if (segment.conditions) deleteRules.push(...segment.conditions);
        if (segment.ruleset) deleteRules.push(...segment.ruleset);
      });
    }
    return deleteRules;
  } catch (e) {
    logger.warn(e.message);
    return [];
  }
}

module.exports = {
  addParentToChild,
  changeParentOnChild,
  checkIfVariable,
  coerceNumericValues,
  coerceFormData,
  compileStrategyRuleIds,
  compileRuleVariableIds,
  createStrategyUpdateHistoryDetailWithInputs,
  createStrategyUpdateHistoryDetailWithInputsAndOutputs,
  createStrategyUpdateHistoryDetailWithRules,
  createStrategyUpdateHistoryDetailWithoutRules,
  createNewStrategyVersionModules,
  depopulate,
  deleteParentFromChild,
  checkDependencies,
  clearDependencies,
  formatCoreDataResponse,
  findArrayDeletions,
  findCollectionNameFromReq,
  findVariableChange,
  handleStatusDisplay,
  handlePreviousLatestVersion,
  handleVariablesArr,
  modelSave,
  createStrategyUpdateHistoryDetailWithOutputs,
  populateIdAndIndex,
  createChangeOptions,
  formatReqBody,
  handleStrategyUpdate,
  handleSegmentCopyChanges,
  formatUpdateDoc,
  formatRulesTableCell,
  formatDataTableRulesTableCell,
  formatRulesTableCellNoAndOr,
  formatVariableComparisonValueTableCell,
  formatDataTableRulesTableCellNoAndOr,
  formatPricingConditionOutputs,
  generateRuleUpdateForm,
  generateCalculationForm,
  getDeleteRulesArray,
  buildCodeTabs,
};