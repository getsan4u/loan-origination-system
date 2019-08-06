'use strict';

const periodic = require('periodicjs');
const Busboy = require('busboy');
const pdfFiller = require('pdffiller-stream');
const Promisie = require('promisie');
const Bluebird = require('bluebird');
const fs = Promisie.promisifyAll(require('fs-extra'));
const path = require('path');
const logger = periodic.logger;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const utilities = require('../../utilities');
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;

async function createLabel(req, res, next) {
  try {
    const Label = periodic.datas.get('standard_losapplicationlabel');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    let newdoc = req.body;
    newdoc.user = {};
    newdoc.user.creator = `${user.first_name} ${user.last_name}`;
    newdoc.user.updater = `${user.first_name} ${user.last_name}`;
    newdoc.organization = organization;
    let created;
    created = await Label.create({ newdoc: Object.assign({ organization, }, newdoc), });
    req.controllerData.label = created;
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getLabel(req, res, next) {
  try {
    const Label = periodic.datas.get('standard_losapplicationlabel');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const label = await Label.model.findOne({ _id: req.params.id, organization, }).lean();
    req.controllerData = req.controllerData || {};
    req.controllerData.label = label;
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

async function updateLabel(req, res, next) {
  try {
    const Label = periodic.datas.get('standard_losapplicationlabel');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    await Label.model.updateOne({ _id: req.params.id, organization }, { $set: { name: req.body.name, color: req.body.color } });
    next();
  } catch (e) {
    next(e);
  }
}

async function getLabels(req, res, next) {
  try {
    const Label = periodic.datas.get('standard_losapplicationlabel');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    if (req.query && req.query.paginate) {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: '' };
      let result = await Label.query(queryOptions);
      const numItems = await Label.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 50);
      let labels = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
      labels = labels.map(app => app = app.toJSON ? app.toJSON() : app);
      req.controllerData = Object.assign({}, req.controllerData, { rows: labels, skip, numItems, numPages, });
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
      const labels = await Label.model.find(query).limit(limit).populate(populationFields).sort(sort).lean();
      req.controllerData.labels = labels;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getAllLabels(req, res, next) {
  try {
    const Label = periodic.datas.get('standard_losapplicationlabel');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const {
      limit,
      populate,
      sort = '-createdat',
      query = {},
    } = req.query;
    const populationFields = [];
    if (populate) {
      populationFields.push({ path: populate, select: [], });
    }
    const labels = await Label.model.find({ organization }).lean();
    req.controllerData.labels = labels;
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function deleteLabel(req, res, next) {
  try {
    const Label = periodic.datas.get('standard_losapplicationlabel');
    req.controllerData = req.controllerData || {};
    await Label.model.deleteOne({ _id: req.params.id });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

module.exports = {
  getAllLabels,
  getLabels,
  getLabel,
  createLabel,
  updateLabel,
  deleteLabel,
};