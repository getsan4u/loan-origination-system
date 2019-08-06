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
const moment = require('moment')
  , path = require('path')
  , docusign = require('docusign-esign')
  , periodic = require('periodicjs')
  , Promisie = require('promisie')
  , logger = periodic.logger;

class DocuSign {
  constructor(options) {
    this.accountId = options.accountId;
    this.accountName = options.accountName;
    this.basePath = options.basePath;
    this.userName = options.userName;
    this.userEmail = options.userEmail;
    this.clientId = options.clientId; // integration key
    this.userId = options.userId; // impersonated user guid
    this.privateKey = options.privateKey;
    this.authServer = options.authServer;
    this.accessToken = options.accessToken || null;
    this.tokenExpirationTimestamp = options.tokenExpirationTimestamp || null;
    this.tokenReplaceMin = options.tokenReplaceMin || 60;
    this.targetAccountId = options.targetAccountId;
    this.dsApi = new docusign.ApiClient();
    this.fields = options.fields;
  }
  
  async resetBasePath() {
    this.dsApi.setBasePath(this.basePath);
    docusign.Configuration.default.setDefaultApiClient(this.dsApi);
  }

  async checkToken() {
    try {
      const redisClient = periodic.app.locals.redisClient;
      const getValAsync = Promisie.promisify(redisClient.get).bind(redisClient);
      const setValAsync = Promisie.promisify(redisClient.set).bind(redisClient);
      let redisAccessToken = await getValAsync(`docusign_${this.clientId}_token`);
      let redisExpiration = await getValAsync(`docusign_${this.clientId}_expiration`);

      if (redisAccessToken && redisExpiration) {
        this.accessToken = redisAccessToken;
        this.tokenExpirationTimestamp = redisExpiration;
      } else {
        let noToken = !this.accessToken || !this.tokenExpirationTimestamp
          , now = moment()
          , needToken = noToken || this.tokenExpirationTimestamp.add(
            this.tokenReplaceMin, 'm').isBefore(now)
          ;
        if (noToken) {
          logger.warn('checkToken: Starting up--need an accessToken')
            ;
        }

        if (needToken && !noToken) {
          logger.warn('checkToken: Replacing old accessToken');
        }
        //if (!needToken) {logger.warn('checkToken: Using current accessToken')}

        if (needToken) {
          logger.warn('need token');
          let results = await this.getToken();
          this.accessToken = results.accessToken;
          this.tokenExpirationTimestamp = results.tokenExpirationTimestamp;
          setValAsync(`docusign_${this.clientId}_token`, this.accessToken, 'EX', 30 * 60);
          setValAsync(`docusign_${this.clientId}_expiration`, this.tokenExpirationTimestamp, 'EX', 30 * 60);
        }
      }
      this.dsApi.setBasePath('https://docusign.net/restapi');
      this.dsApi.addDefaultHeader('Authorization', 'Bearer ' + this.accessToken);
      docusign.Configuration.default.setDefaultApiClient(this.dsApi);
      logger.warn('Obtained an access token. Continuing...');

      if (!this.accountId) {
        logger.warn('getting user ifo');
        await this.getUserInfo();
      }
    } catch(e) {
      logger.error(e.message);
    }
  }

  async getToken() {
    if (!this.clientId || !this.userId || !this.privateKey || !this.authServer) {
      logger.warn('Missing docusign authentication information');
      return { accessToken: null, };
    } else {
      const jwtLifeSec = 60 * 60, // requested lifetime for the JWT is 10 min
        scopes = 'signature'; // impersonation scope is implied due to use of JWT grant
      this.dsApi.setOAuthBasePath(this.authServer);
      const results = await this.dsApi.requestJWTUserToken(this.clientId,
        this.userId, scopes, this.privateKey,
        jwtLifeSec);
      const expiresAt = moment().add(results.body.expires_in, 's');
      return { accessToken: results.body.access_token, tokenExpirationTimestamp: expiresAt, };
    }
  }

  clearToken() { // "logout" function
    this.tokenExpirationTimestamp = false;
    this.accessToken = false;
  }

  async getTemplates(options) {
    try {
      await this.checkToken();
      await this.resetBasePath();
      let templatesApi = new docusign.TemplatesApi();
      const templates = await templatesApi.listTemplates(this.accountId);
      return templates.envelopeTemplates;
    } catch (e) {
      logger.error(e.message);
    }
  }

  async getTemplateDetail(options) {
    try {
      await this.checkToken();
      await this.resetBasePath();
      const { templateId } = options;
      let templatesApi = new docusign.TemplatesApi();
      const template = await templatesApi.get(this.accountId, templateId);
      return template;
    } catch (e) {
      logger.error(e.message);
    }
  }

  async sendTemplate(options) {
    // create a new envelope object that we will manage the signature request through
    await this.checkToken();
    await this.resetBasePath();
    let { templateId, emailSubject, templateRoleName, fullName, recipientEmail, ccEmail, ccName, custom_fields, webhook_url, } = options;
    let envDef = new docusign.EnvelopeDefinition();
    envDef.emailSubject = emailSubject || 'Please sign this document sent from Node SDK';
    envDef.templateId = templateId;

    // create a template role with a valid templateId and roleName and assign signer info
    // let tRole = new docusign.TemplateRole();
    // tRole.roleName = templateRoleName || 'signer';
    // tRole.name = fullName || 'Signer Name';
    // tRole.email = recipientEmail || 'Recipient Name';

    // let tRole2 = new docusign.TemplateRole();
    // tRole.roleName = 'carboncopy';
    // tRole.name = 'Cody Hahn';
    // tRole.email = 'cody@digifi.io';

    // create a list of template roles and add our newly created role
    // let templateRolesList = [];
    // templateRolesList.push(tRole);
    // templateRolesList.push(tRole2);

    // assign template role(s) to the envelope
    // envDef.templateRoles = templateRolesList;

    envDef.eventNotification = {
      url: webhook_url,
      includeCertificateOfCompletion: 'false',
      includeDocuments: 'true',
      includeDocumentFields: 'true',
      requireAcknowledgment: 'true',
      envelopeEvents: [{
        envelopeEventStatusCode: 'completed',
      }]
    }
    
    // send the envelope by setting |status| to 'sent'. To save as a draft set to 'created'
    envDef.status = 'created';
    // instantiate a new EnvelopesApi object
    let envelopesApi = new docusign.EnvelopesApi();
    // call the createEnvelope() API
    const envelopeSummary = await envelopesApi.createEnvelope(this.accountId, { 'envelopeDefinition': envDef, eventNotification: {
      url: webhook_url,
      includeCertificateOfCompletion: 'false',
      includeDocuments: 'true',
      includeDocumentFields: 'true',
      requireAcknowledgment: 'true',
      envelopeEvents: [{
        envelopeEventStatusCode: 'completed',
      }]
    } })
    const envelopeId = envelopeSummary.envelopeId;
    await envelopesApi.updateRecipients(this.accountId, envelopeId, {
      recipients: {
        signers: [{
          email: recipientEmail,
          name: fullName,
          recipientId: '1',
          routingOrder: '1',
        }],
        carbonCopies: [{
          email: ccEmail,
          name: ccName || 'ccName',
          recipientId: '2',
          routingOrder: '2'
        },]
      }
    })
    const tabs = await envelopesApi.listTabs(this.accountId, envelopeId, '1');
    tabs.textTabs.forEach((tab, idx) => {
      if (custom_fields[ tab.tabLabel ]) {
        tabs.textTabs[ idx ].value = custom_fields[ tab.tabLabel ] || '';
        tabs.textTabs[ idx ].locked = custom_fields[ tab.tabLabel ].locked || 'true';
      }
    });
    await envelopesApi.updateTabs(this.accountId, envelopeId, '1', { tabs });
    const tabsAfter = await envelopesApi.listTabs(this.accountId, envelopeId, '1');
    await envelopesApi.update(this.accountId, envelopeId, { envelope: { status: 'sent', } });
  }

  async getUserInfo() {
    // Data used:
    // dsConfig.targetAccountId
    // dsConfig.authServer
    // DsJwtAuth.accessToken
    const targetAccountId = this.targetAccountId
      , baseUriSuffix = '/restapi';

    this.dsApi.setOAuthBasePath(this.authServer);
    const results = await this.dsApi.getUserInfo(this.accessToken);

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
      let err = new Error(`Target account ${targetAccountId} not found!`);
      throw err;
    }

    const { accountId, accountName, baseUri } = accountInfo;
    this.accountId = accountId;
    this.accountName = accountName;
    this.basePath = baseUri;
    // ({ accountId: this.accountId,
    //   accountName: this.accountName,
    //   baseUri: this.basePath,  } = accountInfo);
    this.basePath += baseUriSuffix;
  }
}
// let DsJwtAuth = {};
module.exports = DocuSign;  // SET EXPORTS for the module.