'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const utilities = require('../../utilities');
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;
const losControllerUtil = utilities.controllers.los;

async function getCustomerTemplates(req, res, next) {
  try {
    const LosCustomerTemplate = periodic.datas.get('standard_loscustomertemplate');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const customer_templates = await LosCustomerTemplate.model.find({ organization, }).lean();
    req.controllerData = req.controllerData || {};
    req.controllerData.companytemplate = customer_templates.find(template => template.type === 'company');
    req.controllerData.persontemplate = customer_templates.find(template => template.type === 'person');
    req.controllerData.intermediarytemplate = customer_templates.find(template => template.type === 'intermediary');
    next();
  } catch (e) {
    res.status(500).send({ message: 'Could not find customer templates', });
  }
}

async function getCustomerTemplate(req, res, next) {
  try {
    const LosCustomerTemplate = periodic.datas.get('standard_loscustomertemplate');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const customertemplate = await LosCustomerTemplate.model.findOne({ _id: req.params.id, organization, }).lean();
    req.controllerData.customertemplate = customertemplate;
    next();
  } catch (e) {
    res.status(500).send({ message: 'Could not find customer templates', });
  }
}

async function setCustomerTemplateId(req, res, next) {
  try {
    req.controllerData._id = req.params.id;
    next();
  } catch (e) {
    res.status(500).send({ message: 'Could not set customer template id', });
  }
}

async function updateCustomerTemplate(req, res, next) {
  try {
    const LosCustomerTemplate = periodic.datas.get('standard_loscustomertemplate');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    const customertemplate = req.controllerData.customertemplate;
    const updatedoc = {};
    if (req.query.type === 'patch_template_item') {
      updatedoc[ '$set' ] = { [ `template.${req.body.name}` ]: { value_type: req.body.value_type, }, };
    } else if (req.query.type === 'delete_template_item') {
      customertemplate.template = customertemplate.template || {};
      const template_items = Object.entries(customertemplate.template).map(([ name, detail, ], idx) => ({ name, idx, _id: customertemplate._id.toString(), value_type: detail.value_type, }));
      const delete_key = template_items[ req.params.idx ].name;
      updatedoc[ '$unset' ] = { [ `template.${delete_key}` ]: { value_type: req.body.value_type, }, };
    }
    updatedoc.updatedat = new Date();
    updatedoc.user = updatedoc.user || {};
    updatedoc.user.updater = `${user.first_name} ${user.last_name}`;
    let updateOptions = {};
    updateOptions = {
      query: { _id: req.params.id, organization, },
      updatedoc,
    };
    await LosCustomerTemplate.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

module.exports = {
  getCustomerTemplate,
  getCustomerTemplates,
  updateCustomerTemplate,
  setCustomerTemplateId,
};
