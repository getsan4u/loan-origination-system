'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/company/new': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        asyncprops: {
          _children: [ 'modaldata', '_children' ],
        },
        // children: [ {
        //   component: 'ResponsiveForm',
        //   props: {
        //     setInitialValues: false,
        //     flattenFormData: true,
        //     footergroups: false,
        //     useFormOptions: true,
        //     'onSubmit': {
        //       url: '/los/api/customers?redirect=true&redirectEntity=companies',
        //       options: {
        //         method: 'POST',
        //       },
        //       successCallback: 'func:window.closeModalAndCreateNotification',
        //       successProps: {
        //         text: 'Changes saved successfully!',
        //         timeout: 10000,
        //         type: 'success',
        //       },
        //       responseCallback: 'func:this.props.reduxRouter.push',
        //     },
        //     validations: [
        //       {
        //         'name': 'name',
        //         'constraints': {
        //           'name': {
        //             'presence': {
        //               'message': '^Company Name is required.',
        //             },
        //           },
        //         },
        //       },
        //     ],
        //     hiddenFields: [ {
        //       form_name: 'customer_type',
        //       form_static_val: 'company',
        //     }, ],
        //     formgroups: [ {
        //       gridProps: {
        //         key: randomKey(),
        //       },
        //       formElements: [ {
        //         name: 'name',
        //         label: 'Company Name',
        //         errorIconRight: true,
        //         validateOnBlur: true,
        //         onBlur: true,
        //       }, ],
        //     }, {
        //       gridProps: {
        //         key: randomKey(),
        //       },
        //       formElements: [ {
        //         name: 'industry',
        //         type: 'text',
        //         customLabel: {
        //           component: 'span',
        //           children: [ {
        //             component: 'span',
        //             children: 'Industry',
        //           }, {
        //             component: 'span',
        //             children: 'Optional',
        //             props: {
        //               style: {
        //                 fontStyle: 'italic',
        //                 marginLeft: '2px',
        //                 fontWeight: 'normal',
        //                 color: styles.colors.regGreyText,
        //               }
        //             }
        //           } ]
        //         },
        //       },],
        //     }, {
        //       gridProps: {
        //         key: randomKey(),
        //         className: 'modal-footer-btns',
        //       },
        //       formElements: [ {
        //         type: 'submit',
        //         value: 'CREATE COMPANY',
        //         passProps: {
        //           color: 'isPrimary',
        //         },
        //         layoutProps: {},
        //       },
        //       ],
        //     },
        //     ],
        //   },
        // },
        // ],
      },
      'resources': {
        modaldata: '/los/api/customers/companies/new',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: [ 'func:window.setHeaders', ],
      'onFinish': 'render',
    },
    '/los/people/new/new_company': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        asyncprops: {
          _children: [ 'modaldata', '_children' ],
        },
        // children: [ {
        //   component: 'ResponsiveForm',
        //   props: {
        //     setInitialValues: false,
        //     flattenFormData: true,
        //     footergroups: false,
        //     useFormOptions: true,
        //     'onSubmit': {
        //       url: '/los/api/customers?type=addCompanyToPerson',
        //       options: {
        //         method: 'POST',
        //       },
        //       successCallback: 'func:window.closeModalAndCreateNotification',
        //       successProps: {
        //         text: 'Changes saved successfully!',
        //         timeout: 10000,
        //         type: 'success',
        //       },
        //       responseCallback: 'func:this.props.refresh',
        //     },
        //     validations: [
        //       {
        //         'name': 'name',
        //         'constraints': {
        //           'name': {
        //             'presence': {
        //               'message': '^Company Name is required.',
        //             },
        //           },
        //         },
        //       },
        //     ],
        //     hiddenFields: [ {
        //       form_name: 'customer_type',
        //       form_static_val: 'company',
        //     }, ],
        //     formgroups: [ {
        //       gridProps: {
        //         key: randomKey(),
        //       },
        //       formElements: [ {
        //         name: 'name',
        //         label: 'Company Name',
        //         errorIconRight: true,
        //         validateOnBlur: true,
        //         onBlur: true,
        //       }, ],
        //     }, {
        //       gridProps: {
        //         key: randomKey(),
        //       },
        //       formElements: [ {
        //         name: 'industry',
        //         type: 'text',
        //         customLabel: {
        //           component: 'span',
        //           children: [ {
        //             component: 'span',
        //             children: 'Industry',
        //           }, {
        //             component: 'span',
        //             children: 'Optional',
        //             props: {
        //               style: {
        //                 fontStyle: 'italic',
        //                 marginLeft: '2px',
        //                 fontWeight: 'normal',
        //                 color: styles.colors.regGreyText,
        //               }
        //             }
        //           } ]
        //         },
        //       }, ],
        //     }, {
        //       gridProps: {
        //         key: randomKey(),
        //         className: 'modal-footer-btns',
        //       },
        //       formElements: [ {
        //         type: 'submit',
        //         value: 'CREATE COMPANY',
        //         passProps: {
        //           color: 'isPrimary',
        //         },
        //         layoutProps: {},
        //       },
        //       ],
        //     },
        //     ],
        //   },
        // },
        // ],
      },
      'resources': {
        modaldata: '/los/api/customers/companies/new?modalType=addCompanyToPerson',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: [ 'func:window.setHeaders', ],
      'onFinish': 'render',
    },
  },
};