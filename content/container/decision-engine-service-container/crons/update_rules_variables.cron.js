'use strict';
const pluralize = require('pluralize');
let periodic;
let Rule;
let Variable;
let Strategy;
let redisClient;
let strategyMap = {};
let ruleMap = {};
let variableMap = {};
let dataintegrationsByOrg = {};
let updatedatTime = null;
let initialized = false;
const { promisify } = require('util');

async function getRulesAndVariablesForOrganizations() {
  try {
    const env = periodic.environment;
    const lastRuleMapUpdateatTime = updatedatTime;
    let rules, variables;
    let rule_query = {}, variable_query = {};
    if (lastRuleMapUpdateatTime) {
      rule_query = { updatedat: { $gte: lastRuleMapUpdateatTime, }, }
    }
    const activeTestingStrategies = await Strategy.model.find({ $or: [ { status: 'active' }, { status: 'testing' } ] }).lean();
    const activeTestingStrategyIds = activeTestingStrategies.map(strategy => strategy._id.toString());
    const activeTestingStrategyLookup = new Set(activeTestingStrategyIds);
    if (!initialized) {
      rule_query.strategy = { $in: activeTestingStrategyIds, };
    }
    if (process.env && process.env.instances && process.env.pm_id) {
      const numPm2s = Number(process.env.instances);
      const pm2Instance = Number(process.env.pm_id);
      //include any updates from 15 seconds ago
      const ruleCount = await Rule.model.countDocuments(rule_query);
      const ruleLimit = Math.ceil(ruleCount / numPm2s);
      const ruleSkip = pm2Instance * ruleLimit;
      rules = await Rule.model.find(rule_query).sort('-createdat').skip(ruleSkip).limit(ruleLimit).lean();
    } else {
      rules = await Rule.model.find(rule_query).lean();
    }
    if (rules) {
      rules.forEach(rule => {
        if (rule.strategy && activeTestingStrategyLookup.has(rule.strategy.toString())) {
          redisClient.set(`${env}_${rule.organization.toString()}_rule_${rule._id}`, JSON.stringify(rule));
        } else {
          redisClient.set(`${env}_${rule.organization.toString()}_rule_${rule._id}`, JSON.stringify(rule), 'EX', 21600);
        }
      });
    }

    let newUpdatedatTime = new Date(new Date().getTime() - 60000).toISOString();
    updatedatTime = newUpdatedatTime;
    initialized = true;

    return true;
  } catch (e) {
    if(periodic && periodic.logger) periodic.logger.error(e.message);
  }
}

async function __deleteAllRulesFromRedis() {
  const redisClient = periodic.app.locals.redisClient;
  const getAllKeys = promisify(redisClient.keys).bind(redisClient);
  const ruleKeys = await getAllKeys('*_rule_*');
  ruleKeys.forEach(k => redisClient.del(k));
}

const mainFunc = async function (req, res, next) {
  try {
    await getRulesAndVariablesForOrganizations();
    if (next) return next();
  } catch (err) {
    if(periodic && periodic.logger) periodic.logger.error(err.message);
  }
};

var initialize = function (resources) {
  periodic = resources;
  Strategy = periodic.datas.get('standard_strategy');
  Rule = periodic.datas.get('standard_rule');
  Variable = periodic.datas.get('standard_variable');
  redisClient = periodic.app.locals.redisClient;
  return mainFunc;
};

module.exports = initialize;