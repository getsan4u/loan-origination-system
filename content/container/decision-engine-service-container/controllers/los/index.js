'use strict';

const periodic = require('periodicjs');
const path = require('path');
const Promisie = require('promisie');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const fs = Promisie.promisifyAll(require('fs-extra'));
const utilities = require('../../utilities');
const application = require('./application');
const communication = require('./communication');
const customer = require('./customer');
const customertemplate = require('./customertemplate');
const doc = require('./doc');
const note = require('./note');
const label = require('./label');
const status = require('./status');
const task = require('./task');
const taskbot = require('./taskbot');
const template = require('./template');
const intermediary = require('./intermediary');
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;
const url = require('url');

/**
 * Sends success response.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
async function handleControllerDataResponse(req, res) {
  req.controllerData = req.controllerData || {};
  delete req.controllerData.authorization_header;
  let controllerData = Object.assign({}, req.controllerData);
  delete req.controllerData;
  delete req.body;
  return res.send((controllerData.useSuccessWrapper) ? {
    result: 'success',
    data: controllerData,
  } : controllerData);
}

async function getParsedUrl(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    let parsed = url.parse(req.headers.referer).pathname.slice(1).split('/');
    if (req.query && req.query.parsed_id) req.controllerData._id = parsed[ req.query.parsed_id ];
    parsed.forEach((val, key) => {
      req.controllerData.data[ key ] = val;
    });
    next();
  } catch (e) {
    next(e);
  }
}

async function generateUserImageMap(req, res, next) {
  try {
    const User = periodic.datas.get('standard_user');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    let users = await User.model.find({ 'association.organization': organization }).populate('primaryasset').lean();
    req.controllerData.userImageMap = users.reduce((imageMap, user) => {
      imageMap[ user._id.toString() ] = (user.primaryasset) ? user.primaryasset.fileurl : null;
      return imageMap;
    }, {});
    next();
  } catch (e) {
    next(e);
  }
}

async function getTeamMembersAndUserImageMap(req, res, next) {
  try {
    const User = periodic.datas.get('standard_user');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    let users = await User.model.find({ 'association.organization': organization }).populate('primaryasset').lean();
    req.controllerData.userImageMap = users.reduce((imageMap, user) => {
      imageMap[ user._id.toString() ] = (user.primaryasset) ? user.primaryasset.fileurl : null;
      return imageMap;
    }, {});

    req.controllerData.team_members = users;
    next();
  } catch (e) {
    next(e);
  }
}

async function redirectToProduct(req, res, next) {
  try {
    const product = req.controllerData.product;
    return res.status(200).send({
      pathname: `/los/others/products/${product._id.toString()}`,
    });
  } catch (e) {
    return res.status(500).send({ message: 'Error pulling the template', });
  }
}

async function deleteProduct(req, res, next) {
  try {
    const Product = periodic.datas.get('standard_losproduct');
    req.controllerData = req.controllerData || {};
    await Product.model.deleteOne({ _id: req.params.id });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function downloadSampleData(req, res) {
  let filepath = path.join(process.cwd(), 'content/files/los/example_fillable_pdf.pdf');
  let file = await fs.readFile(filepath);
  let filename = 'Example Promissory Note Fillable PDF.pdf';
  let contenttype = 'application/pdf';
  res.set('Content-Type', contenttype);
  res.attachment(filename);
  res.status(200).send(file).end();
}

async function getModuleResources(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const orgProducts = (user && user.association && user.association.organization && user.association.organization.products) ? user.association.organization.products : {};
    const all_modules = [ 'rules_engine', 'machine_learning' ];
    const module_map = {
      'rules_engine': 'decision',
      'machine_learning': 'ml',
      'wizard': 'wizard',
    };
    const module_active_status = {};
    let type = '';
    all_modules.forEach((md, idx) => {
      if (orgProducts[ md ]) {
        if (!type && orgProducts[ md ].active) type = module_map[ md ];
        module_active_status[ module_map[ md ] ] = orgProducts[ md ].active || false;
      }
    });
    const Strategy = periodic.datas.get('standard_strategy');
    const Mlmodel = periodic.datas.get('standard_mlmodel');
    const strategies = await Strategy.model.find({ organization, status: 'active', }).lean();
    const mlmodels = await Mlmodel.model.find({ organization, status: 'complete' }).lean();
    const strategyDropdown = strategies.map(strategy => ({ label: strategy.display_title, value: strategy._id.toString() }));
    const mlmodelDropdown = mlmodels.map(ml => ({ label: ml.display_name, value: ml._id.toString() }));
    req.controllerData.formoptions = {
      strategy: strategyDropdown,
      mlmodel: mlmodelDropdown,
    };
    const parsed = url.parse(req.headers.referer).pathname.slice(1).split('/');
    req.controllerData.data = {
      _id: parsed[ 2 ],
      type,
      module_active_status,
    };
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error pulling organization resources', });
  }
}

async function getStrategyById(req, res, next) {
  try {
    const Strategy = periodic.datas.get('standard_strategy');
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    if (req.params.strategy) {
      let strategy = await Strategy.load({ query: { _id: req.params.strategy, organization, } });
      strategy = (strategy && strategy.toJSON) ? strategy.toJSON() : strategy;
      req.controllerData.strategy = strategy;
    }
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error pulling strategy', });
  }
}

async function getMlModelById(req, res, next) {
  try {
    const Mlmodel = periodic.datas.get('standard_mlmodel');
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    if (req.params.mlmodel) {
      let mlmodel = await Mlmodel.load({ query: { _id: req.params.mlmodel, organization, } });
      mlmodel = (mlmodel && mlmodel.toJSON) ? mlmodel.toJSON() : mlmodel;
      req.controllerData.mlmodel = mlmodel;
    }
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error pulling mlmodel', });
  }
}

module.exports = {
  application,
  communication,
  customer,
  customertemplate,
  note,
  doc,
  label,
  status,
  task,
  taskbot,
  template,
  intermediary,
  getParsedUrl,
  generateUserImageMap,
  getTeamMembersAndUserImageMap,
  deleteProduct,
  redirectToProduct,
  downloadSampleData,
  handleControllerDataResponse,
  getModuleResources,
  getStrategyById,
  getMlModelById,
};