'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;
const flatten = require('flat'); 

async function createCompany(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Company = periodic.datas.get('standard_loscompany');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    let company = await Company.create({ newdoc: Object.assign({}, req.body.data, { organization: organization._id, }), });
    req.controllerData.company = company.toJSON ? company.toJSON() : company;
    return next();
  } catch (err) {
    logger.warn('createdCompany: ', err.message);
    return res.status(400).send({
      message: 'Failed to create company',
    });
  }
}

async function findCompanyByEIN(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Company = periodic.datas.get('standard_loscompany');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.companies = [];
    if (req.query && req.query.ein) {
      let companies = await Company.model.find({ ein: req.query.ein, organization: organization._id, }).lean();
      companies = companies || [];
      req.controllerData.companies = companies;
    }
    return next();
  } catch (err) {
    logger.warn('findCompanyByEIN: ', err.message);
    return res.status(400).send({
      message: 'Unable to find a company with this EIN',
    });
  }
}

async function getCompany(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Company = periodic.datas.get('standard_loscompany');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.company = await Company.model.findOne({ _id: req.params.id, organization: organization._id, }).lean();
    if (!req.controllerData.company) throw new Error('Unable to find a company with this ID');
    return next();
  } catch (err) {
    logger.warn('getCompany: ', err.message);
    return res.status(400).send({
      message: 'Unable to find a company with this ID',
    });
  }
}

async function updateCompany(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Company = periodic.datas.get('standard_loscompany');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      await Company.model.updateOne({ _id: req.params.id, organization: organization._id, }, { $set: flatten(req.body.data) },).lean();
      req.controllerData.person = await Company.model.findOne({ _id: req.params.id, organization: organization._id, }).lean();
    } else {
      req.controllerData.company = await Company.model.findOneAndUpdate({ _id: req.params.id, organization: organization._id, }, req.body.data, { new: true, }).lean();
    }
    if (!req.controllerData.company) throw new Error('Unable to find a company with this ID');
    return next();
  } catch (err) {
    logger.warn('updateCompany: ', err.message);
    return res.status(400).send({
      message: 'Unable to update company',
    });
  }
}

async function deleteCompany(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Company = periodic.datas.get('standard_loscompany');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.company = await Company.model.deleteOne({ _id: req.params.id, organization: organization._id, }).lean();
    if (req.controllerData.company && !req.controllerData.company.deletedCount) throw new Error('Unable to find a company with this ID');
    return next();
  } catch (err) {
    logger.warn('deleteCompany: ', err.message);
    return res.status(400).send({
      message: 'Unable to delete company',
    });
  }
}

async function getAllCompaniesForOrganization(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Company = periodic.datas.get('standard_loscompany');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.companies = await Company.model.find({ organization: organization._id, }).lean();
    req.controllerData.companyMap = {};
    req.controllerData.companies.forEach(company => {
      req.controllerData.companyMap[ /*company.name.toLowerCase() */ company._id.toString() ] = company;
    });
    return next();
  } catch (err) {
    logger.warn('getAllCompaniesForOrganization', err.message);
    return res.status(400).send({
      message: 'Unable to complete this operation. Please contact support',
    })
  }
}

module.exports = {
  createCompany,
  findCompanyByEIN,
  getCompany,
  updateCompany,
  deleteCompany,
  getAllCompaniesForOrganization,
};