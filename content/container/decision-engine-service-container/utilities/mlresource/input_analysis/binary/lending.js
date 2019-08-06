'use strict';
const periodic = require('periodicjs');
const numeral = require('numeral');
const mathjs = require('mathjs');
// const { formatBinaryBatchResult } = require('../helper');
const logger = periodic.logger;

function getBinsByColumn({ mlmodel, datasource, modelHeaders, originalModelDoc, originalInputAnalysisData, numBins, columnTypes, overallHeaderMinMax }) {
  try {
    const historical_result_idx = modelHeaders.indexOf('historical_result');
    const industry_headers = mlmodel.industry_headers;
    const industry_headers_idx = industry_headers.reduce((agg, hd, idx) => {
      agg[ hd ] = idx;
      return agg;
    }, {});
    const included_columns = JSON.parse(datasource.included_columns);
    const loan_amount_idx = industry_headers_idx[ 'loan_amount' ];
    const interest_rate_idx = industry_headers_idx[ 'interest_rate' ];
    const charge_off_amt_idx = industry_headers_idx[ 'charge_off_amount' ];
    const weighted_life_of_principal_years_idx = industry_headers_idx[ 'weighted_life_of_principal_years' ];
    const charge_off_month_idx = industry_headers_idx[ 'charge_off_month' ];
    const encoders = datasource.encoders;
    const encoder_counts = datasource.encoder_counts;
    const analysisData = {};
    const headerBinSize = {};
    //find Maximum charge off months
    let max_charge_off_month = 0;
    for (let analysisRow of originalInputAnalysisData) {
      if (!isNaN(parseFloat(analysisRow[ charge_off_month_idx ]))) {
        max_charge_off_month = Math.max(max_charge_off_month, parseFloat(analysisRow[ charge_off_month_idx ]));
      }
    }

    for (let column_header of modelHeaders) {
      if (column_header === 'historical_result') continue;
      if(!included_columns[column_header]) continue;
      if (columnTypes[ column_header ] === 'Number') {
        const column_min = overallHeaderMinMax[ column_header ].min;
        const column_max = overallHeaderMinMax[ column_header ].max;
        const bin_size = (column_max - column_min) / numBins;
        headerBinSize[ column_header ] = bin_size;
        analysisData[ column_header ] = new Array(numBins);
      } else if (encoder_counts[ column_header ]) {
        const header_encoder_counts = encoder_counts[ column_header ];
        analysisData[ column_header ] = new Array(header_encoder_counts + 1);
      }
      for (let binIdx = 0; binIdx < analysisData[ column_header ].length; binIdx++) {
        analysisData[ column_header ][ binIdx ] = {
          'actual_1_amt': 0,
          'actual_0_amt': 0,
          'actual_1_count': 0,
          'actual_0_count': 0,
          'interest_rate': 0,
          'charge_off_amt': 0,
          'weighted_life_of_principal_years': 0,
          'time_series_charge_off_count': new Array(max_charge_off_month + 1),
          'time_series_charge_off_amt': new Array(max_charge_off_month + 1),
        };
      }
    }

    for (let rowIdx = 0; rowIdx < originalModelDoc.length; rowIdx++) {
      const row_training_data = originalModelDoc[ rowIdx ];
      const row_input_analysis_data = originalInputAnalysisData[ rowIdx ];
      const row_historical_result = row_training_data[ historical_result_idx ].toLowerCase() === 'true' ? true : false;
      for (let headerIdx = 0; headerIdx < modelHeaders.length; headerIdx++) {
        if (headerIdx === historical_result_idx) continue;
        if(!included_columns[modelHeaders[headerIdx]]) continue;
        let input_cell = row_training_data[ headerIdx ];
        const column_header = modelHeaders[ headerIdx ];
        const header_column_type = columnTypes[ column_header ];
        const loan_amount = isNaN(parseFloat(row_input_analysis_data[ loan_amount_idx ])) ? 0 : parseFloat(row_input_analysis_data[ loan_amount_idx ]);
        const interest_rate = isNaN(parseFloat(row_input_analysis_data[ interest_rate_idx ])) ? 0 : parseFloat(row_input_analysis_data[ interest_rate_idx ]);
        const charge_off_amt = isNaN(parseFloat(row_input_analysis_data[ charge_off_amt_idx ])) ? 0 : parseFloat(row_input_analysis_data[ charge_off_amt_idx ]);
        const charge_off_month = isNaN(parseFloat(row_input_analysis_data[ charge_off_month_idx ])) ? null : parseFloat(row_input_analysis_data[ charge_off_month_idx ]);
        const weighted_life_of_principal_years = isNaN(parseFloat(row_input_analysis_data[ weighted_life_of_principal_years_idx ])) ? 0 : parseFloat(row_input_analysis_data[ weighted_life_of_principal_years_idx ]);
        let bin_idx;
        if (header_column_type === 'Number') {
          if (isNaN(parseFloat(input_cell))) continue;
          const col_min = overallHeaderMinMax[ column_header ].min;
          input_cell = parseFloat(input_cell);
          const bin_size = headerBinSize[ column_header ];
          bin_idx = bin_size === 0
            ? 0
            : Math.floor((input_cell - col_min) / bin_size) >= numBins
              ? numBins - 1
              : Math.floor((input_cell - col_min) / bin_size);
        } else {
          bin_idx = encoders[ column_header ][ input_cell ] === undefined ? encoder_counts[ column_header ] : encoders[ column_header ][ input_cell ];
        }
        if (row_historical_result) {
          analysisData[ column_header ][ bin_idx ][ 'actual_1_count' ]++;
          analysisData[ column_header ][ bin_idx ][ 'actual_1_amt' ] += charge_off_amt;
          analysisData[ column_header ][ bin_idx ][ 'actual_0_amt' ] += (loan_amount - charge_off_amt);
          analysisData[ column_header ][ bin_idx ][ 'weighted_life_of_principal_years' ] += weighted_life_of_principal_years;
        } else {
          analysisData[ column_header ][ bin_idx ][ 'actual_0_count' ]++;
          analysisData[ column_header ][ bin_idx ][ 'actual_0_amt' ] += loan_amount;
        }
        analysisData[ column_header ][ bin_idx ][ 'interest_rate' ] += interest_rate;
        analysisData[ column_header ][ bin_idx ][ 'charge_off_amt' ] += charge_off_amt;
        if (typeof charge_off_month === 'number') {
          analysisData[ column_header ][ bin_idx ][ 'time_series_charge_off_count' ][ charge_off_month ] = ~~analysisData[ column_header ][ bin_idx ][ 'time_series_charge_off_count' ][ charge_off_month ] + 1;
          analysisData[ column_header ][ bin_idx ][ 'time_series_charge_off_amt' ][ charge_off_month ] = ~~analysisData[ column_header ][ bin_idx ][ 'time_series_charge_off_amt' ][ charge_off_month ] + charge_off_amt;
        }
      }
    }

    for (let column_header of modelHeaders) {
      if (column_header === 'historical_result') continue;
      if(!included_columns[column_header]) continue;
      for (let binIdx = 0; binIdx < analysisData[ column_header ].length; binIdx++) {
        const binAnalysisData = analysisData[ column_header ][ binIdx ];
        const total_amt = binAnalysisData[ 'actual_1_amt' ] + binAnalysisData[ 'actual_0_amt' ];
        const total_count = binAnalysisData[ 'actual_1_count' ] + binAnalysisData[ 'actual_0_count' ];
        const actual_1_amt_pct = isNaN(binAnalysisData[ 'actual_1_amt' ] / total_amt) ? null : binAnalysisData[ 'actual_1_amt' ] / total_amt;
        const actual_0_amt_pct = isNaN(binAnalysisData[ 'actual_0_amt' ] / total_amt) ? null : binAnalysisData[ 'actual_0_amt' ] / total_amt;
        const actual_1_count_pct = isNaN(binAnalysisData[ 'actual_1_count' ] / total_count) ? null : binAnalysisData[ 'actual_1_count' ] / total_count;
        const actual_0_count_pct = isNaN(binAnalysisData[ 'actual_0_count' ] / total_count) ? null : binAnalysisData[ 'actual_0_count' ] / total_count;
        const cumulative_default_rate = isNaN(binAnalysisData[ 'charge_off_amt' ] / total_amt) ? null : binAnalysisData[ 'charge_off_amt' ] / total_amt;
        const annual_default_rate = isNaN(cumulative_default_rate / (binAnalysisData[ 'weighted_life_of_principal_years' ] / binAnalysisData[ 'actual_1_count' ])) ? null : cumulative_default_rate / (binAnalysisData[ 'weighted_life_of_principal_years' ] / binAnalysisData[ 'actual_1_count' ]);
        const avg_interest_rate = isNaN(binAnalysisData[ 'interest_rate' ] / total_count) ? null : binAnalysisData[ 'interest_rate' ] / total_count;
        const avg_loan_size = isNaN(total_amt / total_count) ? null : total_amt / total_count;
        const annual_yield = (avg_interest_rate === null || annual_default_rate === null) ? null : avg_interest_rate - annual_default_rate;
        const time_series_cdr_count = new Array(max_charge_off_month + 1);
        const time_series_cdr_amt = new Array(max_charge_off_month + 1);
        time_series_cdr_count[ 0 ] = 0;
        time_series_cdr_amt[ 0 ] = 0;
        for (let month = 1; month < max_charge_off_month + 1; month++) {
          time_series_cdr_count[ month ] = time_series_cdr_count[ month - 1 ];
          time_series_cdr_amt[ month ] = time_series_cdr_amt[ month - 1 ];
          if (!isNaN(binAnalysisData[ 'time_series_charge_off_count' ][ month ] / total_count)) {
            time_series_cdr_count[ month ] += (binAnalysisData[ 'time_series_charge_off_count' ][ month ] / total_count);
          }
          if (!isNaN(binAnalysisData[ 'time_series_charge_off_amt' ][ month ] / total_amt)) {
            time_series_cdr_amt[ month ] += (binAnalysisData[ 'time_series_charge_off_amt' ][ month ] / total_amt);
          }
        }
        delete analysisData[ column_header ][ binIdx ][ 'time_series_charge_off_count' ];
        delete analysisData[ column_header ][ binIdx ][ 'time_series_charge_off_amt' ];
        analysisData[ column_header ][ binIdx ] = Object.assign({}, binAnalysisData, {
          total_amt,
          total_count,
          actual_1_amt_pct,
          actual_0_amt_pct,
          actual_1_count_pct,
          actual_0_count_pct,
          cumulative_default_rate,
          annual_default_rate,
          avg_interest_rate,
          annual_yield,
          avg_loan_size,
          time_series_cdr_count,
          time_series_cdr_amt,
        });
      }
    }
    return { headerBinSize, analysisData };
  } catch (e) {
    console.log({ e })
  }
}

function getAnalysis({ mlmodel, datasource, modelHeaders, originalModelDoc, originalInputAnalysisData, overallHeaderMinMax }) {
  try {
    const historical_result_idx = modelHeaders.indexOf('historical_result');
    const industry_headers = mlmodel.industry_headers;
    let included_columns = JSON.parse(datasource.included_columns);
    const encoders = datasource.encoders;
    const encoder_counts = datasource.encoder_counts;
    const columnTypes = {};
    for (let [ key, val, ] of Object.entries(included_columns)) {
      columnTypes[ key ] = val.data_type;
    }
    const industry_headers_idx = industry_headers.reduce((agg, hd, idx) => {
      agg[ hd ] = idx;
      return agg;
    }, {});
    const loan_amount_idx = industry_headers_idx[ 'loan_amount' ];
    const interest_rate_idx = industry_headers_idx[ 'interest_rate' ];
    const charge_off_amt_idx = industry_headers_idx[ 'charge_off_amount' ];
    const weighted_life_of_principal_years_idx = industry_headers_idx[ 'weighted_life_of_principal_years' ];
    const charge_off_month_idx = industry_headers_idx[ 'charge_off_month' ];
    let max_charge_off_month = 0;

    for (let analysisRow of originalInputAnalysisData) {
      if (!isNaN(parseFloat(analysisRow[ charge_off_month_idx ]))) {
        max_charge_off_month = Math.max(max_charge_off_month, parseFloat(analysisRow[ charge_off_month_idx ]));
      }
    }

    let summary = {
      'actual_1_amt': 0,
      'actual_0_amt': 0,
      'actual_1_count': 0,
      'actual_0_count': 0,
      'interest_rate': 0,
      'charge_off_amt': 0,
      'weighted_life_of_principal_years': 0,
      'time_series_charge_off_count': new Array(max_charge_off_month + 1),
      'time_series_charge_off_amt': new Array(max_charge_off_month + 1),
    };


    for (let rowIdx = 0; rowIdx < originalModelDoc.length; rowIdx++) {
      const row_training_data = originalModelDoc[ rowIdx ];
      const row_input_analysis_data = originalInputAnalysisData[ rowIdx ];
      const row_historical_result = row_training_data[ historical_result_idx ].toLowerCase() === 'true' ? true : false;
      const loan_amount = isNaN(parseFloat(row_input_analysis_data[ loan_amount_idx ])) ? 0 : parseFloat(row_input_analysis_data[ loan_amount_idx ]);
      const interest_rate = isNaN(parseFloat(row_input_analysis_data[ interest_rate_idx ])) ? 0 : parseFloat(row_input_analysis_data[ interest_rate_idx ]);
      const charge_off_amt = isNaN(parseFloat(row_input_analysis_data[ charge_off_amt_idx ])) ? 0 : parseFloat(row_input_analysis_data[ charge_off_amt_idx ]);
      const charge_off_month = isNaN(parseFloat(row_input_analysis_data[ charge_off_month_idx ])) ? null : parseFloat(row_input_analysis_data[ charge_off_month_idx ]);
      const weighted_life_of_principal_years = isNaN(parseFloat(row_input_analysis_data[ weighted_life_of_principal_years_idx ])) ? 0 : parseFloat(row_input_analysis_data[ weighted_life_of_principal_years_idx ]);

      if (row_historical_result) {
        summary[ 'actual_1_count' ]++;
        summary[ 'actual_1_amt' ] += charge_off_amt;
        summary[ 'actual_0_amt' ] += (loan_amount - charge_off_amt);
        summary[ 'weighted_life_of_principal_years' ] += weighted_life_of_principal_years;
      } else {
        summary[ 'actual_0_count' ]++;
        summary[ 'actual_0_amt' ] += loan_amount;
      }

      summary[ 'interest_rate' ] += interest_rate;
      summary[ 'charge_off_amt' ] += charge_off_amt;
      if (typeof charge_off_month === 'number') {
        summary[ 'time_series_charge_off_count' ][ charge_off_month ] = ~~summary[ 'time_series_charge_off_count' ][ charge_off_month ] + 1;
        summary[ 'time_series_charge_off_amt' ][ charge_off_month ] = ~~summary[ 'time_series_charge_off_amt' ][ charge_off_month ] + charge_off_amt;
      }
    }

    const total_amt = summary[ 'actual_1_amt' ] + summary[ 'actual_0_amt' ];
    const total_count = summary[ 'actual_1_count' ] + summary[ 'actual_0_count' ];
    const actual_1_amt_pct = isNaN(summary[ 'actual_1_amt' ] / total_amt) ? null : summary[ 'actual_1_amt' ] / total_amt;
    const actual_0_amt_pct = isNaN(summary[ 'actual_0_amt' ] / total_amt) ? null : summary[ 'actual_0_amt' ] / total_amt;
    const actual_1_count_pct = isNaN(summary[ 'actual_1_count' ] / total_count) ? null : summary[ 'actual_1_count' ] / total_count;
    const actual_0_count_pct = isNaN(summary[ 'actual_0_count' ] / total_count) ? null : summary[ 'actual_0_count' ] / total_count;
    const cumulative_default_rate = isNaN(summary[ 'charge_off_amt' ] / total_amt) ? null : summary[ 'charge_off_amt' ] / total_amt;
    const annual_default_rate = isNaN(cumulative_default_rate / (summary[ 'weighted_life_of_principal_years' ] / summary[ 'actual_1_count' ])) ? null : cumulative_default_rate / (summary[ 'weighted_life_of_principal_years' ] / summary[ 'actual_1_count' ]);
    const avg_interest_rate = isNaN(summary[ 'interest_rate' ] / total_count) ? null : summary[ 'interest_rate' ] / total_count;
    const avg_loan_size = isNaN(total_amt / total_count) ? null : total_amt / total_count;
    const annual_yield = (avg_interest_rate === null || annual_default_rate === null) ? null : avg_interest_rate - annual_default_rate;
    const time_series_cdr_count = new Array(max_charge_off_month + 1);
    const time_series_cdr_amt = new Array(max_charge_off_month + 1);
    time_series_cdr_count[ 0 ] = 0;
    time_series_cdr_amt[ 0 ] = 0;

    for (let month = 1; month < max_charge_off_month + 1; month++) {
      time_series_cdr_count[ month ] = time_series_cdr_count[ month - 1 ];
      time_series_cdr_amt[ month ] = time_series_cdr_amt[ month - 1 ];
      if (!isNaN(summary[ 'time_series_charge_off_count' ][ month ] / total_count)) {
        time_series_cdr_count[ month ] += (summary[ 'time_series_charge_off_count' ][ month ] / total_count);
      }
      if (!isNaN(summary[ 'time_series_charge_off_amt' ][ month ] / total_amt)) {
        time_series_cdr_amt[ month ] += (summary[ 'time_series_charge_off_amt' ][ month ] / total_amt);
      }
    }

    delete summary[ 'time_series_charge_off_count' ];
    delete summary[ 'time_series_charge_off_amt' ];

    summary = Object.assign({}, summary, {
      total_amt,
      total_count,
      actual_1_amt_pct,
      actual_0_amt_pct,
      actual_1_count_pct,
      actual_0_count_pct,
      cumulative_default_rate,
      annual_default_rate,
      avg_interest_rate,
      annual_yield,
      avg_loan_size,
      time_series_cdr_count,
      time_series_cdr_amt,
    });

    const input_analysis_bin_20 = getBinsByColumn({ mlmodel, datasource, modelHeaders, originalModelDoc, originalInputAnalysisData, numBins: 20, columnTypes, overallHeaderMinMax });
    const input_analysis_bin_10 = getBinsByColumn({ mlmodel, datasource, modelHeaders, originalModelDoc, originalInputAnalysisData, numBins: 10, columnTypes, overallHeaderMinMax });
    const input_analysis_bin_5 = getBinsByColumn({ mlmodel, datasource, modelHeaders, originalModelDoc, originalInputAnalysisData, numBins: 5, columnTypes, overallHeaderMinMax });

    const by_headers = {};
    const bindata = {};
    for (let header of modelHeaders) {
      if (header === 'historical_result') continue;
      if(!included_columns[header]) continue;
      by_headers[ header ] = {
        '20': input_analysis_bin_20.analysisData[ header ],
        '10': input_analysis_bin_10.analysisData[ header ],
        '5': input_analysis_bin_5.analysisData[ header ],
      };
      if (columnTypes[ header ] === 'Number') {
        bindata[ header ] = {
          type: columnTypes[ header ],
          min: overallHeaderMinMax[ header ].min,
          max: overallHeaderMinMax[ header ].max,
          bin_size: {
            '20': input_analysis_bin_20.headerBinSize[ header ],
            '10': input_analysis_bin_10.headerBinSize[ header ],
            '5': input_analysis_bin_5.headerBinSize[ header ],
          },
        };
      } else {
        const header_encoder_counts = encoder_counts[ header ];
        const header_encoders = new Array(header_encoder_counts + 1);
        for (let [ key, val, ] of Object.entries(encoders[ header ])) {
          header_encoders[ Number(val) ] = key;
        }
        bindata[ header ] = {
          type: columnTypes[ header ],
          encoders: header_encoders,
        };
      }
    }
    return { results: { summary, by_headers, }, bindata };
  } catch (e) {
    console.log({ e });
  }
}


async function analyzeInputData(mlmodel, datasource, originalTrainingDoc, originalTestingDoc, inputAnalysisData) {
  const MlModel = periodic.datas.get('standard_mlmodel');
  const InputAnalysis = periodic.datas.get('standard_inputanalysis');
  const io = periodic.servers.get('socket.io').server;
  try {
    const modelHeaders = originalTrainingDoc.shift();
    originalTestingDoc.shift();
    let included_columns = JSON.parse(datasource.included_columns);
    const statistics = datasource.statistics;
    const numericColumns = [];
    for (let [ key, val, ] of Object.entries(included_columns)) {
      if (val.data_type === 'Number' && key !== 'historical_result') numericColumns.push(key);
    }
    const header_map = modelHeaders.reduce((agg, hd, idx) => {
      agg[ hd ] = idx;
      return agg;
    }, {});
    const overallHeaderMinMax = {};
    const transposedTesting = mathjs.transpose(originalTestingDoc);
    for (let column_header of numericColumns) {
      const column_idx = header_map[ column_header ];
      const testing_column_min = statistics[ column_header ].min;
      const testing_column_max = statistics[ column_header ].max;
      const testing_column_data = transposedTesting[ column_idx ].filter(data => !isNaN(parseFloat(data))).map(parseFloat).sort((a, b) => parseFloat(a) - parseFloat(b));
      overallHeaderMinMax[ column_header ] = {
        min: Math.min(testing_column_min, testing_column_data[ 0 ]),
        max: Math.max(testing_column_max, testing_column_data[ testing_column_data.length - 1 ]),
      };
    }
    const originalModelDoc = originalTrainingDoc.concat(originalTestingDoc);
    const trainingInputAnalysisData = [];
    const testingInputAnalysisData = [];
    inputAnalysisData.forEach((row, i) => {
      if (i % 10 <= 6) trainingInputAnalysisData.push(row.map(parseFloat));
      else testingInputAnalysisData.push(row.map(parseFloat));
    });
    const originalInputAnalysisData = trainingInputAnalysisData.concat(testingInputAnalysisData);
    const analysis = getAnalysis({ mlmodel, datasource, modelHeaders, originalModelDoc, originalInputAnalysisData, overallHeaderMinMax });
    let created = await InputAnalysis.create({
      name: 'binary_lending_input_analysis',
      mlmodel: mlmodel._id.toString(),
      organization: mlmodel.organization.toString(),
      createdat: new Date(),
      updatedat: new Date(),
      bindata: analysis.bindata,
      results: analysis.results,
    });
    return created;

    // await MlModel.update({
    //   isPatch: true, id: mlmodel._id.toString(), updatedoc: {
    //     [ `${trainingBatch.provider}.progress` ]: 100,
    //     [ `${trainingBatch.provider}.status` ]: 'completed',
    //   }
    // })
    // const aws_models = mlmodel.aws_models || [];
    // const digifi_models = mlmodel.digifi_models || [];
    // const all_training_models = [ ...aws_models, ...digifi_models ].length ? [ ...aws_models, ...digifi_models ] : [ 'aws', 'sagemaker_ll', 'sagemaker_xgb' ];
    // const progressBarMap = all_training_models.reduce((aggregate, model, i) => {
    //   aggregate[ model ] = i;
    //   return aggregate;
    // }, {});
    // io.sockets.emit('provider_ml', { progressBarMap, provider: trainingBatch.provider, progress: 100, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, status: 'Complete' });
  } catch (e) {
    console.log({ e });
    // await MlModel.update({ isPatch: true, id: mlmodel._id.toString(), updatedoc: { [ `${trainingBatch.provider}.progress` ]: 100, status: 'failed' } })
    // io.sockets.emit('provider_ml', { provider: trainingBatch.provider, progress: 100, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, status: 'Error' });
  }
}

module.exports = analyzeInputData;