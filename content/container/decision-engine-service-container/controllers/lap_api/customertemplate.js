'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;

async function createCustomerTemplate(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.message) throw new Error(req.message);
    const CustomerTemplate = periodic.datas.get('standard_losapplication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.application = await CustomerTemplate.create({ newdoc: Object.assign({}, req.body.data, { organization: organization._id, }), });
    return next();
  } catch (err) {
    logger.warn('createCustomerTemplate: ', err.message);
    return res.status(400).send({
      message: req.message || 'Failed to create application',
    });
  }
}

async function getCustomerTemplateByOrg(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const CustomerTemplate = periodic.datas.get('standard_losapplication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.applications = await CustomerTemplate.model.find({ customer_id: req.params.id, organization: organization._id, });
    req.controllerData.applications = req.controllerData.applications.map(application => {
      return application._id;
    });
    return next();
  } catch (err) {
    logger.warn('getCustomerTemplateByCustomer: ', err.message);
    return res.status(400).send({
      message: 'Unable to find an application with this Customer ID',
    });
  }
}

async function getCustomerTemplate(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const CustomerTemplate = periodic.datas.get('standard_losapplication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.application = await CustomerTemplate.model.findOne({ _id: req.params.id, organization: organization._id, });
    if (!req.controllerData.application) throw new Error('Unable to find an application with this ID');
    return next();
  } catch (err) {
    logger.warn('getCustomerTemplate: ', err.message);
    return res.status(400).send({
      message: 'Unable to find an application with this ID',
    });
  }
}

async function updateCustomerTemplate(req, res, next) {
  try {
    const CustomerTemplate = periodic.datas.get('standard_losapplication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.application = await CustomerTemplate.model.findOneAndUpdate({ _id: req.params.id, organization: organization._id, }, req.body.data, { new: true, });
    if (!req.controllerData.application) throw new Error('Unable to find an application with this ID');
    return next();
  } catch (err) {
    logger.warn('updateCustomerTemplate: ', err.message);
    return res.status(400).send({
      message: 'Failed to update application',
    });
  }
}

async function deleteCustomerTemplate(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const CustomerTemplate = periodic.datas.get('standard_losapplication');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.application = await CustomerTemplate.model.deleteOne({ _id: req.params.id, organization: organization._id, });
    if (req.controllerData.application && !req.controllerData.application.deletedCount) throw new Error('No application with that ID');
    return next();
  } catch (err) {
    logger.warn('deleteCustomerTemplate: ', err.message);
    return res.status(400).send({
      message: 'Failed to delete application',
    });
  }
}


async function getAllCustomerTemplateForOrganizationByType(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const CustomerTemplate = periodic.datas.get('standard_loscustomertemplate');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.customertemplates = await CustomerTemplate.model.find({ organization: organization._id, }).lean();
    req.controllerData.customerTemplateMapByType = {};
    req.controllerData.customertemplates.forEach(ct => {
      req.controllerData.customerTemplateMapByType[ ct.type ] = ct;
    });
    return next();
  } catch (err) {
    logger.warn('getAllCustomerTemplatesForOrganization', err.message);
    return res.status(400).send({
      message: 'Unable to complete this operation. Please contact support',
    })
  }
}

module.exports = {
  createCustomerTemplate,
  getCustomerTemplateByOrg,
  getCustomerTemplate,
  updateCustomerTemplate,
  deleteCustomerTemplate,
  getAllCustomerTemplateForOrganizationByType,
};