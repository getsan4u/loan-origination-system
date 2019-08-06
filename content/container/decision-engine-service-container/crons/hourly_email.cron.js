'use strict';
let periodic;
let User;
let CoreMailer;
let mailerSendEmail;
const Moment = require('moment');
const Promisie = require('promisie');
const path = require('path');

async function getUsers(query) {
  return User.query({ query, });
}

async function sendEmail(users, options) {
  let config = {
    from: `${options.from}`,
    subject: `${options.subject}`,
    generateTextFromHTML: true,
    bcc: periodic.settings.periodic.emails.notification_address,
    emailtemplatefilepath: path.resolve(periodic.config.app_root, `content/container/decision-engine-service-container/utilities/views/email/${options.templatename}`),
    emailtemplatedata: {},
  };
  let emails = users.forEach(async user => {
    config.emailtemplatedata.user = user;
    config.to = user.email;
    return await mailerSendEmail(config);
  })
  return emails;
}

const mainFunc = async function (req, res, next) {
  try {
    // let twoHourUsers = await getUsers({ $and: [{ 'status.unsubscribed': false, }, { 'status.email_verified': true, }, { 'status.email_verified_time': { $lte: Moment().utcOffset('-4:00').subtract(2, 'hours').toDate(), }, }, { 'createdat': { $gt: Moment().utcOffset('-4:00').subtract(3, 'hours').toDate(), }, },], });
    let oneDayUsers = await getUsers({ $and: [{ 'status.unsubscribed': false, }, { 'status.email_verified': true, }, { 'status.email_verified_time': { $lte: Moment().utcOffset('-4:00').subtract(1, 'days').toDate(), }, }, { 'createdat': { $gt: Moment().utcOffset('-4:00').subtract(1, 'days').subtract(1, 'hours').toDate(), }, },], });
    let threeDayUsers = await getUsers({ $and: [{ 'status.unsubscribed': false, }, { 'status.email_verified': true, }, { 'status.email_verified_time': { $lte: Moment().utcOffset('-4:00').subtract(3, 'days').toDate(), }, }, { 'createdat': { $gt: Moment().utcOffset('-4:00').subtract(3, 'days').subtract(1, 'hours').toDate(), }, },], });
    // let fiveDayUsers = await getUsers({ $and: [{ 'status.unsubscribed': false, }, { 'status.email_verified': true, }, { 'status.email_verified_time': { $lte: Moment().utcOffset('-4:00').subtract(5, 'days').toDate(), }, }, { 'createdat': { $gt: Moment().utcOffset('-4:00').subtract(5, 'days').subtract(1, 'hours').toDate(), }, },], });
    let sevenDayUsers = await getUsers({ $and: [{ 'status.unsubscribed': false, }, { 'status.email_verified': true, }, { 'status.email_verified_time': { $lte: Moment().utcOffset('-4:00').subtract(7, 'days').toDate(), }, }, { 'createdat': { $gt: Moment().utcOffset('-4:00').subtract(7, 'days').subtract(1, 'hours').toDate(), }, }, ], });
    
    // let twoHourEmails = await sendEmail(twoHourUsers, {
    //   subject: 'Thanks for signing up',
    //   from: 'Brad Vanderstarren <brad@digifi.io>',
    //   templatename: 'thanks_for_signing_up.ejs',
    // })
    let oneDayEmails = await sendEmail(oneDayUsers, {
      subject: 'DigiFi - Learn More: Common Use Cases & Applications',
      from: 'DigiFi <support@digifi.io>',
      templatename: 'learn_more_use_cases.ejs',
    })
    let threeDayEmails = await sendEmail(threeDayUsers, {
      subject: 'DigiFi - Learn More: The Evolution of Decision Automation',
      from: 'DigiFi <support@digifi.io>',
      templatename: 'learn_more_evolution.ejs',
    })
    // let fiveDayEmails = await sendEmail(fiveDayUsers, {
    //   subject: 'DigiFi - Tutorial: Training Machine Learning',
    //   from: 'DigiFi <support@digifi.io>',
    //   templatename: 'tutorial_machine_learning_models.ejs',
    // })
    let sevenDayEmails = await sendEmail(sevenDayUsers, {
      subject: 'DigiFi - Learn More: How AutoML is Leveling the Playing Field',
      from: 'DigiFi <support@digifi.io>',
      templatename: 'learn_more_automl.ejs',
    })
    

    if (next) return next();
  } catch (err) {
    console.log({ err, });
  }
};

var initialize = function (resources) {
  periodic = resources;
  User = periodic.datas.get('standard_user');
  CoreMailer = resources.core.mailer;
  mailerSendEmail = Promisie.promisify(CoreMailer.sendEmail);

  return mainFunc;
};

module.exports = initialize;