'use strict';

const periodic = require('periodicjs');
const Promisie = require('promisie');
const logger = periodic.logger;
const moment = require('moment');
const flatten = require('flat');

async function createTask(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Task = periodic.datas.get('standard_lostask');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.task = await Task.create({ newdoc: Object.assign({}, req.body.data, { organization: organization._id, }), });
    return next();
  } catch (err) {
    logger.warn('createTask: ', err.message);
    return res.status(400).send({
      message: 'Failed to create task',
    });
  }
}

async function getTask(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Task = periodic.datas.get('standard_lostask');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.task = await Task.model.findOne({ _id: req.params.id, organization: organization._id, }).lean();
    if (!req.controllerData.task) throw new Error('Unable to find a task with this ID');
    return next();
  } catch (err) {
    logger.warn('getTask: ', err.message);
    return res.status(400).send({
      message: 'Unable to find a task with this ID',
    });
  }
}

async function searchTasks(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Task = periodic.datas.get('standard_lostask');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    if (req.query) {
      let tasks = [];
      if (req.query.application_id) tasks = await Task.model.find({ application: req.query.application_id, organization: organization._id, }).lean();
      else if (req.query.customer_id) {
        tasks = await Task.model.find({ 
          organization: organization._id, 
          $or: [{
            company: req.query.customer_id, 
          }, {
            people: req.query.customer_id, 
          }] 
        }).lean();
      } else if (req.query.team_member_id) {
        tasks = await Task.model.find({ team_members: req.query.team_member_id, organization: organization._id, }).lean();
      }
      tasks = tasks || [];
      req.controllerData.tasks = tasks;
    }
    return next();
  } catch (err) {
    logger.warn('searchTasks: ', err.message);
    return res.status(400).send({
      message: 'Unable to find tasks',
    });
  }
}

async function updateTask(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Task = periodic.datas.get('standard_lostask');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      await Task.model.updateOne({ _id: req.params.id, organization: organization._id, }, { $set: flatten(req.body.data) },).lean();
      req.controllerData.task = await Task.model.findOne({ _id: req.params.id, organization: organization._id, }).lean();
    } else {
      req.controllerData.task = await Task.model.findOneAndUpdate({ _id: req.params.id, organization: organization._id, }, req.body.data, { new: true, });
    }
    if (!req.controllerData.task) throw new Error('Unable to find a task with this ID');
    return next();
  } catch (err) {
    logger.warn('updateTask: ', err.message);
    return res.status(400).send({
      message: 'Unable to update task',
    });
  }
}

async function deleteTask(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Task = periodic.datas.get('standard_lostask');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.task = await Task.model.deleteOne({ _id: req.params.id, organization: organization._id, });
    if (req.controllerData.task && !req.controllerData.task.deletedCount) throw new Error('Unable to find a task with this ID');
    return next();
  } catch (err) {
    logger.warn('deleteTask: ', err.message);
    return res.status(400).send({
      message: 'Unable to delete task',
    });
  }
}


module.exports = {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  searchTasks,
};