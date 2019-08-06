'use strict';

const periodic = require('periodicjs');
const pluralize = require('pluralize');
const capitalize = require('capitalize');
const controller_helper = require('../../utilities/controllers/helper.js');
const integrationControllerUtil = require('../../utilities/controllers/integration.js');
const decisionController = require('../decision');
const strategytransformhelper = require('../../utilities/transforms/strategy');

/**
 * Creates rule and updates the strategy with the new rule
 * 
 * @param {*} req Express Request Object
 * @param {*} res Express Response Object
 * @param {*} next Express next function 
 */
function createRule(req, res, next) {
  let { collection, core, id, tabname, parsedUrl } = controller_helper.findCollectionNameFromReq({ req });
  const redisClient = periodic.app.locals.redisClient;
  let user = req.user;
  let segment_name = parsedUrl[ 2 ];
  let rule_idx = parsedUrl[ 3 ];
  let randomName = strategytransformhelper.generateRuleName({ rule: req.body, idx: rule_idx, copysegment_name: segment_name, strategyid: id });
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  req.body = Object.assign({}, req.body, {
    name: randomName,
    createdat: new Date(),
    user: { creator: `${req.user.first_name} ${req.user.last_name}`, updater: `${req.user.first_name} ${req.user.last_name}` },
    latest_version: true,
    title: randomName,
    strategy: id.toString(),
    organization,
  });
  let createOptions = req.body;
  const Rule = periodic.datas.get('standard_rule');
  Rule.create({ newdoc: createOptions, skip_xss: true })
    .then(result => {
      result = result.toJSON ? result.toJSON() : result;
      if (redisClient) {
        integrationControllerUtil.setRuleOnRedis(result, organization);
      }
      req.body = { rule: result._id, type: req.body.type };
      next();
    })
    .catch(e => {
      let message = (e.code === 11000) ? `There is already a Rule with that name. Please use a unique name for new Rules.` : `Error creating Rule`
      decisionController.handlePageError({ res, message, });
    });
}

module.exports = {
  index: decisionController.find,
  show: decisionController.show,
  create: decisionController.create,
  update: decisionController.update,
  createRule,
};