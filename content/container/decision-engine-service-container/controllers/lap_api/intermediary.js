'use strict';

const periodic = require('periodicjs');
const Promisie = require('promisie');
const logger = periodic.logger;
const moment = require('moment');

async function createIntermediary(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.intermediary = await Intermediary.create({ newdoc: Object.assign({}, req.body.data, { organization: organization._id, }), });
    return next();
  } catch (err) {
    logger.warn('createIntermediary: ', err.message);
    return res.status(400).send({
      message: 'Failed to create intermediary',
    });
  }
}

async function getIntermediary(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.intermediary = await Intermediary.model.findOne({ _id: req.params.id, organization: organization._id, });
    if (!req.controllerData.intermediary) throw new Error('Unable to find a intermediary with this ID');
    return next();
  } catch (err) {
    logger.warn('getIntermediary: ', err.message);
    return res.status(400).send({
      message: 'Unable to find a intermediary with this ID',
    });
  }
}

async function searchIntermediaries(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    if (req.query) {
      let intermediaries = [];
      if (req.query.name) {
        intermediaries = await Intermediary.model.find({ 
          organization: organization._id, 
          name: req.query.name,
        }).lean();
      } 
      intermediaries = intermediaries || [];
      req.controllerData.intermediaries = intermediaries;
    }
    return next();
  } catch (err) {
    logger.warn('searchIntermediaries: ', err.message);
    return res.status(400).send({
      message: 'Unable to find intermediaries',
    });
  }
}

async function updateIntermediary(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.intermediary = await Intermediary.model.findOneAndUpdate({ _id: req.params.id, organization: organization._id, }, req.body.data, { new: true, });
    if (!req.controllerData.intermediary) throw new Error('Unable to find a intermediary with this ID');
    return next();
  } catch (err) {
    logger.warn('updateIntermediary: ', err.message);
    return res.status(400).send({
      message: 'Unable to update intermediary',
    });
  }
}

async function deleteIntermediary(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.intermediary = await Intermediary.model.deleteOne({ _id: req.params.id, organization: organization._id, });
    if (req.controllerData.intermediary && !req.controllerData.intermediary.deletedCount) throw new Error('Unable to find a intermediary with this ID');
    return next();
  } catch (err) {
    logger.warn('deleteIntermediary: ', err.message);
    return res.status(400).send({
      message: 'Unable to delete intermediary',
    });
  }
}

async function getAllIntermediariesForOrganization(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.intermediaries = await Intermediary.model.find({ organization: organization._id, }).lean();
    req.controllerData.intermediaryMap = {};
    req.controllerData.intermediaries.forEach(intermediary => {
      req.controllerData.intermediaryMap[ intermediary._id.toString() ] = intermediary;
    });
    return next();
  } catch (err) {
    logger.warn('getAllCompaniesForOrganization', err.message);
    return res.status(400).send({
      message: 'Unable to complete this operation. Please contact support',
    })
  }
}

async function getAllIntermediariesForOrganizationById(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.intermediaries = await Intermediary.model.find({ organization: organization._id, }).lean();
    req.controllerData.intermediaryMapById = {};
    req.controllerData.intermediaries.forEach(intermediary => {
      req.controllerData.intermediaryMapById[ intermediary._id.toString() ] = intermediary;
    });
    return next();
  } catch (err) {
    logger.warn('getAllIntermediariesForOrganization', err.message);
    return res.status(400).send({
      message: 'Unable to complete this operation. Please contact support',
    })
  }
}

async function getAllIntermediariesForOrganizationByName(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.intermediaries = await Intermediary.model.find({ organization: organization._id, }).lean();
    req.controllerData.intermediaryMapByName = {};
    req.controllerData.intermediaries.forEach(intermediary => {
      req.controllerData.intermediaryMapByName[ intermediary.name ] = intermediary;
    });
    return next();
  } catch (err) {
    logger.warn('getAllIntermediariesForOrganization', err.message);
    return res.status(400).send({
      message: 'Unable to complete this operation. Please contact support',
    })
  }
}


module.exports = {
  createIntermediary,
  getIntermediary,
  updateIntermediary,
  deleteIntermediary,
  searchIntermediaries,
  getAllIntermediariesForOrganizationById,
  getAllIntermediariesForOrganizationByName,
};