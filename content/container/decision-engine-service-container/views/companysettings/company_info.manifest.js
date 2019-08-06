'use strict';

const formElements = require('../../utilities/views/shared/props/formElements').formElements;
const cardprops = require('../../utilities/views/shared/props/cardprops');
const styles = require('../../utilities/views/constants/styles');
const references = require('../../utilities/views/constants/references');
const periodic = require('periodicjs');
const utilities = require('../../utilities');
const reactappLocals = periodic.locals.extensions.get('periodicjs.ext.reactapp');
const reactapp = reactappLocals.reactapp();
const plainHeaderTitle = require('../../utilities/views/shared/component/layoutComponents').plainHeaderTitle;
const plainGlobalButtonBar = require('../../utilities/views/shared/component/globalButtonBar').plainGlobalButtonBar;
let randomKey = Math.random;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const companySettingsTabs = utilities.views.settings.components.companySettingsTabs;

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
const stateOptions = (Object.keys(STATES).map(key => {
  return {
    label: key,
    value: STATES[ key ],
  };
}));
module.exports = {
  containers: {
    '/company-settings/company_info': {
      layout: {
        component: 'div',
        privileges: [101,],
        props: {
          style: styles.pageContainer,
        },
        children: [
          companySettingsTabs('company_info'),
          plainHeaderTitle({
            title: 'Company Information',
          }),
          styles.fullPageDivider,
          {
            component: 'Container',
            props: {
            },
            children: [
              {
                component: 'ResponsiveForm',
                props: {
                  flattenFormData: true,
                  footergroups: false,
                  onSubmit: {
                    url: '/organization/update_org_info',
                    'options': {
                      'method': 'PUT',
                    },
                    successCallback: ['func:this.props.refresh', 'func:this.props.createNotification',],
                    successProps: [null, {
                      type: 'success',
                      text: 'Changes saved successfully!',
                      timeout: 10000,
                    },
                    ],
                  },
                  validations: [{
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
                  formgroups: [
                    formGlobalButtonBar({
                      left: [
                      ],
                      right: [{
                        type: 'submit',
                        value: 'SAVE',
                        passProps: {
                          color: 'isPrimary',
                        },
                        layoutProps: {
                          className: 'global-button-save',
                        },
                      }, {
                        guideButton: true,
                        location: references.guideLinks.companySettings[ 'billingManagement' ],
                      },
                      ],
                    }),
                    {
                      gridProps: {
                        key: randomKey(),
                      },
                      card: {
                        doubleCard: true,
                        leftDoubleCardColumn: {
                          style: {
                            display: 'flex',
                          },
                        },
                        rightDoubleCardColumn: {
                          style: {
                            display: 'flex',
                          },
                        },
                        leftCardProps: cardprops({
                          cardTitle: 'Company Information',
                          cardStyle: {
                            marginBottom: 0,
                          },
                        }),
                        rightCardProps: cardprops({
                          cardTitle: 'Billing Information',
                          cardStyle: {
                            marginBottom: 0,
                          },
                        }),
                      },
                      formElements: [formElements({
                        twoColumns: true,
                        doubleCard: true,
                        left: [{
                          type: 'text',
                          name: 'company_name',
                          placeholder: undefined,
                          label: 'Company Name',
                          passProps: {
                            state: 'isDisabled',
                          },
                        }, {
                          type: 'text',
                          name: 'street_address',
                          placeholder: undefined,
                          label: 'Street Address',
                          onBlur: true,
                          validateOnBlur: true,
                          errorIconRight: true,
                          errorIcon: 'fa fa-exclamation',
                        }, {
                          type: 'text',
                          name: 'city',
                          placeholder: undefined,
                          label: 'City',
                          onBlur: true,
                          validateOnBlur: true,
                          errorIconRight: true,
                          errorIcon: 'fa fa-exclamation',
                        }, {
                          type: 'group',
                          name: '',
                          label: '',
                          layoutProps: {
                            style: {
                              // marginLeft: '-10px',
                            },
                          },
                          groupElements: [{
                            type: 'dropdown',
                            name: 'state',
                            passProps: {
                              fluid: true,
                              selection: true,
                              placeholder: 'State',
                            },
                            validateOnChange: true,
                            errorIconRight: true,
                            errorIcon: 'fa fa-exclamation',
                            label: 'State',
                            options: stateOptions,
                          }, {
                            type: 'maskedinput',
                            name: 'postal_code',
                            placeholder: undefined,
                            createNumberMask: true,
                            label: 'Postal Code',
                            onBlur: true,
                            validateOnBlur: true,
                            errorIconRight: true,
                            errorIcon: 'fa fa-exclamation',
                            passProps: {
                              mask: 'func:window.numberCreditCard',
                              guid: false,
                              placeholderChar: '\u2000',
                            },
                          },],
                        },],
                        right: [{
                          type: 'text',
                          name: 'active_user_count',
                          placeholder: undefined,
                          label: 'Number of Active Users',
                          passProps: {
                            state: 'isDisabled',
                          },
                        }, {
                          type: 'text',
                          name: 'transaction_count',
                          placeholder: undefined,
                          label: 'Number of Transactions This Month',
                          passProps: {
                            state: 'isDisabled',
                          },
                        }, /*{
                          type: 'text',
                          name: 'max_transaction_count',
                          placeholder: undefined,
                          label: 'Maximum Transactions Per Month',
                          passProps: {
                            state: 'isDisabled',
                          },
                        },{
                          type: 'text',
                          name: 'payment_method',
                          placeholder: undefined,
                          label: 'Payment Method',
                          passProps: {
                            state: 'isDisabled',
                          },
                        },*/],
                      }),
                      ],
                    },
                  ],
                },
                asyncprops: {
                  formdata: ['stripedata', 'displayData',],
                },
              },
            ],
          },
        ],
      },
      resources: {
        accountdata: '/organization/get_general_info',
        usersdata: '/organization/get_org',
        stripedata: '/payment/getCustomer?getMonthTransactions=true',
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
      callbacks: [],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Company Settings',
        navLabel: 'Company Settings',
      },
    },
  },
};