'use strict';

const periodic = require('periodicjs');
const url = require('url');
const flatten = require('flat');
const unflatten = flatten.unflatten;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const utilities = require('../../utilities');
const CONSTANTS = utilities.constants;
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;
const losControllerUtil = utilities.controllers.los;
const losTransformUtil = utilities.transforms.los;

async function createCustomer(req, res, next) {
  try {
    req.body = req.body || {};
    const Person = periodic.datas.get('standard_losperson');
    const Company = periodic.datas.get('standard_loscompany');
    const CustomerTemplate = periodic.datas.get('standard_loscustomertemplate');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const KEY_INFO_VALUE_TYPE_CAST = CONSTANTS.LOS.KEY_INFO_VALUE_TYPE_CAST;

    let created;
    req.body = unflatten(req.body);
    req.body.user = req.body.user || {};
    req.body.user.creator = user.entitytype === 'user' ? `${user.first_name} ${user.last_name}` : user.name;
    req.body.user.updater = user.entitytype === 'user' ? `${user.first_name} ${user.last_name}` : user.name;

    if (req.body.customer_type === 'company') {
      const customer_template = await CustomerTemplate.model.findOne({ organization, type: 'company' }).lean();

      let keyInfo = {};

      if (customer_template && customer_template.template) keyInfo = Object.assign({}, customer_template.template);

      const keyInfoFromBody = req.body && req.body.key_information ? req.body.key_information : {};

      for (const name in keyInfoFromBody) {
        const value_type = (keyInfo[ name ] && keyInfo[ name ].value_type) ? keyInfo[ name ].value_type : 'text';
        const value = losTransformUtil.coerceLoanDataType({ name, value_type: KEY_INFO_VALUE_TYPE_CAST[ value_type ], value: keyInfoFromBody[ name ].value, }).value;
        keyInfo[ name ] = { value_type, value, };
      }

      req.body.key_information = keyInfo;
      created = await Company.create({ newdoc: Object.assign({ organization, }, req.body), });
    } else {
      const customer_template = await CustomerTemplate.model.findOne({ organization, type: 'person' }).lean();

      let keyInfo = {};

      if (customer_template && customer_template.template) keyInfo = Object.assign({}, customer_template.template);

      const keyInfoFromBody = req.body && req.body.key_information ? req.body.key_information : {};

      for (const name in keyInfoFromBody) {
        const value_type = (keyInfo[ name ] && keyInfo[ name ].value_type) ? keyInfo[ name ].value_type : 'text';
        const value = losTransformUtil.coerceLoanDataType({ name, value_type: KEY_INFO_VALUE_TYPE_CAST[ value_type ], value: keyInfoFromBody[ name ].value, }).value;
        keyInfo[ name ] = { value_type, value, };
      }

      req.body.key_information = keyInfo;

      created = await Person.create({ newdoc: Object.assign({ organization, }, req.body), });
    }
    req.controllerData = req.controllerData || {};
    req.controllerData.customer = created;
    next();
  } catch (e) {
    logger.warn(e.message);
    res.status(500).send({ message: 'Error creating customer' });
  }
}


async function getCustomers(req, res, next) {
  try {
    const Person = periodic.datas.get('standard_losperson');
    const Company = periodic.datas.get('standard_loscompany');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    if (req.query && req.query.customer_type) {
      let numItems, numPages, rows;
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, /*population: 'datasource'*/ };
      if (req.query.customer_type === 'people') {
        if (req.query.query) {
          queryOptions.query[ '$or' ] = [ {
            name: new RegExp(req.query.query, 'gi'),
          }, {
            email: new RegExp(req.query.query, 'gi'),
          }, ];
        }
        queryOptions.population = 'company';
        let result = await Person.query(queryOptions)
        numItems = await Person.model.countDocuments(queryOptions.query);
        numPages = Math.ceil(numItems / 50);
        rows = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
        rows = rows.map(app => app = app.toJSON ? app.toJSON() : app);
      } else if (req.query && req.query.customer_type === 'company') {
        if (req.query.query) {
          queryOptions.query[ '$or' ] = [ {
            name: new RegExp(req.query.query, 'gi'),
          }, {
            industry: new RegExp(req.query.query, 'gi'),
          }, {
            subindustry: new RegExp(req.query.query, 'gi'),
          }, ];
        }
        queryOptions.population = 'primary_contact';
        let result = await Company.query(queryOptions)
        numItems = await Company.model.countDocuments(queryOptions.query);
        numPages = Math.ceil(numItems / 50);
        rows = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
        rows = rows.map(app => app = app.toJSON ? app.toJSON() : app);
      }
      req.controllerData = Object.assign({}, req.controllerData, { rows, skip, numItems, numPages, });
    } else {
      const people = await Person.model.find({ organization }).lean();
      const companies = await Company.model.find({ organization }).lean();
      req.controllerData.people = people || [];
      req.controllerData.companies = companies || [];
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getCompany(req, res, next) {
  try {
    const Company = periodic.datas.get('standard_loscompany');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    const company = await Company.model.findOne({ _id: req.params.id, organization }).lean();
    req.controllerData.company = company;
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getPerson(req, res, next) {
  try {
    const Person = periodic.datas.get('standard_losperson');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    const person = await Person.model.findOne({ _id: req.params.id }).lean();
    req.controllerData.person = person;
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function updatePrimaryContact(req, res, next) {
  try {
    const Person = periodic.datas.get('standard_losperson');
    req.controllerData = req.controllerData || {};
    if (req.body && req.body.primary_contact && req.body.customer_type === 'company' && req.controllerData.customer) {
      await Person.model.updateOne({ _id: req.body.primary_contact }, { company: req.controllerData.customer._id.toString() })
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getCompanyPeople(req, res, next) {
  try {
    const Person = periodic.datas.get('standard_losperson');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    if (req.query && req.query.paginate === 'true') {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 5 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      let queryOptions = { query: { organization, company: req.params.id }, paginate: true, limit: 50, pagelength: 50, skip, sort, /*population: 'datasource'*/ };
      if (req.query.query) {
        queryOptions.query[ '$or' ] = [ {
          name: new RegExp(req.query.query, 'gi'),
        }, {
          email: new RegExp(req.query.query, 'gi'),
        }, ];
      }
      let result = await Person.query(queryOptions);
      const numItems = await Person.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 5);
      let rows = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
      rows = rows.map(app => app = app.toJSON ? app.toJSON() : app);
      req.controllerData = Object.assign({}, req.controllerData, { rows, numPages, numItems });
      if (req.params.id) req.controllerData.baseUrl = `/los/api/customers/companies/${req.params.id}/people?paginate=true`;
    } else {
      let people = await Person.model.find({ company: req.params.id });
      people = people.map(person => person.toJSON ? person.toJSON() : person);
      req.controllerData.people = people;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getCompanyApplications(req, res, next) {
  try {
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    const Application = periodic.datas.get('standard_losapplication');
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 5 * (pagenum - 1);
    const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
    let queryOptions = { query: { organization, customer_id: req.controllerData.company._id.toString() }, paginate: true, limit: 5, pagelength: 5, skip, sort, population: 'status product' };
    let result = await Application.query(queryOptions);
    const numItems = await Application.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 5);
    let company_applications = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
    company_applications = company_applications.map(app => app = app.toJSON ? app.toJSON() : app);
    req.controllerData.company.company_applications = Object.assign({}, { rows: company_applications, skip, numItems, numPages, });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getPersonApplications(req, res, next) {
  try {
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    const Application = periodic.datas.get('standard_losapplication');
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 5 * (pagenum - 1);
    const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
    let queryOptions = { query: { organization, customer_id: req.controllerData.person._id.toString() }, paginate: true, limit: 5, pagelength: 5, skip, sort, population: 'status product' };
    if (req.controllerData.person && req.controllerData.person.company) queryOptions.query.customer_id = { $in: [ req.controllerData.person._id.toString(), req.controllerData.person.company._id.toString() ] };
    let result = await Application.query(queryOptions);
    const numItems = await Application.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 5);
    let person_applications = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
    person_applications = person_applications.map(app => app = app.toJSON ? app.toJSON() : app);
    req.controllerData.person.person_applications = Object.assign({}, { rows: person_applications, skip, numItems, numPages, });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function updateNewCompanyPrimaryContact(req, res, next) {
  try {
    const Company = periodic.datas.get('standard_loscompany');
    req.controllerData = req.controllerData || {};
    if (req.body && req.body.is_primary_contact && req.controllerData.customer) {
      await Company.update({ id: req.body.company, isPatch: true, updatedoc: { primary_contact: req.controllerData.customer._id.toString() } });
    }
    next();
  } catch (e) {
    res.status(500).send({ message: 'Error updating company primary contact' });
  }
}

async function updateNewIntermediaryPrimaryContact(req, res, next) {
  try {
    const Intermediary = periodic.datas.get('standard_losintermediary');
    req.controllerData = req.controllerData || {};
    if (req.body && req.body.is_intermediary_primary_contact && req.controllerData.customer) {
      await Intermediary.update({ id: req.body.intermediary, isPatch: true, updatedoc: { primary_contact: req.controllerData.customer._id.toString() } });
    }
    next();
  } catch (e) {
    res.status(500).send({ message: 'Error updating intermediary primary contact' });
  }
}


async function addCompanyToPerson(req, res, next) {
  try {
    const Person = periodic.datas.get('standard_losperson');
    req.controllerData = req.controllerData || {};
    let parsed = url.parse(req.headers.referer).pathname.slice(1).split('/');
    if (req.controllerData.customer && parsed[ 2 ] && req.query && req.query.type === 'addCompanyToPerson') {
      await Person.update({ id: parsed[ 2 ], isPatch: true, updatedoc: { company: req.controllerData.customer._id.toString() } });
    }
    next();
  } catch (e) {
    res.status(500).send({ message: 'Error updating company primary contact' });
  }
}

async function updateMongoCompany(req, res, next) {
  try {
    const Company = periodic.datas.get('standard_loscompany');
    req.controllerData = req.controllerData || {};
    let updateOptions = {};
    const user = req.user;
    if (req.query && req.query.type === 'delete_key_information' && req.controllerData.company) {
      const company = req.controllerData.company;
      const loan_info = Object.entries(company.key_information).map(([ name, detail, ], idx) => ({ name, value: detail.value, idx, _id: company._id.toString(), value_type: detail.value_type, }));
      req.controllerData.company.loan_info = loan_info;
      const delete_key = company.loan_info[ req.params.idx ].name;
      updateOptions = {
        query: { _id: req.params.id, },
        updatedoc: {
          $unset: {
            [ `key_information.${delete_key}` ]: '',
          },
          $set: {
            updatedat: new Date(),
            [ 'user.updater' ]: `${user.first_name} ${user.last_name}`,
          },
        },
      };
    }
    await Company.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    next();
  } catch (e) {
    next(e);
  }
}

async function updateMongoPerson(req, res, next) {
  try {
    const Person = periodic.datas.get('standard_losperson');
    req.controllerData = req.controllerData || {};
    let updateOptions = {};
    const user = req.user;
    if (req.query && req.query.type === 'delete_key_information' && req.controllerData.person) {
      const person = req.controllerData.person;
      const loan_info = Object.entries(person.key_information).map(([ name, detail, ], idx) => ({ name, value: detail.value, idx, _id: person._id.toString(), value_type: detail.value_type, }));
      req.controllerData.person.loan_info = loan_info;
      const delete_key = person.loan_info[ req.params.idx ].name;
      updateOptions = {
        query: { _id: req.params.id, },
        updatedoc: {
          $unset: { [ `key_information.${delete_key}` ]: '', },
          $set: {
            updatedat: new Date(),
            [ 'user.updater' ]: `${user.first_name} ${user.last_name}`,
          },
        },
      };
    }
    await Person.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    next();
  } catch (e) {
    next(e);
  }
}

async function updateCompany(req, res, next) {
  try {
    const Company = periodic.datas.get('standard_loscompany');
    req.controllerData = req.controllerData || {};
    let updateOptions = {};
    const user = req.user;
    if (req.query && req.query.type === 'patch_key_information') {
      const { value, value_type } = req.body;
      updateOptions = {
        isPatch: true,
        id: req.params.id,
        updatedoc: {
          [ `key_information.${req.body.name}` ]: { value, value_type, },
          updatedat: new Date(),
          [ 'user.updater' ]: `${user.first_name} ${user.last_name}`,
        },
      };
    } else {
      updateOptions = {
        isPatch: true,
        id: req.params.id,
        updatedoc: req.body,
      };
    }

    await Company.update(updateOptions);
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function updatePerson(req, res, next) {
  try {
    const Person = periodic.datas.get('standard_losperson');
    req.controllerData = req.controllerData || {};
    let updateOptions = {};
    const user = req.user;
    if (req.query && req.query.type === 'patch_key_information') {
      const { value, value_type } = req.body;
      updateOptions = {
        isPatch: true,
        id: req.params.id,
        updatedoc: {
          [ `key_information.${req.body.name}` ]: { value, value_type, },
          updatedat: new Date(),
          [ 'user.updater' ]: `${user.first_name} ${user.last_name}`,
        },
      };
    } else if (req.query && req.query.type === 'delete_key_information' && req.controllerData.person) {
      const person = req.controllerData.person;
      const delete_key = person.key_information[ req.params.idx ];
      updateOptions = {
        id: req.params.id,
        updatedoc: {
          $unset: { [ `key_information.${delete_key}` ]: '', },
          $set: {
            updatedat: new Date(),
            [ 'user.updater' ]: `${user.first_name} ${user.last_name}`,
          }
        },
      };
    } else if (req.query && req.query.type === 'removeCompanyPerson') {
      updateOptions = {
        isPatch: true,
        id: req.params.id,
        updatedoc: {
          company: null,
          updatedat: new Date(),
          [ 'user.updater' ]: `${user.first_name} ${user.last_name}`,
        }
      };
    } else {
      updateOptions = {
        isPatch: true,
        id: req.params.id,
        updatedoc: Object.assign({}, {
          updatedat: new Date(),
          [ 'user.updater' ]: `${user.first_name} ${user.last_name}`,
        }, req.body),
      };
    }

    await Person.update(updateOptions);
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function updateExistingCompanyPrimaryContact(req, res, next) {
  try {
    const Company = periodic.datas.get('standard_loscompany');
    if (req.body && req.body.is_primary_contact) await Company.update({ isPatch: true, id: req.body.company.toString(), updatedoc: { primary_contact: req.controllerData.person._id.toString() } });
    if (req.body.company && req.controllerData.person && req.controllerData.person.company) {
      const prevCompanyId = req.controllerData.person.company.toString();
      const newCompanyId = req.body.company.toString();
      if (prevCompanyId !== newCompanyId) await Company.update({ isPatch: true, id: prevCompanyId, updatedoc: { primary_contact: null } });
    } else if (req.query && req.query.type === 'removeCompanyPerson' && req.controllerData.person && req.controllerData.person.company) {
      const prevCompanyId = req.controllerData.person.company.toString();
      await Company.update({ isPatch: true, id: prevCompanyId, updatedoc: { primary_contact: null } });
    }
    next();
  } catch (e) {
    next(e);
  }
}


async function updateExistingIntermediaryPrimaryContact(req, res, next) {
  try {
    const Intermediary = periodic.datas.get('standard_losintermediary');
    if (req.body && req.body.is_intermediary_primary_contact) await Intermediary.update({ isPatch: true, id: req.body.intermediary.toString(), updatedoc: { primary_contact: req.controllerData.person._id.toString() } });
    if (req.body.intermediary && req.controllerData.person && req.controllerData.person.intermediary) {
      const prevIntermediaryId = req.controllerData.person.intermediary.toString();
      const newIntermediaryId = req.body.intermediary.toString();
      if (prevIntermediaryId !== newIntermediaryId) await Intermediary.update({ isPatch: true, id: prevIntermediaryId, updatedoc: { primary_contact: null } });
    } else if (req.query && req.query.type === 'removeIntermediaryPerson' && req.controllerData.person && req.controllerData.person.intermediary) {
      const prevIntermediaryId = req.controllerData.person.intermediary.toString();
      await Intermediary.update({ isPatch: true, id: prevIntermediaryId, updatedoc: { primary_contact: null } });
    }
    next();
  } catch (e) {
    next(e);
  }
}

async function getCompanyTasks(req, res, next) {
  try {
    const Task = periodic.datas.get('standard_lostask');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 50 * (pagenum - 1);
    const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
    let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'team_members company people application' };
    if (req.params.id) queryOptions.query.company = req.params.id.toString();
    const { $and, $or, } = losControllerUtil.__formatTaskMongoQuery({ req });
    if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
    if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
    const tasks = await Task.model.find(queryOptions.query).populate([ { path: 'team_members' }, { path: 'people' }, { path: 'company' }, { path: 'application' }, ]).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
    const numItems = await Task.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 50);
    req.controllerData = Object.assign({}, req.controllerData, { rows: tasks, skip, numItems, numPages, });
    req.controllerData.baseUrl = `/los/api/customers/companies/${req.params.id}/tasks?paginate=true`;
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getPersonTasks(req, res, next) {
  try {
    const Task = periodic.datas.get('standard_lostask');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 50 * (pagenum - 1);
    const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
    let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'team_members company people application' };
    if (req.params.id) queryOptions.query.people = req.params.id.toString();
    const { $and, $or, } = losControllerUtil.__formatTaskMongoQuery({ req });
    if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
    if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
    const tasks = await Task.model.find(queryOptions.query).populate([ { path: 'team_members' }, { path: 'people' }, { path: 'company' }, { path: 'application' }, ]).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
    const numItems = await Task.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 50);
    req.controllerData = Object.assign({}, req.controllerData, { rows: tasks, skip, numItems, numPages, });
    req.controllerData.baseUrl = `/los/api/customers/people/${req.params.id}/tasks?paginate=true`;
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function deleteCompany(req, res, next) {
  try {
    const Company = periodic.datas.get('standard_loscompany');
    req.controllerData = req.controllerData || {};
    await Company.model.deleteOne({ _id: req.params.id });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function deletePerson(req, res, next) {
  try {
    const Person = periodic.datas.get('standard_losperson');
    req.controllerData = req.controllerData || {};
    await Person.model.deleteOne({ _id: req.params.id });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getCommunications(req, res, next) {
  try {
    const Communication = periodic.datas.get('standard_loscommunication');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    if (req.query.paginate) {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'team_members people' };
      let parsed = url.parse(req.headers.referer).pathname.slice(1).split('/');
      if (parsed[ 1 ] === 'people') queryOptions.query.people = req.params.id;
      else if (parsed[ 1 ] === 'companies') {
        const Person = periodic.datas.get('standard_losperson');
        let people = await Person.model.find({ company: req.params.id });
        people = people.map(person => person.toJSON ? person.toJSON() : person);
        queryOptions.query[ '$or' ] = people.length ? people.map(person => ({ people: { $eq: person._id.toString() } })) : [ { people: null } ];
      }
      const { $and, $or, } = losControllerUtil.__formatCommunicationMongoQuery({ req });
      if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
      if ($or && $or.length) {
        if (queryOptions.query[ '$or' ]) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ].concat($or);
        else queryOptions.query[ '$or' ] = $or;
      }
      const communications = await Communication.model.find(queryOptions.query).populate([ { path: 'team_members' }, { path: 'people' } ]).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
      const numItems = await Communication.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 50);
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
    const entity_type = req.query.entity_type;
    const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
    let queryOptions = { query: { organization, [ entity_type ]: req.params.id, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: '' };
    if (req.params.id) queryOptions.query[ entity_type ] = req.params.id.toString();
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

async function redirectToCustomerDetail(req, res, next) {
  try {
    if (req.query.redirect && req.query.redirectEntity) {
      const customer = req.controllerData.customer;
      return res.status(200).send({
        pathname: `/los/${req.query.redirectEntity}/${customer._id.toString()}`,
      });
    } else {
      next();
    }
  } catch (e) {
    next(e);
  }
}

async function getCompanyDocs(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    req.controllerData = req.controllerData || {};
    const company = req.controllerData.company;
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const file_id = req.params && req.params.file_id || null;
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 50 * (pagenum - 1);
    const sort = (req.query && req.query.sort) ? req.query.sort : 'name';
    let queryOptions = { query: { organization, company: company._id.toString(), parent_directory: file_id }, paginate: true, limit: 50, pagelength: 50, skip, sort, /*population: 'datasource'*/ };
    if (req.query && req.query.query) delete queryOptions.query.parent_directory;
    const { $and, $or, } = losControllerUtil.__formatDocMongoQuery({ req });
    if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
    if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
    const los_docs = await LosDoc.model.find(queryOptions.query).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
    const numItems = await LosDoc.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 50);
    req.controllerData = Object.assign({}, req.controllerData, { rows: los_docs, skip, numItems, numPages, });
    if (req.params.id && !req.params.file_id) req.controllerData.baseUrl = `/los/api/customers/companies/${req.params.id}/docs?paginate=true`;
    if (req.params.id && req.params.file_id) req.controllerData.baseUrl = `/los/api/customers/companies/${req.params.id}/docs/${req.params.file_id}?paginate=true`;
    next();
  } catch (e) {
    next(e);
  }
}

async function getPersonDocs(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    req.controllerData = req.controllerData || {};
    const person = req.controllerData.person;
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const file_id = req.params && req.params.file_id || null;
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 50 * (pagenum - 1);
    const sort = (req.query && req.query.sort) ? req.query.sort : 'name';
    let queryOptions = { query: { organization, person: person._id.toString(), parent_directory: file_id }, paginate: true, limit: 50, pagelength: 50, skip, sort, /*population: 'datasource'*/ };
    if (req.query && req.query.query) delete queryOptions.query.parent_directory;
    const { $and, $or, } = losControllerUtil.__formatDocMongoQuery({ req });
    if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
    if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
    const los_docs = await LosDoc.model.find(queryOptions.query).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
    const numItems = await LosDoc.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 50);
    req.controllerData = Object.assign({}, req.controllerData, { rows: los_docs, skip, numItems, numPages, });
    if (req.params.id && !req.params.file_id) req.controllerData.baseUrl = `/los/api/customers/people/${req.params.id}/docs?paginate=true`;
    if (req.params.id && req.params.file_id) req.controllerData.baseUrl = `/los/api/customers/people/${req.params.id}/docs/${req.params.file_id}?paginate=true`;
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = {
  addCompanyToPerson,
  createCustomer,
  deleteCompany,
  deletePerson,
  getCustomers,
  getCommunications,
  getNotes,
  getPerson,
  getPersonApplications,
  getPersonTasks,
  getCompany,
  getCompanyTasks,
  getCompanyPeople,
  getCompanyApplications,
  getCompanyDocs,
  getPersonDocs,
  redirectToCustomerDetail,
  updateExistingCompanyPrimaryContact,
  updateCompany,
  updateNewCompanyPrimaryContact,
  updateMongoCompany,
  updateMongoPerson,
  updatePerson,
  updatePrimaryContact,
  updateNewIntermediaryPrimaryContact,
  updateExistingIntermediaryPrimaryContact,
};