'use strict';

const periodic = require('periodicjs');
const Promisie = require('promisie');
const logger = periodic.logger;
const moment = require('moment');


async function createProduct(req, res, next) {

}

async function getProduct(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Product = periodic.datas.get('standard_losproduct');
  const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
  req.controllerData.product = await Product.model.findOne({ _id: req.params.id, organization: organization._id, }).lean();
  return next();
}

async function updateProduct(req, res, next) {

}

async function deleteProduct(req, res, next) {

}

async function getAllProductsForOrganizationByName(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Product = periodic.datas.get('standard_losproduct');
  const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
  req.controllerData.products = await Product.model.find({ organization: organization._id, }).lean();
  req.controllerData.productMapByName = {};
  req.controllerData.products.forEach(product => {
    req.controllerData.productMapByName[ product.name ] = product;
  });
  return next();
}

async function getAllProductsForOrganizationById(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Product = periodic.datas.get('standard_losproduct');
  const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
  req.controllerData.products = await Product.model.find({ organization: organization._id, }).lean();
  req.controllerData.productMapById = {};
  req.controllerData.products.forEach(product => {
    req.controllerData.productMapById[ product._id.toString() ] = product;
  });
  return next();
}


async function getAllProductsForOrganization(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Product = periodic.datas.get('standard_losproduct');
  const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
  req.controllerData.products = await Product.model.find({ organization: organization._id, }).lean();
  req.controllerData.productMap = {};
  req.controllerData.products.forEach(product => {
    req.controllerData.productMap[ product.name.toLowerCase() ] = product;
  });
  return next();
}

module.exports = {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getAllProductsForOrganization,
  getAllProductsForOrganizationByName,
  getAllProductsForOrganizationById,
};