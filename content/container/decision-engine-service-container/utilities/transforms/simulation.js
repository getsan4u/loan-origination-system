'use strict';
const periodic = require('periodicjs');
const capitalize = require('capitalize');
const Busboy = require('busboy');
const csv = require('fast-csv');
const unflatten = require('flat').unflatten;
const view_utilities = require('../views');
const transformhelpers = require('../transformhelpers');
const styles = view_utilities.constants.styles;
const shared = view_utilities.shared;
const cardprops = shared.props.cardprops;
const CONTAINER_SETTING = periodic.settings.container[ 'decision-engine-service-container' ];
const XLSX = require('xlsx');

/**
 * Creates Bars for the Reporting Chart based on the configurations
 *
 * @param {Object} configurations  Configuration for the Simulation Reporting Page
 * @param {Object} navbar_data Reporting Tab Data Settings
 * @param {Number} simulation_index The current simulation page
 * @returns {[Object]} Array of bars for the chart
 *
 */
function generateChartBars({ configurations, navbar_data, simulation_index, }) {
  return configurations.rows.reduce((reduced, row) => {
    let bar = {
      component: 'recharts.Bar',
      props: {
        dataKey: row.label,
        stackId: configurations.stacked,
        fill: row.colors,
        isAnimationActive: false,
      },
    };
    if (navbar_data && (navbar_data.output_variable || navbar_data.input_variable) && simulation_index > 3) {
      if (navbar_data.metric === row.sortid) reduced.push(bar);
      return reduced;
    } else {
      reduced.push(bar);
      return reduced;
    }
  }, []);
}

/**
 * Creates Summary Table for the Simulation Reporting
 *
 * @param {Object} comparison_data Aggregated data of the simulation testcases results
 * @returns {Object} Card with simulation summary table
 *
 */
function generateSummaryTable({ comparison_data, }) {
  return {
    component: 'ResponsiveCard',
    bindprops: true,
    ignoreReduxProps: true,
    props: cardprops({
      cardTitle: 'Summary',
    }),
    children: [
      {
        component: 'ResponsiveTable',
        bindprops: true,
        ignoreReduxProps: true,
        props: {
          ref: 'func:window.addRefToSimulationResult',
          flattenRowData: true,
          useInputRows: false,
          addNewRows: false,
          hasPagination: false,
          ignoreTableHeaders: ['_id', ],
          rows: comparison_data.rows,
          headers: [
            {
              label: 'Name',
              sortid: 'name',
              sortable: false,
              headerColumnProps: {
                style: {
                  width: '30%',
                },
              },
            }, {
              label: 'Created Date',
              sortid: 'createdat',
              momentFormat: styles.momentFormat.birthdays,
              sortable: false,
            }, {
              label: 'Created By',
              sortid: 'creator',
              sortable: false,
            }, {
              label: 'Attempted',
              sortid: 'test_cases_attempted_combined',
              sortable: false,
            }, {
              label: 'Passed',
              sortid: 'test_cases_passed_combined',
              sortable: false,
            }, {
              label: 'Failed',
              sortid: 'test_cases_failed_combined',
              sortable: false,
            }, {
              label: 'Error',
              sortid: 'test_cases_errored_combined',
              sortable: false,
            }, ],
        },
      }, ],

  };
}

/**
 * Creates metric dropdown for the simulation reporting based on configurations
 *
 * @param {Object} configurations  Configuration for the Simulation Reporting Page
 * @param {Object} navbar_data Reporting Tab Data Settings
 * @param {Number} simulation_index The current simulation page
 * @returns {Object} Filter by Metric dropdown component for output variable pages
 *
 */
function generateOutputDropdown({ simulation_index, configurations, navbar_data, }) {
  return (simulation_index > 3 && (configurations.output_variable || configurations.input_variable)) ? {
    component: 'Semantic.Dropdown',
    hasWindowFunc: true,
    bindprops: true,
    props: {
      selection: true,
      style: {
        marginBottom: '20px',
      },
      value: (navbar_data && navbar_data.metric) ? navbar_data.metric : 'test_cases_mean',
      options: [{
        text: 'Mean',
        value: 'test_cases_mean',
      }, {
        text: 'Median',
        value: 'test_cases_median',
      }, {
        text: 'Mode',
        value: 'test_cases_mode',
      }, {
        text: 'Minimum',
        value: 'test_cases_minimum',
      }, {
        text: 'Maximum',
        value: 'test_cases_maximum',
      }, {
        text: 'Count',
        value: 'test_cases_count',
      }, ],
      onSubmit: null,
      name: 'metric',
      onChange: 'func:window.simulationMetricDropdownOnClick',
    },
  } : {
    component: 'div',
    props: {
      style: {
        marginTop: '40px',
        marginBottom: '20px',
      },
    },
  };
}

/**
 * Creates NavBar Component for Simulation Reporting
 *
 * @param {Object} configurations  Configuration for the Simulation Reporting Page
 * @param {Object} navbar_data Reporting Tab Data Settings
 * @param {Number} simulation_index The current simulation page
 * @returns {Object} Navbar component contaning navigations for both default and output variables
 *
 */
function generateNavBar(options) {
  let { configurations, navbar_data, simulations, output_variables, input_variables, output_variable_map, input_variable_map, } = options;
  let simulation_names = simulations.map(simulation => simulation.name).join(';');
  let output_variable_title = output_variables.map(elmt => elmt.title);
  let input_variable_title = input_variables.map(elmt => elmt.title);
  let output_variable_navbars = output_variables.filter((v, i, a) => output_variable_title.indexOf(v.title) === i).map((elmt, idx) => {
    return {
      navButton: {
        component: 'ResponsiveButton',
        children: elmt.display_title,
        props: {
          onClick: 'func:window.simulationNavOnClick',
          onclickProps: {
            simulation_index: idx + 4,
            output_variable: elmt.title,
          },
        },
      },
    };
  });
  let input_variable_navbars = input_variables.filter((v, i, a) => input_variable_title.indexOf(v.title) === i).map((elmt, idx) => {
    return {
      navButton: {
        component: 'ResponsiveButton',
        children: elmt.display_title,
        props: {
          onClick: 'func:window.simulationNavOnClick',
          onclickProps: {
            simulation_index: idx + 4 + output_variable_navbars.length,
            input_variable: elmt.title,
          },
        },
      },
    };
  });
  let navbars = ['Overall Pass Counts', 'Overall Pass Rates', 'Decline Reason Counts', 'Decline Reason Rates', ].map((title, index) => ({
    navButton: {
      component: 'ResponsiveButton',
      children: title,
      props: {
        onClick: 'func:window.simulationNavOnClick',
        onclickProps: {
          simulation_index: index,
        },
      },
    },
  }));
  return {
    component: 'ResponsiveNavBar',
    props: {
      accordionProps: {
        className: 'simulation-sidebar',
        style: {
          flex: '0 0 auto',
          marginRight: '10px',
        },
      },
      sectionProps: {
        fitted: true,
      },
      navType: 'singlePage',
      navData: [navbars, output_variable_navbars, input_variable_navbars, ],
      navSections: [{
        title: 'SUMMARY',
      }, {
        title: 'OUTPUTS',
      }, {
        title: 'INPUTS',
      }, ],
    },
  };
}

/**
 * Creates a button to export the result of Simulation Reporting
 *
 * @param {Object} configurations  Configuration for the Simulation Reporting Page
 * @param {Number} simulation_index The current simulation page
 * @param {[Object]} simulations Array of simulation documents
 * @returns {Object} CSV Export button for Simulation Reporting
 */
function generateCsvExportButton({ simulation_index, configurations, simulations, }) {
  let simulation_names = simulations.map(simulation => simulation.name);
  simulation_names = simulation_names.join(';');
  return {
    component: 'div',
    props: {
      style: {
        textAlign: 'right',
      },
    },
    children: [{
      component: 'ResponsiveButton',
      props: {
        aProps: {
          className: '__re-bulma_button __icon_button icon-save-content',
          style: {
            position: 'absolute',
            top: '9px',
            right: '15px',
            color: '#404041',
          },
        },
        onclickBaseUrl: `/simulation/api/download_analysis_table_data?format=json&export_format=csv&simulations=${simulation_names}&simulation_index=${simulation_index}&output_variable=${configurations.output_variable}&input_variable=${configurations.input_variable}`,
        successProps: {
          success: {
            notification: {
              text: 'Changes saved successfully!',
              timeout: 10000,
              type: 'success',
            },
          },
        },
      },

    }, ],
  };
}

/**
 * Creates Layout for Simulation Reporting Page
 *
 * @param {Object} options.configurations  Configuration for the Simulation Reporting Page
 * @param {Object} options.navbar_data Reporting Tab Data Settings
 * @param {Number} options.simulation_index The current simulation page
 * @param {Object} options.comparison_data Aggregated data of the simulation testcases results
 * @param {Object} options.chart_table_headers Formatted table headers data for chart table
 * @param {Object} options.chart_table_rows Formatted table rows data for chart table
 * @param {[Object]} options.simulations Array of simulation documents
 * @returns {Object} Layout for Simulation Reporting Page to be assigned as _children
 *
 */
function createSimulationLayout(options) {
  let { configurations, comparison_data, navbar_data, simulation_index, simulations, chart_table_headers, chart_table_rows, } = options;
  let simulations_result = comparison_data.rows.map(simulation => {
    simulation = simulation.toJSON ? simulation.toJSON() : simulation;
    let chartData = configurations.rows.reduce((reduced, row) => {
      if (simulation[ row.sortid ] && simulation[ row.sortid ][ configurations.unit ]) {
        reduced[ row.label ] = simulation[ row.sortid ][ configurations.unit ];
      } else {
        reduced[ row.label ] = 0;
      }
      return reduced;
    }, {});
    return Object.assign({}, {
      xaxis: simulation.name,
    }, chartData);
  });
  navbar_data = navbar_data || {};
  navbar_data.metric = navbar_data.metric || 'test_cases_mean';
  let cardTitle = configurations.cardTitle || '';
  let output_variables = simulations.reduce((reduced, simulation) => {
    reduced.push(...simulation.compiledstrategy.output_variables, ...simulation.compiledstrategy.calculated_variables);
    return reduced;
  }, []).filter(elmt => (elmt !== null && elmt !== undefined && elmt.data_type === 'Number'));
  let input_variables = simulations.reduce((reduced, simulation) => {
    reduced.push(...simulation.compiledstrategy.input_variables);
    return reduced;
  }, []).filter(elmt => (elmt !== null && elmt !== undefined && elmt.data_type === 'Number'));
  let output_variable_map = {};
  let input_variable_map = {};
  output_variables.forEach(variable => output_variable_map[ variable.title ] = variable.display_title);
  input_variables.forEach(variable => input_variable_map[ variable.title ] = variable.display_title);
  if (navbar_data && navbar_data.output_variable) cardTitle = `Output: ${output_variable_map[ navbar_data.output_variable ]}`;
  if (navbar_data && navbar_data.input_variable) cardTitle = `Input: ${input_variable_map[ navbar_data.input_variable ]}`;
  options = Object.assign({}, options, { output_variables, input_variables, output_variable_map, input_variable_map, });
  let chartBars = generateChartBars(options);
  let summaryTable = generateSummaryTable(options);
  let outputDropdown = generateOutputDropdown(options);
  let navBar = generateNavBar(options);

  let dataPointLength = comparison_data.rows.length;
  let chartWidth = (dataPointLength > 4) ? 980 + (dataPointLength - 4) * 60 : 980;
  let minChartWidth = (dataPointLength > 4) ? 600 + (dataPointLength - 4) * 100 : 500;
  let legend = (simulation_index < 4) ? [{
    component: 'recharts.Legend',
    props: {
      width: 150,
      style: {
        display: 'none',
      },
    },
  }, ] : [];
  let csvExportButton = generateCsvExportButton({ simulations, configurations, simulation_index, });
  return [summaryTable, {
    component: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
      },
    },
    children: [
      navBar,
      {
        component: 'ResponsiveCard',
        ignoreReduxProps: true,
        props: cardprops({
          cardTitle: cardTitle,
          cardStyle: {
            maxWidth: 'calc(100% - 19rem - 10px)',
          },
        }),
        children: [outputDropdown, {
          component: 'div',
          props: {
            style: {
              overflow: 'auto',
            },
          },
          children: [{
            component: 'div',
            props: {
              style: {
                width: 'calc( 100% - 200px)',
                overflow: 'visible',
              },
            },
            children: [{
              component: 'recharts.ResponsiveContainer',
              ignoreReduxProps: true,
              props: {
                height: 500,
                minWidth: minChartWidth,
              },
              __dangerouslyInsertComponents: {
                _children: {
                  component: 'recharts.BarChart',
                  props: {
                    width: chartWidth,
                    height: 500,
                    maxBarSize: 100,
                    barCategoryGap: '10%',
                    data: simulations_result,
                  },
                  children: [
                    ...legend,
                    {
                      component: 'recharts.XAxis',
                      hasWindowComponent: true,
                      props: {
                        dataKey: 'xaxis',
                        interval: 0,
                        tick: 'func:window.__ra_custom_elements.CustomAxisTick',
                        windowCompProps: {
                          numTicks: simulations.length,
                        },
                      },
                    }, {
                      component: 'recharts.YAxis',
                      hasWindowFunc: true,
                      props: {
                        domain: ((configurations.unit === 'percentage') ? [0, 1, ] : [0, 'auto', ]),
                        tickFormatter: `func:window.chart${capitalize(configurations.unit)}Formatter`,
                      },
                    }, {
                      component: 'recharts.Tooltip',
                      hasWindowFunc: true,
                      props: {
                        formatter: `func:window.chart${capitalize(configurations.unit)}Formatter`,
                        itemSorter: 'func:window.tooltipItemSorter',
                        itemStyle: {
                          margin: 0,
                          padding: 0,
                        },
                      },
                    }, ...chartBars, ],
                },
              },
            }, ],
          }, ],
        }, {
          component: 'ResponsiveTable',
          ignoreReduxProps: true,
          props: {
            flattenRowData: true,
            useInputRows: false,
            addNewRows: false,
            hasPagination: false,
            ignoreTableHeaders: ['_id', ],
            rows: chart_table_rows,
            headers: chart_table_headers,
          },
        }, csvExportButton, ],
      }, ],
  }, ];
}


/**
 * Iterates through each testcases and creates aggregated decline reason data for each simulation document
 * @param {Object} req Express request object
 * @param {[Object]]} simulations Array of simulation documents
 * @returns {[Object]} Table rows for decline reasons
 */
function createDeclineReason(simulations, req) {
  try {
    let simulation_decline_reasons = {};
    let total_decline_reasons = [];
    if (simulations && simulations.length) {
      simulations.forEach(simulation => {
        simulation_decline_reasons[ simulation.name ] = simulation.results.reduce((reduced, testcase) => {
          if (Array.isArray(testcase.decline_reasons) && testcase.decline_reasons.length) {
            testcase.decline_reasons.forEach(reason => {
              reason = reason.toString();
              if (!reduced[ reason ]) {
                reduced[ reason ] = {
                  count: 0,
                  percentage: 0,
                };
              }
              reduced.total_count++;
              reduced[ reason ].count++;
              total_decline_reasons.push(reason);
            });
            return reduced;
          } else {
            return reduced;
          }
        }, { total_count: 0, });
        Object.keys(simulation_decline_reasons[ simulation.name ]).forEach(reason_code => {
          if (reason_code !== 'total_count') {
            simulation_decline_reasons[ simulation.name ][ reason_code ].percentage = simulation_decline_reasons[ simulation.name ][ reason_code ].count / simulation_decline_reasons[ simulation.name ].total_count;
          }
        });
      });
      total_decline_reasons = total_decline_reasons.filter((v, i, a) => a.indexOf(v) === i);
      let rows = total_decline_reasons.map((reason, idx) => {
        return {
          label: reason,
          sortid: `test_cases_decline_reasons.${idx}`,
        };
      });
      req.controllerData = req.controllerData || {};
      req.controllerData.formdata = req.controllerData.formdata || {};
      req.controllerData.formdata.comparison_data = req.controllerData.formdata.comparison_data || {};
      req.controllerData.formdata.comparison_data.rows = simulations.map((simulation, idx) => {
        let decline_frequency_map = simulation_decline_reasons[ simulation.name ];
        let reason_data = total_decline_reasons.reduce((reduced, reason, idx) => {
          reduced[ `test_cases_decline_reasons.${idx}` ] = decline_frequency_map[ reason ] || { count: 0, percentage: 0, };
          return reduced;
        }, {});
        return Object.assign({}, simulation, req.controllerData.formdata.comparison_data.rows[ idx ], reason_data);
      });
      return rows;
    } else {
      return [];
    }
  } catch (e) {
    return [];
  }
}

/**
 * Creates configurations for Simulation reporting charts and tables
 * @param {Object} req Express request object
 * @param {Object} navData Index and output variable of the navigation button that has been clicked
 * @param {[Object]]} simulations Array of simulation documents
 * @returns {Object} Configuration object used to build tables and charts
 */
function createConfigurations(navData, simulations, req) {
  let { idx, output_variable, input_variable, } = navData;
  let colors = ['#3270d2', '#c97a55', '#9c69bd', '#ca5678', '#c1ca4c', '#56cb89', '#e7b544', '#56bbca', '#5f7b48', '#9e9e9e', '#b5b4df', '#c2e6ff', '#f8bbcb', '#b7e0e3', ' #f5fada', '#f4c7f5', '#520720', '#a56376', '#e4c5c3', '#fcead7', '#c4dbe2', '#0e0915', '#192240', '#545a8c', '#d386a7', '#fae28d', '#006a91', '#bededb', '#f1da76', ];
  const default_configurations = [{
    cardTitle: 'Summary: Overall Pass Counts',
    rows: [{ label: 'Passed', sortid: 'test_cases_passed', }, { label: 'Failed', sortid: 'test_cases_failed', }, { label: 'Error', sortid: 'test_cases_errored', }, ].map((row, index) => Object.assign({}, row, { colors: colors[ index ], })),
    unit: 'count',
    stacked: 'a',
  }, {
    cardTitle: 'Summary: Overall Pass Rates',
    rows: [{ label: 'Passed', sortid: 'test_cases_passed', }, { label: 'Failed', sortid: 'test_cases_failed', }, { label: 'Error', sortid: 'test_cases_errored', }, ].map((row, index) => Object.assign({}, row, { colors: colors[ index ], })),
    unit: 'percentage',
    stacked: 'a',
  },
  {
    cardTitle: 'Summary: Decline Reason Counts',
    rows: createDeclineReason(simulations, req).map((row, index) => Object.assign({}, row, { colors: colors[ index ], })),
    unit: 'count',
    stacked: false,
  }, {
    cardTitle: 'Summary: Decline Reason Rates',
    rows: createDeclineReason(simulations, req).map((row, index) => Object.assign({}, row, { colors: colors[ index ], })),
    unit: 'percentage',
    stacked: false,
  },
  ];
  if (idx < 4) {
    return default_configurations[ idx ];
  } else if (output_variable) {
    return {
      cardTitle: `Output: ${output_variable}`,
      rows: [{ label: 'Mean', sortid: 'test_cases_mean', }, { label: 'Median', sortid: 'test_cases_median', }, { label: 'Mode', sortid: 'test_cases_mode', }, { label: 'Minimum', sortid: 'test_cases_minimum', }, { label: 'Maximum', sortid: 'test_cases_maximum', }, { label: 'Count', sortid: 'test_cases_count', }, ].map((row, index) => Object.assign({}, row, { colors: colors[ index ], })),
      unit: 'count',
      output_variable,
      stacked: false,
    };
  } else {
    return {
      cardTitle: `Input: ${input_variable}`,
      rows: [{ label: 'Mean', sortid: 'test_cases_mean', }, { label: 'Median', sortid: 'test_cases_median', }, { label: 'Mode', sortid: 'test_cases_mode', }, { label: 'Minimum', sortid: 'test_cases_minimum', }, { label: 'Maximum', sortid: 'test_cases_maximum', }, { label: 'Count', sortid: 'test_cases_count', }, ].map((row, index) => Object.assign({}, row, { colors: colors[ index ], })),
      unit: 'count',
      input_variable,
      stacked: false,
    };
  }
}

function formatTestCaseBatchUpload(req) {
  return new Promise((resolve, reject) => {
    try {
      let body = {};
      let csv_data = [];
      var busboy = new Busboy({ headers: req.headers, });
      const file_size_limit = CONTAINER_SETTING.simulation.upload_filesize_limit || 2097152;
      const max_num_rows = 10005;
      let hasField = false;
      busboy.on('field', function (fieldname, val) {
        if (val !== 'undefined') {
          body[ fieldname ] = val;
        }
      });
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
          body.filename = filename.replace(`.${fileType}`, '');
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
                if (fileSize > file_size_limit) {
                  return reject({ message: `File must be less than ${file_size_limit / 1048576}MB.`, });
                }
                var buffer = Buffer.concat(file_data);
                var workbook = XLSX.read(buffer, { type: 'buffer', });
                let sheet_name = workbook.SheetNames[ 0 ];
                let convertedCSVData = XLSX.utils.sheet_to_csv(workbook.Sheets[ sheet_name ]);
                let converted_csv_rows = [];
                csv.fromString(convertedCSVData)
                  .on('data', function (chunk) {
                    if (converted_csv_rows.length < max_num_rows && !transformhelpers.objectOrArrayPropertiesAreEmpty(chunk)) {
                      converted_csv_rows.push(chunk);
                    }
                  })
                  .on('end', function () {
                    let headers = converted_csv_rows.shift();
                    let variable;
                    let csv_data = converted_csv_rows.reduce((aggregate, row, i) => {
                      let row_object = {};
                      headers.forEach((key, j) => {
                        variable = req.controllerData.variableTitleMap[ key ];
                        row_object[ key ] = row[ j ];
                      });
                      aggregate.push(row_object);
                      return aggregate;
                    }, []);
                    body[ 'testcase_file' ] = csv_data;
                    if (hasField) {
                      resolve(unflatten(body));
                    }
                  });
              });
          } else {
            let fileSize = 0;
            file.on('data', data => {
              fileSize += data.length;
            });
            file.on('end', () => {
              if (fileSize > file_size_limit) {
                return reject({ message: `File must be less than ${file_size_limit / 1048576}MB.`, });
              }
            });
            csv.fromStream(file, { headers: true, })
              .on('data', function (chunk) {
                if (csv_data.length < max_num_rows && !transformhelpers.objectOrArrayPropertiesAreEmpty(chunk)) {
                  csv_data.push(chunk);
                }
              })
              .on('error', function (e) {
                return reject({ message: `Invalid csv format: ${e.message}`, });
              })
              .on('end', function () {
                body[ 'testcase_file' ] = csv_data;
                if (hasField) {
                  resolve(unflatten(body));
                }
              });
          }
        }
      });
      busboy.on('finish', function () {
        hasField = true;
        if (hasField && body[ 'testcase_file' ]) {
          resolve(unflatten(body));
        }
      });
      req.pipe(busboy);
    } catch (err) {
      return reject(err);
    }
  });
}

module.exports = {
  createSimulationLayout,
  createConfigurations,
  formatTestCaseBatchUpload,
};