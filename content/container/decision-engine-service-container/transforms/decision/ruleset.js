'use strict';
const periodic = require('periodicjs');
const utilities = require('../../utilities');
const numeral = require('numeral');
const moment = require('moment');
const capitalize = require('capitalize');
const unflatten = require('flat').unflatten;
const helpers = utilities.controllers.helper;
const transformhelpers = utilities.transformhelpers;

/**
 * Formats ruleset detail for display
 * 
 * @param {Object} req Express request object
 * @returns request object with updated ruleset information for display
 */
function formatRulesetDetail(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl } = helpers.findCollectionNameFromReq({ req });
      if (collection === 'rulesets' && tabname === 'detail') {
        req.controllerData = req.controllerData || {};
        req.controllerData.data = req.controllerData.data || {};
        let currentRuleset = req.controllerData.data;
        currentRuleset.formattedCreatedAt = `${transformhelpers.formatDateNoTime(currentRuleset.createdat, req.user.time_zone)} by ${currentRuleset.user.creator}`;
        currentRuleset.formattedUpdatedAt = `${transformhelpers.formatDateNoTime(currentRuleset.updatedat, req.user.time_zone)} by ${currentRuleset.user.updater}`;
        let dispType = (currentRuleset.type === 'scorecard') ? 'scorecard' : currentRuleset.type;
        currentRuleset.displaytype = `${dispType.split('_').map(w=> capitalize(w)).join(' ')} ${(collection === 'rulesets') ? 'Rule Set' : 'Rule'}`
        currentRuleset.strategies = currentRuleset.strategies.map(strategy => {
          strategy = Object.assign({}, strategy, {
            type: (strategy.type) ? capitalize.words(strategy.type).split('_').join(' ') : '',
            status: helpers.handleStatusDisplay({ active: strategy.active, locked: strategy.locked, strategyDisplay: true }),
          });
          return strategy;
        });
        req.controllerData.data = currentRuleset;
        const Rule = periodic.datas.get('standard_rule');
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        let query = { _id: { $in: currentRuleset.rules.map(rule => rule._id.toString()) }, organization, };
        return Rule.query({ query })
          .then(rules => {
            rules = rules.map(rule => {
              rule = rule.toJSON ? rule.toJSON() : rule;
              if (rule.condition_output && typeof rule.condition_output !== 'string') {
                let outputKeys = Object.keys(rule.condition_output);
                outputKeys.forEach(key => rule[`condition_output_${key}`] = rule.condition_output[key]);
              }
              let variable = Object.assign({}, rule.state_property_attribute);
              rule.state_property_attribute = variable.name;
              rule.variable_version = variable.version;
              return rule;
            });
            
            let rulesMap = rules.reduce((collection, rule) => {
              collection[ rule._id ] = rule
              return collection;
            }, {});
            rules = currentRuleset.rules.map(rule => {
              if (rulesMap[ rule._id ]) return rulesMap[ rule._id ];
            })
            req.controllerData.data.rules = rules;
            resolve(req);
          })
          .catch(reject);
      } else if (tabname === 'detail' && ([ 'rulesets', 'rules' ].indexOf(collection) > -1)) { 
        let dispType = (req.controllerData.data.type === 'scorecard') ? 'scorecard' : req.controllerData.data.type;
        req.controllerData.data.displaytype = `${dispType.split('_').map(w=> capitalize(w)).join(' ')} ${(collection === 'rulesets') ? 'Rule Set' : 'Rule'}`
        resolve(req);
      } else {
        resolve(req);
      }
    } catch (e) {
      return reject(e);
    }
  });
}

module.exports = {
  formatRulesetDetail,
};