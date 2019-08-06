'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const utilities = require('../utilities');
const helpers = utilities.helpers;
const moment = require('moment');
const transformhelpers = require('../utilities/transformhelpers');
const simulationhelpers = require('../utilities/transforms/simulation');
const Busboy = require('busboy');
const csv = require('fast-csv');
const unflatten = require('flat').unflatten;
const numeral = require('numeral');
const qs = require('qs');
const url = require('url');
const capitalize = require('capitalize');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
let randomKey = Math.random;
const util = require('util');
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const simulationTabs = utilities.views.simulation.components.simulationTabs;
const resultStatusTag = utilities.views.simulation.components.resultStatusTag;
const simulationTestCaseTabs = utilities.views.simulation.components.simulationTestCaseTabs;
const CONTAINER_SETTING = periodic.settings.container[ 'decision-engine-service-container' ];
const MAX_FILESIZE = CONTAINER_SETTING.simulation.upload_filesize_limit || 2097152;
const getInputLink = utilities.views.shared.component.getInputLink;

/**
 * Generates the strategy dropdown for the simulation page
 * 
 * @param {Object} req Express request object
 * @returns request object with updated strategy dropdown and formoptions
 */
function generateStrategyDropdown(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.strategies && req.controllerData.strategies.length) {
        let strategies = req.controllerData.strategies.map(el => ({
          label: el.display_name,
          value: el._id.toString(),
        })).sort((a, b) => (a.label < b.label) ? -1 : 1);
        req.controllerData.formoptions = req.controllerData.formoptions || {};
        req.controllerData.formoptions = Object.assign({}, req.controllerData.formoptions, {
          strategy: helpers.mergeSort(strategies, 'label'),
        });
        return resolve(req);
      } else {
        req.controllerData.formoptions = req.controllerData.formoptions || {};
        req.controllerData.formoptions = Object.assign({}, req.controllerData.formoptions, {
          strategy: [],
        });
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Generates the test case dropdown for the simulation page
 * 
 * @param {Object} req Express request object
 * @returns request object with updated test case dropdown and formoptions
 */
function generateTestCaseDropdown(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.testcases && req.controllerData.testcases.length) {
        let testcases = req.controllerData.testcases.map(el => {
          return {
            label: el.displayname, value: el._id.toString(),
          };
        });
        req.controllerData.formoptions = req.controllerData.formoptions || {};
        req.controllerData.formoptions = Object.assign({}, req.controllerData.formoptions, {
          testcases_dropdown: helpers.mergeSort(testcases, 'label'),
        });
        delete req.controllerData.testcases;
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
 * Generates the population tags dropdown for the simulation page
 * 
 * @param {Object} req Express request object
 * @returns request object with updated test case dropdown and formoptions
 */
function generatePopulationTagsDropdown(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.populationTags && req.controllerData.populationTags.length) {
        let populationTags = req.controllerData.populationTags.map(el => {
          return {
            label: el.name, value: el._id.toString(),
          };
        });
        req.controllerData.formoptions = req.controllerData.formoptions || {};
        req.controllerData.formoptions = Object.assign({}, req.controllerData.formoptions, {
          population_tags: helpers.mergeSort(populationTags, 'label'),
        });
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
 * Formats test case detail page.
 * @param {Object} req Express request object.
 * @returns request object with updated fields for test case detail page.
 */
function formatTestCaseDetail(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.testcase.user) {
        req.controllerData.testcase.formattedCreatedAt = `${transformhelpers.formatDateNoTime(req.controllerData.testcase.createdat)} by ${req.controllerData.testcase.user.creator}`;
        req.controllerData.testcase.formattedUpdatedAt = `${transformhelpers.formatDateNoTime(req.controllerData.testcase.updatedat)} by ${req.controllerData.testcase.user.updater}`;
      }
      if (req.controllerData.testcase.value) {
        req.controllerData.testcase.stringifyValue = JSON.stringify(req.controllerData.testcase.value, null, 1).slice(2, -2);
      }
      req.controllerData.testcase.population_tags = req.controllerData.testcase.population_tags.map(tag => {
        return tag._id;
      });
      if (req.controllerData.populationTags) {
        req.controllerData.formOptions = {
          population_tags: req.controllerData.populationTags.map(tag => {
            return { label: tag.name, value: tag._id, };
          }),
        };
      }
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Creates testcase tabs.
 * @param {Object} req Express request object.
 * @returns request object with updated fields for test case detail page.
 */
async function testcaseTabs(req) {
  req.controllerData = req.controllerData || {};
  let data_types = req.controllerData.data_types;
  let titleToDisplayTitle = req.controllerData.inputVariables.reduce((reduced, variable) => {
    reduced[ variable.title ] = variable.display_title;
    return reduced;
  }, {});
  req.controllerData.tabs = [ {
    name: 'TABLE',
    layout: {
      component: 'ResponsiveTable',
      props: {
        flattenRowData: true,
        limit: 500,
        hasPagination: false,
        headerLinkProps: {
          style: {
            textDecoration: 'none',
            color: styles.colors.darkGreyText,
          },
        },
        headers: [ {
          label: 'Variable Display Name',
          sortid: 'variable',
          sortable: false,
        },
        {
          label: 'Data Type',
          sortid: 'data_type',
          sortable: false,
        },
        {
          label: 'Value',
          sortid: 'value',
          sortable: false,
        },
        {
          'headerColumnProps': {
            style: {
              width: '80px',
            },
          },
          columnProps: {
            style: {
              whiteSpace: 'nowrap',
            },
          },
          label: ' ',
          buttons: [
            {
              passProps: {
                buttonProps: {
                  icon: 'fa fa-pencil',
                  className: '__icon_button',
                },
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Edit Variable',
                  pathname: '/modal/edit_variable/:id/:variable/:value',
                  params: [ { 'key': ':id', 'val': '_id', }, { 'key': ':variable', 'val': 'variable', }, { 'key': ':value', 'val': 'linkValue', }, ],
                },
                'successProps': {
                  'success': true,
                },
              },
            },
            {
              passProps: {
                buttonProps: {
                  icon: 'fa fa-trash',
                  color: 'isDanger',
                  className: '__icon_button',
                },
                onClick: 'func:this.props.fetchAction',
                onclickBaseUrl: '/simulation/api/delete_variable/:id/:variable',
                onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, { 'key': ':variable', 'val': 'variable', }, ],
                fetchProps: {
                  method: 'DELETE',
                },
                successProps: {
                  successCallback: 'func:this.props.refresh',
                },
              },
            },
          ],
        },
        ],
        rows: req.controllerData.testcase.value
          ? Object.keys(req.controllerData.testcase.value).map(key => {
            let value = req.controllerData.testcase.value[ key ];
            let linkValue = (typeof value === 'string' && value.match(/\//g)) ? value.replace(/\//g, '_') : value;
            return { variable: titleToDisplayTitle[ key ], data_type: data_types[ key ], value, linkValue, _id: req.controllerData.testcase._id, };
          })
          : [],
      },
    },
  }, {
    name: 'CODE',
    layout: {
      component: 'CodeMirror',
      props: {
        codeMirrorProps: {
          options: {
            mode: 'javascript',
          },
        },
        value: req.controllerData.testcase.stringifyValue,
      },
    },
  },
  ];
  return req;
}

/**
 * Assigns default example value to the testcase for user reference.
 * @param {Object} req Express request object.
 */
function assignExampleValue(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.inputVariables && !req.query.bulk) {
        req.body.value = req.controllerData.populatedUniqueVar;
      } else {
        req.body.value = {
          'example_string': 'string',
          'example_boolean': true,
          'example_number': 0,
          'example_date': moment(new Date()).format('MM/DD/YYYY'),
        };
      }
      resolve(req);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Formats the uploaded csv into an array of test cases
 * @param {Object} req Express request object
 */
function uploadBulkTestCases(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.query.bulk || req.query.upload) {
        if (!/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
          req.error = 'Please upload a CSV.';
          resolve(req);
        }
        var busboy = new Busboy({ headers: req.headers, });
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
          let csv_data = [];
          file.pipe(csv({ trim: true, }))
            .on('data', function (chunk) {
              csv_data.push(chunk);
            })
            .on('error', function (e) {
              req.error = `Invalid csv format: ${e.message}`;
              return resolve(req);
            })
            .on('end', function () {
              let csv_headers = csv_data.shift() || [];
              let count = csv_headers.reduce((acc, curr) => Object.assign(acc, { [ curr ]: (acc[ curr ] || 0) + 1, }), {});
              let duplicates = Object.keys(count).filter(header => count[ header ] > 1);
              if (duplicates.length) req.error = `The following headers have duplicates in the csv: ${duplicates.join(',')}`;
              let test_cases = csv_data.map(row => row.filter(el => el !== ' ')).map(row => {
                let testcase = csv_headers.reduce((tc, header, index) => {
                  let value = row[ index ];
                  if (header === 'population_tags') value = `[${value}]`;
                  if ([ undefined, '[]', ].indexOf(value) === -1 && [ 'name', 'description', ].indexOf(header) === -1) value = transformhelpers.formatCSVRowValue(value);
                  if (header !== 'description' && (value === undefined || value === '')) value = null;
                  if (header === 'name' || header === 'description') {
                    tc[ header ] = String(value).trim();
                  } else if (header === 'population_tags') {
                    if (value === '[]') tc[ header ] = [];
                    else tc[ header ] = value;
                  } else {
                    tc.value[ header ] = value;
                  }
                  return tc;
                }, { value: {}, });
                testcase = unflatten(testcase);
                return testcase;
              }, []);
              req.body.data = test_cases;
              resolve(req);
            });
        });
        busboy.on('finish', () => { });
        req.pipe(busboy);
      } else {
        resolve(req);
      }
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Format population tag array.
 * @param {Object} req Express request object
 */
function formatPopulationTags(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.body && req.body.population_tags) req.body.population_tags = req.body.population_tags.filter(tag => tag !== null);
      resolve(req);
    } catch (err) {
      reject(err);
    }
  });
}

function formatTestCaseIndices(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.query.upload && Array.isArray(req.body.data) && req.body.data[ 0 ]) {
        let data = req.body.data[ 0 ].value;
        delete req.body.data;
        req.body = Object.assign({}, req.body, {
          value: data,
        });
        resolve(req);
      } else if (req.body && req.body.population_tags && Array.isArray(req.body.population_tags)) {
        let populationTagMap = {};
        const PopulationTag = periodic.datas.get('standard_populationtag');
        PopulationTag.query({ query: { _id: { $in: req.body.population_tags, }, }, })
          .then(pts => {
            pts = pts.toJSON ? pts.toJSON() : pts;
            pts.forEach(ptag => {
              populationTagMap[ ptag._id ] = (ptag.max_index) ? { name: ptag.name, max_index: ptag.max_index, } : { name: ptag.name, max_index: 0, };
            });
            let ptag_name;
            let indices = (req.body.indices) ? req.controllerData.testcase.indices : {};
            indices = req.body.population_tags.reduce((returnData, ptag) => {
              let ptagDoc = populationTagMap[ ptag ];
              ptag_name = (ptagDoc && ptagDoc.name) ? ptagDoc.name : ptag;
              if (req.controllerData.testcase.indices && typeof req.controllerData.testcase.indices[ ptag_name ] === 'number') {
                returnData[ ptag_name ] = req.controllerData.testcase.indices[ ptag_name ];
                return returnData;
              } else if (!req.controllerData.testcase.indices || (req.controllerData.testcase.indices && typeof req.controllerData.testcase.indices[ ptag_name ] !== 'number')) {
                populationTagMap[ ptag ].max_index = ptagDoc.max_index + 1;
                returnData[ ptag_name ] = ptagDoc.max_index;
                return returnData;
              } else {
                return returnData;
              }
            }, {});

            req.body.indices = indices;
            req.controllerData.populationTagMap = populationTagMap;
            resolve(req);
          })
          .catch(reject);
      } else {
        req.body = Object.assign({}, req.body, {
          value: {},
        });
        resolve(req);
      }
    } catch (e) {
      logger.warn('error in formatTestCaseIndices: ', e);
      reject(e);
    }
  });
}

/**
 * Format test case body. Delete test case value from req.body and put isPatch to false on req.controllerData.
 * @param {Object} req Express request object
 */
function formatTestCaseBody(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.body.value && typeof req.body.value === 'object' && req.body.value.component !== 'ResponsiveTabs') {
        // csv upload and typing into code editor
        req.body.value; // do nothing
      } else if (req.controllerData && req.controllerData.testcase) {
        req.body.value = req.controllerData.testcase.value;
        if (req.body.undefined) delete req.body.undefined;
        if (!req.body.description) req.body.description = null;
      }
      req.controllerData.isPatch = false;
      req.body.user = req.controllerData.testcase.user;
      resolve(req);
    } catch (err) {
      reject(err.message);
    }
  });
}

/**
 * Checks the test cases csv for same names.
 * @param {Object} req Express request object
 */
function checkTestCasesNamesInCSV(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.query.bulk && req.body && req.body.data) {
        let duplicateTestCases = [];
        req.body.data.reduce((uniqueTestCases, curr) => {
          if (uniqueTestCases[ curr.name ]) {
            duplicateTestCases.push(curr.name);
          } else {
            uniqueTestCases[ curr.name ] = true;
          }
          return uniqueTestCases;
        }, {});
        if (duplicateTestCases.length) req.error = `The following cases have duplicates names in the csv: ${duplicateTestCases.join(', ')}. Please make sure names are unique.`;
      }
      resolve(req);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Assign name to be displayname, replacing all spaces with _ and lower casing all letters.
 * @param {Object} req Express request object
 */
function formatTestCaseName(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.body.displayname) {
        req.body.name = req.body.displayname.replace(/\s/g, '_').toLowerCase();
      } else if (req.query.bulk && req.body.data) {
        req.body.data = req.body.data.map(row => {
          if (row.name) {
            row.displayname = row.name.replace(/[^a-zA-Z\d\s]/g, '');
            row.name = row.displayname.replace(/\s/g, '_').toLowerCase();
          } else {
            req.error = 'CSV is missing name header.';
          }
          return row;
        });
      }
      resolve(req);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Iterates through each simulation testcases and aggregates data for each simulation to be used for csv export and reporting tables and charts
 * 
 * @param {Object} req Express request object
 */
function formatSimulationSummaryData(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.data) {
        let output_variable = (req.body.navbar && req.body.navbar.output_variable) ? req.body.navbar.output_variable : '';
        let input_variable = (req.body.navbar && req.body.navbar.input_variable) ? req.body.navbar.input_variable : '';
        let getMedian = (sortedArr) => {
          let half = Math.floor(sortedArr.length / 2);
          if (sortedArr.length % 2) return sortedArr[ half ];
          else return (sortedArr[ half - 1 ] + sortedArr[ half ]) / 2.0;
        };
        let getMode = (sortedArr) => {
          let valueMap = {};
          sortedArr.forEach(element => {
            if (element !== undefined && element !== null) {
              if (valueMap[ element.toString() ] === undefined) valueMap[ element.toString() ] = 0;
              valueMap[ element.toString() ]++;
            }
          });
          let frequency = [];
          let max = 0;
          let maxVal;
          Object.keys(valueMap).forEach(key => {
            if (valueMap[ key ] > max) {
              max = valueMap[ key ];
              maxVal = key;
            }
          });
          return Number(maxVal);
        };
        let getMinimum = (sortedArr) => sortedArr[ 0 ];
        let getMaximum = (sortedArr) => sortedArr[ sortedArr.length - 1 ];
        let getMean = (sortedArr) => {
          let sum = sortedArr.reduce((a, b) => a + b, 0);
          return sum / sortedArr.length;
        };
        let getCount = (sortedArr) => sortedArr.length;
        let simulations = req.controllerData.data;
        let formattedSimulations = simulations.map(simulation => {
          simulation = simulation.toJSON ? simulation.toJSON() : simulation;
          simulation.moduleMap = {};
          simulation.compiledstrategy.module_run_order.forEach(md => {
            simulation.moduleMap[ md.name ] = md.display_name;
          });
          let sortedOutput = simulation.results.reduce((reduced, testcase) => {
            if (testcase && testcase.outputs && !isNaN(testcase.outputs[ output_variable ])) reduced.push(testcase.outputs[ output_variable ]);
            return reduced;
          }, []).sort((a, b) => a - b);
          let sortedInput = simulation.results.reduce((reduced, testcase) => {
            if (testcase && testcase.inputs && !isNaN(testcase.inputs[ input_variable ])) reduced.push(testcase.inputs[ input_variable ]);
            return reduced;
          }, []).sort((a, b) => a - b);
          if (simulation.results && simulation.results.length) {
            let test_case_counts = {
              attempted: simulation.results.length,
              passed: simulation.results.filter(result => result.passed).length,
              failed: simulation.results.filter(result => (!result.message && (!result.error || (!result.error.length)) && !result.passed)).length,
              errored: simulation.results.filter(result => ((result.error && result.error.length) || result.message)).length,
            };
            let updatedData = Object.assign({}, simulation, {
              test_cases_attempted: { count: test_case_counts.attempted, percentage: 1, },
              test_cases_attempted_combined: `${numeral(test_case_counts.attempted).format('0,0')}`,
              test_cases_passed: { count: test_case_counts.passed, percentage: numeral(test_case_counts.passed / test_case_counts.attempted).value(), },
              test_cases_passed_combined: `${numeral(test_case_counts.passed).format('0,0')} (${numeral(test_case_counts.passed / test_case_counts.attempted).format('0%')})`,
              test_cases_failed: { count: test_case_counts.failed, percentage: numeral(test_case_counts.failed / test_case_counts.attempted).value(), },
              test_cases_failed_combined: `${numeral(test_case_counts.failed).format('0,0')} (${numeral(test_case_counts.failed / test_case_counts.attempted).format('0%')})`,
              test_cases_errored: { count: test_case_counts.errored, percentage: numeral(test_case_counts.errored / test_case_counts.attempted).value(), },
              test_cases_errored_combined: `${numeral(test_case_counts.errored).format('0,0')} (${numeral(test_case_counts.errored / test_case_counts.attempted).format('0%')})`,
              creator: (simulation.user && simulation.user.name) ? simulation.user.name : '',
            });
            if (req.body.navbar && req.body.navbar.output_variable) {
              test_case_counts = Object.assign({}, test_case_counts, {
                mean: numeral(numeral(getMean(sortedOutput)).format('0.00')).value(),
                median: numeral(numeral(getMedian(sortedOutput)).format('0.00')).value(),
                mode: numeral(numeral(getMode(sortedOutput)).format('0.00')).value(),
                minimum: numeral(numeral(getMinimum(sortedOutput)).format('0.00')).value(),
                maximum: numeral(numeral(getMaximum(sortedOutput)).format('0.00')).value(),
                count: getCount(sortedOutput),
              });
              updatedData = Object.assign({}, updatedData, {
                test_cases_mean: { count: test_case_counts.mean, },
                test_cases_median: { count: test_case_counts.median, },
                test_cases_mode: { count: test_case_counts.mode, },
                test_cases_minimum: { count: test_case_counts.minimum, },
                test_cases_maximum: { count: test_case_counts.maximum, },
                test_cases_count: { count: test_case_counts.count, },
              });
            } else if (req.body.navbar && req.body.navbar.input_variable) {
              test_case_counts = Object.assign({}, test_case_counts, {
                mean: numeral(numeral(getMean(sortedInput)).format('0.00')).value(),
                median: numeral(numeral(getMedian(sortedInput)).format('0.00')).value(),
                mode: numeral(numeral(getMode(sortedInput)).format('0.00')).value(),
                minimum: numeral(numeral(getMinimum(sortedInput)).format('0.00')).value(),
                maximum: numeral(numeral(getMaximum(sortedInput)).format('0.00')).value(),
                count: getCount(sortedInput),
              });
              updatedData = Object.assign({}, updatedData, {
                test_cases_mean: { count: test_case_counts.mean, },
                test_cases_median: { count: test_case_counts.median, },
                test_cases_mode: { count: test_case_counts.mode, },
                test_cases_minimum: { count: test_case_counts.minimum, },
                test_cases_maximum: { count: test_case_counts.maximum, },
                test_cases_count: { count: test_case_counts.count, },
              });
            }
            return updatedData;
          } else {
            return Object.assign({}, simulation, {
              test_cases_attempted: { count: 0, percentage: 1, },
              test_cases_attempted_combined: '0 (100%)',
              test_cases_passed: { count: 0, percentage: 1, },
              test_cases_passed_combined: '0 (100%)',
              test_cases_failed: { count: 0, percentage: 1, },
              test_cases_failed_combined: '0 (100%)',
              test_cases_errored: { count: 0, percentage: 1, },
              test_cases_errored_combined: '0 (100%)',
              creator: (simulation.user && simulation.user.name) ? simulation.user.name : '',
            });
          }
        });
        req.controllerData.data = simulations;
        req.controllerData.formdata = req.controllerData.formdata || {};
        req.controllerData.formdata.comparison_data = req.controllerData.formdata.comparison_data || {};
        req.controllerData.formdata.comparison_data.rows = formattedSimulations;
        req.controllerData.formdata.init = false;
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
 * Generates CSV export of the simulation reporting results
 * 
 * @param {Object} req Express request object
 */
function formatSimulationTableDataForExport(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.controllerData.data && req.controllerData.formdata && req.controllerData.formdata.comparison_data && req.controllerData.formdata.comparison_data.rows) {
        let simulations = req.controllerData.formdata.comparison_data.rows;
        let headers = simulations.map(simulation => {
          return simulation.name;
        });

        let navData = { idx: req.body.navbar.simulation_index, output_variable: req.body.navbar.output_variable, input_variable: req.body.navbar.input_variable, };
        let { rows, unit, } = simulationhelpers.createConfigurations(navData, simulations, req);
        simulations = req.controllerData.formdata.comparison_data.rows;
        let output = rows.reduce((returnData, rowConfig, i) => {
          let csv_row = {
            ' ': rowConfig.label,
          };
          headers.forEach((header, i) => {
            csv_row[ header ] = simulations[ i ][ rowConfig.sortid ][ unit ];
          });
          returnData.push(csv_row);
          return returnData;
        }, []);
        req.controllerData.flattenedOutput = output;
        return resolve(req);
      } else {
        req.error = 'Error formatting simulation table data';
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}


/**
 * Creates simulation reporting tables and charts manifest based on the configurations
 * @param {Object} req Express request object
 */
function formatSimulationChartData(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.data) {
        let simulations = req.controllerData.data;
        let simulation_index = (req.body.navbar && req.body.navbar.simulation_index) ? req.body.navbar.simulation_index : 0;
        let export_output_variable = (req.body.navbar && req.body.navbar.output_variable) ? req.body.navbar.output_variable : '';
        let export_input_variable = (req.body.navbar && req.body.navbar.input_variable) ? req.body.navbar.input_variable : '';
        let configurations = simulationhelpers.createConfigurations({ idx: simulation_index, output_variable: export_output_variable, input_variable: export_input_variable, }, simulations, req);
        let chart_table_headers = simulations.map((simulation, i) => {
          return {
            label: `${simulation.name}`,
            sortid: `simulation_${i}`,
            sortable: false,
            headerColumnProps: {
              style: {
                fontWeight: 100,
              },
            },
          };
        });
        chart_table_headers.unshift({ label: '', sortid: 'measurement_label', sortable: false, headerColumnProps: {}, });
        let chart_table_rows = configurations.rows.map(row => {
          let table_row = req.controllerData.formdata.comparison_data.rows.reduce((returnData, simulation, i) => {
            if (simulation[ row.sortid ] && simulation[ row.sortid ][ configurations.unit ]) {
              returnData[ `simulation_${i}` ] = (configurations.unit === 'percentage') ? numeral(simulation[ row.sortid ][ configurations.unit ]).format('0%') : simulation[ row.sortid ][ configurations.unit ];
            } else {
              returnData[ `simulation_${i}` ] = (configurations.unit === 'percentage') ? '0%' : 0;
            }
            return returnData;
          }, {});
          table_row.measurement_label = row.label;
          return table_row;
        });
        let comparison_data = req.controllerData.formdata.comparison_data;
        let navbar_data = req.body.navbar;
        if (navbar_data && navbar_data.simulation_index === undefined) {
          navbar_data = Object.assign({}, { simulation_index: 0, });
          req.controllerData.navbar = {};
        }
        let simulationLayout = simulationhelpers.createSimulationLayout({
          configurations,
          comparison_data, navbar_data, simulation_index, simulations, chart_table_headers, chart_table_rows,
        });
        req.controllerData._children = Object.assign({}, req.controllerData._children, {
          simulation_chart_card: simulationLayout,
        });
        return resolve(req);
      } else {
        return resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

/** Old Function
 * Setup strategy and testcases by req.params and req.body.
 * @param {Object} req Express request object
 */
// function setupStrategyAndTestCases(req) {
//   return new Promise((resolve, reject) => {
//     try {
//       if (/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
//         simulationhelpers.formatTestCaseBatchUpload(req)
//           .then(formatted => {
//             let user = req.user || {};
//             let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
//             req.params.id = formatted.strategy;
//             formatted.testcase_file = formatted.testcase_file.map((testcase, idx) => {
//               let name = `${formatted.filename}_${moment().format('YYYY-MM-DD HH:mm')}_${idx}`;
//               return {
//                 name,
//                 value: testcase,
//                 population_tags: [],
//                 entitytype: 'testcase',
//                 displayname: name,
//                 user: {
//                   creator: `${user.first_name} ${user.last_name}`,
//                   updater: `${user.first_name} ${user.last_name}`,
//                 },
//                 organization,
//               };
//             });
//             req.body = formatted;
//             req.controllerData = req.controllerData || {};
//             req.controllerData.testcases = formatted.testcase_file;
//             resolve(req);
//           })
//           .catch(e => {
//             req.error = e.message;
//             resolve(req);
//           });
//       } else {
//         req.body = unflatten(req.body);
//         req.params.id = req.body.strategy;
//         req.body.query = (req.body.select_testcases === 'specific_cases') ? { _id: { $in: req.body.testcases_dropdown, }, } : { population_tags: { $in: req.body.population_tags, }, };
//         resolve(req);
//       }
//     } catch (err) {
//       req.error = err.message;
//       resolve(err);
//     }
//   });
// }

async function setupStrategyAndTestCases(req) {
  try {
    const Strategy = periodic.datas.get('standard_strategy');
    if (req.headers[ 'content-length' ] > MAX_FILESIZE) {
      req.error = `Rules engine cases are limited to ${MAX_FILESIZE / 1048576}MB. Please delete rules engine cases from file before upload.`;
      return req;
    } else if (/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
      let formatted = await simulationhelpers.formatTestCaseBatchUpload(req);
      if (formatted.error) {
        req.error = formatted.error;
        return req;
      }
      if (!formatted.strategy) {
        req.error = 'Please select a strategy';
        return req;
      }
      let user = req.user || {};
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      req.params.id = formatted.strategy;
      let strategy = await Strategy.model.findOne({ _id: formatted.strategy.toString() }, { module_run_order: 1, }).lean();
      let hasML = strategy.module_run_order.some(md => md.type === 'artificialintelligence' && md.active === true);
      let max_case_num = (hasML) ? 100 : 10000;
      if (formatted.testcase_file && formatted.testcase_file.length && formatted.testcase_file.length > max_case_num) {
        req.error = (max_case_num === 10000) ? 'The maximum number of cases per batch process is 10,000.' : `Maximum number of test cases per organization is ${max_case_num}. Please delete test cases before processing.`;
        return req;
      }
      formatted.select_testcases = formatted.select_testcases || 'file';
      formatted.testcase_file = formatted.testcase_file.map((testcase, idx) => {
        let name = testcase.name || '';
        let testcaseVal = Object.assign({}, testcase);
        delete testcaseVal.name;
        return {
          name,
          value: testcaseVal,
          population_tags: [],
          entitytype: 'testcase',
          displayname: name,
          user: {
            creator: `${user.first_name} ${user.last_name}`,
            updater: `${user.first_name} ${user.last_name}`,
          },
          organization,
        };
      });
      req.body = formatted;
      req.controllerData = req.controllerData || {};
      req.controllerData.testcases = formatted.testcase_file;
      return req;
    } else {
      req.error = 'Please select a file';
      return req;
    }
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

function setupStrategyAndIndividualCase(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.body.selected_strategy) {
        req.body = unflatten(req.body);
        req.controllerData.testcase = req.body;
        let variableTitleMap = req.controllerData && req.controllerData.variableTitleMap ? req.controllerData.variableTitleMap : {};
        req.body.inputs = req.body.inputs || {};
        Object.keys(req.body.inputs).forEach(input_title => {
          if (input_title !== 'selected_strategy' && input_title !== 'null') {
            let type = variableTitleMap[ input_title ].data_type;
            req.body[ input_title ] = transformhelpers.coerceDataType(req.body.inputs[ input_title ], type);
          }
        });
        delete req.body.inputs;
        delete req.body.null;
        resolve(req);
      } else {
        req.error = 'Please select a strategy';
        resolve(req);
      }
    } catch (err) {
      req.error = err.message;
      resolve(err);
    }
  });
}

/**
 * Format simulation result rows.
 * @param {Object} req Express request object
 */
function formatSimulationResults(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.controllerData && req.controllerData.rows) {
        req.controllerData.rows = req.controllerData.rows.map(row => {
          row.created_at = moment(row.createdat).format('M/DD/YYYY');
          row.created_by = row.user.name;
          row.progressBar = {
            progress: Math.round(row.progress),
            state: row.status === 'Error'
              ? 'error'
              : row.status === 'Complete'
                ? 'success'
                : null,
          };
          return row;
        });
      }
      resolve(req);
    } catch (err) {
      reject(err);
    }
  });
}

function createSimulationPage(req) {
  let organization_id = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization._id.toString() : 'organization';
  return new Promise((resolve, reject) => {
    try {
      if (req.params.id) {
        req.controllerData.simulationPage = [
          {
            component: 'div',
            children: [ plainGlobalButtonBar({
              left: [ {
                component: 'ResponsiveButton',
                thisprops: {
                  onclickPropObject: [ 'formdata', ],
                },
                props: {
                  onClick: 'func:window.submitRefForm',
                  buttonProps: {
                    color: 'isSuccess',
                  },
                },
                children: 'RUN STRATEGY',
              },
              ],
              right: [ {
                guideButton: true,
                location: references.guideLinks.rulesEngine.batchProcessing,
              },
              ],
            }),
            ],
          }, {
            hasWindowFunc: true,
            component: 'ResponsiveForm',
            asyncprops: {
              rows: [ 'simulationdata', 'rows' ],
              numItems: [ 'simulationdata', 'numItems' ],
              numPages: [ 'simulationdata', 'numPages' ],
            },
            props: {
              blockPageUI: true,
              flattenFormData: true,
              footergroups: false,
              useFormOptions: false,
              setInitialValues: false,
              hiddenFields: [ {
                form_name: 'select_testcases',
                form_static_val: 'file',
              }, ],
              onChange: 'func:window.selectTestCasesForSimulation',
              ref: 'func:window.addRef',
              onSubmit: {
                url: '/simulation/api/batch/run?pagination=simulations&upload=true',
                options: {
                  headers: {
                  },
                  method: 'POST',
                },
                successCallback: [ 'func:this.props.refresh', 'func:this.props.createNotification', ],
                successProps: [ null, {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                },
                ],
              },
              formdata: {
                module_skip: {
                  file: {
                    dataintegration: 'on',
                    artificialintelligence: 'on',
                    email: 'on',
                    textmessage: 'on',
                  },
                },
                strategy: req.params.id,
              },
              formgroups: [ {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  doubleCard: true,
                  leftDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  rightDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  leftCardProps: cardprops({
                    cardTitle: 'Strategy Execution',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                  rightCardProps: cardprops({
                    cardTitle: 'Batch Results History',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [ formElements({
                  twoColumns: true,
                  doubleCard: true,
                  left: [ {
                    'label': 'Strategy Name',
                    type: 'dropdown',
                    name: 'strategy',
                    passProps: {
                      selection: true,
                      fluid: true,
                      search: true,
                    },
                    value: req.params.id,
                    customOnChange: 'func:window.batchRunProcessingOnChange',
                    options: req.controllerData.formoptions.strategy,
                  }, {
                    customLabel: {
                      component: 'div',
                      props: {
                        style: {
                          display: 'flex',
                        },
                      },
                      children: [ {
                        component: 'span',
                        props: {
                          style: {
                            flex: '1 1 auto',
                          },
                        },
                        children: 'Source Data File',
                      }, {
                        component: 'ResponsiveButton',
                        children: 'Download Template',
                        thisprops: {
                          onclickPropObject: [ 'formdata', ],
                        },
                        props: {
                          'onclickBaseUrl': `/simulation/api/download/variables/${organization_id}/${req.params.id}?download=true&export_format=csv`,
                          aProps: {
                            style: {
                              fontWeight: 'normal',
                              color: 'inherit',
                            },
                            token: true,
                            // className: '__ra_rb',
                            // className: '__re-bulma_button __re-bulma_is-success',
                          },
                        },
                      }, ],
                    },
                    name: 'upload_file',
                    type: 'file',
                    children: 'Choose File',
                  }, {
                    name: 'batch_name',
                    placeholder: ' ',
                    customLabel: {
                      component: 'span',
                      children: [ {
                        component: 'span',
                        children: 'Batch Process Name',
                      }, {
                        component: 'span',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            color: '#ccc',
                            marginLeft: '7px',
                            fontWeight: 'normal',
                          },
                        },
                        children: 'Optional',
                      }, ],
                    },
                  }, ],
                  right: [ {
                    type: 'layout',
                    value: {
                      component: 'ResponsiveTable',
                      hasWindowFunc: true,
                      props: {
                        ref: 'func:window.addSimulationRef',
                        flattenRowData: true,
                        limit: 10,
                        dataMap: [ {
                          'key': 'rows',
                          value: 'rows',
                        }, {
                          'key': 'numItems',
                          value: 'numItems',
                        }, {
                          'key': 'numPages',
                          value: 'numPages',
                        }, ],
                        calculatePagination: true,
                        hasPagination: true,
                        simplePagination: true,
                        useInputRows: false,
                        addNewRows: false,
                        baseUrl: '/simulation/api/batch/results?format=json&pagination=batchsimulations',
                        'tableSearch': true,
                        'simpleSearchFilter': true,
                        filterSearchProps: {
                          icon: 'fa fa-search',
                          hasIconRight: false,
                          className: 'global-table-search',
                          placeholder: 'SEARCH',
                        },
                        headers: [ {
                          label: 'Date',
                          sortid: 'createdat',
                          sortable: false,
                        }, {
                          label: 'Batch Name',
                          sortid: 'name',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              // width: '35%',
                            },
                          },
                        }, {
                          label: 'Strategy Name',
                          sortid: 'strategy_name',
                          sortable: false,

                        }, {
                          label: 'Progress',
                          progressBar: true,
                          sortid: 'status',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              width: '170px',
                            },
                          },
                        }, {
                          'headerColumnProps': {
                            style: {
                              width: '45px',
                            },
                          },
                          columnProps: {
                            style: {
                              whiteSpace: 'nowrap',
                            },
                          },
                          label: ' ',
                          buttons: [
                            {
                              passProps: {
                                buttonProps: {
                                  icon: 'fa fa-pencil',
                                  className: '__icon_button',
                                },
                                onClick: 'func:this.props.reduxRouter.push',
                                onclickBaseUrl: '/decision/processing/batch/results/:id',
                                onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                              },
                            },
                          ],
                        }, ],
                      },
                      thisprops: {
                        rows: [ 'rows', ],
                        numItems: [ 'numItems', ],
                        numPages: [ 'numPages', ],
                      },
                    },
                  }, ],
                }), ],
              }, ],
            },
          },
        ];
      } else {
        req.controllerData.simulationPage = [
          {
            component: 'div',
            children: [ plainGlobalButtonBar({
              left: [],
              right: [ {
                guideButton: true,
                location: references.guideLinks.rulesEngine.batchProcessing,
              },
              ],
            }),
            ],
          }, {
            hasWindowFunc: true,
            component: 'ResponsiveForm',
            asyncprops: {
              rows: [ 'simulationdata', 'rows' ],
              numItems: [ 'simulationdata', 'numItems' ],
              numPages: [ 'simulationdata', 'numPages' ],
            },
            props: {
              flattenFormData: true,
              footergroups: false,
              useFormOptions: false,
              setInitialValues: false,
              onSubmit: {
                url: '/simulation/api/batch/run?pagination=simulations&upload=true',
                options: {
                  headers: {},
                  method: 'POST',
                },
                successCallback: [ 'func:this.props.reduxRouter.push', 'func:this.props.createNotification', ],
                successProps: [ '/decision/processing/batch/results', {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                },
                ],
              },
              formdata: {
                module_skip: {
                  file: {
                    dataintegration: 'on',
                    artificialintelligence: 'on',
                    email: 'on',
                    textmessage: 'on',
                  },
                },
              },
              formgroups: [ {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  doubleCard: true,
                  leftDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  rightDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  leftCardProps: cardprops({
                    cardTitle: 'Strategy Execution',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                  rightCardProps: cardprops({
                    cardTitle: 'Batch Results History',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [ formElements({
                  twoColumns: true,
                  doubleCard: true,
                  left: [ {
                    'label': 'Strategy Name',
                    type: 'dropdown',
                    name: 'strategy',
                    passProps: {
                      selection: true,
                      fluid: true,
                      search: true,
                    },
                    customOnChange: 'func:window.batchRunProcessingOnChange',
                    options: req.controllerData.formoptions.strategy,
                  }, ],
                  right: [ {
                    type: 'layout',
                    value: {
                      component: 'ResponsiveTable',
                      hasWindowFunc: true,
                      props: {
                        ref: 'func:window.addSimulationRef',
                        flattenRowData: true,
                        limit: 10,
                        dataMap: [ {
                          'key': 'rows',
                          value: 'rows',
                        }, {
                          'key': 'numItems',
                          value: 'numItems',
                        }, {
                          'key': 'numPages',
                          value: 'numPages',
                        }, ],
                        calculatePagination: true,
                        hasPagination: true,
                        simplePagination: true,
                        useInputRows: false,
                        addNewRows: false,
                        baseUrl: '/simulation/api/batch/results?format=json&pagination=batchsimulations',
                        'tableSearch': true,
                        'simpleSearchFilter': true,
                        filterSearchProps: {
                          icon: 'fa fa-search',
                          hasIconRight: false,
                          className: 'global-table-search',
                          placeholder: 'SEARCH',
                        },
                        headers: [ {
                          label: 'Date',
                          sortid: 'createdat',
                          sortable: false,
                        }, {
                          label: 'Batch Name',
                          sortid: 'name',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              // width: '35%',
                            },
                          },
                        }, {
                          label: 'Strategy Name',
                          sortid: 'strategy_name',
                          sortable: false,
                        }, {
                          label: 'Progress',
                          progressBar: true,
                          sortid: 'status',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              width: '170px',
                            },
                          },
                        }, {
                          'headerColumnProps': {
                            style: {
                              width: '45px',
                            },
                          },
                          columnProps: {
                            style: {
                              whiteSpace: 'nowrap',
                            },
                          },
                          label: ' ',
                          buttons: [
                            {
                              passProps: {
                                buttonProps: {
                                  icon: 'fa fa-pencil',
                                  className: '__icon_button',
                                },
                                onClick: 'func:this.props.reduxRouter.push',
                                onclickBaseUrl: '/decision/processing/batch/results/:id',
                                onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                              },
                            },
                          ],
                        }, ],
                      },
                      thisprops: {
                        rows: [ 'rows', ],
                        numItems: [ 'numItems', ],
                        numPages: [ 'numPages', ],
                      },
                    },
                  }, ],
                }), ],
              }, ],
            },
          },
        ];
      }
      resolve(req);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Creates delete test cases modal.
 * @param {Object} req Express request object
 */
function deleteTestCasesModal(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData.deleteTestCasesModal = [ {
        component: 'ResponsiveForm',
        hasWindowFunc: true,
        props: {
          flattenFormData: true,
          footergroups: false,
          useFormOptions: true,
          setInitialValues: false,
          onChange: 'func:window.selectTestCases',
          ref: 'func:window.addRef',
          onSubmit: {
            url: '/simulation/api/delete_bulk_testcases',
            options: {
              headers: {
                'Content-Type': 'application/json',
              },
              method: 'DELETE',
            },
            successCallback: [ 'func:this.props.refresh', 'func:this.props.createNotification', ],
            successProps: [ null, {
              type: 'success',
              text: 'Cases deleted!',
              timeout: 10000,
            },
            ],
          },
          formgroups: [ {
            gridProps: {
              key: randomKey(),
            },
            formElements: [ {
              label: '',
              type: 'radio',
              name: 'select_testcases',
              value: 'specific_cases',
              placeholder: 'Specific Cases',
              placeholderProps: {
                style: {
                  paddingLeft: '1rem',
                },
              },
              passProps: {
                className: 'specific_cases',
              },
            },
            ],
          }, {
            gridProps: {
              key: randomKey(),
            },
            formElements: [ {
              label: ' ',
              name: 'testcases_dropdown',
              type: 'dropdown',
              passProps: {
                selection: true,
                multiple: true,
                fluid: true,
                search: true,
                className: 'testcases_dropdown',
                style: {
                  display: 'none',
                },
              },
              options: req.controllerData.formoptions.testcases_dropdown,
            },
            ],
          }, {
            gridProps: {
              key: randomKey(),
            },
            formElements: [ {
              label: ' ',
              type: 'radio',
              name: 'select_testcases',
              value: 'population',
              placeholder: 'Population',
              placeholderProps: {
                style: {
                  paddingLeft: '1rem',
                },
              },
              layoutProps: {
                style: {
                  marginTop: '-20px',
                },
              },
              passProps: {
                className: 'population',
              },
            },
            ],
          }, {
            gridProps: {
              key: randomKey(),
            },
            formElements: [ {
              label: ' ',
              name: 'population_tags',
              type: 'dropdown',
              passProps: {
                selection: true,
                multiple: true,
                fluid: true,
                search: true,
                className: 'population_dropdown',
                style: {
                  display: 'none',
                },
              },
              options: req.controllerData.formoptions.population_tags,
            },
            ],
          }, {
            gridProps: {
              key: randomKey(),
            },
            formElements: [ {
              label: ' ',
              type: 'radio',
              name: 'select_testcases',
              value: 'all_testcases',
              placeholder: 'All Cases',
              placeholderProps: {
                style: {
                  paddingLeft: '1rem',
                },
              },
              layoutProps: {
                style: {
                  marginTop: '-20px',
                },
              },
              passProps: {
                className: 'all_testcases',
              },
            },
            ],
          }, {
            gridProps: {
              key: randomKey(),
              className: 'modal-footer-btns',
            },
            formElements: [ {
              type: 'layout',
              value: {
                component: 'ResponsiveButton',
                children: 'DELETE CASES',
                thisprops: {},
                props: {
                  onClick: 'func:window.submitRefForm',
                  buttonProps: {
                    color: 'isDanger',
                  },
                },
              },
            },
            ],
          },
          ],
        },
      },
      ];
      resolve(req);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Creates testcases page.
 * @param {Object} req Express request object
 */
async function testcasesPage(req) {
  req.controllerData = req.controllerData || {};
  req.controllerData.testcasesPage = [
    simulationTabs('test_cases'),
    plainHeaderTitle({ title: 'Reusable Cases', }),
    styles.fullPageDivider,
    plainGlobalButtonBar({
      left: [ {
        component: 'ResponsiveButton',
        props: {
          onClick: 'func:this.props.createModal',
          onclickProps: {
            title: 'Create New Case',
            pathname: '/modal/simulation/create_new_test_case',
          },
          buttonProps: {
            color: 'isSuccess',
          },
        },
        children: 'CREATE NEW',
      }, {
        component: 'ResponsiveButton',
        props: {
          onClick: 'func:this.props.createModal',
          onclickProps: {
            title: 'Bulk Add Cases',
            pathname: '/modal/simulation/bulk_add_test_cases',
          },
          buttonProps: {
            color: 'isSuccess',
          },
        },
        children: 'BULK ADD',
      },
      {
        component: 'ResponsiveButton',
        props: {
          onClick: 'func:this.props.createModal',
          onclickProps: {
            title: 'Bulk Delete Cases',
            pathname: '/modal/simulation/bulk_delete_test_cases',
          },
          buttonProps: {
            color: 'isDanger',
          },
        },
        children: 'BULK DELETE',
      },
      ],
      right: [ {
        guideButton: true,
        location: references.guideLinks.simulation[ '/test_cases' ],
      }, ],
    }),
    {
      component: 'Container',
      props: {
        style: {},
      },
      children: [ {
        component: 'ResponsiveCard',
        props: cardprops({
          headerStyle: {
            display: 'none',
          },
        }),
        children: [ {
          component: 'ResponsiveTable',
          props: {
            flattenRowData: true,
            limit: 15,
            dataMap: [ {
              'key': 'rows',
              value: 'rows',
            }, {
              'key': 'numItems',
              value: 'numItems',
            }, {
              'key': 'numPages',
              value: 'numPages',
            }, ],
            calculatePagination: true,
            hasPagination: true,
            simplePagination: true,
            baseUrl: '/simulation/api/test_cases?format=json&&pagination=testcases',
            'tableSearch': true,
            'simpleSearchFilter': true,
            filterSearchProps: {
              icon: 'fa fa-search',
              hasIconRight: false,
              className: 'global-table-search',
              placeholder: 'SEARCH',
            },
            headers: [ {
              label: 'Case Name',
              sortid: 'displayname',
              sortable: false,
            }, {
              label: 'Population Tags',
              sortid: 'joined_population_tags',
              sortable: false,
            },
            {
              label: 'Created Date',
              sortid: 'createdat',
              momentFormat: styles.momentFormat.birthdays,
              sortable: false,
            }, {
              label: 'Created By',
              sortid: 'user.creator',
              sortable: false,
            }, {
              label: 'Description',
              sortid: 'description',
              sortable: false,
            }, {
              label: ' ',
              headerColumnProps: {
                style: {
                  width: '80px',
                },
              },
              columnProps: {
                style: {
                  whiteSpace: 'nowrap',
                },
              },
              buttons: [ {
                passProps: {
                  buttonProps: {
                    icon: 'fa fa-pencil',
                    className: '__icon_button',
                  },
                  onClick: 'func:this.props.reduxRouter.push',
                  onclickBaseUrl: '/processing/test_cases/:id/detail',
                  onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                },
              }, {
                passProps: {
                  buttonProps: {
                    icon: 'fa fa-trash',
                    color: 'isDanger',
                    className: '__icon_button',
                  },
                  onClick: 'func:this.props.fetchAction',
                  onclickBaseUrl: '/processing/api/test_cases/:id',
                  onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                  fetchProps: {
                    method: 'DELETE',
                  },
                  successProps: {
                    success: {
                      notification: {
                        text: 'Changes saved successfully!',
                        timeout: 10000,
                        type: 'success',
                      },
                    },
                    successCallback: 'func:this.props.refresh',
                  },
                  confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                    title: 'Delete Automated Processing Case',
                    textContent: [ {
                      component: 'p',
                      children: 'Do you want to delete this case?',
                      props: {
                        style: {
                          textAlign: 'left',
                          marginBottom: '1.5rem',
                        },
                      },
                    }, ],
                  }),
                },
              }, ],
            }, ],
            headerLinkProps: {
              style: {
                textDecoration: 'none',
              },
            },
            rows: req.controllerData.rows,
            numItems: req.controllerData.numItems,
            numPages: req.controllerData.numPages,
          },
        }, ],
      }, ],
    },
  ];
  return req;
}


/**
 * Generates variables dropdown.
 * @param {Object} req Express request object
 */
async function generateVariablesDropdown(req) {
  req.controllerData = req.controllerData || {};
  if (req.controllerData.inputVariables) {
    let variables = req.controllerData.inputVariables.map(i => {
      return {
        label: i.display_title, value: i.title,
      };
    });
    req.controllerData.variables_dropdown = helpers.mergeSort(variables, 'label');
  }
  return req;
}

/**
 * Generates add variables modal.
 * @param {Object} req Express request object
 */
async function addVariableModal(req) {
  req.controllerData = req.controllerData || {};
  if (req.query.modal === 'addVariable') {
    req.controllerData.addVariableModal = [ {
      'component': 'ResponsiveForm',
      'hasWindowFunc': true,
      'props': {
        hiddenFields: [ {
          'form_name': 'id',
          'form_static_val': req.params.id,
        }, {
          'form_name': 'variable',
          'form_static_val': req.params.variable,
        }, {
          'form_name': 'type',
          'form_val': 'type',
        },
        ],
        onChange: 'func:window.changeType',
        ref: 'func:window.addRef',
        'onSubmit': {
          'url': '/simulation/api/edit_variable',
          'successCallback': [ 'func:this.props.hideModal', 'func:this.props.createNotification', ],
          'responseCallback': 'func:this.props.refresh',
          'successProps': [
            'last',
            {
              'text': 'Changes saved successfully!',
              'timeout': 4000,
              'type': 'success',
            },
          ],
          'errorCallback': 'func:this.props.createNotification',
          'options': {
            'method': 'PUT',
          },
        },
        'validations': [
          {
            'name': 'variable',
            'constraints': {
              'variable': {
                'presence': {
                  'message': '^Variable is required.',
                },
              },
            },
          },
          {
            'name': 'value',
            'constraints': {
              'value': {
                'presence': {
                  'message': '^Value is required.',
                },
              },
            },
          },
        ],
        formdata: Object.assign({}, { variables: req.controllerData.data_types, }),
        'formgroups': [
          {
            'gridProps': {
              'key': randomKey(),
              className: '__dynamic_form_elements',
            },
            'formElements': [
              {
                'type': 'dropdown',
                'name': 'variable',
                'passProps': {
                  selection: true,
                  fluid: true,
                  search: true,
                },
                layoutProps: {
                  style: {
                    width: '70%',
                    paddingRight: '7px',
                    display: 'inline-block',
                    verticalAlign: 'top',
                  },
                },
                'label': 'Variable Name',
                options: helpers.mergeSort(req.controllerData.variables_dropdown, 'label').reverse(),
              },
              {
                'type': 'text',
                'name': 'type',
                layoutProps: {
                  style: {
                    width: '30%',
                    display: 'inline-flex',
                    alignItems: 'flex-end',
                  },
                },
                'passProps': {
                  'state': 'isDisabled',
                },
              },
            ],
          },
          {
            'gridProps': {
              'key': randomKey(),
            },
            'formElements': [
              {
                'type': 'text',
                'name': 'value',
                'layoutProps': {},
                'onBlur': true,
                'validateOnBlur': true,
                'errorIconRight': true,
                'submitOnEnter': true,
                'errorIcon': 'fa fa-exclamation',
                'label': 'Value',
              },
            ],
          },
          {
            'gridProps': {
              'key': randomKey(),
              'className': 'modal-footer-btns',
            },
            'formElements': [
              {
                'type': 'submit',
                'value': 'Add Variable',
                'passProps': {
                  'color': 'isPrimary',
                },
                'layoutProps': {
                  'style': {
                    'textAlign': 'center',
                  },
                },
                'name': 'add variable',
              },
            ],
          },
        ],
      },
    }, ];
  }
  return req;
}

/**
 * Generates test cases bulk upload modal.
 * @param {Object} req Express request object
 */
async function generateBulkUploadModal(req) {
  req.controllerData = req.controllerData || {};
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  req.controllerData.bulkUploadModal = [ {
    component: 'ResponsiveForm',
    props: {
      flattenFormData: true,
      footergroups: false,
      'onSubmit': {
        // url: '/simulation/api/test_cases?format=json&bulk=true',
        url: '/simulation/api/bulk_upload?format=json&bulk=true',
        options: {
          method: 'POST',
        },
        successCallback: 'func:window.closeModalAndCreateNotification',
        successProps: {
          text: 'Changes saved successfully!',
          timeout: 10000,
          type: 'success',
        },
        responseCallback: 'func:window.closeModalAndCreateNotification',
        errorCallback: 'func:window.closeModalAndCreateNotification',
      },
      formgroups: [
        {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            label: 'Upload File',
            type: 'file',
            name: 'tests',
            thisprops: {},
          },
          ],
        }, {
          gridProps: {
            key: randomKey(),
            className: 'modal-footer-btns',
          },
          formElements: [ {
            type: 'layout',
            value: {
              component: 'ResponsiveButton',
              children: 'DOWNLOAD TEMPLATE',
              thisprops: {},
              props: {
                'onclickBaseUrl': `/simulation/api/download_testcase_template/${organization}?format=json&export_format=csv`,
                onClick: 'func:window.hideModal',
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-primary',
                },
              },
            },
          }, {
            type: 'submit',
            value: 'UPLOAD FILE',
            passProps: {
              color: 'isSuccess',
            },
            layoutProps: {},
          },
          ],
        },
      ],
    },
    asyncprops: {},
  },
  ];
  return req;
}

/**
 * Generates edit variable modal.
 * @param {Object} req Express request object
 */
async function editVariableModal(req) {
  req.controllerData = req.controllerData || {};
  let displayTitleToTitle = req.controllerData.inputVariables.reduce((reduced, variable) => {
    reduced[ variable.display_title ] = variable.title;
    return reduced;
  }, {});
  if (req.query.modal === 'editVariable') {
    req.controllerData.editVariableModal = [ {
      component: 'ResponsiveForm',
      thisprops: {},
      asyncprops: {},
      props: {
        hiddenFields: [ {
          'form_name': 'id',
          'form_static_val': req.params.id,
        }, {
          'form_name': 'variable',
          'form_static_val': req.params.variable,
        }, {
          'form_name': 'type',
          'form_val': 'type',
        },
        ],
        formdata: {
          variable: req.params.variable,
          type: req.controllerData.inputVariables.filter(i => i.display_title === req.params.variable)[ 0 ].data_type,
          value: req.controllerData.testcase.value[ displayTitleToTitle[ req.params.variable ] ],
        },
        onSubmit: {
          url: '/simulation/api/edit_variable',
          successCallback: [ 'func:this.props.hideModal', 'func:this.props.createNotification', ],
          responseCallback: 'func:this.props.refresh',
          successProps: [ 'last', {
            text: 'Changes saved successfully!',
            timeout: 4000,
            type: 'success',
          },
          ],
          errorCallback: 'func:this.props.createNotification',
          options: { method: 'PUT', },
        },
        validations: [ {
          name: 'variable',
          constraints: { variable: { presence: { message: '^Variable is required.', }, }, },
        },
        {
          name: 'value',
          constraints: { value: { presence: { message: '^Value is required.', }, }, },
        }, ],
        formgroups: [ {
          gridProps: {
            key: randomKey(),
            className: '__dynamic_form_elements',
          },
          formElements: [ {
            type: 'text',
            name: 'variable',
            placeholder: undefined,
            layoutProps: {
              style: {
                width: '70%',
                paddingRight: '7px',
                display: 'inline-block',
                verticalAlign: 'top',
              },
            },
            label: 'Variable Name',
            passProps: {
              state: 'isDisabled',
            },
          },
          {
            type: 'text',
            name: 'type',
            placeholder: undefined,
            layoutProps: {
              style: {
                width: '30%',
                display: 'inline-block',
                verticalAlign: 'top',
              },
            },
            label: 'Variable Type',
            labelProps: { style: { visibility: 'hidden', }, },
            passProps: { state: 'isDisabled', },
          }, ],
        },
        {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            type: 'text',
            name: 'value',
            placeholder: undefined,
            layoutProps: {},
            onBlur: true,
            validateOnBlur: true,
            errorIconRight: true,
            submitOnEnter: true,
            errorIcon: 'fa fa-exclamation',
            label: 'Value',
          }, ],
        },
        {
          gridProps: {
            key: randomKey(),
            className: 'modal-footer-btns',
          },
          formElements: [ {
            type: 'submit',
            value: 'Save Changes',
            passProps: { color: 'isPrimary', },
            layoutProps: { style: { textAlign: 'center', }, },
            name: 'save changes',
          }, ],
        }, ],
      },
      hasWindowFunc: true,
    },
    ];
  }
  return req;
}

function generateInputFields({ initValues, }) {
  return function (ipt) {
    let input;
    let initValue = (initValues[ ipt._id ] !== undefined) ? initValues[ ipt._id ] : (initValues[ ipt.title ] !== undefined) ? initValues[ ipt.title ] : '';
    switch (ipt.data_type) {
      case 'Number':
        input = {
          name: `inputs.${ipt.title}`,
          type: 'maskedinput',
          createNumberMask: true,
          value: initValue,
          passProps: {
            mask: 'func:window.numberMaskTwo',
            guid: false,
            placeholderChar: '\u2000',
          },
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: `${ipt.display_title} `,
            }, {
              component: 'span',
              children: ipt.data_type,
              props: {
                style: {
                  fontStyle: 'italic',
                  marginLeft: '2px',
                  fontWeight: 'normal',
                  color: '#969696',
                },
              },
            }, ],
          },
        };
        break;
      case 'String':
        input = {
          name: `inputs.${ipt.title}`,
          value: initValue,
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: `${ipt.display_title} `,
            }, {
              component: 'span',
              children: ipt.data_type,
              props: {
                style: {
                  fontStyle: 'italic',
                  marginLeft: '2px',
                  fontWeight: 'normal',
                  color: '#969696',
                },
              },
            }, ],
          },
        };
        break;
      case 'Boolean':
        input = {
          name: `inputs.${ipt.title}`,
          type: 'dropdown',
          passProps: {
            selection: true,
            fluid: true,
          },
          value: `${initValue}` || 'true',
          options: [ {
            label: 'True',
            value: 'true',
          }, {
            label: 'False',
            value: 'false',
          }, ],
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: `${ipt.display_title} `,
            }, {
              component: 'span',
              children: ipt.data_type,
              props: {
                style: {
                  fontStyle: 'italic',
                  marginLeft: '2px',
                  fontWeight: 'normal',
                  color: '#969696',
                },
              },
            }, ],
          },
        };
        break;
      case 'Date':
        input = {
          name: `inputs.${ipt.title}`,
          type: 'singleDatePicker',
          leftIcon: 'fas fa-calendar-alt',
          passProps: {
            hideKeyboardShortcutsPanel: true,
          },
          value: initValue,
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: `${ipt.display_title} `,
            }, {
              component: 'span',
              children: ipt.data_type,
              props: {
                style: {
                  fontStyle: 'italic',
                  marginLeft: '2px',
                  fontWeight: 'normal',
                  color: '#969696',
                },
              },
            }, ],
          },
        };
        break;
      default:
        input = {
          name: `inputs.${ipt.title}`,
          value: initValue,
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: `${ipt.display_title} `,
            }, {
              component: 'span',
              children: ipt.data_type,
              props: {
                style: {
                  fontStyle: 'italic',
                  marginLeft: '2px',
                  fontWeight: 'normal',
                  color: '#969696',
                },
              },
            }, ],
          },
        };
    }
    return input;

  };
}

function generateIndividualRunProcessPage(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.params.id) {
        let parsedUrl = url.parse(req.headers.referer);
        let parsedQuery = qs.parse(parsedUrl.query);
        req.controllerData = req.controllerData || {};
        let strategy = req.controllerData.strategies[ 0 ];
        let input_variables = (req.controllerData.compiledStrategy && req.controllerData.compiledStrategy.input_variables) ? req.controllerData.compiledStrategy.input_variables : [];
        let mapInputFields = generateInputFields({ initValues: Object.assign({}, parsedQuery, (req.query.case && req.controllerData.case && req.controllerData.case.inputs) ? req.controllerData.case.inputs : {}), });
        input_variables = input_variables.filter(input_variable => {
          if (input_variable) return input_variable;
        });
        input_variables.sort((a, b) => a.display_title > b.display_title ? 1 : -1);
        let inputFields = input_variables.map(mapInputFields);
        req.controllerData.pageLayout = [
          {
            component: 'ResponsiveForm',
            asyncprops: {
              rows: [ 'casedata', 'rows' ],
              numItems: [ 'casedata', 'numItems' ],
              numPages: [ 'casedata', 'numPages' ],
            },
            props: {
              blockPageUI: true,
              'onSubmit': {
                url: `/simulation/api/individual/run/${req.params.id}?export=true`,
                'options': {
                  'method': 'POST',
                },
                successCallback: 'func:this.props.createNotification',
                successProps: {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                },
                // responseCallback: '',
              },
              useFormOptions: true,
              flattenFormData: true,
              footergroups: false,
              formgroups: [ formGlobalButtonBar({
                left: [ {
                  type: 'submit',
                  value: 'RUN STRATEGY',
                  layoutProps: {
                    size: 'isNarrow',
                  },
                  passProps: {
                    color: 'isSuccess',
                  },
                },
                ],
                right: [ {
                  guideButton: true,
                  location: references.guideLinks.rulesEngine.individualProcessing,
                }, ],
              }),
              {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  doubleCard: true,
                  leftDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  rightDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  leftCardProps: cardprops({
                    cardTitle: 'Strategy Execution',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                  rightCardProps: cardprops({
                    cardTitle: 'Individual Results History',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [ formElements({
                  twoColumns: true,
                  doubleCard: true,
                  left: [ {
                    'label': 'Strategy Name',
                    type: 'dropdown',
                    name: 'selected_strategy',
                    value: req.params.id,
                    passProps: {
                      selection: true,
                      fluid: true,
                      search: true,
                    },
                    customOnChange: 'func:window.individualRunProcessingOnChange',
                    options: req.controllerData.strategies.map(strategy => ({
                      label: strategy.display_name,
                      value: strategy._id,
                    })),
                  }, ...inputFields, {
                    name: 'case_name',
                    customLabel: {
                      component: 'span',
                      children: [ {
                        component: 'span',
                        children: 'Decision Name ',
                      }, {
                        component: 'span',
                        children: 'Optional',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            marginLeft: '2px',
                            fontWeight: 'normal',
                            color: '#969696',
                          },
                        },
                      }, ],
                    },
                  }, ],
                  right: [ {
                    type: 'layout',
                    value: {
                      component: 'ResponsiveTable',
                      bindprops: true,
                      props: {
                        flattenRowData: true,
                        limit: 10,
                        dataMap: [ {
                          'key': 'rows',
                          value: 'rows',
                        }, {
                          'key': 'numItems',
                          value: 'numItems',
                        }, {
                          'key': 'numPages',
                          value: 'numPages',
                        }, ],
                        calculatePagination: true,
                        hasPagination: true,
                        simplePagination: true,
                        useInputRows: false,
                        addNewRows: false,
                        baseUrl: '/simulation/api/individual/cases?format=json&pagination=decisioncases',
                        'tableSearch': true,
                        'simpleSearchFilter': true,
                        filterSearchProps: {
                          icon: 'fa fa-search',
                          hasIconRight: false,
                          className: 'global-table-search',
                          placeholder: 'SEARCH',
                        },
                        headers: [ {
                          label: 'Date',
                          sortid: 'createdat',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              // width: '10%',
                            },
                          },
                        }, {
                          label: 'Type',
                          sortid: 'case_type',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              // width: '10%',
                            },
                          },
                        }, {
                          label: 'Decision Name',
                          sortid: 'case_name',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              width: '35%',
                            },
                          },
                        }, {
                          label: 'Strategy Name',
                          sortid: 'strategy_display_name',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              // width: '10%',
                            },
                          },
                        }, {
                          'headerColumnProps': {
                            style: {
                              width: '45px',
                            },
                          },
                          columnProps: {
                            style: {
                              whiteSpace: 'nowrap',
                            },
                          },
                          label: ' ',
                          buttons: [
                            {
                              passProps: {
                                buttonProps: {
                                  icon: 'fa fa-pencil',
                                  className: '__icon_button',
                                },
                                onClick: 'func:this.props.reduxRouter.push',
                                onclickBaseUrl: '/decision/processing/individual/results/:id',
                                onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                              },
                            },
                          ],
                        }, ],
                        headerLinkProps: {
                          style: {
                            textDecoration: 'none',
                          },
                        },
                      },
                      thisprops: {
                        rows: [ 'rows' ],
                        numItems: [ 'numItems' ],
                        numPages: [ 'numPages' ],
                      },
                    },
                  }, ],
                }),
                ],
              },
              ],
            },
          },
        ];
      } else {
        let strategy_id = (req.body && req.body.selected_strategy) ? `/${req.body.selected_strategy}` : '/undefined';
        req.controllerData = req.controllerData || {};
        req.controllerData.pageLayout = [

          {
            component: 'ResponsiveForm',
            asyncprops: {
              rows: [ 'casedata', 'rows' ],
              numItems: [ 'casedata', 'numItems' ],
              numPages: [ 'casedata', 'numPages' ],
            },
            props: {
              blockPageUI: true,
              'onSubmit': {
                url: `/simulation/api/individual/run${strategy_id}`,
                'options': {
                  'method': 'POST',
                },
                responseCallback: '',
              },
              useFormOptions: true,
              flattenFormData: true,
              footergroups: false,
              formgroups: [ formGlobalButtonBar({
                left: [],
                right: [ {
                  guideButton: true,
                  location: references.guideLinks.rulesEngine.individualProcessing,
                }, ],
              }),
              {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  doubleCard: true,
                  leftDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  rightDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  leftCardProps: cardprops({
                    cardTitle: 'Strategy Execution',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                  rightCardProps: cardprops({
                    cardTitle: 'Individual Results History',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [ formElements({
                  twoColumns: true,
                  doubleCard: true,
                  left: [ {
                    'label': 'Strategy Name',
                    type: 'dropdown',
                    name: 'selected_strategy',
                    passProps: {
                      selection: true,
                      fluid: true,
                      search: true,
                    },
                    customOnChange: 'func:window.individualRunProcessingOnChange',
                    options: req.controllerData.strategies.map(strategy => ({
                      label: strategy.display_name,
                      value: strategy._id,
                    })),
                  }, ],
                  right: [ {
                    type: 'layout',
                    value: {
                      component: 'ResponsiveTable',
                      bindprops: true,
                      props: {
                        flattenRowData: true,
                        limit: 10,
                        dataMap: [ {
                          'key': 'rows',
                          value: 'rows',
                        }, {
                          'key': 'numItems',
                          value: 'numItems',
                        }, {
                          'key': 'numPages',
                          value: 'numPages',
                        }, ],
                        calculatePagination: true,
                        hasPagination: true,
                        simplePagination: true,
                        useInputRows: false,
                        addNewRows: false,
                        baseUrl: '/simulation/api/individual/cases?format=json&pagination=decisioncases',
                        'tableSearch': true,
                        'simpleSearchFilter': true,
                        filterSearchProps: {
                          icon: 'fa fa-search',
                          hasIconRight: false,
                          className: 'global-table-search',
                          placeholder: 'SEARCH',
                        },
                        headers: [ {
                          label: 'Date',
                          sortid: 'createdat',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              // width: '10%',
                            },
                          },
                        }, {
                          label: 'Type',
                          sortid: 'case_type',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              // width: '10%',
                            },
                          },
                        }, {
                          label: 'Decision Name',
                          sortid: 'case_name',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              width: '35%',
                            },
                          },
                        }, {
                          label: 'Strategy Name',
                          sortid: 'strategy_display_name',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              // width: '10%',
                            },
                          },
                        }, {
                          'headerColumnProps': {
                            style: {
                              width: '45px',
                            },
                          },
                          columnProps: {
                            style: {
                              whiteSpace: 'nowrap',
                            },
                          },
                          label: ' ',
                          buttons: [
                            {
                              passProps: {
                                buttonProps: {
                                  icon: 'fa fa-pencil',
                                  className: '__icon_button',
                                },
                                onClick: 'func:this.props.reduxRouter.push',
                                onclickBaseUrl: '/decision/processing/individual/results/:id',
                                onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                              },
                            },

                          ],
                        }, ],
                        headerLinkProps: {
                          style: {
                            textDecoration: 'none',
                          },
                        },
                      },
                      thisprops: {
                        rows: [ 'rows', ],
                        numItems: [ 'numItems', ],
                        numPages: [ 'numPages', ],
                      },
                    },
                  }, ],
                }),
                ],
              },
              ],
            },
          },

        ];
      }
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return reject(err);
    }
  });
}

function formatModuleResults({ module_order, compiled_order, error, }) {
  let failed = false;
  let result_length = module_order.length;
  let errorIndex = error.length ? result_length : null;

  let rows = compiled_order.map((md, idx) => {
    if (idx === errorIndex) {
      return {
        module_name: md.display_name,
        result_tag: resultStatusTag('Error'),
      };
    } else if (idx < result_length) {
      let result = module_order[ idx ];
      if (md.type === 'requirements' && !failed) {
        if (result.passed === false) {
          failed = true;
          return {
            module_name: md.display_name,
            result_tag: resultStatusTag('Fail'),
          };
        } else if (result.passed === null) {
          return {
            module_name: md.display_name,
            result_tag: resultStatusTag('Not Run'),
          };
        } else {
          return {
            module_name: md.display_name,
            result_tag: resultStatusTag('Pass'),
          };
        }
      } else {
        return {
          module_name: md.display_name,
          result_tag: resultStatusTag('Complete'),
        };
      }
    } else {
      return {
        module_name: md.display_name,
        result_tag: resultStatusTag('Not Run'),
      };
    }
  });
  return rows;
}

function __formatValue({ data_type, value }) {
  try {
    if (value === null) return 'null';
    if ((data_type === 'Date' || typeof value === 'string') && moment(value, moment.ISO_8601, true).isValid()) {
      return transformhelpers.formatDateNoTime(value);
    } else if (data_type === 'Number') {
      return numeral(value).format('0,0.[0000]');
    } else if (data_type === 'Boolean') {
      value = `${capitalize(String(value))}`;
    }
    return value;
  } catch (e) {
    return '';
  }
}

function generateIndividualResultsDetailPage(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.data && req.controllerData.variableTitleMap) {
        let casedata = req.controllerData.data;
        let variableTitleMap = req.controllerData.variableTitleMap;
        req.controllerData.data.display_title = casedata.case_name;
        let strategy_display_name = casedata.strategy ? casedata.strategy.display_name : casedata.strategy_display_name;
        let docs = [];
        let inputs = (casedata.inputs)
          ? Object.keys(casedata.inputs).reduce((aggregate, input_title) => {
            if (input_title && input_title !== 'selected_strategy' && input_title !== 'null' && input_title !== 'case_name' && variableTitleMap[ input_title ]) {
              let returnObj = {
                input_variable: variableTitleMap[ input_title ] ? variableTitleMap[ input_title ].display_title : input_title,
                input_value: __formatValue({ data_type: variableTitleMap[ input_title ].data_type, value: casedata.inputs[ input_title ] }),
              }
              return aggregate.concat(returnObj);
            } else {
              return aggregate;
            }
          }, [])
          : [];
        let outputs = casedata.outputs ? Object.keys(casedata.outputs).map((output_title, idx) => {
          let output_variable = variableTitleMap[ output_title ] ? variableTitleMap[ output_title ].display_title : output_title;
          return {
            output_variable,
            output_value: __formatValue({ data_type: variableTitleMap[ output_title ].data_type, value: casedata.outputs[ output_title ] }),
            querystr: `?type=patch_loan_info&output_json=${JSON.stringify({ name: output_variable, value: casedata.outputs[ output_title ], value_type:  variableTitleMap[ output_title ].data_type })}`,
          };
        }) : [];
        outputs.sort((a, b) => a.output_variable.toLowerCase() > b.output_variable.toLowerCase() ? 1 : -1);
        if (Array.isArray(casedata.decline_reasons) && casedata.decline_reasons.length) {
          outputs.unshift({
            output_variable: 'Decline Reasons',
            output_value: casedata.decline_reasons.join(', '),
          });
        }
        if (Array.isArray(casedata.error) && casedata.error.length) {
          outputs.unshift({
            output_variable: 'Messages',
            output_value: casedata.error.join(', '),
          });
        }
        if (Array.isArray(casedata.files) && casedata.files.length) {
          casedata.files.forEach(file => {
            docs.push({
              filename: file.name,
              filetype: file.filetype,
              _id: file._id,
            });
          });
        }
        const outputLength = outputs.length || 0;
        const inputLength = inputs.length || 0;
        let add_to_output_to_application = [];
        let process_status = Array.isArray(casedata.error) && casedata.error.length ? 'Error' : casedata.passed ? 'Pass' : 'Fail';
        let module_order = formatModuleResults({ module_order: casedata.module_order, compiled_order: casedata.compiled_order, error: casedata.error || [], });
        let applicationFormElement;
        let strategyFormElement;
        if (casedata.application) {
          applicationFormElement = getInputLink({
            label: 'Application Title',
            baseurl: `/los/applications/${casedata.application._id.toString()}`,
            displayprop: casedata.application.title,
            passProps: {
              spanProps: {
                className: '__ra_rb los-input-link'
              },
            },
          });
          add_to_output_to_application.push({
            label: ' ',
            headerColumnProps: {
              style: {
                width: '10%'
              },
            },
            columnProps: {
              style: {
                whiteSpace: 'nowrap',
              }
            },
            buttons: [ {
              passProps: {
                buttonProps: {
                  icon: 'fa fa-plus',
                  // color: 'isDanger',
                  className: '__icon_button'
                },
                onClick: 'func:this.props.fetchAction',
                onclickBaseUrl: `/los/api/applications/${casedata.application._id.toString()}/cases/${casedata._id.toString()}/output_variables/:querystr`,
                onclickLinkParams: [ { key: ':querystr', val: 'querystr' }, ],
                fetchProps: {
                  method: 'PUT',
                },
                successProps: {
                  success: {
                    notification: {
                      text: 'Changes saved successfully!',
                      timeout: 10000,
                      type: 'success',
                    },
                  },
                  successCallback: 'func:this.props.refresh',
                },
              },
            }, ],
          });
        } else {
          applicationFormElement = {
            label: 'Application Title',
            value: '',
            passProps: {
              'state': 'isDisabled',
            },
          };
        }
        if (casedata.strategy && casedata.strategy._id) {
          strategyFormElement = getInputLink({
            label: 'Strategy Name',
            baseurl: `/decision/strategies/${casedata.strategy._id}/overview`,
            displayprop: strategy_display_name,
            passProps: {
              spanProps: {
                className: '__ra_rb los-input-link'
              },
            },
          });
        } else {
          strategyFormElement = {
            'label': 'Strategy Name',
            name: 'strategy.name',
            value: strategy_display_name || '',
            passProps: {
              'state': 'isDisabled',
            },
          };
        }
        req.controllerData.pageLayout = [ {
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            useFormOptions: true,
            flattenFormData: true,
            footergroups: false,
            formgroups: [ formGlobalButtonBar({
              left: [ {
                type: 'layout',
                layoutProps: {
                  size: 'isNarrow',
                  style: {},
                },
                value: {
                  component: 'ResponsiveButton',
                  children: 'DOWNLOAD RESULTS',
                  props: {
                    'onclickBaseUrl': `/simulation/api/download/case/${casedata._id}`,
                    aProps: {
                      className: '__re-bulma_button __re-bulma_is-success',
                    },
                  },
                },
              }, ].concat((casedata.strategy && casedata.strategy._id) ? {
                type: 'layout',
                layoutProps: {
                  size: 'isNarrow',
                  style: {},
                },
                value: {
                  component: 'ResponsiveButton',
                  children: 'REPROCESS DECISION',
                  props: {
                    'onclickBaseUrl': `/decision/processing/individual/run/${casedata.strategy._id}?case=${casedata._id}`,
                    onClick: 'func:this.props.reduxRouter.push',
                    buttonProps: {
                      color: 'isSuccess',
                    },
                  },
                },
              } : []),
              right: [ {
                guideButton: true,
                location: references.guideLinks.rulesEngine.individualProcessing,
              }, ],
            }),
            {
              gridProps: {
                key: randomKey(),
              },
              card: {
                doubleCard: true,
                leftDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                rightDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                leftCardProps: cardprops({
                  cardTitle: 'Overview',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
                rightCardProps: cardprops({
                  cardTitle: 'Processing Results',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
              },
              formElements: [ formElements({
                twoColumns: true,
                doubleCard: true,
                left: [ /*{
                  'label': 'Decision Name',
                  name: 'case_name',
                  value: casedata.case_name,
                  passProps: {
                    'state': 'isDisabled',
                  },
                },*/
                  strategyFormElement,
                  applicationFormElement, {
                    'label': 'Created',
                    name: 'createdat',
                    value: `${transformhelpers.formatDateNoTime(casedata.createdat)} by ${casedata.user ? casedata.user.creator : ''}`,
                    passProps: {
                      'state': 'isDisabled',
                    },
                  }, ],
                right: [ {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    hasWindowFunc: true,
                    props: {
                      ref: 'func:window.boldOverallResultsRow',
                      useInputRows: false,
                      tableProps: {
                        className: 'simulation_processing_results_table',
                      },
                      addNewRows: false,
                      hasPagination: false,
                      headers: [ {
                        label: 'Module',
                        sortid: 'module_name',
                      }, {
                        label: 'Result',
                        headerColumnProps: {
                          style: {
                            width: '33%',
                          },
                        },
                        sortid: 'result_tag',
                      }, ],
                      rows: [
                        ...module_order,
                        {
                          module_name: 'Overall Result',
                          result_tag: resultStatusTag(process_status),
                        },
                      ]
                    },
                  },
                }, ],
              }),
              ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              card: {
                doubleCard: true,
                leftDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                rightDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                leftCardProps: cardprops({
                  cardTitle: 'Input Variables',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
                rightCardProps: cardprops({
                  cardTitle: 'Output Variables',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
              },
              formElements: [ formElements({
                twoColumns: true,
                doubleCard: true,
                left: [ {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    props: {
                      useInputRows: false,
                      addNewRows: false,
                      hasPagination: false,
                      limit: inputLength,
                      tableWrappingStyle: inputLength > 50 ? {
                        overflowY: 'scroll',
                        maxHeight: '500px',
                      } : undefined,
                      headers: [ {
                        label: 'Variable',
                        sortid: 'input_variable',
                      }, {
                        label: 'Value',
                        sortid: 'input_value',
                      }, ],
                      rows: inputs,
                    },
                  },
                }, ],
                right: [ {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    props: {
                      useInputRows: false,
                      addNewRows: false,
                      hasPagination: false,
                      limit: outputLength,
                      tableWrappingStyle: outputLength > 50 ? {
                        overflowY: 'scroll',
                        maxHeight: '500px',
                      } : undefined,
                      headers: [ {
                        label: 'Variable',
                        sortid: 'output_variable',
                      }, {
                        label: 'Value',
                        sortid: 'output_value',
                      }, ...add_to_output_to_application ],
                      rows: outputs,
                    },
                  },
                },
                  // {
                  //   type: 'layout',
                  //   value: {
                  //     component: 'ResponsiveTable',
                  //     props: {
                  //       useInputRows: false,
                  //       addNewRows: false,
                  //       hasPagination: false,
                  //       headers: [ {
                  //         label: 'Document',
                  //         sortid: 'filename',
                  //       }, {
                  //         label: 'File Type',
                  //         sortid: 'filetype',
                  //         'headerColumnProps': {
                  //           style: {
                  //             width: '40%',
                  //           },
                  //         },
                  //       }, {
                  //         'headerColumnProps': {
                  //           style: {
                  //             width: '10%',
                  //           },
                  //         },
                  //         columnProps: {
                  //           style: {
                  //             whiteSpace: 'nowrap',
                  //           },
                  //         },
                  //         label: ' ',
                  //         buttons: [ {
                  //           passProps: {
                  //             onclickBaseUrl: '/simulation/api/download/case_docs/:id',
                  //             onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                  //             aProps: {
                  //               className: '__icon_button __re-bulma_button icon-save-content',
                  //             },
                  //           },
                  //         }, ],
                  //       }, ],
                  //       rows: docs,
                  //     },
                  //   },
                  //   },
                ],
              }),
              ],
            },
            ],
          },
        }, ];
      } else {
        req.error = 'Could not find the matching case.';
      }
      delete req.controllerData.variableTitleMap;
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });

}

//HARD CODED FOR SCREENSHOT
// function generateIndividualResultsDetailPage(req) {
//   return new Promise((resolve, reject) => {
//     try {
//       req.controllerData = req.controllerData || {};
//       if (req.controllerData.data && req.controllerData.variableTitleMap) {
//         let casedata = req.controllerData.data;
//         let variableTitleMap = req.controllerData.variableTitleMap;
//         req.controllerData.data.display_title = casedata.case_name;
//         let outputs = casedata.outputs ? Object.keys(casedata.outputs).map(output_title => ({
//           output_variable: variableTitleMap[ output_title ] ? variableTitleMap[ output_title ].display_title : output_title,
//           output_value: casedata.outputs[ output_title ],
//         })) : [];
//         if (Array.isArray(casedata.decline_reasons) && casedata.decline_reasons.length) {
//           outputs.unshift({
//             output_variable: 'Decline Reasons',
//             output_value: casedata.decline_reasons.join(', '),
//           });
//         }
//         if (Array.isArray(casedata.error) && casedata.error.length) {
//           outputs.unshift({
//             output_variable: 'Messages',
//             output_value: casedata.error.join(', '),
//           });
//         }
//         let process_status = Array.isArray(casedata.error) && casedata.error.length ? 'Error' : casedata.passed ? 'Passed' : 'Failed';
//         req.controllerData.pageLayout = [ {
//           component: 'ResponsiveForm',
//           props: {
//             blockPageUI: true,
//             useFormOptions: true,
//             flattenFormData: true,
//             footergroups: false,
//             formgroups: [ formGlobalButtonBar({
//               left: [ {
//                 type: 'submit',
//                 value: 'DOWNLOAD RESULTS',
//                 passProps: {
//                   color: 'isSuccess',
//                 },
//               } ],
//               right: [ {
//                 guideButton: true,
//                 location: '',
//               } ],
//             }),
//             {
//               gridProps: {
//                 key: randomKey(),
//               },
//               card: {
//                 doubleCard: true,
//                 leftDoubleCardColumn: {
//                   style: {
//                     display: 'flex',
//                   },
//                 },
//                 rightDoubleCardColumn: {
//                   style: {
//                     display: 'flex',
//                   },
//                 },
//                 leftCardProps: cardprops({
//                   cardTitle: 'Overview',
//                   cardStyle: {
//                     marginBottom: 0,
//                   },
//                 }),
//                 rightCardProps: cardprops({
//                   cardTitle: 'Outputs',
//                   cardStyle: {
//                     marginBottom: 0,
//                   },
//                 }),
//               },
//               formElements: [ formElements({
//                 twoColumns: true,
//                 doubleCard: true,
//                 left: [ {
//                   'label': 'Case Name',
//                   name: 'case_name',
//                   value: 'Loan Application 2547',
//                   // value: casedata.case_name,
//                   passProps: {
//                     'state': 'isDisabled',
//                   }
//                 }, {
//                   'label': 'Strategy',
//                   name: 'strategy.name',
//                   value: 'Example Personal Loan Strategy',
//                   // value: casedata.strategy.display_name,
//                   passProps: {
//                     'state': 'isDisabled',
//                   }
//                 }, {
//                   'label': 'Created',
//                   name: 'createdat',
//                   value: '6/1/2018 1:22PM by Demo User',
//                   // value: `${transformhelpers.formatDateNoTime(casedata.createdat)} by ${casedata.user ? casedata.user.creator : ''}`,
//                   passProps: {
//                     'state': 'isDisabled',
//                   }
//                 }, {
//                   type: 'layout',
//                   value: {
//                     component: 'ResponsiveTable',
//                     props: {
//                       useInputRows: false,
//                       addNewRows: false,
//                       hasPagination: false,
//                       headers: [ {
//                         label: 'Module',
//                         sortid: 'module_name',
//                       }, {
//                         label: 'Result',
//                         sortid: 'result_tag',
//                       } ],
//                       rows: [ {
//                         module_name: 'Retrieve Consumer Data',
//                         result_tag: resultStatusTag('Complete'),
//                       }, {
//                         module_name: 'Check Approval Requirements',
//                         result_tag: resultStatusTag('Pass'),
//                       }, {
//                         module_name: 'Run Predictive Model',
//                         result_tag: resultStatusTag('Complete'),
//                       }, {
//                         module_name: 'Determine Pricing',
//                         result_tag: resultStatusTag('Complete'),
//                       }, {
//                         module_name: 'Send Approval Email',
//                         result_tag: resultStatusTag('Complete'),
//                       }, ],
//                     },
//                   }
//                 }, ],
//                 right: [ {
//                   type: 'layout',
//                   value: {
//                     component: 'ResponsiveTable',
//                     props: {
//                       useInputRows: false,
//                       addNewRows: false,
//                       hasPagination: false,
//                       headers: [ {
//                         label: 'Output',
//                         sortid: 'output_variable',
//                       }, {
//                         label: 'Value',
//                         sortid: 'output_value',
//                       } ],
//                       rows: [ {
//                         output_variable: 'Overall Result',
//                         output_value: 'Passed',
//                       },
//                       // ...outputs,
//                       {
//                         output_variable: 'Interest Rate',
//                         output_value: 0.0799,
//                       }, {
//                         output_variable: 'Fees',
//                         output_value: 200,
//                       }, {
//                         output_variable: 'APR',
//                         output_value: 0.0899,
//                       }, {
//                         output_variable: 'Maximum Amount Available',
//                         output_value: 10000,
//                       },
//                       ],
//                     },
//                   }
//                 }, {
//                   type: 'layout',
//                   value: {
//                     component: 'ResponsiveTable',
//                     props: {
//                       useInputRows: false,
//                       addNewRows: false,
//                       hasPagination: false,
//                       headers: [ {
//                         label: 'Document',
//                         sortid: 'filename',
//                       }, {
//                         label: 'File Type',
//                         sortid: 'filetype',
//                       }, {
//                         'headerColumnProps': {
//                           style: {
//                             width: '80px',
//                           },
//                         },
//                         columnProps: {
//                           style: {
//                             whiteSpace: 'nowrap',
//                           },
//                         },
//                         label: ' ',
//                         buttons: [ {
//                           passProps: {
//                             onclickBaseUrl: '/simulation/api/simulation_results/:id/download?export_format=csv',
//                             onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
//                             aProps: {
//                               className: '__icon_button __re-bulma_button icon-save-content',
//                             },
//                           },
//                         }, ],
//                       } ],
//                       rows: [ {
//                         filename: 'Approval Email',
//                         filetype: 'PDF',
//                       }, {
//                         filename: 'Consumer Data',
//                         filetype: 'XML',
//                       }, {
//                         filename: 'Processing Detail',
//                         filetype: 'JSON',
//                       },],
//                     },
//                   }
//                 },
//                 ],
//               }),
//               ],
//             },
//             ],
//           },
//           asyncprops: {
//             // formdata: ['testcasedata', 'testcase', ],
//             // __formOptions: ['testcasedata', 'formOptions', ],
//             // tabs: ['testcasedata', 'tabs', ],
//           },
//         }, ];
//       } else {
//         req.error = 'Could not find the matching case.';
//       }
//       delete req.controllerData.variableTitleMap;
//       return resolve(req);
//     } catch (err) {
//       return reject();
//     }
//   });

// }

function formatCasesIndex(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      req.controllerData.rows = req.controllerData.rows.map(cs => ({
        _id: cs._id,
        case_name: cs.case_name,
        strategy_display_name: cs.strategy && cs.strategy.display_name ? cs.strategy.display_name : cs.strategy_display_name,
        createdat: transformhelpers.formatDate(cs.createdat),
      }));
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return reject();
    }
  });
}

function formatBatchCasesIndex(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      req.controllerData.rows = req.controllerData.rows.map(cs => ({
        _id: cs._id,
        name: cs.name,
        strategy_name: cs.strategy_name || '',
        createdat: transformhelpers.formatDate(cs.createdat),
        progressBar: cs.progressBar,
      }));
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return reject();
    }
  });
}

function formatBatchResultsData(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.rows && req.controllerData.rows.length) {
        req.controllerData.rows = req.controllerData.rows.map(simulation => {
          let progress = Math.round(simulation.progress);
          simulation = Object.assign({}, simulation, {
            strategy_name: (simulation.compiledstrategy && simulation.compiledstrategy.display_name) ? simulation.compiledstrategy.display_name : simulation.strategy_name,
            progressBar: {
              progress: progress,
              state: (simulation.status === 'Error' || simulation.status === 'failed')
                ? 'error'
                : (simulation.status === 'complete' || simulation.status === 'Complete' || simulation.progress === 100)
                  ? 'success'
                  : null,
            },
            createdat: `${transformhelpers.formatDate(simulation.createdat)}`,
          });
          return simulation;
        });
      }
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

function generateBatchResultsDetailPage(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.data && req.controllerData.data.results) {
        let batchdata = req.controllerData.data;
        let stats = {
          attempted: 0,
          passed: 0,
          failed: 0,
          error: 0,
        };
        let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 15) : 0;
        let cases = req.controllerData.data.results.reduce((acc, batch) => {
          if (batch.results && batch.results.length) stats.attempted = stats.attempted + batch.results.length;
          batch.results.forEach(result => {
            if (result.overall_result === 'Passed') stats.passed++;
            if (result.overall_result === 'Failed') stats.failed++;
            if (result.overall_result === 'Error') stats.error++;
          });
          acc.push(...batch.results);
          return acc;
        }, []);
        cases = cases.reverse(); //reverses order in table
        let rows = cases.map((cs, idx) => ({
          _id: cs.case,
          case_name: cs.case_name,
          process_status: cs.overall_result,
        }));
        if (req.query && req.query.query) {
          let reg = new RegExp(req.query.query, 'gi');
          rows = rows.filter(({ case_name, }) => case_name.match(reg));
        }
        req.controllerData.rows = rows.slice(skip, skip + 15);
        req.controllerData.numItems = rows.length;
        req.controllerData.numPages = rows.length / 15;
        req.controllerData.data.display_title = batchdata.name;
        req.controllerData.pageLayout = [ {
          component: 'ResponsiveForm',
          asyncprops: {
            rows: [ 'pagedata', 'rows', ],
            numPages: [ 'pagedata', 'numPages', ],
            numItems: [ 'pagedata', 'numItems', ],
          },
          props: {
            blockPageUI: true,
            useFormOptions: true,
            flattenFormData: true,
            footergroups: false,
            formgroups: [ formGlobalButtonBar({
              left: [ {
                type: 'layout',
                layoutProps: {
                  size: 'isNarrow',
                  style: {},
                },
                value: {
                  component: 'ResponsiveButton',
                  children: 'DOWNLOAD RESULTS',
                  props: {
                    'onclickBaseUrl': `/simulation/api/simulation_results/${req.controllerData.data._id}/download?export_format=csv&section=batch`,
                    aProps: {
                      className: '__re-bulma_button __re-bulma_is-success',
                    },
                  },
                },
              }, ],
              right: [ {
                guideButton: true,
                location: references.guideLinks.rulesEngine.batchProcessing,
              }, ],
            }),
            {
              gridProps: {
                key: randomKey(),
              },
              card: {
                doubleCard: true,
                leftDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                rightDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                leftCardProps: cardprops({
                  cardTitle: 'Overview',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
                rightCardProps: cardprops({
                  cardTitle: 'Cases',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
              },
              formElements: [ formElements({
                twoColumns: true,
                doubleCard: true,
                left: [ {
                  'label': 'Case Name',
                  name: 'case_name',
                  value: batchdata.name,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, {
                  'label': 'Strategy',
                  name: 'strategy_name',
                  value: (batchdata.compiledstrategy) ? batchdata.compiledstrategy.display_name : batchdata.strategy_name,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, {
                  'label': 'Created',
                  name: 'createdat',
                  value: `${transformhelpers.formatDateNoTime(batchdata.createdat)} by ${batchdata.user ? batchdata.user.name : ''}`,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, {
                  'label': 'Number of Cases',
                  name: 'statistics',
                  value: `${numeral(stats.attempted).format('0,0')} Attempted | ${numeral(stats.passed).format('0,0')} Passed | ${numeral(stats.failed).format('0,0')} Failed | ${numeral(stats.error).format('0,0')} Error`,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, ],
                right: [ {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    props: {
                      useInputRows: false,
                      addNewRows: false,
                      hasPagination: true,
                      flattenRowData: true,
                      simplePagination: true,
                      limit: 15,
                      'tableSearch': true,
                      'simpleSearchFilter': true,
                      baseUrl: `/simulation/api/batch/results/${batchdata._id}?pagination=true`,
                      filterSearchProps: {
                        icon: 'fa fa-search',
                        hasIconRight: false,
                        className: 'global-table-search',
                        placeholder: 'SEARCH',
                      },
                      dataMap: [ {
                        'key': 'rows',
                        value: 'rows',
                      }, {
                        'key': 'numItems',
                        value: 'numItems',
                      }, {
                        'key': 'numPages',
                        value: 'numPages',
                      }, ],
                      calculatePagination: true,
                      headers: [ {
                        label: 'Case Name',
                        sortid: 'case_name',
                      }, {
                        label: 'Overall Result',
                        sortid: 'process_status',
                      }, {
                        'headerColumnProps': {
                          style: {
                            width: '45px',
                          },
                        },
                        columnProps: {
                          style: {
                            whiteSpace: 'nowrap',
                          },
                        },
                        label: ' ',
                        buttons: [ {
                          passProps: {
                            buttonProps: {
                              icon: 'fa fa-pencil',
                              className: '__icon_button',
                            },
                            onClick: 'func:this.props.reduxRouter.push',
                            onclickBaseUrl: `/decision/processing/individual/results/:case_id`,
                            onclickLinkParams: [ { 'key': ':case_id', 'val': '_id', }, ],
                          },
                        }, ],
                      }, ],
                      // rows,
                    },
                    thisprops: {
                      rows: [ 'rows', ],
                      numItems: [ 'numItems', ],
                      numPages: [ 'numPages', ],
                    },
                  },
                },
                ],
              }),
              ],
            },
            ],
          },
        }, ];
        delete req.controllerData.data.results;
        delete req.controllerData.data.compiledstrategy;
      } else {
        req.error = 'Could not find the matching case.';
      }
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

function generateBatchCaseResultsDetailPage(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.data && req.controllerData.variableTitleMap) {
        let casedata = req.controllerData.data;
        let variableTitleMap = req.controllerData.variableTitleMap;
        req.controllerData.data.display_title = casedata.case_name;
        let docs = [];
        let outputs = casedata.outputs ? Object.keys(casedata.outputs).map(output_title => ({
          output_variable: variableTitleMap[ output_title ] ? variableTitleMap[ output_title ].display_title : output_title,
          output_value: casedata.outputs[ output_title ],
        })) : [];
        if (Array.isArray(casedata.decline_reasons) && casedata.decline_reasons.length) {
          outputs.unshift({
            output_variable: 'Decline Reasons',
            output_value: casedata.decline_reasons.join(', '),
          });
        }
        if (Array.isArray(casedata.error) && casedata.error.length) {
          outputs.push({
            output_variable: 'Messages',
            output_value: casedata.error.join(', '),
          });
        }
        if (Array.isArray(casedata.files) && casedata.files.length) {
          casedata.files.forEach(file => {
            docs.push({
              filename: file.name,
              filetype: file.filetype,
              _id: file._id,
            });
          });
        }
        let process_status = Array.isArray(casedata.error) && casedata.error.length ? 'Error' : casedata.passed ? 'Passed' : 'Failed';
        let module_order = formatModuleResults({ module_order: casedata.module_order, compiled_order: casedata.compiled_order, error: casedata.error || [], });
        req.controllerData.pageLayout = [ {
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            useFormOptions: true,
            flattenFormData: true,
            footergroups: false,
            formgroups: [ formGlobalButtonBar({
              left: [ {
                type: 'layout',
                layoutProps: {
                  size: 'isNarrow',
                  style: {},
                },
                value: {
                  component: 'ResponsiveButton',
                  children: 'DOWNLOAD RESULTS',
                  props: {
                    'onclickBaseUrl': `/simulation/api/download/case/${casedata._id}`,
                    aProps: {
                      className: '__re-bulma_button __re-bulma_is-success',
                    },
                  },
                },
              }, ],
              right: [ {
                guideButton: true,
                location: '',
              }, ],
            }),
            {
              gridProps: {
                key: randomKey(),
              },
              card: {
                doubleCard: true,
                leftDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                rightDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                leftCardProps: cardprops({
                  cardTitle: 'Overview',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
                rightCardProps: cardprops({
                  cardTitle: 'Outputs',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
              },
              formElements: [ formElements({
                twoColumns: true,
                doubleCard: true,
                left: [ {
                  'label': 'Case Name',
                  name: 'case_name',
                  value: casedata.case_name,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, {
                  'label': 'Strategy',
                  name: 'strategy_display_name',
                  value: (casedata.strategy) ? casedata.strategy.display_name : casedata.strategy_display_name,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, {
                  'label': 'Created',
                  name: 'createdat',
                  value: `${transformhelpers.formatDateNoTime(casedata.createdat)} by ${casedata.user ? casedata.user.creator : ''}`,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    props: {
                      useInputRows: false,
                      addNewRows: false,
                      hasPagination: false,
                      headers: [ {
                        label: 'Module',
                        sortid: 'module_name',
                      }, {
                        label: 'Result',
                        sortid: 'result_tag',
                      }, ],
                      rows: module_order,
                    },
                  },
                }, ],
                right: [ {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    props: {
                      useInputRows: false,
                      addNewRows: false,
                      hasPagination: false,
                      headers: [ {
                        label: 'Output',
                        sortid: 'output_variable',
                      }, {
                        label: 'Value',
                        sortid: 'output_value',
                      }, ],
                      rows: [ {
                        output_variable: 'Overall Result',
                        output_value: process_status,
                      },
                      ...outputs,
                      ],
                    },
                  },
                }, {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    props: {
                      useInputRows: false,
                      addNewRows: false,
                      hasPagination: false,
                      headers: [ {
                        label: 'Document',
                        sortid: 'filename',
                      }, {
                        label: 'File Type',
                        sortid: 'filetype',
                      }, {
                        'headerColumnProps': {
                          style: {
                            width: '80px',
                          },
                        },
                        columnProps: {
                          style: {
                            whiteSpace: 'nowrap',
                          },
                        },
                        label: ' ',
                        buttons: [ {
                          passProps: {
                            onclickBaseUrl: '/simulation/api/download/case_docs/:id',
                            onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                            aProps: {
                              className: '__icon_button __re-bulma_button icon-save-content',
                            },
                          },
                        }, ],
                      }, ],
                      rows: docs,
                    },
                  },
                },
                ],
              }),
              ],
            },
            ],
          },
        }, ];
      } else {
        req.error = 'Could not find the matching case.';
      }
      delete req.controllerData.variableTitleMap;
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

function downloadCaseDocumentFile(req) {
  return new Promise((resolve, reject) => {
    try {
      return resolve(req);
    } catch (err) {
      return reject(req);
    }
  });
}

function assignDownloadCsvData(req) {
  return new Promise((resolve, reject) => {
    try {
      let variableData = req.body.value;
      // variableData.name = 'string';
      req.controllerData.uniqueVars = Object.keys(variableData);
      // req.controllerData.uniqueVars.unshift('name');
      req.controllerData.flattenedOutput = [ variableData, ];
      return resolve(req);
    } catch (err) {
      return reject(req);
    }
  });
}

function generateEditOCRExtractionModal(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.data) {
        req.controllerData.pageLayout = {
          component: 'div',
          children: [ {
            component: 'ResponsiveForm',
            props: {
              blockPageUI: true,
              useFormOptions: true,
              flattenFormData: true,
              footergroups: false,
              formgroups: [ ...req.controllerData.data.outputs.map(output => ({
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  label: output.display_name,
                  type: 'text',
                  name: output.name,
                }, ],
              })), {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [ {
                  type: 'submit',
                  value: 'SAVE CHANGES',
                  passProps: {
                    color: 'isPrimary',
                  },
                  layoutProps: {},
                }, ],
              }, ],
            },
          }, ],
        };
      } else {
        req.controllerData.pageLayout = [];
      }
    } catch (e) {
      req.error = e.message;
      resolve(req);
    }
  });
}

function formatOCRDocumentsDropdown(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData.formoptions = req.controllerData.formoptions || {};
      if (req.controllerData.data) {
        req.controllerData.formoptions.ocr_id = req.controllerData.data.map(doc => ({
          label: doc.name,
          value: doc._id,
        }));
      } else {
        req.controllerData.formoptions.ocr_id = [];
      }
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

async function stageStrategyCompilation(req) {
  try {
    let pageUrl = (req.headers && req.headers.referer) ? req.headers.referer.split('/') : [];
    let strategy_id = (pageUrl.length) ? pageUrl[ pageUrl.length - 1 ] : null;
    if (strategy_id) req.params = { id: strategy_id, };
    else req.error = 'Selected strategy was not found';
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function clearExtraData(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData = Object.assign({}, req.controllerData, {
      ruleMap: {},
      variableMap: {},
      compiledStrategy: {},
      compiled_order: [],
      dataintegrations: [],
      strategies: [],
      rows: [],
    })
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function getStrategyInputVariables(req) {
  if (req.controllerData.compiledStrategy) {
    req.controllerData.inputVariables = req.controllerData.compiledStrategy.input_variables;
    req.controllerData.inputVariables.sort((a, b) => (a.title.toUpperCase() < b.title.toUpperCase()) ? -1 : (a.title.toUpperCase() > b.title.toUpperCase()) ? 1 : 0);
  } else {
    req.controllerData.inputVariables = [];
  }
  return req;
}

module.exports = {
  clearExtraData,
  getStrategyInputVariables,
  downloadCaseDocumentFile,
  generateEditOCRExtractionModal,
  generateBatchCaseResultsDetailPage,
  formatCasesIndex,
  formatBatchCasesIndex,
  generateIndividualResultsDetailPage,
  generateIndividualRunProcessPage,
  generateBatchResultsDetailPage,
  uploadBulkTestCases,
  formatTestCaseDetail,
  generateStrategyDropdown,
  generateTestCaseDropdown,
  assignExampleValue,
  formatPopulationTags,
  formatTestCaseBody,
  checkTestCasesNamesInCSV,
  formatTestCaseName,
  formatSimulationChartData,
  formatSimulationSummaryData,
  formatSimulationTableDataForExport,
  generatePopulationTagsDropdown,
  setupStrategyAndTestCases,
  setupStrategyAndIndividualCase,
  formatSimulationResults,
  createSimulationPage,
  deleteTestCasesModal,
  testcaseTabs,
  assignDownloadCsvData,
  testcasesPage,
  generateVariablesDropdown,
  addVariableModal,
  formatTestCaseIndices,
  generateBulkUploadModal,
  editVariableModal,
  formatBatchResultsData,
  formatOCRDocumentsDropdown,
  stageStrategyCompilation,
};