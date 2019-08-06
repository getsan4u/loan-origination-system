'use strict';
const decisionController = require('../decision');
const periodic = require('periodicjs');

/**
 * Update override function for variable
 * 
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
function update(req, res, next) {
  try {
    let Variable = periodic.datas.get('standard_variable');
    Variable.update({ isPatch: true, id: req.params.id, updatedoc: { description: req.body.description } })
      .then(() => res.status(200).send({}))
  } catch (e) {
    return res.status(404).send({
      status: 404,
      result: 'error',
      data: {
        type: 'error',
        timeout: 10000,
        error: `Error updating variable`,
      },
    });
  }
}

module.exports = {
  index: decisionController.find,
  show: decisionController.show,
  create: decisionController.create,
  update: update,
};