// 'use strict';
// const moment = require('moment');
// const pluralize = require('pluralize');
// const utilities = require('../../../utilities');
// const styles = utilities.views.constants.styles;
// const randomKey = Math.random;

// module.exports = {
//   'containers': {
//     '/optimization/create_ocr_template': {
//       layout: {
//         component: 'Container',
//         props: {},
//         children: [{
//           component: 'ResponsiveForm',
//           props: {
//             flattenFormData: true,
//             footergroups: false,
//             'onSubmit': {
//               url: '/optimization/api/ocr?format=json',
//               options: {
//                 method: 'POST',
//               },
//               successCallback: 'func:window.closeModalAndCreateNotification',
//               successProps: {
//                 text: 'Changes saved successfully!',
//                 timeout: 10000,
//                 type: 'success',
//               },
//               responseCallback: 'func:this.props.refresh',
//             },
//             validations: [
//               {
//                 'name': 'name',
//                 'constraints': {
//                   'name': {
//                     'presence': {
//                       'message': '^OCR Template Name is required.',
//                     },
//                   },
//                 },
//               },
//             ],
//             formgroups: [{
//               gridProps: {
//                 key: randomKey(),
//               },
//               formElements: [{
//                 label: 'OCR Template Name',
//                 name: 'name',
//                 onBlur: true,
//                 validateOnBlur: true,
//                 errorIconRight: true,
//                 layoutProps: {
//                   style: {
//                     textAlign: 'center',
//                     padding: 0,
//                   },
//                 },
//               },],
//             }, {
//               gridProps: {
//                 key: randomKey(),
//               },
//               formElements: [{
//                 name: 'description',
//                 placeholder: ' ',
//                 customLabel: {
//                   component: 'span',
//                   children: [ {
//                     component: 'span',
//                     children: 'Description',
//                   }, {
//                     component: 'span',
//                     props: {
//                       style: {
//                         fontStyle: 'italic',
//                         color: '#ccc',
//                         marginLeft: '7px',
//                         fontWeight: 'normal',
//                       },
//                     },
//                     children: 'Optional',
//                   }, ],
//                 },
//               },
//               ],
//             }, {
//               gridProps: {
//                 key: randomKey(),
//                 className: 'modal-footer-btns',
//               },
//               formElements: [{
//                 type: 'submit',
//                 value: 'CREATE OCR TEMPLATE',
//                 passProps: {
//                   color: 'isSuccess',
//                 },
//                 layoutProps: {},
//               },
//               ],
//             },
//             ],
//           },
//           asyncprops: {},
//         },
//         ],
//       },
//       'resources': {
//         checkdata: {
//           url: '/auth/run_checks',
//           options: {
//             onSuccess: ['func:window.redirect',],
//             onError: ['func:this.props.logoutUser', 'func:window.redirect',],
//             blocking: true, 
//             renderOnError: false,
//           },
//         },
//       },
//       callbacks: ['func:window.setHeaders', 'func:window.filterDataSourceFile',],
//       'onFinish': 'render',
//     },
//   },
// };