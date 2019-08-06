// dsJwtAuth.js

/**
 * @file
 * This file handles the JWT authentication with DocuSign.
 * It also looks up the user's account and base_url
 * via the OAuth::userInfo method.
 * See https://developers.docusign.com/esign-rest-api/guides/authentication/user-info-endpoints userInfo method.
 * @author DocuSign
 */


'use strict';
let DsJwtAuth = {};
module.exports = DsJwtAuth;  // SET EXPORTS for the module.

const moment = require('moment')
  , path = require('path')
  , docusign = require('docusign-esign')
  , periodic = require('periodicjs')
  , dsConfig = require('../dsConfig.js').config;

// private constants and globals
const tokenReplaceMin = 10;  // The accessToken must expire at least this number of
// minutes later or it will be replaced

let tokenExpirationTimestamp = null;  // when does the accessToken expire?

// Exported variables
DsJwtAuth.accessToken = null; // The bearer accessToken
DsJwtAuth.accountId = null; // current account
DsJwtAuth.accountName = null; // current account name
DsJwtAuth.basePath = null; // eg https://na2.docusign.net/restapi
DsJwtAuth.userName = null;
DsJwtAuth.userEmail = null;


/**
 * This is the key method for the object.
 * It should be called before any API call to DocuSign.
 * It checks that the existing access accessToken can be used.
 * If the existing accessToken is expired or doesn't exist, then
 * a new accessToken will be obtained from DocuSign by using
 * the JWT flow.
 * 
 * This is an async function so call it with await.
 * 
 * SIDE EFFECT: Sets the access accessToken that the SDK will use.
 * SIDE EFFECT: If the accountId et al is not set, then this method will
 *              also get the user's information
 * @function
 * @returns {promise} a promise with null result.
 */
DsJwtAuth.checkToken = async function _checkToken() {
  let noToken = !DsJwtAuth.accessToken || !tokenExpirationTimestamp
    , now = moment()
    , needToken = noToken || tokenExpirationTimestamp.add(
      tokenReplaceMin, 'm').isBefore(now)
    ;
  if (noToken) {
    console.log('checkToken: Starting up--need an accessToken')
    ;
  }
  if (needToken && !noToken) {
    console.log('checkToken: Replacing old accessToken');
  }
  //if (!needToken) {console.log('checkToken: Using current accessToken')}

  if (needToken) {
    let results = await DsJwtAuth.getToken();
    DsJwtAuth.accessToken = results.accessToken;
    tokenExpirationTimestamp = results.tokenExpirationTimestamp;
    console.log ('Obtained an access token. Continuing...');

    if (!DsJwtAuth.accountId) {
      await DsJwtAuth.getUserInfo();
    }
  }
};

/**
 * Async function to obtain a accessToken via JWT grant
 * 
 * RETURNS {accessToken, tokenExpirationTimestamp}
 *
 * We need a new accessToken. We will use the DocuSign SDK's function.
 */
DsJwtAuth.getToken = async function _getToken() {
  // Data used
  // dsConfig.clientId
  // dsConfig.impersonatedUserGuid
  // dsConfig.privateKey
  // dsConfig.authServer
  const jwtLifeSec = 10 * 60, // requested lifetime for the JWT is 10 min
    scopes = 'signature', // impersonation scope is implied due to use of JWT grant
    dsApi = new docusign.ApiClient();

  dsApi.setOAuthBasePath(dsConfig.authServer);
  const results = await dsApi.requestJWTUserToken(dsConfig.clientId,
    dsConfig.impersonatedUserGuid, scopes, dsConfig.privateKey,
    jwtLifeSec);
  const expiresAt = moment().add(results.body.expires_in, 's');
  return { accessToken: results.body.access_token, tokenExpirationTimestamp: expiresAt,  };
};

/**
 * Sets the following variables:
 * DsJwtAuth.accountId
 * DsJwtAuth.accountName
 * DsJwtAuth.basePath
 * DsJwtAuth.userName
 * DsJwtAuth.userEmail
 * @function _getAccount
 * @returns {promise}
 * @promise
 */
DsJwtAuth.getUserInfo = async function _getUserInfo(){
  // Data used:
  // dsConfig.targetAccountId
  // dsConfig.authServer
  // DsJwtAuth.accessToken

  const dsApi = new docusign.ApiClient()
    , targetAccountId = dsConfig.targetAccountId
    , baseUriSuffix = '/restapi';

  dsApi.setOAuthBasePath(dsConfig.authServer);
  const results = await dsApi.getUserInfo(DsJwtAuth.accessToken);

  let accountInfo;
  if (targetAccountId === 'false' || targetAccountId === 'FALSE' ||
      targetAccountId === false) {
    // find the default account
    accountInfo = results.accounts.find(account =>
      account.isDefault === 'true');
  } else {
    // find the matching account
    accountInfo = results.accounts.find(account => account.accountId == targetAccountId);
  }
  if (typeof accountInfo === 'undefined') {
    let err = new Error (`Target account ${targetAccountId} not found!`);
    throw err;
  }

  ({ accountId: DsJwtAuth.accountId,
    accountName: DsJwtAuth.accountName,
    baseUri: DsJwtAuth.basePath,  } = accountInfo);
  DsJwtAuth.basePath += baseUriSuffix;
};


/**
 * Clears the accessToken. Same as logging out
 * @function
 */
DsJwtAuth.clearToken = function(){ // "logout" function
  tokenExpirationTimestamp = false;
  DsJwtAuth.accessToken = false;
};

// module.exports = { 
//   getUserInfo,
//   clearToken,
//   getToken,
//   checkToken,
// };  // SET EXPORTS for the module.

