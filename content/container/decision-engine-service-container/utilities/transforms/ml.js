'use strict';
const periodic = require('periodicjs');
const capitalize = require('capitalize');
const numeral = require('numeral');
const qs = require('query-string');
const moment = require('moment');
const ml = require('ml');
const CONSTANTS = require('../constants');
const references = require('../views/constants/references');
const transformhelpers = require('../transformhelpers');
const view_utilities = require('../views');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const styles = view_utilities.constants.styles;
const shared = view_utilities.shared;
const cardprops = shared.props.cardprops;
const math = require('mathjs');
const jStat = require('jStat');
const {
  analysisCharts,
  scoreAnalysisCharts,
  inputAnalysisCharts,
  analysisFilter,
  inputAnalysisFilter,
  scoreAnalysisFilter,
  mlTabs,
  mlSubTabs,
} = view_utilities.ml.components;
const detailAsyncTitleAndSubtitle = shared.component.layoutComponents.detailAsyncTitleAndSubtitle;

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
    return null;
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

// function _generateNavButton(configuration, index, id, currentIndex) {
//   return {
//     component: 'Semantic.MenuItem',
//     props: {
//       className: 'fitted item',
//     },
//     children: [ {
//       component: 'Semantic.AccordionContent',
//       children: [ {
//         component: 'div',
//         props: {
//           className: `nav-link${(index == currentIndex) ? ' active-nav-link' : ''}`,
//         },
//         children: [ {
//           component: 'a',
//           children: configuration.subsection_title,
//           props: {
//             href: `/ml/models/${id}/comparison_charts/${index}`,
//           },
//         } ]
//       } ]
//     } ]
//   };
// }

function _generateNavButton(configuration, index, id, currentIndex) {
  return {
    children: configuration.subsection_title,
    location: `/ml/models/${id}/comparison_charts/${index}`,
    active: (currentIndex == index) ? true : false,
  };
}

function generateNavBar({ configurations, type, id, currentIndex, page, }) {
  let navbuttons = configurations.map((configuration) => {
    return _generateNavButton(configuration, configuration.index, id, currentIndex);
  });
  let binaryData = {
    titles: [ 'Predictive Power', 'Accuracy Rate', 'Resiliency', 'Distributions', ],
    buttons: [ navbuttons.slice(0, 3), navbuttons.slice(3, 5), navbuttons.slice(5, 7), navbuttons.slice(7), ],
  };
  let regressionData = {
    titles: [ 'Predictive Power', 'Resiliency', 'Distributions', ],
    buttons: [ navbuttons.slice(0, 2), navbuttons.slice(2, 4), navbuttons.slice(4), ],
  };
  let categoricalData = {
    titles: [ 'Predictive Power', 'Accuracy Rate', 'Resiliency', 'Distributions', ],
    buttons: [ navbuttons.slice(0, 1), navbuttons.slice(2, 3), navbuttons.slice(4, 5), navbuttons.slice(6, 8), ],
  };

  return {
    component: 'div',
    hasWindowComponent: 'true',
    props: {
      _children: 'func:window.__ra_custom_elements.CustomNavBar',
      windowCompProps: {
        navData: (type === 'binary')
          ? binaryData
          : (type === 'regression')
            ? regressionData
            : (type === 'categorical')
              ? categoricalData
              : null,
      },
    },
  };
}

function _generateScoreAnalysisNavButton(configuration, index, id, currentIndex) {
  return {
    children: configuration.subsection_title,
    location: `/ml/models/${id}/score_analysis/${index}`,
    active: (currentIndex == index) ? true : false,
  };
}

function generateScoreAnalysisNavBar({ configurations, type, id, currentIndex, }) {
  let navbuttons = configurations.map((configuration) => {
    return _generateScoreAnalysisNavButton(configuration, configuration.index, id, currentIndex);
  });
  const configurationsLength = configurations.length;
  let scoreAnalysisData = {
    titles: [ 'Distributions', 'Default Rates', 'Model Drivers', 'Comparison Score', 'Projections', ],
    buttons: [ navbuttons.slice(0, 2), navbuttons.slice(2, 7), navbuttons.slice(7, configurationsLength - 3), navbuttons.slice(configurationsLength - 3, configurationsLength - 1), navbuttons.slice(configurationsLength - 1), ],
  };

  return {
    component: 'div',
    hasWindowComponent: 'true',
    props: {
      _children: 'func:window.__ra_custom_elements.CustomNavBar',
      windowCompProps: {
        navData: scoreAnalysisData,
      },
    },
  };
}

function _generateInputAnalysisNavButton(configuration, index, id, currentIndex) {
  return {
    children: configuration.subsection_title,
    location: `/ml/models/${id}/input_analysis/${index}`,
    active: (currentIndex == index) ? true : false,
  };
}

function generateInputAnalysisNavBar({ configurations, type, id, currentIndex, }) {
  let navbuttons = configurations.map((configuration) => {
    return _generateInputAnalysisNavButton(configuration, configuration.index, id, currentIndex);
  });

  let inputAnalysisData = {
    titles: [ 'Total Loan Volume', 'Percent of Loan Volume', 'Population Analysis', 'Cumulative Default Time Series', ],
    buttons: [ navbuttons.slice(0, 2), navbuttons.slice(2, 4), navbuttons.slice(4, 8), navbuttons.slice(8, 10), ],
  };

  return {
    component: 'div',
    hasWindowComponent: 'true',
    props: {
      _children: 'func:window.__ra_custom_elements.CustomNavBar',
      windowCompProps: {
        navData: inputAnalysisData,
      },
    },
  };
}

function generateFilterDropdowns({ configuration, data, modeldata, formdata, params, query, input_analysis, }) {
  let chartFilter, options;
  if (query.page === 'score_analysis') {
    chartFilter = scoreAnalysisFilter;
    options = { configuration, data, modeldata, formdata, params, query, };
  } else if (query.page === 'input_analysis') {
    chartFilter = inputAnalysisFilter;
    options = { configuration, data, modeldata, formdata, params, query, input_analysis, };
  } else {
    chartFilter = analysisFilter;
    options = { configuration, data, modeldata, formdata, params, query, };
  }
  if (Array.isArray(configuration.filters)) {
    try {
      return configuration.filters.map(filter => chartFilter[ filter ](options));
    } catch (e) {
      return e;
    }
  } else {
    return [];
  }
}

function generateCharts(options) {
  // let table = generateTables({ configuration, data, modeldata, formdata, });
  // let csv_export_button = generateCsvExportButton({ configuration, model_id: modeldata._id, formdata, });
  const configuration = options.configuration;
  let filter_dropdowns = generateFilterDropdowns(options);
  const _children = (options.query.page === 'score_analysis')
    ? scoreAnalysisCharts[ configuration.chartFunc ](options)
    : (options.query.page === 'input_analysis')
      ? inputAnalysisCharts[ configuration.chartFunc ](options)
      : analysisCharts[ configuration.chartFunc ](options);
  return {
    component: 'ResponsiveCard',
    ignoreReduxProps: true,
    props: cardprops({
      cardTitle: configuration.cardTitle,
      cardStyle: {
        maxWidth: 'calc(100% - 19rem - 10px)',
      },
    }),
    children: [ {
      component: 'p',
      props: {
        style: {
          fontWeight: 'normal',
          color: '#969696',
        },
      },
      children: configuration.description || '',
    },
    ...filter_dropdowns,
    {
      component: 'div',
      props: {
        style: {
          overflow: 'auto',
          marginTop: '20px',
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
            _children,
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

function downloadButtonDropdown({ query, configuration, params, modeldata, providers, }) {
  query = Object.assign({}, query, { export_format: 'csv', index: (configuration) ? configuration.index : null, });
  let querystring = qs.stringify(query);
  const downloadDropdowns = {
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
            'onclickBaseUrl': `/ml/api/models/${modeldata._id.toString()}/download_batch_results/training`,
            aProps: {
              token: true,
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
            'onclickBaseUrl': `/ml/api/models/${modeldata._id.toString()}/download_batch_results/testing`,
            aProps: {
              token: true,
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
  };

  if (query && query.page === 'input_analysis' || query.page === 'score_analysis') {
    downloadDropdowns.children[0].children.push({
      component: 'Semantic.Item',
      props: {
        onSubmit: null,
      },
      children: [ {
        component: 'ResponsiveButton',
        children: 'Chart Data',
        bindprops: true,
        props: {
          'onclickBaseUrl': `/ml/api/models/${modeldata._id.toString()}/download_chart_data?${querystring}`,
          aProps: {
            token: true,
            className: '__re-bulma_button __re-bulma_is-primary',
            style: {
              marginRight: '15px',
            },
          },
        },
      }, ],
    }, );
  }

  return downloadDropdowns;
}

function createComparisonChartsLayout(options) {
  try {
    let { idx, modeldata, formdata, params, query, currentIndex, input_analysis, scoredata, } = options;
    let configurations = (query.page === 'score_analysis' || query.page === 'input_analysis') ? CONSTANTS[ query.page ][ modeldata.type ][ modeldata.industry ] : CONSTANTS.ML[ modeldata.type ];
    if (query.page === 'score_analysis') {
      const strategyDataSchemaKeys = Object.keys(JSON.parse(modeldata.datasource.strategy_data_schema)).filter(variable => variable !== 'historical_result');
      configurations = configurations.concat(strategyDataSchemaKeys.map((variable, idx) => {
        return {
          subsection: 'model_drivers',
          subsection_title: variable,
          section: 'model_drivers',
          section_title: 'Model Drivers',
          unit: 'count',
          description: '',
          cardTitle: `Model Drivers - ${variable}`,
          chartFunc: '_getModelDriverChart',
          filters: [ '_getProviderFilter', '_getDataSourceTypeFilter', '_getDistributionGranularityFilter', '_getMinimumScoreFilter', ],
          index: configurations.length + idx,
        };
      }));

      const comparisonScoreConfigurations = [ {
        subsection: 'comparison_score',
        subsection_title: 'Predictive Power',
        section: 'comparison_score',
        section_title: 'Model Drivers',
        unit: 'percentage',
        description: '',
        cardTitle: 'Comparison Score - Predictive Power',
        chartFunc: '_getPredictivePowerChart',
        filters: [ '_getProviderFilter', '_getDataSourceTypeFilter', ],
        index: null,
      }, {
        subsection: 'comparison_score',
        subsection_title: 'Average Score',
        section: 'comparison_score',
        section_title: 'Model Drivers',
        unit: 'count',
        description: '',
        cardTitle: 'Comparison Score - Average Score',
        chartFunc: '_getAverageScoreChart',
        filters: [ '_getProviderFilter', '_getDataSourceTypeFilter', '_getMinimumScoreFilter', ],
        index: null,
      }, ];
      const projectionsConfiguration = [ {
        subsection: 'projections',
        subsection_title: 'Projected Annual Default Rate',
        section: 'projections',
        section_title: 'Projections',
        unit: 'percentage',
        description: '',
        cardTitle: 'Projected Annual Default Rate',
        chartFunc: '_getProjectedAnnualDefaultRateChart',
        filters: [ '_getProviderFilter', '_getDataSourceTypeFilter', '_getMinimumScoreFilter', '_yAxisAutoScalingFilter', ],
        index: null,
      }, ];
      configurations.push(...comparisonScoreConfigurations.concat(projectionsConfiguration).map((config, i) => {
        config.index = configurations.length + i;
        return config;
      }));
    }
    let current_config = configurations[ idx ];
    let data = [];
    let aws_models = modeldata.aws_models || [];
    let digifi_models = modeldata.digifi_models || [];
    aws_models = aws_models.filter(model_name => model_name !== modeldata.selected_provider);
    digifi_models = digifi_models.filter(model_name => model_name !== modeldata.selected_provider);
    const all_training_models = [ modeldata.selected_provider, ...aws_models, ...digifi_models, ].length ? [ modeldata.selected_provider, ...aws_models, ...digifi_models, ] : [ 'aws', 'sagemaker_ll', 'sagemaker_xgb', ];
    const providers = all_training_models.filter(model_name => modeldata[ model_name ] && (modeldata[ model_name ].status === 'complete' || modeldata[ model_name ].status === 'completed'));
    let download_buttons = downloadButtonDropdown({ query, configuration: current_config, params, modeldata, providers, });
    let navbar = (query.page === 'score_analysis')
      ? generateScoreAnalysisNavBar({ configurations, type: modeldata.type, id: modeldata._id.toString(), currentIndex: idx, })
      : (query.page === 'input_analysis')
        ? generateInputAnalysisNavBar({ configurations, type: modeldata.type, id: modeldata._id.toString(), currentIndex: idx, })
        : generateNavBar({ configurations, type: modeldata.type, id: modeldata._id.toString(), currentIndex: idx, });
    let charts = generateCharts({ configuration: current_config, data, modeldata, formdata, params, providers, query, input_analysis, scoredata, });
    const mlsubtabs = (modeldata && modeldata.industry) ? mlSubTabs(`${query.page}/0`, true) : mlSubTabs(`${query.page}/0`);
    return [
      mlTabs('models'),
      detailAsyncTitleAndSubtitle({ type: 'mlmodel', title: true, }),
      mlsubtabs,
      {
        component: 'Container',
        props: {
          style: {},
        },
        children: [ {
          component: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '20px',
            },
          },
          children: [
            download_buttons,
            {
              component: 'a',
              children: [ {
                component: 'span',
                children: 'GUIDE',
              }, {
                component: 'Icon',
                props: {
                  icon: 'fa fa-external-link',
                },
              }, ],
              props: {
                href: references.guideLinks.models.evaluation,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: '__re-bulma_button __re-bulma_is-primary',
              },
            },
          ],
        }, {
          component: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'flex-start',
            },
          },
          children: [
            navbar,
            charts,
          ],
        }, ],
      }, ];
  } catch (e) {
    console.log({ e, });
  }
}


function returnMLPredictionValue(mlcase) {
  let ai_prediction_value;
  if (mlcase.provider === 'sagemaker_ll') {
    if (mlcase.model_type === 'binary' && mlcase.prediction && mlcase.prediction.predictions) {
      ai_prediction_value = mlcase.prediction.predictions[ 0 ].score;
      ai_prediction_value = Number(ai_prediction_value);
    } else if (mlcase.model_type === 'regression' && mlcase.prediction && mlcase.prediction.predictions) {
      ai_prediction_value = mlcase.prediction.predictions[ 0 ].score.toFixed(2);
      ai_prediction_value = Number(ai_prediction_value);
    } else if (mlcase.model_type === 'categorical' && mlcase.prediction && mlcase.prediction.predictions) {
      let predicted_label = mlcase.prediction.predictions[ 0 ].predicted_label;
      ai_prediction_value = (mlcase.decoder && mlcase.decoder.historical_result && mlcase.decoder.historical_result[ predicted_label ]) ? mlcase.decoder.historical_result[ predicted_label ] : predicted_label;
    } else {
      ai_prediction_value = null;
    }
  } else if (mlcase.provider === 'sagemaker_xgb') {
    if (mlcase.model_type === 'binary' && mlcase.prediction) {
      ai_prediction_value = mlcase.prediction;
      ai_prediction_value = Number(ai_prediction_value);
    } else if (mlcase.model_type === 'regression' && mlcase.prediction) {
      ai_prediction_value = Number(mlcase.prediction.toFixed(2));
    } else if (mlcase.model_type === 'categorical' && mlcase.prediction && Array.isArray(mlcase.prediction)) {
      let predicted_label = mlcase.prediction.indexOf(Math.max(...mlcase.prediction));
      ai_prediction_value = (mlcase.decoder && mlcase.decoder.historical_result && mlcase.decoder.historical_result[ predicted_label ]) ? mlcase.decoder.historical_result[ predicted_label ] : predicted_label;
    } else {
      ai_prediction_value = null;
    }
  } else {
    if (mlcase.prediction && mlcase.prediction[ 'Prediction' ] && mlcase.model_type === 'binary') {
      ai_prediction_value = mlcase.prediction[ 'Prediction' ][ 'predictedScores' ][ mlcase.prediction[ 'Prediction' ][ 'predictedLabel' ] ];
      ai_prediction_value = Number(ai_prediction_value);
    } else if (mlcase.prediction && mlcase.prediction[ 'Prediction' ] && mlcase.model_type === 'regression') {
      ai_prediction_value = (mlcase.prediction[ 'Prediction' ][ 'predictedValue' ] && Number(mlcase.prediction[ 'Prediction' ][ 'predictedValue' ])) ? Number(mlcase.prediction[ 'Prediction' ][ 'predictedValue' ]).toFixed(2) : mlcase.prediction[ 'Prediction' ][ 'predictedValue' ];
    } else if (mlcase.prediction && mlcase.prediction[ 'Prediction' ] && mlcase.model_type === 'categorical') {
      ai_prediction_value = mlcase.prediction[ 'Prediction' ][ 'predictedLabel' ];
    } else {
      ai_prediction_value = null;
    }
  }

  return ai_prediction_value;
}

function _includeColumn(header, datasource, strategy_data_schema, statistics, included_columns) {
  if (included_columns) return included_columns[ header ] ? true : false;
  if (header === 'historical_result') return true;
  if (datasource.column_unique_counts && datasource.column_unique_counts[ header ] && datasource.column_unique_counts[ header ] > 100) return false;
  if (datasource.column_unique_counts && datasource.column_unique_counts[ header ] && (datasource.column_unique_counts[ header ] * 100) > datasource.observation_count) return false;
  if (statistics[ header ] && typeof statistics[ header ].r2 === 'number' && statistics[ header ].r2 < 0.001) return false;
  return true;
}

function _buildLookupMap(map, feature_class, idx) {
  map.lookup_by_class[ feature_class ] = idx;
  map.lookup_by_index[ idx ] = feature_class;
  return map;
}


function runChiSquaredTest(feature_one, feature_two) {
  try {
    if (feature_one.length !== feature_two.length) return new Error('Length of both features needs to match');
    const datarow_count = feature_one.length;
    //unique feature classes
    const feature_one_unique_set = new Set(feature_one);
    const feature_two_unique_set = new Set(feature_two);
    //create lookup table by index and class
    const feature_one_map = Array.from(feature_one_unique_set).reduce(_buildLookupMap, { lookup_by_index: {}, lookup_by_class: {}, });
    const feature_two_map = Array.from(feature_two_unique_set).reduce(_buildLookupMap, { lookup_by_index: {}, lookup_by_class: {}, });
    //create dummy array for counting total
    let tally = math.zeros(feature_one_unique_set.size, feature_two_unique_set.size).toArray();
    let feature_one_count_by_idx = new Array(feature_one_unique_set.size).fill(0);
    let feature_two_count_by_idx = new Array(feature_two_unique_set.size).fill(0);
    let subtotal = 0;
    //count how many times the features occured
    for (let i = 0; i < datarow_count; i++) {
      let feature_one_value = feature_one[ i ];
      let feature_two_value = feature_two[ i ];
      let x = feature_one_map.lookup_by_class[ feature_one_value ];
      let y = feature_two_map.lookup_by_class[ feature_two_value ];
      tally[ x ][ y ]++;
      feature_one_count_by_idx[ x ]++;
      feature_two_count_by_idx[ y ]++;
      subtotal++;
    }
    //refer to formula for the chi-square statistic
    let chisquared = tally.reduce((chi_squared, x_row, i) => {
      x_row.forEach((observed, j) => {
        let expected = (feature_one_count_by_idx[ i ] * feature_two_count_by_idx[ j ]) / subtotal;
        chi_squared += ((observed - expected) ** 2) / expected;
      });
      return chi_squared;
    }, 0);
    const k = Math.min(feature_one_unique_set.size, feature_two_unique_set.size);
    //cramers v is preferred since contingency coefficient has mathematical drawbacks for non square tables.
    const cramers_v = Math.sqrt(chisquared / (datarow_count * (k - 1)));
    return { chi2: chisquared, cramers_v, };
  } catch (e) {
    return null;
  }
}

function runPointBiserialCorrelation(categorical_feature, numeric_feature, mean) {
  try {
    let metrics = [];
    let classes = new Set(categorical_feature);
    let numRows = categorical_feature.length;
    for (let element of classes.values()) {
      let scoreOne = 0;
      let countOne = 0;
      let scoreZero = 0;
      let countZero = 0;
      let metric = {};
      for (let i = 0; i < categorical_feature.length; i++) {
        let isClass = (categorical_feature[ i ] === element) ? 1 : 0;
        if (isClass) {
          scoreOne += numeric_feature[ i ];
          countOne++;
        } else {
          scoreZero += numeric_feature[ i ];
          countZero++;
        }
      }
      metric.Mp = scoreOne / countOne;
      metric.Mq = scoreZero / countZero;
      metric.p = countOne / numRows;
      metric.q = countZero / numRows;
      metric.St = math.std(numeric_feature);
      metric.r = ((metric.Mp - metric.Mq) / metric.St) * Math.sqrt(metric.p * metric.q);
      metrics.push(metric);
    }
    let total = math.sum(metrics.map(mt => Math.abs(mt.r)));
    let avg_r = total / classes.size;
    return avg_r;
  } catch (e) {
    return null;
  }
}


function mapPredictionToDigiFiScore(prediction) {
  switch (true) {
    case (prediction < 0.002):
      return 850;
    case (prediction < 0.004):
      return 840;
    case (prediction < 0.006):
      return 830;
    case (prediction < 0.008):
      return 820;
    case (prediction < 0.01):
      return 810;
    case (prediction < 0.015):
      return 800;
    case (prediction < 0.02):
      return 790;
    case (prediction < 0.025):
      return 780;
    case (prediction < 0.03):
      return 770;
    case (prediction < 0.035):
      return 760;
    case (prediction < 0.045):
      return 750;
    case (prediction < 0.055):
      return 740;
    case (prediction < 0.065):
      return 730;
    case (prediction < 0.075):
      return 720;
    case (prediction < 0.085):
      return 710;
    case (prediction < 0.1):
      return 700;
    case (prediction < 0.115):
      return 690;
    case (prediction < 0.13):
      return 680;
    case (prediction < 0.145):
      return 670;
    case (prediction < 0.16):
      return 660;
    case (prediction < 0.175):
      return 650;
    case (prediction < 0.19):
      return 640;
    case (prediction < 0.205):
      return 630;
    case (prediction < 0.22):
      return 620;
    case (prediction < 0.235):
      return 610;
    case (prediction < 0.255):
      return 600;
    case (prediction < 0.275):
      return 590;
    case (prediction < 0.295):
      return 580;
    case (prediction < 0.315):
      return 570;
    case (prediction < 0.335):
      return 560;
    case (prediction < 0.355):
      return 550;
    case (prediction < 0.375):
      return 540;
    case (prediction < 0.395):
      return 530;
    case (prediction < 0.415):
      return 520;
    case (prediction < 0.435):
      return 510;
    case (prediction < 0.46):
      return 500;
    case (prediction < 0.485):
      return 490;
    case (prediction < 0.51):
      return 480;
    case (prediction < 0.535):
      return 470;
    case (prediction < 0.56):
      return 460;
    case (prediction < 0.585):
      return 450;
    case (prediction < 0.61):
      return 440;
    case (prediction < 0.635):
      return 430;
    case (prediction < 0.66):
      return 420;
    case (prediction < 0.685):
      return 410;
    case (prediction < 0.715):
      return 300;
    case (prediction < 0.745):
      return 390;
    case (prediction < 0.775):
      return 380;
    case (prediction < 0.805):
      return 370;
    case (prediction < 0.835):
      return 360;
    case (prediction < 0.865):
      return 350;
    case (prediction < 0.895):
      return 340;
    case (prediction < 0.925):
      return 330;
    case (prediction < 0.955):
      return 320;
    case (prediction < 0.985):
      return 310;
    case (prediction <= 1):
      return 300;
    default:
      return 300;
  }
}

module.exports = {
  generate_linear_function_evaluator,
  generate_polynomial_function_evaluator,
  generate_power_function_evaluator,
  generate_exponential_function_evaluator,
  createComparisonChartsLayout,
  returnMLPredictionValue,
  _includeColumn,
  runChiSquaredTest,
  runPointBiserialCorrelation,
  mapPredictionToDigiFiScore,
  downloadButtonDropdown,
};