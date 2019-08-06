'use strict';
const periodic = require('periodicjs');
const capitalize = require('capitalize');
const mathjs = require('mathjs');
const Promisie = require('promisie');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const utilities = require('../utilities');
const CONSTANTS = utilities.constants;
const transformhelpers = require('../utilities/transformhelpers');
const mlhelpers = require('../utilities/transforms/ml');
const _includeColumn = mlhelpers._includeColumn;
const mlresource = require('../utilities/mlresource');
const randomKey = Math.random;
const shared = utilities.views.shared;
const moment = require('moment');
const cardprops = shared.props.cardprops;
const mlConstants = CONSTANTS.ML;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const unflatten = require('flat').unflatten;
const references = utilities.views.constants.references;
const styles = utilities.views.constants.styles;
const formElements = shared.props.formElements.formElements;
const PROVIDER_LABEL = require('../utilities/constants/ml').PROVIDER_LABEL;
const PROVIDER_VALUE = require('../utilities/constants/ml').PROVIDER_VALUE;
const MODEL_TYPE_MAP = require('../utilities/constants/ml').MODEL_TYPE_MAP;
const MODEL_DESCRIPTION = require('../utilities/constants/ml').MODEL_DESCRIPTION;
const PROVIDER_ICON = require('../utilities/constants/ml').PROVIDER_ICON;
const converter = require('json-2-csv');
const Bluebird = require('bluebird');
const jsonToXML = require('convertjson2xml').singleton;
const { mlTabs, mlSubTabs, } = utilities.views.ml.components;
const detailAsyncTitleAndSubtitle = shared.component.layoutComponents.detailAsyncTitleAndSubtitle;

async function generatePredictorVariableStatistics(req) {
  try {
    if (req.error) return req;
    let statistics = {};
    let transformations = {};
    if (req.controllerData && req.controllerData.MLDatasource && req.controllerData.MLDatasource.strategy_data_schema && req.controllerData.training_data_transposed && req.controllerData.testing_data_transposed) {
      let MLDatasource = req.controllerData.MLDatasource;
      let strategy_data_schema = MLDatasource.strategy_data_schema;
      let training_data_transposed = req.controllerData.training_data_transposed;
      let testing_data_transposed = req.controllerData.testing_data_transposed;
      let csv_headers_copy = MLDatasource.headers.slice();
      let historical_result_index = csv_headers_copy.indexOf('historical_result');
      let training_historical_result;
      let testing_historical_result;
      if (req.controllerData.mlmodel.type === 'categorical') {
        training_historical_result = training_data_transposed.splice(historical_result_index, 1)[ 0 ];
        testing_historical_result = testing_data_transposed.splice(historical_result_index, 1)[ 0 ];
      } else {
        if (strategy_data_schema[ 'historical_result' ].data_type === 'Number') {
          training_historical_result = training_data_transposed.splice(historical_result_index, 1)[ 0 ].map(Number);
          testing_historical_result = testing_data_transposed.splice(historical_result_index, 1)[ 0 ].map(Number);
        } else if (strategy_data_schema[ 'historical_result' ].data_type === 'Boolean') {
          training_historical_result = training_data_transposed.splice(historical_result_index, 1)[ 0 ].map(el => {
            let val = String(el.toLowerCase());
            if (val === 'true') return true;
            else if (val === 'false') return false;
            return '';
          });
          testing_historical_result = testing_data_transposed.splice(historical_result_index, 1)[ 0 ].map(el => {
            let val = String(el.toLowerCase());
            if (val === 'true') return true;
            else if (val === 'false') return false;
            return '';
          });
        }
      }
      let degreeMap = {
        1: '1st',
        2: '2nd',
        3: '3rd',
        4: '4th',
        5: '5th',
      };
      csv_headers_copy.splice(historical_result_index, 1);
      const predictionStatisticsHelper = function (header, i) {
        return new Promise((resolve) => {
          statistics[ header ] = statistics[ header ] || {};
          statistics[ header ].transform_functions = statistics[ header ].transform_functions || [];
          if (strategy_data_schema[ 'historical_result' ].data_type === 'Number' || strategy_data_schema[ 'historical_result' ].data_type === 'Boolean') {
            // linear or binary model
            if (strategy_data_schema[ header ] && (strategy_data_schema[ header ].data_type === 'Number' || strategy_data_schema[ header ].data_type === 'Boolean')) {
              // numeric or boolean predictor variable
              let data_row;
              let exclude_indices = {};
              if (strategy_data_schema[ header ].data_type === 'Boolean') {
                data_row = training_data_transposed[ i ].reduce((returnData, el, index) => {
                  el = el.toLowerCase() === 'true' ? true : false;
                  returnData.push(Number(el));
                  return returnData;
                }, []);
              } else {
                data_row = training_data_transposed[ i ].reduce((returnData, el, index) => {
                  if (isNaN(Number(el))) exclude_indices[ index ] = true;
                  else returnData.push(Number(el));
                  return returnData;
                }, []);
              }
              let sortedArr = data_row.slice().sort((a, b) => Number(a) - Number(b));
              let mean = transformhelpers.getMean(sortedArr);
              let mode = transformhelpers.getMode(sortedArr);
              let min = transformhelpers.getMinimum(sortedArr);
              let max = transformhelpers.getMaximum(sortedArr);
              let median = transformhelpers.getMedian(sortedArr);
              statistics[ header ] = Object.assign({}, statistics[ header ], {
                mean,
                median,
                mode,
                min,
                max,
              });
              let filtered_historical_result_row = training_historical_result.filter((el, i) => !exclude_indices[ i ]);
              let linear_result = mlhelpers.generate_linear_function_evaluator(data_row, filtered_historical_result_row);
              let poly_result_2 = mlhelpers.generate_polynomial_function_evaluator(data_row, filtered_historical_result_row, 2);
              let poly_result_3 = mlhelpers.generate_polynomial_function_evaluator(data_row, filtered_historical_result_row, 3);
              let poly_result_4 = mlhelpers.generate_polynomial_function_evaluator(data_row, filtered_historical_result_row, 4);
              let poly_result_5 = mlhelpers.generate_polynomial_function_evaluator(data_row, filtered_historical_result_row, 5);
              let power_result = mlhelpers.generate_power_function_evaluator(data_row, filtered_historical_result_row, 3);
              let exp_result = mlhelpers.generate_exponential_function_evaluator(data_row, filtered_historical_result_row);
              if (linear_result) statistics[ header ].transform_functions.push(linear_result);
              if (poly_result_2) statistics[ header ].transform_functions.push(poly_result_2);
              if (poly_result_3) statistics[ header ].transform_functions.push(poly_result_3);
              if (poly_result_4) statistics[ header ].transform_functions.push(poly_result_4);
              if (poly_result_5) statistics[ header ].transform_functions.push(poly_result_5);
              if (power_result) statistics[ header ].transform_functions.push(power_result);
              if (exp_result) statistics[ header ].transform_functions.push(exp_result);
              let curr_highest_r2 = 0;
              let curr_highest_r2_index = 0;
              statistics[ header ].transform_functions.forEach((config, i) => {
                if (config.score.r2 > curr_highest_r2) {
                  curr_highest_r2_index = i;
                  curr_highest_r2 = config.score.r2;
                }
              });

              if (typeof curr_highest_r2 === 'number') statistics[ header ] = Object.assign({}, statistics[ header ], { r2: curr_highest_r2, });

              statistics[ header ].transform_functions = statistics[ header ].transform_functions.map((config, i) => {
                if (i === curr_highest_r2_index) config.selected = true;
                else config.selected = false;
                return config;
              });

              statistics[ header ].transform_functions.forEach((config, i) => {
                if (config.selected && config.type !== 'linear') {
                  transformations[ header ] = transformations[ header ] || {};
                  transformations[ header ].evaluator = config.evaluator;
                  transformations[ header ].type = (config.degree)
                    ? `${capitalize(config.type)} (${degreeMap[ config.degree ]} Degree)`
                    : capitalize(config.type);
                }
              });
            } else if (strategy_data_schema[ 'historical_result' ].data_type === 'Boolean') {
              // categorical predictor variable with binary model 
              let { chi2, cramers_v, } = mlhelpers.runChiSquaredTest(training_data_transposed[ i ], training_historical_result);
              statistics[ header ].chi2 = chi2;
              statistics[ header ].cramers_v = cramers_v;
              statistics[ header ].transform_functions.push({});
            } else {
              statistics[ header ].transform_functions.push({});
            }
          } else {
            if (strategy_data_schema[ header ] && (strategy_data_schema[ header ].data_type === 'Number' || strategy_data_schema[ header ].data_type === 'Boolean')) {
              let data_row;
              let exclude_indices = {};
              if (strategy_data_schema[ header ].data_type === 'Boolean') {
                data_row = training_data_transposed[ i ].reduce((returnData, el, index) => {
                  el = el.toLowerCase() === 'true' ? true : false;
                  returnData.push(Number(el));
                  return returnData;
                }, []);
              } else {
                data_row = training_data_transposed[ i ].reduce((returnData, el, index) => {
                  if (isNaN(Number(el))) exclude_indices[ index ] = true;
                  else returnData.push(Number(el));
                  return returnData;
                }, []);
              }
              let filtered_historical_result_row = training_historical_result.filter((el, i) => !exclude_indices[ i ]);
              let sortedArr = data_row.slice().sort((a, b) => Number(a) - Number(b));
              let mean = transformhelpers.getMean(sortedArr);
              let mode = transformhelpers.getMode(sortedArr);
              let min = transformhelpers.getMinimum(sortedArr);
              let max = transformhelpers.getMaximum(sortedArr);
              let median = transformhelpers.getMedian(sortedArr);

              statistics[ header ] = Object.assign({}, statistics[ header ], {
                mean,
                median,
                mode,
                min,
                max,
              });
              if (strategy_data_schema[ header ].data_type === 'Number') {
                let cleaned_training_row = data_row.map(data => (typeof data !== 'number') ? mean : data);
                let rpb = mlhelpers.runPointBiserialCorrelation(filtered_historical_result_row, cleaned_training_row, mean);
                statistics[ header ].rpb = rpb;
              }
            } else {
              statistics[ header ].transform_functions.push({});
              let { chi2, cramers_v, } = mlhelpers.runChiSquaredTest(training_data_transposed[ i ], training_historical_result);
              statistics[ header ] = Object.assign({}, statistics[ header ], {
                // mode: transformhelpers.getStringMode(training_data_transposed[ i ]),
                chi2,
                cramers_v,
              });
            }
          }
          resolve(true);
        });
      };
      await Promise.all(csv_headers_copy.map(predictionStatisticsHelper));
      req.body.data = Object.assign({}, req.body.data, { statistics, transformations, training_historical_result, testing_historical_result, });
    }
    return req;
  } catch (err) {
    req.err = err.message;
    return req;
  }
}

async function setDefaultModelType(req) {
  try {
    req.controllerData = req.controllerData || {};
    const modelType = req.controllerData.mlmodel.type;
    const modelIndustry = req.controllerData.mlmodel.industry;
    const industryTypesMap = {
      binary: {
        lending: 'loan_default_risk'
      }
    }
    if (req.controllerData.mlmodel) {
      let type = modelType || 'binary';
      if (req.controllerData.mlmodel.industry) {
        type = (industryTypesMap[ modelType ] && industryTypesMap[ modelType ][ modelIndustry ]) ? industryTypesMap[ modelType ][ modelIndustry ] : 'binary'
      }
      req.controllerData.mlmodel = Object.assign({}, req.controllerData.mlmodel, {
        type,
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatModelIndexRows(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.mlmodels) {
      let mlmodels = req.controllerData.mlmodels.map(mlmodel => {
        mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
        const formattedCreatedAt = (mlmodel.createdat && mlmodel.user && mlmodel.user.creator) ? `${transformhelpers.formatDateNoTime(mlmodel.createdat, req.user.time_zone)} by ${mlmodel.user.creator}` : '';
        const type = (mlmodel.type === 'regression') ? 'Linear' : capitalize(mlmodel.type);
        const formatted_type = mlmodel.industry ? MODEL_TYPE_MAP[ mlmodel.industry ] : MODEL_TYPE_MAP[ mlmodel.type ];
        const status = capitalize.words(mlmodel.status.replace('_', ' '));
        const organization = mlmodel.organization._id.toString();
        const nameMap = mlConstants.PROVIDER_LABEL;
        const iconMap = mlConstants.PROVIDER_ICON;
        // let progressBars = [ 'aws', 'sagemaker_ll', 'sagemaker_xgb', ].map(provider => {
        const aws_models = mlmodel.aws_models || [];
        const digifi_models = mlmodel.digifi_models || [];
        const all_training_models = [ ...aws_models, ...digifi_models, ].length ? [ ...aws_models, ...digifi_models, ] : [ 'aws', 'sagemaker_ll', 'sagemaker_xgb', ];
        const progressBars = all_training_models.map(provider => {
          return {
            component: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                margin: '5px 0',
              },
            },
            children: [ {
              component: 'span',
              props: {
                style: {
                  flex: '0 0 30px',
                  display: 'flex',
                  alignItems: 'center',
                },
              },
              children: [ {
                component: 'span',
                props: {
                  style: {
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    backgroundSize: '100%',
                    backgroundRepeat: 'no-repeat',
                    backgroundImage: `url(${(iconMap[ provider ])})`,
                  },
                },
              }, ],
            }, {
              component: 'span',
              props: {
                style: {
                  flex: '0 0 150px',
                },
              },
              children: (mlmodel && mlmodel[ provider ] && mlmodel[ provider ].status === 'failed')
                ? [ {
                  component: 'Semantic.Progress',
                  props: {
                    className: 'error-train',
                    onSubmit: null,
                    progress: 'value',
                    value: 'Error',
                    error: true,
                  },
                }, ] : [ {
                  component: 'Semantic.Progress',
                  props: {
                    className: provider,
                    onSubmit: null,
                    percent: (mlmodel[ provider ] && typeof mlmodel[ provider ].progress === 'number') ? mlmodel[ provider ].progress : 0,
                    progress: true,
                    indicating: (mlmodel && !mlmodel[ provider ])
                      ? true
                      : (mlmodel && mlmodel[ provider ])
                        ? mlmodel[ provider ].progress < 100
                        : false,
                    error: (mlmodel && mlmodel[ provider ]) ? mlmodel[ provider ].status === 'failed' : false,
                  },
                }, ],
            }, {
              component: 'span',
              props: {
                style: {
                  flex: 1,
                },
              },
              children: nameMap[ provider ],
            }, ],
          };
        });
        let edit_button_status = (mlmodel.status.toLowerCase() === 'complete' || mlmodel.status.toLowerCase() === 'training') ? 'inline' : 'none';
        let delete_button_status = (mlmodel.status.toLowerCase() === 'complete' || mlmodel.status.toLowerCase() === 'failed') ? 'inline' : 'none';
        return {
          _id: mlmodel._id,
          type,
          formatted_type,
          display_name: mlmodel.display_name,
          training_filename: (mlmodel.datasource && mlmodel.datasource.original_file && mlmodel.datasource.original_file.name) ? mlmodel.datasource.original_file.name : '',
          status,
          organization,
          rowProps: {
            buttons: [ {
              style: {
                display: 'inline',
              },
            }, {
              style: {
                // display: delete_button_status,
              },
            }, ],
          },
          // progress: mlmodel.progress || 100,
          // progressBar,
          progressBar: {
            component: 'div',
            children: progressBars,
          },
          formattedCreatedAt,
        };
      });

      if (req.query.pagination === 'mlmodels') {
        req.controllerData = Object.assign({}, req.controllerData, {
          rows: mlmodels,
        });
        delete req.controllerData.mlmodels;
      }
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

function __chunkify(a, n, balanced) {
  if (n < 2)
    return [ a, ];

  var len = a.length,
    out = [],
    i = 0,
    size;

  if (len % n === 0) {
    size = Math.floor(len / n);
    while (i < len) {
      out.push(a.slice(i, i += size));
    }
  } else if (balanced) {
    while (i < len) {
      size = Math.ceil((len - i) / n--);
      out.push(a.slice(i, i += size));
    }
  } else {

    n--;
    size = Math.floor(len / n);
    if (len % size === 0)
      size--;
    while (i < size * n) {
      out.push(a.slice(i, i += size));
    }
    out.push(a.slice(size * n));

  }

  return out;
}

async function formatDataFields(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.mlmodel) {
      // let disable_categorical = (req.query && req.query.page === 'input_data') ? true : false;
      let disable_categorical = true;
      let datasource = req.controllerData.mlmodel.datasource;
      let model_type = req.controllerData.mlmodel.type;
      let correlation_metric = {
        'binary': {
          'Number': 'r2',
          'Boolean': 'r2',
          'String': 'cramers_v',
        },
        'categorical': {
          'Number': 'rpb',
          // 'Boolean': 'r2',
          'String': 'cramers_v',
        },
        'regression': {
          'Number': 'r2',
          'Boolean': 'r2',
          // 'String': 'chi2',
        },
      };
      let formoptions = [ { label: 'Number', value: 'Number', }, { label: 'Boolean', value: 'Boolean', }, { label: 'String', value: 'String', }, { label: 'Date', value: 'Date', }, ];
      let strategy_data_schema = JSON.parse(datasource.strategy_data_schema);
      let aws_data_schema = JSON.parse(datasource.data_schema).attributes;
      let included_columns = datasource.included_columns ? JSON.parse(datasource.included_columns) : null;
      let statistics = datasource.statistics;
      let importance_map = {};
      let column_correlation_metrics = Object.keys(statistics).reduce((arr, el) => {
        let column_correlation_metric = (strategy_data_schema[ el ] && strategy_data_schema[ el ].data_type && correlation_metric[ model_type ][ strategy_data_schema[ el ].data_type ]) ? correlation_metric[ model_type ][ strategy_data_schema[ el ].data_type ] : null;
        if (column_correlation_metric && typeof statistics[ el ][ column_correlation_metric ] === 'number') arr.push({ header: el, metric: column_correlation_metric, });
        return arr;
      }, []);
      let sorted_r2 = column_correlation_metrics.sort((col1, col2) => (statistics[ col1.header ][ col1.metric ] - statistics[ col2.header ][ col2.metric ])).map(el => el.header);
      let chunkified = __chunkify(sorted_r2, 5, true);
      let importance_buckets = {
        '0': 'Very Low',
        '1': 'Low',
        '2': 'Medium',
        '3': 'High',
        '4': 'Very High',
      };
      chunkified.forEach((chunk, i) => {
        chunk.forEach(input_name => importance_map[ input_name ] = importance_buckets[ i ]);
      });
      let data_source_variables = aws_data_schema.map((attribute, i) => {
        let key = attribute.attributeName;
        let exclude_column = datasource.column_unique_counts && datasource.column_unique_counts[ key ] && datasource.column_unique_counts[ key ] > 100;
        let column_correlation_metric = (strategy_data_schema[ key ] && strategy_data_schema[ key ].data_type && correlation_metric[ model_type ][ strategy_data_schema[ key ].data_type ]) ? correlation_metric[ model_type ][ strategy_data_schema[ key ].data_type ] : null;
        return {
          rowProps: {
            'include_column': {
              disabled: (key === 'historical_result' || exclude_column || req.query.page === 'input_data') ? true : false,
            },
          },
          include_column: _includeColumn(key, datasource, strategy_data_schema, statistics, included_columns),
          column_unique_count: datasource.column_unique_counts ? datasource.column_unique_counts[ key ] : '',
          correlation_value: (statistics[ key ] && typeof statistics[ key ][ column_correlation_metric || 'r2' ] === 'number') ? statistics[ key ][ column_correlation_metric || 'r2' ] : 0,
          correlation: (statistics[ key ] && typeof statistics[ key ][ column_correlation_metric || 'r2' ] === 'number') ? transformhelpers.formatPercentage(statistics[ key ][ column_correlation_metric || 'r2' ]) : 'N/A',
          importance: (importance_map && importance_map[ key ]) ? importance_map[ key ] : 'N/A',
          range: (statistics[ key ] && strategy_data_schema[ key ].data_type && strategy_data_schema[ key ].data_type === 'Number') ? `${Math.round(statistics[ key ].min * 100) / 100} to ${Math.round(statistics[ key ].max * 100) / 100}` : 'N/A',
          average: (statistics[ key ] && strategy_data_schema[ key ].data_type && strategy_data_schema[ key ].data_type === 'Number') ? Math.round(statistics[ key ].mean * 100) / 100 : 'N/A',
          uploaded_variable_name: key,
          data_type: strategy_data_schema[ key ].data_type,
          distinct_category: aws_data_schema[ i ].attributeType === 'CATEGORICAL' || aws_data_schema[ i ].attributeType === 'BINARY',
        };
      });
      data_source_variables = data_source_variables.sort((a, b) => b.correlation_value - a.correlation_value);
      req.controllerData.mlmodel.datasource = Object.assign({}, req.controllerData.mlmodel.datasource, {
        model_id: req.controllerData.mlmodel._id.toString(),
        data_source_variables,
        formoptions: { data_type: formoptions, },
      });
    } else {
      req.error = 'Error retrieving model';
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatDataTypeColumns(req) {
  try {
    let MLDatasource = req.controllerData.MLDatasource;
    let transposedTrainingDataColumns = mathjs.transpose(MLDatasource.training_data_rows);
    let transposedTestingDataColumns = mathjs.transpose(MLDatasource.testing_data_rows);
    let columnTypes = {};
    for (let [ key, val, ] of Object.entries(MLDatasource.strategy_data_schema)) {
      columnTypes[ key ] = val.data_type;
    }
    MLDatasource.headers.forEach((header, idx) => {
      if (columnTypes[ header ] === 'Date') {
        transposedTrainingDataColumns[ idx ] = transposedTrainingDataColumns[ idx ].map(celldata => new Date(celldata).getTime());
        transposedTestingDataColumns[ idx ] = transposedTestingDataColumns[ idx ].map(celldata => new Date(celldata).getTime());
      }
    });
    req.controllerData.training_data_transposed = transposedTrainingDataColumns;
    req.controllerData.testing_data_transposed = transposedTestingDataColumns;
    req.controllerData.columnTypes = columnTypes;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function countColumnUniqueValues(req) {
  try {
    if (req.error) return req;
    req.controllerData = req.controllerData || {};
    if (req.controllerData.training_data_transposed && req.controllerData.columnTypes) {
      let MLDatasource = req.controllerData.MLDatasource;
      let columnTypes = req.controllerData.columnTypes;
      let training_data_transposed = req.controllerData.training_data_transposed;
      let headers = MLDatasource.headers;
      let column_unique_counts = {};
      let too_many_unique_values = [];
      for (let i = 0; i < headers.length; i++) {
        let header = headers[ i ];
        let column = training_data_transposed[ i ];
        if (columnTypes[ header ] === 'String' || columnTypes[ header ] === 'Boolean') {
          let uniqueSet = new Set();
          for (let j = 0; j < column.length; j++) {
            uniqueSet.add(column[ j ]);
            // if(uniqueSet.size > 100) {
            //   too_many_unique_values.push(header);
            //   break;
            // }
          }
          column_unique_counts[ header ] = uniqueSet.size;
        }
      }
      req.body.column_unique_counts = column_unique_counts;
      return req;
    }
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

function __generateStatusTag(status, data, unit) {
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
      },
    },
    children: [ {
      component: 'span',
      props: {
        style: {
          fontStyle: 'bold',
        },
      },
      children: (unit) ? `${data}${unit}` : data,
    }, {
      component: 'span',
      props: {
        style: {
          fontStyle: 'italic',
        },
      },
      children: status,
    }, ],
  };
}

function __generateCategoricalScore(data, row_type) {
  let result;
  switch (row_type) {
    case 'variables':
      if (data >= 13) result = __generateStatusTag('Excellent', data);
      else if (data >= 6) result = __generateStatusTag('Good', data);
      else if (data >= 4) result = __generateStatusTag('Okay', data);
      else result = __generateStatusTag('Poor', data);
      break;
    case 'observations':
      if (data > 10000) result = __generateStatusTag('Excellent', data);
      else if (data > 2000) result = __generateStatusTag('Good', data);
      else if (data > 500) result = __generateStatusTag('Okay', data);
      else result = __generateStatusTag('Poor', data);
      break;
    case 'power':
      if (data >= 80) result = __generateStatusTag('Excellent', data, '%');
      else if (data >= 50) result = __generateStatusTag('Good', data, '%');
      else if (data >= 25) result = __generateStatusTag('Okay', data, '%');
      else result = __generateStatusTag('Poor', data, '%');
      break;
    case 'accuracy':
      if (data >= 85) result = __generateStatusTag('Excellent', data, '%');
      else if (data >= 65) result = __generateStatusTag('Good', data, '%');
      else if (data >= 50) result = __generateStatusTag('Okay', data, '%');
      else result = __generateStatusTag('Poor', data, '%');
      break;
    case 'resilience':
      if (data <= 40) result = __generateStatusTag('Poor', data, '%');
      else if (data <= 65) result = __generateStatusTag('Okay', data, '%');
      else if (data < 90) result = __generateStatusTag('Good', data, '%');
      else result = __generateStatusTag('Excellent', data, '%');
      break;
  }
  return result;
}

function __generateLinearScore(data, row_type) {
  let result;
  switch (row_type) {
    case 'variables':
      if (data >= 13) result = __generateStatusTag('Excellent', data);
      else if (data >= 6) result = __generateStatusTag('Good', data);
      else if (data >= 4) result = __generateStatusTag('Okay', data);
      else result = __generateStatusTag('Poor', data);
      break;
    case 'observations':
      if (data > 10000) result = __generateStatusTag('Excellent', data);
      else if (data > 1000) result = __generateStatusTag('Good', data);
      else if (data > 200) result = __generateStatusTag('Okay', data);
      else result = __generateStatusTag('Poor', data);
      break;
    case 'power':
      if (data >= 70) result = __generateStatusTag('Excellent', data, '%');
      else if (data >= 40) result = __generateStatusTag('Good', data, '%');
      else if (data >= 20) result = __generateStatusTag('Okay', data, '%');
      else result = __generateStatusTag('Poor', data, '%');
      break;
    case 'resilience':
      if (data <= 40) result = __generateStatusTag('Poor', data, '%');
      else if (data <= 65) result = __generateStatusTag('Okay', data, '%');
      else if (data < 90) result = __generateStatusTag('Good', data, '%');
      else result = __generateStatusTag('Excellent', data, '%');
      break;
  }
  return result;
}
function __generateBinaryScore(data, row_type) {
  let result;
  switch (row_type) {
    case 'variables':
      if (data >= 13) result = __generateStatusTag('Excellent', data);
      else if (data >= 6) result = __generateStatusTag('Good', data);
      else if (data >= 4) result = __generateStatusTag('Okay', data);
      else result = __generateStatusTag('Poor', data);
      break;
    case 'observations':
      if (data.numOnes >= 1500 && data.numZeros >= 1500) result = __generateStatusTag('Excellent', data);
      else if (data.numOnes >= 1500 || data.numZeros >= 1500) result = __generateStatusTag('Good', data);
      else if (data.numOnes >= 500 || data.numZeros >= 500) result = __generateStatusTag('Okay', data);
      else result = __generateStatusTag('Poor');
      break;
    case 'power':
      if (data >= 80) result = __generateStatusTag('Excellent', data, '%');
      else if (data >= 70) result = __generateStatusTag('Good', data, '%');
      else if (data >= 60) result = __generateStatusTag('Okay', data, '%');
      else result = __generateStatusTag('Poor', data, '%');
      break;
    case 'accuracy':
      if (data >= 80) result = __generateStatusTag('Excellent', data, '%');
      else if (data >= 70) result = __generateStatusTag('Good', data, '%');
      else if (data >= 60) result = __generateStatusTag('Okay', data, '%');
      else result = __generateStatusTag('Poor', data, '%');
      break;
    case 'resilience':
      if (data <= 40) result = __generateStatusTag('Poor', data, '%');
      else if (data <= 65) result = __generateStatusTag('Okay', data, '%');
      else if (data < 90) result = __generateStatusTag('Good', data, '%');
      else result = __generateStatusTag('Excellent', data, '%');
      break;
  }
  return result;
}

function generateModelSelectionTableRow(modeldata) {
  const isPremium = THEMESETTINGS.premium_machinelearning || false;
  let { provider, datasource, predictor_variable_count, performance_metrics, type, batch_testing_id, batch_training_id, selected_provider, } = modeldata;
  let numVars;
  let basicMLSelection = {
    aws: {
      component: 'div',
      props: {
        className: 'ui checked fitted radio checkbox',
      },
      children: [ {
        component: 'input',
        props: {
          type: 'radio',
          value: 'on',
          name: 'aws',
          checked: true,
        },
      }, {
        component: 'label',
      },
      ],
    },
    default: {
      component: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
        },
      },
      children: [ {
        component: 'span',
        props: {
          style: {
            color: styles.colors.gray,
            fontStyle: 'italic',
          },
        },
        children: 'Premium',
      }, {
        component: 'span',
        props: {
          style: {
            color: styles.colors.gray,
            fontStyle: 'italic',
          },
        },
        children: 'Feature',
      }, ],
    },
  };
  let providerCell = {
    component: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
      },
    },
    children: [ {
      component: 'span',
      props: {
        style: {
          display: 'inline-block',
          width: '30px',
          height: '30px',
          marginRight: '10px',
          backgroundSize: '100%',
          backgroundRepeat: 'no-repeat',
          backgroundImage: `url(${PROVIDER_ICON[ provider ]})`,
        },
      },
    }, {
      component: 'span',
      children: PROVIDER_LABEL[ provider ],
    }, ],
  };
  if (datasource) {
    let ml_input_schema = datasource.included_columns || datasource.strategy_data_schema;
    numVars = (datasource.predictor_variable_count) ? datasource.predictor_variable_count : Object.keys(JSON.parse(ml_input_schema)).length - 1;
  } else {
    numVars = (predictor_variable_count) ? predictor_variable_count : 0;
  }
  let selected;
  if (isPremium) {
    selected = selected_provider === provider;
  } else {
    selected = basicMLSelection[ provider ] ? basicMLSelection[ provider ] : basicMLSelection.default;
  }
  if (type === 'binary') {
    let maxAccuracy = (100 * Math.max(...batch_testing_id.results.accuracy_distribution.map(el => el.accuracy_rate))).toFixed(0);
    let resilienceDiff = (100 * (1 - Math.abs(batch_training_id.results.auc - batch_testing_id.results.auc))).toFixed(0);
    let accuracy_rate = __generateBinaryScore(maxAccuracy, 'accuracy');
    let predictive_power = (typeof batch_testing_id.results.auc === 'number')
      ? __generateBinaryScore((100 * batch_testing_id.results.auc).toFixed(0), 'power')
      : '';
    let resiliency = __generateBinaryScore(resilienceDiff, 'resilience');
    return {
      provider: providerCell,
      provider_name: provider,
      accuracy_rate,
      predictive_power,
      resiliency,
      selected,
    };
  } else if (type === 'regression') {
    let resilienceDiff = (typeof batch_training_id.results.r_squared === 'number' && typeof batch_testing_id.results.r_squared === 'number') ? 100 - Math.abs((100 * (batch_training_id.results.r_squared - batch_testing_id.results.r_squared)).toFixed(2)) : 'N/A';
    let predictive_power = __generateLinearScore((100 * batch_testing_id.results.r_squared).toFixed(0), 'power');
    let resiliency = __generateLinearScore(resilienceDiff, 'resilience');
    return {
      provider: providerCell,
      provider_name: provider,
      resiliency,
      predictive_power,
      selected,
    };
  } else if (type === 'categorical') {
    const trainingCategories = batch_training_id.results.categories;
    const testingCategories = batch_testing_id.results.categories;
    let numCats = trainingCategories.length;
    let trainingAccuracyAverage = (trainingCategories) ? 100 * Number((trainingCategories.reduce((sum, category, i) => sum + batch_training_id.results.accuracy_rates[ category ][ i ], 0) / numCats).toFixed(2)) : 'N/A';
    let testingAccuracyAverage = (testingCategories) ? 100 * Number((testingCategories.reduce((sum, category, i) => sum + batch_testing_id.results.accuracy_rates[ category ][ i ], 0) / numCats).toFixed(2)) : 'N/A';
    let resilienceDiff = (typeof trainingAccuracyAverage === 'number' && typeof testingAccuracyAverage === 'number') ? 100 - Math.abs(trainingAccuracyAverage - testingAccuracyAverage) : 'N/A';
    testingAccuracyAverage = (testingAccuracyAverage && testingAccuracyAverage.toFixed(0)) ? testingAccuracyAverage.toFixed(0) : testingAccuracyAverage;
    let accuracy_rate = __generateCategoricalScore(testingAccuracyAverage, 'accuracy');
    let predictive_power = __generateCategoricalScore((100 * batch_testing_id.results.macro_avg_f1_score).toFixed(0), 'power');
    resilienceDiff = (resilienceDiff && resilienceDiff.toFixed(0)) ? Number(resilienceDiff.toFixed(0)) : resilienceDiff;
    let resiliency = __generateCategoricalScore(resilienceDiff, 'resilience');
    return {
      provider: providerCell,
      provider_name: provider,
      accuracy_rate,
      resiliency,
      predictive_power,
      selected,
    };
  } else {
    return {};
  }
}

function createSelectedModelDescription({ model_selections, providers, type, updating_provider, }) {
  const PREDICTIVE_POWER_UNIT = {
    'binary': 'ROC AUC',
    'regression': 'R2',
    'categorical': 'F-1',
  };
  if (type === 'binary' || type === 'categorical') {
    return providers.reduce((acc, provider, idx) => {
      let provider_data = model_selections[ idx ];
      let accuracy = provider_data.accuracy_rate.children[ 1 ].children.toLowerCase();
      let predictive_power = provider_data.predictive_power.children[ 1 ].children.toLowerCase();
      let resiliency = provider_data.resiliency.children[ 1 ].children.toLowerCase();
      let accuracy_bullet_display = (accuracy === 'excellent' || accuracy === 'good') ? '' : 'none';
      let predictive_power_bullet_display = (predictive_power === 'excellent' || predictive_power === 'good') ? '' : 'none';
      let resiliency_bullet_display = (resiliency === 'excellent' || resiliency === 'good') ? '' : 'none';
      acc[ provider ] = [ {
        component: 'Columns',
        children: [ {
          component: 'Column',
          props: {
            size: 'isOneQuarter',
            style: {
              display: 'flex',
            },
          },
          children: [ {
            component: 'span',
            props: {
              style: {
                display: 'block',
                width: '120px',
                height: '120px',
                margin: 'auto',
                backgroundSize: '100%',
                backgroundRepeat: 'no-repeat',
                backgroundImage: `url(${PROVIDER_ICON[ provider ]})`,
              },
            },
          }, ],
        }, {
          component: 'Column',
          props: {
            size: 'isThreeQuarters',
          },
          children: [ {
            component: 'Title',
            children: (updating_provider) ? `${PROVIDER_LABEL[ provider ]} - Currently Updating Model Selection` : PROVIDER_LABEL[ provider ],
          }, {
            component: 'p',
            children: MODEL_DESCRIPTION[ provider ],
          }, {
            component: 'ul',
            props: {
              className: 'checkmark-ul-list',
            },
            children: [ {
              component: 'li',
              props: {
                className: predictive_power_bullet_display === 'none' ? 'warn-list-li' : 'check-list-li',
              },
              children: `Has ${predictive_power} predictive power, with a ${PREDICTIVE_POWER_UNIT[ type ]} score of ${provider_data.predictive_power.children[ 0 ].children}`,
            }, {
              component: 'li',
              props: {
                className: accuracy_bullet_display === 'none' ? 'warn-list-li' : 'check-list-li',
              },
              children: `Has ${accuracy} accuracy, making the correct prediction ${provider_data.accuracy_rate.children[ 0 ].children} of the time`,
            }, {
              component: 'li',
              props: {
                className: resiliency_bullet_display === 'none' ? 'warn-list-li' : 'check-list-li',
              },
              children: `Has ${resiliency} resiliency, with testing results at ${provider_data.resiliency.children[ 0 ].children} of the level of training results`,
            }, ],
          }, ],
        }, ],
      }, ];
      return acc;
    }, {});
  } else {
    return providers.reduce((acc, provider, idx) => {
      let provider_data = model_selections[ idx ];
      let predictive_power = provider_data.predictive_power.children[ 1 ].children.toLowerCase();
      let resiliency = provider_data.resiliency.children[ 1 ].children.toLowerCase();
      let predictive_power_bullet_display = (predictive_power === 'excellent' || predictive_power === 'good') ? '' : 'none';
      let resiliency_bullet_display = (resiliency === 'excellent' || resiliency === 'good') ? '' : 'none';
      acc[ provider ] = [ {
        component: 'Columns',
        children: [ {
          component: 'Column',
          props: {
            size: 'isOneQuarter',
            style: {
              display: 'flex',
            },
          },
          children: [ {
            component: 'span',
            props: {
              style: {
                display: 'block',
                width: '120px',
                height: '120px',
                margin: 'auto',
                backgroundSize: '100%',
                backgroundRepeat: 'no-repeat',
                backgroundImage: `url(${PROVIDER_ICON[ provider ]})`,
              },
            },
          }, ],
        }, {
          component: 'Column',
          props: {
            size: 'isThreeQuarters',
          },
          children: [ {
            component: 'Title',
            children: (updating_provider) ? `${PROVIDER_LABEL[ provider ]} - Currently Updating Model Selection` : PROVIDER_LABEL[ provider ],
          }, {
            component: 'p',
            children: MODEL_DESCRIPTION[ provider ],
          }, {
            component: 'ul',
            props: {
              className: 'checkmark-ul-list',
            },
            children: [ {
              component: 'li',
              props: {
                className: predictive_power_bullet_display === 'none' ? 'warn-list-li' : 'check-list-li',
              },
              children: `Has ${predictive_power} predictive power, with a ${PREDICTIVE_POWER_UNIT[ type ]} score of ${provider_data.predictive_power.children[ 0 ].children}`,
            }, {
              component: 'li',
              props: {
                className: resiliency_bullet_display === 'none' ? 'warn-list-li' : 'check-list-li',
              },
              children: `Has ${resiliency} resiliency, with testing results at ${provider_data.resiliency.children[ 0 ].children} of the level of training results`,
            }, ],
          }, ],
        }, ],
      }, ];
      return acc;
    }, {});
  }
}

async function formatModelSelectionPage(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.mlmodel) {
      let mlmodel = req.controllerData.mlmodel;
      const aws_models = mlmodel.aws_models || [];
      const digifi_models = mlmodel.digifi_models || [];
      const all_training_models = [ ...aws_models, ...digifi_models, ].length ? [ ...aws_models, ...digifi_models, ] : [ 'aws', 'sagemaker_ll', 'sagemaker_xgb', ];
      const providers = all_training_models.filter(model_name => mlmodel[ model_name ] && (mlmodel[ model_name ].status === 'complete' || mlmodel[ model_name ].status === 'completed'));
      let selected_provider = (mlmodel.selected_provider) ? mlmodel.selected_provider : 'aws';
      let model_selections = providers.reduce((aggregate, provider, i) => {
        let provider_model = mlmodel[ provider ];
        if (provider_model) {
          let model_selection_row = generateModelSelectionTableRow({ provider, datasource: provider_model.datasource, performance_metrics: provider_model.performance_metrics, type: mlmodel.type, batch_testing_id: provider_model.batch_testing_id, batch_training_id: provider_model.batch_training_id, selected_provider, });
          aggregate.push(model_selection_row);
        }
        return aggregate;
      }, []);
      let formatted_type = mlmodel.industry ? MODEL_TYPE_MAP[ mlmodel.industry ] : MODEL_TYPE_MAP[ mlmodel.type ];
      let formatted_updatedat = `${transformhelpers.formatDateNoTime(mlmodel.updatedat, req.user.time_zone)} by ${mlmodel.user.updater}`;
      let formatted_createdat = `${transformhelpers.formatDateNoTime(mlmodel.createdat, req.user.time_zone)} by ${mlmodel.user.creator}`;
      let training_data_file = mlmodel.datasource.original_file.training.filename;
      let selected_model_descriptions = createSelectedModelDescription({ model_selections, providers, type: mlmodel.type, updating_provider: mlmodel.updating_provider || false, });
      req.controllerData.mlmodel = Object.assign({}, req.controllerData.mlmodel, {
        model_selections: model_selections,
        formatted_type,
        formatted_updatedat,
        formatted_createdat,
        training_data_file,
        selected_model_descriptions,
      });
      return req;
    } else {
      return req;
    }
  } catch (e) {
    console.log({ e });
    req.error = e.message;
    return req;
  }
}

async function stageModelSelection(req) {
  try {
    req.body = req.body || {};
    req.body.data = req.body.data || {};
    let user = req.user;
    const sagemaker = periodic.aws.sagemaker;
    const redisClient = periodic.app.locals.redisClient;
    const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
    if (req.body.model_selections && req.query && req.query.type === 'update_model_selection') {
      let selected_provider = req.body.model_selections.filter(el => el.selected)[ 0 ];
      let currently_selected = selected_provider.provider_name || 'aws';
      let mlmodel = req.controllerData.mlmodel;
      let currentlySelectedmodelDoc = mlmodel[currently_selected];
      let prevSelectedModelDoc = mlmodel[ mlmodel.selected_provider ] || mlmodel[ 'aws' ];
      if (mlmodel.selected_provider !== selected_provider) {
        if (['aws', 'neural_network', 'decision_tree', 'random_forest' ].includes(currently_selected) && prevSelectedModelDoc.real_time_prediction_id && (mlmodel.selected_provider === 'sagemaker_ll' || mlmodel.selected_provider === 'sagemaker_xgb')) {
          await hmsetAsync(`${periodic.environment}_update_endpoint:${mlmodel._id.toString()}`, {
            from_real_time_prediction_id: prevSelectedModelDoc.real_time_prediction_id,
            from: mlmodel.selected_provider,
            to: 'aws',
            user: `${user.first_name} ${user.last_name}`,
            model_id: mlmodel._id.toString(),
            name: currentlySelectedmodelDoc.model_name,
            status: 'delete_endpoint',
          });
        }
        if (currently_selected === 'aws') {
          req.body.data = Object.assign({}, {
            selected_provider: currently_selected,
          });
        } else if (currently_selected === 'sagemaker_ll' || currently_selected === 'sagemaker_xgb') {
          let sagemaker_name = currentlySelectedmodelDoc.model_name;
          let configParam = {
            EndpointConfigName: sagemaker_name,
            ProductionVariants: [
              {
                InitialInstanceCount: 1,
                InstanceType: 'ml.t2.medium',
                ModelName: sagemaker_name,
                VariantName: sagemaker_name,
              },
              /* more items */
            ],
            Tags: [],
          };
          await sagemaker.createEndpointConfig(configParam).promise();
          let endpointParams = {
            'EndpointConfigName': sagemaker_name,
            'EndpointName': sagemaker_name,
            'Tags': [],
          };
          await sagemaker.createEndpoint(endpointParams).promise();
          await hmsetAsync(`${periodic.environment}_update_endpoint:${mlmodel._id.toString()}`, {
            from: mlmodel.selected_provider,
            from_real_time_prediction_id: prevSelectedModelDoc.real_time_prediction_id,
            to: currently_selected,
            model_id: mlmodel._id.toString(),
            user: `${user.first_name} ${user.last_name}`,
            name: currentlySelectedmodelDoc.model_name,
            status: 'create_endpoint',
          });
          req.body.data = Object.assign({}, {
            updating_provider: true,
          });
        } else {
          req.body.data = Object.assign({}, {
            selected_provider: currently_selected,
          });
        }
      } else {
        req.body.data = Object.assign({}, {
          selected_provider: currently_selected,
        });
      }
    }
    return req;
  } catch (e) {
    console.log({ e });
    req.error = e.message;
    return req;
  }
}

async function setModelHeader(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    if (req.controllerData.mlmodel) {
      const model_type = (req.controllerData.mlmodel.industry) ? MODEL_TYPE_MAP[ req.controllerData.mlmodel.industry ] : MODEL_TYPE_MAP[ req.controllerData.mlmodel.type ];
      // let date = transformhelpers.formatDate(req.controllerData.mlmodel.createdat);
      let date = transformhelpers.formatDateNoTime(req.controllerData.mlmodel.createdat, req.user.time_zone);
      let user = req.controllerData.mlmodel.user.creator;
      let filename = (req.controllerData.mlmodel.datasource && req.controllerData.mlmodel.datasource.original_file) ? req.controllerData.mlmodel.datasource.original_file.name : '';
      req.controllerData.data = Object.assign({}, req.controllerData.data, {
        display_title: req.controllerData.mlmodel.display_name,
        display_subtitle: `${model_type} model created on ${date} by ${user} using ${filename} data`,
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function generateInputDataForm(req) {
  try {
    req.controllerData = req.controllerData || {};
    const mlsubtabs = (req.controllerData.mlmodel && req.controllerData.mlmodel.industry) ? mlSubTabs('input_data', true) : mlSubTabs('input_data');
    const download_buttons = mlhelpers.downloadButtonDropdown({ query: req.query, modeldata: req.controllerData.mlmodel });
    req.controllerData._children = [
      mlTabs('models'),
      detailAsyncTitleAndSubtitle({ type: 'mlmodel', title: true, }),
      mlsubtabs,
      plainGlobalButtonBar({
        left: [ download_buttons, ],
        right: [ {
          guideButton: true,
          location: references.guideLinks.models.evaluation,
        }, ],
      }),
      {
        component: 'Container',
        props: {
          style: {},
        },
        children: [ {
          component: 'Columns',
          children: [ {
            component: 'Column',
            props: {
              size: 'isThreeQuarter',
              padding: 0,
            },
            children: [ {
              component: 'ResponsiveCard',
              props: cardprops({
                cardTitle: 'Data Fields',
              }),
              children: [ {
                component: 'ResponsiveForm',
                props: {
                  onSubmit: {},
                  formgroups: [
                    {
                      gridProps: {
                        key: randomKey(),
                      },
                      formElements: [ {
                        type: 'datatable',
                        name: 'data_source_variables',
                        // uniqueFormOptions: true,
                        'flattenRowData': false,
                        'addNewRows': false,
                        'rowButtons': false,
                        'useInputRows': true,
                        tableWrappingStyle: {
                          overflow: 'visible',
                        },
                        label: ' ',
                        labelProps: {
                          style: {
                            flex: 1,
                          },
                        },
                        passProps: {
                          turnOffTableSort: true,
                          tableWrappingStyle: {
                            overflow: 'visible',
                          },
                        },
                        layoutProps: {},
                        ignoreTableHeaders: [ '_id', ],
                        headers: [ {
                          label: 'Name',
                          sortid: 'uploaded_variable_name',
                          sortable: false,
                          headerColumnProps: {
                            style: {
                              width: '20%',
                            },
                          },
                        }, {
                          label: {
                            component: 'span',
                            children: [ {
                              component: 'span',
                              props: {
                                style: {
                                  marginRight: '6px',
                                },
                              },
                              children: 'Data Type',
                            }, {
                              component: 'ResponsiveButton',
                              props: {
                                buttonProps: {
                                  className: 'question-button',
                                },
                                onClick: 'func:this.props.createModal',
                                onclickProps: {
                                  pathname: '/modal/model-data-type',
                                  title: 'What is a Data Type?',
                                },
                              },
                            }, ],
                          },
                          sortid: 'data_type',
                          sortable: false,
                          headerColumnProps: {
                          },
                          columnProps: {
                            style: {
                              overflow: 'visible',
                            },
                          },
                        }, {
                          label: {
                            component: 'span',
                            children: [ {
                              component: 'span',
                              props: {
                                style: {
                                  marginRight: '6px',
                                },
                              },
                              children: 'Correlation',
                            }, {
                              component: 'ResponsiveButton',
                              props: {
                                buttonProps: {
                                  className: 'question-button',
                                },
                                onClick: 'func:this.props.createModal',
                                onclickProps: {
                                  pathname: '/modal/model-correlation',
                                  title: 'What is a Correlation?',
                                },
                              },
                            }, ],
                          },
                          sortid: 'correlation',
                          sortable: false,
                          headerColumnProps: {
                          },
                          columnProps: {
                            style: {
                              overflow: 'visible',
                            },
                          },
                        }, {
                          label: {
                            component: 'span',
                            children: [ {
                              component: 'span',
                              props: {
                                style: {
                                  marginRight: '6px',
                                },
                              },
                              children: 'Importance',
                            }, {
                              component: 'ResponsiveButton',
                              props: {
                                buttonProps: {
                                  className: 'question-button',
                                },
                                onClick: 'func:this.props.createModal',
                                onclickProps: {
                                  pathname: '/modal/model-importance',
                                  title: 'What Does "Importance" Mean?',
                                },
                              },
                            }, ],
                          },
                          sortid: 'importance',
                          sortable: false,
                          headerColumnProps: {
                          },
                          columnProps: {
                            style: {
                              overflow: 'visible',
                            },
                          },
                        }, {
                          label: 'Range',
                          sortid: 'range',
                          sortable: false,
                          headerColumnProps: {
                          },
                          columnProps: {
                            style: {
                              overflow: 'visible',
                            },
                          },
                        }, {
                          label: 'Average',
                          sortid: 'average',
                          sortable: false,
                          headerColumnProps: {
                          },
                          columnProps: {
                            style: {
                              overflow: 'visible',
                            },
                          },
                        }, {
                          label: {
                            component: 'span',
                            children: [ {
                              component: 'span',
                              props: {
                                style: {
                                  marginRight: '6px',
                                },
                              },
                              children: '# Unique',
                            }, {
                              component: 'ResponsiveButton',
                              props: {
                                buttonProps: {
                                  className: 'question-button',
                                },
                                onClick: 'func:this.props.createModal',
                                onclickProps: {
                                  pathname: '/modal/column-unique-counts',
                                  title: 'What is the "# Unique"?',
                                },
                              },
                            }, ],
                          },
                          sortid: 'column_unique_count',
                          sortable: false,
                          useRowProps: true,
                          columnProps: {
                            style: {
                              overflow: 'visible',
                            },
                          },
                        }, {
                          label: {
                            component: 'span',
                            children: [ {
                              component: 'span',
                              props: {
                                style: {
                                  marginRight: '6px',
                                },
                              },
                              children: 'Include?',
                            }, {
                              component: 'ResponsiveButton',
                              props: {
                                buttonProps: {
                                  className: 'question-button',
                                },
                                onClick: 'func:this.props.createModal',
                                onclickProps: {
                                  pathname: '/modal/included-columns',
                                  title: 'What Does "Include" Mean?',
                                },
                              },
                            }, ],
                          },
                          sortid: 'include_column',
                          formtype: 'checkbox',
                          sortable: false,
                          useRowProps: true,
                          passProps: {
                          },
                          columnProps: {
                            style: {
                              overflow: 'visible',
                            },
                          },
                        }, ],
                      }, ],
                    },
                  ],
                },
                asyncprops: {
                  formdata: [ 'mlmodeldata', 'mlmodel', 'datasource', ],
                },
              }, ],
            }, ],
          }, {
            component: 'Column',
            props: {
              size: 'isOneQuarter',
              padding: 0,
            },
            children: [ {
              component: 'ResponsiveCard',
              props: cardprops({
                cardTitle: 'Basic Metrics',
              }),
              children: [ {
                component: 'ResponsiveForm',
                asyncprops: {
                  formdata: [ 'mlmodeldata', 'mlmodel', 'datasource', ],
                },
                props: {
                  onSubmit: {},
                  formgroups: [ {
                    gridProps: {
                      key: randomKey(),
                      className: 'modal-footer-btns',
                    },
                    formElements: [ {
                      label: 'Number of Observations',
                      name: 'observation_count',
                      passProps: {
                        state: 'isDisabled',
                      },
                    }, ],
                  }, {
                    gridProps: {
                      key: randomKey(),
                      className: 'modal-footer-btns',
                    },
                    formElements: [ {
                      label: 'Number of Predictors',
                      name: 'predictor_variable_count',
                      passProps: {
                        state: 'isDisabled',
                      },
                    }, ],
                  }, ],
                },
              }, ],
            }, ],
          }, ],
        }, ],
      },
    ];
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function generateModelSelectionForm(req) {
  try {
    const isPremium = THEMESETTINGS.premium_machinelearning || false;
    let model_selection_header = isPremium ? {
      label: 'Selection',
      formtype: 'radio',
      sortid: 'selected',
      headerColumnProps: {
        style: {
          textAlign: 'center',
          verticalAlign: 'bottom',
          width: '15%',
        },
      },
      columnProps: {
        style: {
          textAlign: 'center',
        },
      },
      sortable: false,
    } : {
        label: 'Selection',
        sortid: 'selected',
        headerColumnProps: {
          style: {
            textAlign: 'center',
            verticalAlign: 'bottom',
            width: '15%',
          },
        },
        columnProps: {
          style: {
            textAlign: 'center',
          },
        },
        sortable: false,
      };
    const PREDICTIVE_POWER_UNIT = {
      'binary': 'ROC AUC',
      'regression': 'R2',
      'categorical': 'F-1',
    };
    req.controllerData = req.controllerData || {};
    let headers = [ {
      label: '',
      sortid: 'provider',
      sortable: false,
      headerColumnProps: {
        style: {
          width: '35%',
        },
      },
    }, {
      label: {
        component: 'span',
        children: [ {
          component: 'span',
          props: {
            style: {
              marginRight: '6px',
            },
          },
          children: 'Predictive Power',
        }, {
          component: 'ResponsiveButton',
          props: {
            buttonProps: {
              className: 'question-button',
            },
            onClick: 'func:this.props.createModal',
            onclickProps: {
              pathname: '/modal/model-predictive-power',
              title: 'What Does "Predictive Power" Represent?',
            },
          },
        }, {
          component: 'span',
          props: {
            style: {
              display: 'block',
              color: styles.colors.gray,
              fontStyle: 'italic',
              fontWeight: 400,
            },
          },
          children: PREDICTIVE_POWER_UNIT[ req.controllerData.mlmodel.type ] || 'ROC AUC',
        }, ],
      },
      sortid: 'predictive_power',
      sortable: false,
      columnProps: {
        style: {
          overflow: 'visible',
        },
      },
    }, {
      label: {
        component: 'span',
        children: [ {
          component: 'span',
          props: {
            style: {
              marginRight: '6px',
            },
          },
          children: 'Accuracy Rate',
        }, {
          component: 'ResponsiveButton',
          props: {
            buttonProps: {
              className: 'question-button',
            },
            onClick: 'func:this.props.createModal',
            onclickProps: {
              pathname: '/modal/model-accuracy-rate',
              title: 'What Does "Accuracy Rate" Represent?',
            },
          },
        }, {
          component: 'span',
          props: {
            style: {
              display: 'block',
              color: styles.colors.gray,
              fontStyle: 'italic',
              fontWeight: 400,
            },
          },
          children: '% Correct',
        }, ],
      },
      sortid: 'accuracy_rate',
      sortable: false,
      headerColumnProps: {
      },
      columnProps: {
        style: {
          overflow: 'visible',
        },
      },
    }, {
      label: {
        component: 'span',
        children: [ {
          component: 'span',
          props: {
            style: {
              marginRight: '6px',
            },
          },
          children: 'Resiliency',
        }, {
          component: 'ResponsiveButton',
          props: {
            buttonProps: {
              className: 'question-button',
            },
            onClick: 'func:this.props.createModal',
            onclickProps: {
              pathname: '/modal/model-resiliency',
              title: 'What Does "Resiliency" Represent?',
            },
          },
        }, {
          component: 'span',
          props: {
            style: {
              display: 'block',
              color: styles.colors.gray,
              fontStyle: 'italic',
              fontWeight: 400,
            },
          },
          children: 'Test vs. Train',
        }, ],
      },
      sortid: 'resiliency',
      sortable: false,
      headerColumnProps: {
      },
      columnProps: {
        style: {
          overflow: 'visible',
        },
      },
    },
      model_selection_header, ];

    let rightButtons = [ {
      type: 'submit',
      value: 'SAVE',
      passProps: {
        color: 'isPrimary',
      },
      layoutProps: {
        size: 'isNarrow',
      },
      confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
        title: 'Please Confirm',
        textContent: [ {
          component: 'p',
          children: 'Confirm that you would like to change your selected model. Please note that this will take up to 15 minutes to take effect.',
          props: {
            style: {
              textAlign: 'left',
            },
          },
        }, ],
        yesButtonText: 'CONFIRM',
        noButtonText: 'CANCEL',
        yesButtonProps: {
          style: {
            margin: '5px',
          },
          buttonProps: {
            color: 'isSuccess',
          },
        },
        noButtonProps: {
          style: {
            margin: '5px',
          },
          buttonProps: {
            color: 'isDanger',
          },
        },
        buttonWrapperProps: {
          className: 'modal-footer-btns',
          style: {
            'flexDirection': 'row-reverse',
          },
        },
      }),
    }, {
      guideButton: true,
      location: references.guideLinks.models[ 'modelSelection' ],
    }, ];
    if (req.controllerData.mlmodel.updating_provider) {
      rightButtons.shift();
      headers.pop();
    }
    const mlsubtabs = (req.controllerData.mlmodel && req.controllerData.mlmodel.industry) ? mlSubTabs('model_selection', true) : mlSubTabs('model_selection');
    if (!isPremium) rightButtons.shift();
    if (req.controllerData.mlmodel.type === 'regression') headers.splice(2, 1);
    req.controllerData.mlmodel = Object.assign({}, req.controllerData.mlmodel, {
      _children: [ mlTabs('models'),
      detailAsyncTitleAndSubtitle({ type: 'mlmodel', title: true, }),
        mlsubtabs,
      {
        component: 'Container',
        props: {
          style: {},
        },
        children: [ {
          component: 'Columns',
          children: [ {
            component: 'Column',
            props: {
              size: 'isOneThird',
            },
            children: [ {
              component: 'ResponsiveForm',
              props: {
                formgroups: [ formGlobalButtonBar({
                  right: [ {
                    component: 'ResponsiveButton',
                    props: {
                      style: {
                        visibility: 'hidden',
                      },
                      buttonProps: {
                        color: 'isSuccess',
                      },
                    },
                    children: 'SPACE',
                  }, ],
                }), {
                  gridProps: {
                    key: randomKey(),
                  },
                  card: {
                    twoColumns: false,
                    props: cardprops({
                      cardTitle: 'Basic Information',
                      cardStyle: {
                        marginBottom: 0,
                      },
                    }),
                  },
                  formElements: [ {
                    label: 'Model Name',
                    name: 'display_name',
                    passProps: {
                      state: 'isDisabled',
                    },
                  }, {
                    label: 'Model Type',
                    name: 'formatted_type',
                    passProps: {
                      state: 'isDisabled',
                    },
                  }, {
                    label: 'Training Data File',
                    name: 'training_data_file',
                    passProps: {
                      state: 'isDisabled',
                    },
                  }, {
                    label: 'Created',
                    name: 'formatted_createdat',
                    passProps: {
                      state: 'isDisabled',
                    },
                  }, {
                    label: 'Updated',
                    name: 'formatted_updatedat',
                    passProps: {
                      state: 'isDisabled',
                    },
                  }, ],
                },
                ],
              },
              asyncprops: {
                formdata: [ 'mlmodeldata', 'mlmodel', ],
              },
            }, ],
          }, {
            component: 'Column',
            props: {
              size: 'isTwoThird',
            },
            children: [ {
              component: 'ResponsiveForm',
              props: {
                onChange: 'func:window.changeModelSelection',
                onSubmit: {
                  url: '/ml/api/models/:id?format=json&type=update_model_selection',
                  params: [ {
                    key: ':id',
                    val: '_id',
                  }, ],
                  options: {
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    method: 'PUT',
                    timeout: 500000,
                  },
                  successCallback: [ 'func:this.props.refresh', 'func:this.props.createNotification', ],
                  successProps: [ null, {
                    type: 'success',
                    text: 'Changes saved successfully!',
                    timeout: 10000,
                  }, ],
                },
                formgroups: [ formGlobalButtonBar({
                  left: [],
                  right: rightButtons,
                }), {
                  gridProps: {
                    key: randomKey(),
                  },
                  card: {
                    twoColumns: false,
                    props: cardprops({
                      cardTitle: 'Selected Model',
                      cardStyle: {
                        marginBottom: 0,
                      },
                    }),
                  },
                  formElements: [ {
                    type: 'layout',
                    value: {
                      component: 'div',
                      bindprops: true,
                      children: req.controllerData.mlmodel.selected_model_descriptions[ req.controllerData.mlmodel.selected_provider ],
                    },
                  }, ],
                }, {
                  gridProps: {
                    key: randomKey(),
                  },
                  card: {
                    twoColumns: false,
                    props: cardprops({
                      cardTitle: 'Model Options',
                      cardStyle: {
                        marginBottom: 0,
                      },
                    }),
                  },
                  formElements: [ {
                    type: 'datatable',
                    name: 'model_selections',
                    flattenRowData: true,
                    useInputRows: true,
                    addNewRows: false,
                    ignoreTableHeaders: [ '_id', ],
                    headers,
                  }, ],
                },
                ],
              },
              asyncprops: {
                formdata: [ 'mlmodeldata', 'mlmodel', ],
              },
            }, ],
          }, ],
        }, ],
      }, ],
    });
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function stageAnalysisChartLayout(req) {
  try {
    req.controllerData = req.controllerData || {};
    let comparisonChartLayout = mlhelpers.createComparisonChartsLayout({ idx: req.params.idx, data: {}, modeldata: req.controllerData.mlmodel, formdata: {}, params: {}, query: unflatten(req.query), scoredata: req.controllerData.score_analysis_data || null, input_analysis: req.controllerData.input_analysis || null, });
    req.controllerData._children = [ ...comparisonChartLayout, ];
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

function generateInputField(ipt, inputs) {
  let input;
  switch (ipt.data_type) {
    case 'Number':
      input = {
        name: `inputs.${ipt.title}`,
        type: 'maskedinput',
        createNumberMask: true,
        passProps: {
          mask: 'func:window.numberMaskTwo',
          guid: false,
          placeholderChar: '\u2000',
        },
        customLabel: {
          component: 'span',
          children: [ {
            component: 'span',
            children: `${ipt.title} `,
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
        customLabel: {
          component: 'span',
          children: [ {
            component: 'span',
            children: `${ipt.title} `,
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
        // value: initValue || 'true',
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
            children: `${ipt.title} `,
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
        customLabel: {
          component: 'span',
          children: [ {
            component: 'span',
            children: `${ipt.title} `,
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
        customLabel: {
          component: 'span',
          children: [ {
            component: 'span',
            children: `${ipt.title} `,
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
}

async function generateMLIndividualRunProcessPage(req) {
  try {
    let mlcaseheaders = [ {
      label: 'Date',
      sortid: 'formattedCreatedAt',
    }, {
      label: 'Decision Name',
      sortid: 'decision_name',
    }, {
      label: 'Model Name',
      sortid: 'model_name',
    }, {
      label: ' ',
      headerColumnProps: {
        style: {
          width: '40px',
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
          onclickBaseUrl: '/ml/individual/results/:id',
          onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
        },
      }, ],
    }, ];
    if (req.params.id) {
      req.controllerData = req.controllerData || {};
      const datasource = req.controllerData.datasource;
      let selected_model_variables = JSON.parse(datasource.included_columns || datasource.strategy_data_schema);
      let all_model_variables = JSON.parse(datasource.strategy_data_schema);
      selected_model_variables = Object.keys(all_model_variables).reduce((aggregate, label) => {
        if (selected_model_variables[ label ]) aggregate[ label ] = selected_model_variables[ label ];
        return aggregate;
      }, {});
      let input_variables = Object.keys(selected_model_variables).reduce((aggregate, key) => {
        if (key === 'historical_result') return aggregate;
        else return aggregate.concat([ { title: key, data_type: selected_model_variables[ key ].data_type, }, ]);
      }, []);
      let inputFields = input_variables.map(generateInputField);
      req.controllerData.pageLayout = [
        {
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            'onSubmit': {
              url: `/ml/api/individual/run/${req.params.id}?export=true`,
              'options': {
                'method': 'POST',
              },
              successCallback: 'func:this.props.createNotification',
              successProps: {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              },
              responseCallback: 'this.props.reduxRouter.push',
            },
            useFormOptions: true,
            flattenFormData: true,
            footergroups: false,
            formdata: (req.controllerData && req.controllerData.mlcase && req.controllerData.mlcase.inputs) ? { inputs: req.controllerData.mlcase.inputs, } : {},
            formgroups: [ formGlobalButtonBar({
              left: [ {
                type: 'submit',
                value: 'RUN MODEL',
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
                location: references.guideLinks.models.individualProcessing,
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
                  cardTitle: 'Model Execution',
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
                  'label': 'Model Name',
                  type: 'dropdown',
                  name: 'selected_model',
                  value: req.params.id,
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
                  },
                  customOnChange: 'func:window.individualMLModelSelection',
                  options: req.controllerData.mlmodels.map(mlmodel => ({
                    label: mlmodel.display_name,
                    value: mlmodel._id,
                  })),
                }, ...inputFields, {
                  name: 'decision_name',
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
                    // ignoreReduxProps: true,
                    props: {
                      'flattenRowData': true,
                      'addNewRows': false,
                      'rowButtons': false,
                      'useInputRows': true,
                      simplePagination: true,
                      limit: 10,
                      hasPagination: true,
                      baseUrl: '/ml/api/individual/cases?pagination=mlcases',
                      'tableSearch': true,
                      'simpleSearchFilter': true,
                      filterSearchProps: {
                        icon: 'fa fa-search',
                        hasIconRight: false,
                        className: 'global-table-search',
                        placeholder: 'SEARCH',
                      },
                      calculatePagination: true,
                      dataMap: [ {
                        'key': 'rows',
                        value: 'rows',
                      }, {
                        'key': 'numItems',
                        value: 'numItems',
                      }, {
                        'key': 'numPages',
                        value: 'numPages',
                      },
                      ],
                      ignoreTableHeaders: [ '_id', ],
                      headers: mlcaseheaders,

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
          asyncprops: {
            rows: [ 'casedata', 'rows', ],
            numItems: [ 'casedata', 'numItems', ],
            numPages: [ 'casedata', 'numPages', ],
          },
        },
      ];
    } else {
      let model_id = (req.body && req.body.selected_model) ? `/${req.body.selected_model}` : '/undefined';
      req.controllerData = req.controllerData || {};
      req.controllerData.pageLayout = [
        {
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            'onSubmit': {
              url: `/ml/api/individual/run${model_id}`,
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
                location: references.guideLinks.models.individualProcessing,
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
                  cardTitle: 'Model Execution',
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
                  'label': 'Model Name',
                  type: 'dropdown',
                  name: 'selected_model',
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
                  },
                  customOnChange: 'func:window.individualMLModelSelection',
                  options: (req.controllerData.mlmodels) ? req.controllerData.mlmodels.map(mlmodel => ({
                    label: mlmodel.display_name,
                    value: mlmodel._id,
                  })) : [],
                }, ],
                right: [ {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    // ignoreReduxProps: true,
                    props: {
                      'flattenRowData': true,
                      'addNewRows': false,
                      'rowButtons': false,
                      'useInputRows': true,
                      simplePagination: true,
                      limit: 10,
                      hasPagination: true,
                      baseUrl: '/ml/api/individual/cases?pagination=mlcases',
                      calculatePagination: true,
                      'tableSearch': true,
                      'simpleSearchFilter': true,
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
                      },
                      ],
                      ignoreTableHeaders: [ '_id', ],
                      headers: mlcaseheaders,

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
          asyncprops: {
            rows: [ 'casedata', 'rows', ],
            numItems: [ 'casedata', 'numItems', ],
            numPages: [ 'casedata', 'numPages', ],
          },
        },

      ];
    }

    req.controllerData.mlmodels = {};
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

function __generateDisabledInputElements(input) {
  return {
    'label': input.name,
    value: input.value || '',
    passProps: {
      'state': 'isDisabled',
    },
  };
}

async function generateIndividualMLResultsDetailPage(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      if (req.controllerData.mlcase) {
        let mlcase = req.controllerData.mlcase;
        let mlmodel_exists = req.controllerData.mlmodel_exists || false;
        let allInputNames = Object.keys(mlcase.inputs);
        let input_data = (allInputNames.length) ? allInputNames.map(key => ({ name: key, value: mlcase.inputs[ key ], })).map(__generateDisabledInputElements) : [];
        let left_input_data = input_data.slice(0, Math.ceil(input_data.length / 2));
        let right_input_data = input_data.slice(Math.ceil(input_data.length / 2));
        let { ai_prediction_subtitle, ai_prediction_value, ai_categorical_value, binary_value, } = transformhelpers.returnAIDecisionResultData(mlcase);
        let mlcasename = mlcase.decision_name || `Case ${mlcase.case_number}`;
        req.controllerData.data.display_title = mlcasename;
        req.controllerData.data.display_subtitle = `Decision processed using the ${mlcase.model_name} model at ${transformhelpers.formatDate(mlcase.createdat, req.user.time_zone)} by ${req.user.first_name} ${req.user.last_name}`;
        let explainability_results = req.controllerData.mlcase.explainability_results;
        let industryCard = null;
        if (mlcase.industry) {
          const digifiScore = !isNaN(parseFloat(mlcase.digifi_score)) ? mlcase.digifi_score: mlhelpers.mapPredictionToDigiFiScore(binary_value);
          const pieChart = {
            component: 'div',
            hasWindowComponent: true,
            props: {
              id: 'credit-score-container',
              _children: 'func:window.renderScorePieChart',
              data: digifiScore,
              style: {
                width: '190px',
                display: 'inline-block',
              },
              windowCompProps: {
                data: {
                  currentValue: digifiScore,
                  totalValue: 850,
                }
              },
            },
          };


          industryCard = {
            component: 'ResponsiveCard',
            props: cardprops({
              cardProps: {
                className: 'primary-card-gradient',
              },
              cardTitle: {
                component: 'div',
                children: [ {
                  component: 'span',
                  children: 'DigiFi Score',
                  props: {
                    style: {
                      paddingRight: '10px',
                    },
                  },
                }, ],
              },
              cardStyle: {
                marginRight: '10px',
                textAlign: 'center',
              },
            }),
            children: [ pieChart, {
              component: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'absolute',
                  top: 0,
                  bottom: (-40),
                  left: 0,
                  right: 0,
                }
              },
              children: [
                {
                  component: 'Title',
                  props: {
                    size: 'is3',
                    style: {
                      fontWeight: 600,
                      fontSize: '2.3em',
                    },
                  },
                  children: digifiScore,
                }, ]
            } ],
          };

        }


        let mlResultComponent = {
          component: 'Column',
          props: {
            size: 'isOneQuarter',
          },
          children: [ plainGlobalButtonBar({
            left: [ {
              component: 'ResponsiveButton',
              children: 'DOWNLOAD RESULTS',
              props: {
                'onclickBaseUrl': `/ml/api/download/case/${mlcase._id}`,
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-success',
                },
              },
            }, ].concat(mlmodel_exists ? {
              component: 'ResponsiveButton',
              children: 'REPROCESS DECISION',
              props: {
                'onclickBaseUrl': `/ml/processing/individual/${mlcase.mlmodel}?mlcase=${mlcase._id}`,
                onClick: 'func:this.props.reduxRouter.push',
                buttonProps: {
                  color: 'isSuccess',
                },
              },
            } : []),
            right: [],
          }),
            industryCard,
          {
            layoutProps: {
              style: {
                padding: 0,
                paddingRight: '15px',
              },
            },
            component: 'ResponsiveForm',
            props: {
              blockPageUI: true,
              useFormOptions: true,
              flattenFormData: true,
              footergroups: false,
              formgroups: [
                {
                  gridProps: {
                    key: randomKey(),
                  },
                  card: {
                    props: cardprops({
                      cardTitle: mlcase.industry ? 'Annual Default Rate' : 'Decision',
                      cardProps: {
                        className: 'primary-card-gradient',
                      },
                    }),
                  },
                  formElements: [
                    {
                      type: 'layout',
                      value: {
                        component: 'Column',
                        children: [ {
                          component: 'Title',
                          props: {
                            size: 'is3',
                            style: {
                              fontWeight: 600,
                              marginBottom: '30px',
                            },
                          },
                          children: [ {
                            component: 'span',
                            children: ai_prediction_value,
                          }, ],
                        }, {
                          component: 'Subtitle',
                          props: {
                            size: 'is6',
                          },
                          children: [ {
                            component: 'span',
                            children: mlcase.industry ? '' : ai_prediction_subtitle,
                          },
                          ],
                        }, ],
                      },
                    },
                  ],
                },
              ],
            },
          }, ],
        };
        let explainability_comparisons;
        let explainability_bar_data;
        let explainability_table_data;
        if (explainability_results) {
          let input_value = (typeof mlcase.original_prediction === 'number')
            ? mlcase.original_prediction
            : (mlcase.model_type === 'categorical')
              ? ai_categorical_value
              : (mlcase.model_type === 'binary')
                ? binary_value
                : ai_prediction_value;
          explainability_comparisons = Object.keys(explainability_results).reduce((aggregate, variable, i) => {
            let reassigned_mlcase = Object.assign({}, mlcase, {
              prediction: explainability_results[ variable ],
            });
            let explainability_prediction = (mlcase.model_type === 'categorical')
              ? transformhelpers.returnAIDecisionResultData(reassigned_mlcase).ai_categorical_value
              : (mlcase.model_type === 'binary')
                ? transformhelpers.returnAIDecisionResultData(reassigned_mlcase).binary_value
                : transformhelpers.returnAIDecisionResultData(reassigned_mlcase).ai_prediction_value;
            return aggregate.concat({
              variable,
              decision_impact: (mlcase.model_type === 'regression') ? Number((Number(input_value) - Number(explainability_prediction)).toFixed(2)) : Number((Number(input_value) - Number(explainability_prediction)).toFixed(4)),
            });
          }, []).sort((a, b) => b.decision_impact - a.decision_impact);
          explainability_bar_data = explainability_comparisons.map(config => {
            if (config.decision_impact >= 0) {
              return {
                name: config.variable,
                decision_impact: config.decision_impact,
                fill: '#00b050',
              };
            } else {
              return {
                name: config.variable,
                decision_impact: config.decision_impact,
                fill: '#ed6c63',
              };
            }
          });

          explainability_table_data = explainability_comparisons.map(config => {
            let average = '';
            if (mlcase.averages && mlcase.averages[ config.variable ] !== undefined && typeof Number(mlcase.averages[ config.variable ] === 'number')) {
              average = Number(mlcase.averages[ config.variable ]).toFixed(2);
            } else if (mlcase.averages && mlcase.averages[ config.variable ] !== undefined) average = mlcase.averages[ config.variable ];
            return {
              data_field: config.variable,
              input_value: (mlcase.inputs && mlcase.inputs[ config.variable ] !== undefined) ? mlcase.inputs[ config.variable ] : '',
              average,
              decision_impact: config.decision_impact,
            };
          });

          let top_positive_factors = explainability_comparisons.filter(config => config.decision_impact > 0).slice(0, 5).map((config, i) => {
            return {
              component: 'Column',
              children: [ {
                component: 'span',
                children: `${i + 1}. ${config.variable}` || '',
                style: {
                  fontWeight: 400,
                  fontSize: '14px',
                  marginBottom: '30px',
                },
              }, ],
            };
          });
          let top_negative_factors = explainability_comparisons.reverse().filter(config => config.decision_impact < 0).slice(0, 5).map((config, i) => {
            return {
              component: 'Column',
              children: [ {
                component: 'span',
                children: `${i + 1}. ${config.variable}` || '',
                style: {
                  fontWeight: 400,
                  fontSize: '14px',
                  marginBottom: '30px',
                },
              }, ],
            };
          });
          if (mlcase.industry) {
            mlResultComponent.children.push({
              component: 'ResponsiveCard',
              props: cardprops({
                cardProps: {
                  className: 'primary-card-gradient',
                },
                cardTitle: {
                  component: 'div',
                  children: [ {
                    component: 'span',
                    children: 'Top Decline Factors',
                    props: {
                      style: {
                        paddingRight: '10px',
                      },
                    },
                  }, ],
                },
                cardStyle: {
                  marginRight: '10px',
                },
              }),
              children: top_positive_factors,
            });

          } else {
            mlResultComponent.children.push({
              component: 'ResponsiveCard',
              props: cardprops({
                cardProps: {
                  className: 'primary-card-gradient',
                },
                cardTitle: {
                  component: 'div',
                  children: [ {
                    component: 'span',
                    children: 'Top Positive Factors',
                    props: {
                      style: {
                        paddingRight: '10px',
                      },
                    },
                  }, ],
                },
                cardStyle: {
                  marginRight: '10px',
                },
              }),
              children: top_positive_factors,
            });

            mlResultComponent.children.push({
              component: 'ResponsiveCard',
              props: cardprops({
                cardProps: {
                  className: 'primary-card-gradient',
                },
                cardTitle: {
                  component: 'div',
                  children: [ {
                    component: 'span',
                    children: 'Top Negative Factors',
                    props: {
                      style: {
                        paddingRight: '10px',
                      },
                    },
                  }, ],
                },
                cardStyle: {
                  marginRight: '10px',
                },
              }),
              children: top_negative_factors,
            });
          }
        }
        req.controllerData.pageLayout = (req.controllerData.mlcase.explainability_results)
          ? [
            {
              component: 'Columns',
              children: [ mlResultComponent,
                generateExplainabilityChartAndTable(mlcase.model_type, explainability_bar_data, explainability_table_data),
              ],
            },
          ]
          : [
            {
              component: 'Columns',
              children: [ mlResultComponent,
                {
                  component: 'Column',
                  props: {
                    size: 'isThreeQuarter',
                  },
                  children: [ plainGlobalButtonBar({
                    left: [],
                    right: [ {
                      guideButton: true,
                      location: references.guideLinks.models.individualProcessing,
                    },
                    ],
                  }), {
                    layoutProps: {
                      style: {
                        padding: 0,
                        paddingRight: '15px',
                      },
                    },
                    component: 'ResponsiveForm',
                    props: {
                      blockPageUI: true,
                      useFormOptions: true,
                      flattenFormData: true,
                      footergroups: false,
                      formgroups: [ {
                        gridProps: {
                          key: randomKey(),
                        },
                        card: {
                          twoColumns: true,
                          props: cardprops({
                            cardTitle: 'Input Data',
                          }),
                        },
                        formElements: [ formElements({
                          twoColumns: true,
                          doubleCard: false,
                          left: left_input_data,
                          right: right_input_data,
                        }),
                        ],
                      },
                      ],
                    },
                  }, ],
                },
              ],
            },
          ];
      } else {
        req.error = 'Could not find the matching case.';
      }
      delete req.controllerData.variableTitleMap;
      return resolve(req);
    } catch (err) {
      console.log({ err })
      return reject(err);
    }
  });
}

function generateExplainabilityChartAndTable(model_type, chartData, tableData) {

  return {
    component: 'Column',
    props: {
      size: 'isThreeQuarter',
    },
    children: [ plainGlobalButtonBar({
      left: [],
      right: [ {
        guideButton: true,
        location: references.guideLinks.models.individualProcessing,
      },
      ],
    }), {
      layoutProps: {
        style: {
          padding: 0,
          paddingRight: '15px',
        },
      },
      component: 'ResponsiveCard',
      props: cardprops({
        cardTitle: {
          component: 'div',
          children: [ {
            component: 'span',
            children: 'Decision Explanation',
            props: {
              style: {
                paddingRight: '10px',
              },
            },
          }, {
            component: 'ResponsiveButton',
            props: {
              buttonProps: {
                className: 'question-button',
              },
              onClick: 'func:this.props.createModal',
              onclickProps: {
                pathname: '/modal/decision-impact',
                title: 'What is the Decision Impact?',
              },
            },
          }, ],
        },
        cardStyle: {
          marginRight: '10px',
        },
      }),
      children: [ {
        component: 'recharts.BarChart',
        props: {
          width: 980,
          height: 500,
          maxBarSize: 100,
          barCategoryGap: '10%',
          data: chartData,
        },
        children: [
          {
            component: 'recharts.XAxis',
            hasWindowComponent: true,
            props: {
              dataKey: 'name',
              interval: 0,
              tick: 'func:window.__ra_custom_elements.CustomAxisTick',
              windowCompProps: {
                numTicks: chartData.length,
              },
            },
          }, {
            component: 'recharts.YAxis',
            hasWindowFunc: true,
            props: {
              label: {
                value: 'Impact on Result',
                angle: '-90',
                offset: 0,
                position: 'insideLeft',
              },
              allowDataOverflow: false,
              domain: [ 0, 'auto', ],
              tickFormatter: (model_type === 'regression') ? 'func:window.chartCountFormatter' : 'func:window.explainabilityChartCountFormatter',
            },
          }, {
            component: 'recharts.Tooltip',
            hasWindowFunc: true,
            props: {
              formatter: (model_type === 'regression') ? 'func:window.chartCountFormatter' : 'func:window.explainabilityChartCountFormatter',
              itemSorter: 'func:window.tooltipItemSorter',
              itemStyle: {
                margin: 0,
                padding: 0,
              },
            },
          }, {
            component: 'recharts.Bar',
            hasWindowFunc: true,
            props: {
              dataKey: 'decision_impact',
            },
          }, ],
      }, 
      // {
      //   component: 'div',
      //   props: {
      //     style: {
      //       marginTop: '100px',
      //       display: 'flex',
      //     },
      //   },
      //   children: [ {
      //     component: 'span',
      //     props: {
      //       style: {
      //         flex: 2,
      //         textAlign: 'right',
      //         fontStyle: 'italic',
      //       },
      //     },
      //     children: '<< Most Positive Factors',
      //   }, {
      //     component: 'span',
      //     props: {
      //       style: {
      //         flex: 1,
      //         textAlign: 'left',
      //       },
      //     },
      //     children: '',
      //   }, {
      //     component: 'span',
      //     props: {
      //       style: {
      //         flex: 2,
      //         textAlign: 'left',
      //         fontStyle: 'italic',
      //       },
      //     },
      //     children: 'Most Negative Factors >>',
      //   }, ],
      // }, 
      ],
    }, {
      layoutProps: {
        style: {
          padding: 0,
          paddingRight: '15px',
        },
      },
      component: 'ResponsiveCard',
      props: cardprops({
        headerStyle: {
          display: 'none',
        },
      }),
      children: [ {
        component: 'ResponsiveTable',
        props: {
          numOfLimits: 100,
          limit: 100,
          flattenRowData: true,
          useInputRows: false,
          addNewRows: false,
          hasPagination: false,
          ignoreTableHeaders: [ '_id', ],
          rows: tableData,
          headers: [
            {
              label: 'Data Field',
              sortid: 'data_field',
              sortable: false,
              headerColumnProps: {
                style: {
                  width: '20%',
                },
              },
            }, {
              label: 'Value',
              sortid: 'input_value',
              sortable: false,
              headerColumnProps: {
                style: {
                  width: '20%',
                },
              },
            }, {
              label: {
                component: 'span',
                children: [ {
                  component: 'span',
                  props: {
                    style: {
                      marginRight: '6px',
                    },
                  },
                  children: 'Average',
                }, {
                  component: 'ResponsiveButton',
                  props: {
                    buttonProps: {
                      className: 'question-button',
                    },
                    onClick: 'func:this.props.createModal',
                    onclickProps: {
                      pathname: '/modal/individual-result-average',
                      title: 'What is the Average?',
                    },
                  },
                }, ],
              },
              sortid: 'average',
              sortable: false,
              columnProps: {
                style: {
                  overflow: 'visible',
                },
              },
            }, {
              label: {
                component: 'span',
                children: [ {
                  component: 'span',
                  props: {
                    style: {
                      marginRight: '6px',
                    },
                  },
                  children: 'Decision Impact',
                }, {
                  component: 'ResponsiveButton',
                  props: {
                    buttonProps: {
                      className: 'question-button',
                    },
                    onClick: 'func:this.props.createModal',
                    onclickProps: {
                      pathname: '/modal/decision-impact',
                      title: 'What is the Decision Impact?',
                    },
                  },
                }, ],
              },
              sortid: 'decision_impact',
              sortable: false,
              columnProps: {
                style: {
                  overflow: 'visible',
                },
              },
            }, ],
        },
      }, ],
    }, ],
  };
}

function generateMLBatchRunProcessPage(req) {
  return new Promise((resolve, reject) => {
    try {
      let mlbatchheaders = [ {
        label: 'Date',
        sortid: 'formattedCreatedAt',
      }, {
        label: 'Batch Name',
        sortid: 'name',
      }, {
        label: 'Model Name',
        sortid: 'model_name',
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
        label: ' ',
        headerColumnProps: {
          style: {
            width: '40px',
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
            onclickBaseUrl: '/ml/batch/results/:id',
            onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
          },
        }, ],
      }, ];

      req.controllerData = req.controllerData || {};
      if (req.params.id) {
        req.controllerData.mlbatchPage = [
          {
            component: 'ResponsiveForm',
            props: {
              blockPageUI: true,
              'onSubmit': {
                url: '/ml/api/batch/run',
                'options': {
                  'method': 'POST',
                },
                successCallback: [ 'func:this.props.refresh', 'func:this.props.createNotification', ],
                successProps: [ null, {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                }, ],
              },
              useFormOptions: true,
              flattenFormData: true,
              footergroups: false,
              formgroups: [ formGlobalButtonBar({
                left: [ {
                  type: 'submit',
                  value: 'RUN MODEL',
                  layoutProps: {
                    size: 'isNarrow',
                  },
                  passProps: {
                    color: 'isSuccess',
                  },
                }, ],
                right: [ {
                  guideButton: true,
                  location: references.guideLinks.models.batchProcessing,
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
                    cardTitle: 'Model Execution',
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
                    'label': 'Model Name',
                    type: 'dropdown',
                    name: 'selected_model',
                    value: req.params.id,
                    passProps: {
                      selection: true,
                      fluid: true,
                      search: true,
                    },
                    customOnChange: 'func:window.batchMlModelSelection',
                    options: req.controllerData.mlmodels.map(mlmodel => ({
                      label: mlmodel.display_name,
                      value: mlmodel._id,
                    })),
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
                          'onclickBaseUrl': `/ml/api/download_ml_template/${req.params.id}?export_format=csv`,
                          aProps: {
                            style: {
                              fontWeight: 'normal',
                              color: 'inherit',
                            },
                            // className: '__ra_rb',
                            // className: '__re-bulma_button __re-bulma_is-success',
                          },
                        },
                      }, ],
                    },
                    name: 'upload_file',
                    type: 'file',
                    children: 'Source Data File',
                  }, {
                    name: 'batch_name',
                    customLabel: {
                      component: 'span',
                      children: [ {
                        component: 'span',
                        children: 'Batch Name ',
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
                      // ignoreReduxProps: true,
                      hasWindowFunc: true,
                      props: {
                        ref: 'func:window.addRef',
                        'flattenRowData': true,
                        'addNewRows': false,
                        'rowButtons': false,
                        'useInputRows': true,
                        simplePagination: true,
                        limit: 10,
                        hasPagination: true,
                        baseUrl: '/ml/api/batch/simulations?pagination=mlbatches',
                        calculatePagination: true,
                        'tableSearch': true,
                        'simpleSearchFilter': true,
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
                        },
                        ],
                        ignoreTableHeaders: [ '_id', ],
                        headers: mlbatchheaders,

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
            asyncprops: {
              rows: [ 'simulationdata', 'rows', ],
              numItems: [ 'simulationdata', 'numItems', ],
              numPages: [ 'simulationdata', 'numPages', ],
            },
          }, ];
      } else {
        req.controllerData.mlbatchPage = [
          {
            component: 'ResponsiveForm',
            props: {
              blockPageUI: true,
              'onSubmit': {
                url: '/ml/api/batch/run',
                'options': {
                  'method': 'POST',
                },
                successCallback: [ 'func:this.props.refresh', 'func:this.props.createNotification', ],
                successProps: [ null, {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                }, ],
              },
              useFormOptions: true,
              flattenFormData: true,
              footergroups: false,
              formgroups: [ formGlobalButtonBar({
                left: [],
                right: [ {
                  guideButton: true,
                  location: references.guideLinks.models.batchProcessing,
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
                    cardTitle: 'Model Execution',
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
                    'label': 'Model Name',
                    type: 'dropdown',
                    name: 'selected_model',
                    passProps: {
                      selection: true,
                      fluid: true,
                      search: true,
                    },
                    customOnChange: 'func:window.batchMlModelSelection',
                    options: (req.controllerData.mlmodels) ? req.controllerData.mlmodels.map(mlmodel => ({
                      label: mlmodel.display_name,
                      value: mlmodel._id,
                    })) : [],
                  }, ],
                  right: [ {
                    type: 'layout',
                    value: {
                      component: 'ResponsiveTable',
                      // ignoreReduxProps: true,
                      hasWindowFunc: true,

                      props: {
                        ref: 'func:window.addRef',
                        'flattenRowData': true,
                        'addNewRows': false,
                        'rowButtons': false,
                        'useInputRows': true,
                        simplePagination: true,
                        limit: 10,
                        hasPagination: true,
                        baseUrl: '/ml/api/batch/simulations?pagination=mlbatches',
                        calculatePagination: true,
                        'tableSearch': true,
                        'simpleSearchFilter': true,
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
                        },
                        ],
                        ignoreTableHeaders: [ '_id', ],
                        headers: mlbatchheaders,

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
            asyncprops: {
              rows: [ 'simulationdata', 'rows', ],
              numItems: [ 'simulationdata', 'numItems', ],
              numPages: [ 'simulationdata', 'numPages', ],
            },
          }, ];
      }
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return reject(err);
    }
  });
}

async function stageMLModelTemplateDownload(req) {
  req.controllerData = req.controllerData || {};
  let strategy_data_schema = req.controllerData.mlmodel.datasource.included_columns || req.controllerData.mlmodel.datasource.strategy_data_schema;
  let variables = (strategy_data_schema) ? Object.keys(JSON.parse(strategy_data_schema)).reduce((aggregate, key) => {
    if (key === 'historical_result') return aggregate;
    else return aggregate.concat([ key, ]);
  }, []) : [];
  req.controllerData = Object.assign({}, req.controllerData, {
    uniqueVars: variables,
    flattenedOutput: [],
  });
  return req;
}

async function generateBatchMLResultsDetailPage(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    if (req.controllerData.mlsimulation) {
      let mlsimulation = req.controllerData.mlsimulation;
      if (mlsimulation.industry) {
        req.controllerData.data.display_title = mlsimulation.name;
        const userTimeZone = (mlsimulation.user) ? mlsimulation.user.time_zone : null;
        const formattedCreatedAt = (mlsimulation.createdat) ? `${transformhelpers.formatDate(mlsimulation.createdat, userTimeZone)}` : '';
        const fullname = mlsimulation.user ? `${mlsimulation.user.first_name} ${mlsimulation.user.last_name}` : '';
        req.controllerData.data.display_subtitle = `Processed using the ${mlsimulation.model_name} model at ${formattedCreatedAt} by ${fullname}`;
        let decisions_processed_headers = [ {
          label: 'Name',
          sortid: 'decision_name',
          headerColumnProps: {
            style: {
              width: '20%'
            },
          }
        }, {
          label: 'Decision',
          sortid: 'prediction',
          headerColumnProps: {
            style: {
              width: '60%'
            },
          }
        }, {
          label: ' ',
          headerColumnProps: {
            style: {
              width: '50px',
              // width: '20%',
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
              onclickBaseUrl: '/ml/individual/results/:id',
              onclickLinkParams: [ { 'key': ':id', 'val': 'mlcase', }, ],
            },
          }, ],
        }, ];
        req.controllerData.pageLayout = [
          {
            component: 'ResponsiveForm',
            asyncprops: {
              rows: [ 'casedata', 'rows', ],
              numItems: [ 'casedata', 'numItems', ],
              numPages: [ 'casedata', 'numPages', ],
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
                      'onclickBaseUrl': `/ml/api/download/mlbatch/${mlsimulation._id.toString()}`,
                      aProps: {
                        className: '__re-bulma_button __re-bulma_is-success',
                      },
                    },
                  },
                }, {
                  type: 'layout',
                  layoutProps: {
                    size: 'isNarrow',
                    style: {},
                  },
                  value: {
                    component: 'Column',
                    props: {
                      className: 'global-search-bar',
                      style: {
                        paddingTop: 0,
                      }
                    }
                  },
                }, ],
                right: [ {
                  guideButton: true,
                  location: references.guideLinks.models.batchProcessing,
                }, ],
              }), {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  twoColumns: false,
                  props: cardprops({
                    cardTitle: 'Decisions Processed',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [ {
                  type: 'layout',
                  value: {
                    component: 'span',
                    children: 'Each column shows the probability that the event will occur.',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        marginLeft: '2px',
                        fontWeight: 'normal',
                        color: '#969696',
                      }
                    }
                  }
                },
                {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    // ignoreReduxProps: true,
                    props: {
                      'flattenRowData': true,
                      'addNewRows': false,
                      'rowButtons': false,
                      'useInputRows': true,
                      simplePagination: true,
                      'tableSearch': true,
                      'simpleSearchFilter': true,
                      filterSearchProps: {
                        icon: 'fa fa-search',
                        hasIconRight: false,
                        className: 'global-table-search',
                        placeholder: 'SEARCH',
                      },
                      limit: 10,
                      hasPagination: true,
                      baseUrl: `/ml/api/batch/results/${mlsimulation._id}/cases?format=json`,
                      calculatePagination: true,
                      dataMap: [ {
                        'key': 'rows',
                        value: 'rows',
                      }, {
                        'key': 'numItems',
                        value: 'numItems',
                      }, {
                        'key': 'numPages',
                        value: 'numPages',
                      },
                      ],
                      ignoreTableHeaders: [ '_id', ],
                      headers: decisions_processed_headers,
                    },
                    thisprops: {
                      rows: [ 'rows', ],
                      numItems: [ 'numItems', ],
                      numPages: [ 'numPages', ],
                    },
                  },
                }, ],
              },
              ],
            },
          },
        ];
      } else {
        req.controllerData.data.display_title = (mlsimulation.model_name) ? `${mlsimulation.name} - ${mlsimulation.model_name}` : mlsimulation.name;
        let decisions_processed_headers = [ {
          label: 'Decision Name',
          sortid: 'decision_name',
        }, {
          label: 'AI Prediction',
          sortid: 'prediction',
        }, {
          label: ' ',
          headerColumnProps: {
            style: {
              width: '40px',
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
              onclickBaseUrl: '/ml/individual/results/:id',
              onclickLinkParams: [ { 'key': ':id', 'val': 'mlcase', }, ],
            },
          }, ],
        }, ];
        req.controllerData.pageLayout = [ {
          component: 'ResponsiveForm',
          asyncprops: {
            rows: [ 'casedata', 'rows', ],
            numItems: [ 'casedata', 'numItems', ],
            numPages: [ 'casedata', 'numPages', ],
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
                    'onclickBaseUrl': `/ml/api/download/mlbatch/${mlsimulation._id.toString()}`,
                    aProps: {
                      className: '__re-bulma_button __re-bulma_is-success',
                    },
                  },
                },
              }, ],
              right: [ {
                guideButton: true,
                location: references.guideLinks.models.batchProcessing,
              }, ],
            }), {
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
                  cardTitle: 'Decisions Processed',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
              },
              formElements: [ formElements({
                twoColumns: true,
                doubleCard: true,
                left: [ {
                  'label': 'Batch Name',
                  value: mlsimulation.name,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, {
                  'label': 'Model Name',
                  value: mlsimulation.model_name || '',
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, {
                  'label': 'Created',
                  value: `${transformhelpers.formatDateNoTime(mlsimulation.createdat, req.user.time_zone)} by ${mlsimulation.user.first_name} ${mlsimulation.user.last_name}`,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, ],
                right: [ {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    // ignoreReduxProps: true,
                    props: {
                      'flattenRowData': true,
                      'addNewRows': false,
                      'rowButtons': false,
                      'useInputRows': true,
                      simplePagination: true,
                      'tableSearch': true,
                      'simpleSearchFilter': true,
                      filterSearchProps: {
                        icon: 'fa fa-search',
                        hasIconRight: false,
                        className: 'global-table-search',
                        placeholder: 'SEARCH',
                      },
                      limit: 10,
                      hasPagination: true,
                      baseUrl: `/ml/api/batch/results/${mlsimulation._id}/cases?format=json`,
                      calculatePagination: true,
                      dataMap: [ {
                        'key': 'rows',
                        value: 'rows',
                      }, {
                        'key': 'numItems',
                        value: 'numItems',
                      }, {
                        'key': 'numPages',
                        value: 'numPages',
                      },
                      ],
                      ignoreTableHeaders: [ '_id', ],
                      headers: decisions_processed_headers,
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
        }, ];
      }
    } else {
      req.error = 'Could not find the matching case.';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatBatchCasesTable(req) {
  try {
    if (req.controllerData.mlsimulation) {
      let formatted_ai_prediction;
      let cases = req.controllerData.mlsimulation.results.reduce((aggregate, batch) => {
        batch.results = batch.results.map(mlcase => {
          formatted_ai_prediction = transformhelpers.determineAIOutput(mlcase);
          mlcase.prediction = (formatted_ai_prediction) ? formatted_ai_prediction : '';
          return mlcase;
        });
        return aggregate.concat(batch.results);
      }, []);
      let regex_test = new RegExp(req.query.query, 'gi');
      if (req.query.query) {
        cases = cases.filter(cs => {
          const name_test = regex_test.test(cs.decision_name);
          const casenum_test = regex_test.test(cs.case_number);
          return (name_test || casenum_test);
        });
      }
      req.query.pagenum = req.query.pagenum ? Number(req.query.pagenum) : 1;
      let startIndex = 10 * (req.query.pagenum - 1);
      let endIndex = 10 * req.query.pagenum;
      let rows = utilities.helpers.mergeSort(cases, 'name').reverse().slice(startIndex, endIndex);
      req.controllerData = Object.assign({}, req.controllerData, {
        rows,
        numPages: Math.ceil(cases.length / 10),
        numItems: cases.length,
      });
    } else {
      req.controllerData = Object.assign({}, req.controllerData, {
        rows: [],
        numPages: 0,
        numItems: 0,
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatMLBatchSimulationCSV(req) {
  try {
    const positive_contributors_headers = [ 'top_positive_contributor_1', 'top_positive_contributor_2', 'top_positive_contributor_3', 'top_positive_contributor_4', 'top_positive_contributor_5', ];
    const negative_contributors_headers = [ 'top_negative_contributor_1', 'top_negative_contributor_2', 'top_negative_contributor_3', 'top_negative_contributor_4', 'top_negative_contributor_5', ];
    if (req.controllerData.batchcases) {
      let asyncJson2Csv = Bluebird.promisify(converter.json2csv, { context: converter, });
      let batchcases = req.controllerData.batchcases;
      let inputs = req.controllerData.inputs;
      let headers = Object.keys(inputs);
      let formatted_ai_prediction, ai_prediction_value;
      let exportData = batchcases.map(mlcase => {
        let top_contributor_data = {};
        let { ai_prediction_value, ai_categorical_value, binary_value, } = transformhelpers.returnAIDecisionResultData(mlcase);
        let explainability_results = mlcase.explainability_results;
        let explainability_comparisons;
        if (explainability_results) {
          let input_value = (mlcase.model_type === 'categorical')
            ? ai_categorical_value
            : (mlcase.model_type === 'binary')
              ? binary_value
              : ai_prediction_value;

          explainability_comparisons = Object.keys(explainability_results).reduce((aggregate, variable, i) => {
            let reassigned_mlcase = Object.assign({}, mlcase, {
              prediction: explainability_results[ variable ],
            });
            let explainability_prediction = (mlcase.model_type === 'categorical')
              ? transformhelpers.returnAIDecisionResultData(reassigned_mlcase).ai_categorical_value
              : (mlcase.model_type === 'binary')
                ? transformhelpers.returnAIDecisionResultData(reassigned_mlcase).binary_value
                : transformhelpers.returnAIDecisionResultData(reassigned_mlcase).ai_prediction_value;
            return aggregate.concat({
              variable,
              decision_impact: (mlcase.model_type === 'regression') ? Number((Number(input_value) - Number(explainability_prediction)).toFixed(2)) : Number((Number(input_value) - Number(explainability_prediction)).toFixed(4)),
            });
          }, []).sort((a, b) => b.decision_impact - a.decision_impact);
          explainability_comparisons.filter(config => config.decision_impact > 0).slice(0, 5).forEach((config, i) => {
            top_contributor_data[ `top_positive_contributor_${i + 1}` ] = config.variable;
          });
          explainability_comparisons.reverse().filter(config => config.decision_impact < 0).slice(0, 5).forEach((config, i) => {
            top_contributor_data[ `top_negative_contributor_${i + 1}` ] = config.variable;
          });
        }
        formatted_ai_prediction = transformhelpers.determineAIOutput(mlcase);
        mlcase.inputs[ 'decision_name' ] = mlcase.decision_name;
        return Object.assign({}, mlcase.inputs, { ai_prediction: formatted_ai_prediction, }, top_contributor_data);
      });
      headers.unshift('ai_prediction');
      headers.unshift('decision_name');
      headers.push(...positive_contributors_headers, ...negative_contributors_headers);
      const csv_options = {
        emptyFieldValue: '',
        keys: headers,
        delimiter: {
          wrap: '"', // Double Quote (") character
          // field : ',', // Comma field delimiter
          array: ';', // Semicolon array value delimiter
          // eol   : '\n' // Newline delimiter
        },
        checkSchemaDifferences: false,
      };
      let csv = await asyncJson2Csv(exportData, csv_options);
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

async function setModelIdFromURL(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.mlmodel = req.controllerData.mlmodel || {};
    let refererArr = req.headers.referer.split('/');
    let models_idx = refererArr.indexOf('models');
    req.params.id = refererArr.slice(models_idx)[ 1 ];
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function filterCompleteModels(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.mlmodels = req.controllerData.mlmodels || [];
    if (req.controllerData.mlmodels.length) {
      req.controllerData.mlmodels = req.controllerData.mlmodels.filter(mlmodel => (mlmodel.status && mlmodel.status.toLowerCase() === 'complete'));
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatMLResponse(req) {
  req.controllerData = req.controllerData || {};
  let body = req.body;
  let mlcase = req.controllerData.single_ml_result;
  let { ai_prediction_subtitle, ai_prediction_value, ai_categorical_value, binary_value, } = transformhelpers.returnAIDecisionResultData(mlcase);
  let response = Object.assign({}, {
    client_id: body.client_id,
    status_code: 200,
    status_message: 'Success',
    request_date: JSON.parse(JSON.stringify(req._startTime)),
    response_date: JSON.parse(JSON.stringify(new Date())),
    request_id: mlcase.request_id,
    client_transaction_id: (req.body.client_transaction_id) ? `${req.body.client_transaction_id}` : undefined,
    model_name: req.body.model_name,
    digifi_score: mlcase.digifi_score || null,
    decision: (mlcase.model_type === 'binary')
      ? binary_value : (mlcase.model_type === 'categorical') ? ai_prediction_value : Number(ai_prediction_value),
  });
  if (req.body.return_input_variables) response.inputs = req.body.original_inputs;
  let explainability_results = mlcase.explainability_results;
  if (req.body.return_top_contributors) {
    let explainability_comparisons;
    if (explainability_results) {
      let input_value = (typeof mlcase.original_prediction === 'number')
        ? mlcase.original_prediction
        : (mlcase.model_type === 'categorical')
          ? ai_categorical_value
          : (mlcase.model_type === 'binary')
            ? binary_value
            : ai_prediction_value;

      explainability_comparisons = Object.keys(explainability_results).reduce((aggregate, variable, i) => {
        let reassigned_mlcase = Object.assign({}, mlcase, {
          prediction: explainability_results[ variable ],
        });
        let explainability_prediction = (mlcase.model_type === 'categorical')
          ? transformhelpers.returnAIDecisionResultData(reassigned_mlcase).ai_categorical_value
          : (mlcase.model_type === 'binary')
            ? transformhelpers.returnAIDecisionResultData(reassigned_mlcase).binary_value
            : transformhelpers.returnAIDecisionResultData(reassigned_mlcase).ai_prediction_value;
        return aggregate.concat({
          variable,
          decision_impact: (mlcase.model_type === 'regression') ? Number((Number(input_value) - Number(explainability_prediction)).toFixed(2)) : Number((Number(input_value) - Number(explainability_prediction)).toFixed(4)),
        });
      }, []).sort((a, b) => b.decision_impact - a.decision_impact);
      let positive_contributors = explainability_comparisons.filter(config => config.decision_impact > 0);
      let negative_contributors = explainability_comparisons.reverse().filter(config => config.decision_impact < 0);
      response.top_positive_contributors = positive_contributors.slice(0, 5).reduce((aggregate, config, i) => {
        aggregate[ i + 1 ] = config.variable;
        return aggregate;
      }, {});
      response.top_negative_contributors = negative_contributors.slice(0, 5).reduce((aggregate, config, i) => {
        aggregate[ i + 1 ] = config.variable;
        return aggregate;
      }, {});
    }
  }
  if (response instanceof Error) {
    req.error = response;
  } else {
    req.controllerData.results = response;
  }
  return req;
}

async function checkIfDuplicateNameAndOrg(req) {
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : (user && user.association && user.association.organization) ? user.association.organization.toString() : 'organization';
    const INCOMPLETE_STATUSES = [ 'select_type', 'provide_historical_data', ];
    let name = req.body.name.toLowerCase().replace(/\s+/g, '_');
    let mlmodel = await MLModel.load({ query: { name, organization, }, });
    mlmodel = (mlmodel && mlmodel.toJSON) ? mlmodel.toJSON() : mlmodel;
    if (mlmodel) {
      if (INCOMPLETE_STATUSES.includes(mlmodel.status)) {
        await MLModel.delete({ deleteid: mlmodel._id.toString(), });
      } else {
        req.error = 'Model Name already exists in this organization. Please change the model name to proceed.';
      }
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function stageMLRequest(req) {
  req.controllerData = req.controllerData || {};
  req.body.inputs = Object.assign({}, req.body.inputs);
  req.body.original_inputs = Object.assign({}, req.body.inputs);
  for (var input in req.body.inputs) {
    if (req.body.inputs[ input ] === null) {
      req.body.inputs[ input ] = null;
    } else if (typeof req.body.inputs[ input ] !== 'string') {
      req.body.inputs[ input ] = String(req.body.inputs[ input ]);
    }
  }
  return req;
}

async function stageBatchMLRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.body.stringified_global_variables = Object.assign({}, req.body.global_variables);
    for (var input in req.body.global_variables) {
      if (req.body.global_variables[ input ] === null) {
        req.body.global_variables[ input ] = null;
      } else if (typeof req.body.global_variables[ input ] !== 'string') {
        req.body.stringified_global_variables[ input ] = String(req.body.global_variables[ input ]);
      }
    }
    if (!req.body.variables) req.body.variables = [];
    if (!Array.isArray(req.body.variables)) req.body.variables = [ req.body.variables, ];
    req.body.stringified_variables = req.body.variables.map(config => {
      let new_config = Object.assign({}, config);
      Object.keys(new_config).forEach(input => {
        if (new_config[ input ] === null) {
          new_config[ input ] = null;
        } else if (typeof new_config[ input ] !== 'string') {
          new_config[ input ] = String(new_config[ input ]);
        }
      });
      return new_config;
    });
    return req;
  } catch (e) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xml = jsonToXML(e);
      if (xml instanceof Error) {
        req.error = xml.message;
        return req;
      }
    }
    req.error = e.message;
    return req;
  }
}

module.exports = {
  checkIfDuplicateNameAndOrg,
  generatePredictorVariableStatistics,
  formatDataTypeColumns,
  formatMLResponse,
  countColumnUniqueValues,
  // splitAndFormatDataSource,
  generateIndividualMLResultsDetailPage,
  generateInputDataForm,
  generateModelSelectionForm,
  filterCompleteModels,
  formatDataFields,
  formatModelIndexRows,
  formatModelSelectionPage,
  setDefaultModelType,
  setModelIdFromURL,
  setModelHeader,
  stageAnalysisChartLayout,
  stageModelSelection,
  stageMLModelTemplateDownload,
  generateMLIndividualRunProcessPage,
  generateMLBatchRunProcessPage,
  generateBatchMLResultsDetailPage,
  formatBatchCasesTable,
  formatMLBatchSimulationCSV,
  stageMLRequest,
  stageBatchMLRequest,
};