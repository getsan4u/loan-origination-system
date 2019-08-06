'use strict';

const periodic = require('periodicjs');
const Promisie = require('promisie');
const logger = periodic.logger;
const moment = require('moment');

async function createStatus(req, res, next) {

}

async function getStatus(req, res, next) {

}

async function updateStatus(req, res, next) {

}

async function deleteStatus(req, res, next) {

}

async function getAllStatusesForOrganizationByName(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Status = periodic.datas.get('standard_losstatus');
  const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
  req.controllerData.statuses = await Status.model.find({ organization: organization._id, }).lean();
  req.controllerData.statusMapByName = {};
  req.controllerData.statuses.forEach(status => {
    req.controllerData.statusMapByName[ status.name ] = status;
  });
  return next();
}

async function getAllStatusesForOrganizationById(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Status = periodic.datas.get('standard_losstatus');
  const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
  req.controllerData.statuses = await Status.model.find({ organization: organization._id, }).lean();
  req.controllerData.statusMapById = {};
  req.controllerData.statuses.forEach(status => {
    req.controllerData.statusMapById[ status._id.toString() ] = status;
  });
  return next();
}



module.exports = {
  createStatus,
  getStatus,
  updateStatus,
  deleteStatus,
  getAllStatusesForOrganizationByName,
  getAllStatusesForOrganizationById,
};