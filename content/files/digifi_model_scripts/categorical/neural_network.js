'use strict';
const { parentPort, workerData } = require('worker_threads');
const { Matrix } = require('ml-matrix');
const Brain = require('brain.js');

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


function normalize(min, max) {
  const delta = max - min;
  return function (val) {
    let scaled = (val - min) / delta;
    if (scaled > 1) scaled = 1;
    if (scaled < 0) scaled = 0;
    return scaled;
  };
}

function trainModel(dataset) {
  try {
    const trainingSetX = dataset.training.rows;
    const testingSetX = dataset.testing.rows;
    const trainingSetY = dataset.training.historical_result;
    const headers = dataset.headers;
    let scaleTrainingSetX = [], scaleTestingSetX = [];
    let transposedTrainingSetX = new Matrix(trainingSetX).transpose();
    let transposedTestingSetX = new Matrix(testingSetX).transpose();
    let columnMinMax = {};
    for (let i = 0; i < headers.length; i++) {
      const training_column = transposedTrainingSetX[ i ];
      const testing_column = transposedTestingSetX[ i ];
      const header = headers[ i ];
      const min = Math.min(...training_column);
      const max = Math.max(...training_column);
      columnMinMax[ header ] = { min, max };
      const scaleTraining = training_column.map(normalize(min, max));
      scaleTrainingSetX.push(scaleTraining);
      const scaleTesting = testing_column.map(normalize(min, max))
      scaleTestingSetX.push(scaleTesting);
    }
    scaleTrainingSetX = new Matrix(scaleTrainingSetX).transpose().to2DArray();
    scaleTestingSetX = new Matrix(scaleTestingSetX).transpose().to2DArray();
    let trainingSet = scaleTrainingSetX.map((input, i) => ({
      input,
      output: { [ trainingSetY[ i ] ]: 1, }
    }));
    const trainingOptions = {
      iterations: 1000,
      learningRate: 5e-3,
      // log: details => console.log(details),
      logPeriod: 10,
      activation: 'tanh',
    };
    let nn = new Brain.NeuralNetwork();
    nn.train(trainingSet, trainingOptions);
    const exportedModel = nn.toFunction().toString();
    let trainingBatchPredictions = scaleTrainingSetX.map((input, idx) => {
      let prediction = nn.run(input);
      let maxValue = Object.keys(prediction).reduce((a, b) => prediction[ a ] > prediction[ b ] ? a : b);
      return maxValue;
    });
    let testingBatchPredictions = scaleTestingSetX.map(input => {
      let prediction = nn.run(input);
      let maxValue = Object.keys(prediction).reduce((a, b) => prediction[ a ] > prediction[ b ] ? a : b);
      return maxValue;
    });

    return { exportedModel, columnMinMax, trainingBatchPredictions, testingBatchPredictions, };
  } catch (e) {
    return e;
  }
}
