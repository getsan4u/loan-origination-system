'use strict';

/** Middleware for organization */

const periodic = require('periodicjs');
const logger = periodic.logger;
const utilities = require('../utilities');
const { DEFAULT_LOAN_PRODUCT_TYPES, DEFAULT_CUSTOMER_TEMPLATES, DEFAULT_APPLICATION_LABELS } = utilities.constants.LOS;
const api_utilities = utilities.controllers.api;
const auth_utilities = utilities.controllers.auth;
const helpers = utilities.helpers;
const passportSettings = periodic.settings.extensions[ 'periodicjs.ext.passport' ];
const passportUtilities = periodic.locals.extensions.get('periodicjs.ext.passport');
const routeUtils = periodic.utilities.routing;
const utilControllers = utilities.controllers;
const mongoose = require('mongoose');
const converter = require('json-2-csv');
const moment = require('moment');
const numeral = require('numeral');
/**
 * Create a new organization.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
async function createOrg(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Org = periodic.datas.get('standard_organization');
  Org.create({
    newdoc: Object.assign(
      {},
      req.body,
      {
        entitytype: 'organization',
        'association.users': [ req.controllerData.user._id, ],
        products: {
          text_recognition: {
            active: true,
            pricing: {
              processing_individual: 0.00,
              processing_batch: 0.00,
              api_individual: 0.00,
              api_batch: 0.00,
            },
          },
          machine_learning: {
            active: true,
            pricing: {
              processing_individual: 0.00,
              processing_batch: 0.00,
              api_individual: 0.00,
              api_batch: 0.00,
            },
          },
          rules_engine: {
            active: true,
            pricing: {
              processing_individual: 0.00,
              processing_batch: 0.00,
              api_individual: 0.00,
              api_batch: 0.00,
            },
          },
          loan_acquisition: {
            active: true,
            pricing: {
              processing_individual: 0.00,
              processing_batch: 0.00,
              api_individual: 0.00,
              api_batch: 0.00,
            },
          },
        },
        esign: {
          platform_terms_and_conditions: {
            consent: true,
            version: 'v1.0',
            date: Date.now(),
            ip_address: req.headers[ 'x-forwarded-for' ] || req.connection.remoteAddress,
            user_agent: req.headers[ 'user-agent' ],
            user: req.controllerData.user._id,
          },
          website_terms_of_service: {
            consent: true,
            version: 'v1.0',
            date: Date.now(),
            ip_address: req.headers[ 'x-forwarded-for' ] || req.connection.remoteAddress,
            user_agent: req.headers[ 'user-agent' ],
            user: req.controllerData.user._id,
          },
          privacy_policy: {
            consent: true,
            version: 'v1.0',
            date: Date.now(),
            ip_address: req.headers[ 'x-forwarded-for' ] || req.connection.remoteAddress,
            user_agent: req.headers[ 'user-agent' ],
            user: req.controllerData.user._id,
          },
        },
        billing: {
          balance: 0,
          max_balance: 0,
          pricing_per_month: 0,
          payment_type: 'auto',
        },
      }),
  })
    .then(async org => {
      const userRequest = Object.assign({}, req.body, req.query, req.controllerData);
      if (passportUtilities.controller.jsonReq(req)) {
        req.controllerData.org = Object.assign({}, org._doc);
        req.controllerData.user.association = Object.assign({}, req.controllerData.user.association, { organization: org._id.toString(), });
        next();
      } else {
        const signInOnCreate = (userRequest.signin_after_create === false || userRequest.signin_after_create === 'false' || passportSettings.registration.signin_after_create === false) ? false : passportSettings.registration.signin_after_create;
        if (signInOnCreate) {
          passportUtilities.auth.loginUser({ req, res, passportSettings, utilities: passportUtilities, routeUtils, user: req.controllerData.user, });
        } else {
          res.redirect(req.controllerData.loginRedirectURL);
        }
      }
    })
    .catch(err => {
      logger.error('Unable to create new organization', err);
      next(err);
    });
}

/**
 * Updates org based on req.controllerData.org.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function updateOrg(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Org = periodic.datas.get('standard_organization');
  if (req.controllerData.org && req.controllerData.org.los) delete req.controllerData.org.los;
  Org.update({
    id: req.controllerData.org._id.toString(),
    updatedoc: req.controllerData.org,
    isPatch: true,
  })
    .then(() => {
      next();
    })
    .catch(err => {
      logger.error('Unable to update organization', err);
      next(err);
    });
}

/**
 * Activates the organization.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function activateOrg(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.controllerData.org = {
    _id: req.controllerData.org._id.toString(),
    'association.client': req.controllerData.client._id.toString(),
    'status.active': true,
  };
  next();
}

/**
 * Sends success response for creating user/organization route.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
function sendCreateOrgResponse(req, res) {
  req.controllerData = req.controllerData || {};
  res.send(routeUtils.formatResponse({
    result: 'success',
    data: {
      user: req.controllerData.user,
      redirect: req.controllerData.loginRedirectURL,
    },
  }));
}

/**
 * This function puts req.user on req.controllerData.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function getGeneralInfo(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.user = req.user.toJSON ? req.user.toJSON() : req.user;
    let organization = (req.controllerData.user.association && req.controllerData.user.association.organization) ? req.controllerData.user.association.organization : {};
    organization = Object.assign({}, organization, {
      currentUsers: (organization.association && organization.association.users) ? numeral(organization.association.users.length).format('0,0') : 'N/A',
      isTrial: (organization.stripe && organization.stripe.customer) ? false : true,
    });
    // organization.account.expiration_date = moment(organization.account.expiration_date).format('MM/DD/YYYY');
    // organization.account.users = numeral(organization.account.users).format('0,0');
    req.controllerData.user = Object.assign({}, req.controllerData.user, {
      association: {
        organization,
      },
    });
    return next();
  } catch (err) {
    logger.error('getGeneralInfo error', err);
    return next(err);
  }
}

/**
 * This function edits general info.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function editGeneralInfo(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Org = periodic.datas.get('standard_organization');
    let org = req.user.association.organization;
    let options = {
      _id: org._id,
      updatedoc: Object.assign({}, helpers.unflatten(req.body), { _id: org._id, }),
    };
    Org.update(options)
      .then(updated => {
        req.controllerData.org = updated;
        next();
      })
      .catch(err => {
        logger.error('Unable to update organization', err);
        next(err);
      });
  } catch (err) {
    logger.error('editGeneralInfo error', err);
    next(err);
  }
}

/**
 * This function puts organization on controllerData.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function getOrg(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Org = periodic.datas.get('standard_organization');
    let organizationName = (req.user && req.user.association && req.user.association.organization && req.user.association.organization.name)
      ? req.user.association.organization.name
      : (req.body && req.body.name)
        ? req.body.name
        : (req.body && req.body.organization)
          ? req.body.organization
          : '';
    Org.load({ query: { name: new RegExp(`^${organizationName}$`, 'i'), }, })
      .then(org => {
        org = org.toJSON ? org.toJSON() : org;
        org = Object.assign({}, org, { accountstotalpages: Math.ceil(org.association.users.length / 50), accountstotal: org.association.users.length, });
        req.controllerData.org = org;
        next();
      })
      .catch(err => {
        logger.error('Unable to update organization', err);
        next(err);
      });
  } catch (err) {
    logger.error('getOrg error', err);
    next(err);
  }
}

/**
 * This function puts organization on controllerData.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function APIgetOrg(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Org = periodic.datas.get('standard_organization');
    if (req.user && req.user._doc) req.user = req.user._doc;
    let org = req.user.association.organization;
    Org.load({ query: { _id: org, }, })
      .then(org => {
        org = org.toJSON ? org.toJSON() : org;
        org = Object.assign({}, org, { accountstotalpages: Math.ceil(org.association.users.length / 50), accountstotal: org.association.users.length, });
        req.controllerData.org = org;
        next();
      })
      .catch(err => {
        logger.error('Unable to update organization', err);
        if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
          let xmlError = api_utilities.formatXMLErrorResponse(err);
          res.set('Content-Type', 'application/xml');
          return res.status(401).send(xmlError);
        } else {
          return next(err);
        }
      });
  } catch (err) {
    logger.error('getOrg error', err);
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(err);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return next(err);
    }
  }
}

/**
 * This function puts the userroles objects on req.controllerData as well as the organization's users.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function putUserroleOnOrg(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.controllerData.org = req.controllerData.org || {};
  const Userroles = periodic.datas.get('standard_userrole');
  Userroles.query()
    .then(userroles => {
      req.controllerData.userroles = userroles;
      if (req.controllerData.org.association && req.controllerData.org.association.users && req.controllerData.org.association.users.length) {
        let userrolesObj = userroles.reduce((acc, curr) => {
          acc[ curr._id ] = curr;
          return acc;
        }, {});
        req.controllerData.org.association.users = req.controllerData.org.association.users.map(user => {
          user = user.toJSON ? user.toJSON() : user;
          user.userroles = user.userroles.map(id => {
            return userrolesObj[ id ];
          });
          return user;
        });
      }
      next();
    })
    .catch(err => {
      logger.error('Unable to find all userroles', err);
      next(err);
    });
}

async function getActivityLogs(req, res, next) {
  try {
    const Request = periodic.datas.get('standard_request');
    req.controllerData = req.controllerData || {};
    let user = req.user;
    let organization = (req.params && req.params.id) ? req.params.id : (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 15 * (pagenum - 1);
    let queryOptions = (req.query && req.query.paginate) ? { query: { organization, }, paginate: true, limit: 15, pagelength: 15, skip, sort: '-createdat', } : { query: { organization, }, };
    req.controllerData.data = await Request.query(queryOptions);
    next();
  } catch (e) {
    logger.warn(e.message);
    req.error = e.message;
    next();
  }
}

async function loadOrg(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Organization = periodic.datas.get('standard_organization');
    let user = req.user;
    let organization = (req.params && req.params.id) ? req.params.id : (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData.organization = await Organization.load({ query: { _id: organization, }, });
    req.controllerData.organization = req.controllerData.organization.toJSON ? req.controllerData.organization.toJSON() : req.controllerData.organization;
    next();
  } catch (e) {
    logger.warn(e.message);
    req.error = e.message;
    next();
  }
}

async function downloadJSONToCSV(req, res) {
  try {
    if (req.controllerData && req.controllerData.data) {
      const exportName = `${req.controllerData.filename}-${moment().format()}.${req.query.export_format || '.csv'}`;
      const mimetype = (req.query.export_format === 'csv')
        ? 'text/csv'
        : 'application/json';
      const csv_options = {
        emptyFieldValue: '',
        keys: req.controllerData.headers,
        delimiter: {
        },
        checkSchemaDifferences: false,
      };
      if (req.query.export_format === 'csv') {
        converter.json2csv(req.controllerData.rows, (err, csv) => {
          if (err) throw new Error('Could not convert json to csv');
          else {
            res.setHeader('Content-disposition', 'attachment; filename=' + exportName);
            res.setHeader('Content-type', mimetype);
            res.attachment(exportName);
            res.end(csv);
          }
        }, csv_options);
      }
    } else {
      throw new Error('No resources available.');
    }
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({
      status: 500,
      data: {
        error: 'Failed to fetch activity logs.',
      },
    });
  }
}

async function checkOrganizationBalance(req, res, next) {
  let { org, } = req.controllerData;
  if (org && org.billing && org.billing.transaction_count && org.billing.max_transactions && (org.billing.transaction_count >= org.billing.max_transactions)) res.status(404).send({ status: 'error', message: 'Account limit reached. Please contact DigiFi.', });
  else next();
}

// function for seeding Example Strategy (Mark's)
// async function seedNewOrganization(req, res, next) {
//   req.controllerData = req.controllerData || {};
//   try {
//     let { org, user, } = req.controllerData;

//     let seedVariables = JSON.parse(JSON.stringify(require('../seed_documents/seed_variables.js').variables));
//     let seedVariableMap = {};
//     seedVariables.forEach(variable => {
//       seedVariableMap[ variable.id_number ] = variable;
//     });
//     let seedRules = JSON.parse(JSON.stringify(require('../seed_documents/seed_rules.js').rules));
//     let seedStrategy = JSON.parse(JSON.stringify(require('../seed_documents/seed_strategy.js').strategy));

//     const Variable = periodic.datas.get('standard_variable');
//     const Rule = periodic.datas.get('standard_rule');
//     const Strategy = periodic.datas.get('standard_strategy');

//     seedVariables = seedVariables.map(subvariable => {
//       subvariable.organization = mongoose.Types.ObjectId(org._id);
//       subvariable.createdat = new Date().toISOString();
//       subvariable.updatedat = new Date().toISOString();
//       return subvariable;
//     });
//     let createdVariables = await Promise.all(seedVariables.map(subvariable => {
//       let createOptions = {
//         newdoc: subvariable,
//         bulk_create: true,
//       };
//       return Variable.create(createOptions);
//     }));
//     let variableMap = {};
//     createdVariables.forEach(variable => {
//       variableMap[ variable.title ] = variable;
//     });

//     seedRules = seedRules.map(rule => {
//       if (rule.multiple_rules && rule.multiple_rules.length) {
//         rule.multiple_rules = rule.multiple_rules.map(subrule => {
//           let { state_property_attribute, } = subrule;
//           let seedVariable = seedVariableMap[ state_property_attribute ];
//           let updatedId = variableMap[ seedVariable.title ];
//           subrule.state_property_attribute = mongoose.Types.ObjectId(updatedId._id);
//           if (subrule.state_property_attribute_value_comparison_type === 'variable') {
//             let oldVariable = seedVariableMap[ subrule.state_property_attribute_value_comparison ];
//             let newVariable = variableMap[ oldVariable.title ];
//             subrule.state_property_attribute_value_comparison = newVariable._id;
//           }
//           return subrule;
//         });
//       }
//       if (rule.calculation_inputs && rule.calculation_inputs.length) {
//         rule.calculation_inputs = rule.calculation_inputs.map(subrule => {
//           let seedVariable = seedVariableMap[ subrule ];
//           let updatedId = variableMap[ seedVariable.title ];
//           return mongoose.Types.ObjectId(updatedId._id);
//         });
//       }
//       if (rule.calculation_outputs && rule.calculation_outputs.length) {
//         rule.calculation_outputs = rule.calculation_outputs.map(subrule => {
//           let seedVariable = seedVariableMap[ subrule ];
//           let updatedId = variableMap[ seedVariable.title ];
//           return mongoose.Types.ObjectId(updatedId._id);
//         });
//       }
//       rule.organization = mongoose.Types.ObjectId(org._id);
//       rule.name = `${rule.rule_type}_${rule.type}_${rule.id_number}_${org._id}`;
//       rule.title = `${rule.rule_type}_${rule.type}_${rule.id_number}_${org._id}`;
//       return rule;
//     });

//     let createdRulesArray = seedRules.map(subrule => {
//       let createOptions = {
//         newdoc: subrule,
//         bulk_create: true,
//       };
//       return Rule.create(createOptions);
//     });
//     let createdRules = await Promise.all(createdRulesArray);

//     let createdRulesMap = {};
//     createdRules.forEach(rule => {
//       let ruleSplit = rule.title.split('_');
//       let id_number = ruleSplit[ 2 ];
//       createdRulesMap[ id_number ] = rule;
//     });

//     let modules = JSON.parse(JSON.stringify(seedStrategy.modules));
//     for (var key in modules) {
//       let currentRules = modules[ key ];
//       currentRules = currentRules.map(subrule => {
//         if (subrule.ruleset) {
//           subrule.ruleset = subrule.ruleset.map(ruleid => {
//             return mongoose.Types.ObjectId(createdRulesMap[ ruleid ]._id);
//           });
//         }

//         if (subrule.conditions) {
//           subrule.conditions = subrule.conditions.map(ruleid => {
//             return mongoose.Types.ObjectId(createdRulesMap[ ruleid ]._id);
//           });
//         }

//         if (subrule.output_variable) {
//           let oldVariable = seedVariableMap[ subrule.output_variable ];
//           let newVariable = variableMap[ oldVariable.title ];
//           subrule.output_variable = mongoose.Types.ObjectId(newVariable._id);
//         }

//         if (subrule.state_property_attribute_value_comparison_type === 'variable') {
//           let oldVariable = seedVariableMap[ subrule.state_property_attribute_value_comparison ];
//           let newVariable = variableMap[ oldVariable.title ];
//           subrule.state_property_attribute_value_comparison = mongoose.Types.ObjectId(newVariable._id);
//         }
//         return subrule;
//       });
//       modules[ key ] = currentRules;
//     }

//     seedStrategy.modules = modules;
//     seedStrategy.organization = mongoose.Types.ObjectId(org._id);
//     let createdStrategy = await Strategy.create({
//       newdoc: seedStrategy,
//     });
//     createdRules.forEach(subrule => {
//       Rule.update({
//         id: subrule._id,
//         updatedoc: {
//           'strategy': mongoose.Types.ObjectId(createdStrategy._id),
//         },
//         isPatch: true,
//       });
//     });

//     createdVariables.forEach(subvariable => {
//       let arrOfStrategies = [];
//       for (var i = 0; i < subvariable.strategies_count; i++) {
//         arrOfStrategies.push(mongoose.Types.ObjectId(createdStrategy._id), );
//       }
//       Variable.update({
//         id: subvariable._id,
//         updatedoc: {
//           'strategies': arrOfStrategies,
//         },
//         isPatch: true,
//       });
//     });
//     next();
//   } catch (err) {
//     console.log({ err, });
//     logger.warn(err.message);
//     next();
//   }
// }

async function seedNewOrganization(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    let { org, user, } = req.controllerData;
    org = org.toJSON ? org.toJSON() : org;
    let seedVariables = JSON.parse(JSON.stringify(require('../seed_documents/seed_lending_variables.js').variables));
    let seedVariableMap = {};
    seedVariables.forEach(variable => {
      seedVariableMap[ variable.id_number ] = variable;
    });
    let seedRules = JSON.parse(JSON.stringify(require('../seed_documents/seed_lending_rules.js').rules));
    let seedStrategies = JSON.parse(JSON.stringify(require('../seed_documents/seed_lending_strategies.js').strategy));

    const Variable = periodic.datas.get('standard_variable');
    const Rule = periodic.datas.get('standard_rule');
    const Strategy = periodic.datas.get('standard_strategy');

    seedVariables = seedVariables.map(subvariable => {
      subvariable.organization = org._id.toString();
      subvariable.createdat = new Date().toISOString();
      subvariable.updatedat = new Date().toISOString();
      return subvariable;
    });
    let createdVariables = await Promise.all(seedVariables.map(subvariable => {
      let createOptions = {
        newdoc: subvariable,
        bulk_create: true,
      };
      return Variable.create(createOptions);
    }));
    let variableMap = {};
    createdVariables.forEach(variable => {
      variable = variable.toJSON ? variable.toJSON() : variable;
      variableMap[ variable.title ] = variable;
    });

    seedRules = seedRules.map(rule => {
      if (rule.multiple_rules && rule.multiple_rules.length) {
        rule.multiple_rules = rule.multiple_rules.map(subrule => {
          let { state_property_attribute, } = subrule;
          let seedVariable = seedVariableMap[ state_property_attribute ];
          let updatedId = variableMap[ seedVariable.title ]._id.toString();
          subrule.state_property_attribute = updatedId;
          if (subrule.state_property_attribute_value_comparison_type === 'variable') {
            let oldVariable = seedVariableMap[ subrule.state_property_attribute_value_comparison ];
            let newVariable = variableMap[ oldVariable.title ];
            subrule.state_property_attribute_value_comparison = newVariable._id;
          }
          return subrule;
        });
      }

      if (rule.condition_output && rule.condition_output.length) {
        rule.condition_output = rule.condition_output.map(suboutput => {
          let { variable_title } = suboutput;
          let updatedId = variableMap[ variable_title ] ? variableMap[ variable_title ]._id.toString() : null;
          suboutput.variable_id = updatedId;
          return suboutput;
        });
      }
      
      if (rule.calculation_inputs && rule.calculation_inputs.length) {
        rule.calculation_inputs = rule.calculation_inputs.map(subinput => {
          let seedVariable = seedVariableMap[ subinput ];
          let updatedId = variableMap[ seedVariable.title ]._id.toString();
          return updatedId;
        });
      }
      if (rule.calculation_outputs && rule.calculation_outputs.length) {
        rule.calculation_outputs = rule.calculation_outputs.map(suboutput => {
          let seedVariable = seedVariableMap[ suboutput ];
          let updatedId = variableMap[ seedVariable.title ]._id.toString();
          return updatedId;
        });
      }
      rule.organization = org._id.toString();
      rule.name = `${rule.rule_type}_${rule.type}_${rule.id_number}_${org._id}`;
      rule.title = `${rule.rule_type}_${rule.type}_${rule.id_number}_${org._id}`;
      return rule;
    });

    let createdRulesArray = seedRules.map(subrule => {
      let createOptions = {
        newdoc: subrule,
        bulk_create: true,
      };
      return Rule.create(createOptions);
    });
    let createdRules = await Promise.all(createdRulesArray);

    let createdRulesMap = {};
    createdRules.forEach(rule => {
      rule = rule.toJSON ? rule.toJSON() : rule;
      let ruleSplit = rule.title.split('_');
      let id_number = ruleSplit[ 2 ];
      createdRulesMap[ id_number ] = rule;
    });

    await Promise.all(seedStrategies.map(async (seedStrategy) => {
      let modules = JSON.parse(JSON.stringify(seedStrategy.modules));
      for (var key in modules) {
        let currentRules = modules[ key ];
        currentRules = currentRules.map(subrule => {
          if (subrule.ruleset) {
            subrule.ruleset = subrule.ruleset.map(ruleid => {
              return createdRulesMap[ ruleid ]._id.toString();
            });
          }

          if (subrule.conditions) {
            subrule.conditions = subrule.conditions.map(ruleid => {
              return createdRulesMap[ ruleid ]._id.toString();
            });
          }

          if (subrule.output_variable) {
            let oldVariable = seedVariableMap[ subrule.output_variable ];
            let newVariable = variableMap[ oldVariable.title ];
            subrule.output_variable = newVariable._id.toString();
          }

          if (subrule.state_property_attribute_value_comparison_type === 'variable') {
            let oldVariable = seedVariableMap[ subrule.state_property_attribute_value_comparison ];
            let newVariable = variableMap[ oldVariable.title ];
            subrule.state_property_attribute_value_comparison = newVariable._id.toString();
          }
          return subrule;
        });
        modules[ key ] = currentRules;
      }

      seedStrategy.modules = modules;
      seedStrategy.organization = org._id.toString();
      let createdStrategy = await Strategy.create({
        newdoc: seedStrategy,
      });
      createdStrategy = createdStrategy.toJSON ? createdStrategy.toJSON() : createdStrategy;
      createdRules.forEach(subrule => {
        Rule.update({
          id: subrule._id,
          updatedoc: {
            'strategy': createdStrategy._id.toString(),
          },
          isPatch: true,
        });
      });

      seedVariables.forEach(seedVariable => {
        let arrOfStrategies = [];
        for (var i = 0; i < seedVariable.strategies_count[ seedStrategy.id_number ]; i++) {
          arrOfStrategies.push(createdStrategy._id.toString());
        }
        Variable.update({
          id: variableMap[ seedVariable.title ]._id,
          updatedoc: {
            'strategies': arrOfStrategies,
          },
          isPatch: true,
        });
      });
    }))
    next();
  } catch (err) {
    console.log({ err });
    logger.warn(err.message);
    next();
  }
}

async function createLosDependencies(req, res, next) {
  try {
    const LosStatus = periodic.datas.get('standard_losstatus');
    const LosCustomerTemplate = periodic.datas.get('standard_loscustomertemplate');
    const LosProduct = periodic.datas.get('standard_losproduct');
    const LosApplicationLabel = periodic.datas.get('standard_losapplicationlabel');
    const Template = periodic.datas.get('standard_lostemplate');
    const Org = periodic.datas.get('standard_organization');
    let { org, user } = req.controllerData;
    const userKey = {
      creator: `${user.first_name} ${user.last_name}`,
      updater: `${user.first_name} ${user.last_name}`
    }
    // creating Los Statuses
    let statusObjects = await Promise.all([ 'New Opportunities', 'Data Gathering', 'Loan Underwriting', 'Negotiations', 'Legal Documentation', 'Approved', 'Rejected' ].map(status => LosStatus.create({ newdoc: { name: status, organization: org._id.toString() } })));
    statusObjects = statusObjects || [];
    statusObjects = statusObjects.filter(statusObj => {
      statusObj = statusObj.toJSON ? statusObj.toJSON() : statusObj;
      return statusObj.name !== 'Approved' && statusObj.name !== 'Rejected'
    })
    await Org.update({ isPatch: true, id: org._id.toString(), updatedoc: { 'los.statuses': statusObjects.map(statusObj => statusObj._id.toString()) } });

    // creating Los Customer Templates
    const customerTemplateDocs = [ 'company', 'person', 'intermediary' ].map(type => {
      return {
        entitytype: 'loscustomertemplate',
        name: `${org.name} ${type} Template`,
        description: `${org.name} ${type} Template`,
        type,
        organization: org._id.toString(),
        user: userKey,
        template: DEFAULT_CUSTOMER_TEMPLATES[ type ],
      }
    })
    LosCustomerTemplate.model.insertMany(customerTemplateDocs);

    // creating Los Product Templates
    const loanProductDocs = DEFAULT_LOAN_PRODUCT_TYPES.map(loan_product => {
      loan_product.organization = org._id.toString();
      loan_product.user = userKey;
      return loan_product;
    })
    LosProduct.model.insertMany(loanProductDocs);

    // creating Los Application Labels
    const applicationLabelDocs = DEFAULT_APPLICATION_LABELS.map(label => {
      label.organization = org._id.toString();
      label.user = userKey;
      return label;
    })

    LosApplicationLabel.model.insertMany(applicationLabelDocs);
  
    // creating Los Document Template
    const template_doc = await auth_utilities.createDefaultDocumentTemplate({ org });
    template_doc.organization = org._id.toString();
    template_doc.name = 'Example Loan Agreement';
    template_doc.user = userKey;
   
    Template.create({ newdoc: template_doc, });
    
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

module.exports = {
  createOrg,
  createLosDependencies,
  updateOrg,
  activateOrg,
  sendCreateOrgResponse,
  downloadJSONToCSV,
  getGeneralInfo,
  editGeneralInfo,
  getOrg,
  APIgetOrg,
  loadOrg,
  putUserroleOnOrg,
  getActivityLogs,
  seedNewOrganization,
  checkOrganizationBalance,
};