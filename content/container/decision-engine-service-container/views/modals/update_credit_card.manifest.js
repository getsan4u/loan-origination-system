'use strict';

const mfaCode = require('../../utilities/views/modals/mfa_code_form.js');
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;
const STATES = {
  'AL': 'AL',
  'AK': 'AK',
  'AZ': 'AZ',
  'AR': 'AR',
  'CA': 'CA',
  'CO': 'CO',
  'CT': 'CT',
  'DE': 'DE',
  'DC': 'DC',
  'FL': 'FL',
  'GA': 'GA',
  'GU': 'GU',
  'HI': 'HI',
  'ID': 'ID',
  'IL': 'IL',
  'IN': 'IN',
  'IA': 'IA',
  'KS': 'KS',
  'KY': 'KY',
  'LA': 'LA',
  'ME': 'ME',
  'MD': 'MD',
  'MA': 'MA',
  'MI': 'MI',
  'MN': 'MN',
  'MS': 'MS',
  'MO': 'MO',
  'MT': 'MT',
  'NE': 'NE',
  'NV': 'NV',
  'NH': 'NH',
  'NJ': 'NJ',
  'NM': 'NM',
  'NY': 'NY',
  'NC': 'NC',
  'ND': 'ND',
  'OH': 'OH',
  'OK': 'OK',
  'OR': 'OR',
  'PA': 'PA',
  'PR': 'PR',
  'RI': 'RI',
  'SC': 'SC',
  'SD': 'SD',
  'TN': 'TN',
  'TX': 'TX',
  'UT': 'UT',
  'VT': 'VT',
  'VA': 'VA',
  'WA': 'WA',
  'WV': 'WV',
  'WI': 'WI',
  'WY': 'WY',
};

const MONTHS = {
  'January': '1',
  'February': '2',
  'March': '3',
  'April': '4',
  'May': '5',
  'June': '6',
  'July': '7',
  'August': '8',
  'September': '9',
  'October': '10',
  'November': '11',
  'December': '12',
};

const YEARS = {
  '2018': '2018',
  '2019': '2019',
  '2020': '2020',
  '2021': '2021',
  '2022': '2022',
  '2023': '2023',
  '2024': '2024',
  '2025': '2025',
  '2026': '2026',
  '2027': '2027',
  '2028': '2028',
  '2029': '2029',
  '2030': '2030',
};

const stateOptions = (Object.keys(STATES).map(key => {
  return {
    label: key,
    value: STATES[ key ],
  };
}));

const expMonthOptions = (Object.keys(MONTHS).map(key => {
  return {
    label: key,
    value: MONTHS[ key ],
  };
}));

const expYearOptions = (Object.keys(YEARS).map(key => {
  return {
    label: key,
    value: YEARS[ key ],
  };
}));

module.exports = {
  'containers': {
    '/modal/update_credit_card': {
      layout: {
        privileges: [101,],
        component: 'Container',
        props: {},
        children: [
          {
            component: 'Image',
            props: {
              src: '/powered_by_stripe_3x_outline_dark.png',
              style: {
                margin: '0 auto',
                width: '180px',
              },
            },
          },
          {
            component: 'ResponsiveForm',
            props: {
              'validations': [
                {
                  'name': 'credit_card_number',
                  'constraints': {
                    'credit_card_number': {
                      'presence': {
                        'message': '^Credit Card Number is required.',
                      },
                    },
                  },
                },
                {
                  'name': 'exp_month',
                  'constraints': {
                    'exp_month': {
                      'presence': {
                        'message': '^Expiration Month is required.',
                      },
                    },
                  },
                },
                {
                  'name': 'exp_year',
                  'constraints': {
                    'exp_year': {
                      'presence': {
                        'message': '^Expiration Year is required.',
                      },
                    },
                  },
                },
                {
                  'name': 'cvc',
                  'constraints': {
                    'cvc': {
                      'presence': {
                        'message': '^Security Code is required.',
                      },
                    },
                  },
                },
                {
                  'name': 'cardholder_name',
                  'constraints': {
                    'cardholder_name': {
                      'presence': {
                        'message': '^Cardholder Name is required.',
                      },
                    },
                  },
                },
                {
                  'name': 'street_address',
                  'constraints': {
                    'street_address': {
                      'presence': {
                        'message': '^Street Address is required.',
                      },
                    },
                  },
                },
                {
                  'name': 'city',
                  'constraints': {
                    'city': {
                      'presence': {
                        'message': '^City is required.',
                      },
                    },
                  },
                },
                {
                  'name': 'state',
                  'constraints': {
                    'state': {
                      'presence': {
                        'message': '^State is required.',
                      },
                    },
                  },
                },
                {
                  'name': 'postal_code',
                  'constraints': {
                    'postal_code': {
                      'presence': {
                        'message': '^Postal Code is required.',
                      },
                    },
                  },
                },
              ],
              onSubmit: {
                url: '/payment/addPaymentMethod',
                'options': {
                  'method': 'POST',
                },
                successCallback: ['func:this.props.refresh', 'func:this.props.hideModal', 'func:this.props.createNotification',],
                successProps: [null, 'last', {
                  type: 'success',
                  text: 'Card saved successfully!',
                  timeout: 10000,
                },
                ],
              },
              flattenFormData: true,
              footergroups: false,
              formgroups: [{
                gridProps: {
                  key: randomKey(),
                  className: 'credit_card_number',
                },
                formElements: [{
                  type: 'maskedinput',
                  name: 'credit_card_number',
                  label: 'Credit Card Number',
                  createNumberMask: true,
                  placeholder: '',
                  'onBlur': true,
                  'validateOnBlur': true,
                  'errorIconRight': true,
                  'submitOnEnter': true,
                  'errorIcon': 'fa fa-exclamation',
                  layoutProps: {
                    innerFormItem: true,
                    isExpanded: true,
                  },
                  passProps: {
                    mask: 'func:window.numberCreditCard',
                    guid: false,
                    placeholderChar: '\u2000',
                  },
                },],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'group',
                  name: '',
                  label: '',
                  layoutProps: {
                    style: {
                    },
                  },
                  groupElements: [{
                    type: 'dropdown',
                    name: 'exp_month',
                    label: 'Expiration Month',
                    validateOnChange: true,
                    'errorIconRight': true,
                    'submitOnEnter': true,
                    'errorIcon': 'fa fa-exclamation',
                    passProps: {
                      placeholder: 'Month',
                      fluid: true,
                      selection: true,
                    },
                    options: expMonthOptions,
                  }, {
                    type: 'dropdown',
                    name: 'exp_year',
                    label: 'Expiration Year',
                    validateOnChange: true,
                    'errorIconRight': true,
                    'submitOnEnter': true,
                    'errorIcon': 'fa fa-exclamation',
                    passProps: {
                      placeholder: 'Year',
                      fluid: true,
                      selection: true,
                    },
                    options: expYearOptions,
                  }, {
                    type: 'maskedinput',
                    name: 'cvc',
                    placeholder: undefined,
                    'onBlur': true,
                    'validateOnBlur': true,
                    'errorIconRight': true,
                    'submitOnEnter': true,
                    createNumberMask: true,
                    'errorIcon': 'fa fa-exclamation',
                    label: 'Security Code',
                    passProps: {
                      mask: 'func:window.numberCreditCard',
                      guid: false,
                      placeholderChar: '\u2000',
                    },
                  },],
                },],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'text',
                  name: 'cardholder_name',
                  label: 'Cardholder Name',
                  'onBlur': true,
                  'validateOnBlur': true,
                  'errorIconRight': true,
                  'submitOnEnter': true,
                  'errorIcon': 'fa fa-exclamation',
                  placeholder: '',
                  layoutProps: {
                    innerFormItem: true,
                    isExpanded: true,
                  },
                  passProps: {
                    maxLength: 30,
                  },
                },],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'text',
                  name: 'street_address',
                  label: 'Street Address',
                  'onBlur': true,
                  'validateOnBlur': true,
                  'errorIconRight': true,
                  'submitOnEnter': true,
                  'errorIcon': 'fa fa-exclamation',
                  placeholder: '',
                  layoutProps: {
                    innerFormItem: true,
                    isExpanded: true,
                  },
                  passProps: {
                    maxLength: 30,
                  },
                },],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'text',
                  name: 'city',
                  'onBlur': true,
                  'validateOnBlur': true,
                  'errorIconRight': true,
                  'submitOnEnter': true,
                  'errorIcon': 'fa fa-exclamation',
                  label: 'City',
                  placeholder: '',
                  layoutProps: {
                    innerFormItem: true,
                    isExpanded: true,
                  },
                  passProps: {
                    maxLength: 30,
                  },
                },],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'group',
                  name: '',
                  label: '',
                  layoutProps: {
                    style: {
                    },
                  },
                  groupElements: [{
                    type: 'dropdown',
                    name: 'state',
                    validateOnChange: true,
                    'errorIconRight': true,
                    'submitOnEnter': true,
                    'errorIcon': 'fa fa-exclamation',
                    label: 'State',
                    passProps: {
                      placeholder: 'State',
                      fluid: true,
                      selection: true,
                    },
                    options: stateOptions,
                  }, {
                    type: 'maskedinput',
                    createNumberMask: true,
                    name: 'postal_code',
                    'onBlur': true,
                    'validateOnBlur': true,
                    'errorIconRight': true,
                    'submitOnEnter': true,
                    'errorIcon': 'fa fa-exclamation',
                    placeholder: undefined,
                    label: 'Postal Code',
                    passProps: {
                      mask: 'func:window.numberCreditCard',
                      guid: false,
                      placeholderChar: '\u2000',
                    },
                  },],
                },],
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [{
                  type: 'submit',
                  value: 'UPDATE',
                  layoutProps: {
                    size: 'isNarrow',
                    styles: {
                      textAlign: 'center',
                    },
                  },
                  passProps: {
                    color: 'isPrimary',
                  },
                },],
              },],
            },
          },
        ],
      },
      'resources': {
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.dynamicModalHeight',],
      'onFinish': 'render',
    },
  },
};