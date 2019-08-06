'use strict';

const periodic = require('periodicjs');
const Promisie = require('promisie');
const logger = periodic.logger;
const moment = require('moment');
const flatten = require('flat');

async function createCommunication(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Communication = periodic.datas.get('standard_loscommunication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.communication = await Communication.create({ newdoc: Object.assign({}, req.body.data, { organization: organization._id, }), });
    return next();
  } catch (err) {
    logger.warn('createCommunication: ', err.message);
    return res.status(400).send({
      message: 'Failed to create communication',
    });
  }
}

async function getCommunication(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Communication = periodic.datas.get('standard_loscommunication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.communication = await Communication.model.findOne({ _id: req.params.id, organization: organization._id, }).lean();
    if (!req.controllerData.communication) throw new Error('Unable to find a communication with this ID');
    return next();
  } catch (err) {
    logger.warn('getCommunication: ', err.message);
    return res.status(400).send({
      message: 'Unable to find a communication with this ID',
    });
  }
}

async function searchCommunications(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Communication = periodic.datas.get('standard_loscommunication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    if (req.query) {
      let communications = [];
      if (req.query.customer_id) {
        communications = await Communication.model.find({ 
          organization: organization._id, 
          people: req.query.customer_id, 
        }).lean();
      } else if (req.query.team_member_id) {
        communications = await Communication.model.find({ team_members: req.query.team_member_id, organization: organization._id, }).lean();
      }
      communications = communications || [];
      req.controllerData.communications = communications;
    }
    return next();
  } catch (err) {
    logger.warn('searchCommunications: ', err.message);
    return res.status(400).send({
      message: 'Unable to find communications',
    });
  }
}

async function updateCommunication(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Communication = periodic.datas.get('standard_loscommunication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      await Communication.model.updateOne({ _id: req.params.id, organization: organization._id, }, { $set: flatten(req.body.data) },).lean();
      req.controllerData.communication = await Communication.model.findOne({ _id: req.params.id, organization: organization._id, }).lean();
    } else {
      req.controllerData.communication = await Communication.model.findOneAndUpdate({ _id: req.params.id, organization: organization._id, }, req.body.data, { new: true, });
    }
    if (!req.controllerData.communication) throw new Error('Unable to find a communication with this ID');
    return next();
  } catch (err) {
    logger.warn('updateCommunication: ', err.message);
    return res.status(400).send({
      message: 'Unable to update communication',
    });
  }
}

async function deleteCommunication(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Communication = periodic.datas.get('standard_loscommunication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.communication = await Communication.model.deleteOne({ _id: req.params.id, organization: organization._id, });
    if (req.controllerData.communication && !req.controllerData.communication.deletedCount) throw new Error('Unable to find a communication with this ID');
    return next();
  } catch (err) {
    logger.warn('deleteCommunication: ', err.message);
    return res.status(400).send({
      message: 'Unable to delete communication',
    });
  }
}


module.exports = {
  createCommunication,
  getCommunication,
  updateCommunication,
  deleteCommunication,
  searchCommunications,
};