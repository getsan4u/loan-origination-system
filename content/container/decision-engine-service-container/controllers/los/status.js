'use strict';

const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const utilities = require('../../utilities');
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;

async function retrieveLosStatusesFromOrg(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const LosStatus = periodic.datas.get('standard_losstatus');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization) ? user.association.organization : {};
    if (organization.los && organization.los.statuses.length) {
      const populatedStatuses = await Promise.all(organization.los.statuses.map(async (id) => {
        return await LosStatus.model.findOne({ _id: id.toString() });
      }))
      req.controllerData.los_statuses = populatedStatuses || [];
      next();
    } else {
      res.status(500).send({ message: 'Could not retrieve organization-specific LOS statuses' });
    }
  } catch (e) {
    req.error = e;
    return req;
  }
}

async function getLosStatuses(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const LosStatus = periodic.datas.get('standard_losstatus');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    let populatedStatuses = await LosStatus.model.find({ organization });
    populatedStatuses = populatedStatuses.map(status => status.toJSON ? status.toJSON() : status);
    req.controllerData.los_statuses = populatedStatuses || [];
    next();
  } catch (e) {
    req.error = e;
    return req;
  }
}


async function getLosStatus(req, res, next) {
  try {
    const LosStatus = periodic.datas.get('standard_losstatus');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const losstatus = await LosStatus.model.findOne({ _id: req.params.id, organization }).lean();
    req.controllerData.losstatus = losstatus;
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function updateLosStatus(req, res, next) {
  try {
    const LosStatus = periodic.datas.get('standard_losstatus');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    if (req.body.name) {
      await LosStatus.model.updateOne({ _id: req.params.id, organization }, { $set: { name: req.body.name } });
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

module.exports = {
  retrieveLosStatusesFromOrg,
  getLosStatuses,
  getLosStatus,
  updateLosStatus,
};