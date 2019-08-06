'use strict';

const periodic = require('periodicjs');
const url = require('url');
const flatten = require('flat');
const unflatten = flatten.unflatten;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const utilities = require('../../utilities');
const CONSTANTS = utilities.constants;
const logger = periodic.logger;
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;
const losControllerUtil = utilities.controllers.los;
const losTransformUtil = utilities.transforms.los;

async function createIntermediary(req, res, next) {
  try {
    req.body = req.body || {};
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const IntermediaryTemplate = periodic.datas.get('standard_loscustomertemplate');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const KEY_INFO_VALUE_TYPE_CAST = CONSTANTS.LOS.KEY_INFO_VALUE_TYPE_CAST;

    let created;
    req.body = unflatten(req.body);
    req.body.user = req.body.user || {};
    req.body.user.creator = user.entitytype === 'user' ? `${user.first_name} ${user.last_name}` : user.name;
    req.body.user.updater = user.entitytype === 'user' ? `${user.first_name} ${user.last_name}` : user.name;

    const customer_template = await IntermediaryTemplate.model.findOne({ organization, type: 'intermediary' }).lean();

    let keyInfo = {};

    if (customer_template && customer_template.template) keyInfo = Object.assign({}, customer_template.template);

    const keyInfoFromBody = req.body && req.body.key_information ? req.body.key_information : {};

    for (const name in keyInfoFromBody) {
      const value_type = (keyInfo[ name ] && keyInfo[ name ].value_type) ? keyInfo[ name ].value_type : 'text';
      const value = losTransformUtil.coerceLoanDataType({ name, value_type: KEY_INFO_VALUE_TYPE_CAST[ value_type ], value: keyInfoFromBody[ name ].value, }).value;
      keyInfo[ name ] = { value_type, value, };
    }

    req.body.key_information = keyInfo;
    created = await Intermediary.create({ newdoc: Object.assign({ organization, }, req.body), });

    req.controllerData = req.controllerData || {};
    req.controllerData.intermediary = created;
    next();
  } catch (e) {
    logger.warn(e.message);
    res.status(500).send({ message: 'Error creating intermediary' });
  }
}


async function getIntermediarires(req, res, next) {
  try {
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    if (req.query && req.query.paginate) {
      let numItems, numPages, rows;
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, /*population: 'datasource'*/ };

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
      let result = await Intermediary.query(queryOptions)
      numItems = await Intermediary.model.countDocuments(queryOptions.query);
      numPages = Math.ceil(numItems / 50);
      rows = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
      rows = rows.map(app => app = app.toJSON ? app.toJSON() : app);
      req.controllerData = Object.assign({}, req.controllerData, { rows, skip, numItems, numPages, });
    } else {
      const intermediaries = await Intermediary.model.find({ organization }).lean();
      req.controllerData.intermediaries = intermediaries || [];
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getIntermediary(req, res, next) {
  try {
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    const intermediary = await Intermediary.model.findOne({ _id: req.params.id, organization }).lean();
    req.controllerData.intermediary = intermediary;
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function updateIntermediary(req, res, next) {
  try {
    const Intermediary = periodic.datas.get('standard_losintermediary');
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
    if (req.query && req.query.type === 'patch_key_information') {
      const { value, value_type } = req.body;
      if (req.body.name && req.body.name !== 'TypeError') {
        updateOptions = {
          query: { _id: req.params.id, },
          updatedoc: {
            [ `key_information.${req.body.name}` ]: { value: losTransformUtil.coerceLoanDataType({ name: '', value_type: castType[ req.body.value_type ], value: req.body.value }).value, value_type, },
            updatedat: new Date(),
            [ 'user.updater' ]: `${user.first_name} ${user.last_name}`
          },
        };
      } else {
        return next();
      }
    } else if (req.query && req.query.type === 'delete_key_information' && req.controllerData.intermediary) {
      const intermediary = req.controllerData.intermediary;
      const key_information = Object.entries(intermediary.key_information).map(([ name, detail, ], idx) => ({ name, value: detail.value, idx, _id: intermediary._id.toString(), value_type: detail.value_type, }));
      req.controllerData.intermediary.key_information = key_information;
      const delete_key = intermediary.key_information[ req.params.idx ].name;
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
    } else if (req.query && req.query.type === 'patch') {
      updateOptions = {
        query: { _id: req.params.id, },
        updatedoc: {
          $set: Object.assign({}, req.body, {
            updatedat: new Date(),
            [ 'user.updater' ]: `${user.first_name} ${user.last_name}`
          }),
        },
      };
    } else {
      updateOptions = {
        query: { _id: req.params.id, },
        updatedoc: req.body,
      };
    }
    await Intermediary.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function deleteIntermediary(req, res, next) {
  try {
    const Intermediary = periodic.datas.get('standard_losintermediary');
    req.controllerData = req.controllerData || {};
    await Intermediary.model.deleteOne({ _id: req.params.id });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}


async function addIntermediaryToPerson(req, res, next) {
  try {
    const Person = periodic.datas.get('standard_losperson');
    req.controllerData = req.controllerData || {};
    if (req.controllerData.intermediary) {
      if (req.body.primary_contact) {
        await Person.update({ id: req.body.primary_contact, isPatch: true, updatedoc: { intermediary: req.controllerData.intermediary._id.toString() } });
      }
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    res.status(500).send({ message: 'Error updating company primary contact' });
  }
}

async function getIntermediaryPeople(req, res, next) {
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
      let queryOptions = { query: { organization, intermediary: req.params.id }, paginate: true, limit: 50, pagelength: 50, skip, sort, /*population: 'datasource'*/ };
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
      if (req.params.id) req.controllerData.baseUrl = `/los/api/intermediaries/${req.params.id}/people?paginate=true`;
    } else {
      let people = await Person.model.find({ company: req.params.id });
      people = people.map(person => person.toJSON ? person.toJSON() : person);
      req.controllerData.people = people;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    res.status(500).send({ message: 'Error updating company primary contact' });
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
      const queryOptions = { query: { organization, intermediary: req.params.id, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'status' };
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
      const queryOptions = (query) ? { query: { organization, title: new RegExp(query, 'gi'), intermediary: req.params.id, } } : { query: { organization, intermediary: req.params.id, } };
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

async function redirectToIntermediaryDetail(req, res) {
  try {
    const intermediary = req.controllerData.intermediary;
    return res.status(200).send({
      pathname: `/los/intermediaries/${intermediary._id.toString()}`,
    });
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({ message: 'Error pulling the intermediary', });
  }
}

async function getIntermediaryDocs(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    req.controllerData = req.controllerData || {};
    const intermediary = req.controllerData.intermediary;
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const file_id = req.params && req.params.file_id || null;
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 50 * (pagenum - 1);
    const sort = (req.query && req.query.sort) ? req.query.sort : 'name';
    let queryOptions = { query: { organization, intermediary: intermediary._id.toString(), parent_directory: file_id }, paginate: true, limit: 50, pagelength: 50, skip, sort, /*population: 'datasource'*/ };
    if (req.query && req.query.query) delete queryOptions.query.parent_directory;
    const { $and, $or, } = losControllerUtil.__formatDocMongoQuery({ req });
    if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
    if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
    const los_docs = await LosDoc.model.find(queryOptions.query).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
    const numItems = await LosDoc.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 50);
    req.controllerData = Object.assign({}, req.controllerData, { rows: los_docs, skip, numItems, numPages, });
    if (req.params.id && !req.params.file_id) req.controllerData.baseUrl = `/los/api/intermediaries/${req.params.id}/docs?paginate=true`;
    if (req.params.id && req.params.file_id) req.controllerData.baseUrl = `/los/api/intermediaries/${req.params.id}/docs/${req.params.file_id}?paginate=true`;
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createIntermediary,
  getIntermediarires,
  getIntermediary,
  updateIntermediary,
  deleteIntermediary,
  addIntermediaryToPerson,
  getIntermediaryPeople,
  getApplications,
  redirectToIntermediaryDetail,
  getIntermediaryDocs,
};