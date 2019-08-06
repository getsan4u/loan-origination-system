'use strict';
const periodic = require('periodicjs');
// const { formatBinaryBatchResult } = require('../helper');
const logger = periodic.logger;
const { generate_linear_function_evaluator, generate_polynomial_function_evaluator, generate_power_function_evaluator, generate_exponential_function_evaluator, } = require('../../../transforms/ml');
const { mapPredictionToDigiFiScore } = require('../../resourcehelpers');

function generateIndustrySumBins({maxScore, minScore, interval, digifiScoreArr, comparisonScoreArr, inputAnalysisDataArr, industry_header_map, defaultModelRowObj, originalDoc, modelHeaders, strategyDataSchema, encoders, maxChargeOffTime }) {
  const numIntervals = (interval < 50) ? Math.floor((maxScore - minScore) / interval) + 1 : Math.floor((maxScore - minScore) / interval);
  return inputAnalysisDataArr.reduce((aggregate, row, i) => {
    if (i === 0) {
      aggregate.forEach((bin, j) => { 
        let newBin = {};
        modelHeaders.forEach((header, i) => {
          if (encoders[ header ]) {
            newBin[ header ] = newBin[ header ] || {};
            const encoderArr = Object.keys(encoders[ header ]);
            encoderArr.forEach(encoderKey => {
              newBin[ header ][ encoderKey ] = 0;
            })
            newBin[ header ].totalCount = 0;
          } else {
            newBin[ header ] = {
              count: 0,
              value: 0,
            }
          }
        });
        aggregate[ j ] = Object.assign({}, newBin, { charge_off_count: 0, charge_off_total: 0, loan_amount_total: 0, loan_total_count: 0, weighted_avg_life_total: 0, comparison_score: 0, time_series_count_charge_off_counts: new Array(maxChargeOffTime + 1).fill(0), time_series_amount_charge_off_amounts: new Array(maxChargeOffTime + 1).fill(0) });
      })
    }

    const rowScore = digifiScoreArr[i].score; // e.g. 800
    let scoreBin = Math.floor((maxScore - rowScore) / interval);
    scoreBin = (scoreBin >= numIntervals) ? numIntervals - 1 : scoreBin;
    const timeSeriesBin = digifiScoreArr[i].chargeOffTime;
    if (!isNaN(parseFloat(row[industry_header_map['charge_off_amount']]))) {
      aggregate[scoreBin]['charge_off_total'] += parseFloat(row[industry_header_map['charge_off_amount']]);
      aggregate[ scoreBin ][ 'charge_off_count' ] += 1;
      if (timeSeriesBin !== null) {
        aggregate[ scoreBin ][ 'time_series_count_charge_off_counts' ][ timeSeriesBin ] += 1;
        aggregate[ scoreBin ][ 'time_series_amount_charge_off_amounts' ][ timeSeriesBin ] += parseFloat(row[industry_header_map['charge_off_amount']]);
      }
    }
    aggregate[ scoreBin ][ 'comparison_score' ] += !isNaN(parseFloat(comparisonScoreArr[ i ])) ? parseFloat(comparisonScoreArr[ i ]) : 0;
    aggregate[ scoreBin ][ 'loan_total_count' ] += 1;
    aggregate[scoreBin]['loan_amount_total'] += parseFloat(row[industry_header_map['loan_amount']]);
    aggregate[scoreBin]['weighted_avg_life_total'] += parseFloat(row[industry_header_map['weighted_life_of_principal_years']]);
    // // get values for model drivers
    const originalDataRow = originalDoc[i];
    modelHeaders.forEach((header, j) => {
      if (header !== 'historical_result') {
        if (strategyDataSchema[ header ].data_type === 'Number') {
          if (!isNaN(parseFloat(originalDataRow[ j ]))) {
            aggregate[ scoreBin ][ header ].value += parseFloat(originalDataRow[ j ]);
            aggregate[ scoreBin ][ header ].count += 1;
          }
        } else {
          // { purpose: { 10: [{ wedding: 1, medical: 4, house: 3 ...}, {}, {}, {}, {}, {}]} }
          aggregate[ scoreBin ][ header ][ originalDataRow[ j ] ] += 1;
          aggregate[ scoreBin ][ header ].totalCount += 1;
        }
      }  
    })
    return aggregate;
  }, new Array(numIntervals).fill({}))
}

function handleBinObj(binObj, encoders = null, header, data_type) {
  if (data_type === 'Number') {
    if (typeof binObj[ header ].value === 'number' && typeof binObj[ header ].count === 'number' && !isNaN(parseFloat(binObj[ header ].value / binObj[ header ].count))) {
      return binObj[ header ].value / binObj[ header ].count;
    } else {
      return null;
    }
  } else if (encoders && encoders[ header ]) {
    let newBinObj = {};
    const encoderArr = Object.keys(encoders[ header ]);
    const totalCount = binObj[ header ].totalCount;
    newBinObj[ header ] = newBinObj[ header ] || {};
    encoderArr.forEach(encoderKey => {
      if (typeof binObj[ header ][ encoderKey ] === 'number' && typeof totalCount === 'number' && !isNaN(parseFloat(binObj[ header ][ encoderKey ] / totalCount))) {
        newBinObj[ header ][ encoderKey ] = binObj[ header ][ encoderKey ] / totalCount;
      } else {
        newBinObj[ header ][ encoderKey ] = null
      }
    })
    return newBinObj;
  }
}

function handleCDRByAmount(sumsObj) {
  const { charge_off_total, loan_amount_total } = sumsObj;
  if (typeof charge_off_total === 'number' && typeof loan_amount_total === 'number' && !isNaN(parseFloat(charge_off_total / loan_amount_total))) {
    return charge_off_total / loan_amount_total;
  } else {
    return null;
  }
}

function handleCDRByCount(sumsObj) {
  const { charge_off_count, loan_total_count } = sumsObj;
  if (typeof charge_off_count === 'number' && typeof loan_total_count === 'number' && !isNaN(parseFloat(charge_off_count / loan_total_count))) {
    return charge_off_count / loan_total_count;
  } else {
    return null;
  }
}

function handleADRCalculation(sumsObj, i, cdrRows) {
  const { weighted_avg_life_total, loan_total_count } = sumsObj;
  const weighted_avg_life_avg = weighted_avg_life_total / loan_total_count;
  if (typeof weighted_avg_life_total === 'number' && typeof cdrRows[i] === 'number' && typeof weighted_avg_life_avg === 'number' && !isNaN(parseFloat(cdrRows[i] / weighted_avg_life_avg))) {
    return parseFloat(cdrRows[i] / weighted_avg_life_avg);
  } else {
    return null;
  }
}

function handleLoanVolumeByCount(sumsObj) {
  const { charge_off_count, loan_total_count } = sumsObj;
  if (typeof charge_off_count === 'number' && typeof loan_total_count === 'number') {
    return {
      charged_off: charge_off_count,
      fully_paid: loan_total_count - charge_off_count,
    };
  } else {
    return null;
  }
}

function handleLoanVolumeByAmount(sumsObj) {
  const { charge_off_total, loan_amount_total } = sumsObj;
  if (typeof charge_off_total === 'number' && typeof loan_amount_total === 'number') {
    return {
      charged_off: charge_off_total,
      fully_paid: loan_amount_total - charge_off_total,
    };
  } else {
    return null;
  }
}

function handleAverageScoreRows(sumsObj, i) {
  const { comparison_score, loan_total_count } = sumsObj;
  const maxDigiFiScore = 850;
  if (typeof comparison_score === 'number' && typeof loan_total_count === 'number' && !isNaN(parseFloat(comparison_score / loan_total_count))) {
    return {
      comparison_score: parseFloat(comparison_score / loan_total_count),
      digifi_score: maxDigiFiScore - i * 10,
    }
  } else {
    return null;
  }
}

function normalize(min, max) {
  const delta = max - min;
  return function (val) {
    let scaled = (val - min) / delta;
    if (scaled > 1) scaled = 1;
    if (scaled < 0) scaled = 0;
    return scaled;
  };
}

function handleRunMLJS({ x, y, x_power, y_power }) {
  const linear_result = generate_linear_function_evaluator(x, y);
  const poly_result_2 = generate_polynomial_function_evaluator(x, y, 2);
  // const poly_result_3 = generate_polynomial_function_evaluator(x, y, 3);
  // const poly_result_4 = generate_polynomial_function_evaluator(x, y, 4);
  // const poly_result_5 = generate_polynomial_function_evaluator(x, y, 5);
  const power_result = generate_power_function_evaluator(x_power, y_power, 2);
  const exp_result = generate_exponential_function_evaluator(x_power, y_power);
  return [linear_result, poly_result_2, /*poly_result_3, poly_result_4, poly_result_5,*/ power_result, exp_result].filter(config => config && config.score && typeof config.score.r2 === 'number');
}

async function formatScoreAnalysis(mlmodel, datasource, modelHeaders, inputAnalysisData, batchData, originalDoc, provider, type) {
  const MlModel = periodic.datas.get('standard_mlmodel');
  const io = periodic.servers.get('socket.io').server;
  try {
    const industryHeaders = mlmodel.industry_headers;
    const strategyDataSchema = JSON.parse(datasource.strategy_data_schema);
    const historicalResultIdx = modelHeaders.indexOf('historical_result');
    const encoders = datasource.encoders;
    const industry_header_map = industryHeaders.reduce((aggregate, header, i) => {
      aggregate[header] = i;
      return aggregate;
    }, {})
    const batchPredictions = batchData.predictions;
    let totalLoanAmount = 0;
    let totalCount = originalDoc.length;
    let actual1Count = 0;
    let actual0Count = 0;
    let maxChargeOffTime;
    const comparisonScoreArr = [];
    const digifiScoreArr = batchPredictions.map((el, i) => {
      // handle actual1count and actual0Count
      if (originalDoc[ i ][ historicalResultIdx ] === '1' || originalDoc[ i ][ historicalResultIdx ] === 1 || originalDoc[ i ][ historicalResultIdx ] === 'true' || originalDoc[ i ][ historicalResultIdx ] === 'true') {
        actual1Count += 1;
      } else {
        actual0Count += 1;
      }
      // create comparison score array
      comparisonScoreArr.push(inputAnalysisData[ i ][ industry_header_map[ 'comparison_score' ] ]);
      // handle digifiScoreArr setup
      totalLoanAmount += inputAnalysisData[ i ][ industry_header_map[ 'loan_amount' ] ]
      const chargeOffTime = isNaN(inputAnalysisData[ i ][ industry_header_map[ 'charge_off_month' ] ]) ? null : inputAnalysisData[ i ][ industry_header_map[ 'charge_off_month' ] ];
      if (chargeOffTime !== null) {
        if (maxChargeOffTime === undefined || chargeOffTime > maxChargeOffTime) maxChargeOffTime = chargeOffTime;
      } 
      return {
        score: mapPredictionToDigiFiScore(el),
        chargeOffTime,
      }
    });
    const defaultModelRowObj = modelHeaders.reduce((aggregate, header, i) => {
      if (encoders[ header ]) {
        aggregate[ header ] = aggregate[ header ] || {};
        const encoderArr = Object.keys(encoders[ header ]);
        encoderArr.forEach(encoderKey => {
          aggregate[ header ][ encoderKey ] = 0;
        })
        aggregate[ header ].totalCount = 0;
      } else {
        aggregate[ header ] = {
          count: 0,
          value: 0,
        }
      }
      return aggregate;
    }, {});

    const sum_rows_10 = generateIndustrySumBins({ maxScore: 850, minScore: 300, interval: 10, defaultModelRowObj, digifiScoreArr, comparisonScoreArr, inputAnalysisDataArr: inputAnalysisData, industry_header_map, originalDoc, modelHeaders, strategyDataSchema, encoders, maxChargeOffTime });
    const sum_rows_20 = generateIndustrySumBins({ maxScore: 850, minScore: 300, interval: 20, digifiScoreArr, comparisonScoreArr, inputAnalysisDataArr: inputAnalysisData, industry_header_map, originalDoc, modelHeaders, strategyDataSchema, encoders, maxChargeOffTime });
    const sum_rows_50 = generateIndustrySumBins({ maxScore: 850, minScore: 300, interval: 50, defaultModelRowObj, digifiScoreArr, comparisonScoreArr, inputAnalysisDataArr: inputAnalysisData, industry_header_map, originalDoc, modelHeaders, strategyDataSchema, encoders, maxChargeOffTime });
    const loan_volume_by_count_rows_10 = sum_rows_10.map(handleLoanVolumeByCount);
    const loan_volume_by_amount_rows_10 = sum_rows_10.map(handleLoanVolumeByAmount);
    const cdr_by_count_rows_10 = sum_rows_10.map(handleCDRByCount);
    const cdr_by_count_rows_20 = sum_rows_20.map(handleCDRByCount);
    const cdr_by_count_rows_50 = sum_rows_50.map(handleCDRByCount);
    const cdr_by_amount_rows_10 = sum_rows_10.map(handleCDRByAmount);
    const cdr_by_amount_rows_20 = sum_rows_20.map(handleCDRByAmount);
    const cdr_by_amount_rows_50 = sum_rows_50.map(handleCDRByAmount);
    const adr_10 = sum_rows_10.map((sumsObj, i) => handleADRCalculation(sumsObj, i, cdr_by_amount_rows_10));
    const adr_20 = sum_rows_20.map((sumsObj, i) => handleADRCalculation(sumsObj, i, cdr_by_amount_rows_20));
    const adr_50 = sum_rows_50.map((sumsObj, i) => handleADRCalculation(sumsObj, i, cdr_by_amount_rows_50));
    const average_score_rows = sum_rows_10.map(handleAverageScoreRows);
    
    // model driver
    const modelDriverMap = modelHeaders.reduce((aggregate, header, i) => {
      aggregate[ header ] = {};
      return aggregate;
    }, {})
    modelHeaders.forEach(header => {
      modelDriverMap[header][10] = sum_rows_10.map(binObj => handleBinObj(binObj, encoders, header, strategyDataSchema[header].data_type))
      modelDriverMap[header][20] = sum_rows_20.map(binObj => handleBinObj(binObj, encoders, header, strategyDataSchema[header].data_type))
      modelDriverMap[header][50] = sum_rows_50.map(binObj => handleBinObj(binObj, encoders, header, strategyDataSchema[header].data_type))
    })

    // time series
    const time_series_10 = sum_rows_10.reduce((aggregate, row, bucketNum) => { 
      const { time_series_count_charge_off_counts, time_series_amount_charge_off_amounts, loan_total_count, loan_amount_total } = row;
      time_series_count_charge_off_counts.forEach((count, monthNum) => {
        aggregate.by_count[ monthNum ] = aggregate.by_count[ monthNum ] || {};
        if (typeof count === 'number' && typeof totalCount === 'number' && !isNaN(parseFloat(count / loan_total_count))) {
          if (monthNum >= 1) {
            aggregate.by_count[ monthNum ][ `line_${bucketNum}` ] = parseFloat(count / loan_total_count) + aggregate.by_count[ monthNum - 1 ][ `line_${bucketNum}` ]
          } else {
            aggregate.by_count[ monthNum ][ `line_${bucketNum}` ] = parseFloat(count / loan_total_count); 
          }
        }
      })

      time_series_amount_charge_off_amounts.forEach((amount, monthNum) => {
        aggregate.by_amount[ monthNum ] = aggregate.by_amount[ monthNum ] || {};
        if (typeof amount === 'number' && typeof totalLoanAmount === 'number' && !isNaN(parseFloat(amount / loan_amount_total))) {
          if (monthNum >= 1) {
            aggregate.by_amount[ monthNum ][ `line_${bucketNum}` ] = parseFloat(amount / loan_amount_total) + aggregate.by_amount[ monthNum - 1 ][ `line_${bucketNum}` ]
          } else {
            aggregate.by_amount[ monthNum ][ `line_${bucketNum}` ] = parseFloat(amount / loan_amount_total)
          }
        }
      })

      return aggregate;
    }, {
      by_count: new Array(maxChargeOffTime + 1),
      by_amount: new Array(maxChargeOffTime + 1),
    }) 
    
    const time_series_20 = sum_rows_20.reduce((aggregate, row, bucketNum) => { 
      const { time_series_count_charge_off_counts, time_series_amount_charge_off_amounts, loan_total_count, loan_amount_total } = row;
      time_series_count_charge_off_counts.forEach((count, monthNum) => {
        aggregate.by_count[ monthNum ] = aggregate.by_count[ monthNum ] || {};
        if (typeof count === 'number' && typeof totalCount === 'number' && !isNaN(parseFloat(count / loan_total_count))) {
          if (monthNum >= 1) {
            aggregate.by_count[ monthNum ][ `line_${bucketNum}` ] = parseFloat(count / loan_total_count) + aggregate.by_count[ monthNum - 1 ][ `line_${bucketNum}` ]
          } else {
            aggregate.by_count[ monthNum ][ `line_${bucketNum}` ] = parseFloat(count / loan_total_count); 
          }
        }
      })

      time_series_amount_charge_off_amounts.forEach((amount, monthNum) => {
        aggregate.by_amount[ monthNum ] = aggregate.by_amount[ monthNum ] || {};
        if (typeof amount === 'number' && typeof totalLoanAmount === 'number' && !isNaN(parseFloat(amount / loan_amount_total))) {
          if (monthNum >= 1) {
            aggregate.by_amount[ monthNum ][ `line_${bucketNum}` ] = parseFloat(amount / loan_amount_total) + aggregate.by_amount[ monthNum - 1 ][ `line_${bucketNum}` ]
          } else {
            aggregate.by_amount[ monthNum ][ `line_${bucketNum}` ] = parseFloat(amount / loan_amount_total)
          }
        }
      })

      return aggregate;
    }, {
      by_count: new Array(maxChargeOffTime + 1),
      by_amount: new Array(maxChargeOffTime + 1),
    })
    
    const time_series_50 = sum_rows_50.reduce((aggregate, row, bucketNum) => { 
      const { time_series_count_charge_off_counts, time_series_amount_charge_off_amounts, loan_total_count, loan_amount_total } = row;
      time_series_count_charge_off_counts.forEach((count, monthNum) => {
        aggregate.by_count[ monthNum ] = aggregate.by_count[ monthNum ] || {};
        if (typeof count === 'number' && typeof totalCount === 'number' && !isNaN(parseFloat(count / loan_total_count))) {
          if (monthNum >= 1) {
            aggregate.by_count[ monthNum ][ `line_${bucketNum}` ] = parseFloat(count / loan_total_count) + aggregate.by_count[ monthNum - 1 ][ `line_${bucketNum}` ]
          } else {
            aggregate.by_count[ monthNum ][ `line_${bucketNum}` ] = parseFloat(count / loan_total_count); 
          }
        }
      })

      time_series_amount_charge_off_amounts.forEach((amount, monthNum) => {
        aggregate.by_amount[ monthNum ] = aggregate.by_amount[ monthNum ] || {};
        if (typeof amount === 'number' && typeof totalLoanAmount === 'number' && !isNaN(parseFloat(amount / loan_amount_total))) {
          if (monthNum >= 1) {
            aggregate.by_amount[ monthNum ][ `line_${bucketNum}` ] = parseFloat(amount / loan_amount_total) + aggregate.by_amount[ monthNum - 1 ][ `line_${bucketNum}` ]
          } else {
            aggregate.by_amount[ monthNum ][ `line_${bucketNum}` ] = parseFloat(amount / loan_amount_total)
          }
        }
      })

      return aggregate;
    }, {
      by_count: new Array(maxChargeOffTime + 1),
      by_amount: new Array(maxChargeOffTime + 1),
    })
    
    // bin label creation
    const maxDigiFiScore = 850;
    const minDigifiScore = 300;
    const bins_10 = new Array(Math.floor((maxDigiFiScore - minDigifiScore) / 10) + 1).fill(maxDigiFiScore).map((el, i) => `${el - 10 * i}`)
    const bins_20 = new Array(Math.floor((maxDigiFiScore - minDigifiScore) / 20) + 1).fill(maxDigiFiScore - 20).map((el, i) => { 
      if (i === Math.floor((maxDigiFiScore - minDigifiScore) / 20)) {
        return '300 - 310';
      } else {
        return `${(el - 20 * i) + 1} - ${el - 20 * (i - 1)}`
      }
    })
    const bins_50 = new Array(Math.floor((maxDigiFiScore - minDigifiScore) / 50)).fill(maxDigiFiScore - 50).map((el, i) => {
      if (i === Math.floor((maxDigiFiScore - minDigifiScore) / 20)) {
        return '300 - 350';
      } else {
        return `${(el - 50 * i) + 1} - ${el - 50 * (i - 1)}`
      }
    })

    // comparison score ROC
    const percent_exceeding_threshold_total = [];
    const percent_exceeding_threshold_actual_1 = [];
    const percent_exceeding_threshold_actual_0 = [];
    const comparison_score_roc = [];
    const normalizeFunction = normalize(Math.min(...comparisonScoreArr), Math.max(...comparisonScoreArr));
    Array.apply(null, Array(101)).map((_, i) => (i) / 100).forEach(threshold => {
      let true_positive_total = 0;
      let true_negative_total = 0;
      let false_positive_total = 0;
      let false_negative_total = 0;
      let num_exceeding_threshold_total = 0;
      let num_exceeding_threshold_actual_1 = 0;
      let num_exceeding_threshold_actual_0 = 0;
      originalDoc.forEach((row, i) => {
        const trueLabel = row[ historicalResultIdx ];
        const score = !isNaN(normalizeFunction(comparisonScoreArr[ i ])) ? normalizeFunction(comparisonScoreArr[ i ]) : 0;
        if (score > threshold) num_exceeding_threshold_total += 1;
        if (score > threshold && (trueLabel === '1' || trueLabel === 1 || trueLabel === true || trueLabel === 'true')) {
          num_exceeding_threshold_actual_1 += 1;
          true_positive_total += 1;
        } else if (score > threshold && (trueLabel === '0' || trueLabel === 0 || trueLabel === 'false' || trueLabel === false)) {
          num_exceeding_threshold_actual_0 += 1;
          false_positive_total += 1;
        } else if (score < threshold && (trueLabel === '1' || trueLabel === 1 || trueLabel === true || trueLabel === 'true')) {
          false_negative_total += 1;
        } else if (score < threshold && (trueLabel === '0' || trueLabel === 0 || trueLabel === 'false' || trueLabel === false)) {
          true_negative_total += 1;
        }
      });
      percent_exceeding_threshold_total.push(Number((num_exceeding_threshold_total / totalCount).toFixed(2)));
      percent_exceeding_threshold_actual_1.push(Number((num_exceeding_threshold_actual_1 / actual1Count).toFixed(2)));
      percent_exceeding_threshold_actual_0.push(Number((num_exceeding_threshold_actual_0 / actual0Count).toFixed(2)));
      comparison_score_roc.push({
        true_positive_rate: Number((true_positive_total / (true_positive_total + false_negative_total)).toFixed(2)),
        false_positive_rate: Number((false_positive_total / (true_negative_total + false_positive_total)).toFixed(2)),
      });
    });

    // projected annual default rate
    const projected_annual_default_rate_configs = adr_10.reduce((aggregate, score, i) => {
      const binWeight = (loan_volume_by_amount_rows_10[i].charged_off + loan_volume_by_amount_rows_10[i].fully_paid) / totalLoanAmount;
      const numTimes = Math.floor(binWeight * 1000);
      if (i === 0 && (score === null || score === Infinity)) {
        aggregate.digifi_score_arr.push(maxDigiFiScore);
        aggregate.annual_default_rate_arr.push(0);
      }
      
      if (score !== null && score !== Infinity) {
        aggregate.digifi_score_arr.push(...new Array(numTimes).fill(maxDigiFiScore - 10 * i));
        aggregate.annual_default_rate_arr.push(...new Array(numTimes).fill(score));
      }
      
      if (score !== null && score !== 0 && score !== Infinity) {
        aggregate.digifi_score_arr_power.push(...new Array(numTimes).fill(maxDigiFiScore - 10 * i));
        aggregate.annual_default_rate_arr_power.push(...new Array(numTimes).fill(score));
      }

      return aggregate;
    }, { digifi_score_arr: [], annual_default_rate_arr: [], digifi_score_arr_power: [], annual_default_rate_arr_power: [] });

    // generate projected_adr functions
    const validProjectedADRFunctions = handleRunMLJS({x: projected_annual_default_rate_configs.digifi_score_arr, y: projected_annual_default_rate_configs.annual_default_rate_arr, x_power: projected_annual_default_rate_configs.digifi_score_arr_power, y_power: projected_annual_default_rate_configs.annual_default_rate_arr_power, });
    const topProjectedADRFunction = validProjectedADRFunctions.sort((a, b) => b.score.r2 - a.score.r2)[0];

    // staging newdoc for create and removing historical result from modelDriverMap
    if (modelDriverMap.historical_result) delete modelDriverMap.historical_result;
    const newdoc = {
      name: `${mlmodel.name}_${provider}_${type}_scoreanalysis`,
      provider,
      type,
      industry: 'lending',
      mlmodel: mlmodel._id.toString(),
      organization: mlmodel.organization._id.toString(),
      results: {
        average_score_rows,
        comparison_score_roc,
        loan_volume_by_count_rows_10,
        loan_volume_by_amount_rows_10,
        cdr_by_count_rows_10,
        cdr_by_count_rows_20,
        cdr_by_count_rows_50,
        cdr_by_amount_rows_10,
        cdr_by_amount_rows_20,
        cdr_by_amount_rows_50,
        adr_10,
        adr_20,
        adr_50,
        time_series_10,
        time_series_20,
        time_series_50,
        bins_10,
        bins_20,
        bins_50,
        model_driver_map: modelDriverMap, // { dti_percent: { 10, 20, 50 }}
      }
    }

    // attaching adr_projected_10 to newdoc if function available
    if (topProjectedADRFunction) {
      const applyTransformFunc = new Function('x', topProjectedADRFunction.evaluator);
      newdoc.results.adr_projected_10 = new Array(Math.floor((maxDigiFiScore - minDigifiScore) / 10) + 1).fill(0).map((val, i) => applyTransformFunc(maxDigiFiScore - 10 * i)).map(predictedVal => predictedVal < 0 ? 0 : predictedVal > 1 ? 1 : predictedVal);
      newdoc.results.projection_evaluator = topProjectedADRFunction.evaluator;
    }
    const ScoreAnalysis = periodic.datas.get('standard_scoreanalysis');
    await ScoreAnalysis.create(newdoc);
  } catch(e) {
    logger.warn(e);
    return null;
  }
}

module.exports = formatScoreAnalysis;