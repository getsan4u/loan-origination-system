'use strict';
const { parentPort, workerData } = require('worker_threads');
const { Matrix } = require('ml-matrix');
const DTClassifier = require('@digifi/ml-cart').DecisionTreeClassifier;

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

function runPrediction(dataset) {
  let toPredict = Matrix.checkMatrix(dataset);
  var predictions = new Array(toPredict.rows);
  for (var i = 0; i < toPredict.rows; ++i) {
    predictions[ i ] = this.root.classify(toPredict.getRow(i))[ 0 ][ 1 ] || 0;
  }
  return predictions;
}

function trainModel(dataset) {
  try {
    const trainingSetX = dataset.training.rows;
    const testingSetX = dataset.testing.rows;
    const trainingSetY = dataset.training.historical_result;
    const options = {
      gainFunction: 'gini',
      maxDepth: 10,
      minNumSamples: 5,
    };
    const classifier = new DTClassifier(options);
    classifier.train(trainingSetX, trainingSetY);
    const exportedModel = JSON.stringify(classifier.toJSON());
    const trainingBatchPredictions = runPrediction.call(classifier, trainingSetX);
    const testingBatchPredictions = runPrediction.call(classifier, testingSetX);
    return { exportedModel, trainingBatchPredictions, testingBatchPredictions, };
  } catch (e) {
    return e;
  }
}
