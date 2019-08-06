'use strict';

const periodic = require('periodicjs');
const url = require('url');
const unflatten = require('flat').unflatten;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const utilities = require('../../utilities');
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;
const losControllerUtil = utilities.controllers.los;
const losTransformUtil = utilities.transforms.los;
const Busboy = require('busboy');

async function createApplication(req, res, next) {
  try {
    const Application = periodic.datas.get('standard_losapplication');
    const Person = periodic.datas.get('standard_losperson');
    const Company = periodic.datas.get('standard_loscompany');
    const Product = periodic.datas.get('standard_losproduct');
    const CustomerTemplate = periodic.datas.get('standard_loscustomertemplate');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.body.organization = organization;
    const selected_product = req.body && req.body.product ? await Product.model.findOne({ _id: req.body.product.toString(), }).lean() : null;
    if (req.query.type === 'new') {
      let created;
      let coapplicant;
      if (req.body.customer_type === 'company') {
        const company_template = await CustomerTemplate.model.findOne({ organization, type: 'company' }).lean();
        const key_information = company_template && company_template.template ? Object.assign({}, company_template.template) : {};
        created = await Company.create({
          newdoc: Object.assign({}, {
            name: req.body.customer_name,
            key_information,
            organization,
          }),
        });
        if (req.body.has_coapplicant && req.body.coapplicant) {
          coapplicant = await Company.create({
            newdoc: Object.assign({}, {
              name: req.body.coapplicant,
              key_information,
              organization,
            }),
          });
          coapplicant = coapplicant.toJSON ? coapplicant.toJSON() : coapplicant;
          req.body.coapplicant_customer_id = coapplicant._id.toString();
          req.body.coapplicant_customer_type = selected_product.customer_type;
        }
      } else {
        const person_template = await CustomerTemplate.model.findOne({ organization, type: 'person' }).lean();
        const key_information = person_template && person_template.template ? Object.assign({}, person_template.template) : {};
        created = await Person.create({
          newdoc: Object.assign({}, {
            name: req.body.customer_name,
            key_information,
            organization,
          }),
        });
        if (req.body.has_coapplicant && req.body.coapplicant) {
          coapplicant = await Person.create({
            newdoc: Object.assign({}, {
              name: req.body.coapplicant,
              key_information,
              organization,
            }),
          });
          coapplicant = coapplicant.toJSON ? coapplicant.toJSON() : coapplicant;
          req.body.coapplicant_customer_id = coapplicant._id.toString();
          req.body.coapplicant_customer_type = selected_product.customer_type;
        }
      }
      req.body.title = selected_product ? `${req.body.customer_name} ${selected_product.name}` : `${req.body.customer_name}`;
      created = created.toJSON ? created.toJSON() : created;
      req.body.customer_id = created._id.toString();
      delete req.body.company_name;
    } else {
      const [ customer_type, customer_id, ] = req.body.customer_name.split('.');
      req.body.customer_type = customer_type;
      req.body.customer_id = customer_id;
      const Customer = customer_type === 'company' ? Company : Person;
      const existing_customer = await Customer.model.findOne({ _id: customer_id, }).lean();
      req.body.title = selected_product ? `${existing_customer.name} ${selected_product.name}` : `${existing_customer.name}`;
      if (req.body.has_coapplicant && req.body.coapplicant) {
        const [ coapplicant_customer_type, coapplicant_customer_id, ] = req.body.coapplicant.split('.');
        req.body.coapplicant_customer_type = coapplicant_customer_type;
        req.body.coapplicant_customer_id = coapplicant_customer_id;
      }
    }
    req.body.user = {
      creator: `${req.user.first_name} ${req.user.last_name}`,
      updater: `${req.user.first_name} ${req.user.last_name}`,
    };
    req.body.key_information = selected_product
      ? Object.assign({}, selected_product.template)
      : {};
    const created = await Application.create({ newdoc: Object.assign({}, req.body), });
    req.controllerData = req.controllerData || {};
    req.controllerData.application = created.toJSON ? created.toJSON() : created;
    next();
  } catch (e) {
    res.status(404).send({ message: 'Failed to create application.', });
  }
}

async function createInitialApplicationFolders(req, res, next) {
  try {
    if (req.controllerData.application) {
      const application = req.controllerData.application;
      const Losdoc = periodic.datas.get('standard_losdoc');
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      const containerName = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
      const directory = `${containerName}/los/applicationdocuments/${organization.toString()}/${application.title}/${application._id.toString()}`
      await Promise.all([ 'Application Forms', 'Credit Reports', 'Customer Information', 'Financial Details', 'Legal Documents', 'Verification Information', 'Other' ].map(name => {
        return Losdoc.create({
          newdoc: Object.assign({}, {
            name,
            organization,
            directory,
            doc_type: 'folder',
            filesize: 0,
            application: application._id.toString(),
            user: {
              creator: `${user.first_name} ${user.last_name}`,
              updater: `${user.first_name} ${user.last_name}`
            }
          }),
        })
      }))
      next();
    } else {
      res.status(404).send({ message: 'Failed to create application' });
    }
  } catch (e) {
    logger.warn(e.message);
    res.status(404).send({ message: 'Failed to create application folders.', });
  }
}

async function createProduct(req, res, next) {
  try {
    const Product = periodic.datas.get('standard_losproduct');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.body.organization = organization;
    req.body.organization = organization;
    req.body.user = { creator: `${user.first_name} ${user.last_name}`, updater: `${user.first_name} ${user.last_name}`, };
    const created = await Product.create({ newdoc: Object.assign({}, req.body), });
    req.controllerData = req.controllerData || {};
    req.controllerData.product = created;
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

async function getProducts(req, res, next) {
  try {
    const Product = periodic.datas.get('standard_losproduct');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
    const products = await Product.model.find({ organization, }).sort(sort).lean();
    req.controllerData = req.controllerData || {};
    req.controllerData.products = products;
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

async function getTeamMembers(req, res, next) {
  try {
    const User = periodic.datas.get('standard_user');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const team_members = await User.model.find({ 'association.organization': organization, }).populate([ { path: 'primaryasset' } ]).lean();
    req.controllerData = req.controllerData || {};
    req.controllerData.team_members = team_members;
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

async function getApplications(req, res, next) {
  try {
    const Application = periodic.datas.get('standard_losapplication');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    if (req.query.paginate === 'true') {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      const skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      const queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'status' };
      const { $and, $or, } = losControllerUtil.__formatApplicationMongoQuery({ req });
      if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
      if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
      const applications = await Application.model.find(queryOptions.query).populate('status').collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
      const numItems = await Application.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 50);
      req.controllerData = Object.assign({}, req.controllerData, { rows: applications, skip, numItems, numPages, });
    } else {
      const {
        limit,
        populate,
        sort = '-createdat',
        query = '',
      } = req.query;
      const queryOptions = (query) ? { query: { organization, title: new RegExp(query, 'gi'), } } : { query: { organization, } };
      const { $and, $or, } = losControllerUtil.__formatApplicationMongoQuery({ req });
      if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
      if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
      const populationFields = [];
      if (populate) {
        populationFields.push({ path: populate, select: [], });
      }
      const applications = await Application.model.find(queryOptions.query).limit(limit).populate(populationFields).sort(sort).lean();
      req.controllerData.applications = applications;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

async function getApplication(req, res, next) {
  try {
    const Application = periodic.datas.get('standard_losapplication');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    let populate = [];
    if (req.query && req.query.populate) {
      if (req.query.populate === 'all') populate = [ { path: 'product' }, { path: 'team_members' }, { path: 'status' } ];
    }
    const application = await Application.model.findOne({ _id: req.params.id, organization, }).populate(populate).lean();
    req.controllerData.application = application;
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

async function getApplicationFromURL(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const pathname = url.parse(req.headers.referer).pathname.split('/');
    if (pathname.includes('applications')) {
      const application_id = pathname[ pathname.indexOf('applications') + 1 ];
      const Application = periodic.datas.get('standard_losapplication');
      const user = req.user || {};
      const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
      let populate = [];
      if (req.query && req.query.populate) {
        if (req.query.populate === 'all') populate = [ { path: 'product' }, { path: 'team_members' }, { path: 'status' } ];
      }
      if (req.query && req.query.docusign) populate = [ { path: 'product' }, { path: 'status' } ];
      const application = await Application.model.findOne({ _id: application_id, organization, }).populate(populate).lean();
      req.controllerData.application = application;
    } else {
      req.controllerData.application = null;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

async function updateApplication(req, res, next) {
  try {
    const Application = periodic.datas.get('standard_losapplication');
    req.controllerData = req.controllerData || {};
    let updateOptions = {};
    const user = req.user;
    const castType = {
      monetary: 'number',
      percentage: 'number',
      number: 'number',
      text: 'string',
      date: 'date',
      boolean: 'boolean',
    };
    if (req.query && req.query.type === 'swimlane' && req.controllerData.los_statuses) {
      if (req.body && req.body.source_idx !== req.body.destination_idx) updateOptions = {
        query: { _id: req.body.entity_id, },
        updatedoc: {
          status: req.controllerData.los_statuses[ req.body.destination_idx ],
          updatedat: new Date(),
          [ 'user.updater' ]: `${user.first_name} ${user.last_name}`,
        },
      };
    } else if (req.query && req.query.type === 'patch_loan_info') {
      const { value, value_type, value_category } = req.body;
      if (req.body.name && req.body.name !== 'TypeError') {
        updateOptions = {
          query: { _id: req.params.id, },
          updatedoc: {
            [ `key_information.${req.body.name}` ]: { value: losTransformUtil.coerceLoanDataType({ name: '', value_type: castType[ req.body.value_type ], value: req.body.value }).value, value_type, value_category },
            updatedat: new Date(),
            [ 'user.updater' ]: `${user.first_name} ${user.last_name}`
          },
        };
      } else {
        return next();
      }
    } else if (req.query && req.query.type === 'delete_loan_info' && req.controllerData.application) {
      const application = req.controllerData.application;
      const loan_info = Object.entries(application.key_information).map(([ name, detail, ], idx) => ({ name, value: detail.value, idx, _id: application._id.toString(), value_type: detail.value_type, }));
      req.controllerData.application.loan_info = loan_info;
      const delete_key = application.loan_info[ req.params.idx ].name;
      updateOptions = {
        query: { _id: req.params.id, },
        updatedoc: {
          $unset: { [ `key_information.${delete_key}` ]: '', },
          $set: {
            updatedat: new Date(),
            [ 'user.updater' ]: `${user.first_name} ${user.last_name}`
          }
        },
      };
    } else {
      updateOptions = {
        query: { _id: req.params.id, },
        updatedoc: req.body,
      };
    }
    await Application.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    next();
  } catch (e) {
    next(e);
  }
}

async function getDocs(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    req.controllerData = req.controllerData || {};
    const application = req.controllerData.application;
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const file_id = req.params && req.params.file_id || null;
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 50 * (pagenum - 1);
    const sort = (req.query && req.query.sort) ? req.query.sort : 'name';
    let queryOptions = { query: { organization, application: application._id.toString(), parent_directory: file_id }, paginate: true, limit: 50, pagelength: 50, skip, sort, /*population: 'datasource'*/ };
    if (req.query && req.query.query) delete queryOptions.query.parent_directory;
    const { $and, $or, } = losControllerUtil.__formatDocMongoQuery({ req });
    if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
    if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
    const los_docs = await LosDoc.model.find(queryOptions.query).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
    const numItems = await LosDoc.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 50);
    req.controllerData = Object.assign({}, req.controllerData, { rows: los_docs, skip, numItems, numPages, });
    if (req.params.id && !req.params.file_id) req.controllerData.baseUrl = `/los/api/applications/${req.params.id}/docs?paginate=true`;
    if (req.params.id && req.params.file_id) req.controllerData.baseUrl = `/los/api/applications/${req.params.id}/docs/${req.params.file_id}?paginate=true`;
    next();
  } catch (e) {
    next(e);
  }
}

async function getFolders(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    req.controllerData = req.controllerData || {};
    const application = req.controllerData.application;
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const applicationId = application
      ? application._id.toString()
      : req.params && req.params.application_id
        ? req.params.application_id
        : '';
    let los_folders = await LosDoc.model.find({ organization, application: applicationId, doc_type: 'folder' }).lean();
    req.controllerData.parent_directory = los_folders;
    next();
  } catch (e) {
    next(e);
  }
}

async function getParentDocument(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    req.controllerData = req.controllerData || {};
    if ((req.body && req.body.parent_directory) || (req.controllerData && req.controllerData.newdoc && req.controllerData.newdoc.parent_directory)) {
      const parent_id = (req.body && req.body.parent_directory)
        ? req.body.parent_directory
        : req.controllerData && req.controllerData.newdoc && req.controllerData.newdoc.parent_directory
          ? req.controllerData.newdoc.parent_directory
          : '';
      const los_parent_doc = await LosDoc.model.findOne({ _id: parent_id }).lean();
      req.controllerData.los_parent_doc = los_parent_doc;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({ message: 'Error retrieving parent document', });
  }
}

async function uploadDocumentToAWS(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const file = req.controllerData.file || req.controllerData.newdoc.file;
    const filename = req.controllerData.newdoc.name;
    const Key = (req.controllerData.newdoc.parent_directory)
      ? `los/applicationdocuments/${req.params.id}/${req.controllerData.newdoc.parent_directory}/${filename}`
      : `los/applicationdocuments/${req.params.id}/${filename}`;
    const options = {
      Key,
      Body: file,
    };
    await helpers.uploadAWS(options);
    req.controllerData.newdoc.fileurl = Key;
    next();
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({ message: 'Error uploading application document', });
  }
}

async function uploadStreamDocumentToAWS(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const file = req.controllerData.newdoc.file;
    const filename = req.controllerData.newdoc.name;
    const Key = (req.controllerData.newdoc.parent_directory)
      ? `los/applicationdocuments/${req.params.id}/${req.controllerData.newdoc.parent_directory}/${filename}`
      : `los/applicationdocuments/${req.params.id}/${filename}`;
    const options = {
      Key,
      Body: file,
    };
    await helpers.uploadToAWSFromStream(options);
    const filesize = await helpers.getFileSizeFromS3({ Key });
    req.controllerData.newdoc.fileurl = Key;
    req.controllerData.newdoc.filesize = filesize;
    next();
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({ message: 'Error uploading application document', });
  }
}

async function getTasks(req, res, next) {
  try {
    const Task = periodic.datas.get('standard_lostask');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    if (req.query.paginate) {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      let queryOptions = { query: { organization, application: req.params.id, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'team_members company people application' };
      const { $and, $or, } = losControllerUtil.__formatTaskMongoQuery({ req });
      if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
      if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
      const tasks = await Task.model.find(queryOptions.query).populate([ { path: 'team_members' }, { path: 'people' }, { path: 'company' }, { path: 'application' }, ]).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
      const numItems = await Task.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 50);
      req.controllerData = Object.assign({}, req.controllerData, { rows: tasks || [], skip, numItems, numPages, });
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
      const tasks = await Task.model.find(query).limit(limit).populate(populationFields).sort(sort).lean();
      req.controllerData.tasks = tasks;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}


async function getProduct(req, res, next) {
  try {
    const Product = periodic.datas.get('standard_losproduct');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const product = await Product.model.findOne({ _id: req.params.id, organization, }).lean();
    req.controllerData.product = product;
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

async function updateProduct(req, res, next) {
  try {
    const Product = periodic.datas.get('standard_losproduct');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    const product = req.controllerData.product;
    const updatedoc = {};
    const castType = {
      monetary: 'number',
      percentage: 'number',
      number: 'number',
      text: 'string',
      date: 'date',
      boolean: 'boolean',
    };
    if (req.query.type === 'patch_template_item') {
      updatedoc[ '$set' ] = { [ `template.${req.body.name}` ]: { value_type: req.body.value_type, value: losTransformUtil.coerceLoanDataType({ name: '', value: req.body.value, value_type: castType[ req.body.value_type ] }).value, }, };
    } else if (req.query.type === 'delete_template_item') {
      product.template = product.template || {};
      const template_items = Object.entries(product.template).map(([ name, detail, ], idx) => ({ name, idx, _id: product._id.toString(), value_type: detail.value_type, }));
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
    await Product.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}


async function deleteApplication(req, res, next) {
  try {
    const Application = periodic.datas.get('standard_losapplication');
    req.controllerData = req.controllerData || {};
    await Application.model.deleteOne({ _id: req.params.id });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getCommunications(req, res, next) {
  try {
    const Communication = periodic.datas.get('standard_loscommunication');
    const Person = periodic.datas.get('standard_losperson');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const application = req.controllerData.application;
    if (req.query.paginate) {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'team_members people' };
      let people = [];
      if (application && application.customer_type === 'company') {
        people = await Person.model.find({ company: application.customer_id || null }).lean();
      } else if (application && application.customer_type === 'person') {
        people = await Person.model.find({ _id: application.customer_id }).lean();
      }
      if (application.coapplicant_customer_id) {
        people.push({ _id: application.coapplicant_customer_id });
      }
      queryOptions.query[ '$or' ] = people.length ? people.map(person => ({ people: { $eq: person._id.toString() } })) : [ { people: null } ];
      const { $and, $or, } = losControllerUtil.__formatCommunicationMongoQuery({ req });
      if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
      if ($or && $or.length) {
        if (queryOptions.query[ '$or' ]) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ].concat($or);
        else queryOptions.query[ '$or' ] = $or;
      }
      const numItems = await Communication.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 50);
      const communications = await Communication.model.find(queryOptions.query).populate([ { path: 'team_members' }, { path: 'people' }, ]).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
      req.controllerData = Object.assign({}, req.controllerData, { rows: communications, skip, numItems, numPages, });
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
      const communications = await Communication.model.find(query).limit(limit).populate(populationFields).sort(sort).lean();
      req.controllerData.communications = communications;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }

}

async function getNotes(req, res, next) {
  try {
    const Note = periodic.datas.get('standard_losnote');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 50 * (pagenum - 1);
    const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
    let queryOptions = { query: { organization, application: req.params.id, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: '' };
    if (req.params.id) queryOptions.query.application = req.params.id.toString();
    let result = await Note.query(queryOptions);
    const numItems = await Note.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 50);
    let notes = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
    notes = notes.map(app => app = app.toJSON ? app.toJSON() : app);
    req.controllerData = Object.assign({}, req.controllerData, { rows: notes, skip, numItems, numPages, });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function redirectToGenerateDocModal(req, res) {
  try {
    return res.status(200).send({
      title: 'Generate Document',
      pathname: `/los/applications/${req.params.id}/generate_doc/${req.body.template}`,
    });
  } catch (e) {
    return res.status(500).send({ message: 'Error pulling the template', });
  }
}

async function getApplicationCustomer(req, res, next) {
  try {
    const application = req.controllerData.application;
    req.controllerData.customer = null;
    if (application && application.customer_type) {
      const Customer = periodic.datas.get(`standard_los${application.customer_type}`);
      const customer = await Customer.model.findOne({ _id: application.customer_id, }).lean();
      req.controllerData.customer = customer;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getApplicationIntermediary(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const application = req.controllerData.application;
    req.controllerData.intermediary = null;
    if (application && application.intermediary) {
      const Intermediary = periodic.datas.get('standard_losintermediary');
      const intermediary = await Intermediary.model.findOne({ _id: application.intermediary, }).lean();
      req.controllerData.intermediary = intermediary || null;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getApplicationCoapplicant(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const application = req.controllerData.application;
    req.controllerData.coapplicant = null;
    if (application && application.coapplicant_customer_type && application.coapplicant_customer_id) {
      const Customer = periodic.datas.get(`standard_los${application.coapplicant_customer_type}`);
      const coapplicant = await Customer.model.findOne({ _id: application.coapplicant_customer_id, }).lean();
      req.controllerData.coapplicant = coapplicant || null;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}
async function extractGenerateDocFields(req, res, next) {
  try {
    const reqBody = unflatten(req.body);
    const application = req.controllerData.application;
    const customer = req.controllerData.customer;
    const props = {
      application,
      customer,
    };
    req.body.fields = reqBody.fields.reduce((formdata, field) => {
      let value;
      try {
        if (field.value === undefined) return formdata;
        if (field.value_type === 'variable') {
          value = props;
          const prop_path = field.value.split('.');
          for (let i = 0; i < prop_path.length; i++) {
            if (value === undefined || value === null) break;
            value = value[ prop_path[ i ] ];
          }
        }
        else {
          value = field.value;
        }
        if (value !== undefined && String(value).length) {
          formdata[ field.name ] = String(value);
        }
        return formdata;
      } catch (e) {
        return formdata;
      }
    }, {});
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function redirectToApplicationDetail(req, res) {
  try {
    const application = req.controllerData.application;
    return res.status(200).send({
      pathname: `/los/applications/${application._id.toString()}`,
    });
  } catch (e) {
    return res.status(500).send({ message: 'Error pulling the template', });
  }
}

async function getUnderwritingCases(req, res, next) {
  try {
    const Case = periodic.datas.get('standard_case');
    const MlCase = periodic.datas.get('standard_mlcase');
    if (req.query && req.query.pagination) {
      let options = { query: { application: req.params.id }, limit: 10, population: 'true', };
      options.skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 10) : 0;
      options.paginate = true;
      options.sort = { case_name: -1, };
      options.limit = 10;
      options.pagelength = 10;
      let cases = await Case.query(options);

      const numItems = await Case.model.countDocuments(options.query);
      const numPages = Math.ceil(numItems / 10);
      let rows = cases[ 0 ].documents.map(cs => cs.toJSON ? cs.toJSON() : cs);
      req.controllerData = Object.assign({}, req.controllerData, {
        rows,
        numPages,
        numItems,
        baseUrl: `/los/api/applications/${req.params.id}/cases?pagination=true`,
      });
      next();
    } else {
      const cases = await Case.model.find({ application: req.params.id }).lean();
      req.controllerData.cases = cases || [];
      const mlcases = await MlCase.model.find({ application: req.params.id }).lean();
      req.controllerData.cases = cases || [];
      req.controllerData.mlcases = mlcases || [];
      next();
    }
  } catch (e) {
    return res.status(500).send({ message: 'Error pulling underwriting cases', });
  }
}

async function addOutputVariableToApplicationInfo(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Application = periodic.datas.get('standard_losapplication');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    if (req.query && req.query.output_json) {
      const output_json = JSON.parse(req.query.output_json);
      const name = output_json.name;
      const value = output_json.value;
      let value_type = output_json.value_type ? output_json.value_type.toLowerCase() : 'string';
      if (value_type === 'string') value_type = 'text';
      let updateOptions = {
        query: { _id: req.params.id, organization, },
        updatedoc: {
          [ `key_information.${name}` ]: { value, value_type, },
          updatedat: new Date(),
          [ 'user.updater' ]: `${user.first_name} ${user.last_name}`
        },
      };
      await Application.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    }
    next();
  } catch (e) {
    return res.status(401).send({ message: 'Could not retrieve the case' });
  }
}

async function checkDocusignExists(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Dataintegration = periodic.datas.get('standard_dataintegration');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const docusignDoc = await Dataintegration.model.findOne({ organization, data_provider: 'DocuSign' }).lean();
    if (docusignDoc) req.controllerData.showDocusign = true;
    return next();
  } catch (e) {
    return res.status(401).send({ message: 'Could not retrieve the case' });
  }
}

async function redirectToRunAutomationModal(req, res) {
  try {
    if (req.body.type === 'decision') {
      return res.status(200).send({
        title: 'Run Decision Engine',
        pathname: `/los/applications/${req.params.id}/run_automation/${req.body.type}/${req.body.strategy}`,
      });
    } else if (req.body.type === 'ml') {
      return res.status(200).send({
        title: 'Run Machine Learning Model',
        pathname: `/los/applications/${req.params.id}/run_automation/${req.body.type}/${req.body.mlmodel}`,
      });
    }
  } catch (e) {
    return res.status(500).send({ message: 'Error pulling the template', });
  }
}

async function checkProductCustomer(req, res, next) {
  try {
    if (req.query && req.query.type === 'existing') {
      const products = req.controllerData.products || [];
      const product_types = {};
      products.forEach(product => {
        product_types[ product._id.toString() ] = product.customer_type;
      });
      if (req.body.product && req.body.customer_name) {
        const selectedProductCustomerType = product_types[ req.body.product ];
        const [ customer_type, mongoid, ] = req.body.customer_name.split('.');
        if (selectedProductCustomerType !== customer_type) {
          return res.status(500).send({ message: 'Please select a customer' })
        }
      }
      if (req.body.product && req.body.has_coapplicant && req.body.coapplicant) {
        const selectedProductCustomerType = product_types[ req.body.product ];
        const [ coapplicant_customer_type, mongoid, ] = req.body.coapplicant.split('.');
        if (selectedProductCustomerType !== coapplicant_customer_type) {
          return res.status(500).send({ message: 'Please select a coapplicant' });
        }
      }
      return next();
    } else {
      next();
    }
  } catch (e) {
    return res.status(500).send({ message: 'Error pulling the template', });
  }
}

module.exports = {
  checkDocusignExists,
  getProducts,
  getProduct,
  getDocs,
  getFolders,
  getTasks,
  getTeamMembers,
  getApplication,
  getApplications,
  getCommunications,
  getNotes,
  getParentDocument,
  getApplicationCustomer,
  uploadDocumentToAWS,
  createApplication,
  createInitialApplicationFolders,
  createProduct,
  updateApplication,
  updateProduct,
  deleteApplication,
  extractGenerateDocFields,
  redirectToGenerateDocModal,
  uploadStreamDocumentToAWS,
  redirectToApplicationDetail,
  getUnderwritingCases,
  addOutputVariableToApplicationInfo,
  redirectToRunAutomationModal,
  checkProductCustomer,
  getApplicationFromURL,
  getApplicationIntermediary,
  getApplicationCoapplicant,
};