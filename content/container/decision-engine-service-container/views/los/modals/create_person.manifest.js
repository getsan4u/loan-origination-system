// 'use strict';
// const moment = require('moment');
// const pluralize = require('pluralize');
// const utilities = require('../../../utilities');
// const styles = utilities.views.constants.styles;
// const randomKey = Math.random;

// module.exports = {
//   'containers': {
//     '/los/people/new': {
//       layout: {
//         privileges: [ 101, 102, 103 ],
//         component: 'Container',
//         props: {},
//         children: [ {
//           component: 'ResponsiveForm',
//           asyncprops: {
//             __formOptions: [ 'modaldata', 'formoptions' ],
//           },
//           props: {
//             setInitialValues: false,
//             flattenFormData: true,
//             footergroups: false,
//             useFormOptions: true,
//             'onSubmit': {
//               url: '/los/api/customers?redirect=true&redirectEntity=people',
//               options: {
//                 method: 'POST',
//               },
//               successCallback: 'func:window.closeModalAndCreateNotification',
//               successProps: {
//                 text: 'Changes saved successfully!',
//                 timeout: 10000,
//                 type: 'success',
//               },
//               responseCallback: 'func:this.props.reduxRouter.push',
//             },
//             validations: [
//               {
//                 'name': 'name',
//                 'constraints': {
//                   'name': {
//                     'presence': {
//                       'message': '^Name is required.',
//                     },
//                   },
//                 },
//               },
//             ],
//             hiddenFields: [ {
//               form_name: 'customer_type',
//               form_static_val: 'people',
//             }, ],
//             formgroups: [ {
//               gridProps: {
//                 key: randomKey(),
//               },
//               formElements: [ {
//                 name: 'name',
//                 label: 'Name',
//                 errorIconRight: true,
//                 validateOnBlur: true,
//                 onBlur: true,
//               }, ],
//             }, {
//               gridProps: {
//                 key: randomKey(),
//               },
//               formElements: [ {
//                 name: 'company',
//                 type: 'dropdown',
//                 passProps: {
//                   selection: true,
//                   fluid: true,
//                   search: true,
//                   selectOnBlur: false,
//                 },
//                 customLabel: {
//                   component: 'span',
//                   children: [ {
//                     component: 'span',
//                     children: 'Company',
//                   }, {
//                     component: 'span',
//                     children: 'Optional',
//                     props: {
//                       style: {
//                         fontStyle: 'italic',
//                         marginLeft: '2px',
//                         fontWeight: 'normal',
//                         color: styles.colors.regGreyText,
//                       }
//                     }
//                   } ]
//                 },
//               },
//               ],
//             }, {
//               gridProps: {
//                 key: randomKey(),
//               },
//               formElements: [ {
//                 name: 'job_title',
//                 type: 'text',
//                 customLabel: {
//                   component: 'span',
//                   children: [ {
//                     component: 'span',
//                     children: 'Job Title',
//                   }, {
//                     component: 'span',
//                     children: 'Optional',
//                     props: {
//                       style: {
//                         fontStyle: 'italic',
//                         marginLeft: '2px',
//                         fontWeight: 'normal',
//                         color: styles.colors.regGreyText,
//                       }
//                     }
//                   } ]
//                 },
//               },
//               ],
//             }, {
//               gridProps: {
//                 key: randomKey(),
//               },
//               formElements: [
//                 {
//                   type: 'maskedinput',
//                   name: 'phone',
//                   customLabel: {
//                     component: 'span',
//                     children: [ {
//                       component: 'span',
//                       children: 'Phone Number',
//                     }, {
//                       component: 'span',
//                       children: 'Optional',
//                       props: {
//                         style: {
//                           fontStyle: 'italic',
//                           marginLeft: '2px',
//                           fontWeight: 'normal',
//                           color: styles.colors.regGreyText,
//                         }
//                       }
//                     } ]
//                   },
//                   passProps: {
//                     guide: false,
//                     mask: 'func:window.phoneNumberFormatter',
//                     autoComplete: 'off',
//                     autoCorrect: 'off',
//                     autoCapitalize: 'off',
//                     spellCheck: false,
//                   },
//                 },
//               ],
//             }, {
//               gridProps: {
//                 key: randomKey(),
//               },
//               formElements: [ {
//                 name: 'email',
//                 type: 'text',
//                 customLabel: {
//                   component: 'span',
//                   children: [ {
//                     component: 'span',
//                     children: 'Email Address',
//                   }, {
//                     component: 'span',
//                     children: 'Optional',
//                     props: {
//                       style: {
//                         fontStyle: 'italic',
//                         marginLeft: '2px',
//                         fontWeight: 'normal',
//                         color: styles.colors.regGreyText,
//                       }
//                     }
//                   } ]
//                 },
//               },
//               ],
//             }, {
//               gridProps: {
//                 key: randomKey(),
//                 className: 'modal-footer-btns',
//               },
//               formElements: [ {
//                 type: 'submit',
//                 value: 'ADD PERSON',
//                 passProps: {
//                   color: 'isPrimary',
//                 },
//                 layoutProps: {},
//               },
//               ],
//             },
//             ],
//           },
//         },
//         ],
//       },
//       'resources': {
//         modaldata: '/los/api/customers/people/new',
//         checkdata: {
//           url: '/auth/run_checks',
//           options: {
//             onSuccess: [ 'func:window.redirect', ],
//             onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
//             blocking: true,
//             renderOnError: false,
//           },
//         },
//       },
//       callbacks: [ 'func:window.setHeaders', ],
//       'onFinish': 'render',
//     },
//   },
// };

'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    [ '/los/people/new' ]: {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        asyncprops: {
          _children: [ 'modaldata', '_children' ],
        },
      },
      'resources': {
        modaldata: '/los/api/customers/people/new',
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
