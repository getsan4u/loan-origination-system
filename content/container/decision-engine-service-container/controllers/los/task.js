'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const utilities = require('../../utilities');
const helpers = utilities.helpers;
const losControllerUtil = utilities.controllers.los;
const transformhelpers = utilities.transformhelpers;

async function createTask(req, res, next) {
  try {
    const Task = periodic.datas.get('standard_lostask');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.body.team_members = req.body.team_members || [];
    req.body.people = req.body.people || [];
    req.body.team_members = req.body.team_members.filter(Boolean);
    req.body.people = req.body.people.filter(Boolean);
    let created;
    created = await Task.create({ newdoc: Object.assign({ organization, }, req.body), });
    req.controllerData = req.controllerData || {};
    req.controllerData.task = created;
    next();
  } catch (e) {
    logger.warn(e.message)
    return next(e);
  }
}

async function getTask(req, res, next) {
  try {
    const Task = periodic.datas.get('standard_lostask');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const task = await Task.model.findOne({ _id: req.params.id, organization, }).lean();
    req.controllerData = req.controllerData || {};
    req.controllerData.task = task;
    next();
  } catch (e) {
    logger.warn(e.message)
  }
}

async function updateTask(req, res, next) {
  try {
    const Task = periodic.datas.get('standard_lostask');
    req.controllerData = req.controllerData || {};
    let updateOptions = {};
    req.body.team_members = req.body.team_members || [];
    req.body.people = req.body.people || [];
    req.body.team_members = req.body.team_members.filter(Boolean);
    req.body.people = req.body.people.filter(Boolean);
    if (req.query && req.query.done) {
      const task = await Task.model.findOne({ _id: req.params.id }).lean();
      await Task.model.updateOne({ _id: req.params.id, }, { done: !task.done });
    } else {
      updateOptions = {
        query: { _id: req.params.id, },
        updatedoc: { $set: req.body, },
      };
      await Task.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function deleteTask(req, res, next) {
  try {
    const Task = periodic.datas.get('standard_lostask');
    req.controllerData = req.controllerData || {};
    await Task.model.deleteOne({ _id: req.params.id });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getTasks(req, res, next) {
  try {
    const Task = periodic.datas.get('standard_lostask');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    if (req.query.paginate) {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'team_members company people application' };
      const { $and, $or, } = losControllerUtil.__formatTaskMongoQuery({ req });
      if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
      if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
      const tasks = await Task.model.find(queryOptions.query).populate([ { path: 'team_members' }, { path: 'people' }, { path: 'company' }, { path: 'application' }, ]).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
      const numItems = await Task.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 50);
      req.controllerData = Object.assign({}, req.controllerData, { rows: tasks || [], skip, numItems, numPages, });
    } else {
      const {
        limit,
        populate,
        sort = '-createdat',
        query = {},
      } = req.query;
      query.organization = organization;
      const populationFields = [];
      if (populate) {
        populationFields.push({ path: populate, select: [], });
      }
      const tasks = await Task.model.find(query).limit(limit).populate(populationFields).sort(sort).lean();
      req.controllerData.tasks = tasks;
    }
    next();
  } catch (e) {
    logger.warn(e.message)
    next(e);
  }
}

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};