'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const utilities = require('../utilities');
const helpers = utilities.helpers;
const CONSTANTS = utilities.constants;
const moment = require('moment');
const transformhelpers = require('../utilities/transformhelpers');
const optimizationhelpers = require('../utilities/transforms/optimization');
const unflatten = require('flat').unflatten;
const converter = require('json-2-csv');
const flatten = require('flat').flatten;
const numeral = require('numeral');
const Promisie = require('promisie');
const fsextra = Promisie.promisifyAll(require('fs-extra'));
const fs = require('fs');
const path = require('path');
const util = require('util');
const AWS = require('aws-sdk');
const url = require('url');
const Bluebird = require('bluebird');
const inspect = require('util').inspect;
const capitalize = require('capitalize');
const mathjs = require('mathjs');
const references = utilities.views.constants.references;
const ocrComponents = utilities.views.ocr.components;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;

/**
 * Formats documents.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
async function formatTemplates(req) {
  req.controllerData = req.controllerData || {};
  req.controllerData.templates.rows = req.controllerData.templates.rows.map(data => {
    data.display_status = data.status === 'active' ? 'Active' : 'Inactive';
    return {
      name: data.name,
      updatedat: `${transformhelpers.formatDateNoTime(data.updatedat, req.user.time_zone)} by ${data.user && data.user.updater}`,
      _id: data._id.toString(),
      description: data.description,
    };
  });
  req.controllerData = req.controllerData.templates;
  return req;
}

async function formatTemplate(req) {
  req.controllerData = req.controllerData || {};
  let doc = req.controllerData.doc;
  doc.created_at = moment(doc.createdat).format('MM/DD/YYYY');
  doc.updated_at = moment(doc.updatedat).format('MM/DD/YYYY');
  doc.status = doc.status === 'active' ? true : false;
  return req;
}

async function formatTemplateDetailPage(req) {
  try {
    if (req.controllerData.doc) {
      let doc = req.controllerData.doc;
      let page = req.params.page ? Number(req.params.page) : 0;
      let query = req.query;
      let state;
      if (query.field) {
        state = 'edit';
      } else {
        state = 'add';
      }
      req.controllerData._children = ocrComponents.templateDetailForm({ doc, page, ocr_template_string: req.controllerData.ocr_template_string, query, state, });
      delete req.controllerData.ocr_template_string;
      return req;
    } else {
      req.controllerData._children = [];
      return req;
    }
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatTemplateFieldForUpdate(req) {
  try {
    let _id = req.params.id;
    let page = req.params.page ? Number(req.params.page) : 0;
    let template = req.controllerData.doc;
    let location = req.body.location;
    let parsed_location = JSON.parse(location);
    let field = {
      name: req.body.field_name,
      data_type: req.body.field_type || 'string',
      page,
      w: parsed_location.width,
      h: parsed_location.height,
      x: parsed_location.x,
      y: parsed_location.y,
    };
    if (req.query.field && template.fields[ req.query.field ] && (!req.body.field_name || template.fields[ req.query.field ].name === req.body.field_name)) {
      let idx = Number(req.query.field);
      req.body = {
        _id,
        [ `fields.${idx}` ]: field,
      };
    } else {
      req.body = {
        _id,
        fields: [ field, ],
      };
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function deleteFieldFromTemplate(req) {
  try {
    req.body = unflatten(req.body);
    req.controllerData.isPatch = false;
    if (req.params.idx) {
      let doc = req.controllerData.doc;
      let fields = doc.fields.filter((field, idx) => Number(req.params.idx) !== idx);
      req.body = Object.assign({}, doc, { fields });
    } else {
      req.error = 'Could not delete the field.';
    }
    return req;
  } catch (e) {
    return req;
  }
}

async function formatTemplateUploadRequest(req) {
  try {
    let pathname = url.parse(req.headers.referer).pathname.split('/');
    let ocr_route = pathname.slice(pathname.indexOf('templates') + 1);
    let ocr_doc_id = (ocr_route && ocr_route.length) ? ocr_route[ 0 ] : '';
    req.params.id = ocr_doc_id;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatIndividualRunProcessPage(req) {
  try {
    if (req.controllerData.templates && req.controllerData.templates.documents) {
      let template_dropdown = req.controllerData.templates.documents.map(template => ({
        label: template.name,
        value: template._id,
      })).sort((a, b) => a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1);
      req.controllerData.pageLayout = [
        ocrComponents.singleRunProcessForm({ id: req.params.id, template_dropdown, }),
      ];
    } else {
      req.controllerData.pageLayout = [];
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatIndividualRunProcessDetailPage(req) {
  try {
    if (req.controllerData.doc) {
      req.controllerData.data = req.controllerData.data || {};
      let casedoc = req.controllerData.doc;
      let extracted_fields = Object.keys(casedoc.results);
      casedoc.results_list = extracted_fields.map(fd => ({
        label: fd,
        name: fd,
        value: casedoc.results[fd],
      }));
      casedoc.formatted_created = `${moment(casedoc.createdat).format('YYYY/MM/DD')} by ${casedoc.user.creator}`;
      casedoc.formatted_updated = `${moment(casedoc.updatedat).format('YYYY/MM/DD')} by ${casedoc.user.updater}`;
      req.controllerData.data.display_title = casedoc.filename;
      req.controllerData.pageLayout = [
        ocrComponents.singleProcessDetailForm({ id: req.params.id, casedoc, }),
      ];
    } else {
      req.controllerData.pageLayout = [];
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatIndividualCaseDocForUpdate(req) {
  try {
    if (req.controllerData.doc && req.controllerData.doc.template) {
      let casedoc = req.controllerData.doc;
      casedoc.template.fields.forEach(fd => {
        let fieldname = fd.name;
        if (req.body[ fieldname ] !== undefined) {
          casedoc.results[ fieldname ] = req.body[ fieldname ];
        }
      })
      req.body = { _id: req.params.id, results: casedoc.results, };
    } else {
      req.error = 'Could not update that case document.'
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatBatchRunProcessPage(req) {
  try {
    if (req.controllerData.templates && req.controllerData.templates.documents && req.controllerData.simulations && req.controllerData.simulations.rows) {
      let template_dropdown = req.controllerData.templates.documents.map(template => ({
        label: template.name,
        value: template._id,
      })).sort((a, b) => a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1);
      req.controllerData.pageLayout = [
        ocrComponents.batchRunProcessForm({ id: req.params.id, template_dropdown, }),
      ];
    } else {
      req.controllerData.pageLayout = [];
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCaseCSV(req) {
  try {
    if (req.controllerData.doc) {
      let asyncJson2Csv = Bluebird.promisify(converter.json2csv, { context: converter, });
      let casedoc = req.controllerData.doc;
      let headers = casedoc.template ? casedoc.template.fields.map(fd => fd.name): undefined;
      const csv_options = {
        emptyFieldValue: '',
        keys: headers,
        delimiter: {
          wrap: '"', // Double Quote (") character
          array: ';', // Semicolon array value delimiter
        },
        checkSchemaDifferences: false,
      };
      let csv = await asyncJson2Csv(casedoc.results, csv_options);
      req.controllerData.download_content = csv;
    } else {
      req.controllerData.download_content = '';
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatIndividualResultsHistoryTable(req) {
  try {
    req.controllerData.cases.rows = req.controllerData.cases.rows.map(cs => ({
      _id: cs._id.toString(),
      template: cs.template ? cs.template.name : cs.template_name,
      filename: cs.filename,
      createdat: transformhelpers.formatDate(cs.createdat, req.user.time_zone),
    }));
    req.controllerData = req.controllerData.cases;
    return req;
  } catch (e) {
    req.controllerData = [];
    return req;
  }
}

async function formatBatchResultsHistoryTable(req) {
  try {
    req.controllerData.simulations.rows = req.controllerData.simulations.rows.map(cs => ({
      _id: cs._id.toString(),
      template: cs.template ? cs.template.name : cs.template_name,
      name: cs.name,
      createdat: transformhelpers.formatDate(cs.createdat, req.user.time_zone),
      organization: (cs.organization._id) ? cs.organization._id.toString() : cs.organization.toString(),
      progressBar: {
        progress: Math.round(cs.progress),
        state: (cs.status === 'Error' || cs.status === 'failed')
          ? 'error'
          : (cs.status === 'complete' || cs.status === 'Complete' || cs.progress === 100)
            ? 'success'
            : null,
      }
    }));
    req.controllerData = req.controllerData.simulations;
    return req;
  } catch (e) {
    req.controllerData = [];
  }
}

async function formatBatchRunProcessDetailPage(req) {
  try {
    if (req.controllerData.doc) {
      let simulationdoc = req.controllerData.doc;
      req.controllerData.data = req.controllerData.data || {};
      simulationdoc.formatted_created = `${moment(simulationdoc.createdat).format('YYYY/MM/DD')} by ${simulationdoc.user.creator}`;
      simulationdoc.formatted_updated = `${moment(simulationdoc.updatedat).format('YYYY/MM/DD')} by ${simulationdoc.user.updater}`;
      req.controllerData.data.display_title = `${simulationdoc.name} - ${simulationdoc.template ? simulationdoc.template.name : ''}`;
      req.controllerData.pageLayout = [
        ocrComponents.batchProcessDetailForm({ id: req.params.id, simulationdoc, }),
      ];
    } else {
      req.controllerData.pageLayout = [];
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatBatchCasesTable(req) {
  if (req.controllerData.doc) {
    let simulation = req.controllerData.doc;
    simulation.results = simulation.results.map(data => data.toJSON ? data.toJSON() : data);
    let numPages = Math.ceil(simulation.results.length / 10);
    let numItems = simulation.results.length;
    req.query.pagenum = req.query.pagenum || 1;
    let startIndex = 10 * (req.query.pagenum - 1);
    let endIndex = 10 * req.query.pagenum;
    let rows = helpers.mergeSort(simulation.results, 'name').reverse().slice(startIndex, endIndex);
    rows = rows.map((row, idx) => ({
      filename: row.filename,
      _id: simulation._id,
      caseid: row._id,
      idx,
      template: simulation.template ? simulation.template.name : simulation.template_name,
    }));
    req.controllerData = Object.assign({}, req.controllerData, {
      rows,
      numPages,
      numItems,
    });
  } else {
    req.controllerData = Object.assign({}, req.controllerData, {
      documents: [],
      rows: [],
      numPages: 0,
      numItems: 0,
    });
  }
  return req;
}

async function formatSimulationCaseEditModal(req) {
  try {
    if (req.controllerData.doc) {
      let casedoc = req.controllerData.doc;
      req.controllerData.data = req.controllerData.data || {};
      let extracted_fields = Object.keys(casedoc.results).map(key => ({
        key,
        value: casedoc.results[ key ],
      }));
      req.controllerData.pageLayout = [
        ocrComponents.batchCaseEditForm({ id: req.params.id, casedoc, extracted_fields, }),
      ];
    } else {
      req.controllerData.pageLayout = [];
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatBatchCaseDocForUpdate(req) {
  try {
    if (req.controllerData.doc && req.controllerData.doc.template) {
      let casedoc = req.controllerData.doc;
      casedoc.template.fields.forEach(fd => {
        let fieldname = fd.name;
        if (req.body[ fieldname ] !== undefined) {
          casedoc.results[ fieldname ] = req.body[ fieldname ];
        }
      });
      req.body = { _id: req.params.caseid, results: casedoc.results, };
    } else {
      req.error = 'Could not update that case document.';
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatSimulationCSV(req) {
  try {
    if (req.controllerData.doc) {
      let asyncJson2Csv = Bluebird.promisify(converter.json2csv, { context: converter, });
      let simulation = req.controllerData.doc;
      let headers = simulation.template.fields.map(fd => fd.name);
      headers.unshift('filename');
      // headers.unshift('name');
      let cases = req.controllerData.doc.results;
      // cases = cases.map(cs => Object.assign({}, { name: cs.name, filename: cs.filename, }, cs.results));
      cases = cases.map(cs => Object.assign({}, { filename: cs.filename, }, cs.results));
      const csv_options = {
        emptyFieldValue: '',
        keys: headers,
        delimiter: {
          wrap: '"', // Double Quote (") character
          array: ';', // Semicolon array value delimiter
        },
        checkSchemaDifferences: false,
      };
      let csv = await asyncJson2Csv(cases, csv_options);
      req.controllerData.download_content = csv;
    } else {
      req.controllerData.download_content = '';
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

module.exports = {
  formatTemplates,
  formatTemplate,
  formatCaseCSV,
  formatBatchCasesTable,
  formatTemplateDetailPage,
  formatSimulationCSV,
  formatTemplateUploadRequest,
  formatTemplateFieldForUpdate,
  formatSimulationCaseEditModal,
  formatIndividualRunProcessPage,
  formatBatchCaseDocForUpdate,
  formatIndividualCaseDocForUpdate,
  formatIndividualRunProcessDetailPage,
  formatIndividualResultsHistoryTable,
  formatBatchResultsHistoryTable,
  formatBatchRunProcessPage,
  deleteFieldFromTemplate,
  formatBatchRunProcessDetailPage,
};