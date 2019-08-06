'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;
const flatten = require('flat'); 

async function createApplication(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.message) throw new Error(req.message);
    const Application = periodic.datas.get('standard_losapplication');
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    let created = await Application.create({ newdoc: Object.assign({}, req.body.data, { organization: organization._id, }), });
    const application = await Application.model.findOne({ _id: created._id }).populate('product status team_members labels').lean();
    if (application.intermediary) {
      application.intermediary = await Intermediary.model.findOne({ _id: application.intermediary, organization }).lean();
    }
    req.controllerData.application = application;
    return next();
  } catch (err) {
    logger.warn('createApplication: ', err.message);
    return res.status(400).send({
      message: req.message || 'Failed to create application',
    });
  }
}

async function getApplicationResources(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    let { application, applications, } = req.controllerData;
    const Product = periodic.datas.get('standard_losproduct');
    const TeamMember = periodic.datas.get('standard_user');
    const Label = periodic.datas.get('standard_losapplicationlabel');
    const Status = periodic.datas.get('standard_losstatus');
    if (applications && Array.isArray(applications)) {
      const productIds = new Set();
      const teamMemberIds = new Set();
      const labelIds = new Set();
      const statusIds = new Set();
      for (let i = 0; i < applications.length; i++) {
        const application = applications[ i ];
        if (application.product) productIds.add(application.product.toString());
        if (Array.isArray(application.team_members) && application.team_members.length) application.team_members.forEach(member => teamMemberIds.add(member));
        if (Array.isArray(application.labels) && application.labels.length) application.labels.forEach(label => labelIds.add(label));
        if (application.status) statusIds.add(application.status.toString());
      }
      const products = await Product.model.find({ organization, _id: { $in: [ ...productIds ] } }).lean();
      const team_members = await TeamMember.model.find({ organization, _id: { $in: [ ...teamMemberIds ] } }).lean();
      const labels = await Label.model.find({ organization, _id: { $in: [ ...labelIds ] } }).lean();
      const statuses = await Status.model.find({ organization, _id: { $in: [ ...statusIds ] } }).lean();
      req.controllerData.applicationResources = {
        products,
        team_members,
        labels,
        statuses,
      };
    } else {
      const product = await Product.model.findOne({ organization, _id: application.product.toString() }).lean();
      const team_members = await TeamMember.model.find({ organization, _id: { $in: application.team_members } }).lean();
      const labels = await Label.model.find({ organization, _id: { $in: application.labels } }).lean();
      const status = await Status.model.findOne({ organization, _id: application.status.toString() }).lean();
      req.controllerData.applicationResources = {
        product,
        team_members,
        labels,
        status,
      };
    }
    next();
  } catch (err) {
    logger.warn('createApplication: ', err.message);
    return res.status(400).send({
      message: req.message || 'Failed to create application',
    });

  }
}

async function getApplicationByCustomer(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Application = periodic.datas.get('standard_losapplication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.applications = [];
    if (req.query && req.query.customer_id) {
      let applications = await Application.model.find({ customer_id: req.query.customer_id, organization: organization._id, }).populate('product status team_members labels').lean();
      applications = applications || [];
      req.controllerData.applications = applications;
    }
    return next();
  } catch (err) {
    logger.warn('getApplicationByCustomer: ', err.message);
    return res.status(400).send({
      message: 'Unable to find an application with this Customer ID',
    });
  }
}

async function getApplication(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Application = periodic.datas.get('standard_losapplication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.application = await Application.model.findOne({ _id: req.params.id, organization: organization._id, }).populate('product status team_members labels').lean();
    if (!req.controllerData.application) throw new Error('Unable to find an application with this ID');
    return next();
  } catch (err) {
    logger.warn('getApplication: ', err.message);
    return res.status(400).send({
      message: 'Unable to find an application with this ID',
    });
  }
}

async function updateApplication(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Application = periodic.datas.get('standard_losapplication');
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.body.data.organization = organization._id.toString();
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      await Application.model.updateOne({ _id: req.params.id, organization: organization._id, }, { $set: flatten(req.body.data) },).lean();
      req.controllerData.application = await Application.model.findOne({ _id: req.params.id, organization: organization._id, }).populate('product status team_members labels').lean();
    } else {
      req.controllerData.application = await Application.model.findOneAndUpdate({ _id: req.params.id, organization: organization._id, }, req.body.data, { new: true, }).populate('product status team_members labels').lean();
    }
    if (req.controllerData.application.intermediary) {
      req.controllerData.application.intermediary = await Intermediary.model.findOne({ _id: req.controllerData.application.intermediary, organization }).lean();
    }
    if (!req.controllerData.application) throw new Error('Unable to find an application with this ID');
    return next();
  } catch (err) {
    logger.warn('updateApplication: ', err.message);
    return res.status(400).send({
      message: 'Failed to update application',
    });
  }
}

async function deleteApplication(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Application = periodic.datas.get('standard_losapplication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.application = await Application.model.deleteOne({ _id: req.params.id, organization: organization._id, }).lean();
    if (req.controllerData.application && !req.controllerData.application.deletedCount) throw new Error('No application with that ID');
    return next();
  } catch (err) {
    logger.warn('deleteApplication: ', err.message);
    return res.status(400).send({
      message: 'Failed to delete application',
    });
  }
}

module.exports = {
  createApplication,
  getApplicationByCustomer,
  getApplicationResources,
  getApplication,
  updateApplication,
  deleteApplication,
};