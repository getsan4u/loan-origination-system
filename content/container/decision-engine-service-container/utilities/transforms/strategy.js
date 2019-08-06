'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const capitalize = require('capitalize');
const view_utilities = require('../views');
const { getRuleFromCache, getVariableFromCache, setRuleOnRedis } = require('../controllers/integration');
const moment = require('moment');
const styles = view_utilities.constants.styles;
const shared = view_utilities.shared;
const cardprops = shared.props.cardprops;
const randomKey = Math.random;

function generateRuleName(options) {
  try {
    let { rule, idx, copysegment_name, strategyid } = options;
    if (rule && strategyid && rule.multiple_rules && rule.multiple_rules.length === 0) {
      return `strategy${strategyid}_${copysegment_name}_${idx}_`;
    } else if (rule && strategyid && rule.multiple_rules && rule.multiple_rules.length) {
      let name_string = `strategy${strategyid}_${copysegment_name}_${idx}_`;
      let name_arr = rule.multiple_rules.map((rl, idx) => idx.toString());
      name_string += name_arr.join('');
      name_string += `${Math.floor(new Date().getTime() * randomKey())}`
      return name_string;
    }
  } catch (e) {
    logger.warn('generateRuleName error: ', e);
  }
}

async function copySegment(options) {
  let { segment, copysegment_name, strategyid, organization } = options;
  const Rule = periodic.datas.get('standard_rule');
  let newSegment = {};

  const [ oldConditions, oldRuleset ] = await Promise.all([ getRuleFromCache(segment.conditions, organization), getRuleFromCache(segment.ruleset, organization) ]);
  let createConditions = segment.conditions.map((ruleId, idx) => {
    const oldRule = oldConditions[ idx ];
    let newRule = Object.assign({}, oldRule, {
      name: generateRuleName({ rule: oldRule, idx, copysegment_name, strategyid }),
      strategy: strategyid.toString(),
    });
    delete newRule._id;
    delete newRule.createdat;
    delete newRule.updatedat;
    return newRule;
  });
  let createRuleset = segment.ruleset.map((ruleId, idx) => {
    let oldRule = oldRuleset[ idx ];
    let newRule = Object.assign({}, oldRule, {
      name: generateRuleName({ rule: oldRule, idx, copysegment_name, strategyid }),
      strategy: strategyid.toString(),
    });
    delete newRule._id;
    delete newRule.createdat;
    delete newRule.updatedat;
    return newRule;
  });
  createConditions = createConditions.length
    ? createConditions.map(condition => {
      return Rule.create({
        newdoc: condition
      })
    })
    : [];
  createRuleset = createRuleset.length
    ? createRuleset.map(rule => {
      return Rule.create({
        newdoc: rule,
        skip_xss: true
      })
    })
    : [];
  
  const [ createdConditions, createdRuleset ] = await Promise.all([ Promise.all(createConditions), Promise.all(createRuleset) ])
  newSegment.conditions = createdConditions || [];
  newSegment.ruleset = createdRuleset || [];
  [ ...newSegment.conditions, ...newSegment.ruleset ].forEach(rule => {
    rule = rule.toJSON ? rule.toJSON() : rule;
    setRuleOnRedis(rule, organization);
  });
  return newSegment;
}

module.exports = {
  copySegment,
  generateRuleName,
};