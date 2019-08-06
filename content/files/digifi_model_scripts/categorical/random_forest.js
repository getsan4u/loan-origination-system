'use strict';
const { parentPort, workerData } = require('worker_threads');
const { Matrix } = require('ml-matrix');
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

function trainModel(dataset) {
  try {
    const trainingSetX = dataset.training.rows;
    const testingSetX = dataset.testing.rows;
    const trainingSetY = dataset.training.historical_result;
    const options = {
      gainFunction: 'gini',
      maxDepth: 5,
      minNumSamples: 3
    };
    const classifier = new RFClassifier(options);
    classifier.train(trainingSetX, trainingSetY);
    const exportedModel = JSON.stringify(classifier.toJSON());
    const trainingBatchPredictions = classifier.predict(trainingSetX);
    const testingBatchPredictions = classifier.predict(testingSetX);
    return { exportedModel, trainingBatchPredictions, testingBatchPredictions, };
  } catch (e) {
    return e;
  }
}
