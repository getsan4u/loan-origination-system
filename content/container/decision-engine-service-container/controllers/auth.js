'use strict';

/** Middleware for authentication/login purposes */

const periodic = require('periodicjs');
const logger = periodic.logger;
const passportSettings = periodic.settings.extensions[ 'periodicjs.ext.passport' ];
const reactAppSettings = periodic.settings.extensions[ '@digifi-los/reactapp' ];
const passportUtilities = periodic.locals.extensions.get('periodicjs.ext.passport');
const routeUtils = periodic.utilities.routing;
const utilities = require('../utilities');
const utilControllers = utilities.controllers;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const twilio = require('twilio');
const Promisie = require('promisie');
const path = require('path');

/**
 * Check if email exists in user collection. If it does, send error notification.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function checkEmailExists(req, res, next) {
  const User = periodic.datas.get('standard_user');
  let { org, } = req.controllerData;
  let email = req.body.username.toLowerCase();
  User.model.find({ email })
    .then(users => {
      let userExists = false;
      users.forEach(user => {
        let orgId = org._id.toString();
        let userOrg = (user && user.association && user.association.organization && user.association.organization.toString()) ? user.association.organization.toString() : null;
        if (user && orgId === userOrg) userExists = true;
      });
      if (userExists) {
        if (req.query && req.query.page === 'company_settings') next('Email already exists in our system.');
        else next('Email already exists in our system. Please sign in.');
      } else {
        next();
      }
    })
    .catch(err => {
      logger.error('Unable to load email', err);
      next(err);
    });
}

/**
 * Check if organizaton exists in organization collection. If it does, send error notification.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function checkOrgExists(req, res, next) {
  const Org = periodic.datas.get('standard_organization');
  req.controllerData = req.controllerData || {};
  Org.load({ query: { name: new RegExp(`^${req.body.name}$`, 'i'), }, })
    .then(org => {
      if (org) {
        if (!req.user || (req.user && req.user.association && req.user.association.organization && req.user.association.organization.name && req.user.association.organization.name.toLowerCase() !== org.name.toLowerCase())) {
          next('Company already exists in our system. Please enter a different company name.');
        } else {
          next();
        }
      } else {
        next();
      }
    })
    .catch(err => {
      logger.error('Unable to load organization', err);
      next(err);
    });
}

async function checkDigifiSupport(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    if (req.user && req.user.email === 'digifisupport@digifi.io') {
      return next();
    } else {
      res.status(500).send({});
    }
  } catch (e) {
    logger.error('checkDigifiSupport - Error : ', e);
    next(e);
  }
}

/**
 * Checks for multiple logins to same account and user inactivity. If true, will logout old user and redirect to appropriate blocking page.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function checkLogin(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    let redisClient = periodic.app.locals.redisClient;
    let nameToCheck = `${req.user.email.toLowerCase()}_${req.user.association.organization.name.toLowerCase()}`;
    redisClient.get(nameToCheck, (err, reply) => {
      if (err) {
        logger.error('checkMultipleLogins - Error getting user: ', err);
        next(err);
      } else {
        if (reply && (req.headers[ 'x-access-token' ])) {
          redisClient.set(nameToCheck, req.headers[ 'x-access-token' ], 'EX', THEMESETTINGS.inactivity_timer, (err, reply) => {
            if (err) {
              logger.error('putSessionOnRedis - Error setting user: ', err);
              next(err);
            }
            next();
          });
        } else if (!reply) {
          return res.status(400).send({
            result: 'error',
            data: {
              type: 'error',
              redirect: '/auth/inactivity_timeout',
            },
          });
        } else {
          return res.status(400).send({
            result: 'error',
            data: {
              type: 'error',
              redirect: '/auth/multiple_sessions',
            },
          });
        }
      }
    });
  } catch (err) {
    logger.error('checkMultipleLogins - Error : ', err);
    next(err);
  }
}

/**
 * Checks the user/organization status and acts as a blocking page if user, email, or mfa are not verified/activated. 
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function checkStatus(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Org = periodic.datas.get('standard_organization');
  Org.load({ query: { '_id': req.user.association.organization._id, }, })
    .then(org => {
      req.controllerData.org = org;
      req.controllerData.user = req.user;
      let active = org.status.active && req.user.status.active && req.user.status.email_verified;
      let referer = req.headers.referer;
      let host = req.headers.host;
      let url = referer.slice(referer.indexOf(host) + host.length);
      if (!active && url !== '/auth/activation') {
        return res.send({
          result: 'success',
          data: {
            redirect: '/auth/activation',
          },
        });
      } else if (url === '/auth/activation' && req.user.status.active && req.user.status.email_verified && org.status.active) {
        return res.send({
          result: 'success',
          data: {
            redirect: '/home',
          },
        });
      } else {
        return next();
      }
    })
    .catch(err => {
      logger.error('Unable to load organization', err);
      next(err);
    });
}

/**
 * Sends success response for invited user.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
function loginNewUser(req, res) {
  let org = req.controllerData.org;
  res.status(200).send({
    status: 200,
    response: 'success',
    // organization: org.name,
    // name: org.name,
    // username: req.controllerData.user.email,
    // password: req.body.password,
    pathname: '/auth/sign-in',
  });
}

/**
 * Put activation_token as query on return url.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function putTokenOnReturnURL(req, res, next) {
  req.controllerData = req.controllerData || {};
  let query = req.headers && req.headers.referer
    ? req.headers.referer.slice(req.headers.referer.indexOf('?activation_token'))
    : undefined;
  return res.status(200).send({
    status: 200,
    result: 'success',
    username: req.body.email,
    password: req.body.password,
    __returnURL: query,
  });
}

/**
 * Finds user based on activation token.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function findUserByActivationToken(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let token = (req.query && req.query.activation_token)
      ? req.query.activation_token
      : undefined;
    const User = periodic.datas.get('standard_user');
    User.load({ query: { 'extensionattributes.passport.user_activation_token_link': token, }, })
      .then(DBuser => {
        if (!DBuser) {
          res.redirect('/?email_token=invalid');
          return res.status(404).send({});
        }
        if (passportUtilities.account.hasExpired(DBuser.extensionattributes.passport.reset_activation_expires_millis) && THEMESETTINGS.token_timeout) {
          next('Activation token has expired');
        } else {
          DBuser = (typeof DBuser.toJSON === 'function') ? DBuser.toJSON() : DBuser;
          req.body.activation_token = token;
          req.user = DBuser;
          next();
        }
      })
      .catch(err => {
        logger.error('Unable to load user from activation token', err);
        next(err);
      });
  } catch (err) {
    logger.error('findUserByActivationToken error', err);
    next(err);
  }
}


/**
 * Verifies user email using passport.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function completeRegistration(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const entitytype = passportUtilities.auth.getEntityTypeFromReq({ req, accountPath: passportUtilities.paths.account_auth_forgot, userPath: passportUtilities.paths.user_auth_forgot, });
    passportUtilities.account.completeRegistration({
      req,
      user: req.user,
      entitytype,
      sendEmail: false,
    })
      .then(result => {
        req.controllerData.result = result;
        req.controllerData.data = req.controllerData.data || {};
        req.controllerData.data.redirect = '/home';
        next();
      })
      .catch(err => {
        logger.error('Complete Registration error', err);
        next(err);
      });
  } catch (err) {
    logger.error('completeRegistration error', err);
    next(err);
  }
}

/**
 * Sets email_verified to true on user.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function setEmailVerify(req, res, next) {
  const User = periodic.datas.get('standard_user');
  req.controllerData = req.controllerData || {};
  function updateUser() {
    User.update({
      id: req.controllerData.result.user._id,
      updatedoc: { 'status.email_verified': true, 'status.email_verified_time': Date.now(), },
      isPatch: true,
    })
      .then(() => {
        next();
      })
      .catch(err => {
        logger.error('Unable to update email_verified on user', err);
        next(err);
      });
  }
  setTimeout(updateUser, 0);
}

/**
 * Verifies password.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function verifyPassword(req, res, next) {
  req.controllerData = req.controllerData || {};
  return periodic.utilities.auth.comparePassword({ candidatePassword: req.user.password, userPassword: req.body.password, })
    .then(isMatch => {
      if (isMatch) {
        req.controllerData = Object.assign({}, req.controllerData, {
          status: 200,
          response: 'success',
        });
        next();
      } else {
        next('Incorrect Password.');
      }
    })
    .catch(err => {
      logger.error('verifyPassword error', err);
      next(err);
    });
}

/**
 * Generates new credentials.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function generateNewCredentials(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let client_secret, client_secret_2;
    utilControllers.auth.generateCredential({
      username: req.user.email,
      name: req.user.association.organization.name,
      password: req.user.password,
    })
      .then(credentials => {
        client_secret = credentials[ 2 ];
        client_secret_2 = credentials[ 3 ];
      })
      .then(() => {
        if (req.query && req.query.secret === '1') {
          req.controllerData.client = {
            _id: req.user.association.organization.association.client,
            client_secret: client_secret,
          };
        } else if (req.query && req.query.secret === '2') {
          req.controllerData.client = {
            _id: req.user.association.organization.association.client,
            client_secret_2: client_secret_2,
          };
        } else {
          logger.error('Nothing on req.query.secret');
          next('Nothing on req.query.secret');
        }
        next();
      })
      .catch(err => {
        logger.error('Unable to generate credentials', err);
        next(err);
      });
  } catch (err) {
    logger.error('generateNewCredentials error', err);
    next(err);
  }
}

/**
 * Middleware for sending email link for resetting password.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function forgot(req, res, next) {
  req.controllerData = req.controllerData || {};
  const entitytype = passportUtilities.auth.getEntityTypeFromReq({ req, accountPath: passportUtilities.paths.account_auth_forgot, userPath: passportUtilities.paths.user_auth_forgot, });
  utilControllers.auth.forgotPassword({
    req,
    organization: req.body.name,
    email: req.body.username,
    entitytype,
    sendEmail: true,
    ra: req.query.ra,
  })
    .then((result) => {
      if (!result || !result.email) return next('Invalid credentials. Please confirm your organization and email.');
      else return next();
    })
    .catch(err => {
      logger.error('forgot password error', err);
      next(err);
    });
}

function recoverOrganizations(req, res, next) {
  req.controllerData = req.controllerData || {};
  const User = periodic.datas.get('standard_user');
  let rb = req.body;
  User.model.find({ email: rb.username, }).populate('association.organization')
    .then(users => {
      if (!users.length) return res.status(400).send({ message: 'Unable to find any user with this email', });
      req.controllerData.organizations = [];
      req.controllerData.first_name;
      users.forEach(user => {
        if (user.email === rb.username) req.controllerData.organizations.push(user.association.organization.name);
        req.controllerData.first_name = user.first_name;
      });
      next();
    })
    .catch(err => {
      return res.status(400).send({
        message: 'Unable to find user in our organization',
      });
    });
}

async function sendOrganizationRecoveryEmail(req, res, next) {
  req.controllerData = req.controllerData || {};
  const email = {
    from: periodic.settings.periodic.emails.server_from_address,
    // to: 'mark@digifi.io',
    to: req.body.username,
    bcc: periodic.settings.periodic.emails.notification_address,
    subject: 'Recover Your Organization',
    generateTextFromHTML: true,
    emailtemplatefilepath: path.resolve(periodic.config.app_root, 'content/container/decision-engine-service-container/utilities/views/email/organization_recovery.ejs'),
    emailtemplatedata: {
      appname: periodic.settings.name,
      hostname: periodic.settings.application.hostname || periodic.settings.name,
      basepath: '/auth/sign-in',
      url: periodic.settings.application.url,
      protocol: periodic.settings.application.protocol,
      first_name: req.controllerData.first_name,
      organizations: req.controllerData.organizations,
      // appname: periodic.settings.name,
      // hostname: periodic.settings.application.hostname || periodic.settings.name,
      // url: periodic.settings.application.url,
      // protocol: periodic.settings.application.protocol,
      // amount_paid: Numeral(charge.amount / 100).format('$0,0.00'),
      // taxable_amount: Numeral(currentOrg.taxable_amount).format('$0,0.00'),
      // non_taxable_amount: Numeral(currentOrg.non_taxable_amount).format('$0,0.00'),
      // date_paid: moment().format('L'),
      // total_tax_owed: Numeral(currentOrg.total_tax_owed).format('$0,0.00'),
      // payment_method: `${charge.source.card.brand} - ${charge.source.card.last4}`,
    },
  };
  let emailSend = await periodic.core.mailer.sendEmail(email);
  next();
}

/**
 * Middleware for resetting password.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function resetPassword(req, res, next) {
  const entitytype = passportUtilities.auth.getEntityTypeFromReq({ req, accountPath: passportUtilities.paths.account_auth_forgot, userPath: passportUtilities.paths.user_auth_forgot, });
  utilControllers.auth.getToken({
    req,
    token: req.params.token,
    entitytype,
  })
    .then(result => {
      return utilControllers.auth.resetPassword({
        req,
        user: result.user,
        entitytype,
        sendEmail: false,
      });
    })
    .then(() => {
      next();
    })
    .catch(err => {
      logger.error('resetPassword error', err);
      next(err);
    });
}

/**
 * Puts session in redis on login. Will overwrite session if user already exists in redis.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function putSessionOnRedis(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    if (req.headers && req.headers.username && req.headers.token && req.headers.organization) {
      let redisClient = periodic.app.locals.redisClient;
      // inactivity timer set to 30 minutes
      redisClient.set(`${req.headers.username.toLowerCase()}_${req.headers.organization.toLowerCase()}`, req.headers.token, 'EX', THEMESETTINGS.inactivity_timer, (err, reply) => {
        if (err) {
          logger.error('putSessionOnRedis - Error setting user: ', err);
          next(err);
        }
        next();
      });
    } else {
      next();
    }
  } catch (err) {
    logger.error('putSessionOnRedis - Error: ', err);
  }
}


/**
 * Dynamically populate homepage based on user permissions.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function populateHomepage(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { org, } = req.controllerData;
  let userroletitle = req.user.userroles[ 0 ].title;
  let { appFeatures, } = utilControllers.auth.homepageAppFeatures(userroletitle);
  let products = org.products;
  if (req.user.userroles && req.user.userroles.length && req.user.userroles[ 0 ].title && (req.user.userroles[ 0 ].title !== 'admin' || req.user.userroles[ 0 ].title !== 'owner')) {
    appFeatures = appFeatures.filter(feature => {
      return [ 'Company Settings', 'Technical Setup', ].indexOf(feature.title) === -1;
    });
  }
  let width = 100 / appFeatures.length;
  req.controllerData.homepage = appFeatures.map(feature => {
    let productSettings = products[ feature.name ];
    if ((productSettings && productSettings.active === true) || feature.name === 'company_settings') {
      return {
        component: 'Column',
        props: {
          style: {
            display: 'flex',
            padding: '5px',
          },
        },
        children: [ {
          component: 'ResponsiveButton',
          props: {
            onclickBaseUrl: feature.location,
            aProps: {
              target: (feature.externalLocation) ? '_blank' : null,
              rel: (feature.externalLocation) ? 'noopener noreferrer' : null,
              className: '__dcp_hover_parent',
              style: {
                display: 'flex',
                textDecoration: 'none',
                width: '100%',
                minHeight: '160px',
              },
            },
          },
          children: [ {
            component: 'Box',
            props: {
              className: 'home_box_column ' + feature.className,
              style: {
                fontSize: '14px',
                textAlign: 'left',
                borderRadius: 10,
                boxShadow: 'rgba(17, 17, 17, 0.1) 0px 1px 1px, rgba(17, 17, 17, 0.1) 1px 1px 3px 2px',
                display: 'flex',
                flexDirection: 'column',
                flexFlow: 'Column',
                width: '100%',
                padding: '25px 20px',
              },
            },
            children: [ {
              component: 'div',
              children: [ {
                component: 'div',
                props: {
                  className: 'box_column_icon',
                  style: {
                    height: '5rem',
                    width: '5rem',
                    margin: '-10px 0 5px -8px',
                    marginLeft: (feature.name === 'text_recognition') ? '-10px' : undefined,
                    backgroundImage: 'url(' + feature.svgIcon + ')',
                    backgroundSize: '100% 300%',
                  },
                },
              }, ],
            }, {
              component: 'p',
              props: {
                style: {
                  fontWeight: 600,
                  userSelect: 'none',
                  color: 'inherit',
                  textAlign: 'left',
                  fontSize: '16px',
                  margin: '0.5em 0',
                },
              },
              children: feature.title,
            }, {
              component: 'p',
              props: {
                style: {
                  userSelect: 'none',
                  fontSize: '14px',
                  color: 'rgb(64,64,64)',
                  textAlign: 'left',
                },
              },
              children: feature.subtext,
            },
            ],
          },
          ],
        },
        ],
      };
    } else {
      return {
        component: 'Column',
        props: {
          style: {
            display: 'flex',
            padding: '5px',
          },
        },
        children: [ {
          component: 'ResponsiveButton',
          props: {
            // onclickBaseUrl: feature.location,
            aProps: {
              disabled: true,
              target: null,
              // className: '__dcp_hover_parent',
              style: {
                display: 'flex',
                textDecoration: 'none',
                width: '100%',
                minHeight: '160px',
              },
            },
          },
          children: [ {
            component: 'Box',
            props: {
              // className: 'home_box_column ' + feature.className,
              style: {
                fontSize: '14px',
                textAlign: 'left',
                borderRadius: 10,
                backgroundColor: 'rgb(218,218,218)',
                // boxShadow: 'rgba(17, 17, 17, 0.1) 0px 1px 1px, rgba(17, 17, 17, 0.1) 1px 1px 3px 2px',
                display: 'flex',
                flexDirection: 'column',
                flexFlow: 'Column',
                width: '100%',
                padding: '25px 20px',
                position: 'relative',
              },
            },
            children: [ {
              component: 'p',
              children: 'Product Not Active',
              props: {
                style: {
                  position: 'absolute',
                  right: '20px',
                },
              },
            }, {
              component: 'div',
              children: [ {
                component: 'div',
                props: {
                  className: 'box_column_icon',
                  style: {
                    height: '5rem',
                    width: '5rem',
                    margin: '-10px 0 5px -8px',
                    marginLeft: (feature.name === 'text_recognition') ? '-10px' : undefined,
                    backgroundImage: 'url(' + feature.svgIcon + ')',
                    backgroundSize: '100% 300%',
                    backgroundPosition: 'bottom',
                  },
                },
              }, ],
            }, {
              component: 'p',
              props: {
                style: {
                  fontWeight: 600,
                  userSelect: 'none',
                  color: 'inherit',
                  textAlign: 'left',
                  fontSize: '16px',
                  margin: '0.5em 0',
                },
              },
              children: feature.title,
            }, {
              component: 'p',
              props: {
                style: {
                  userSelect: 'none',
                  fontSize: '14px',
                  color: 'rgb(64,64,64)',
                  textAlign: 'left',
                },
              },
              children: feature.subtext,
            }, ],
          }, ],
        },
        ],
      };
    }
  });
  next();
}

/**
 * Dynamically populate homepage based on user permissions.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function populateProductpage(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { org, } = req.controllerData;
  let { appFeatures, } = utilControllers.auth.productAppFeatures();
  let products = org.products;
  if (req.user.userroles && req.user.userroles.length && req.user.userroles[ 0 ].title && req.user.userroles[ 0 ].title !== 'admin') {
    appFeatures = appFeatures.filter(feature => {
      return [ 'Company Settings', 'Technical Setup', ].indexOf(feature.name) === -1;
    });
  }
  let width = 100 / appFeatures.length;
  req.controllerData.pageData = appFeatures.map(feature => {
    let productdata = products[ feature.name ];
    return {
      component: 'Column',
      props: {
        style: {
          display: 'flex',
        },
      },
      children: [ {
        component: 'Box',
        props: {
          className: `home_box_column ${feature.className}_nohover`,
          style: {
            fontSize: '16px',
            textAlign: 'center',
            borderRadius: 10,
            boxShadow: 'rgba(17, 17, 17, 0.1) 0px 1px 1px, rgba(17, 17, 17, 0.1) 1px 1px 3px 2px',
            display: 'flex',
            flexDirection: 'column',
            flexFlow: 'Column',
            width: '100%',
          },
        },
        children: [ {
          component: 'div',
          children: [
            {
              component: 'a',
              props: {
                href: feature.link,
              },
              children: [ {
                component: 'div',
                props: {
                  className: 'box_column_icon',
                  style: {
                    height: '5rem',
                    width: '5rem',
                    margin: '0 auto',
                    backgroundImage: 'url(' + feature.svgIcon + ')',
                    backgroundSize: '100% 300%',
                    backgroundPosition: 'top',
                  },
                },
              }, ],
            }, ],
        },
        {
          component: 'a',
          props: {
            href: feature.link,
            style: {
              fontWeight: 600,
              userSelect: 'none',
              color: 'inherit',
              marginBottom: '1em',
            },
          },
          children: [
            {
              component: 'p',
              props: {
                style: {
                  fontWeight: 600,
                  userSelect: 'none',
                  color: 'inherit',
                },
              },
              children: feature.title,
            }, ],
        }, {
          component: 'p',
          props: {
            style: {
              userSelect: 'none',
              fontSize: '13px',
              color: 'rgb(64,64,64)',
            },
          },
          children: feature.subtext,
        }, {
          component: 'ResponsiveForm',
          props: {
            onSubmit: 'func:this.props.debug',
            blockPageUI: true,
            useFormOptions: true,
            flattenFormData: true,
            footergroups: false,
            formgroups: [ {
              gridProps: {
                style: {
                  margin: '0 auto',
                },
              },
              formElements: [
                {
                  name: 'status',
                  type: 'switch',
                  passProps: {
                    disabled: true,
                  },
                  value: (products[ feature.name ] && products[ feature.name ].active) ? 'on' : null,
                  layoutProps: {
                    className: 'horizontal-switch-centered',
                  },
                  onChange: `func:window.change${feature.name}Status`,
                  placeholder: (products[ feature.name ] && products[ feature.name ].active) ? 'Active' : 'Inactive',
                  placeholderProps: {
                    className: `${feature.name}Status`,
                    style: {
                      marginLeft: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#404041',
                    },
                  },
                },
              ],
            }, ],
          },
        }, ],
      }, ],
    };
  });
  next();
}

/**
 * Sends MFA code using Twilio.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function sendMFACode(req, res, next) {
  let { accountSid, authToken, sendingNumber, } = THEMESETTINGS.twilio;
  let requiredConfig = [ accountSid, authToken, sendingNumber, ];
  let isConfigured = requiredConfig.every(function (configValue) {
    return configValue || false;
  });
  if (!isConfigured) {
    next('accountSid, authToken, and sendingNumber must be set.');
  }
  let shortCode = Math.random().toString(10).substring(2, 8);
  let client = twilio(accountSid, authToken);
  let phone = (req.body && req.body.phone)
    ? req.body.phone
    : req.user.phone;
  return client.api.messages.create({
    from: sendingNumber,
    to: utilControllers.auth.unformatPhoneNumber(phone),
    body: `${shortCode} is your DigiFi verification code.`,
  })
    .then(() => {
      req.controllerData.shortCode = shortCode;
      next();
    })
    .catch(err => {
      logger.error('Unable to setup MFA', err);
      next(err);
    });
}

/**
 * Stores MFA Code on redis.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function storeMFACodeOnRedis(req, res, next) {
  let redisClient = periodic.app.locals.redisClient;
  redisClient.set(`${req.user.email}_${req.user.association.organization.name}_shortCode`, req.controllerData.shortCode, 'EX', THEMESETTINGS.inactivity_timer, (err, reply) => {
    if (err) {
      logger.error('storeMFACodeOnRedis - Error setting user shortcode: ', err);
      next(err);
    }
    next();
  });
}

/**
 * Verifies MFA Code with one stored on redis. Used for enabling MFA.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function verifyMFACode(req, res, next) {
  let redisClient = periodic.app.locals.redisClient;
  redisClient.get(`${req.user.email}_${req.user.association.organization.name}_shortCode`, (err, reply) => {
    if (err) {
      logger.error('verifyMFACode - Error getting user shortcode: ', err);
      next(err);
    } else {
      if (reply === req.body.code) {
        let status = Object.assign({}, req.user.status);
        let extensionattributes = Object.assign({}, req.user.extensionattributes, {
          passport_mfa: true,
        });
        status.mfa = true;
        req.controllerData.user = Object.assign({}, req.controllerData.user, {
          _id: req.user._id,
          status,
          extensionattributes,
        });
        // used for login mfa authentication
        req.controllerData = Object.assign({}, req.controllerData, {
          data: {
            authenticated: true,
          },
        });
        next();
      } else {
        next('Incorrect verification code.');
      }
    }
  });
}

/**
 * Checks if MFA is enabled.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function checkMFA(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const User = periodic.datas.get('standard_user');
    let body = req.body;
    body.username = body.username.toLowerCase();
    User.load({ query: { email: `${body.username}`, 'association.organization': req.controllerData.org._id, }, })
      .then(user => {
        if (!user) next('checkMFA error: Unable to find user');
        user = (user && user.toJSON) ? user.toJSON() : user;
        req.user = Object.assign({}, req.user, user);
        if (user.status && user.status.mfa) {
          next();
        } else {
          res.send(req.controllerData);
        }
      })
      .catch(err => {
        logger.error('checkMFA error: Unable to load user', err);
        next(err);
      });
  } catch (err) {
    logger.error('checkMFA error', err);
    next(err);
  }
}
/**
 * Redirect to home page with email verified query in url. Used for email validation.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
function redirectHomePage(req, res) {
  res.redirect('/?email_verified=true');
}

/**
 * Sends success response.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
function handleControllerDataResponse(req, res) {
  req.controllerData = req.controllerData || {};
  delete req.controllerData.authorization_header;
  res.send((req.controllerData.useSuccessWrapper) ? {
    result: 'success',
    data: req.controllerData,
  } : req.controllerData);
}

function getUserForUnauthenticatedRequest(options = {}) {
  if (!options.username || !options.password) {
    return Promisie.reject(new Error('Authentication Error'));
  } else {
    return new Promise((resolve, reject) => {
      try {
        let { client, req, username, password, organization, query, entitytype, } = options;
        let loginSettings = periodic.settings.extensions[ '@digifi-los/reactapp' ].login;
        query[ '$or' ] = (query[ '$or' ] && Array.isArray(query[ '$or' ]))
          ? query[ '$or' ].map(i => {
            if (i.name && typeof i.name === 'string') i.name = i.name.toLowerCase();
            if (i.email && typeof i.email === 'string') i.email = i.email.toLowerCase();
            return i;
          })
          : query[ '$or' ];
        const userAccountCoreData = periodic.locals.extensions.get('periodicjs.ext.passport').auth.getAuthCoreDataModel({ entitytype, }); //get from req
        if (loginSettings.organization_required && organization) {
          userAccountCoreData.query({
            query,
            population: ' ',
            fields: (periodic.settings.databases.standard.db === 'sequelize')
              ? undefined
              : {
                'primaryasset.changes': 0,
                'primaryasset.content': 0,
                'assets.changes': 0,
                '__v': 0,
                changes: 0,
                content: 0,
              },
          })
            .then(userAccounts => {
              let userAccount;
              userAccounts.forEach(userAcc => {
                userAcc = userAcc.toJSON ? userAcc.toJSON() : userAcc;
                if (userAcc && userAcc.association && userAcc.association.organization && userAcc.association.organization.name && userAcc.association.organization.name.toString().toLowerCase() === organization.toString().toLowerCase()) userAccount = userAcc;
              });
              resolve(Object.assign(options, { user: userAccount, }));
            })
            .catch(reject);
        } else if (loginSettings.organization_required && !organization) {
          reject('Organization name is required but was not provided');
        } else if (!loginSettings.organization_required) {
          userAccountCoreData.load({
            query,
            population: ' ',
            fields: (periodic.settings.databases.standard.db === 'sequelize')
              ? undefined
              : {
                'primaryasset.changes': 0,
                'primaryasset.content': 0,
                'assets.changes': 0,
                '__v': 0,
                changes: 0,
                content: 0,
              },
          })
            .then(userAccount => {
              //checkifuser
              //comparepassword
              resolve(Object.assign(options, { user: userAccount, }));
            })
            .catch(reject);
        }
      } catch (e) {
        reject(e);
      }
    });
  }
}

async function getJWTtoken(req, res) {
  const username = req.body.username || req.headers.username || req.body.name || req.headers.name;
  const clientId = req.body.clientid || req.headers.clientid;
  console.log('clientid: ', req.body.clientid, req.headers.clientid);
  const password = req.body.password || req.headers.password;
  const organization = req.body.organization || req.headers.organization || req.controllerData.org.name;

  let query = {
    $or: [ {
      name: username,
    }, {
      email: username,
    }, ],
  };
  // REFACTOR LATER
  if (req.user) delete req.user;
  if (req.session) req.session.destroy();
  const entitytype = req.body.entitytype || req.headers.entitytype || 'user';
  const Organization = periodic.datas.get('standard_organization');
  let requestedOrg = await Organization.load({ query: { name: new RegExp(`^${organization}$`, 'i'), }, });
  if (!requestedOrg) return res.status(400).send({
    message: 'Organization not found. If you don’t know your organization name you can recover it.',
  });
  return periodic.locals.extensions.get('periodicjs.ext.oauth2server').auth.findOneClient({ clientId, })
    .then(client => getUserForUnauthenticatedRequest({ client, req, query, username, password, organization, entitytype, }))
    .then(result => {
      if (result && !result.user) return Promise.reject(new Error('User not found in organization. Please reenter your email address.'));
      if (result && result.user && !result.user.password) return Promise.reject(new Error('Please accept your invitation and set your password before signing in.'));
      else return result;
    })
    .then(periodic.locals.extensions.get('periodicjs.ext.oauth2server').auth.validateUserForUnauthenticatedRequest)
    .then(periodic.locals.extensions.get('periodicjs.ext.oauth2server').auth.saveTokenForAuthenticatedUser)
    .then(result => {
      res.status(200).json({
        token: result.jwt_token,
        expires: result.expires,
        timeout: new Date(result.expires),
        user: (result.user && result.user.toJSON && typeof result.user.toJSON() === 'function') ?
          result.user.toJSON() : result.user,
      });
    })
    .catch(e => {
      let errortosend = (periodic.settings.application.environment === 'production') ? { message: e.message, } : e;
      logger.error('there was an authentication error', e);
      res.status(401).send(errortosend);
    });
}

async function checkSuperAdmin(req, res, next) {
  try {
    const username = req.body.username || req.headers.username || req.body.name || req.headers.name;
    const org = req.body.organization || req.headers.organization || req.controllerData.org.name;

    const Organization = periodic.datas.get('standard_organization');
    const User = periodic.datas.get('standard_user');
    let requestedOrg = await Organization.load({ query: { name: new RegExp(`^${org}$`, 'i'), }, });
    let superUser = await User.load({ query: { email: username, }, });
    if (requestedOrg && username && username === 'digifisupport@digifi.io') {
      User.update({
        id: superUser._id,
        updatedoc: {
          association: {
            organization: requestedOrg._id,
          },
        },
        isPatch: true,
      })
        .then(() => {
          next();
        })
        .catch(err => {
          console.log({ err, });
          next('Error logging in as DigiFi Support');
        });
    } else {
      next();
    }
  } catch (err) {
    console.log({ err, });
    next();
  }
}

/**
 * Checks for admin privileges. If not, returns error.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function adminOnly(req, res, next) {
  try {
    if (req.user.userroles[ 0 ].title === 'admin' || req.user.userroles[ 0 ].title === 'owner') {
      return next();
    } else {
      return next('You do not have the required permissions. Please contact your account administrator if you believe your permissions should be adjusted.');
    }
  } catch (err) {
    logger.error('adminOnly error:', err);
    return next(err);
  }
}

/**
 * Toggles product status on organization
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function toggleProductStatus(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { org, } = req.controllerData;
  let products = org.products;
  products[ req.query.type ].active = !products[ req.query.type ].active;
  delete req.controllerData.org.association.users;
  next();
}

/**
 * Blocks the creation of users with protected email addresses/usernames
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
function blockProtectedUsernames(req, res, next) {
  req.controllerData = req.controllerData || {};
  let protectedUsernames = [ 'digifisupport@digifi.io', ];
  let rb = req.body;
  let username = rb.username;
  if (username && protectedUsernames.includes(username.toLowerCase())) next('Unable to use that email address, please select a different email address.');
  else return next();
}

/**
 * Checks if the user is read only user
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
async function checkReadOnlyUser(req, res, next) {
  try {
    if (req.user) {
      const User = periodic.datas.get('standard_user');
      const UserPrivilege = periodic.datas.get('standard_userprivilege');
      const user = (req.user && req.user.toJSON) ? req.user.toJSON() : req.user;
      const userId = user._id.toString();
      const fullUser = await User.model.findOne({ _id: userId }).populate('userroles').lean();
      const userRole = fullUser.userroles[ 0 ];
      const userPrivilegeId = userRole.privileges[ 0 ];
      const userPrivilege = await UserPrivilege.model.findOne({ _id: userPrivilegeId.toString() }).lean();
      const userPermissionCode = userPrivilege.userprivilegeid;
      if (userPermissionCode === 103 && req.method !== 'GET') {
        return res.status(401).send({ message: 'You do not have permission to make changes' });
      } else {
        return next();
      }
    } else {
      return res.status(401).send({ message: 'You do not have permission to make changes' });
    }
  } catch (e) {
    console.log({ e });
    return res.status(401).send({ message: 'You do not have permission to make changes' });
  }
}

/**
 * Checks if the user is read only user
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {function} next express next function
 */
async function getUserPrivilegeCode(req, res, next) {
  try {
    if (req.user) {
      const User = periodic.datas.get('standard_user');
      const UserPrivilege = periodic.datas.get('standard_userprivilege');
      const user = (req.user && req.user.toJSON) ? req.user.toJSON() : req.user;
      const userId = user._id.toString();
      const fullUser = await User.model.findOne({ _id: userId }).populate('userroles').lean();
      const userRole = fullUser.userroles[ 0 ];
      const userPrivilegeId = userRole.privileges[ 0 ];
      const userPrivilege = await UserPrivilege.model.findOne({ _id: userPrivilegeId.toString() }).lean();
      const userPermissionCode = userPrivilege.userprivilegeid;
      req.controllerData.permissionCode = userPermissionCode;
    } else {
      req.controllerData.permissionCode = null; 
    }
    next();
  } catch (e) {
    req.controllerData.permissionCode = null; 
    console.log({ e });
    next();
  }
}

async function findOrCreateUserPrivilegesAndRoles(req, res, next) {
  try {
    const UserPrivilege = periodic.datas.get('standard_userprivilege');
    const UserRole = periodic.datas.get('standard_userrole');
    const privileges_count = await UserPrivilege.model.countDocuments();
    if (privileges_count === 0) {
      const privileges = [
        {
          userprivilegeid: 103,
          title: 'can view user pages',
          name: 'can-view-user',
        },
        {
          userprivilegeid: 102,
          title: 'can view admin pages',
          name: 'can-view-admin',
        },
        {
          userprivilegeid: 101,
          title: 'can view owner pages',
          name: 'can-view-owner',
        },
      ];
      const privileges_roles_map = {
        '101': {
          title: 'owner',
          name: 'owner',
          userroleid: 900,
        },
        '102': {
          title: 'admin',
          name: 'admin',
          userroleid: 500,
        },
        '103': {
          title: 'user',
          name: 'user',
          userroleid: 100,
        },
      };
      const created_privileges = await UserPrivilege.model.insertMany(privileges);
      if (created_privileges && created_privileges.length) {
        const user_roles = created_privileges.map(privilege => {
          const user_role = privileges_roles_map[ privilege.userprivilegeid ] || {};
          if (user_role.title) {
            user_role.privileges = [ privilege._id, ];
          }
          return user_role;
        });
        await UserRole.model.insertMany(user_roles);
      }
    }
    next();
  } catch (e) {
    logger.warn('error in findOrCreateUserPrivilegesAndRoles', e);
    next(e);
  }
}

module.exports = {
  getUserPrivilegeCode,
  checkDigifiSupport,
  checkReadOnlyUser,
  checkEmailExists,
  checkOrgExists,
  checkLogin,
  checkStatus,
  loginNewUser,
  putTokenOnReturnURL,
  findUserByActivationToken,
  completeRegistration,
  setEmailVerify,
  verifyPassword,
  generateNewCredentials,
  forgot,
  recoverOrganizations,
  sendOrganizationRecoveryEmail,
  resetPassword,
  putSessionOnRedis,
  populateHomepage,
  populateProductpage,
  toggleProductStatus,
  sendMFACode,
  storeMFACodeOnRedis,
  verifyMFACode,
  checkMFA,
  redirectHomePage,
  getJWTtoken,
  checkSuperAdmin,
  adminOnly,
  handleControllerDataResponse,
  blockProtectedUsernames,
  findOrCreateUserPrivilegesAndRoles,
};
