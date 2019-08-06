'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;
const flatten = require('flat'); 

async function createPerson(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Person = periodic.datas.get('standard_losperson');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    let person = await Person.create({ newdoc: Object.assign({}, req.controllerData.person, { organization: organization._id, }), });
    req.controllerData.person = person.toJSON ? person.toJSON() : person;
    next();
  } catch (err) {
    logger.warn('createdPerson: ', err.message);
    return res.status(400).send({
      message: 'Failed to create person',
    });
  }
}

async function findPersonByEmail(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Person = periodic.datas.get('standard_losperson');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.people = [];
    if (req.query && req.query.email) {
      let people = await Person.model.find({ email: req.query.email, organization: organization._id, }).lean();
      people = people || [];
      req.controllerData.people = people;
    }
    next();
  } catch (err) {
    logger.warn('findPersonByEmail: ', err.message);
    return res.status(400).send({
      message: 'Unable to find a person with this email',
    });
  }
}

async function getPerson(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Person = periodic.datas.get('standard_losperson');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.person = await Person.model.findOne({ _id: req.params.id, organization: organization._id, }).lean();
    if (!req.controllerData.person) throw new Error('Unable to find a person with this ID');
    next();
  } catch (err) {
    logger.warn('getPerson: ', err.message);
    return res.status(400).send({
      message: 'Unable to find a person with this ID',
    });
  }
}

async function updatePerson(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Person = periodic.datas.get('standard_losperson');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      await Person.model.updateOne({ _id: req.params.id, organization: organization._id, }, { $set: flatten(req.body.data) },).lean();
      req.controllerData.person = await Person.model.findOne({ _id: req.params.id, organization: organization._id, }).lean();
    } else {
      req.controllerData.person = await Person.model.findOneAndUpdate({ _id: req.params.id, organization: organization._id, }, req.body.data, { new: true, }).lean();
    }
    if (!req.controllerData.person) throw new Error('Unable to find a person with this ID');
    next();
  } catch (err) {
    logger.warn('getPerson: ', err.message);
    return res.status(400).send({
      message: 'Failed to update person',
    });
  }
}

async function deletePerson(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Person = periodic.datas.get('standard_losperson');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.person = await Person.model.deleteOne({ _id: req.params.id, organization: organization._id, }).lean();
    if (req.controllerData.person && !req.controllerData.person.deletedCount) throw new Error('Unable to find a person with this ID');
    next();
  } catch (err) {
    logger.warn('deletePerson: ', err.message);
    return res.status(400).send({
      message: 'Failed to delete person',
    });
  } 
}

async function getAllPeopleForOrganization(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Person = periodic.datas.get('standard_losperson');
    const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
    req.controllerData.people = await Person.model.find({ organization: organization._id, }).lean();
    req.controllerData.personMap = {};
    req.controllerData.people.map(person => {
      req.controllerData.personMap[ person._id ] = person;
    });
    next();
  } catch (err) {
    logger.warn('getAllPeopleForOrganization: ', err.message);
    return res.status(400).send({
      message: 'Unable to complete this operation. Please contact support',
    });
  } 
}

module.exports = {
  createPerson,
  findPersonByEmail,
  getPerson,
  updatePerson,
  deletePerson,
  getAllPeopleForOrganization,
};