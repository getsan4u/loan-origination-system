'use strict';

/** Middleware for user */

const periodic = require('periodicjs');
const logger = periodic.logger;
const utilities = require('../utilities');
const helpers = utilities.helpers;
const Promisie = require('promisie');
const passportSettings = periodic.settings.extensions[ 'periodicjs.ext.passport' ];
const passportUtilities = periodic.locals.extensions.get('periodicjs.ext.passport');
const routeUtils = periodic.utilities.routing;
const utilControllers = utilities.controllers;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const randomKey = Math.random;
const styles = utilities.views.constants.styles;
const path = require('path');

/**
 * Uses passport to create a new user. Option to send email through passport.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function createUser(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const entitytype = passportUtilities.auth.getEntityTypeFromReq({ req, });
    const user = Object.assign({}, req.body);
    user.confirmpassword = user.password;
    user.email = user.username;
    user.phone = (req.body && req.body.phone_number) ? req.body.phone_number : null;
    const loginRedirectURL = routeUtils.route_prefix(passportSettings.redirect[ entitytype ].logged_in_homepage);
    let dbCreatedUser;
    utilControllers.auth.fastRegister({ user, entitytype, sendEmail: true, ra: req.query.ra, })
      .then(newDBCreatedUser => {
        dbCreatedUser = (newDBCreatedUser && typeof newDBCreatedUser.toJSON === 'function') ? newDBCreatedUser.toJSON() : newDBCreatedUser;
        const newUser = Object.assign({}, dbCreatedUser, { password: undefined, });
        req.controllerData = req.controllerData || {};
        req.controllerData.user = newUser;
        req.controllerData.loginRedirectURL = loginRedirectURL;
        next();
      })
      .catch(err => {
        logger.error('fastRegister error', err);
        next(err);
      });
  } catch (err) {
    logger.error('createUser error', err);
    next(err);
  }
}

/**
 * Updates user based on req.controllerData.user.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function updateUser(req, res, next) {
  req.controllerData = req.controllerData || {};
  const User = periodic.datas.get('standard_user');
  User.update({
    id: req.controllerData.user._id.toString(),
    updatedoc: req.controllerData.user,
    isPatch: (req.controllerData.isPatch === 'undefined') ? true : false,
  })
    .then(() => {
      req.body.username = req.controllerData.user.email;
      req.body.entitytype = 'user';
      next();
    })
    .catch(err => {
      logger.error('Unable to update user', err);
      next(err);
    });
}


/**
 * Sets user activation status to true, references the associated organization, and sets userrole to be admin.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function activateUser(req, res, next) {
  const Userrole = periodic.datas.get('standard_userrole');
  req.controllerData = req.controllerData || {};
  Userrole.load({ query: { 'title': 'owner', }, })
    .then(userrole => {
      if (!userrole) {
        return res.status(500).send({
          status: 500,
          data: {
            error: 'Cannot find owner userrole',
          },
        });
      }
      req.controllerData.user = Object.assign({}, req.controllerData.user, {
        status: {
          active: true,
          mfa: false,
          email_verified: false,
        },
        association: {
          organization: req.controllerData.org._id.toString(),
        },
        userroles: [userrole._id.toString(),],  
      });
      next();
    })
    .catch(err => {
      logger.error('Unable to load userrole', err);
      next(err);
    });
}

/**
 * Deletes specific user.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function deleteUser(req, res, next) {
  req.controllerData = req.controllerData || {};
  const User = periodic.datas.get('standard_user');
  const Org = periodic.datas.get('standard_organization');
  User.load({ query: { _id: req.params.id, }, })
    .then(user => {
      if (!user) next('Unable to find user');
      let deleteUser = User.delete({ deleteid: req.params.id, });
      let deleteOrgAssociation = Org.load({ query: { _id: user.association.organization._id, }, })
        .then(org => {
          let modOrg = Object.assign({}, org._doc);
          modOrg.association.users = Object.assign([], modOrg.association.users);
          modOrg.association.users = modOrg.association.users.filter(orgUser => {
            return orgUser._id.toString() !== req.params.id;
          });
          delete modOrg._id;
          return modOrg;
        })
        .then(modOrg => {
          return Org.update({
            id: user.association.organization._id,
            updatedoc: modOrg,
          });
        });
      req.controllerData = Object.assign({}, req.controllerData, {
        type: 'success',
        text: `User ${user.email} deleted.`,
        timeout: 10000,
      });
      return Promise.all([deleteUser, deleteOrgAssociation,]);
    })
    .then(() => {
      next();
    })
    .catch(err => {
      logger.error('deleteUser error', err);
      next(err);
    });
}

/**
 * Runs check on user being deleted.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
async function checkDeletedUser(req, res, next) {
  req.controllerData = req.controllerData || {};
  const User = periodic.datas.get('standard_user');
  try {
    let user = await User.load({ query: { _id: req.params.id, }, });
    if (!user) next('Unable to find user');
    else if (req.params.id === req.user._id.toString()) {
      return res.status(500).send({
        status: 500,
        data: {
          error: 'Cannot delete current user.',
        },
      });
    }
    req.controllerData = Object.assign({}, req.controllerData, {
      type: 'success',
      title: 'Delete User',
      pathname: `/modal/delete_user/${req.params.id}`,
    });
    return next();
  } catch(err) {
    logger.error('checkDeletedUser error', err);
    return next(err);
  }
}

/**
 * Performs checks on userrole.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function checkUserrole(req, res, next) {
  try {
    if (req.body && req.body.type) {
      req.controllerData = req.controllerData || {};
      req.controllerData.user = req.controllerData.user || {};
      let numOwners = 0;
      req.controllerData.org && req.controllerData.org.association && req.controllerData.org.association.users.forEach(user => {
        if (user.userroles.length && user.userroles[0].title === 'owner') {
          numOwners++;
        }
      });
      let isOwner = (req.controllerData.user && req.controllerData.user.userroles && req.controllerData.user.userroles[ 0 ] && req.controllerData.user.userroles[ 0 ].title && req.controllerData.user.userroles[ 0 ].title === 'owner') ? true : false;
      if (numOwners === 1 && isOwner && req.body.type !== 'owner') {
        return res.status(500).send({
          status: 500,
          data: {
            error: 'Organization needs an owner.',
          },
        });
      } else {
        next();
      }
    } else {
      next();
    }
  } catch (err) {
    logger.error('checkUserrole error', err);
    next(err);
  }
}

/**
 * Finds userrole id and puts it on req.controllerData.user.userroles.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function getUserrole(req, res, next) {
  try {
    if (req.body && req.body.type) {
      req.controllerData = req.controllerData || {};
      req.controllerData.user = req.controllerData.user || {};
      const Userrole = periodic.datas.get('standard_userrole');
      Userrole.load({ query: { 'title': req.body.type, }, })
        .then(role => {
          req.controllerData.user.userroles = [role._id.toString(),];
          next();
        })
        .catch(err => {
          logger.error('Unable to find userrole', err);
        });
    } else {
      next();
    }
  } catch (err) {
    logger.error('getUserrole error', err);
    next(err);
  }
}

/**
 * Checks number of users and returns error message if unable to add any more users.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function checkNumUsers(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let org = req.user.association.organization;
    if (org.association.users.length === org.account.users) {
      return res.status(500).send({
        message: 'Maximum number of users reached. Contact us to enable additional users.',
      });
    } else {
      req.controllerData = Object.assign({}, req.controllerData, {
        status: 200,
        response: 'success',
        pathname: '/modal/add_new_user',
        title: 'Add User',
      });
      next();
    }
  } catch (err) {
    logger.error('checkNumUsers error', err);
    next(err);
  }
}

/**
 * Sends email to new user and adds new user to the organization.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function setupNewUser(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let association = {
      organization: req.user.association.organization._id.toString(),
    };
    let userroles = req.controllerData.user.userroles;
    const entitytype = passportUtilities.auth.getEntityTypeFromReq({ req, });
    const user = Object.assign({}, req.body, { name: req.user.association.organization.name, });
    user.email = user.username;
    const loginRedirectURL = routeUtils.route_prefix(passportSettings.redirect[ entitytype ].logged_in_homepage);
    let dbCreatedUser;
    utilControllers.auth.newUserRegister({ user, entitytype, sendEmail: true, ra: req.query.ra, association, userroles, })
      .then(newDBCreatedUser => {
        dbCreatedUser = (newDBCreatedUser && typeof newDBCreatedUser.toJSON === 'function') ? newDBCreatedUser.toJSON() : newDBCreatedUser;
        const newUser = Object.assign({}, dbCreatedUser, { password: undefined, });
        req.controllerData = req.controllerData || {};
        req.controllerData.user = newUser;
        req.controllerData.loginRedirectURL = loginRedirectURL;
        req.controllerData = Object.assign({}, req.controllerData, {
          status: 200,
          result: 'success',
          callbackProps: {
            type: 'success',
            text:  `Email invitation sent to ${req.body.username}.`,
            timeout: 10000,
          },
        });
        next();
      })
      .catch(err => {
        logger.error('newUserRegister error', err);
        next(err);
      });
  } catch (err) {
    logger.error('setupNewUser error', err);
    next(err);
  }
}

/**
 * Sets req.controllerData.org with new added user.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function linkNewUserOrg(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.org = {
      _id: req.user.association.organization._id.toString(),
      association: {
        users: [req.controllerData.user._id.toString(), ],
      },
    };
    next();
  } catch (err) {
    logger.error('linkNewUserOrg error', err);
    next(err);
  }
}

/**
 * Gets user info based on id and puts it on controllerData.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function getUser(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const User = periodic.datas.get('standard_user');
    let params = req.params;
    let qry = req.query;
    let query = (req.query && req.query.id)
      ? { query: { _id: req.query.id, }, }
      : (req.params && req.params.id)
        ? { query: { _id: req.params.id, }, }
        : (req.user && req.user._id)
          ? { query: { _id: req.user._id.toString(), }, }
          : undefined;
    User.load(query)
      .then(user => {
        user = user.toJSON ? user.toJSON() : user;
        req.controllerData.user = user;
        return next();
      })
      .catch(err => {
        logger.error('Unable to find user', err);
      });
  } catch (err) {
    logger.error('getUser error', err);
    next(err);
  }
}

function resendInvitiationEmail(req, res, next) {
  req.body.username = req.controllerData.user.email;
  return utilControllers.auth.emailUser({ user: Object.assign({}, req.controllerData.user, { company: req.controllerData.user.association.organization.name, }), ra: {}, basepath: '/auth/accept-invite', subject: 'Invitation To Join', emailtemplatefilepath: passportSettings.emails.new_user, })
    .then(() => {
      return res.status(200).send({
        status: 200,
        result: 'success',
      });
    })
    .catch(err => {
      logger.error({ err });
      next(err);
    })
}

/**
 * Sends update user response.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function sendUpdateUserResponse(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData = Object.assign({}, req.controllerData, {
      status: 200,
      response: 'success',
      pathname: `/account-management/account/users/user-detail?id=${req.controllerData.user._id.toString()}`,
    });
    next();
  } catch (err) {
    logger.error('updateUserResponse error', err);
    next(err);
  }
}

/**
 * Sets new user's info (i.e. password, status, and esigns).
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function completeNewUser(req, res, next) {
  req.controllerData = req.controllerData || {};
  let token = (req.headers && req.headers.referer)
    ? req.headers.referer.slice(req.headers.referer.indexOf('activation_token')).split('=')[ 1 ]
    : undefined;
  const User = periodic.datas.get('standard_user');
  User.load({ query: { 'extensionattributes.passport.user_activation_token_link': token, }, })
    .then(DBuser => {
      if (!DBuser) {
        next('Token is not valid. Please ensure you are using the most recent link sent to your email.');
      }
      if (passportUtilities.account.hasExpired(DBuser.extensionattributes.passport.reset_activation_expires_millis) && THEMESETTINGS.token_timeout) {
        next('Activation token has expired');
      } else {
        DBuser = (typeof DBuser.toJSON === 'function') ? DBuser.toJSON() : DBuser;
        DBuser.activated = true;
        DBuser.extensionattributes = Object.assign({}, DBuser.extensionattributes);
        DBuser.extensionattributes.passport = Object.assign({}, DBuser.extensionattributes.passport);
        DBuser.extensionattributes.passport.reset_activation_expires_millis = undefined;
        DBuser.extensionattributes.passport.user_activation_token_link = undefined;
        DBuser.extensionattributes.passport.user_activation_token = undefined;
        return DBuser;
      }
    })
    .then(updatedUser => {
      updatedUser.password = req.body.password;
      updatedUser.confirmpassword = req.body.password;
      return passportUtilities.account.validate({ user: updatedUser, });
    })
    .then(validatedUser => {
      req.controllerData.user = validatedUser;
      req.controllerData.org = req.controllerData.user.association.organization;
      req.controllerData.user.association.organization = req.controllerData.user.association.organization._id.toString();
      req.controllerData.user.userroles = req.controllerData.user.userroles[0]._id.toString();
      req.controllerData.user.status = {
        mfa: false,
        active: true,
        email_verified_time: Date.now(),
        email_verified: true,
      };
      next();
    })
    .catch(err => {
      logger.error('completeNewUser error', err);
      next(err);
    });
}

/**
 * Put my account form on req.controllerData.user
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function putFormOnUser(req, res, next) {
  req.controllerData = req.controllerData || {};
  let user = req.controllerData.user || {};
  if (req.body && req.body.first_name && req.body.last_name) {
    user = Object.assign({}, user, { first_name: req.body.first_name, last_name: req.body.last_name, });
  }
  if (req.body && req.body.mfa && req.body.mfa === 'Enabled' && user.status.mfa === false) {
    return next('User must set up phone authentication from My Account Page.');
  } else if (req.body && req.body.mfa && req.body.mfa === 'Disabled') {
    user.status.mfa = false;
    user.extensionattributes = user.extensionattributes || {};
    user.extensionattributes.passport_mfa = false;
  } 
  if (req.body && req.body.active && req.body.active === 'Active') {
    user.status.active = true;
  } else if (req.body && req.body.active && req.body.active === 'Inactive'){
    user.status.active = false;
  }
  if (user && user._id && req.user && req.user._id && (req.user._id.toString() === user._id.toString()) && req.body.active && req.body.active === 'Inactive') {
    return next ('You are unable to set yourself to inactive.');
  }
  return next();
}

/**
 * Formats req.controllerData.user in order to update user.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function formatUser(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.controllerData.user = req.controllerData.user || {};
  req.controllerData.user.time_zone = req.controllerData.user.time_zone || 'Etc/GMT+5';
  if (req.controllerData.user.association && req.controllerData.user.association.organization) {
    req.controllerData.user.association.organization = req.controllerData.user.association.organization._id.toString();
  }
  req.controllerData.isPatch = false;
  next();
}

/**
 * Sends email to user and changes user email and sets email_verified to false on req.controllerData.user. Adds the new email and token to the redis session.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function changeEmail(req, res, next) {
  if (req.body) {
    let user = req.user;
    req.controllerData = req.controllerData || {};
    req.controllerData.user = req.controllerData.user || {};
    req.controllerData.user = Object.assign({}, req.controllerData.user, req.user._doc, {
      _id: req.user._id,
      email: req.body.username,
      status: Object.assign({}, req.user.status, {
        email_verified: false,
      }),
    });
    let millisecondsPerDay = 86400000;
    if (user.extensionattributes && user.extensionattributes.passport && user.extensionattributes.passport.user_activation_token && user.extensionattributes.passport.user_activation_token_link && user.extensionattributes.passport.reset_activation_expires_millis && (user.extensionattributes.passport.reset_activation_expires_millis > (new Date().getTime() - millisecondsPerDay))) {
      return utilControllers.auth.emailUser({ user: user, basepath: '/auth/complete_registration', subject: 'Verify Your Email Address', emailtemplatefilepath: passportSettings.emails.welcome, })
        .then(() => {
          let redisClient = periodic.app.locals.redisClient;
          return new Promise((resolve, reject) => {
            redisClient.set(req.body.username, req.headers['x-access-token'], (err, reply) => {
              if (err) {
                logger.warn('putSessionOnRedis - Error setting user: ', err);
                reject(err);
              }
              resolve(reply);
            });
          });
        })
        .then(() => {
          req.controllerData = Object.assign({}, req.controllerData, {
            status: 200,
            result: 'success',
            type: 'success',
            text:  `Verfication email sent to ${req.body.username}.`,
            timeout: 10000,
          });
          next();
        })
        .catch(err => {
          logger.error('Unable to send email to user', err);
          next(err);
        });   
    } else {
      return passportUtilities.token.generateUserActivationData({ user: req.controllerData.user, })
        .then(validatedUser => {
          return utilControllers.auth.emailUser({ user: validatedUser, basepath: '/auth/complete_registration', subject: 'Verify Your Email Address', emailtemplatefilepath: passportSettings.emails.welcome, });
        })
        .then(() => {
          let redisClient = periodic.app.locals.redisClient;
          return new Promise((resolve, reject) => {
            redisClient.set(req.body.username, req.headers['x-access-token'], (err, reply) => {
              if (err) {
                logger.warn('putSessionOnRedis - Error setting user: ', err);
                reject(err);
              }
              resolve(reply);
            });
          });
        })
        .then(() => {
          req.controllerData = Object.assign({}, req.controllerData, {
            status: 200,
            result: 'success',
            type: 'success',
            text:  `Verfication email sent to ${req.body.username}.`,
            timeout: 10000,
          });
          next();
        })
        .catch(err => {
          logger.error('Unable to send email to user', err);
          next(err);
        });    
    }
  } else {
    next();
  }
}

/**
 * Puts delete user text on req.controllerData.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function deleteUserModal(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.controllerData.deleteUserModal = [{
    component: 'div',
    props: {},
    children: `Do you want to delete ${req.controllerData.user.email}?`,
  }, {
    component: 'ResponsiveForm',
    props: {
      flattenFormData: true,
      footergroups: false,
      formgroups: [{
        gridProps: {
          key: randomKey(),
          className: 'modal-footer-btns',
        },
        formElements: [{
          type: 'layout',
          value: {
            component: 'ResponsiveButton',
            asyncprops: {
              onclickPropObject: ['deletedata', 'user', ],
            },
            props: Object.assign({}, styles.defaultconfirmModalStyle.yesButtonProps, {
              onClick: 'func:this.props.fetchAction',
              onclickBaseUrl: `/user/delete_user/${req.params.id}`,
              fetchProps: {
                method: 'DELETE',
              },
              successProps: {
                successCallback: 'func:window.hideModalandCreateNotificationandRefresh',
              },
            }),
            children: 'Delete',
          },
        }, {
          type: 'layout',
          value: {
            component: 'ResponsiveButton',
            props: Object.assign({}, styles.defaultconfirmModalStyle.noButtonProps, {
              onClick: 'func:this.props.hideModal',
              onclickProps: 'last',
            }),
            children: 'Cancel',
          },
        },
        ],
      },
      ],
    },
  },
  ];
  return next();
}

/**
 * Puts create user modal on req.controllerData.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function createModalForm(req, res, next) {
  req.controllerData.formgroups = [
    {
      'gridProps': {
        'key': randomKey(),
      },
      'formElements': [
        {
          'type': 'text',
          'name': 'first_name',
          'placeholder': 'First Name',
          'layoutProps': {
            'horizontalform': false,
          },
          'onBlur': true,
          'validateOnBlur': true,
          'errorIconRight': true,
          'submitOnEnter': true,
          'errorIcon': 'fa fa-exclamation',
          'label': 'First Name',
          'passProps': {
            'state': 'isDisabled',
          },
        },
      ],
    },
    {
      'gridProps': {
        'key': randomKey(),
      },
      'formElements': [
        {
          'type': 'text',
          'name': 'last_name',
          'placeholder': 'Last Name',
          'layoutProps': {
            'horizontalform': false,
          },
          'onBlur': true,
          'validateOnBlur': true,
          'errorIconRight': true,
          'submitOnEnter': true,
          'errorIcon': 'fa fa-exclamation',
          'label': 'Last Name',
          'passProps': {
            'state': 'isDisabled',
          },
        },
      ],
    },
    {
      'gridProps': {
        'key': randomKey(),
      },
      'formElements': [
        {
          'type': 'text',
          'name': 'email',
          'placeholder': 'Email Address',
          'layoutProps': {
            'horizontalform': false,
          },
          'onBlur': true,
          'validateOnBlur': true,
          'errorIconRight': true,
          'submitOnEnter': true,
          'errorIcon': 'fa fa-exclamation',
          'label': 'Email Address',
          'passProps': {
            'state': 'isDisabled',
          },
        },
      ],
    },
    {
      'gridProps': {
        'key': randomKey(),
      },
      'formElements': [
        {
          'layoutProps': {
            'horizontalform': false,
          },
          'type': 'dropdown',
          'label': 'Permission Type',
          'name': 'type',
          'value': 'Type',
          'passProps': {
            'selection': true,
            'fluid': true,
          },
          'errorIcon': 'fa fa-exclamation',
          'options': [
            {
              'label': 'Owner',
              'value': 'owner',
            },
            {
              'label': 'Admin',
              'value': 'admin',
            },
            {
              'label': 'User',
              'value': 'user',
            },
          ],
        },
      ],
    },
    {
      'gridProps': {
        'key': randomKey(),
      },
      'formElements': [
        {
          'layoutProps': {
            'horizontalform': false,
          },
          'type': 'dropdown',
          'label': 'Phone Authentication',
          'name': 'mfa',
          'passProps': {
            'selection': true,
            'fluid': true,
          },
          'errorIcon': 'fa fa-exclamation',
          'options': [
            {
              'label': 'Enabled',
              'value': 'Enabled',
            },
            {
              'label': 'Disabled',
              'value': 'Disabled',
            },
          ],
        },
      ],
    },
    {
      'gridProps': {
        'key': randomKey(),
      },
      'formElements': [
        {
          'layoutProps': {
            'horizontalform': false,
          },
          'type': 'dropdown',
          'label': 'Account Status',
          'name': 'active',
          'passProps': {
            'selection': true,
            'fluid': true,
          },
          'errorIcon': 'fa fa-exclamation',
          'options': [
            {
              'label': 'Active',
              'value': 'Active',
            },
            {
              'label': 'Inactive',
              'value': 'Inactive',
            },
          ],
        },
      ],
    },
    (req.controllerData.user && req.controllerData.user.extensionattributes && req.controllerData.user.extensionattributes.passport && req.controllerData.user.extensionattributes.passport.user_activation_token) ?
      {
        gridProps: {
          key: randomKey(),
        },
        formElements: [
          {
            type: 'layout',
            'layoutProps': {
              'style': {
                'textAlign': 'center',
              },
            },
            value: {
              component: 'ResponsiveButton',
              props: {
                onClick: 'func:this.props.fetchAction',
                onclickBaseUrl: `/user/resend_invitation_email/${req.controllerData.user._id}`,
                fetchProps: {
                  method: 'POST',
                },
                successProps: {
                  success: {
                    notification: {
                      text: 'Invitiation email sent!',
                      timeout: 10000,
                      type: 'success',
                    },
                  },
                },
                style: {
                  color: styles.colors.primary,
                },
              },
              'layoutProps': {
                'style': {
                  'textAlign': 'center',
                },
              },
              children: 'Resend Invitation Email',
            },
          },
        ],
      } : {},
    {
      'gridProps': {
        'key': randomKey(),
        'className': 'modal-footer-btns',
      },
      'formElements': [
        {
          'type': 'submit',
          'value': 'SAVE CHANGES',
          'passProps': {
            'color': 'isPrimary',
          },
          'layoutProps': {
            'style': {
              'textAlign': 'center',
            },
          },
          'name': 'editUser',
        },
      ],
    },
  ];
  return next();
}

/**
 * Adds phone number to req.controllerData.user.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function addPhoneNumber(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    if (req.body && req.body.phone) {
      req.controllerData.user = Object.assign({}, req.controllerData.user, {
        _id: req.user._id,
        phone: req.body.phone,
      });
    }
    next();
  } catch (err) {
    logger.error('addPhoneNumber error', err);
    next(err);
  }
}

/**
 * Puts two-factor text on req.controllerData.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function mfaPhoneText(req, res, next) {
  req.controllerData = req.controllerData || {};
  if (req.controllerData.user && req.controllerData.user.phone) {
    req.controllerData.mfaPhoneText = `Please enter the code sent to (xxx) xxx-${req.controllerData.user.phone.slice(-4)}.`;
  }
  next();
}

/**
 * Disables mfa on req.controllerData.user.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function disableMFA(req, res, next) {
  req.controllerData = req.controllerData || {};
  let status = Object.assign({}, req.user.status, {
    mfa: false,
  });
  let extensionattributes = Object.assign({}, req.user.extensionattributes, {
    passport_mfa: false,
  });
  req.controllerData.user = Object.assign({}, req.controllerData.user, {
    _id: req.user._id,
    status,
    extensionattributes,
  });
  next();
}

/**
 * Check if user has permission to update user.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function checkUpdateUser(req, res, next) {
  if (req.user.userroles[ 0 ].title === 'owner' || req.user._id.toString() === req.controllerData.user._id.toString()) return next();
  else return next('You do not have the required permissions. Please contact your account administrator if you believe your permissions should be adjusted.');
}

function getUsersFromParams(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    let email = req.params.email;
    const User = periodic.datas.get('standard_user');
    User.model.find({ email, })
      .then(users => {
        if (users && users.length) {
          req.controllerData.users = users;
          return next();
        } else {
          return next();
        }
      })
      .catch(err => {
        console.log(err);
        next(err);
      });
  } catch (err) {
    console.log({ err });
    next(err);
  }
}

function unsubscribeUsers(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    let { users } = req.controllerData;
    const User = periodic.datas.get('standard_user');
    if (users) {
      let updatedUsers = users.forEach(async user => {
        return await User.update({
          id: user._id,
          updatedoc: { 'status.unsubscribed': true, },
          isPatch: true,
        });
      })
      return res.status(200).send({
        status: 200,
        timeout: 10000,
        type: 'success',
        text: 'You are unsubscribed!',
      });
    } else {
      next('User not found');
    }
  } catch (err) {
    console.log(err);
    next();
  }
}

async function sendWelcomeEmail(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    let user = (req.controllerData && req.controllerData.result && req.controllerData.result.user) ? req.controllerData.result.user : req.controllerData.user;
    const CoreMailer = periodic.core.mailer;
    const mailerSendEmail = Promisie.promisify(CoreMailer.sendEmail);
    let config = {
      from: 'DigiFi <support@digifi.io>',
      to: user.email,
      subject: 'Welcome to DigiFi’s Loan Acquisition Platform!',
      generateTextFromHTML: true,
      bcc: periodic.settings.periodic.emails.notification_address,
      emailtemplatefilepath: path.resolve(periodic.config.app_root, 'content/container/decision-engine-service-container/utilities/views/email/welcome_to_digifi.ejs'),
      emailtemplatedata: Object.assign({}, { user }, {
        appname: periodic.settings.name,
        hostname: periodic.settings.application.hostname || periodic.settings.name,
        basepath: '/auth/sign-in',
        url: periodic.settings.application.url,
        protocol: periodic.settings.application.protocol,
      }),
    };
    config.emailtemplatedata.user.unsubscribe_link = config.emailtemplatedata.protocol + config.emailtemplatedata.url + `/unsubscribe/${user.email}`;
    next();
    let email = await mailerSendEmail(config);
  } catch (err) {
    console.log({ err });
    next(err);
  }
}

module.exports = {
  createUser,
  updateUser,
  activateUser,
  deleteUser,
  checkDeletedUser,
  checkUserrole,
  getUserrole,
  checkNumUsers,
  setupNewUser,
  linkNewUserOrg,
  getUser,
  resendInvitiationEmail,
  sendUpdateUserResponse,
  completeNewUser,
  putFormOnUser,
  formatUser,
  changeEmail,
  deleteUserModal,
  createModalForm,
  addPhoneNumber,
  mfaPhoneText,
  disableMFA,
  checkUpdateUser,
  getUsersFromParams,
  unsubscribeUsers,
  sendWelcomeEmail,
};