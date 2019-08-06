'use strict';

/** Functions used in authentication/login middleware */

const periodic = require('periodicjs');
const logger = periodic.logger;
const path = require('path');
const Promisie = require('promisie');
const fs = Promisie.promisifyAll(require('fs-extra'));
const passportSettings = periodic.settings.extensions[ 'periodicjs.ext.passport' ];
const passportUtilities = periodic.locals.extensions.get('periodicjs.ext.passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const svg = require('../views/shared/component').svg;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const helpers = require('../helpers');
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('bcrypt-nodejs');
}

/**
 * Sends email using mailgun.
 * @param {Object} options Contains user information and reactadmin query.
 * @return {Object} Returns a promise that resolves after calling mailgun.
 */
function emailUser(options) {
  return new Promise((resolve, reject) => {
    try {
      const { subject, user, basepath, emailtemplatefilepath, } = options;
      const email = {
        from: periodic.settings.periodic.emails.server_from_address,
        to: user.email,
        bcc: periodic.settings.periodic.emails.notification_address,
        subject,
        generateTextFromHTML: true,
        emailtemplatefilepath: path.resolve(periodic.config.app_root, emailtemplatefilepath),
        emailtemplatedata: {
          appname: periodic.settings.name,
          hostname: periodic.settings.application.hostname || periodic.settings.name,
          basepath,
          url: periodic.settings.application.url,
          protocol: periodic.settings.application.protocol,
          user,
        },
      };
      return resolve(periodic.core.mailer.sendEmail(email));
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Validates user, generates a user activation token, puts it onto user, and sends email.
 * @param {Object} options Contains user, entitytype, send email flag and reactadmin query.
 * @return {Object} Returns a promise that resolves after generating a new user activation token and emailing the user.
 */
function fastRegister(options) {
  const { user, entitytype = 'user', sendEmail, ra, } = options;
  const coreDataModel = passportUtilities.auth.getAuthCoreDataModel({ entitytype, });

  return new Promise((resolve, reject) => {
    try {
      let dbCreatedUser = {};
      passportUtilities.account.validate({ user, })
        .then(validatedUser => {
          return passportUtilities.token.generateUserActivationData({ user: validatedUser, });
        })
        .then(activationUser => {
          return coreDataModel.create({
            newdoc: activationUser,
          });
        })
        .then(createdUser => {
          dbCreatedUser = createdUser;
          if (sendEmail) {
            return emailUser({ user: createdUser, ra, basepath: '/auth/complete_registration', subject: 'Verify Your Email Address', emailtemplatefilepath: passportSettings.emails.welcome, });
          } else {
            return true;
          }
        })
        .then(emailStatus => {
          resolve(dbCreatedUser);
        })
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Generates a user activation token, puts it onto user, and sends email.
 * @param {Object} options Contains user, entitytype, send email flag and reactadmin query.
 * @return {Object} Returns a promise that resolves after generating a new user activation token and emailing the user.
 */
function newUserRegister(options) {
  const { user, entitytype = 'user', sendEmail, ra, association, userroles, } = options;
  const coreDataModel = passportUtilities.auth.getAuthCoreDataModel({ entitytype, });

  return new Promise((resolve, reject) => {
    try {
      let dbCreatedUser = {};
      passportUtilities.token.generateUserActivationData({ user, })
        .then(activationUser => {
          activationUser.association = association;
          activationUser.userroles = userroles;
          return coreDataModel.create({
            newdoc: activationUser,
          });
        })
        .then(createdUser => {
          dbCreatedUser = createdUser;
          if (sendEmail) {
            return emailUser({ user: Object.assign({}, createdUser._doc, { company: user.name, }), ra, basepath: '/auth/accept-invite', subject: 'Invitation To Join', emailtemplatefilepath: passportSettings.emails.new_user, });
          } else {
            return true;
          }
        })
        .then(emailStatus => {
          resolve(dbCreatedUser);
        })
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Encodes the data and returns a token.
 * @param {Object} options Contains data to be encoded.
 * @return {Object} Returns token.
 */
function encode(data) {
  return jwt.sign(data, passportSettings.api.secret);
}

/**
 * Generates the api keys.
 * @param {Object} options Contains user object.
 * @return {Object} Returns client_id, 2 different client_secrets, and public_key.
 */
function generateCredential(data) {
  const salt = crypto.randomBytes(16).toString('base64');
  const crypto_client_id = () => {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(data.username + new Date(), salt, 10, 16, 'sha512', (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(key.toString('hex'));
        }
      });
    });
  };
  const crypto_public_key = () => {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(data.name + new Date(), salt, 10, 16, 'sha512', (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(key.toString('hex'));
        }
      });
    });
  };
  const crypto_client_secret = () => {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(Math.random() + new Date(), salt, 10, 16, 'sha512', (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(key.toString('hex'));
        }
      });
    });
  };
  return Promise.all([ crypto_client_id(), crypto_public_key(), crypto_client_secret(), crypto_client_secret(), ]);
}

/**
 * Generates new token for resetting password.
 * @param {Object} options Contains user.
 * @return {Object} Returns promise that updates the user with the new reset token.
 */
function generateToken(options) {
  return new Promise((resolve, reject) => {
    try {
      const { user, } = options;
      const User = periodic.datas.get('standard_user');
      //Generate reset token and URL link; also, create expiry for reset token
      //make sure attributes exists || create it via merge
      const salt = bcrypt.genSaltSync(10);
      const now = new Date();
      let millisecondsPerDay = 86400000;
      const expires = new Date(now.getTime() + (passportSettings.forgot.token.reset_token_expires_minutes * 60 * 1000)).getTime();
      const reset_token = encode({
        email: user.email,
        apikey: user.apikey,
      });
      const reset_token_link = periodic.core.utilities.makeNiceName(bcrypt.hashSync(reset_token, salt));
      const reset_token_expires_millis = expires;
      let passportAttributes = {};
      if (user.extensionattributes && user.extensionattributes.passport && user.extensionattributes.passport.reset_token && user.extensionattributes.passport.reset_token_link && user.extensionattributes.passport.reset_token_expires_millis && (user.extensionattributes.passport.reset_token_expires_millis > (new Date().getTime() - millisecondsPerDay))) {
        passportAttributes = {
          reset_token: user.extensionattributes.passport.reset_token,
          reset_token_link: user.extensionattributes.passport.reset_token_link,
          reset_token_expires_millis: user.extensionattributes.passport.reset_token_expires_millis,
        };
      } else {
        passportAttributes = {
          reset_token,
          reset_token_link,
          reset_token_expires_millis,
        };
      }
      user.extensionattributes = Object.assign({}, user.extensionattributes);
      user.extensionattributes.passport = Object.assign({}, user.extensionattributes.passport, passportAttributes);
      User.update({
        updatedoc: user,
        depopulate: false,
      })
        .then(resolve)
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Puts token on user and sends email to user with forgot password link.
 * @param {Object} options Contains req, email, boolean for sending email, and ra.
 * @return {Object} Promise that resolves with an object containing emailStatus and updated user account.
 */
function forgotPassword(options) {
  const { req, email, organization, sendEmail, ra, } = options;
  return new Promise((resolve, reject) => {
    try {
      const User = periodic.datas.get('standard_user');
      let updatedUserAccount = {};
      User.query({ query: { email, }, })
        .then(users => {
          let user;
          users.forEach(userAcc => {
            userAcc = userAcc.toJSON ? userAcc.toJSON() : userAcc;
            if (userAcc.association && userAcc.association.organization.name && userAcc.association.organization.name.toString().toLowerCase() === organization.toString().toLowerCase()) user = userAcc;
          });

          if (!user) {
            if (passportSettings.notifications && passportSettings.notifications.invalid_email) reject(passportSettings.notifications.invalid_email);
            else resolve(true);
          } else if (user.status && user.status.active === false) {
            reject('Your account is not active at this time. Please contact the administrator for your company.');
          } else {
            updatedUserAccount = user;
            return generateToken({ user, });
          }
        })
        .then(updatedUser => {
          if (sendEmail) {
            return emailUser({ user: updatedUserAccount, ra, basepath: '/auth/user/reset', subject: 'Reset Your Password', emailtemplatefilepath: passportSettings.emails.forgot, });
          } else {
            return true;
          }
        })
        .then(emailStatus => {
          resolve({
            email: emailStatus,
            user: updatedUserAccount,
          });
        })
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Gets user based on reset_token_link
 * @param {Object} options Contains token.
 * @return {Object} Promise that resolves with reset token and user.
 */
function getToken(options) {
  const { token, } = options;
  return new Promise((resolve, reject) => {
    try {
      const User = periodic.datas.get('standard_user');
      let updatedUserAccount = {};
      User.load({ query: { 'extensionattributes.passport.reset_token_link': token, }, })
        .then(user => {
          if (!user) {
            throw new Error('Token is not valid. Please ensure you are using the most recent link sent to your email.');
          }
          updatedUserAccount = user;
          if (passportUtilities.account.hasExpired(user.extensionattributes.passport.reset_token_expires_millis) && THEMESETTINGS.token_timeout) {
            throw new Error('Password reset token has expired');
          } else {
            resolve({
              reset_token: user.extensionattributes.passport.reset_token,
              user,
            });
          }
        })
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Resets the token object on User.
 * @param {Object} options Contains user.
  * @return {Object} Promise that resolves with user.
 */
function invalidateToken(options) {
  return new Promise((resolve, reject) => {
    try {
      const { user, } = options;
      const passportAttributes = {
        reset_token: '',
        reset_token_link: '',
        reset_token_expires_millis: 0,
      };
      user.extensionattributes = Object.assign({}, user.extensionattributes);
      user.extensionattributes.passport = Object.assign({}, user.extensionattributes.passport, passportAttributes);
      resolve(user);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Resets user password.
 * @param {Object} options Contains token.
 * @return {Object} Promise that resolves with reset token and user.
 */
function resetPassword(options) {
  const { req, user, sendEmail, ra, } = options;
  return new Promise((resolve, reject) => {
    try {
      const User = periodic.datas.get('standard_user');
      let updatedUserAccount = {};
      invalidateToken({ user, })
        .then(updatedUser => {
          updatedUser.password = req.body.password;
          updatedUser[ passportSettings.registration.matched_password_field ] = req.body[ passportSettings.registration.matched_password_field ];
          updatedUserAccount = updatedUser;
          return passportUtilities.account.validate({ user: updatedUser, });
        })
        .then(validatedUser => {
          updatedUserAccount = validatedUser;
          User.update({
            updatedoc: validatedUser,
            depopulate: false,
          })
            .then(changedPWUser => {
              return changedPWUser;
            })
            .catch(reject);
        })
        .then(updatedUser => {
          if (sendEmail) {
            return emailUser({ user: updatedUserAccount, ra, basepath: '/auth/user/reset', subject: 'Password reset notification', emailtemplatefilepath: passportSettings.emails.forgot, });
          } else {
            return true;
          }
        })
        .then(emailStatus => {
          resolve({
            email: emailStatus,
            user: updatedUserAccount,
          });
        })
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Returns homepage appFeatures.
 * @return {Object} Object containing appFeatures.
 */
function homepageAppFeatures(userroletitle) {
  let appFeatures;
  if (userroletitle === 'user') {
    appFeatures = [
      {
        'title': 'LENDING CRM',
        'name': 'loan_acquisition',
        'svgIcon': '/images/elements/dashboard-lending.svg',
        'location': '/los/applicationsdashboard',
        'subtext': 'Next-gen platform for managing the borrower acquisition process',
        'className': 'strategy',
      }, {
        'title': 'DECISION ENGINE',
        'name': 'rules_engine',
        'svgIcon': '/images/elements/dashboard-underwriting.svg',
        'location': '/decision/processing/individual/run',
        'subtext': 'Automation of underwriting policies and data integrations',
        'className': 'simulation',
      }, {
        'title': 'MACHINE LEARNING',
        'name': 'machine_learning',
        'svgIcon': '/images/elements/dashboard-ml.svg',
        'location': '/ml/processing/individual',
        'subtext': 'Train and deploy machine learning models that make accurate predictions',
        'className': 'optimization',
      }, {
        'title': 'OCR TEXT RECOGNITION',
        'name': 'text_recognition',
        'svgIcon': '/images/elements/dashboard-ocr.svg',
        'location': '/ocr/processing/individual',
        'subtext': 'Extract handwritten text from PDFs with AI powered OCR',
        'className': 'implementation',
      }, ];
  } else if (userroletitle === 'admin') {
    appFeatures = [
      {
        'title': 'LENDING CRM',
        'name': 'loan_acquisition',
        'svgIcon': '/images/elements/dashboard-lending.svg',
        'location': '/los/applicationsdashboard',
        'subtext': 'Next-gen platform for managing the borrower acquisition process',
        'className': 'strategy',
      }, {
        'title': 'DECISION ENGINE',
        'name': 'rules_engine',
        'svgIcon': '/images/elements/dashboard-underwriting.svg',
        'location': '/decision/strategies/all',
        'subtext': 'Automation of underwriting policies and data integrations',
        'className': 'simulation',
      }, {
        'title': 'MACHINE LEARNING',
        'name': 'machine_learning',
        'svgIcon': '/images/elements/dashboard-ml.svg',
        'location': '/ml/models',
        'subtext': 'Train and deploy machine learning models that make accurate predictions',
        'className': 'optimization',
      }, {
        'title': 'OCR TEXT RECOGNITION',
        'name': 'text_recognition',
        'svgIcon': '/images/elements/dashboard-ocr.svg',
        'location': '/ocr/templates',
        'subtext': 'Extract handwritten text from PDFs with AI powered OCR',
        'className': 'implementation',
      }, ];
  } else if (userroletitle === 'owner') {
    appFeatures = [
      {
        'title': 'LENDING CRM',
        'name': 'loan_acquisition',
        'svgIcon': '/images/elements/dashboard-lending.svg',
        'location': '/los/applicationsdashboard',
        'subtext': 'Next-gen platform for managing the borrower acquisition process',
        'className': 'strategy',
      }, {
        'title': 'DECISION ENGINE',
        'name': 'rules_engine',
        'svgIcon': '/images/elements/dashboard-underwriting.svg',
        'location': '/decision/strategies/all',
        'subtext': 'Automation of underwriting policies and data integrations',
        'className': 'simulation',
      }, {
        'title': 'MACHINE LEARNING',
        'name': 'machine_learning',
        'svgIcon': '/images/elements/dashboard-ml.svg',
        'location': '/ml/models',
        'subtext': 'Train and deploy machine learning models that make accurate predictions',
        'className': 'optimization',
      }, {
        'title': 'OCR TEXT RECOGNITION',
        'name': 'text_recognition',
        'svgIcon': '/images/elements/dashboard-ocr.svg',
        'location': '/ocr/templates',
        'subtext': 'Extract handwritten text from PDFs with AI powered OCR',
        'className': 'implementation',
      }, {
        'title': 'COMPANY SETTINGS',
        'name': 'company_settings',
        'svgIcon': '/images/elements/dashboard-settings.svg',
        'location': '/company-settings/company_info',
        'subtext': 'Manage company information, user access, and API credentials',
        'className': 'settings',
      }, ];
  }
  return {
    appFeatures,
  };
}

/**
 * Returns product page appFeatures.
 * @return {Object} Object containing appFeatures.
 */
function productAppFeatures() {
  let appFeatures = [ {
    'title': 'LENDING CRM',
    'name': 'loan_acquisition',
    'svgIcon': '/images/elements/dashboard-lending.svg',
    'location': '/los/applicationsdashboard',
    'subtext': 'Next-gen platform for managing the borrower acquisition process',
    'className': 'strategy',
  }, {
    'title': 'MACHINE LEARNING',
    'link': '/ml/models',
    'name': 'machine_learning',
    'svgIcon': '/images/elements/dashboard-ml.svg',
    'per': 'Per Decision',
    'subtext': 'Train predictive models that make accurate business decisions, replacing repetitive human analysis',
    'className': 'optimization',
  }, {
    'title': 'DECISION ENGINE',
    'link': '/decision/strategies/all',
    'name': 'rules_engine',
    'svgIcon': '/images/elements/dashboard-underwriting.svg',
    'per': 'Per Process',
    'subtext': 'Combine rules-based business logic with machine learning models, without writing any code',
    'className': 'simulation',
  }, {
    'title': 'OCR Text Recognition',
    'link': '/ocr/templates',
    'name': 'text_recognition',
    'svgIcon': '/images/elements/dashboard-ocr.svg',
    'per': 'Per Page',
    'subtext': 'Extract handwritten or digital text from documents using AI-powered OCR, eliminating data entry',
    'className': 'strategy',
  }, ];
  return {
    appFeatures,
  };
}

/**
 * Returns unformatted phone number.
 * @param {String} phone Formatted phone number.
 * @returns {String} Unformatted phone number.
 */
function unformatPhoneNumber(phone) {
  if (typeof phone === 'string') {
    return phone.replace(/\D/g, '');
  } else {
    throw new Error('Phone number is not a string');
  }
}

async function createDefaultDocumentTemplate({ org }) {
  try {
    const org_id = org ? org._id.toString() : '';
    const template = {};
    const templateImagePaths = [ 0, 1, 2, 3, ].map((idx) => path.join(process.cwd(), `content/files/los/example_fillable_pdf-${idx}.png`));
    const aws_jpg_keys = await Promise.all(templateImagePaths.map(async (filepath, idx) => {
      const filename = `${new Date().getTime()}_${idx}_Example Loan Agreement.jpg`;
      const Body = fs.createReadStream(filepath);
      const options = {
        Key: `los_templates/${org_id}/${filename}`,
        Body,
      };
      await helpers.uploadToAWSFromStream(options);
      return filename;
    }));
    template.images = aws_jpg_keys || [];
    const pdfFileName = `${new Date().getTime()}_Example Loan Agreement.pdf`;
    const pdfFilePath = path.join(process.cwd(), 'content/files/los/example_fillable_pdf.pdf');
    const fileStream = fs.createReadStream(pdfFilePath);
    const options = {
      Key: `los_templates/${org_id}/${pdfFileName}`,
      Body: fileStream,
    };
    await helpers.uploadToAWSFromStream(options);
    template.fileurl = pdfFileName;
    template.fields = {
      'Loan Amount': '',
      'Monthly Payment': '',
      'Home Address': '',
      'Annual Interest Rate': '',
      'Origination Fee Percent': '',
      'Loan Term in Months': '',
      'Name': '',
    };
    return template;
  } catch (e) {
    logger.warn(e.message);
    return {
      images: [],
      fileurl: '',
      fields: {},
    };
  }
}

module.exports = {
  emailUser,
  fastRegister,
  generateCredential,
  newUserRegister,
  forgotPassword,
  getToken,
  resetPassword,
  homepageAppFeatures,
  productAppFeatures,
  unformatPhoneNumber,
  createDefaultDocumentTemplate,
};