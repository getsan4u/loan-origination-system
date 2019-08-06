'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const controller_helper = require('../../utilities/controllers/helper.js');
const Promisie = require('promisie');
const decisionController = require('../decision');
const runRuleVariableUpdateCron = require('../../crons/update_rules_variables.cron')(periodic);

function update(req, res, next) {
  const Strategy = periodic.datas.get('standard_strategy');
  const Change = periodic.datas.get('standard_change');
  const Rule = periodic.datas.get('standard_rule');
  let { collection, core, id, tabname, parsedUrl, } = controller_helper.findCollectionNameFromReq({ req, });
  let before, after;
  let createdat = new Date();
  let user = req.user;
  let deleteRules;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  Strategy.load({ query: { _id: req.params.id, organization, }, population: 'tags', })
    .then(result => {
      before = result.toJSON ? result.toJSON() : result;
      deleteRules = (req.query && req.query.method && req.query.method.indexOf('delete') === 0) ? controller_helper.getDeleteRulesArray({ req, strategy: before, }) : [];
      after = controller_helper.formatReqBody({ req, entity: Object.assign({}, result.toJSON()), });
      return controller_helper.handleStrategyUpdate({ before, after, req, });
    })
    .then(() => {
      after.updatedat = new Date();
      after.user = Object.assign({}, after.user, { updater: `${req.user.first_name} ${req.user.last_name}`, });
      return Strategy.update({
        id: req.params.id,
        updatedoc: after,
        depopulate: false,
      });
    })
    .then(() => {
      if (req.query.noChangeLog) return;
      else {
        let changeOptions = controller_helper.createChangeOptions({ result: before, collection: 'strategies', req, createdat, after, organization: (organization) ? organization.toString() : 'organization', });
        let postUpdates = (req.query.method && req.query.method.indexOf('delete') === 0 && deleteRules.length) ? [ Change.create(changeOptions), Rule.model.remove({ _id: { $in: deleteRules, } }) ] : [ Change.create(changeOptions) ];
        return Promise.all(postUpdates);
      }
    })
    // .then(() => {
    //   if (!req.query.noChangeLog) {
    //     return runRuleVariableUpdateCron({ query: { skipUntilIntialized: true } });
    //   } else {
    //     return;
    //   }
    // })
    .then(() => {
      if (req.query.method === 'addSegment') {
        let [ module_name, segment_index, ] = req.headers.referer.split('/').slice(-2);
        let redirect_path = `/decision/strategies/${req.params.id}/${module_name}/${req.body.redirect_index}`;
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
      } else if (req.query.method === 'delete') {
        let [ module_name, segment_index, ] = req.headers.referer.split('/').slice(-2);
        let redirect_path = `/decision/strategies/${req.params.id}/${module_name}/0`;
        res.status(200).send({
          status: 200,
          timeout: 10000,
          type: 'success',
          text: 'Changes saved successfully!',
          successProps: {
            successCallback: 'func:window.pushToNewRoute',
          },
          pathname: redirect_path,
        });
      } else {
        res.status(200).send({ message: 'Changes saved successfully!', });
      }
    })
    .catch(e => {
      res.status(500).send({ message: e.message, });
    });
}

/**
 * Loads all the strategies for copying segments from another strategy
 * 
 * @param {*} req Express Request Object
 * @param {*} res Express Response Object
 * @param {*} next Express next function 
 */
function getStrategies(req, res, next) {
  const Strategy = periodic.datas.get('standard_strategy');
  let refererArr = req.headers.referer.split('/');
  let { collection, core, id, tabname, parsedUrl, } = controller_helper.findCollectionNameFromReq({ req, });
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  req.controllerData = req.controllerData || {};
  req.controllerData.data = req.controllerData.data || {};
  let query = { organization, };
  Strategy.query({ query, })
    .then(strategies => {
      req.controllerData.data.strategies = strategies.map(strategy => strategy.toJSON ? strategy.toJSON() : strategy);
      req.controllerData.data._id = id;
      next();
    })
    .catch(e => next(e));
}

/**
 * Formats information needed for the initial create rule modal
 * 
 * @param {*} req Express Request Object
 * @param {*} res Express Response Object
 * @param {*} next Express next function 
 */
function initialCreateRuleModal(req, res, next) {
  if (req.query.init === 'true') {
    req.controllerData = req.controllerData || {};
    const modalTitleMap = {
      population: 'Create New Rule (Population)',
      requirements: 'Create New Rule (Requirements)',
      scorecard: 'Create New Rule (Scorecard)',
      output: 'Create New Rule (Output)',
      assignments: 'Create New Rule (Simple Output)',
    };
    req.controllerData.data = Object.assign({}, req.controllerData.data, req.body);
    req.controllerData.modalTitle = modalTitleMap[ req.body.type ];
    req.controllerData.modalPathname = `/decision/strategies/${req.body.id}/${req.body.type}/create`;
    res.status(200).send(req.controllerData);
  } else {
    res.status(200).send(req.controllerData);
  }
}

/**
 * Loads strategy for pulling module data from strategy
 * 
 * @param {*} req Express Request Object
 * @param {*} res Express Response Object
 * @param {*} next Express next function 
 */
function getStrategy(req, res, next) {
  const Strategy = periodic.datas.get('standard_strategy');
  req.controllerData = req.controllerData || {};
  req.controllerData.data = req.controllerData.data || {};
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  Strategy.load({ query: { _id: req.params.id, organization, }, })
    .then(strategy => {
      if (!strategy) {
        return next('Could not find the strategy');
      }
      req.controllerData.data = strategy.toJSON ? strategy.toJSON() : strategy;
      next();
    })
    .catch(e => next(e));
}

function deleteStrategy(req, res, next) {
  const Strategy = periodic.datas.get('standard_strategy');
  Strategy.delete({ id: req.params.id })
    .then(() => {
      let { collection, core, tabname, parsedUrl, id, } = controller_helper.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      const Rule = periodic.datas.get('standard_rule');
      const DeleteRule = Promisie.promisify(Rule.model.remove);
      let deletedStrategy = req.controllerData.deletedStrategy;
      if (deletedStrategy.modules) {
        let deleteRules = Object.keys(deletedStrategy.modules).reduce((returnData, module_name) => {
          let currentModule = deletedStrategy.modules[ module_name ] || [];
          currentModule.forEach(segment => {
            if (segment.conditions) returnData.push(...segment.conditions);
            if (segment.ruleset) returnData.push(...segment.ruleset);
          });
          return returnData;
        }, []);
        Rule.model.remove({ _id: { $in: deleteRules } }, (err) => {
          if (err) throw new Error(err);
          else res.status(200).send({
            status: 200,
            timeout: 10000,
            type: 'success',
            text: 'Changes Saved Successfully!',
            successProps: {
              successCallback: 'func:this.props.refresh',
            },
          });
        })
      } else {
        res.status(200).send({
          status: 200,
          timeout: 10000,
          type: 'success',
          text: 'Changes saved successfully!',
          successProps: {
            successCallback: 'func:this.props.refresh',
          },
        });
      }
    })
    .catch(e => next(e));
}

async function getStrategyVersions(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Strategy = periodic.datas.get('standard_strategy');
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const strategy = await Strategy.model.findOne({ _id: req.params.id, organization, }, { title: 1, version: 1, status: 1, display_title: 1, }).lean();
    if (req.query.paginate) {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 5 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      const query = { title: strategy.title, organization, };
      const versions = await Strategy.model.find(query, { title: 1, version: 1, status: 1, display_title: 1, user: 1, updatedat: 1, }).sort(sort).skip(skip).limit(5).lean();
      const numItems = await Strategy.model.countDocuments(query);
      const numPages = Math.ceil(numItems / 5);
      req.controllerData = Object.assign({}, req.controllerData, {
        rows: versions || [],
        skip,
        numItems,
        numPages,
        baseUrl: `/decision/api/standard_strategies/${req.params.id}/versions?format=json&paginate=true`,
      });
    } else {
      const versions = await Strategy.model.find({ title: strategy.title, organization, }, { title: 1, version: 1, status: 1, display_title: 1, user: 1, updatedat: 1, }).lean();
      req.controllerData.versions = versions || [];
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    res.status(500).send({ message: 'Could not find any versions of the strategy' });
  }
}

/**
 * Retrieves an index of all changelogs that were created before the update date of a particular collection document filtered by title and sets onto controllerData for display
 */
async function getChangeLogs(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const Change = periodic.datas.get('standard_change');
    const Strategy = periodic.datas.get('standard_strategy');
    if (req.query.paginate) {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 5 * (pagenum - 1);
      const strategy = await Strategy.model.findOne({ _id: req.params.id, organization, }, { title: 1 }).lean();
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      const query = { entity: 'strategies', entity_title: strategy.title, organization, };
      const changelogs = await Change.model.find(query, {}).sort(sort).skip(skip).limit(5).lean();
      const numItems = await Change.model.countDocuments(query);
      const numPages = Math.ceil(numItems / 5);
      req.controllerData = Object.assign({}, req.controllerData, {
        rows: changelogs || [],
        skip,
        numItems,
        numPages,
        baseUrl: `/decision/api/standard_strategies/${req.params.id}/changelogs?format=json&paginate=true`,
      });
    } else {
      const changelogs = await Change.model.find({ entity: 'strategies', entity_id: req.params.id, organization, }).lean();
      req.controllerData.changelogs = changelogs || [];
    }
    next();
  } catch (err) {
    logger.warn(err.message);
    res.status(500).send({ message: 'Could not find any change logs of the strategy' });
  }
}

async function getChangeLog(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const Change = periodic.datas.get('standard_change');
    const changelog = await Change.model.findOne({ _id: req.params.logid, organization }).lean();
    req.controllerData.changelog = changelog;
    next();
  } catch (e) {
    logger.warn(e.message);
    res.status(500).send({ message: 'Could not find the change log' });
  }
}


module.exports = {
  index: decisionController.find,
  show: decisionController.show,
  create: decisionController.create,
  remove: deleteStrategy,
  update,
  getStrategies,
  getStrategy,
  initialCreateRuleModal,
  getStrategyVersions,
  getChangeLogs,
  getChangeLog,
};