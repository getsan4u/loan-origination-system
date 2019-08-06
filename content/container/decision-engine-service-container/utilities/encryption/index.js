'use strict';
const AWS = require('aws-sdk');
const KMS = new AWS.KMS({ region: 'us-east-1', });
const crypto = require('crypto');
const periodic = require('periodicjs');
let algo = 'aes256';
let encryptParams = {
  KeyId: 'alias/kms-tutorial',
};

async function enc(options) {
  try {
    let { algo, data, } = options;
    let key = crypto.randomBytes(32).toString('hex');
    let cipher = crypto.createCipher(algo, key);
    var crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return { crypted, key, };
  } catch (err) {
    return err;
  }
}

async function dec(options) {
  try {
    let { algo, key, data, } = options;
    var decipher = crypto.createDecipher(algo, key);
    var dec = decipher.update(data, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch (err) {
    return err;
  }
}

async function encryptKMS(data) {
  try {
    data = (typeof data === 'object' && Object.keys(data)) ? JSON.stringify(data) : String(data);
    let { crypted, key, } = await enc({ data: JSON.stringify(data), algo, });
    let encryptedKey = await KMS.encrypt({ KeyId: encryptParams.KeyId, Plaintext: key, }).promise();
    return { crypted, encryptedKey, };
  } catch (err) {
    console.log(err);
  }
}


async function decryptKMS(options) {
  try {
    let { key, data, } = options;
    let decryptedKey = await KMS.decrypt({ CiphertextBlob: key.CiphertextBlob, }).promise();
    let decryptedData = await dec({ data: data, algo, key: decryptedKey.Plaintext.toString('utf8'), });
    return decryptedData;
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  encryptKMS,
  decryptKMS,
}