'use strict';
const { parentPort, workerData } = require('worker_threads');
const Matrix = require('ml-matrix');
const RFClassifier = require('ml-random-forest').RandomForestClassifier;

registerForEventListening();

function registerForEventListening() {
  // callback method is defined to receive data from main thread
  let cb = (err, customData) => {
    if (err) return console.error(err);
    let result = trainModel(workerData.dataset);
    parentPort.postMessage({ val: result, isInProgress: false });
  };

  // registering to events to receive messages from the main thread
  parentPort.on('error', cb);
  parentPort.on('message', (customData) => {
    cb(null, customData);
  });
}

function getTreePrediction(toPredict) {
  toPredict = Matrix.Matrix.checkMatrix(toPredict);
  let predictions = new Array(toPredict.rows);
  for (var i = 0; i < toPredict.rows; ++i) {
    predictions[ i ] = this.root.classify(toPredict.getRow(i))[ 0 ][ 1 ] || 0;
  }
  return predictions;
}

function runPrediction(toPredict) {
  try {
    let predictionValues = new Array(this.nEstimators);
    toPredict = Matrix.Matrix.checkMatrix(toPredict);
    for (var i = 0; i < this.nEstimators; ++i) {
      let X = toPredict.columnSelectionView(this.indexes[i]);
      predictionValues[ i ] = getTreePrediction.call(this.estimators[ i ], X);
    }
    predictionValues = new Matrix.WrapperMatrix2D(predictionValues).transposeView();
    let predictions = new Array(predictionValues.rows);
    for (i = 0; i < predictionValues.rows; ++i) {
      predictions[i] = this.selection(predictionValues.getRow(i));
    }
    return predictions;
  } catch (e) {
    return e;
  }
}

function trainModel(dataset) {
  try {
    const trainingSetX = dataset.training.rows;
    const testingSetX = dataset.testing.rows;
    const trainingSetY = dataset.training.historical_result;
    const options = {
      gainFunction: 'gini',
      maxDepth: 5,
      minNumSamples: 2,
    };
    const classifier = new RFClassifier(options);
    classifier.train(trainingSetX, trainingSetY);
    const exportedModel = JSON.stringify(classifier.toJSON());
    const trainingBatchPredictions = runPrediction.call(classifier, trainingSetX);
    const testingBatchPredictions = runPrediction.call(classifier, testingSetX);
    return { exportedModel, trainingBatchPredictions, testingBatchPredictions, };
  } catch (e) {
    console.log({e})
    return e;
  }
}
