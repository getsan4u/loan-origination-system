'use strict';

const periodic = require('periodicjs');
const streamBuffers = require('stream-buffers');
const aws = require('./aws');
const sagemaker_ll = require('./sagemaker_ll');
const sagemaker_xgb = require('./sagemaker_xgb');
const digifi = require('./digifi');

function oneHotEncode(column, columnType) {
  let encoder = new Map();
  let decoder = new Map();
  let encoded = [];
  if (columnType === 'Boolean') {
    let trueArr = [ 1, true, '1', 'yes', 'Yes', 'YES', 'true', 'True', 'TRUE', ];
    let falseArr = [ 0, false, '0', 'no', 'No', 'NO', 'false', 'False', 'FALSE', ];
    let firstVal = column[ 0 ];
    let foundIdx = trueArr.concat(falseArr).indexOf(firstVal);
    if (foundIdx > -1) {
      let setIdx = foundIdx % (trueArr.length);
      encoder.set(falseArr[ setIdx ], 0);
      encoder.set(trueArr[ setIdx ], 1);
      decoder.set(0, falseArr[ setIdx ]);
      decoder.set(1, trueArr[ setIdx ]);
    }
    column.forEach(elmt => {
      encoded.push(encoder.get(elmt));
    });
  } else {
    column.forEach(elmt => {
      if (!encoder.has(elmt)) {
        let encoding = encoder.size + 1;
        encoder.set(elmt, encoding);
        decoder.set(encoding, elmt);
      }
      encoded.push(encoder.get(elmt))
    });
  }
  return { encoded, decoder };
}

function __createReadableStreamBufferAsync(bucket, bufferData, filename) {
  return new Promise((resolve, reject) => {
    try {
      const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
        frequency: 1,   // in milliseconds.
        chunkSize: 2048  // in bytes.
      });
      myReadableStreamBuffer.put(bufferData);
      myReadableStreamBuffer.stop();
      myReadableStreamBuffer.
        pipe(bucket.openUploadStream(filename)).
        on('error', function(error) {
          if (error) periodic.logger.warn({error});
        }).
        on('finish', function(file) {
          return resolve(file);
        });
    } catch (err) {
      return reject()
    }
  });
}

function __createCSVString(aggregate, rowArray) {
  let row = rowArray.join(',');
  aggregate += row + '\r\n';
  return aggregate;
}


module.exports = {
  aws,
  digifi,
  sagemaker_ll,
  sagemaker_xgb,
  oneHotEncode,
  __createReadableStreamBufferAsync,
  __createCSVString,
};