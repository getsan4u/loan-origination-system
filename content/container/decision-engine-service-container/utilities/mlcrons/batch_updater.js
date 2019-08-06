'use strict';
const periodic = require('periodicjs');
const csv = require('fast-csv');
const numeral = require('numeral');
const logger = periodic.logger;
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;
const { openDownloadStreamAsync } = require('../mlresource/resourcehelpers');
const { runAWSScoreAnalysis } = require('./cronhelpers');

function updateAWSMLModel(awsmodel){
  const MLModel = periodic.datas.get('standard_mlmodel');
  let {id, updatedoc, isPatch,} = awsmodel;
  let modelUpdateOptions = {
    id,
    updatedat: new Date(),
    updatedoc: {aws: updatedoc,},
    isPatch,
  };
  return MLModel.update(modelUpdateOptions);
}

/**
 * Updates batch prediction documents with calculated results to be displayed on the evaluation section of machine learning.
 * @param {Object} options.s3 AWS S3 SDK instance
 * @param {Object} options.machinelearning AWS Machine Learning instance
 */
function batchUpdater(options) {
  const BatchPrediction = periodic.datas.get('standard_batchprediction');
  const MLModel = periodic.datas.get('standard_mlmodel');
  let { s3, machinelearning, } = options;
  const io = periodic.servers.get('socket.io').server;
  BatchPrediction.query({ query: { provider: 'aws', status: 'pending', }, })
    .then(batch_predictions => {
      if (batch_predictions && batch_predictions.length) {
        batch_predictions.forEach(batch_prediction => {
          batch_prediction = batch_prediction.toJSON ? batch_prediction.toJSON() : batch_prediction;
          machinelearning.getBatchPrediction({ 'BatchPredictionId': `${batch_prediction._id.toString()}_${batch_prediction.createdat.getTime()}`, }, function (err, data) {
            if (err) logger.warn('Error in retrieving batch prediction: ', err);
            else {
              if (data && data.Status === 'COMPLETED') {
                let datasource_filename = (data.InputDataLocationS3) ? data.InputDataLocationS3.split('/').splice(-1) : '';
                let batch_prediction_rows = [];
                const original_batch_prediction_rows = [];
                let batch_key_end = data.InputDataLocationS3.split('/').slice(-1)[ 0 ];
                let batch_key = `${batch_prediction._id.toString()}_${batch_prediction.createdat.getTime()}-${batch_key_end}.gz`;
                let bucket_key = data.OutputUri.replace('s3://', '') + 'batch-prediction/result';
                const s3Stream = s3.getObject({
                  Bucket: bucket_key,
                  Key: batch_key,
                }).createReadStream();
                var zlib = require('zlib');
                var gunzip = zlib.createGunzip();
                s3Stream.pipe(gunzip).pipe(csv())
                  .on('data', (data) => {
                    batch_prediction_rows.push(data);
                    original_batch_prediction_rows.push(data);
                    // do something here
                  })
                  .on('error', function (e) {
                    logger.warn(`Invalid csv format: ${e.message}`);
                  })
                  .on('end', function () {
                    let batchHeaders = batch_prediction_rows.shift();
                    original_batch_prediction_rows.shift();
                    batch_prediction_rows = batch_prediction_rows.filter(row => row.length > 0);
                    let updatedoc, r_squared;
                    let columnIdx = (batch_prediction.mlmodel && batch_prediction.mlmodel.type === 'binary') ? 2 : 0;
                    let sortedPredictionRows = [];
                    let sortedRows = batch_prediction_rows.sort((a, b) => Number(a[ columnIdx ]) - Number(b[ columnIdx ]));
                    if (batch_prediction.mlmodel && batch_prediction.mlmodel.type === 'regression') {
                      let batch_prediction_rows_copy = batch_prediction_rows.slice();
                      sortedPredictionRows = batch_prediction_rows_copy.sort((a, b) => Number(a[ 1 ]) - Number(b[ 1 ]));
                    }
                    let getBatchMedian = (sortedArr, predictionIdx = null) => {
                      let half = Math.floor(sortedArr.length / 2);
                      if (sortedArr.length % 2) return Number(Number(sortedArr[ half ][ predictionIdx || columnIdx ]));
                      else return Number(((Number(sortedArr[ half - 1 ][ predictionIdx || columnIdx ]) + Number(sortedArr[ half ][ predictionIdx || columnIdx ])) / 2.0));
                    };
                    let getBatchMinimum = (sortedArr, predictionIdx = null) => Number(Number(sortedArr[ 0 ][ predictionIdx || columnIdx ]));
                    let getBatchMaximum = (sortedArr, predictionIdx = null) => Number(Number(sortedArr[ sortedArr.length - 1 ][ predictionIdx || columnIdx ]));
                    let getBatchMean = (sortedArr, predictionIdx = null) => {
                      let sum = sortedArr.reduce((total, row) => {
                        if (row.length && (row[predictionIdx] || row[columnIdx])) {
                          return total + Number(row[ predictionIdx || columnIdx ]);
                        } else return total;
                      }, 0);
                      return Number((sum / sortedArr.length));
                    };
                    let getCount = (sortedArr) => sortedArr.length;

                    if (batch_prediction.mlmodel && batch_prediction.mlmodel.type === 'binary') {
                      let actual_1_count,
                        actual_0_count,
                        total_count,
                        actual_1_pct,
                        actual_0_pct,
                        actual_1_mean,
                        actual_0_mean,
                        total_mean,
                        actual_1_median,
                        actual_0_median,
                        total_median,
                        actual_1_maximum,
                        actual_0_maximum,
                        total_maximum,
                        actual_1_minimum,
                        actual_0_minimum,
                        total_minimum,
                        actual_1_score_distribution_one_pct,
                        actual_0_score_distribution_one_pct,
                        actual_1_score_distribution_five_pct,
                        actual_0_score_distribution_five_pct,
                        actual_1_score_distribution_ten_pct,
                        actual_0_score_distribution_ten_pct,
                        actual_1_score_distribution_rates_one_pct,
                        actual_0_score_distribution_rates_one_pct,
                        actual_1_score_distribution_rates_five_pct,
                        actual_0_score_distribution_rates_five_pct,
                        actual_1_score_distribution_rates_ten_pct,
                        actual_0_score_distribution_rates_ten_pct;
                      let cumulative_pct_of_ones = [];
                      let cumulative_pct_of_zeros = [];
                      let cumulative_pct_of_total = [];
                      let ks_scores = [];
                      let actual_1_rows = [];
                      let actual_0_rows = [];
                      let roc_distribution = [];
                      let percent_exceeding_threshold_total = [];
                      let percent_exceeding_threshold_actual_1 = [];
                      let percent_exceeding_threshold_actual_0 = [];
                      let accuracy_distribution = [];

                      let generateUniqueRoc = (roc_array) => {
                        let unique_map = {};
                        return roc_array.reduce((unique_x, el) => {
                          if (unique_map[el.false_positive_rate]) {
                            return unique_x;
                          } else {
                            unique_map[el.false_positive_rate] = true;
                            unique_x.unshift(el);
                            return unique_x;
                          }
                        }, [])
                      }

                      let calculateAUC = (unique_x_values) => {
                        let auc = 0;
                        unique_x_values.forEach((el, i) => {
                          if (unique_x_values[i + 1]) {
                            let next = unique_x_values[i + 1];
                            let width = next.false_positive_rate - el.false_positive_rate;
                            let height = next.true_positive_rate;
                            auc += width * height;
                          }
                        })
                        return auc;
                      }

                      let getScoreDistribution = (sortedArr) => {
                        return sortedArr.reduce((returnData, row, i) => {
                          let one_pct_bucket = Math.floor(row[ 2 ] / 0.01);
                          let five_pct_bucket = Math.floor(row[ 2 ] / 0.05);
                          let ten_pct_bucket = Math.floor(row[ 2 ] / 0.1);
                          returnData[ 0 ][ one_pct_bucket ] += 1;
                          returnData[ 1 ][ five_pct_bucket ] += 1;
                          returnData[ 2 ][ ten_pct_bucket ] += 1;
                          return returnData;
                        }, [Array.apply(null, Array(101)).map((_, i) => 0), Array.apply(null, Array(21)).map((_, i) => 0), Array.apply(null, Array(11)).map((_, i) => 0),]);
                      };

                      let getScoreDistributionRates = (numerator_rows, complement_rows) => numerator_rows.map((target, i) => Number(numeral(target / (target + complement_rows[ i ])).format('0.00')));

                      let getCumulativePercents = (score_rows, total_count) => score_rows.reduce((returnData, el, i) => {
                        if (i === 0) return returnData.concat((el / total_count));
                        else returnData = returnData.concat((el / total_count) + returnData[i - 1]);
                        returnData[i - 1] = Number(returnData[i - 1].toFixed(2));
                        return returnData;
                      }, []);

                      let getTotalCumulativePercents = (ones_score_rows, zeros_score_rows, total_count) => ones_score_rows.reduce((returnData, ones_score, i) => {
                        if (i === 0) return returnData.concat((ones_score + zeros_score_rows[i]) / total_count);
                        else returnData = returnData.concat(((ones_score + zeros_score_rows[i]) / total_count) + returnData[i - 1]);
                        returnData[i - 1] = Number(returnData[i - 1].toFixed(2));
                        return returnData;
                      }, []);

                      let getKSScores = (ones_score_rows, zeros_score_rows) => ones_score_rows.map((ones_score, i) => Number((zeros_score_rows[i] - ones_score).toFixed(2)));

                      sortedRows.forEach(row => {
                        if (row[ 0 ] === '0') actual_0_rows.push(row);
                        else actual_1_rows.push(row);
                      });

                      actual_1_count = getCount(actual_1_rows);
                      actual_0_count = getCount(actual_0_rows);
                      total_count = getCount(sortedRows);
                      actual_1_pct = Number(numeral(actual_1_count / total_count).format('0.00'));
                      actual_0_pct = Number(numeral(actual_0_count / total_count).format('0.00'));
                      actual_1_mean = getBatchMean(actual_1_rows);
                      actual_0_mean = getBatchMean(actual_0_rows);
                      total_mean = getBatchMean(sortedRows);
                      actual_1_median = getBatchMedian(actual_1_rows);
                      actual_0_median = getBatchMedian(actual_0_rows);
                      total_median = getBatchMedian(sortedRows);
                      actual_1_maximum = getBatchMaximum(actual_1_rows);
                      actual_0_maximum = getBatchMaximum(actual_0_rows);
                      total_maximum = getBatchMaximum(sortedRows);
                      actual_1_minimum = getBatchMinimum(actual_1_rows);
                      actual_0_minimum = getBatchMinimum(actual_0_rows);
                      total_minimum = getBatchMinimum(sortedRows);
                      [actual_1_score_distribution_one_pct, actual_1_score_distribution_five_pct, actual_1_score_distribution_ten_pct,] = getScoreDistribution(actual_1_rows);
                      [actual_0_score_distribution_one_pct, actual_0_score_distribution_five_pct, actual_0_score_distribution_ten_pct,] = getScoreDistribution(actual_0_rows);
                      actual_1_score_distribution_rates_one_pct = getScoreDistributionRates(actual_1_score_distribution_one_pct, actual_0_score_distribution_one_pct);
                      actual_0_score_distribution_rates_one_pct = getScoreDistributionRates(actual_0_score_distribution_one_pct, actual_1_score_distribution_one_pct);
                      actual_1_score_distribution_rates_five_pct = getScoreDistributionRates(actual_1_score_distribution_five_pct, actual_0_score_distribution_five_pct);
                      actual_0_score_distribution_rates_five_pct = getScoreDistributionRates(actual_0_score_distribution_five_pct, actual_1_score_distribution_five_pct);
                      actual_1_score_distribution_rates_ten_pct = getScoreDistributionRates(actual_1_score_distribution_ten_pct, actual_0_score_distribution_ten_pct);
                      actual_0_score_distribution_rates_ten_pct = getScoreDistributionRates(actual_0_score_distribution_ten_pct, actual_1_score_distribution_ten_pct);
                      cumulative_pct_of_ones = getCumulativePercents(actual_1_score_distribution_one_pct, actual_1_count);
                      cumulative_pct_of_zeros = getCumulativePercents(actual_0_score_distribution_one_pct, actual_0_count);
                      cumulative_pct_of_total = getTotalCumulativePercents(actual_1_score_distribution_one_pct, actual_0_score_distribution_one_pct, total_count);
                      ks_scores = getKSScores(cumulative_pct_of_ones, cumulative_pct_of_zeros, total_count);
                      
                      Array.apply(null, Array(101)).map((_, i) => (i) / 100).forEach(threshold => {
                        let true_positive_total = 0;
                        let true_negative_total = 0;
                        let false_positive_total = 0;
                        let false_negative_total = 0;
                        let num_exceeding_threshold_total = 0;
                        let num_exceeding_threshold_actual_1 = 0;
                        let num_exceeding_threshold_actual_0 = 0;
                        sortedRows.forEach(row => {
                          let trueLabel = row[ 0 ];
                          let score = Number(row[ 2 ]);
                          if (score > threshold) num_exceeding_threshold_total += 1;
                          if (score > threshold && trueLabel === '1') {
                            num_exceeding_threshold_actual_1 += 1;
                            true_positive_total += 1;
                          } else if (score > threshold && trueLabel === '0') {
                            num_exceeding_threshold_actual_0 += 1;
                            false_positive_total += 1;
                          } else if (score < threshold && trueLabel === '1') {
                            false_negative_total += 1;
                          } else if (score < threshold && trueLabel === '0') {
                            true_negative_total += 1;
                          }
                        });
                        percent_exceeding_threshold_total.push(Number((num_exceeding_threshold_total / total_count).toFixed(2)));
                        percent_exceeding_threshold_actual_1.push(Number((num_exceeding_threshold_actual_1 / actual_1_count).toFixed(2)));
                        percent_exceeding_threshold_actual_0.push(Number((num_exceeding_threshold_actual_0 / actual_0_count).toFixed(2)));
                        roc_distribution.push({
                          true_positive_rate: Number((true_positive_total / (true_positive_total + false_negative_total)).toFixed(2)),
                          false_positive_rate: Number((false_positive_total / (true_negative_total + false_positive_total)).toFixed(2)),
                        });
                        accuracy_distribution.push({
                          accuracy_rate: Number(((true_positive_total + true_negative_total) / total_count).toFixed(2)),
                          error_rate: 1 - Number(((true_positive_total + true_negative_total) / total_count).toFixed(2)),
                          true_positive_rate: Number((true_positive_total / (true_positive_total + false_negative_total)).toFixed(2)),
                          true_negative_rate: 1 - Number((false_positive_total / (true_negative_total + false_positive_total)).toFixed(2)),
                          false_positive_rate: Number((false_positive_total / (true_negative_total + false_positive_total)).toFixed(2)),
                          false_negative_rate: 1 - Number((true_positive_total / (true_positive_total + false_negative_total)).toFixed(2)),
                        });
                      });

                      let unique_roc_distribution = generateUniqueRoc(roc_distribution);
                      let auc = calculateAUC(unique_roc_distribution);
                      
                      updatedoc = Object.assign({}, batch_prediction, {
                        datasource_filename,
                        results: {
                          actual_1_count,
                          actual_0_count,
                          total_count,
                          actual_1_pct,
                          actual_0_pct,
                          actual_1_mean,
                          actual_0_mean,
                          total_mean,
                          actual_1_median,
                          actual_0_median,
                          total_median,
                          actual_1_maximum,
                          actual_0_maximum,
                          total_maximum,
                          actual_1_minimum,
                          actual_0_minimum,
                          total_minimum,
                          auc,
                          cumulative_pct_of_ones,
                          cumulative_pct_of_zeros,
                          cumulative_pct_of_total,
                          ks_scores,
                          actual_1_score_distribution_one_pct,
                          actual_0_score_distribution_one_pct,
                          actual_1_score_distribution_five_pct,
                          actual_0_score_distribution_five_pct,
                          actual_1_score_distribution_ten_pct,
                          actual_0_score_distribution_ten_pct,
                          actual_1_score_distribution_rates_one_pct,
                          actual_0_score_distribution_rates_one_pct,
                          actual_1_score_distribution_rates_five_pct,
                          actual_0_score_distribution_rates_five_pct,
                          actual_1_score_distribution_rates_ten_pct,
                          actual_0_score_distribution_rates_ten_pct,
                          roc_distribution,
                          percent_exceeding_threshold_total,
                          percent_exceeding_threshold_actual_1,
                          percent_exceeding_threshold_actual_0,
                          accuracy_distribution,
                        },
                        updatedat: new Date(),
                        status: 'complete',
                      });
                    } else if (batch_prediction.mlmodel && batch_prediction.mlmodel.type === 'regression') {
                      let count,
                        actual_mean,
                        actual_median,
                        actual_maximum,
                        actual_minimum,
                        predicted_mean,
                        predicted_median,
                        predicted_maximum,
                        predicted_minimum,
                        abs_max,
                        abs_min,
                        distributions_count_interval_val,
                        regression_plot_multiple_1000,
                        regression_plot_multiple_500,
                        regression_plot_multiple_100,
                        predicted_standard_deviation,
                        regression_distribution_1000_absmax,
                        regression_distribution_1000_absmin,
                        regression_distribution_500_absmax,
                        regression_distribution_500_absmin,
                        regression_distribution_100_absmax,
                        regression_distribution_100_absmin,
                        actual_standard_deviation;
                      let distributions_count = [];
                      let regression_distribution_1000 = [];
                      let regression_distribution_500 = [];
                      let regression_distribution_100 = [];
                      let rmse = 0;
                      let r_coefficient = 0;
                      let getVariance = (rows, mean, index) => rows.reduce((returnData, row) => {
                        if (row.length) {
                          return returnData + Math.pow((Number(row[index]) - mean), 2);
                        } else return returnData;
                      }, 0);

                      count = getCount(sortedRows);
                      actual_mean = getBatchMean(sortedRows);
                      actual_median = getBatchMedian(sortedRows);
                      actual_maximum = getBatchMaximum(sortedRows);
                      actual_minimum = getBatchMinimum(sortedRows);
                      predicted_mean = getBatchMean(sortedPredictionRows, '1');
                      predicted_median = getBatchMedian(sortedPredictionRows, '1');
                      predicted_maximum = Math.ceil(getBatchMaximum(sortedPredictionRows, '1'));
                      predicted_minimum = Math.floor(getBatchMinimum(sortedPredictionRows, '1'));
                      regression_plot_multiple_1000 = count / 1001;
                      regression_plot_multiple_500 = count / 501;
                      regression_plot_multiple_100 = count / 101;
                      abs_max = (actual_maximum > predicted_maximum) ? actual_maximum : predicted_maximum;
                      abs_min = (actual_minimum < predicted_minimum) ? actual_minimum : predicted_minimum;
                      distributions_count_interval_val = Math.round((abs_max - abs_min) * 10) / 100;
                      actual_standard_deviation = Math.pow((getVariance(sortedRows, actual_mean, '0') / (count - 1)), 0.5);
                      predicted_standard_deviation = Math.pow((getVariance(sortedRows, predicted_mean, '1') / (count - 1)), 0.5);
                      distributions_count = sortedRows.reduce((returnData, row, i) => {
                        if (row.length && row[ 0 ] && row[ 1 ]) {
                          let actualVal = Number(row[ 0 ]);
                          let predictedVal = Number(row[ 1 ]);
                          // r coefficient calculation
                          r_coefficient += (((actualVal - actual_mean) / actual_standard_deviation) * ((predictedVal - predicted_mean) / predicted_standard_deviation));
                          // rmse calculation   1000   -208000
                          rmse += Math.pow((actualVal - predictedVal), 2);
                          let predicted_bucket = Math.floor((predictedVal - abs_min) / distributions_count_interval_val);
                          let actual_bucket = Math.floor((actualVal - abs_min) / distributions_count_interval_val);
                          if (predicted_bucket >= 10) predicted_bucket = 9;
                          if (actual_bucket >= 10) actual_bucket = 9;
                          returnData[ actual_bucket ].actual += 1;
                          returnData[ predicted_bucket ].predicted += 1;
                        }
                        return returnData;
                      }, Array.apply(null, Array(10)).map((_, i) => ({ interval: `${numeral(abs_min + (i) * distributions_count_interval_val).format('0,0.[00]')} to ${numeral(abs_min + (i + 1) * distributions_count_interval_val).format('0,0.[00]')}`, actual: 0, predicted: 0, }))
                      );
                      
                      rmse = Math.sqrt(rmse / count);
                      r_coefficient = r_coefficient / (count - 1);
                      r_squared = Number(Math.pow(r_coefficient, 2).toFixed(2));
                      
                      Array.apply(null, Array(1001)).map((_, i) => i).forEach(idx => {
                        let rowIdx = Math.floor(idx * regression_plot_multiple_1000);
                        regression_distribution_1000.push({ actual: Number(sortedRows[rowIdx][ 0 ]), predicted: Number(sortedRows[rowIdx][ 1 ]), });
                      });

                      Array.apply(null, Array(501)).map((_, i) => i).forEach(idx => {
                        regression_distribution_500.push({ actual: Number(sortedRows[Math.floor(idx * regression_plot_multiple_500) ][ 0 ]), predicted: Number(sortedRows[ Math.floor(idx * regression_plot_multiple_500)][ 1 ]), });
                      });

                      Array.apply(null, Array(101)).map((_, i) => i).forEach(idx => {
                        regression_distribution_100.push({ actual: Number(sortedRows[Math.floor(idx * regression_plot_multiple_100) ][ 0 ]), predicted: Number(sortedRows[ Math.floor(idx * regression_plot_multiple_100)][ 1 ]), });
                      });
                      
                      let regression_dist_1000_vals = regression_distribution_1000.reduce((reduced, el) => {
                        if ((el.actual || el.actual === 0)) reduced.push(el.actual);
                        if ((el.predicted || el.predicted === 0)) reduced.push(el.predicted);
                        return reduced;
                      }, []);
                      let regression_dist_500_vals = regression_distribution_500.reduce((reduced, el) => {
                        if ((el.actual || el.actual === 0)) reduced.push(el.actual);
                        if ((el.predicted || el.predicted === 0)) reduced.push(el.predicted);
                        return reduced;
                      }, []);
                      let regression_dist_100_vals = regression_distribution_100.reduce((reduced, el) => {
                        if ((el.actual || el.actual === 0)) reduced.push(el.actual);
                        if ((el.predicted || el.predicted === 0)) reduced.push(el.predicted);
                        return reduced;
                      }, []);
                    
                      regression_distribution_1000_absmax = Math.max(...regression_dist_1000_vals);
                      regression_distribution_1000_absmin = Math.min(...regression_dist_1000_vals);
                      regression_distribution_500_absmax = Math.max(...regression_dist_500_vals);
                      regression_distribution_500_absmin = Math.min(...regression_dist_500_vals);
                      regression_distribution_100_absmax = Math.max(...regression_dist_100_vals);
                      regression_distribution_100_absmin = Math.min(...regression_dist_100_vals);
                      
                      updatedoc = Object.assign({}, batch_prediction, {
                        datasource_filename,
                        results: {
                          count,
                          actual_mean,
                          actual_median,
                          actual_maximum,
                          actual_minimum,
                          predicted_mean,
                          predicted_median,
                          predicted_maximum,
                          predicted_minimum,
                          regression_distribution_1000,
                          regression_distribution_1000_absmax,
                          regression_distribution_1000_absmin,
                          regression_distribution_500,
                          regression_distribution_500_absmax,
                          regression_distribution_500_absmin,
                          regression_distribution_100,
                          regression_distribution_100_absmax,
                          regression_distribution_100_absmin,
                          distributions_count,
                          r_squared,
                          rmse,
                        },
                        updatedat: new Date(),
                        status: 'complete',
                      });
                    } else if (batch_prediction.mlmodel && batch_prediction.mlmodel.type === 'categorical') {
                      batchHeaders.shift();
                      let determineRowMaxIdx = (row) => {
                        if (row.length === 0) {
                          return -1;
                        }

                        var max = Number(row[0]);
                        var maxIndex = 0;

                        for (var i = 1; i < row.length; i++) {
                          if (Number(row[i]) > max) {
                            maxIndex = i;
                            max = Number(row[i]);
                          }
                        }

                        return maxIndex;
                      };

                      let observation_counts = {};
                      let observation_rates = {};
                      let prediction_distributions = {};
                      let accuracy_counts = {};
                      let accuracy_rates = {};
                      let true_positives = {};
                      let false_positives = {};
                      let true_negatives = {};
                      let false_negatives = {};
                      let f1 = {};
                      let total_count = sortedRows.length;
                      batchHeaders.forEach(category => {
                        true_positives[category] = 0;
                        false_positives[category] = 0;
                        true_negatives[category] = 0;
                        false_negatives[category] = 0;
                        observation_counts[ category ] = 0;
                        accuracy_counts[ category ] = Array.apply(null, Array(batchHeaders.length)).map(Number.prototype.valueOf, 0);
                        prediction_distributions[ category ] = 0;
                      });
                      sortedRows.forEach(row => {
                        if (row.length) {
                          let historical_category = row[ 0 ];
                          observation_counts[ historical_category ] += 1;
                          let row_copy = row.slice();
                          row_copy.shift();
                          let row_max_idx = determineRowMaxIdx(row_copy);
                          let predicted_category = batchHeaders[ row_max_idx ];
                          batchHeaders.forEach(category => {
                            if (predicted_category === category && predicted_category === historical_category) {
                              true_positives[category] += 1;
                            } else if (predicted_category === category && predicted_category !== historical_category) {
                              false_positives[category] += 1;
                            } else if (predicted_category !== category && predicted_category === historical_category) {
                              true_negatives[category] += 1;
                            } else if (predicted_category !== category && predicted_category !== historical_category) {
                              false_negatives[category] += 1;
                            }
                          })
                          prediction_distributions[ predicted_category ] += 1;
                          accuracy_counts[ historical_category ][ row_max_idx ] += 1;
                        }
                      });

                      batchHeaders.forEach(category => {
                        let true_pos = true_positives[category];
                        let false_pos = false_positives[category];
                        let false_neg = false_negatives[category];
                        let precision = (true_pos) / (true_pos + false_pos);
                        let recall = (true_pos) / (true_pos + false_neg);
                        let f1_score = (2 * precision * recall) / (precision + recall);
                        if (!isNaN(f1_score)) f1[ category ] = f1_score;                        
                      })

                      let f1_scores = Object.values(f1); 
                      let macro_avg_f1_score = f1_scores.reduce((sum, val) => sum + val, 0) / f1_scores.length;

                      Object.keys(observation_counts).forEach(key => observation_rates[ key ] = Number((observation_counts[ key ] / total_count).toFixed(3)));
                      Object.keys(accuracy_counts).forEach(key => {
                        let category_total = accuracy_counts[ key ].reduce((reduced, el) => reduced += el, 0);
                        if (category_total > 0) {
                          accuracy_rates[ key ] = accuracy_counts[ key ].map((el, idx) => Number((el / category_total).toFixed(3)));
                        } else {
                          accuracy_rates[ key ] = Array.apply(null, Array(batchHeaders.length)).map(Number.prototype.valueOf, 0);
                        }
                      });
                      updatedoc = Object.assign({}, batch_prediction, {
                        datasource_filename,
                        results: {
                          observation_counts,
                          observation_rates,
                          prediction_distributions,
                          accuracy_counts,
                          accuracy_rates,
                          categories: batchHeaders,
                          macro_avg_f1_score,
                        },
                        updatedat: new Date(),
                        status: 'complete',
                      });
                    } 
                    updatedoc = Object.assign({}, updatedoc, {
                      Bucket: bucket_key,
                      Key: batch_key
                    });
                    BatchPrediction.update({ id: batch_prediction._id.toString(), updatedoc, })
                      .then(async () => {
                        logger.warn('Updated batch');
                        let progress;
                        let modelUpdateDoc = {
                          updatedat: new Date(),
                          [ `batch_${batch_prediction.type}_status` ]: 'complete',
                        };

                        if (batch_prediction.type === 'training') {
                          progress = 80;
                          io.sockets.emit('provider_ml', { provider: 'aws', progress, _id: batch_prediction.mlmodel._id.toString(), organization: batch_prediction.mlmodel.organization, label: 'Generating Evaluation' });
                          modelUpdateDoc = Object.assign({}, modelUpdateDoc, {
                            progress,
                          });
                        }
                        
                        if (batch_prediction.mlmodel.industry) {
                          await runAWSScoreAnalysis({ mlmodel: batch_prediction.mlmodel, batch_type: batch_prediction.type, batchPredictionData: original_batch_prediction_rows, columnIdx, provider: 'aws' })
                        }
                        modelUpdateDoc = (batch_prediction.mlmodel.type === 'regression' && batch_prediction.type === 'testing' && typeof r_squared === 'number') 
                          ? Object.assign({}, modelUpdateDoc, { r_squared, })
                          : modelUpdateDoc;
                        
                        return updateAWSMLModel({
                          id: batch_prediction.mlmodel._id.toString(),
                          updatedoc: modelUpdateDoc,
                          isPatch: true,
                        });
                      })
                      .then(() => logger.warn(`Updated model batch_${batch_prediction.type}_status to complete`))
                      .catch(e => {
                        logger.warn('Error updating batch: ', e)
                      });
                  });
              } else if (data && data.Status === 'FAILED') {
                let updatedoc = Object.assign({}, batch_prediction, {
                  updatedat: new Date(),
                  status: 'failed',
                });
                BatchPrediction.update({ id: batch_prediction._id.toString(), updatedoc, })
                  .then(() => {
                    logger.warn(`Batch creation failed for id: ${batch_prediction._id.toString()}`);
                    io.sockets.emit('provider_ml', { provider: 'aws',  _id: batch_prediction.mlmodel._id.toString(), organization: batch_prediction.mlmodel.organization, label: 'Error', model_error: true });
                    return updateAWSMLModel({
                      id: batch_prediction.mlmodel._id.toString(),
                      updatedoc: {
                        updatedat: new Date(),
                        status: 'failed',
                        [ `batch_${batch_prediction.type}_status` ]: 'failed',
                      },
                      isPatch: true,
                    });
                  })
                  .then(() => logger.warn(`Updated mlmodel status to failed for id: ${batch_prediction.mlmodel._id.toString()}`))
                  .catch(e => logger.warn('Error updating batch: ', e));
              } else {
                if (data && data.Status) {
                  logger.warn(`Current status of batch ${batch_prediction._id.toString()}: ${data.Status}`);
                }
              }
            }
          }
          );
        });
      }
    });
}

module.exports = batchUpdater;