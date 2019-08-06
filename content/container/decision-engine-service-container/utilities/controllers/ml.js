'use strict';
const numeral = require('numeral');

function _generateBinsLabels(bindata, header, num_bins) {
  const header_bin_data = bindata[ header ];
  let bin_labels = [];
  if (header_bin_data.type === 'Number') {
    const bin_size = header_bin_data.bin_size[ num_bins ];
    for (let start = header_bin_data.min; start < header_bin_data.max; start += bin_size) {
      bin_labels.push(`${numeral(start.toFixed(2)).format('0,0[.]00')} to ${numeral((start + bin_size).toFixed(2)).format('0,0[.]00')}`.replace(/,/gi, ''));
    }
  } else {
    bin_labels = header_bin_data.encoders.map(label => label ? label : 'NULL');
  }
  return bin_labels;
}

function handleScoreAnalysis(options) {
  try {
    let { scoreData, csvContent, values, headers, title, bins, nestedValues, granularity, time_series, index, strategy_data_schema } = options;
    const modelDriverMax = Object.keys(strategy_data_schema).length;
    const isModelDriver = index > 6 && index <= modelDriverMax + 6;
    if (isModelDriver) {
      const modelDriverKeyOrder = Object.keys(strategy_data_schema);
      const modelDriverKey = modelDriverKeyOrder[index - 7];
      if (strategy_data_schema[modelDriverKey].data_type === 'Number') {
        bins.forEach((bin, bin_idx) => {
          csvContent.push([bin, scoreData.model_driver_map[modelDriverKey][granularity][bin_idx]]);
          headers = ['DigiFi Score', modelDriverKey];
        })
      } else {
        bins.forEach((bin, bin_idx) => {
          csvContent.push([bin, ...Object.values(scoreData.model_driver_map[modelDriverKey][granularity][bin_idx][modelDriverKey])]);
        })
        headers = ['DigiFi Score'].concat(Object.keys(scoreData.model_driver_map[modelDriverKey][granularity][0][modelDriverKey]));
      }
      // title = `Model Drivers - ${modelDriverKey}`;
    } else if (time_series) {
      headers = new Array(37).fill(0).map((el, idx) => `CDR % - ${idx} Month(s)`);
      headers.unshift('DigiFi Score');
      bins.forEach((bin, bin_idx) => {
        csvContent.push([bin, ...scoreData[values[0]].filter(el => !!el).map((dataObj, idx) => dataObj[`line_${bin_idx}`])]);
      })
    } else if (nestedValues) {
      bins.forEach((bin, idx) => {
        csvContent.push([bin, ...values.map(value => scoreData[idx] === null ? null : scoreData[idx][value])]);
      })
    } else {
      bins.forEach((bin, idx) => {
        csvContent.push([bin, ...values.map(value => scoreData[`${value}_${granularity}`] === null ? null : scoreData[`${value}_${granularity}`][idx])]);
      })
    }
    csvContent.unshift(headers);
    // return { download_content: csvContent, updated_title: title };
  } catch(e) {
    console.log({ e });
    return e;
  }
}

function handleInputVariableInputAnalysis(options) {
  try {
    let { time_series, csvContent, values, headers, title, rows, analysis_results, num_bins, bindata, input_variable } = options;
    if (time_series) headers = new Array(37).fill(0).map((el, idx) => `CDR % - ${idx + 1} Month(s)`);
    headers.unshift(input_variable);
    const bin_labels = _generateBinsLabels(bindata, input_variable, num_bins);
    const input_variable_analysis_by_bins = (bindata[ input_variable ].type === 'Number') ? analysis_results.by_headers[ input_variable ][ num_bins ] : analysis_results.by_headers[ input_variable ][ num_bins ].slice(0, 20);
    rows = input_variable_analysis_by_bins.reduce((aggregate, dataObj, idx) => {
      aggregate.push([bin_labels[idx], ...values.map(value => dataObj[value])]);
      return aggregate;
    }, [])
    csvContent.push(...rows);
  } catch(e) {
    return e;
  }
}

function handleSummaryInputAnalysis(options) {
  try {
    let { time_series, csvContent, values, headers, title, rows, analysis_results } = options;
    if (!time_series) {
      csvContent.push(values.reduce((aggregate, value, idx) => aggregate.concat(analysis_results.summary[value]),[]));
    } else {
      rows = analysis_results.summary[values[0]].reduce((aggregate, value, idx) => {
        aggregate.push([idx + 1, value]);
        return aggregate;
      }, []);
      csvContent.push(...rows);
    }
  } catch(e) {
    return e;
  }
} 

module.exports = {
  handleSummaryInputAnalysis,
  handleInputVariableInputAnalysis,
  handleScoreAnalysis,
}