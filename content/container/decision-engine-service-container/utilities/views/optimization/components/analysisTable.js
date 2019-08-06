'use strict';
const numeral = require('numeral');
const CONSTANTS = require('../../../constants');
const capitalize = require('capitalize');

function _getDataSourceTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let headers = (configuration.unit === 'count') ? [{
    label: ' ',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Training Data',
    sortid: 'training',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  }, {
    label: 'Testing Data',
    sortid: 'testing',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  },] : [{
    label: ' ',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Training Data',
    sortid: 'training',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  }, {
    label: 'Testing Data',
    sortid: 'testing',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  },];
  let rows = (configuration.unit === 'count') ?
    [
      { xaxis: 'Event Occurred (Historical Result = 1)', 'training': training.actual_1_count, 'testing': testing.actual_1_count, },
      { xaxis: 'Event Did Not Occur (Historical Result = 0)', 'training': training.actual_0_count, 'testing': testing.actual_0_count, },
    ]
    : [
      { xaxis: 'Event Occurred (Historical Result = 1)', 'training': training.actual_1_pct, 'testing': testing.actual_1_pct, },
      { xaxis: 'Event Did Not Occur (Historical Result = 0)', 'training': training.actual_0_pct, 'testing': testing.actual_0_pct, },
    ];
  return {
    headers,
    rows,
  };
}

function _getRegressionDataSourceTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let headers = [{
    label: ' ',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Training Data',
    sortid: 'training',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  }, {
    label: 'Testing Data',
    sortid: 'testing',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  },];
  let rows = [{ xaxis: 'Total', 'training': training.count, 'testing': testing.count, },];
  return {
    headers,
    rows,
  };
}

function _getRocCurveTables({ configuration, data, modeldata, formdata, }) {
  let headers = [{
    label: ' ',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Total',
    sortid: 'total',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Event Occurred (Historical Result = 1)',
    sortid: 'actual_1',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Event Did Not Occur (Historical Result = 0)',
    sortid: 'actual_0',
    sortable: false,
    headerColumnProps: {
    },
  },];
  let rows = data;
  return {
    headers,
    rows,
  };
}

function _getThresholdPercentTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let headers = [{
    label: 'Threshold Value',
    sortid: 'xaxis',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  }, {
    label: 'Total (All Observations)',
    sortid: 'total',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Event Occurred (Historical Result = 1)',
    sortid: 'actual_1',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  }, {
    label: 'Event Did Not Occur (Historical Result = 0)',
    sortid: 'actual_0',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  },];
  let rows = Array.apply(null, Array(101)).map((_, i) => {
    let xaxis = (i / 100).toFixed(2);
    return {
      xaxis,
      actual_1: current_data.percent_exceeding_threshold_actual_1[ i ].toFixed(2),
      actual_0: current_data.percent_exceeding_threshold_actual_0[ i ].toFixed(2),
      total: current_data.percent_exceeding_threshold_total[ i ].toFixed(2),
    };
  });
  return {
    headers,
    rows,
  };
}

function _getThresholdAccuracyTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let rows = Array.apply(null, Array(11)).map((_, i) => {
    let xaxis = ((i) / 10).toFixed(2);
    let row = current_data.accuracy_distribution[ i * 10 ];
    let { accuracy_rate, true_positive_rate, true_negative_rate, false_positive_rate, false_negative_rate, } = row;
    return {
      xaxis,
      accuracy_rate: accuracy_rate,
      true_positive: true_positive_rate.toFixed(2),
      true_negative: true_negative_rate.toFixed(2),
      false_positive: false_positive_rate.toFixed(2),
      false_negative: false_negative_rate.toFixed(2),
    };
  });
  let headers = [{
    label: 'Threshold Value',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Accuracy Rate',
    sortid: 'accuracy_rate',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'True Positive Rate (Recall)',
    sortid: 'true_positive',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'True Negative Rate (Specificity)',
    sortid: 'true_negative',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'False Positive Rate (Fallout)',
    sortid: 'false_positive',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'False Negative Rate (Incorrectly Predicted 0)',
    sortid: 'false_negative',
    sortable: false,
    headerColumnProps: {
    },
  },];
  return {
    headers,
    rows,
  };
}

function _getAdvancedMetricsTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let rows = Array.apply(null, Array(101)).map((_, i) => {
    let xaxis = ((i) / 100).toFixed(2);
    let row = current_data.accuracy_distribution[ i ];
    let { true_positive_rate, true_negative_rate, false_positive_rate, false_negative_rate, } = row;
    return {
      xaxis,
      true_positive: true_positive_rate.toFixed(2),
      true_negative: true_negative_rate.toFixed(2),
      false_positive: false_positive_rate.toFixed(2),
      false_negative: false_negative_rate.toFixed(2),
    };
  });
  let headers = [{
    label: 'Threshold Value',
    sortid: 'xaxis',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'True Positive Rate (Recall)',
    sortid: 'true_positive',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  }, {
    label: 'True Negative Rate (Specificity)',
    sortid: 'true_negative',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  }, {
    label: 'False Positive Rate (Fallout)',
    sortid: 'false_positive',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'False Negative Rate (Incorrectly Predicted 0)',
    sortid: 'false_negative',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  },];
  return {
    headers,
    rows,
  };
}

function _getAccuracyRateTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let rows = Array.apply(null, Array(101)).map((_, i) => {
    let xaxis = ((i) / 100).toFixed(2);
    let row = current_data.accuracy_distribution[ i ];
    let { accuracy_rate, error_rate, } = row;
    return {
      xaxis,
      accuracy_rate,
      error_rate,
    };
  });
  let headers = [{
    label: 'Threshold Value',
    sortid: 'xaxis',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Accuracy Rate (% Correctly Predicted)',
    sortid: 'accuracy_rate',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Error Rate (% Incorrectly Predicted)',
    sortid: 'error_rate',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  },];
  return {
    headers,
    rows,
  };
}

function _getDistributionTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let granularity = (formdata.navbar && formdata.navbar.granularity) ? Number(formdata.navbar.granularity) : 10;
  let options = {
    1: 'one',
    5: 'five',
    10: 'ten',
  };

  let toPercent = (num) => numeral(num).format('0%');
  let bins = Array.apply(null, Array((100 / granularity))).map((_, i) => `${toPercent((granularity / 100) * i)} to ${toPercent((granularity / 100) * (i + 1))}`);
  let rows = bins.reduce((reduced, bin, idx) => {
    let actual_1 = (configuration.unit === 'count') ? current_data[ `actual_1_score_distribution_${options[ granularity ]}_pct` ][ idx ] : current_data[ `actual_1_score_distribution_rates_${options[ granularity ]}_pct` ][ idx ];
    let actual_0 = (configuration.unit === 'count') ? current_data[ `actual_0_score_distribution_${options[ granularity ]}_pct` ][ idx ] : current_data[ `actual_0_score_distribution_rates_${options[ granularity ]}_pct` ][ idx ];
    if (configuration.unit === 'percentage' && (actual_1 + actual_0) > 1) actual_1 -= 0.01;
    reduced.push({
      xaxis: bin,
      actual_1,
      actual_0,
      total: actual_1 + actual_0,
    });
    return reduced;
  }, []);

  let headers = (configuration.unit === 'count') ? [{
    label: 'Prediction',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Total (All Observations)',
    sortid: 'total',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  }, {
    label: 'Actual 1s (Event Occurred)',
    sortid: 'actual_1',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  }, {
    label: 'Actual 0s (Event Did Not Occur)',
    sortid: 'actual_0',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  },] : [{
    label: 'Prediction',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Total (All Observations)',
    sortid: 'total',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  }, {
    label: 'Actual 1s (Event Occurred)',
    sortid: 'actual_1',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  }, {
    label: 'Actual 0s (Event Did Not Occur)',
    sortid: 'actual_0',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  },];
  return {
    headers,
    rows,
  };
}

function _getDistributionAreaTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let bins = Array.apply(null, Array(101)).map((_, i) => `${(0.01 * i).toFixed(2)}`);
  let rows = bins.reduce((reduced, bin, idx) => {
    let actual_1 = (configuration.unit === 'count') ? current_data.actual_1_score_distribution_area_count[ idx ] : current_data.actual_1_score_distribution_area_rates[ idx ];
    let actual_0 = (configuration.unit === 'count') ? current_data.actual_0_score_distribution_area_count[ idx ] : current_data.actual_0_score_distribution_area_rates[ idx ];
    reduced.push({
      xaxis: bin,
      actual_1,
      actual_0,
      total: (configuration.unit === 'count') ? actual_1 + actual_0 : Number((actual_1 + actual_0).toFixed(3)),
    });
    return reduced;
  }, []);
  let headers = (configuration.unit === 'count') ? [{
    label: 'Prediction',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Total (All Observations)',
    sortid: 'total',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  }, {
    label: 'Event Occurred (Historical Result = 1)',
    sortid: 'actual_1',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  }, {
    label: 'Event Did Not Occur (Historical Result = 0)',
    sortid: 'actual_0',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  },] : [{
    label: 'Prediction',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Event Occurred (Historical Result = 1)',
    sortid: 'actual_1',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Event Did Not Occur (Historical Result = 0)',
    sortid: 'actual_0',
    sortable: false,
    headerColumnProps: {
    },
  },];
  return {
    headers,
    rows,
  };
}

function _getSummaryTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let rows = [{
    xaxis: 'Mean',
    total: current_data.total_mean.toFixed(2),
    actual_1: current_data.actual_1_mean.toFixed(2),
    actual_0: current_data.actual_0_mean.toFixed(2),
  }, {
    xaxis: 'Median',
    total: current_data.total_median.toFixed(2),
    actual_1: current_data.actual_1_median.toFixed(2),
    actual_0: current_data.actual_0_median.toFixed(2),
  }, {
    xaxis: 'Minimum',
    total: current_data.total_minimum.toFixed(2),
    actual_1: current_data.actual_1_minimum.toFixed(2),
    actual_0: current_data.actual_0_minimum.toFixed(2),
  }, {
    xaxis: 'Maximum',
    total: current_data.total_maximum.toFixed(2),
    actual_1: current_data.actual_1_maximum.toFixed(2),
    actual_0: current_data.actual_0_maximum.toFixed(2),
  },];
  let headers = [{
    label: ' ',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Total (All Observations)',
    sortid: 'total',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Event Occurred (Historical Result = 1)',
    sortid: 'actual_1',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Event Did Not Occur (Historical Result = 0)',
    sortid: 'actual_0',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  },];
  return {
    headers,
    rows,
  };
}

function _getRegressionMetricsTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let rows = [{
    xaxis: 'Mean',
    total: current_data.actual_mean,
  }, {
    xaxis: 'Median',
    total: current_data.actual_median,
  }, {
    xaxis: 'Minimum',
    total: current_data.actual_minimum,
  }, {
    xaxis: 'Maximum',
    total: current_data.actual_maximum,
  },];
  let headers = [{
    label: ' ',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Total',
    sortid: 'total',
    numeralFormat: '0,0',
    sortable: false,
    headerColumnProps: {
    },
  },];
  return {
    headers,
    rows,
  };
}

function _getRegressionPredictionMetricsTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let rows = [{
    xaxis: 'Mean',
    actual: current_data.actual_mean,
    predicted: current_data.predicted_mean,
  }, {
    xaxis: 'Median',
    actual: current_data.actual_median,
    predicted: current_data.predicted_median,
  }, {
    xaxis: 'Minimum',
    actual: current_data.actual_minimum,
    predicted: current_data.predicted_minimum,
  }, {
    xaxis: 'Maximum',
    actual: current_data.actual_maximum,
    predicted: current_data.predicted_maximum,
  },];
  let headers = [{
    label: ' ',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Actual Results',
    sortid: 'actual',
    numeralFormat: '0,0',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Predicted',
    sortid: 'predicted',
    numeralFormat: '0,0',
    sortable: false,
    headerColumnProps: {
    },
  },];
  return {
    headers,
    rows,
  };
}

function _getRegressionDistributionTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let rows = current_data.distributions_count;
  let headers = [{
    label: ' ',
    sortid: 'interval',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Actual Results',
    sortid: 'actual',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Predictions',
    sortid: 'predicted',
    sortable: false,
    headerColumnProps: {
    },
  },];
  return {
    headers,
    rows,
  };
}

function _getLorenzCurveTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let rows = current_data.cumulative_pct_of_ones.map((cumulative_pct_of_ones, idx) => ({
    cumulative_pct_of_ones,
    cumulative_pct_of_total: current_data.cumulative_pct_of_total[ idx ],
  }));
  let headers = [{
    label: '% of Total Observations',
    sortid: 'cumulative_pct_of_total',
    numeralFormat: '0.00',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: '% of Observations with historical_result = 1',
    sortid: 'cumulative_pct_of_ones',
    sortable: false,
    numeralFormat: '0.00',
    headerColumnProps: {
    },
  },];
  return {
    headers,
    rows,
  };
}

function _getKSCurveTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let headers = [{
    label: 'Threshold Value',
    sortid: 'xaxis',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  }, {
    label: 'Percent of Observations with historical_result = 1',
    sortid: 'cumulative_one',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  }, {
    label: 'Percent of Observations with historical_result = 0',
    sortid: 'cumulative_zero',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'K-S Score',
    sortid: 'ks_score',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  },];
  let rows = Array.apply(null, Array(101)).map((_, i) => {
    let xaxis = (i / 100).toFixed(2);
    return {
      xaxis,
      cumulative_one: current_data.cumulative_pct_of_ones[ i ].toFixed(2),
      cumulative_zero: current_data.cumulative_pct_of_zeros[ i ].toFixed(2),
      ks_score: current_data.ks_scores[ i ].toFixed(2),
    };
  });
  return {
    headers,
    rows,
  };
}

function _getCategoricalObservationTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let headers = (configuration.unit === 'count') ? [{
    label: ' ',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Training Data',
    sortid: 'training',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  }, {
    label: 'Testing Data',
    sortid: 'testing',
    sortable: false,
    numeralFormat: '0,0',
    headerColumnProps: {
    },
  },] : [{
    label: ' ',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  }, {
    label: 'Training Data',
    sortid: 'training',
    sortable: false,
    numeralFormat: '0%',
    headerColumnProps: {
    },
  }, {
    label: 'Testing Data',
    sortid: 'testing',
    numeralFormat: '0%',
    sortable: false,
    headerColumnProps: {
    },
  },];

  let tableData = [];
  if (configuration.unit === 'count') {
    training.categories.forEach(category => {
      tableData.push({
        xaxis: category,
        'training': training.observation_counts[category],
        'testing': testing.observation_counts[category],
      });
    });
  } else {
    training.categories.forEach(category => {
      tableData.push({
        xaxis: category,
        'training': training.observation_rates[category],
        'testing': testing.observation_rates[category],
      });
    });
  }
  let rows = tableData;
  return {
    headers,
    rows,
  };
}

function _getCategoricalPredictionTables({ configuration, data, modeldata, formdata, }) {
  let [testing, training,] = data;
  let current_data = (formdata.navbar && formdata.navbar.data_source_type && formdata.navbar.data_source_type === 'training') ? training : testing;
  let dataSet = (configuration.unit === 'count') ? current_data.accuracy_counts : current_data.accuracy_rates;
  let headers = current_data.categories.reduce((reduced, header) => {
    if (configuration.unit === 'count') {
      return reduced.concat({
        label: header,
        sortid: header.replace(/ /g, '_'),
        sortable: false,
        numeralFormat: '0,0',
        headerColumnProps: {},
      });
    } else {
      return reduced.concat({
        label: header,
        sortid: header.replace(/ /g, '_'),
        sortable: false,
        numeralFormat: '0%',
        headerColumnProps: {},
      });
    }
  }, [{
    label: ' ',
    sortid: 'xaxis',
    sortable: false,
    headerColumnProps: {
    },
  },]);

  let tableData = [];
  current_data.categories.forEach((category, idx) => {
    let row = current_data.categories.reduce((reduced, category) => {
      let dataKey = category.replace(/ /g, '_');
      reduced[dataKey] = dataSet[category][idx];
      return reduced;
    }, { xaxis: `Predicted - ${category}`, });
    tableData.push(row);
  });
  let rows = tableData;
  return {
    headers,
    rows,
  };
}

module.exports = {
  _getAdvancedMetricsTables,
  _getCategoricalObservationTables,
  _getCategoricalPredictionTables,
  _getDataSourceTables,
  _getAccuracyRateTables,
  _getDistributionAreaTables,
  _getRocCurveTables,
  _getThresholdPercentTables,
  _getThresholdAccuracyTables,
  _getDistributionTables,
  _getLorenzCurveTables,
  _getSummaryTables,
  _getRegressionDataSourceTables,
  _getRegressionMetricsTables,
  _getRegressionPredictionMetricsTables,
  _getRegressionDistributionTables,
  _getKSCurveTables,
};