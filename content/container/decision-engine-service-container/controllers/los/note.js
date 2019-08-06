'use strict';

const periodic = require('periodicjs');
const url = require('url');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const utilities = require('../../utilities');
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;
const losControllerUtil = utilities.controllers.los;

async function getNote(req, res, next) {
  try {
    const Note = periodic.datas.get('standard_losnote');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const note = await Note.model.findOne({ _id: req.params.id, organization, }).lean();
    req.controllerData.note = note;
    req.controllerData.formdata = note;
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function updateNote(req, res, next) {
  try {
    const Note = periodic.datas.get('standard_losnote');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    const updatedoc = {};
    updatedoc[ '$set' ] = {
      [ 'user.updater' ]: `${user.first_name} ${user.last_name}`,
      updatedat: new Date(),
      content: req.body.content,
    };
    let updateOptions = {};
    updateOptions = {
      query: { _id: req.params.id, organization, },
      updatedoc,
    };
    await Note.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function deleteNote(req, res, next) {
  try {
    const Note = periodic.datas.get('standard_losnote');
    req.controllerData = req.controllerData || {};
    await Note.model.deleteOne({ _id: req.params.id, });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function createNote(req, res, next) {
  try {
    const Note = periodic.datas.get('standard_losnote');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const entity_type = req.query.entity_type;
    req.body.organization = organization;
    req.body.author = user._id.toString();
    req.body.user = { creator: `${user.first_name} ${user.last_name}`, updater: `${user.first_name} ${user.last_name}`, };
    req.body[entity_type] = req.body[entity_type] || req.params.id;
    const created = await Note.create({ newdoc: Object.assign({}, req.body), });
    req.controllerData = req.controllerData || {};
    req.controllerData.note = created;
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

module.exports = {
  createNote,
  getNote,
  updateNote,
  deleteNote,
};