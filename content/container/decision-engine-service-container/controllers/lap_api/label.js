'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;

async function createLabel(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Label = periodic.datas.get('standard_losapplicationlabel');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.label = await Label.create({ newdoc: Object.assign({}, req.body.data, { organization: organization._id, }), });
    return next();
  } catch (err) {
    logger.warn('createdLabel: ', err.message);
    return res.status(400).send({
      message: 'Failed to create label',
    });
  }
}

async function findLabelByName(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Label = periodic.datas.get('standard_losapplicationlabel');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.label = await Label.model.find({ name: req.params.name, organization: organization._id, });
    if (req.controllerData.label) {
      req.controllerData.labels = req.controllerData.label.map((label) => {
        return label._id;
      });
    }
    return next();
  } catch (err) {
    logger.warn('findLabelsByName: ', err.message);
    return res.status(400).send({
      message: 'Unable to find a label with this EIN',
    });
  }
}

async function getLabel(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Label = periodic.datas.get('standard_losapplicationlabel');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.label = await Label.model.findOne({ _id: req.params.id, organization: organization._id, });
    if (!req.controllerData.label) throw new Error('Unable to find a label with this ID');
    return next();
  } catch (err) {
    logger.warn('getLabel: ', err.message);
    return res.status(400).send({
      message: 'Unable to find a label with this ID',
    });
  }
}

async function updateLabel(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Label = periodic.datas.get('standard_losapplicationlabel');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.label = await Label.model.findOneAndUpdate({ _id: req.params.id, organization: organization._id, }, req.body.data, { new: true, });
    if (!req.controllerData.label) throw new Error('Unable to find a label with this ID');
    return next();
  } catch (err) {
    logger.warn('updateLabel: ', err.message);
    return res.status(400).send({
      message: 'Unable to update label',
    });
  }
}

async function deleteLabel(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Label = periodic.datas.get('standard_losapplicationlabel');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.label = await Label.model.deleteOne({ _id: req.params.id, organization: organization._id, });
    if (req.controllerData.label && !req.controllerData.label.deletedCount) throw new Error('Unable to find a label with this ID');
    return next();
  } catch (err) {
    logger.warn('deleteLabel: ', err.message);
    return res.status(400).send({
      message: 'Unable to delete label',
    });
  }
}

async function getAllLabelsForOrganizationById(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Label = periodic.datas.get('standard_losapplicationlabel');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.labels = await Label.model.find({ organization: organization._id, }).lean();
    req.controllerData.labelMapById = {};
    req.controllerData.labels.forEach(label => {
      req.controllerData.labelMapById[ label._id.toString() ] = label;
    });
    return next();
  } catch (err) {
    logger.warn('getAllLabelsForOrganization', err.message);
    return res.status(400).send({
      message: 'Unable to complete this operation. Please contact support',
    })
  }
}

async function getAllLabelsForOrganizationByName(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Label = periodic.datas.get('standard_losapplicationlabel');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.labels = await Label.model.find({ organization: organization._id, }).lean();
    req.controllerData.labelMapByName = {};
    req.controllerData.labels.forEach(label => {
      req.controllerData.labelMapByName[ label.name ] = label;
    });
    return next();
  } catch (err) {
    logger.warn('getAllLabelsForOrganization', err.message);
    return res.status(400).send({
      message: 'Unable to complete this operation. Please contact support',
    })
  }
}

module.exports = {
  createLabel,
  findLabelByName,
  getLabel,
  updateLabel,
  deleteLabel,
  getAllLabelsForOrganizationById,
  getAllLabelsForOrganizationByName,
};