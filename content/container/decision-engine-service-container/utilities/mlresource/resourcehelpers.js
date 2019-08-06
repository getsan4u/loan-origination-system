'use strict';
const periodic = require('periodicjs');
const csv = require('fast-csv');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;

/**
 * Promisified downloadstream function for mongodb gridfs
 */
function openDownloadStreamAsync(bucket, file_id) {
  return new Promise((resolve, reject) => {
    try {
      const file_data = [];
      bucket.openDownloadStream(ObjectId(file_id))
        .pipe(csv())
        .on('data', function (chunk) {
          file_data.push(chunk);
        })
        .on('error', function (e) {
          return reject(e);
        })
        .on('end', function () {
          return resolve(file_data); 
        });
    } catch (err) {
      return reject(err)
    }
  });
}

function mapPredictionToDigiFiScore(prediction) {
  switch (true) {
    case (prediction < 0.002):
      return 850;
    case (prediction < 0.004):
      return 840
    case (prediction < 0.006):
      return 830
    case (prediction < 0.008):
      return 820
    case (prediction < 0.01):
      return 810
    case (prediction < 0.015):
      return 800
    case (prediction < 0.02):
      return 790
    case (prediction < 0.025):
      return 780
    case (prediction < 0.03):
      return 770
    case (prediction < 0.035):
      return 760
    case (prediction < 0.045):
      return 750
    case (prediction < 0.055):
      return 740
    case (prediction < 0.065):
      return 730
    case (prediction < 0.075):
      return 720
    case (prediction < 0.085):
      return 710
    case (prediction < 0.1):
      return 700
    case (prediction < 0.115):
      return 690
    case (prediction < 0.13):
      return 680
    case (prediction < 0.145):
      return 670
    case (prediction < 0.16):
      return 660
    case (prediction < 0.175):
      return 650
    case (prediction < 0.19):
      return 640
    case (prediction < 0.205):
      return 630
    case (prediction < 0.22):
      return 620
    case (prediction < 0.235):
      return 610
    case (prediction < 0.255):
      return 600
    case (prediction < 0.275):
      return 590
    case (prediction < 0.295):
      return 580
    case (prediction < 0.315):
      return 570
    case (prediction < 0.335):
      return 560
    case (prediction < 0.355):
      return 550
    case (prediction < 0.375):
      return 540
    case (prediction < 0.395):
      return 530
    case (prediction < 0.415):
      return 520
    case (prediction < 0.435):
      return 510
    case (prediction < 0.46):
      return 500
    case (prediction < 0.485):
      return 490
    case (prediction < 0.51):
      return 480
    case (prediction < 0.535):
      return 470
    case (prediction < 0.56):
      return 460
    case (prediction < 0.585):
      return 450
    case (prediction < 0.61):
      return 440
    case (prediction < 0.635):
      return 430
    case (prediction < 0.66):
      return 420
    case (prediction < 0.685):
      return 410
    case (prediction < 0.715):
      return 300
    case (prediction < 0.745):
      return 390
    case (prediction < 0.775):
      return 380
    case (prediction < 0.805):
      return 370
    case (prediction < 0.835):
      return 360
    case (prediction < 0.865):
      return 350
    case (prediction < 0.895):
      return 340
    case (prediction < 0.925):
      return 330
    case (prediction < 0.955):
      return 320
    case (prediction < 0.985):
      return 310
    case (prediction <= 1):
      return 300
    default:
      return 300
  }
}

module.exports = {
  openDownloadStreamAsync,
  mapPredictionToDigiFiScore,
}