'use strict';

const moment = require('moment');
const moment_tz = require('moment-timezone');
const path = require('path');
const pluralize = require('pluralize');
const Promisie = require('promisie');
const capitalize = require('capitalize');
const mathjs = require('mathjs');
const numeral = require('numeral');
const RoutingNumberLookup = require('routing-number-lookup');
const periodic = require('periodicjs');
const logger = periodic.logger;
const randomKey = Math.random;
const cardprops = require('./views/shared/props/cardprops');
const styles = require('./views/constants/styles');
const unflatten = require('flat').unflatten;
const ERROR_MESSAGES = {
  'datasource_upload': {
    'binary': '"Historical Result" values must always be set to "true" where the event occurred and to "false" for observations where the event did not occur',
    'regression': '"Historical Result" values must always be set to a numeric value',
    'categorical': 'Format of the historical results does not match that of the selected model type.',
  }
}

function generateDSARequest(options) {
  let { user, model_query, useRegexp, headers, params, query, body, } = options;
  query = Object.assign({}, query, { format: 'json', });
  return {
    user: Object.assign({
      username: 'dcp',
    }, user),
    isAuthenticated: true,
    body,
    controllerData: {
      model_query,
      useRegexp,
    },
    query,
    params: (params) ? params : {},
    headers: Object.assign({
      host: 'dcp.localhost',
    }, headers, { 'Content-Type': 'application/json', 'Accept': 'application/json', }),
  };
}

function formatFileSize(filesize) {
  filesize = (typeof filesize !== 'number') ? Number(filesize) : filesize;
  return numeral(filesize).format('0.00b');
}

function formaterPhoneNumber(phone) {
  var phoneNumber = phone.replace(/\D/gi, ''),
    areaCode = phoneNumber.substring(0, 3),
    localNumber = phoneNumber.substring(3, phoneNumber.length);
  localNumber = localNumber.substring(0, 3) + '-' + localNumber.substring(3, localNumber.length);
  return '(' + areaCode + ') ' + localNumber;
}

function formatPhoneNumber(phone) {
  try {
    if (phone) {
      phone = (typeof phone !== 'string') ? phone.toString() : phone;
      return formaterPhoneNumber(phone);
    }
    return phone;
  } catch (e) {
    console.log('Field value not a valid phone format', e);
    return phone;
  }
}

function formatDate(date, timezone) {
  try {
    if (date) {
      if (isDST(date)) {
        date = moment_tz.tz(date, timezone || 'Etc/GMT+5').add(1, 'hours').format('MM/DD/YYYY | hh:mm:ssA')
      } else {
        date = moment_tz.tz(date, timezone || 'Etc/GMT+5').format('MM/DD/YYYY | hh:mm:ssA');
      }
    }
    return date;
  } catch (e) {
    console.log('Field value not a valid date format', e);
    return date;
  }
}

function formatDateNoTime(date, timezone) {
  try {
    if (date) {
      if (isDST(date)) {
        date = moment_tz.tz(date, timezone || 'Etc/GMT+5').add(1, 'hours').format('MM/DD/YYYY')
      } else {
        date = moment_tz.tz(date, timezone || 'Etc/GMT+5').format('MM/DD/YYYY');
      }
    }
    return date;
  } catch (e) {
    console.log('Field value not a valid date format', e);
    return date;
  }
}

function formatDateNoDay(date, timezone) {
  try {
    if (date) {
      if (isDST(date)) {
        date = moment_tz.tz(date, timezone || 'Etc/GMT+5').format('MM/YY');
      } else {
        date = moment_tz.tz(date, timezone || 'Etc/GMT+5').add(1, 'hours').format('MM/YY');
      }
      return date;
    }
    return date;
  } catch (e) {
    console.log('Field value not a valid date format', e);
    return date;
  }
}

function formatCBDOB(date) {
  try {
    if (date) {
      let date_split = date.split('-');
      return `${date_split[ 1 ]}/${date_split[ 2 ]}/${date_split[ 0 ]}`;
    } else {
      return '';
    }
  } catch (e) {
    console.log('Error formatting date', e);
    return date;
  }
}

function formatCBPAZ(address) {
  try {
    if (address) {
      let zipcode = address.substr(address.length - 5);
      return zipcode;
    } else {
      return '';
    }
  } catch (e) {
    console.log('Error formatting date', e);
    return address;
  }
}


function formatFormDate(date, timezone) {
  try {
    if (date) {
      date = moment_tz.tz(date, timezone || 'Etc/GMT+5').format('MM/DD/YYYY | hh:mm:ssA');
      console.log({ formdate: date });
      // if (useOffset) {
      //   return new moment(date).utcOffset(0).format('YYYY-MM-DD');
      // } else {
      //   return new moment(date).format('YYYY-MM-DD');
      // }
    }
    return date;
  } catch (e) {
    console.log('Field value not a valid date format', e);
    return date;
  }
}

function formatPercentage(num) {
  try {
    if (num || num === 0) {
      num = (typeof num !== 'number') ? Number(num) : num;
      return numeral(num).format('0.00%');
    }
    return num;
  } catch (e) {
    console.log('Field value not a valid number format', e);
    return num;
  }
}

function formatCurrency(num) {
  try {
    if (num || num === 0) {
      num = (typeof num !== 'number') ? Number(num) : num;
      return numeral(num).format('$0,0.00');
    } else {
      return num;
    }
  } catch (e) {
    console.log('Field value not a valid number format', e);
    return num;
  }
}

function formatCurrencyNoCents(num) {
  try {
    if (num || num === 0) {
      num = (typeof num !== 'number') ? Number(num) : num;
      return numeral(num).format('$0,0');
    } else {
      return num;
    }
  } catch (e) {
    console.log('Field value not a valid number format', e);
    return num;
  }
}

function capitalizeWords(str) {
  try {
    if (typeof str === 'string') {
      str = capitalize.words(str.toLowerCase());
    }
    if (typeof str !== 'string' && str.length) {
      str = str.map(word => {
        return capitalize.words(word.toLowerCase());
      });
    }
    return str;
  } catch (e) {
    console.log('Field value not a valid string format', e);
    return str;
  }
}

function formatStatus(str) {
  return capitalizeWords(str.replace('_', ' '));
}

function getAge(date) {
  try {
    var birthYear = moment(date).format('YYYY'),
      birthMonth = moment(date).format('MM'),
      birthDay = moment(date).format('DD'),
      fullDate = moment(`${birthYear}-${birthMonth}-${birthDay}`),
      diff = moment().diff(fullDate, 'months');
    return Math.floor(Number(diff) / 12);
  } catch (e) {
    return date;
  }
}

function obfuscateSSN(ssn) {
  try {
    if (typeof ssn === 'number') {
      ssn = ssn.toString();
    }
    if (typeof ssn === 'string') {
      var partial = ssn.substring(ssn.length - 4, ssn.length);
      ssn = '***-**-' + partial;
      return ssn;
    } else {
      var type = typeof ssn;
      throw new TypeError('Field is of type ' + type);
    }
  } catch (e) {
    console.log('Field value is not of string type', e);
    return ssn;
  }
}

function formatProcessingStatus(status) {
  try {
    if (typeof status === 'string') {
      let splitStatus = status.split('_');
      switch (splitStatus[ 0 ]) {
        case 'pre':
          return capitalizeWords(splitStatus.join('-'));
        default:
          return capitalizeWords(splitStatus.join(' '));
      }
    }
    return status;
  } catch (e) {
    console.log('Error formatting processing status: ', e);
    return status;
  }
}

function formatProductLink(product) {
  try {
    if (typeof product === 'string') {
      let splitProduct = product.split('-');
      switch (splitProduct[ 0 ]) {
        case 'pre':
          return capitalizeWords(splitProduct.join('-'));
        default:
          return capitalizeWords(splitProduct.join(' '));
      }
    }
    return product;
  } catch (e) {
    console.log('Error formatting Product Link: ', e);
    return product;
  }
}

function getPrimaryApplicant(applicants) {
  try {
    let primaryApplicant;
    applicants.forEach(applicant => {
      if (applicant.attributes.type === 'primary') primaryApplicant = applicant;
    });
    return primaryApplicant;
  } catch (e) {
    console.log('Error getting primary applicant ', e);
    return applicants[ 0 ];
  }
}

function getActiveCosignerApplicant(applicants) {
  try {
    let cosignerApplicant;
    applicants.forEach(applicant => {
      if ((applicant.attributes.type === 'cosigner' || applicant.attributes.type === 'coborrower') && applicant.applicant.processing.status !== 'rejected') {
        cosignerApplicant = applicant;
      }
    });
    return cosignerApplicant;
  } catch (error) {
    return false;
  }
}

function getApprovedCosignerApplicant(applicants) {
  try {
    let cosignerApplicant;
    applicants.forEach(entry => {
      if ((entry.attributes.type === 'cosigner' || entry.attributes.type === 'coborrower') && entry.applicant.processing.status === 'approved') {
        cosignerApplicant = entry;
      }
    });
    return cosignerApplicant;
  } catch (error) {
    return false;
  }
}

function dateSort(prev, next) {
  return Date.parse(prev.createdat) - Date.parse(next.createdat);
}

function getCustomerApplicant(applicants, customerId) {
  try {
    return applicants.filter(applicant => applicant.customer == customerId)[ 0 ];
  } catch (e) {
    console.log('error selector customer out of applicants', e);
    return applicants[ 0 ];
  }
}

function getRecentCosignerApplicant(applicants) {
  try {
    if (applicants.length > 1) {
      applicants = applicants.sort(dateSort);
      if (applicants[ applicants.length - 1 ].attributes.type !== 'primary') return applicants[ applicants.length - 1 ];
      else {
        //TODO: Temporary until we can conditionally pass GUID if it exists on Application detail
        return {
          applicant: {
            identification: {
              guid: '',
            },
          },
          customer: {
            identification: {
              guid: '',
            },
          },
        };
      }
    } else {
      //TODO: Temporary until we can conditionally pass GUID if it exists on Application detail
      return {
        applicant: {
          identification: {
            guid: '',
          },
        },
        customer: {
          identification: {
            guid: '',
          },
        },
      };
    }
  } catch (e) {
    console.log('Error getting most recent cosigner applicant ', e);
    return applicants;
  }
}

function getCustomerCommunication(comm) {
  if (comm.email.headers && comm.email.headers.from && comm.email.headers.from.length) {
    comm.email.headers.from = comm.email.headers.from.map(from => `${(from.name) ? from.name : ''}${(from.address) ? ' (' + from.address + ')' : ''}`);
    comm.email.headers.from = comm.email.headers.from.join();
  }
  if (comm.email.headers && comm.email.headers.cc && comm.email.headers.cc.length) {
    comm.email.headers.cc = comm.email.headers.cc.map(cc => `${(cc.name) ? cc.name : ''}${(cc.address) ? ' (' + cc.address + ')' : ''}`);
    comm.email.headers.cc = comm.email.headers.cc.join();
  }
  return comm;
}

function formatAdverseReasonCodes(adversecodes) {
  try {
    if (adversecodes.length) {
      return adversecodes.join(', ');
    } else {
      return '';
    }
  } catch (e) {
    console.log('Error formatting AdverseReasonCodes ', e);
    return '';
  }
}

function getDecryptedFilePath(options) {
  let { file, } = options;
  // var file = options.file;
  // throw new Error('where is being called');
  if (file) {
    let filepath = file.fileurl;
    if (file.attributes && file.attributes.encrypted_client_side) {
      filepath = options.dsa_secure_download_link + '/' + file._id + '?client_id=' + options.dsa_oauth_2_client.client_token_id + '&client_secret=' + options.dsa_oauth_2_client.client_secret;
    }
    file.fileurl = filepath;
    return file;
  }
}

function mountApplicantTPDFromVerification(verification) {
  let verificationData = {
    kba: {},
    otp: {},
    twn: {},
    lexisnexis: {},
    tu: {},
    plaid: [],
  };
  try {
    verification.sorad.third_party_bank_info.forEach(bankinfo => {
      if (bankinfo.type === 'authData_info') verificationData.plaid.push(bankinfo.third_party_source.parsed);
    });

    verification.sorad.third_party_identity_info.forEach(identityinfo => {
      if (identityinfo.third_party_source.sub_type === 'fraudPoint') verificationData.lexisnexis = identityinfo.third_party_source.parsed;

      if (identityinfo.third_party_source.sub_type === 'otp') {
        verificationData.otp = {
          otp_result: {
            otp_passed: (identityinfo.third_party_source.parsed && identityinfo.third_party_source.parsed.otp_result && identityinfo.third_party_source.parsed.otp_result.otp_passed) ?
              identityinfo.third_party_source.parsed.otp_result.otp_passed : false,
            otp_message: (identityinfo.third_party_source.parsed && identityinfo.third_party_source.parsed.otp_result && identityinfo.third_party_source.parsed.otp_result.otp_passed) ?
              'Passed' : 'Failed',
          },
        };
      }
      if (identityinfo.third_party_source.sub_type === 'kba_final' && identityinfo.third_party_source.parsed && identityinfo.third_party_source.parsed.questions) {
        verificationData.kba = {
          kba_result: {
            kba_message: `${identityinfo.third_party_source.parsed.questions.correct} of ${identityinfo.third_party_source.parsed.questions.total} passed`,
          },
        };
      }

      if (identityinfo.third_party_source.source === 'TU') verificationData.tu = identityinfo.third_party_source.parsed;

    });

    verification.sorad.third_party_income_info.forEach(incomeinfo => {
      if (incomeinfo.third_party_source.source === 'TWN') verificationData.twn = incomeinfo;
    });

    if (verificationData.lexisnexis && verificationData.lexisnexis.messages && verificationData.lexisnexis.messages.length) {
      verificationData.lexisnexis.message_string = verificationData.lexisnexis.messages.join('\n');
    }

    verificationData.lexisnexis.ln_confirmed = (verificationData.lexisnexis.ln_confirmed && typeof verificationData.lexisnexis.ln_confirmed === 'object') ? verificationData.lexisnexis.ln_confirmed : {};
    verificationData.lexisnexis.ln_confirmed.phone_reverse_lookup = verificationData.lexisnexis.ln_confirmed.phone_reverse_lookup || '';
    verificationData.lexisnexis.ln_confirmed.address_reverse_lookup = verificationData.lexisnexis.ln_confirmed.address_reverse_lookup || '';
    verificationData.lexisnexis.ln_confirmed.ssn = (verificationData.lexisnexis.ln_confirmed.ssn && typeof verificationData.lexisnexis.ln_confirmed.ssn === 'object') ? verificationData.lexisnexis.ln_confirmed.ssn : {};
    verificationData.lexisnexis.ln_confirmed.ssn.issuing_state = verificationData.lexisnexis.ln_confirmed.ssn.issuing_state || '';
    verificationData.lexisnexis.ln_confirmed.ssn.issuing_date = verificationData.lexisnexis.ln_confirmed.ssn.issuing_date || '';
    return verificationData;
  } catch (e) {
    console.log('Error parsing verification data for Key Fraud Indicators ', e);
    return verificationData;
  }
}

function formatProductTypes(attributes) {
  if (attributes) {
    let parsedAttribs = {};
    let attribKeys = Object.keys(attributes);

    for (let i = 0; i < attribKeys.length; i++) {
      let wordKey = attribKeys[ i ].toString();
      if (attributes[ attribKeys[ i ] ] !== null) {
        let wordValue = attributes[ attribKeys[ i ] ].split('_');
        Object.assign(parsedAttribs, {
          [ wordKey ]: capitalizeWords(wordValue.join(' ')),
        });
      } else {
        Object.assign(parsedAttribs, {
          [ wordKey ]: '',
        });
      }
    }
    return parsedAttribs;
  } else {
    return {
      requested_credit_product: '',
      selected_credit_product: '',
      requested_credit_product_type: '',
      selected_credit_product_type: '',
    };
  }
}

function formatSSN(ssn) {
  try {
    if (ssn && ssn.length === 9) {
      return ssn.replace(/(\w{3})(\w{2})(\w{4})/, '$1-$2-$3');
    } else {
      return '';
    }
  } catch (e) {
    console.log('Error formatting SSN ', e);
    return '';
  }
}

function rejectApplicationApplicants(user, updatefunc, applicants) {
  return new Promise((resolve, reject) => {
    try {
      let rejectedApplicants = [];
      applicants.forEach(entry => {
        let applicant = entry.applicant;
        if (applicant && applicant.processing && applicant.processing.status && applicant.processing.status !== 'rejected') {
          applicant.processing.status = 'rejected';
          rejectedApplicants.push(applicant);
        }
        return updatefunc(generateDSARequest({
          user: user,
          params: {
            id: applicant._id,
          },
          body: applicant,
        }));
      });
      Promise.all(rejectedApplicants)
        .then((updatedapplicants) => {
          resolve(updatedapplicants);
        })
        .catch(err => {
          reject(err);
        });
    } catch (e) {
      reject(e);
    }
  });
}

function checkApplicantsApproved(applicants) {
  let allApproved = true;
  try {
    applicants.forEach(entry => {
      if (entry.applicant.processing.status !== 'approved') allApproved = false;
    });
    return allApproved;
  } catch (e) {
    console.log('checkApplicantsApproved: ', e);
    return false;
  }
}

function getApplicantFICOScore(applicant) {
  let hard_credit_pull = (applicant && applicant.third_party_data && applicant.third_party_data.hard_credit_pull && applicant.third_party_data.hard_credit_pull.parsed) ?
    applicant.third_party_data.hard_credit_pull.parsed : {};
  return hard_credit_pull.fico_score;
}

function createIssuedProduct(options) {
  return new Promise((resolve, reject) => {
    try {
      let { req, createFunction, applicants, application, } = options;
      let primaryApplicant = applicants[ 0 ];
      let issuedproduct = {
        processing: {
          ach_batch_entry_number: null,
          does_not_collect: null,
          paystrings_12_months: null,
          transaction_code: null,
          loan_status: 'active',
          disbursement_status: null,
          originating_bank_status: null,
          originating_bank_funding_error: null,
          servicing_status: null,
          performance_status: null,
          custodian_status: null,
          trace_number: null,
        },
        primary_applicant: {
          first_name: primaryApplicant.applicant.contact.first_name,
          last_name: primaryApplicant.applicant.contact.last_name,
        },
        description: {
          credit_product: application.selected_offer.credit_product,
          credit_product_type: application.selected_offer.credit_product_type,
          annual_income: primaryApplicant.applicant.self_reported.annual_income,
          approved_loan_amount: application.selected_offer.approved_loan_amount,
          apr: application.selected_offer.apr,
          fico_score: getApplicantFICOScore(primaryApplicant),
          first_payment_date: null,
          graceperiod: null,
          interest_rate: application.selected_offer.annual_interest_rate,
          late_fee: null,
          maturity_date: null,
          net_funding: (application.selected_offer.approved_loan_amount - application.selected_offer.origination_fee_amount),
          note_date: null,
          nsf_fee: null,
          origination_fee: application.selected_offer.origination_fee_amount,
          origination_fee_rate: application.selected_offer.origination_fee_rate,
          pay_frequency: 'Monthly',
          payment_amount: application.selected_offer.monthly_payment,
          platform: '[Company Name]',
          internal_credit_score: null,
          purpose: 'General',
          reg_b_decision_date: application.processing.reg_b_decision_date,
          servicer: '[Servicer Name]',
          term: application.selected_offer.term,
          total_payments: application.selected_offer.total_payments,
        },
        sorad: {
          borrowers: applicants.map(entry => {
            return {
              customer: entry.customer,
              type: entry.attributes.type,
              applicant: entry.applicant,
              display_fields: {},
            };
          }),
          files: application.sorad.files,
          application: application._id,
        },
      };
      createFunction(generateDSARequest({
        user: req.user,
        body: issuedproduct,
      }))
        .then(result => {
          return resolve(result.data.sendData);
        })
        .catch(err => {
          return reject(err);
        });
    } catch (e) {
      reject(e);
    }
  });
}

function combineApplicantFiles(applicants) {
  let files = [];
  applicants.forEach(entry => {
    files = files.concat(entry.applicant.sorad.files);
  });
  return files;
}

function formatReviewState(reviewState) {
  try {
    if (reviewState) {
      let review_state_without_underscores = reviewState.split('_');
      let review_state = capitalizeWords(review_state_without_underscores).join(' ');
      return review_state;
    } else {
      return '';
    }
  } catch (e) {
    console.log('Error formatting SSN ', e);
    return '';
  }
}

function capitalizeAllWords(fullName) {
  try {
    if (fullName) {
      let first_and_last_name = fullName.split('_');
      let full_name = capitalizeWords(first_and_last_name).join(' ');
      return full_name;
    } else {
      return '';
    }
  } catch (e) {
    console.log('Error formatting SSN ', e);
    return '';
  }
}

function formatReviewer(reviewer) {
  try {
    if (reviewer.toLowerCase() === 'unassigned')
      reviewer = '';
    else if (reviewer) {
      reviewer = capitalizeAllWords(reviewer);
      return reviewer;
    } else {
      return '';
    }
  } catch (e) {
    console.log('Error formatting Reviewer ', e);
    return '';
  }
}

function checkValidRoutingNumber(accountInformation) {
  let account = {};
  if (accountInformation) {
    account = {
      'accountHolder': accountInformation.bank_account_holder,
      'accountNumber': accountInformation.bank_account_number,
      'routingNumber': accountInformation.bank_routing_number,
      'accountType': accountInformation.bank_account_type,
    };
    var rn = new RoutingNumberLookup({
      routingNumber: account.routingNumber,
      parseOptions: [ {
        selector: '.ublcrnright',
        get: 'html',
      }, {
        selector: '.ublcrndetail tr',
        get: 'html',
      }, ],
    });
    return rn.lookup()
      .then(_this => {
        _this.parse();
        var isValid = (/\d+\s?\w+\s?valid/gi.test(_this.parseData[ 0 ])) ? true : false,
          bankName;
        (function () {
          var str = _this.parseData[ 1 ],
            start = str.indexOf('<a') + 1;
          while (str[ start ] !== '>') {
            start++;
          }
          str = str.substring(start + 1, str.length);
          var end = str.indexOf('</a');
          bankName = str.substring(0, end);
        })();
        return bankName;
      })
      .then(bank_name => {
        return {
          'bank_account_holder': account.accountHolder,
          'bank_account_name': bank_name,
          'bank_account_number': account.accountNumber,
          'bank_routing_number': account.routingNumber,
          'bank_account_type': account.accountType,
        };
      })
      .
      catch(e => {
        console.log('Error getting bank name');
        return {
          'bank_account_holder': account.accountHolder,
          'bank_account_name': 'Unavailable',
          'bank_account_number': account.accountNumber,
          'bank_routing_number': account.routingNumber,
          'bank_account_type': account.accountType,
        };
      });
  } else {
    return {
      'bank_account_holder': account.accountHolder,
      'bank_account_name': 'Unavailable',
      'bank_account_number': account.accountNumber,
      'bank_routing_number': account.routingNumber,
      'bank_account_type': account.accountType,
    };
  }
}

function allApplicantsUnderReview(application) {
  let value = true;
  if (application.sorad.applicants) {
    application.sorad.applicants.forEach(applicant => {
      if (applicant.applicant.processing) {
        if (applicant.applicant.processing.status !== 'under_review') {
          value = false;
        }
      }
    });
    return value;
  }
}

function transformOfferProductName(offer) {
  let transformName = capitalize.words(offer.model_code.split('-').join(' ')).replace(/01|06/, ' Month');
  if (transformName === 'Unsecured Consumer Travel Rewards Credit Card') return 'Platinum Travel Explorer Credit Card';
  if (transformName === 'Unsecured Consumer Cash Back Credit Card') return 'Unlimited Cash Back Credit Card';
  if (transformName === 'Unsecured Consumer Credit Card With Balance Transfer') return 'Preferred Credit Card';
  return transformName;
}

/**
 * Converts currency in string form to number
 * @param {String} str Currency in string form
 */
function unformatCurrency(str) {
  if (!str) return 0;
  else return Number(str.replace(/[\$\,]/g, ''));
}

/**
 * Returns a modified collateral object
 * @param {Object} collateral Collateral object
 */
function formatCollateralInfo(collateral) {
  let modifiedCollateral = Object.assign({}, collateral, {
    property_purchase_price: collateral.property_purchase_price ? formatCurrency(collateral.property_purchase_price) : null,
    time_at_address: (typeof collateral.time_at_property_address_years === 'number' && typeof collateral.time_at_property_address_months === 'number') ? `${collateral.time_at_property_address_years} years, ${collateral.time_at_property_address_months} months` : null,
    mortgage_outstanding_balance: collateral.mortgage_outstanding_balance ? formatCurrency(collateral.mortgage_outstanding_balance) : null,
    mortgage_monthly_payment: collateral.mortgage_monthly_payment ? formatCurrency(collateral.mortgage_monthly_payment) : null,
    insurance_monthly_payment: collateral.insurance_monthly_payment ? formatCurrency(collateral.insurance_monthly_payment) : null,
    tax_monthly_payment: collateral.tax_monthly_payment ? formatCurrency(collateral.tax_monthly_payment) : null,
    other_loan_monthly_payment: collateral.other_loan_1_monthly_payment
      ? collateral.other_loan_2_monthly_payment
        ? formatCurrency(collateral.other_loan_1_monthly_payment + collateral.other_loan_2_monthly_payment)
        : formatCurrency(collateral.other_loan_1_monthly_payment)
      : null,
    other_expense_monthly_payment: collateral.other_expense_1_monthly_payment
      ? collateral.other_expense_2_monthly_payment
        ? formatCurrency(collateral.other_expense_1_monthly_payment + collateral.other_expense_2_monthly_payment)
        : formatCurrency(collateral.other_expense_1_monthly_payment)
      : null,
  });
  modifiedCollateral.total_monthly_payment = formatCurrency(unformatCurrency(modifiedCollateral.mortgage_monthly_payment) + unformatCurrency(modifiedCollateral.insurance_monthly_payment) + unformatCurrency(modifiedCollateral.tax_monthly_payment) + unformatCurrency(modifiedCollateral.other_loan_monthly_payment) + unformatCurrency(modifiedCollateral.other_expense_monthly_payment));
  return modifiedCollateral;
}

/**
 * Coerces the CSV row value
 * 
 * @param {*} value 
 */
function formatCSVRowValue(value) {
  if (/^\[.*\]$/.test(value)) {
    value = value.replace(/^\[(.*)\]$/, '$1');
    value = value.split(';').map(val => {
      switch (val) {
        case 'TRUE':
          val = true;
          break;
        case 'FALSE':
          val = false;
          break;
        case 'null':
          val = null;
          break;
        default:
          break;
      }
      if (typeof val === 'string' && !isNaN(Number(val))) val = Number(val);
      if (typeof val === 'string' && val.includes('\'')) val = val.replace(/'/g, '');
      if (typeof val === 'string' && !val.length) val = undefined;
      return val;
    });
  } else if (/^\{.*\}$/.test(value)) {
    value = JSON.parse(value);
  } else {
    switch (value.toUpperCase()) {
      case 'TRUE':
        value = true;
        break;
      case 'FALSE':
        value = false;
        break;
      case 'NULL':
        value = null;
        break;
      default:
        break;
    }
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) value = Number(value);
    if (typeof value === 'string' && value.includes('\'')) value = value.replace(/'/g, '');
    if (typeof value === 'string' && !value.length) value = undefined;
  }
  return value;
}

function isDST(date) {
  const year = new Date(date).getFullYear();
  const marchDate = moment([year, 2, 1]).day(14).get('date') === 15 ? moment([year, 2, 1]).day(7) : moment([year, 2, 1]).day(14);
  const novemberDate = moment([year, 10, 1]).day(7).get('date') === 8 ? moment([year, 10, 1]).day(0) : moment([year, 10, 1]).day(7);
  return date.toISOString() < novemberDate.toISOString() && date.toISOString() > marchDate.toISOString();
}

function getDateAndTime({ date, format = 'MM/DD/YY_h:mm:ss a', timezone }) {
  try {
    if (date) {
      date = moment_tz.tz(date, timezone || 'Etc/GMT+5').format(format);
    }
    return date;
  } catch (e) {
    logger.error('Field value not a valid date format', e);
    return date;
  }
}

function isJsonString(req) {
  try {
    req.body.value = req.body.value.split(',').reduce((acc, curr) => {
      if (curr.trim()[ 0 ] === '"') acc.push(curr);
      else acc[ acc.length - 1 ] = acc[ acc.length - 1 ] + ',' + curr;
      return acc;
    }, []).map(i => i.split(':').map(i => i.trim()).join(':')).join(',');
    JSON.parse(`{${req.body.value}}`);
  } catch (e) {
    req.error = e.message;
    return false;
  }
  return true;
}

function convertVariableType(value, type = 'String') {
  if (!String(value).length) return null;
  if (type === 'Number' && !isNaN(Number(numeral(value).value()))) return Number(numeral(value).value());
  if (type === 'Boolean' && value.toLowerCase() === 'true') return true;
  if (type === 'Date' && moment(value)) return moment(value).format('MM/DD/YYYY');
  if (type === 'Boolean' && value.toLowerCase() === 'false') return false;
  return value;
}

function coerceDataType(val, dt) {
  try {
    if (dt === 'Boolean') {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        val = val.toLowerCase();
        if (val === 'true') return true;
        else if (val === 'false') return false;
        else return null;
      } else {
        return null;
      }
    } else if (dt === 'String') {
      return (val.length) ? `${val}` : null;
    } else if (dt === 'Number') {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        if (!val.length) return null;
        val = numeral(val)._value;
        if (!isNaN(val)) return val;
        else return null;
      } else {
        return null;
      }
    } else if (dt === 'Date') {
      return (String(val).length) ? val : null;
    }
  } catch (e) {
    return e;
  }
}

function getMedian(sortedArr) {
  let half = Math.floor(sortedArr.length / 2);
  if (sortedArr.length % 2) return sortedArr[ half ];
  else return (sortedArr[ half - 1 ] + sortedArr[ half ]) / 2.0;
}

function getMode(sortedArr) {
  let valueMap = {};
  sortedArr.forEach(element => {
    if (element !== undefined && element !== null) {
      if (valueMap[ element.toString() ] === undefined) valueMap[ element.toString() ] = 0;
      valueMap[ element.toString() ]++;
    }
  });
  let frequency = [];
  let max = 0;
  let maxVal;
  Object.keys(valueMap).forEach(key => {
    if (valueMap[ key ] > max) {
      max = valueMap[ key ];
      maxVal = key;
    }
  });
  return Number(maxVal);
}

function getStringMode(sortedArr) {
  let valueMap = {};
  sortedArr.forEach(element => {
    if (element !== undefined && element !== null) {
      if (valueMap[ element.toString() ] === undefined) valueMap[ element.toString() ] = 0;
      valueMap[ element.toString() ]++;
    }
  });
  let frequency = [];
  let max = 0;
  let maxVal;
  Object.keys(valueMap).forEach(key => {
    if (valueMap[ key ] > max) {
      max = valueMap[ key ];
      maxVal = key;
    }
  });
  return maxVal;
}

function getMinimum(sortedArr) {
  return sortedArr[ 0 ];
}

function getMaximum(sortedArr) {
  return sortedArr[ sortedArr.length - 1 ];
}

function getMean(sortedArr) {
  let sum = sortedArr.reduce((a, b) => a + b, 0);
  return sum / sortedArr.length;
}

function generatePredictorVariableCard(name, variable_config, idx) {
  let { mean, median, mode, min, max } = variable_config;
  return {
    gridProps: {
      key: randomKey(),
      subColumnProps: {
        style: {
          paddingTop: 0,
          paddingBottom: 0,
        }
      },
    },
    card: {
      twoColumns: false,
      props: (idx === 0)
        ? Object.assign({}, cardprops({
          cardTitle: name,
          cardStyle: {
            marginBottom: 0,
            boxShadow: null,
            borderRadius: 0,
          },
        }), {
            display: true,
          })
        : Object.assign({}, styles.collapsedCardProps, {
          cardTitle: name,
          display: false,
        }),
    },
    formElements: [ {
      label: 'Range',
      value: (typeof min === 'number' && typeof max === 'number') ? `${min} to ${max}` : 'N/A',
      passProps: {
        state: 'isDisabled',
      },
      layoutProps: {
        style: {
          width: '25%',
          paddingRight: '10px',
          display: 'inline-block',
        }
      }
    }, {
      label: 'Mean',
      value: (typeof mean === 'number') ? mean.toFixed(2) : 'N/A',
      passProps: {
        state: 'isDisabled',
      },
      layoutProps: {
        style: {
          width: '25%',
          paddingRight: '10px',
          display: 'inline-block',
        }
      }
    }, {
      label: 'Median',
      value: (typeof median === 'number') ? median : 'N/A',
      passProps: {
        state: 'isDisabled',
      },
      layoutProps: {
        style: {
          width: '25%',
          paddingRight: '10px',
          display: 'inline-block',
        }
      }
    }, {
      label: 'Mode',
      value: (typeof mode === 'number') ? mode : 'N/A',
      passProps: {
        state: 'isDisabled',
      },
      layoutProps: {
        style: {
          width: '25%',
          display: 'inline-block',
        }
      }
    }, {
      type: 'datatable',
      name: name,
      flattenRowData: true,
      useInputRows: true,
      addNewRows: false,
      ignoreTableHeaders: [ '_id', ],
      headers: [
        {
          label: 'Transformation',
          sortid: 'type',
          sortable: false,
        }, {
          label: 'Predictive Power (R²)',
          sortid: 'score.r2',
          sortable: false,
        }, {
          label: 'Function',
          sortid: 'display_func',
          sortable: false,
          headerColumnProps: {
            style: {
              width: '50%',
            },
          },
        },
        // {
        //   label: 'Selection',
        //   formtype: 'radio',
        //   sortid: 'selected',
        //   headerColumnProps: {
        //     style: {
        //       width: '100px',
        //     },
        //   },
        //   sortable: false,
        // }, 
      ],
    }, ],
  };
}

function transformGoogleVisionOutput(output, type) {
  try {
    switch (type) {
      case 'string':
        return output;
      case 'number':
        return output.trim().replace(/[OC]/gi, '0').replace(/[^0-9.]/gi, '');
      default:
        return output;
    }
  } catch (e) {
    logger.warn(`Error in transformGoogleVisionOutput: ${e}`);
    return output;
  }
}

function determineAIOutput(mlcase) {
  let formatted_ai_prediction, ai_prediction_value;
  if (mlcase.provider === 'sagemaker_ll') {
    if (mlcase.model_type === 'binary' && mlcase.prediction && mlcase.prediction.predictions) {
      ai_prediction_value = mlcase.prediction.predictions[ 0 ].score;
      if (mlcase.industry) {
        formatted_ai_prediction = `${(Number(ai_prediction_value) * 100).toFixed(2)}%`;
      } else {
        formatted_ai_prediction = `${(Number(ai_prediction_value) * 100).toFixed(2)}% probability that the event will occur`;
      }
    } else if (mlcase.model_type === 'regression' && mlcase.prediction && mlcase.prediction.predictions) {
      ai_prediction_value = mlcase.prediction.predictions[ 0 ].score.toFixed(2);
      formatted_ai_prediction = `The most likely value is ${ai_prediction_value}`;
    } else if (mlcase.model_type === 'categorical' && mlcase.prediction && mlcase.prediction.predictions) {
      let predicted_label = mlcase.prediction.predictions[ 0 ].predicted_label;
      ai_prediction_value = (mlcase.decoder && mlcase.decoder.historical_result && mlcase.decoder.historical_result[ predicted_label ]) ? mlcase.decoder.historical_result[ predicted_label ] : predicted_label;
      formatted_ai_prediction = `The most likely value is ${ai_prediction_value}`;
    } else {
      ai_prediction_value = null;
    }
  } else if (mlcase.provider === 'sagemaker_xgb') {
    if (mlcase.model_type === 'binary' && mlcase.prediction) {
      ai_prediction_value = mlcase.prediction;
      if (mlcase.industry) {
        formatted_ai_prediction = `${(Number(ai_prediction_value) * 100).toFixed(2)}%`;
      } else {
        formatted_ai_prediction = `${(Number(ai_prediction_value) * 100).toFixed(2)}% probability that the event will occur`;
      }
    } else if (mlcase.model_type === 'regression' && mlcase.prediction) {
      ai_prediction_value = mlcase.prediction.toFixed(2);
      formatted_ai_prediction = `The most likely value is ${ai_prediction_value}`;
    } else if (mlcase.model_type === 'categorical' && mlcase.prediction && Array.isArray(mlcase.prediction)) {
      let predicted_label = mlcase.prediction.indexOf(Math.max(...mlcase.prediction));
      ai_prediction_value = (mlcase.decoder && mlcase.decoder.historical_result && mlcase.decoder.historical_result[ predicted_label ]) ? mlcase.decoder.historical_result[ predicted_label ] : predicted_label;
      formatted_ai_prediction = `The most likely value is ${ai_prediction_value}`;
    } else {
      ai_prediction_value = null;
    }
  } else if (mlcase.provider === 'aws') {
    if (mlcase.prediction && mlcase.prediction[ 'Prediction' ] && mlcase.model_type === 'binary') {
      ai_prediction_value = mlcase.prediction[ 'Prediction' ][ 'predictedScores' ][ mlcase.prediction[ 'Prediction' ][ 'predictedLabel' ] ];
      if (mlcase.industry) {
        formatted_ai_prediction = `${(Number(ai_prediction_value) * 100).toFixed(2)}%`;
      } else {
        formatted_ai_prediction = `${(Number(ai_prediction_value) * 100).toFixed(2)}% probability that the event will occur`;
      }
    } else if (mlcase.prediction && mlcase.prediction[ 'Prediction' ] && mlcase.model_type === 'regression') {
      ai_prediction_value = (mlcase.prediction[ 'Prediction' ][ 'predictedValue' ] && Number(mlcase.prediction[ 'Prediction' ][ 'predictedValue' ])) ? Number(mlcase.prediction[ 'Prediction' ][ 'predictedValue' ]).toFixed(2) : mlcase.prediction[ 'Prediction' ][ 'predictedValue' ];
      formatted_ai_prediction = `The most likely value is ${ai_prediction_value}`;
    } else if (mlcase.prediction && mlcase.prediction[ 'Prediction' ] && mlcase.model_type === 'categorical') {
      ai_prediction_value = mlcase.prediction[ 'Prediction' ][ 'predictedLabel' ];
      formatted_ai_prediction = `The most likely value is ${ai_prediction_value}`;
    } else {
      ai_prediction_value = null;
    }
  } else {
    if (mlcase.prediction && mlcase.model_type === 'binary') {
      let binary_value = Array.isArray(mlcase.prediction[ 0 ]) ? mlcase.prediction[ 0 ] : mlcase.prediction;
      ai_prediction_value = `${(Number(binary_value) * 100).toFixed(2)}%`;
      if (mlcase.industry) {
        formatted_ai_prediction = `${ai_prediction_value}`;
      } else {
        formatted_ai_prediction = `${ai_prediction_value} probability that the event will occur`;
      }
    } else if (mlcase.prediction && mlcase.model_type === 'regression') {
      ai_prediction_value = mlcase.prediction.toFixed(2);
      formatted_ai_prediction = `The most likely value is ${ai_prediction_value}`;
    } else if (mlcase.prediction && mlcase.model_type === 'categorical') {
      let case_prediction = Array.isArray(mlcase.prediction[ 0 ]) ? mlcase.prediction[ 0 ] : mlcase.prediction;
      let max_value = Math.max(...case_prediction);
      let predicted_label = case_prediction.indexOf(max_value);
      ai_prediction_value = (mlcase.decoder && mlcase.decoder.historical_result && mlcase.decoder.historical_result[ predicted_label ]) ? mlcase.decoder.historical_result[ predicted_label ] : predicted_label;
      formatted_ai_prediction = `The most likely value is ${ai_prediction_value}`;
    } else {
      ai_prediction_value = null;
    }
  }

  return formatted_ai_prediction;
}

function returnAIDecisionResultData(mlcase) {
  try {

    let ai_prediction_value, ai_prediction_subtitle;
    let ai_categorical_value = null;
    let binary_value = null;
    if (mlcase.provider === 'sagemaker_ll') {
      if (mlcase.model_type === 'binary' && mlcase.prediction && mlcase.prediction.predictions) {
        binary_value = mlcase.prediction.predictions[ 0 ].score;
        ai_prediction_value = `${(Number(binary_value) * 100).toFixed(2)}%`;
        ai_prediction_subtitle = 'Probability that the event will occur';
      } else if (mlcase.model_type === 'regression' && mlcase.prediction && mlcase.prediction.predictions) {
        ai_prediction_value = mlcase.prediction.predictions[ 0 ].score.toFixed(2);
        ai_prediction_subtitle = 'The most likely value';
      } else if (mlcase.model_type === 'categorical' && mlcase.prediction && mlcase.prediction.predictions) {
        let predicted_label = mlcase.prediction.predictions[ 0 ].predicted_label;
        ai_prediction_value = (mlcase.decoder && mlcase.decoder.historical_result && mlcase.decoder.historical_result[ predicted_label ]) ? mlcase.decoder.historical_result[ predicted_label ] : predicted_label;
        ai_prediction_subtitle = 'The most likely value';
        ai_categorical_value = mlcase.prediction.predictions[ 0 ].score[ predicted_label ];
      } else {
        ai_prediction_value = null;
      }
    } else if (mlcase.provider === 'sagemaker_xgb') {
      if (mlcase.model_type === 'binary' && mlcase.prediction) {
        binary_value = mlcase.prediction;
        ai_prediction_value = `${(Number(binary_value) * 100).toFixed(2)}%`;
        ai_prediction_subtitle = 'Probability that the event will occur';
      } else if (mlcase.model_type === 'regression' && mlcase.prediction) {
        ai_prediction_value = mlcase.prediction.toFixed(2);
        ai_prediction_subtitle = 'The most likely value';
      } else if (mlcase.model_type === 'categorical' && mlcase.prediction && Array.isArray(mlcase.prediction)) {
        let max_value = Math.max(...mlcase.prediction);
        let predicted_label = mlcase.prediction.indexOf(max_value);
        ai_prediction_value = (mlcase.decoder && mlcase.decoder.historical_result && mlcase.decoder.historical_result[ predicted_label ]) ? mlcase.decoder.historical_result[ predicted_label ] : predicted_label;
        ai_prediction_subtitle = 'The most likely value';
        ai_categorical_value = max_value;
      } else {
        ai_prediction_value = null;
      }
    } else if (mlcase.provider === 'aws') {
      if (mlcase.prediction && mlcase.prediction[ 'Prediction' ] && mlcase.model_type === 'binary') {
        binary_value = mlcase.prediction[ 'Prediction' ][ 'predictedScores' ][ mlcase.prediction[ 'Prediction' ][ 'predictedLabel' ] ];
        ai_prediction_value = `${(Number(binary_value) * 100).toFixed(2)}%`;
        ai_prediction_subtitle = 'Probability that the event will occur';
      } else if (mlcase.prediction && mlcase.prediction[ 'Prediction' ] && mlcase.model_type === 'regression') {
        ai_prediction_value = (mlcase.prediction[ 'Prediction' ][ 'predictedValue' ] && Number(mlcase.prediction[ 'Prediction' ][ 'predictedValue' ])) ? Number(mlcase.prediction[ 'Prediction' ][ 'predictedValue' ]).toFixed(2) : mlcase.prediction[ 'Prediction' ][ 'predictedValue' ];
        ai_prediction_subtitle = 'The most likely value';
      } else if (mlcase.prediction && mlcase.prediction[ 'Prediction' ] && mlcase.model_type === 'categorical') {
        ai_prediction_value = mlcase.prediction[ 'Prediction' ][ 'predictedLabel' ];
        ai_categorical_value = mlcase.prediction[ 'Prediction' ][ 'predictedScores' ][ ai_prediction_value ];
        ai_prediction_subtitle = 'The most likely value';
      } else {
        ai_prediction_value = null;
      }
    } else {
      if (mlcase.prediction && mlcase.model_type === 'binary') {
        binary_value = Array.isArray(mlcase.prediction[ 0 ]) ? mlcase.prediction[ 0 ] : mlcase.prediction;
        ai_prediction_value = `${(Number(binary_value) * 100).toFixed(2)}%`;
        ai_prediction_subtitle = 'Probability that the event will occur';
      } else if (mlcase.prediction && mlcase.model_type === 'regression') {
        ai_prediction_value = mlcase.prediction.toFixed(2);
        ai_prediction_subtitle = 'The most likely value';
      } else if (mlcase.prediction && mlcase.model_type === 'categorical') {
        let case_prediction = Array.isArray(mlcase.prediction[ 0 ]) ? mlcase.prediction[ 0 ] : mlcase.prediction;
        let max_value = Math.max(...case_prediction);
        let predicted_label = case_prediction.indexOf(max_value);
        ai_prediction_value = (mlcase.decoder && mlcase.decoder.historical_result && mlcase.decoder.historical_result[ predicted_label ]) ? mlcase.decoder.historical_result[ predicted_label ] : predicted_label;
        ai_prediction_subtitle = 'The most likely value';
        ai_categorical_value = max_value;
      } else {
        ai_prediction_value = null;
      }
    }
    return { ai_prediction_subtitle, ai_prediction_value, ai_categorical_value, binary_value };
  } catch (e) {
    console.log({ e })
  }
}

function handleDataSourceUploadData(csv_data, model_type) {
  try {
    let data_type_predictor_map = {};
    let unique_number_value_map = {};
    let historical_result_exists = false;
    let historical_data_valid = true;
    let csv_headers = csv_data.shift();
    csv_headers = csv_headers.map((header, idx) => {
      if (header === '') return `col${idx + 1}`
      else return header;
    });
    let error;
    let count = csv_headers.reduce((acc, curr) => {
      data_type_predictor_map[ curr ] = {};
      unique_number_value_map[ curr ] = {};
      return Object.assign(acc, { [ curr ]: (acc[ curr ] || 0) + 1, });
    }, {});
    let duplicates = Object.keys(count).filter(header => count[ header ] > 1);
    if (duplicates.length) error = `The following headers have duplicates in the csv: ${duplicates.join(',')}`;
    let trainingDataRows = [];
    let testingDataRows = [];
    let data_schema = {
      attributes: [],
      dataFileContainsHeader: true,
      dataFormat: 'CSV',
      targetAttributeName: 'historical_result',
      version: '1.0',
    };
    let strategy_data_schema = {};
    let csv_data_length = csv_data.length;
    let csv_headers_length = csv_headers.length - 1;
    // let mod_val = Math.floor(csv_data_length / 100);
    historical_result_exists = csv_headers.indexOf('historical_result') !== -1;
    if (historical_result_exists) {
      let historical_result_index = csv_headers.indexOf('historical_result');
      csv_data.forEach((csvrow) => {
        let historical_value = formatCSVRowValue(csvrow[ historical_result_index ]);
        switch (model_type) {
          case 'binary':
            if (typeof historical_value === 'boolean') break;
            else historical_data_valid = false;
            break;
          case 'regression':
            if (typeof historical_value !== 'number') historical_data_valid = false;
            break;
          case 'categorical':
            break;
          default:
            break;
        }
      })
      if (historical_data_valid) {
        csv_data.forEach((csvrow, index) => {
          let datarow = csv_headers.reduce((row, header, header_index) => {
            let value = csvrow[ header_index ];
            if (value !== undefined) {
              let value_type;
              if (value.trim() === '') {
                value = '';
              } else {
                value = formatCSVRowValue(value);
                value_type = typeof value;
                if (value_type === 'string' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) value_type = 'boolean';
                if (value_type === 'string' && (moment(value, moment.ISO_8601, true).isValid() || moment(value, 'DD-MM-YYYY', true).isValid() || moment(value, 'DD/MM/YYYY', true).isValid() || moment(value, 'MM-DD-YYYY', true).isValid() || moment(value, 'MM/DD/YYYY', true).isValid())) value_type = 'date';
                data_type_predictor_map[ header ][ value_type ] = (data_type_predictor_map[ header ][ value_type ]) ? data_type_predictor_map[ header ][ value_type ] + 1 : 1;
                if (value_type === 'number' && !unique_number_value_map[ header ][ value ]) unique_number_value_map[ header ][ value ] = true;
              }
            }
            row.push(String(value).trim());
            return row;
          }, []);
          datarow = unflatten(datarow);
          if (Number(index.toString().slice(-1)) <= 6) trainingDataRows.push(datarow);
          else testingDataRows.push(datarow);
        });
        Object.keys(data_type_predictor_map).forEach(header_name => {
          let dateCount = data_type_predictor_map[ header_name ].date;
          let numberCount = data_type_predictor_map[ header_name ].number;
          let stringCount = data_type_predictor_map[ header_name ].string;
          let booleanCount = data_type_predictor_map[ header_name ].boolean;
          let uniqueNumberCount = Object.keys(unique_number_value_map[ header_name ]).length;
          if (header_name === 'historical_result') {
            if (model_type === 'regression') {
              strategy_data_schema[ header_name ] = { data_type: 'Number', };
              data_schema.attributes.push({ attributeName: header_name, attributeType: 'NUMERIC', });
            } else if (model_type === 'binary') {
              strategy_data_schema[ header_name ] = { data_type: 'Boolean', };
              data_schema.attributes.push({ attributeName: header_name, attributeType: 'CATEGORICAL', });
            } else if (model_type === 'categorical') {
              strategy_data_schema[ header_name ] = { data_type: 'String', };
              data_schema.attributes.push({ attributeName: header_name, attributeType: 'CATEGORICAL', });
            }
          } else if (numberCount && !stringCount && !booleanCount && !dateCount && uniqueNumberCount < 10) {
            data_schema.attributes.push({ attributeName: header_name, attributeType: 'CATEGORICAL', });
            strategy_data_schema[ header_name ] = { data_type: 'Number', };
          } else if (numberCount && !stringCount && !booleanCount && !dateCount && uniqueNumberCount >= 10) {
            data_schema.attributes.push({ attributeName: header_name, attributeType: 'NUMERIC', });
            strategy_data_schema[ header_name ] = { data_type: 'Number', };
          } else if (dateCount && !stringCount && !booleanCount && !numberCount) {
            data_schema.attributes.push({ attributeName: header_name, attributeType: 'NUMERIC', });
            strategy_data_schema[ header_name ] = { data_type: 'Date', };
          } else if (booleanCount && !stringCount && !numberCount && !dateCount) {
            data_schema.attributes.push({ attributeName: header_name, attributeType: 'BINARY', });
            strategy_data_schema[ header_name ] = { data_type: 'Boolean', };
          } else {
            data_schema.attributes.push({ attributeName: header_name, attributeType: 'CATEGORICAL', });
            strategy_data_schema[ header_name ] = { data_type: 'String', };
          }
        });
        return { csv_headers, csv_data, trainingDataRows, testingDataRows, data_schema, strategy_data_schema, csv_data_length, csv_headers_length, historical_result_exists, };
      } else {
        return { message: ERROR_MESSAGES[ 'datasource_upload' ][ model_type ] };
      }
    } else {
      return { message: 'The following column header: historical_result is required. Please ensure that historical_result is provided in the uploaded csv.' };
    }
  } catch (e) {
    logger.warn('Error in handleDataSourceUploadData: ', e);
    return e;
  }
}

function objectOrArrayPropertiesAreEmpty(data) {
  let isEmpty = true;
  if (Array.isArray(data)) {
    isEmpty = data.filter(el => el.trim() !== '').length === 0;
  } else {
    let objKeys = Object.keys(data);
    objKeys.forEach(key => {
      if (data[ key ].trim() !== '') isEmpty = false;
    });
  }
  return isEmpty;
}

function filterCSVSpecialCharacters(str, checkNum) {
  checkNum = checkNum || false;
  if (typeof str === 'string') {
    str = str.trim();
    if (checkNum) {
      str = (isNaN(parseFloat(str))) ? str.replace(/[^a-zA-Z0-9_\s]/g, '') : str.replace(/[^a-zA-Z0-9_.\s]/g, '');
    } else {
      str = str.replace(/[^a-zA-Z0-9_\s]/g, '');
    }
    //newline replace with empty space
    str = str.replace(/\r?\n|\r/g, ' ');
  }
  return str;
}

function generateJSONtoCSVFields(config) {
  try {
    let top_level_headers = Object.keys(config);
    return top_level_headers.reduce((aggregate, header, i) => {
      if (header === 'singleHeaders') {
        config[ header ].forEach(subheader => {
          aggregate.push(subheader);
        })
      } else {
        let { numColumns, nestedHeaders } = config[ header ];
        for (let i = 0; i < numColumns; i++) {
          nestedHeaders.forEach(subheader => {
            aggregate.push({
              label: `${header}.${i}.${subheader}`,
              value: `${header}.${i}.${subheader}`,
              default: '',
            })
          })
        }
      }
      return aggregate;
    }, [])
  } catch (e) {
    logger.warn('Error in generateJSONtoCSVFields: ', e);
    return e;
  }
}

module.exports = {
  generateJSONtoCSVFields,
  getMedian,
  getStringMode,
  getMode,
  getMinimum,
  getMaximum,
  getMean,
  convertVariableType,
  filterCSVSpecialCharacters,
  formatCSVRowValue,
  formatPhoneNumber,
  formatDate,
  formatDateNoTime,
  formatDateNoDay,
  formatFileSize,
  formatFormDate,
  formatPercentage,
  formatCurrency,
  formatCurrencyNoCents,
  capitalizeWords,
  formatReviewState,
  generatePredictorVariableCard,
  getAge,
  getDecryptedFilePath,
  obfuscateSSN,
  formatProcessingStatus,
  formatProductLink,
  getPrimaryApplicant,
  getActiveCosignerApplicant,
  getApprovedCosignerApplicant,
  getRecentCosignerApplicant,
  getCustomerCommunication,
  getCustomerApplicant,
  formatStatus,
  formatAdverseReasonCodes,
  mountApplicantTPDFromVerification,
  formatProductTypes,
  formatCBDOB,
  formatCBPAZ,
  formatSSN,
  objectOrArrayPropertiesAreEmpty,
  rejectApplicationApplicants,
  checkApplicantsApproved,
  createIssuedProduct,
  combineApplicantFiles,
  capitalizeAllWords,
  formatReviewer,
  checkValidRoutingNumber,
  allApplicantsUnderReview,
  transformOfferProductName,
  formatCollateralInfo,
  getDateAndTime,
  isJsonString,
  transformGoogleVisionOutput,
  determineAIOutput,
  returnAIDecisionResultData,
  handleDataSourceUploadData,
  coerceDataType,
  // runSingleAWSMachineLearning,
  // runSingleSagemakerLL,
  // runSingleSagemakerXGB,
};