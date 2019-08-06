'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;

async function createCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.message) throw new Error(req.message);
    const Case = periodic.datas.get('standard_case');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.case = await Case.create({ newdoc: Object.assign({}, req.body.data, { organization: organization._id, }), }).populate({
      path: 'strategy', select: [ 'display_title', 'version', 'status' ]
    });
    return next();
  } catch (err) {
    logger.warn('createCase: ', err.message);
    return res.status(400).send({
      message: req.message || 'Failed to create case',
    });
  }
}

async function getCaseByApplication(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Case = periodic.datas.get('standard_case');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.rules_engine_results = await Case.model.find({ application: req.query.application_id, organization: organization._id, }).populate({
      path: 'strategy', select: [ 'display_title', 'version', 'status' ]
    }).lean();
    return next();
  } catch (err) {
    logger.warn('getCaseByCustomer: ', err.message);
    return res.status(400).send({
      message: 'Unable to find an case with this Customer ID',
    });
  }
}

async function getCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Case = periodic.datas.get('standard_case');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.rules_engine_result = await Case.model.findOne({ _id: req.params.id, organization: organization._id, }).populate({
      path: 'strategy', select: [ 'display_title', 'version', 'status' ]
    }).lean();
    if (!req.controllerData.rules_engine_result) throw new Error('Unable to find an case with this ID');
    return next();
  } catch (err) {
    logger.warn('getCase: ', err.message);
    return res.status(400).send({
      message: 'Unable to find an case with this ID',
    });
  }
}

async function updateCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Case = periodic.datas.get('standard_case');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.body.data.organization = organization._id.toString();
    req.controllerData.rules_engine_result = await Case.model.findOneAndUpdate({ _id: req.params.id, organization: organization._id, }, req.body.data, { new: true, }).populate({
      path: 'strategy', select: [ 'display_title', 'version', 'status' ]
    }).lean();
    if (!req.controllerData.rules_engine_result) throw new Error('Unable to find an case with this ID');
    return next();
  } catch (err) {
    logger.warn('updateCase: ', err.message);
    return res.status(400).send({
      message: 'Failed to update case',
    });
  }
}

async function deleteCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Case = periodic.datas.get('standard_case');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.rules_engine_result = await Case.model.deleteOne({ _id: req.params.id, organization: organization._id, });
    if (req.controllerData.rules_engine_result && !req.controllerData.rules_engine_result.deletedCount) throw new Error('No case with that ID');
    return next();
  } catch (err) {
    logger.warn('deleteCase: ', err.message);
    return res.status(400).send({
      message: 'Failed to delete case',
    });
  }
}

async function getBatchCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    const Case = periodic.datas.get('standard_case');
    const Simulation = periodic.datas.get('standard_simulation');
    let rules_engine_results = [];
    const simulation = await Simulation.model.findOne({ organization, _id: req.params.id }).populate('results').lean();
    const caseIds = simulation.results.map(batch => batch.results).flat().map(caseProp => caseProp.case);
    rules_engine_results = await Case.model.find({ _id: { $in: caseIds, } }).populate({
      path: 'strategy', select: [ 'display_title', 'version', 'status' ]
    }).lean();
    req.controllerData.rules_engine_results = rules_engine_results;
    return next();
  } catch (err) {
    logger.warn('getCaseByCustomer: ', err.message);
    return res.status(400).send({
      message: 'Unable to find an case with this Customer ID',
    });
  }
}


async function updateBatchCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    const Case = periodic.datas.get('standard_case');
    const casesToUpdate = req.body.data;
    let updatedCases = [];
    for (let i = 0; i < casesToUpdate.length; i++) {
      let casedoc = casesToUpdate[ i ];
      let updated = await Case.model.findOneAndUpdate({ _id: casedoc._id, organization: organization._id, }, casedoc, { new: true, }).populate({
        path: 'strategy', select: [ 'display_title', 'version', 'status' ]
      }).lean();
      updatedCases.push(updated);
    }
    req.controllerData.rules_engine_results = updatedCases;
    return next();
  } catch (err) {
    logger.warn('updateBatchCase: ', err.message);
    return res.status(400).send({
      message: 'Unable to find an case with this Customer ID',
    });
  }
}

async function deleteBatchCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    const Case = periodic.datas.get('standard_case');
    const Simulation = periodic.datas.get('standard_simulation');
    const Batch = periodic.datas.get('standard_batch');
    const simulation = await Simulation.model.findOne({ organization, _id: req.params.id }).populate('results').lean();
    const caseIds = simulation.results.map(batch => batch.results).flat().map(caseProp => caseProp.case);
    req.controllerData.rules_engine_results = await Case.model.deleteMany({ _id: { $in: caseIds, }, organization: organization._id, });
    await Batch.model.deleteMany({ _id: { $in: simulation.results, } });
    await Simulation.model.deleteOne({ _id: req.params.id, organization: organization._id, });
    if (req.controllerData.rules_engine_results && !req.controllerData.rules_engine_results.deletedCount) throw new Error('No case with that ID');
    return next();
  } catch (err) {
    logger.warn('deleteBatchCase: ', err.message);
    return res.status(400).send({
      message: 'Unable to find an case with this Customer ID',
    });
  }
}

module.exports = {
  createCase,
  getCaseByApplication,
  getCase,
  updateCase,
  deleteCase,
  deleteBatchCase,
  getBatchCase,
  updateBatchCase,
};