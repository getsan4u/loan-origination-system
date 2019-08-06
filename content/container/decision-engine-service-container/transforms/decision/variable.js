'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const utilities = require('../../utilities');
const unflatten = require('flat').unflatten;
const capitalize = require('capitalize');
const helpers = utilities.controllers.helper;
const transformhelpers = utilities.transformhelpers;
const Busboy = require('busboy');
const csv = require('fast-csv');
const XLSX = require('xlsx');

/**
 * Populates variable dropdown to be displayed and selected from on a rule or calculationset
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with populated variables dropdown on req.controllerData
  */
function generateVariableDropdown(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      if ((collection === 'variables' && tabname === 'detail')) {
        req.controllerData = req.controllerData || {};
        let variableData = req.controllerData.data;
        variableData = variableData || {};
        variableData.required_input_variables = variableData.required_input_variables || [];
        variableData.required_calculated_variables = variableData.required_calculated_variables || [];
        variableData.required_variables = [];
        variableData.required_input_variables.forEach(variable => {
          variableData.required_variables.push(`required_input_variables:${variable._id}`);
        });
        variableData.required_calculated_variables.forEach(variable => {
          variableData.required_variables.push(`required_calculated_variables:${variable._id}`);
        });
        variableData.strategies = variableData.strategies.map(strategy => {
          strategy = Object.assign({}, strategy, {
            type: (strategy.type) ? capitalize.words(strategy.type).split('_').join(' ') : '',
          });
          return strategy;
        });
        variableData.formattedCreatedAt = `${transformhelpers.formatDateNoTime(variableData.createdat, req.user.time_zone)} by ${variableData.user.creator}`;
        variableData.formattedUpdatedAt = `${transformhelpers.formatDateNoTime(variableData.updatedat, req.user.time_zone)} by ${variableData.user.updater}`;
        req.controllerData.data = variableData;
        const Variable = periodic.datas.get('standard_variable');
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        Variable.model.find({ organization, })
          .then(variables => {
            let variableDropdown = variables.map(variable => ({ label: variable.display_title, value: (variable.type === 'Calculated') ? `required_calculated_variables:${variable._id}` : `required_input_variables:${variable._id}`, })).sort((a, b) => (a.label > b.label) ? 1 : -1);
            variableDropdown.unshift({
              label: ' ',
              value: '',
              disabled: true,
            });
            req.controllerData.formoptions = {
              'required_variables': variableDropdown,
            };
            resolve(req);
          })
          .catch(reject);
      } else {
        resolve(req);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function restrictedVariableCheck(req) {
  return new Promise((resolve, reject) => {
    try {
      const RESTRICTED_NAMES = ['name', 'description', 'population_tags', 'passed', 'decline_reasons', 'credit_process', 'error', 'errors', 'message', 'input_variables', 'output_variables', 'processing_detail', 'data_sources', 'assignments', 'calculations', 'requirements', 'scorecard', 'output', 'communications', 'dataintegration', 'artificialintelligence',];
      let rb = req.body;
      if (req.query.bulk && rb.data) {
        let restricted_names = rb.data.reduce((acc, curr) => {
          if (RESTRICTED_NAMES.includes(curr.title)) acc.push(curr.title);
          return acc;
        }, []);
        if (restricted_names.length) req.error = `The following variable names are reserved: ${restricted_names.join(', ')}. Please use different names.`;
        if (rb.name == Number(rb.name)) req.error = 'Numbers can not be variables';
      } else if (rb && rb.name && RESTRICTED_NAMES.includes(rb.name.toLowerCase())) {
        req.error = req.error || '';
        req.error += `The variable name "${rb.name}" is reserved. Please use a different name.`;
      } else if (rb.name == Number(rb.name)) {
        req.error = 'Numbers can not be used as variable names';
      }
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Stages variable request body prior to update or create
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated variable request bodu
 */
function stageVariableReqBody(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      if (req.body && req.body.required_variables) {
        let variableOrderList = {
          required_input_variables: [],
          required_calculated_variables: [],
        };
        req.body.required_variables.forEach(variable => {
          let [field, _id,] = variable.split(':');
          if (_id.toString() !== req.body._id.toString()) variableOrderList[ field.trim() ].push(_id);
        });
        const Variable = periodic.datas.get('standard_variable');
        let user = req.user;
        let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
        Variable.model.find({ _id: { $in: variableOrderList.required_calculated_variables, }, organization, })
          .then(variables => {
            let variableMap = variables.reduce((collection, variable) => {
              variable = variable.toJSON ? variable.toJSON() : variable;
              collection[ variable._id ] = variable;
              return collection;
            }, {});
            req.body.required_calculated_variables = variableOrderList.required_calculated_variables.reduce((collection, id) => {
              variableOrderList.required_input_variables.push(...variableMap[ id ].required_input_variables.map(variable => variable._id.toString()));
              return collection.concat([...variableMap[ id ].required_calculated_variables.map(variable => variable._id.toString()), id,]);
            }, []);
            req.body.required_input_variables = variableOrderList.required_input_variables.filter((v, i, a) => a.indexOf(v) === i);
            req.body.required_calculated_variables.push(req.body._id);
            req.body.required_calculated_variables = req.body.required_calculated_variables.filter((v, i, a) => a.indexOf(v) === i);
            delete req.body.required_variables;
            delete req.body.use_session;
            req.body.value = `return ${req.body.value}`;
            resolve(req);
          })
          .catch(reject);
      } else if (req.method === 'POST' && req.query.type !== 'version') {
        req.body.state_property_attribute = req.body.name.replace(/\s+/g, '_').toLowerCase();
        resolve(req);
      } else {
        resolve(req);
      }
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Formats the calculation detail for display
 * 
 * @param {Object} req Express request object
 * @returns {Object} request object with updated value field for variable calculation detail
 */
function formatCalculationDetail(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      if (collection === 'variables' && tabname === 'detail' && req.controllerData && req.controllerData.data && req.controllerData.data.value) {
        req.controllerData.data.value = req.controllerData.data.value.replace('return', '').trim();
      } else if (collection === 'variables' && tabname === 'update_history_detail' && (req.controllerData.data.before || req.controllerData.data.after)) {
        req.controllerData.data.before.value = (req.controllerData.data.before.value) ? req.controllerData.data.before.value.replace('return', '').trim() : '';
        req.controllerData.data.after.value = (req.controllerData.data.after.value) ? req.controllerData.data.after.value.replace('return', '').trim() : '';
      }
      resolve(req);
    } catch (e) {
      reject(e);
    }
  });
}

function formatRequiredVariablesList(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      const Variable = periodic.datas.get('standard_variable');
      if (collection === 'variables' && tabname === 'update_history_detail' && req.controllerData.data.before && req.controllerData.data.after) {
        let beforeRequiredVariables = req.controllerData.data.before.required_input_variables.concat(req.controllerData.data.before.required_calculated_variables);
        let afterRequiredVariables = req.controllerData.data.after.required_input_variables.concat(req.controllerData.data.after.required_calculated_variables);
        Variable.model.find({ _id: { $in: [...beforeRequiredVariables, ...afterRequiredVariables,], }, organization, })
          .then(required_variables => {
            let variablesMap = {};
            required_variables.forEach(variable => variablesMap[ variable._id ] = variable.name);
            req.controllerData.data.before_required_variables = req.controllerData.data.before_required_variables || beforeRequiredVariables;
            req.controllerData.data.after_required_variables = req.controllerData.data.after_required_variables || afterRequiredVariables;
            req.controllerData.formoptions = req.controllerData.data.formoptions || {};
            req.controllerData.formoptions.before_required_variables = required_variables.map(variable => Object.assign({}, { 'label': variable.name, 'value': variable._id, }));
            req.controllerData.formoptions.after_required_variables = required_variables.map(variable => Object.assign({}, { 'label': variable.name, 'value': variable._id, }));
            let formattedUpdatedAt = req.controllerData.data.after.updatedat || req.controllerData.data.before.updatedat;
            let updater = req.controllerData.data.after.user.updater || req.controllerData.data.before.user.updater;
            req.controllerData.data = Object.assign({}, req.controllerData.data, {
              formattedUpdatedAt: `${transformhelpers.formatDateNoTime(formattedUpdatedAt, user.time_zone)} by ${updater}`,
              _id: req.headers.referer.split('/').slice(-3)[ 0 ],
            });
            return resolve(req);
          })
          .catch(e => reject(e));
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

function formatVariableDetail(req) {
  return new Promise((resolve, reject) => {
    try {
      let { collection, core, tabname, parsedUrl, } = helpers.findCollectionNameFromReq({ req, });
      if (collection === 'variables' && tabname === 'detail') {
        let strategyIdMap = {};
        let filteredStrategies = [];
        if (req.controllerData.data.strategies && req.controllerData.data.strategies.length) {
          req.controllerData.data.strategies.forEach(strategy => {
            if (!strategyIdMap[ strategy._id.toString() ]) {
              filteredStrategies.push(Object.assign({}, strategy, { status: helpers.handleStatusDisplay({ status: strategy.status, locked: strategy.locked, collection: 'strategies', }), updatedat: `${transformhelpers.formatDateNoTime(strategy.updatedat, req.user.time_zone)} by ${strategy.user.updater}`, endroute: `${strategy.type.toLowerCase()}/${strategy._id}/overview`, }));
            }
            strategyIdMap[ strategy._id.toString() ] = true;
          });
          req.controllerData.data.strategies = filteredStrategies;
        }
        return resolve(req);
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}


/**
 * Assign all four name fields for variable input.
 * @param {Object} req Express request object
 */
function formatVariableName(req) {
  return new Promise((resolve, reject) => {
    try {
      let special_character_errors = [];
      if (req.query.bulk && req.body.data) {
        req.body.data = req.body.data.map((row, i) => {
          if (row.name) {
            let title = (row.system_name) 
              ? row.system_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z\d_]/g, '')
              : row.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z\d_]/g, '');
            // row.title = row.system_name || row.name.toLowerCase().replace(/\s+/g, '_'); 
            if (title.replace(/_/g, '') === '') special_character_errors.push(row.name);
            row.title = title;
            row.display_name = `${row.name.replace(/[^a-zA-Z\d\s]/g, '')} (v1)`;
            row.display_title = `${row.name.replace(/[^a-zA-Z\d\s]/g, '')}`;
            row.name = `${title}_v1`;
          } else {
            req.error = `CSV is missing variable_display_name header in row ${i + 2}.`;
          }
          return row;
        });
      }
      if (special_character_errors.length) {
        req.error = `The following Variables are invalid due to special characters in either the variable_display_name or the optional variable system name columns: ${special_character_errors.join(', ')}. Please remove the special characters and reupload them into the system.`;
      }
      resolve(req);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Checks the variables csv for same names.
 * @param {Object} req Express request object
 */
function checkVariables(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.query.bulk && req.body && req.body.data) {
        let duplicateVariables = [];
        req.body.data.reduce((uniqueVariables, curr) => {
          if (curr.title) {
            if (uniqueVariables[ curr.title ]) {
              duplicateVariables.push(curr.title);
            } else {
              uniqueVariables[ curr.title ] = true;
            }
          }
          return uniqueVariables;
        }, {});
        if (duplicateVariables.length) req.error = `The following variables have duplicate names in the csv: ${duplicateVariables.join(', ')}. Please make sure names are unique.`;
      }
      resolve(req);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Formats the uploaded csv into an array of variables
 * @param {Object} req Express request object
 */
function uploadBulkVariables(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.query.bulk || req.query.upload) {
        if (!/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
          req.error = 'Please upload a CSV.';
          resolve(req);
        }
        var busboy = new Busboy({ headers: req.headers, });
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
          let file_data = [];
          let fileTypeArr = filename.trim().split('.');
          let fileType = fileTypeArr[ fileTypeArr.length - 1 ];
          let fileSize = 0;
          if (['csv', 'xls', 'xlsx',].indexOf(fileType) === -1) {
            req.unpipe(busboy);
            req.error = 'File type must be in .csv, .xls or .xlsx format';
            return resolve(req);
          } else {
            if (fileType === 'xls' || fileType === 'xlsx') {
              file.on('data', function (chunk) {
                file_data.push(chunk);
                fileSize += chunk.length;
              })
                .on('error', function (e) {
                  req.error = `Invalid csv format: ${e.message}`;
                  return resolve(req);
                })
                .on('end', function () {
                // if (fileSize > CONTAINER_SETTING.simulation.upload_filesize_limit) {
                //   return reject({ message: `File must be less than ${CONTAINER_SETTING.simulation.upload_filesize_limit / 1048576}MB.`, });
                // }
                  let csv_data = [];
                  var buffer = Buffer.concat(file_data);
                  var workbook = XLSX.read(buffer, { type: 'buffer', });
                  let sheet_name = workbook.SheetNames[ 0 ];
                  let convertedCSVData = XLSX.utils.sheet_to_csv(workbook.Sheets[ sheet_name ]);
                  csv.fromString(convertedCSVData)
                    .on('data', function (chunk) {
                      csv_data.push(chunk);
                    })
                    .on('end', function () {
                      let dataTypeErrors = [];
                      let variableTypeErrors = [];
                      let variableNameFormatErrors = [];
                      let requiredHeaders = ['variable_display_name', 'optional_variable_system_name', 'data_type', 'variable_type', 'optional_description',];
                      let csv_headers = csv_data.shift();
                      let count = csv_headers.reduce((acc, curr) => {
                        if (requiredHeaders.indexOf(curr) !== -1) requiredHeaders.splice(requiredHeaders.indexOf(curr), 1);
                        return Object.assign(acc, { [ curr ]: (acc[ curr ] || 0) + 1, });
                      }, {});
                      let duplicates = Object.keys(count).filter(header => count[ header ] > 1);
                      let variableHeaderMap = {
                        variable_display_name: 'name',
                        optional_variable_system_name: 'system_name',
                        data_type: 'data_type',
                        variable_type: 'type',
                        optional_description: 'description',
                      };
                      if (duplicates.length) req.error = `The following headers have duplicates in the csv: ${duplicates.join(',')}`;
                      let variables = csv_data.map((row, index) => {
                        let variable = csv_headers.reduce((newVar, header, index) => {
                          let value = row[ index ];
                          header = variableHeaderMap[ header ] || header;
                          if (value !== undefined && header === 'variable_display_name') {
                            const trimmed = value.trim();
                            const isNumeric = (trimmed.length && trimmed[ 0 ] >= '0' && trimmed[ 0 ] <= '9');
                            if(isNumeric) variableNameFormatErrors.push(value);
                          }
                          if (header === 'system_name') value = value.toLowerCase();
                          if (header === 'data_type' || header === 'type') value = capitalize(value.toLowerCase());
                          if (value !== undefined && header === 'data_type' && ['Number', 'Boolean', 'String', 'Date',].indexOf(value) === -1) dataTypeErrors.push(value);
                          if (value !== undefined && header === 'type' && ['Input', 'Output', 'Calculated',].indexOf(value) === -1) variableTypeErrors.push(value);
                          if (header === 'name' || header === 'system_name' || header === 'data_type' || header === 'type' || header === 'description') {
                            newVar[ header.trim() ] = String(value).trim();
                          }
                          return newVar;
                        }, {});
                        variable = unflatten(variable);
                        return variable;
                      }, []);
                      if (requiredHeaders.length) {
                        req.error = req.error || '';
                        req.error += `There was an error uploading the file. The following csv headers are missing: ${requiredHeaders.join(', ')}. Please ensure that the csv matches the upload requirements.`;
                      } else if (dataTypeErrors.length) {
                        req.error = req.error || '';
                        req.error += `The following value(s) is an invalid Data Type: ${dataTypeErrors.join(', ')}. Valid data types include: Number, Boolean, String, and Date.`;
                      } else if (variableTypeErrors.length) {
                        req.error = req.error || '';
                        req.error += `The following value(s) is an invalid Variable Type: ${variableTypeErrors.join(', ')}. Valid variable types include: Input, Output. `;
                      } else if (variableNameFormatErrors.length) {
                        req.error = req.error || '';
                        req.error += `The following value(s) is an invalid Variable Display Name Formatting: ${variableNameFormatErrors.join(', ')}. Valid Display Names can not start with numbers.`;
                      }
                      req.body.data = variables;
                      resolve(req);
                    });
                });
            } else {
              let csv_data = [];
              file.pipe(csv())
                .on('data', function (chunk) {
                  csv_data.push(chunk);
                })
                .on('error', function (e) {
                  req.error = `Invalid csv format: ${e.message}`;
                  return reject(req);
                })
                .on('end', function () {
                  let dataTypeErrors = [];
                  let variableTypeErrors = [];
                  let variableNameFormatErrors = [];
                  let requiredHeaders = ['variable_display_name', 'optional_variable_system_name', 'data_type', 'variable_type', 'optional_description',];
                  let csv_headers = csv_data.shift();
                  let count = csv_headers.reduce((acc, curr) => {
                    if (requiredHeaders.indexOf(curr) !== -1) requiredHeaders.splice(requiredHeaders.indexOf(curr), 1);
                    return Object.assign(acc, { [ curr ]: (acc[ curr ] || 0) + 1, });
                  }, {});
                  let duplicates = Object.keys(count).filter(header => count[ header ] > 1);
                  let variableHeaderMap = {
                    variable_display_name: 'name',
                    optional_variable_system_name: 'system_name',
                    data_type: 'data_type',
                    variable_type: 'type',
                    optional_description: 'description',
                  };
                  if (duplicates.length) req.error = `The following headers have duplicates in the csv: ${duplicates.join(',')}`;
                  let variables = csv_data.map((row, index) => {
                    let variable = csv_headers.reduce((newVar, header, index) => {
                      let value = row[ index ];
                      if (value !== undefined && header === 'variable_display_name') {
                        const trimmed = value.trim();
                        const isNumeric = (trimmed.length && trimmed[ 0 ] >= '0' && trimmed[ 0 ] <= '9');
                        if(isNumeric) variableNameFormatErrors.push(value);
                      }
                      header = variableHeaderMap[ header ] || header;
                      if (header === 'system_name') value = value.toLowerCase();
                      if (header === 'data_type' || header === 'type') value = capitalize(value.toLowerCase());
                      if (value !== undefined && header === 'data_type' && ['Number', 'Boolean', 'String', 'Date',].indexOf(value) === -1) dataTypeErrors.push(value);
                      if (value !== undefined && header === 'type' && ['Input', 'Output', 'Calculated',].indexOf(value) === -1) variableTypeErrors.push(value);
                      if (header === 'name' || header === 'system_name' || header === 'data_type' || header === 'type' || header === 'description') {
                        newVar[ header.trim() ] = String(value).trim();
                      }
                      return newVar;
                    }, {});
                    variable = unflatten(variable);
                    return variable;
                  }, []);
                  if (requiredHeaders.length) {
                    req.error = req.error || '';
                    req.error += `There was an error uploading the file. The following csv headers are missing: ${requiredHeaders.join(', ')}. Please ensure that the csv matches the upload requirements.`;
                  } else if (dataTypeErrors.length) {
                    req.error = req.error || '';
                    req.error += `The following value(s) is an invalid Data Type: ${dataTypeErrors.join(', ')}. Valid data types include: Number, Boolean, String, and Date.`;
                  } else if (variableTypeErrors.length) {
                    req.error = req.error || '';
                    req.error += `The following value(s) is an invalid Variable Type: ${variableTypeErrors.join(', ')}. Valid variable types include: Input, Output.`;
                  } else if (variableNameFormatErrors.length) {
                    req.error = req.error || '';
                    req.error += `The following value(s) is an invalid Variable Display Name Formatting: ${variableNameFormatErrors.join(', ')}. Valid Display Names can not start with numbers.`;
                  }
                  req.body.data = variables;
                  resolve(req);
                });
            }
          } 
        });
        busboy.on('finish', function () {
        });
        req.pipe(busboy);
      } else {
        resolve(req);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function generateVariableTitleMap(req) {
  return new Promise((resolve, reject) => {
    try {
      const Variable = periodic.datas.get('standard_variable');
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      Variable.model.find({ organization, })
        .then(variables => {
          req.controllerData = req.controllerData || {};
          req.controllerData.variableTitleMap = variables.reduce((reduced, variable) => {
            variable = variable.toJSON ? variable.toJSON() : variable;
            reduced[ variable.title ] = variable;
            return reduced;
          }, {});
          return resolve(req);
        })
        .catch(e => {
          req.error = e.message;
          return reject(req);
        });
    } catch (err) {
      req.error = err.message;
      return reject(req);
    }
  });
}

module.exports = {
  generateVariableTitleMap,
  formatRequiredVariablesList,
  generateVariableDropdown,
  restrictedVariableCheck,
  stageVariableReqBody,
  formatCalculationDetail,
  formatVariableDetail,
  formatVariableName,
  checkVariables,
  uploadBulkVariables,
};