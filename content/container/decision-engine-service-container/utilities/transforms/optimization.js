'use strict';
const periodic = require('periodicjs');
const capitalize = require('capitalize');
const numeral = require('numeral');
const view_utilities = require('../views');
const CONSTANTS = require('../constants');
const ml = require('ml');
const util = require('util');
const styles = view_utilities.constants.styles;
const shared = view_utilities.shared;
const cardprops = shared.props.cardprops;
const { analysisCharts, analysisTable, analysisFilter, } = view_utilities.optimization.components;
const transformhelpers = require('../transformhelpers');

function __generateStatusTag(status) {
  let statusColor;
  switch (status) {
    case 'Excellent':
      statusColor = styles.colors.green;
      break;
    case 'Good':
      statusColor = styles.colors.highlight;
      break;
    case 'Okay':
      statusColor = styles.colors.yellow;
      break;
    case 'Poor':
      statusColor = styles.colors.danger;
      break;
  }
  return {
    component: 'Tag',
    props: {
      style: {
        backgroundColor: statusColor,
        maxWidth: '100px',
        width: '100%',
        fontWeight: 'bold',
        borderRadius: '5px',
        color: 'white',
      }
    },
    children: status,
  };
}

function __generateCategoricalScore(data, row_type) {
  let result;
  switch (row_type) {
    case 'variables':
      if (data >= 13) result = __generateStatusTag('Excellent');
      else if (data >= 6) result = __generateStatusTag('Good');
      else if (data >= 4) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'observations':
      if (data > 10000) result = __generateStatusTag('Excellent');
      else if (data > 2000) result = __generateStatusTag('Good');
      else if (data > 500) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'power':
      if (data >= 0.8) result = __generateStatusTag('Excellent');
      else if (data >= 0.7) result = __generateStatusTag('Good');
      else if (data >= 0.6) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'accuracy':
      if (data >= 85) result = __generateStatusTag('Excellent');
      else if (data >= 65) result = __generateStatusTag('Good');
      else if (data >= 50) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'resilience':
      if (data <= 10) result = __generateStatusTag('Excellent');
      else if (data <= 25) result = __generateStatusTag('Good');
      else if (data <= 40) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
  }
  return result;
}

function __generateLinearScore(data, row_type) {
  let result;
  switch (row_type) {
    case 'variables':
      if (data >= 13) result = __generateStatusTag('Excellent');
      else if (data >= 6) result = __generateStatusTag('Good');
      else if (data >= 4) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'observations':
      if (data > 10000) result = __generateStatusTag('Excellent');
      else if (data > 1000) result = __generateStatusTag('Good');
      else if (data > 200) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'power':
      if (data >= 0.7) result = __generateStatusTag('Excellent');
      else if (data >= 0.4) result = __generateStatusTag('Good');
      else if (data >= 0.2) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'resilience':
      if (data <= 10) result = __generateStatusTag('Excellent');
      else if (data <= 25) result = __generateStatusTag('Good');
      else if (data <= 40) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
  }
  return result;
}
function __generateBinaryScore(data, row_type) {
  let result;
  switch (row_type) {
    case 'variables':
      if (data >= 13) result = __generateStatusTag('Excellent');
      else if (data >= 6) result = __generateStatusTag('Good');
      else if (data >= 4) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'observations':
      if (data.numOnes >= 1500 && data.numZeros >= 1500) result = __generateStatusTag('Excellent');
      else if (data.numOnes >= 1500 || data.numZeros >= 1500) result = __generateStatusTag('Good');
      else if (data.numOnes >= 500 || data.numZeros >= 500) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'power':
      if (data >= 0.8) result = __generateStatusTag('Excellent');
      else if (data >= 0.7) result = __generateStatusTag('Good');
      else if (data >= 0.6) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'accuracy':
      if (data >= 100) result = __generateStatusTag('Excellent');
      else if (data >= 80) result = __generateStatusTag('Good');
      else if (data >= 70) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
    case 'resilience':
      if (data <= 10) result = __generateStatusTag('Excellent');
      else if (data <= 25) result = __generateStatusTag('Good');
      else if (data <= 40) result = __generateStatusTag('Okay');
      else result = __generateStatusTag('Poor');
      break;
  }
  return result;
}

function __generateDescriptionLink(description, location) {
  return {
    component: 'div',
    props: {
      style: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }
    },
    children: [ {
      component: 'span',
      children: description + '  ',
    },
      // {
      // component: 'a',
      // children: 'Learn More',
      // props: {
      //   // href: '#'
      //   style: {
      //     textDecoration: 'underline',
      //   }
      // }
      // }
    ]
  }
}

function generateModelScorecardTableRows({ modeldata = {}, }) {
  let { display_name, display_type, datasource, predictor_variable_count, area_under_curve, createdat, creator, description, performance_metrics, type, r_squared, batch_testing_id, batch_training_id, } = modeldata;
  let rows = [];
  let numVars;
  if (datasource) {
    numVars = (datasource.predictor_variable_count) ? datasource.predictor_variable_count : Object.keys(JSON.parse(datasource.strategy_data_schema)).length - 1;
  } else {
    numVars = (predictor_variable_count) ? predictor_variable_count : 0;
  }

  if (type === 'binary') {
    let numObservations = (typeof batch_training_id.results.total_count === 'number' && typeof batch_testing_id.results.total_count === 'number') ? batch_training_id.results.total_count + batch_testing_id.results.total_count : null;
    let numOnes = (typeof batch_training_id.results.actual_1_count === 'number' && typeof batch_testing_id.results.actual_1_count === 'number') ? batch_training_id.results.actual_1_count + batch_testing_id.results.actual_1_count : null;
    let numZeros = (typeof batch_training_id.results.actual_0_count === 'number' && typeof batch_testing_id.results.actual_0_count === 'number') ? batch_training_id.results.actual_0_count + batch_testing_id.results.actual_0_count : null;
    let maxAccuracy = 100 * Math.max(...batch_training_id.results.accuracy_distribution.map(el => el.accuracy_rate));
    let ks_training_max_score = Math.max(...batch_training_id.results.ks_scores);
    let ks_test_max_score = Math.max(...batch_testing_id.results.ks_scores);
    let resilienceDiff = (100 * Math.abs(ks_training_max_score - ks_test_max_score)).toFixed(2);
    let dataVariablesRow = { category: 'Data - Variables', result: `${numVars} Variables`, score: __generateBinaryScore(numVars, 'variables'), description: __generateDescriptionLink('Based on the number of predictor variables provided.', ''), };
    let dataObservationsRow = { category: 'Data - Observations', result: `${numObservations} Observations (${numOnes} true, ${numZeros} false)`, score: __generateBinaryScore({ numOnes, numZeros }, 'observations'), description: __generateDescriptionLink('Analyzes the number and diversity of observations provided.', ''), };
    let modelPowerRow = { category: 'Model - Power', result: `AUC = ${Number(performance_metrics[ 'BinaryAUC' ]).toFixed(2)}`, score: __generateBinaryScore(Number(performance_metrics[ 'BinaryAUC' ]).toFixed(2), 'power'), description: __generateDescriptionLink('Evaluates the actual predictive power of your model.', ''), };
    let modelAccuracyRow = { category: 'Model - Accuracy', result: `${maxAccuracy}% Maximum Accuracy`, score: __generateBinaryScore(maxAccuracy, 'accuracy'), description: __generateDescriptionLink('Based on the accuracy rate of your model’s predictions.', '') };
    let modelResilienceRow = { category: 'Model - Resilience', result: `${resilienceDiff}% Difference (testing vs training)`, score: __generateBinaryScore(resilienceDiff, 'resilience'), description: __generateDescriptionLink('Compares in-sample and out-of-sample performance.', '') };

    rows.push(dataVariablesRow, dataObservationsRow, modelPowerRow, modelAccuracyRow, modelResilienceRow);

  } else if (type === 'regression') {
    let numObservations = (typeof batch_training_id.results.count === 'number' && typeof batch_testing_id.results.count === 'number') ? batch_training_id.results.count + batch_testing_id.results.count : null;
    let resilienceDiff = (typeof batch_training_id.results.r_squared === 'number' && typeof batch_testing_id.results.r_squared === 'number') ? Math.abs((100 * (batch_training_id.results.r_squared - batch_testing_id.results.r_squared)).toFixed(2)) : 'N/A';
    let dataVariablesRow = { category: 'Data - Variables', result: `${numVars} Variables`, score: __generateLinearScore(numVars, 'variables'), description: __generateDescriptionLink('Based on the number of predictor variables provided.', '') };
    let dataObservationsRow = { category: 'Data - Observations', result: `${numObservations} Observations`, score: __generateLinearScore(numObservations, 'observations'), description: __generateDescriptionLink('Analyzes the number and diversity of observations provided.', '') };
    let modelPowerRow = { category: 'Model - Power', result: `R² = ${(batch_testing_id.results.r_squared) ? batch_testing_id.results.r_squared.toFixed(2) : 'N/A'}`, score: __generateLinearScore(batch_testing_id.results.r_squared, 'power'), description: __generateDescriptionLink('Evaluates the actual predictive power of your model.', '') };
    let modelResilienceRow = { category: 'Model - Resilience', result: (typeof resilienceDiff === 'number') ? `${resilienceDiff}% Difference (testing vs training)` : 'N/A', score: __generateLinearScore(resilienceDiff, 'resilience'), description: __generateDescriptionLink('Compares in-sample and out-of-sample performance.', '') };

    rows.push(dataVariablesRow, dataObservationsRow, modelPowerRow, modelResilienceRow);

  } else if (type === 'categorical') {
    let numObservations = (batch_training_id.results.observation_counts && typeof batch_testing_id.results.observation_counts) ? Object.values(batch_training_id.results.observation_counts).reduce((sum, el) => sum + el, 0) + Object.values(batch_testing_id.results.observation_counts).reduce((sum, el) => sum + el, 0) : null;
    let numCats = batch_training_id.results.categories.length;
    let trainingAccuracyAverage = (batch_training_id.results.categories) ? 100 * Number((batch_training_id.results.categories.reduce((sum, category, i) => sum + batch_training_id.results.accuracy_rates[ category ][ i ], 0) / numCats).toFixed(2)) : 'N/A';
    let testingAccuracyAverage = (batch_testing_id.results.categories) ? 100 * Number((batch_testing_id.results.categories.reduce((sum, category, i) => sum + batch_testing_id.results.accuracy_rates[ category ][ i ], 0) / numCats).toFixed(2)) : 'N/A';
    let resilienceDiff = (typeof trainingAccuracyAverage === 'number' && typeof testingAccuracyAverage === 'number') ? Math.abs(trainingAccuracyAverage - testingAccuracyAverage) : 'N/A';
    let dataVariablesRow = { category: 'Data - Variables', result: `${numVars} Variables`, score: __generateCategoricalScore(numVars, 'variables'), description: __generateDescriptionLink('Based on the number of predictor variables provided.', '') };
    let dataObservationsRow = { category: 'Data - Observations', result: `${numObservations} Observations`, score: __generateCategoricalScore(numObservations, 'observations'), description: __generateDescriptionLink('Analyzes the number and diversity of observations provided.', '') };
    let modelPowerRow = { category: 'Model - Power', result: `Macro-Average F1 = ${Number(performance_metrics[ 'MulticlassAvgFScore' ]).toFixed(2)}`, score: __generateCategoricalScore(Number(performance_metrics[ 'MulticlassAvgFScore' ]).toFixed(2), 'power'), description: __generateDescriptionLink('Evaluates the actual predictive power of your model.', '') };
    let modelAccuracyRow = { category: 'Model - Accuracy', result: `${trainingAccuracyAverage}% Maximum Accuracy`, score: __generateCategoricalScore(trainingAccuracyAverage, 'accuracy'), description: __generateDescriptionLink('Based on the accuracy rate of your model’s predictions.', '') };
    let modelResilienceRow = { category: 'Model - Resilience', result: (typeof resilienceDiff === 'number') ? `${resilienceDiff}% Difference (testing vs training)` : 'N/A', score: __generateCategoricalScore(resilienceDiff, 'resilience'), description: __generateDescriptionLink('Compares in-sample and out-of-sample performance.', '') };

    rows.push(dataVariablesRow, dataObservationsRow, modelPowerRow, modelAccuracyRow, modelResilienceRow);

  }
  return rows;
}

function generateModelScorecardTableHeaders() {
  return [
    {
      label: 'Category',
      sortid: 'category',
      sortable: false,
      headerColumnProps: {
        style: {
          width: '15%',
        },
      },
    }, {
      label: 'Result',
      sortid: 'result',
      sortable: false,
      headerColumnProps: {
        style: {
          width: '25%',
        },
      },
    }, {
      label: 'Score',
      sortid: 'score',
      sortable: false,
      headerColumnProps: {
        style: {
          width: '15%',
        },
      },
    }, {
      label: 'Description',
      sortid: 'description',
      sortable: false,
      headerColumnProps: {
        style: {
          width: '45%',
        },
      },
    }, ];
}

function generationSummaryTableHeaders(type) {
  let headers = [];
  const modelSummaryLabelMap = {
    'binary': 'K-S Score',
    'regression': 'R²',
    'categorical': 'Macro-Average F1 Score',
  };
  switch (type) {
    case 'binary':
      headers = [
        {
          label: 'Model Type',
          sortid: 'display_type',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '20%',
            },
          },
        }, {
          label: 'Data Source',
          sortid: 'data_source',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '20%',
            },
          },
        }, {
          label: 'Created',
          sortid: 'createdat',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '20%',
            },
          },
        }, {
          label: modelSummaryLabelMap[ type ],
          sortid: 'ks_test_max_score',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '10%',
            },
          },
        }, {
          label: 'ROC AUC',
          sortid: 'performance_metrics',
          columnProps: {
            className: '',
          },
          sortable: false,
        }, ];
      break;
    case 'categorical':
      headers = [
        {
          label: 'Model Type',
          sortid: 'display_type',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '20%',
            },
          },
        }, {
          label: 'Data Source',
          sortid: 'data_source',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '20%',
            },
          },
        }, {
          label: 'Created',
          sortid: 'createdat',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '20%',
            },
          },
        }, {
          label: modelSummaryLabelMap[ type ],
          sortid: 'performance_metrics',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '10%',
            },
          },
        }, ];
      break;
    case 'regression':
      headers = [
        {
          label: 'Model Type',
          sortid: 'display_type',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '20%',
            },
          },
        }, {
          label: 'Data Source',
          sortid: 'data_source',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '20%',
            },
          },
        }, {
          label: 'Created',
          sortid: 'createdat',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '20%',
            },
          },
        }, {
          label: modelSummaryLabelMap[ type ],
          sortid: 'r_squared',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '10%',
            },
          },
        }, {
          label: 'Confidence Intervals',
          sortid: 'listed_intervals',
          columnProps: {
            className: 'ai_confidence_interval',
          },
          sortable: false,
        }, ];
      break;
    default:
      break;
  }
  return headers;
}

function generateSummaryTable({ modeldata = {}, }) {
  let { display_name, display_type, data_source, area_under_curve, createdat, creator, description, performance_metrics, type, r_squared, batch_training_id, } = modeldata;
  const modelMetricsMap = {
    'binary': 'BinaryAUC',
    'regression': 'RegressionRMSE',
    'categorical': 'MulticlassAvgFScore',
  };
  let seventy_five_RMSE, ninety_five_RMSE, ninety_nine_RMSE, listed_intervals, ks_test_max_score;
  if (type === 'binary') {
    let ks_scores = (batch_training_id.results && batch_training_id.results.ks_scores && batch_training_id.results.ks_scores.length) ? batch_training_id.results.ks_scores : [];
    ks_test_max_score = Math.max(...ks_scores);
  }
  if (type === 'regression') {
    seventy_five_RMSE = Math.floor(Number(performance_metrics[ 'RegressionRMSE' ]) * 1.15035);
    ninety_five_RMSE = Math.floor(Number(performance_metrics[ 'RegressionRMSE' ]) * 1.95996);
    ninety_nine_RMSE = Math.floor(Number(performance_metrics[ 'RegressionRMSE' ]) * 2.57583);
    listed_intervals = `75% probability that a prediction will be within ${seventy_five_RMSE} units of actual\r\n95% probability that a prediction will be within ${ninety_five_RMSE} units of actual\r\n99% probability that a prediction will be within ${ninety_nine_RMSE} units of actual`;
  }

  let formattedCreatedAt = (createdat && creator) ? `${transformhelpers.formatDateNoTime(createdat)} by ${creator}` : '';
  performance_metrics = modelMetricsMap[ type ] ? performance_metrics[ modelMetricsMap[ type ] ] : '';
  performance_metrics = Number(performance_metrics).toFixed(2);
  return {
    component: 'ResponsiveCard',
    bindprops: true,
    ignoreReduxProps: true,
    props: cardprops({
      cardTitle: 'Model Summary',
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
          ignoreTableHeaders: [ '_id', ],
          rows: [ {
            display_name,
            display_type,
            data_source,
            area_under_curve,
            createdat: formattedCreatedAt,
            creator,
            description,
            performance_metrics,
            r_squared,
            listed_intervals,
            ks_test_max_score,
          }, ],
          headers: generationSummaryTableHeaders(type),
        },
      }, ],
  };
}

function generateModelScorecardTable({ modeldata = {}, }) {
  let rows = generateModelScorecardTableRows({ modeldata, });
  return {
    component: 'ResponsiveCard',
    bindprops: true,
    ignoreReduxProps: true,
    props: cardprops({
      cardTitle: 'Model Scorecard',
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
          ignoreTableHeaders: [ '_id', ],
          rows,
          headers: generateModelScorecardTableHeaders(),
        },
      }, ],
  };
}

function _generateNavButton(configuration, index) {
  return {
    navButton: {
      component: 'ResponsiveButton',
      children: configuration.subsection_title,
      props: {
        onClick: 'func:window.optimizationNavOnClick',
        onclickProps: {
          optimization_index: index,
        },
      },
    },
  };
}

function generateNavBar({ configurations, type, }) {
  let navbuttons = configurations.map(_generateNavButton);
  let navData = { binary: [ navbuttons.slice(0, 2), navbuttons.slice(2, 5), navbuttons.slice(5, 12), ], regression: [ navbuttons.slice(0, 2), navbuttons.slice(2, 4), navbuttons.slice(4, 6), ], categorical: [ navbuttons.slice(0, 2), navbuttons.slice(2, 5), ], };
  let navSections = {
    binary: [ {
      title: 'OBSERVATIONS',
    }, {
      title: 'PREDICTIONS',
    }, {
      title: 'MODEL POWER',
    },
    ],
    regression: [ {
      title: 'OBSERVATIONS',
    }, {
      title: 'PREDICTIONS',
    }, {
      title: 'MODEL POWER',
    }, ],
    categorical: [ {
      title: 'OBSERVATIONS',
    }, {
      title: 'PREDICTIONS',
    }, ],
  };
  return {
    component: 'ResponsiveNavBar',
    props: {
      allActive: true,
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
      navData: navData[ type ],
      navSections: navSections[ type ],
    },
  };
}

function generateFilterDropdowns({ configuration, data, modeldata, formdata, params, }) {
  if (Array.isArray(configuration.filters)) {
    return configuration.filters.map(filter => analysisFilter[ filter ]({ configuration, data, modeldata, formdata, params, }));
  } else {
    return [];
  }
}

function generateCharts({ configuration, data, modeldata, formdata, params, }) {
  // let table = generateTables({ configuration, data, modeldata, formdata, });
  // let csv_export_button = generateCsvExportButton({ configuration, model_id: modeldata._id, formdata, });
  let filter_dropdowns = generateFilterDropdowns({ configuration, data, modeldata, formdata, params, });
  return {
    component: 'ResponsiveCard',
    ignoreReduxProps: true,
    props: cardprops({
      cardTitle: configuration.cardTitle,
      cardStyle: {
        maxWidth: 'calc(100% - 19rem - 10px)',
      },
    }),
    children: [ ...filter_dropdowns, {
      component: 'div',
      props: {
        style: {
          overflow: 'auto',
        },
      },
      children: [ {
        component: 'div',
        props: {
          style: {
            width: 'calc( 100% - 200px)',
            overflow: 'visible',
          },
        },
        children: [ {
          component: 'recharts.ResponsiveContainer',
          ignoreReduxProps: true,
          props: {
            height: 500,
            minWidth: 500,
          },
          __dangerouslyInsertComponents: {
            _children: analysisCharts[ configuration.chartFunc ]({ configuration, data, modeldata, formdata, }),
          },
        },
          // table,
          // csv_export_button, 
          ],
      }, ],
    },
    ],
  };
}

function generateTables({ configuration, data, modeldata, formdata, }) {
  if (configuration.tableFunc) {
    let { rows, headers, } = analysisTable[ configuration.tableFunc ]({ configuration, data, modeldata, formdata, });
    return {
      component: 'ResponsiveTable',
      ignoreReduxProps: true,
      props: {
        numOfLimits: 100,
        limit: 100,
        flattenRowData: true,
        useInputRows: false,
        addNewRows: false,
        hasPagination: false,
        ignoreTableHeaders: [ '_id', ],
        rows,
        headers,
      },
    };
  } else {
    return;
  }
}

/**
 * Creates a button to export the result of Simulation Reporting
 * 
 * @param {Object} configurations  Configuration for the Simulation Reporting Page
 * @param {Number} simulation_index The current simulation page
 * @param {[Object]} simulations Array of simulation documents
 * @returns {Object} CSV Export button for Simulation Reporting
 */
function generateCsvExportButton({ configuration, model_id = '', formdata, }) {
  formdata = JSON.stringify(formdata);
  return {
    component: 'div',
    props: {
      style: {
        textAlign: 'right',
      },
    },
    children: [ {
      component: 'ResponsiveButton',
      props: {
        aProps: {
          className: '__re-bulma_button __icon_button icon-save-content',
          style: {
            color: '#404041',
            position: 'absolute',
            top: '10px',
            right: '10px',
          },
        },
        onclickBaseUrl: `/optimization/api/download_analysisdata?format=json&export_format=csv&model_id=${model_id.toString()}&configuration_index=${configuration.index}&formdata=${formdata}`,
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

function downloadButtonDropdown({ modeldata = {}, }) {
  let { batch_training_id, batch_testing_id, } = modeldata;
  return [ {
    component: 'Semantic.Dropdown',
    props: {
      onSubmit: null,
      className: '__re-bulma_button __re-bulma_is-success',
      text: 'DOWNLOAD',
    },
    children: [ {
      component: 'Semantic.DropdownMenu',
      props: {
        onSubmit: null,
      },
      children: [ {
        component: 'Semantic.Item',
        props: {
          onSubmit: null,
        },
        children: [ {
          component: 'ResponsiveButton',
          children: 'Batch Training',
          bindprops: true,
          props: {
            'onclickBaseUrl': `/optimization/api/download_batchdata/${batch_training_id._id.toString()}?export_format=csv`,
            aProps: {
              className: '__re-bulma_button __re-bulma_is-primary',
              style: {
                marginRight: '15px',
              },
            },
          },
        }, ],
      }, {
        component: 'Semantic.Item',
        props: {
          onSubmit: null,
        },
        children: [ {
          component: 'ResponsiveButton',
          children: 'Batch Testing',
          bindprops: true,
          props: {
            'onclickBaseUrl': `/optimization/api/download_batchdata/${batch_testing_id._id.toString()}?export_format=csv`,
            aProps: {
              className: '__re-bulma_button __re-bulma_is-primary',
              style: {
                marginRight: '15px',
              },
            },
          },
        }, ],
      },
      ],
    }, ],
  }, ];
}

function createOptimizationLayout(options) {
  let { idx, data, modeldata, formdata, params, } = options;
  let configurations = CONSTANTS.OPTIMIZATION[ modeldata.type ];
  let current_config = configurations[ idx ];
  // let summarytable = generateSummaryTable({ modeldata, });
  // let scorecardtable = generateModelScorecardTable({ modeldata, });
  let navbar = generateNavBar({ configurations, type: modeldata.type, });
  let charts = generateCharts({ configuration: current_config, data, modeldata, formdata, params, });
  return [
    // summarytable, 
    // scorecardtable, 
    {
      component: 'div',
      props: {
        style: {
          display: 'flex',
          alignItems: 'flex-start',
        },
      },
      children: [ navbar, charts,],
    }, ];
}

function __invalid_function(result) {
  let { r, r2, chi2, rmsd, } = result;
  return isNaN(r) && isNaN(r2);
}

function generate_eval_sign_value(value) {
  return (value < 0) ? `- ${Math.abs(value)}` : `+ ${Math.abs(value)}`;
}

function generate_eval_sign(value) {
  return (value < 0) ? '-' : '+';
}

function generate_linear_function_evaluator(x, y) {
  try {
    let regression = new ml.SimpleLinearRegression(x, y);
    let evaluator = `return (${regression.slope} * x) ${generate_eval_sign_value(regression.intercept)}`;
    let score = regression.score(x, y);
    if (__invalid_function(score)) return null;
    return {
      evaluator,
      display_func: regression.toString(3),
      score,
      type: 'linear',
    };
  } catch (e) {
    return null;
  }
}

function generate_polynomial_function_evaluator(x, y, degree) {
  try {
    let regression = new ml.PolynomialRegression(x, y, degree);
    let regression_coeff_copy = regression.coefficients.slice();
    let score = regression.score(x, y);
    let string_evaluator = regression_coeff_copy.reverse().reduce((evaluator, coefficient, i) => {
      if (i === 0) evaluator += `${coefficient} * (x ** ${regression.degree - i})`;
      else evaluator += ` ${generate_eval_sign(coefficient)} ${Math.abs(coefficient)} * (x ** ${regression.degree - i})`;
      return evaluator;
    }, 'return ');
    if (__invalid_function(score)) return null;
    return {
      evaluator: string_evaluator,
      display_func: regression.toString(3),
      score,
      type: 'polynomial',
      degree,
    };
  } catch (e) {
    return null
  }
}

function generate_power_function_evaluator(x, y, degree) {
  try {
    let regression = new ml.PowerRegression(x, y, degree);
    let evaluator = `return ${regression.A} * (x ** ${regression.B})`;
    let score = regression.score(x, y);
    if (__invalid_function(score)) return null;
    return {
      evaluator,
      display_func: regression.toString(3),
      score,
      type: 'power',
    };
  } catch (e) {
    return null;
  }
}

function generate_exponential_function_evaluator(x, y) {
  try {
    let regression = new ml.ExponentialRegression(x, y);
    let evaluator = `return ${regression.B} * (${Math.E} ** (${regression.A} * x))`;
    let score = regression.score(x, y);
    if (__invalid_function(score)) return null;
    return {
      evaluator,
      display_func: regression.toString(3),
      score,
      type: 'exponential',
    };
  } catch (e) {
    return null;
  }
}

function calculate_r(x, y) {
  if (x.length === y.length) {
    let n = x.length;
    let x_total = 0;
    let x_sq_total = 0;
    let y_total = 0;
    let y_sq_total = 0;
    let xy_total = 0;
    x.forEach((el, i) => {
      x_total += el;
      x_sq_total += el ** 2;
      y_total += y[ i ];
      y_sq_total += y[ i ] ** 2;
      xy_total += el * y[ i ];
    });
    return ((n * xy_total) - (x_total * y_total)) / Math.sqrt(((n * x_sq_total) - (x_total ** 2)) * ((n * y_sq_total) - (y_total ** 2)));
  } else return null;
}

module.exports = {
  createOptimizationLayout,
  downloadButtonDropdown,
  generate_linear_function_evaluator,
  generate_polynomial_function_evaluator,
  generate_power_function_evaluator,
  generate_exponential_function_evaluator,
  calculate_r,
};