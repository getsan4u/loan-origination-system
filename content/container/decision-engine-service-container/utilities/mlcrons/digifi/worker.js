'use strict';
const { Worker } = require('worker_threads');

function initiateWorker(options, cb) {
  // start worker
  let { filepath, workerData, customData } = options;
  let myWorker = startWorker({ path: filepath, workerData, customData,}, cb);
  // post a multiple factor to worker thread
  myWorker.postMessage(customData);
}

function startWorker({ path, workerData, customData }, cb) {
  // sending path and data to worker thread constructor
  let w = new Worker(path, { workerData, });

  // registering events in main thread to perform actions after receiving data/error/exit events
  w.on('message', (msg) => {
    // data will be passed into callback
    cb(null, msg);
  });

  // for error handling
  w.on('error', cb);

  // for exit
  w.on('exit', (code) => {
    if (code !== 0) {
      console.error(new Error(`Worker stopped Code ${code}`))
    }
  });
  return w;
}

module.exports = {
  initiateWorker,
  startWorker,
};