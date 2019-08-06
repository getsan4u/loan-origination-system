'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;
const controller_helper = require('../../utilities/controllers/helper.js');
const decisionController = require('../decision');

function query(req, res, next) {
  req.controllerData = req.controllerData || {};
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  if (req.query.type) {
    const Ruleset = periodic.datas.get('standard_ruleset');
    Ruleset.query({ query: { type: { $in: [ req.query.type, 'population', ], }, organization, }, })
      .then(ruleset => {
        let rulesetByCategory = ruleset.reduce((byCategory, ruleset) => {
          ruleset = ruleset.toJSON ? ruleset.toJSON() : ruleset;
          if (ruleset.type === 'population') byCategory[ `${req.query.type}_conditions` ].push({ label: ruleset.name, value: ruleset._id, });
          if (ruleset.type === req.query.type) byCategory[ `${req.query.type}_ruleset` ].push({ label: ruleset.name, value: ruleset._id, });
          return byCategory;
        }, {
            [ `${req.query.type}_conditions` ]: [],
            [ `${req.query.type}_ruleset` ]: [],
          });
        req.controllerData.formoptions = req.controllerData.formoptions || {};
        req.controllerData.formoptions = Object.assign({}, req.controllerData.formoptions, rulesetByCategory);
        res.send(req.controllerData);
      })
      .catch(e => {
        res.status(500).send({ message: `${e.message}`, });
      });
  } else {
    res.send(req.controllerData);
  }
}

function create(req, res, next) {
  let { collection, core, id, tabname, parsedUrl, } = controller_helper.findCollectionNameFromReq({ req, });
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  req.body.title = req.body.name;
  req.body = Object.assign({}, req.body, {
    name: `${req.body.title}.v1`,
    createdat: new Date(),
    conditions: req.body[ `${req.body.type}_conditions` ],
    ruleset: req.body[ `${req.body.type}_ruleset` ],
    user: { creator: `${req.user.first_name} ${req.user.last_name}`, updater: `${req.user.first_name} ${req.user.last_name}`, },
    organization,
  });
  const Strategy = periodic.datas.get('standard_strategy');
  let segment = req.body;
  Strategy.load({ query: { _id: id, organization, }, population: 'product', })
    .then(strategy => {
      strategy = strategy.toJSON ? strategy.toJSON() : strategy;
      strategy[ `${req.body.type}_segments` ].push(segment);
      return Strategy.update({ id: strategy._id, updatedoc: strategy, depopulate: false, });
    })
    .then(() => {
      res.status(200).send({ message: 'successfully created segment', });
    })
    .catch(e => {
      res.status(500).send({ message: `${e.message}`, });
    });
}

module.exports = {
  paginate: query,
  create,
  show: decisionController.show,
};