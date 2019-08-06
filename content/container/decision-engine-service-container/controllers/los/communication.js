'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const utilities = require('../../utilities');
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;
const losControllerUtil = utilities.controllers.los;

async function createCommunication(req, res, next) {
  try {
    const Communication = periodic.datas.get('standard_loscommunication');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.body.team_members = req.body.team_members || [];
    req.body.people = req.body.people || [];
    req.body.team_members = req.body.team_members.filter(Boolean);
    req.body.people = req.body.people.filter(Boolean);
    let created;
    created = await Communication.create({ newdoc: Object.assign({ organization, }, req.body), });
    req.controllerData = req.controllerData || {};
    req.controllerData.communication = created;
    next();
  } catch (e) {
    logger.warn(e.message);
  }
}

async function getCommunication(req, res, next) {
  try {
    const Communication = periodic.datas.get('standard_loscommunication');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const communication = await Communication.model.findOne({ _id: req.params.id, organization, }).lean();
    req.controllerData = req.controllerData || {};
    req.controllerData.communication = communication;
    next();
  } catch (e) {
    logger.warn(e.message);
  }
}

async function updateCommunication(req, res, next) {
  try {
    const Communication = periodic.datas.get('standard_loscommunication');
    req.controllerData = req.controllerData || {};
    let updateOptions = {};
    req.body.team_members = req.body.team_members || [];
    req.body.people = req.body.people || [];
    req.body.team_members = req.body.team_members.filter(Boolean);
    req.body.people = req.body.people.filter(Boolean);
    updateOptions = {
      query: { _id: req.params.id, },
      updatedoc: {
        $set: req.body,
      },
    };
    await Communication.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function deleteCommunication(req, res, next) {
  try {
    const Communication = periodic.datas.get('standard_loscommunication');
    req.controllerData = req.controllerData || {};
    await Communication.model.deleteOne({ _id: req.params.id });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getCommunications(req, res, next) {
  try {
    const Communication = periodic.datas.get('standard_loscommunication');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 50 * (pagenum - 1);
    const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
    let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'team_members company people application' };
    const { $and, $or, } = losControllerUtil.__formatCommunicationMongoQuery({ req });
    if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
    if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
    const communications = await Communication.model.find(queryOptions.query).populate([ { path: 'team_members' }, { path: 'people' }, { path: 'company' }, { path: 'application' } ]).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
    const numItems = await Communication.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 50);
    req.controllerData = Object.assign({}, req.controllerData, { rows: communications, skip, numItems, numPages, });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

module.exports = {
  getCommunications,
  getCommunication,
  createCommunication,
  updateCommunication,
  deleteCommunication,
};