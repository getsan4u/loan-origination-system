// 'use strict';
// const moment = require('moment');
// const pluralize = require('pluralize');
// const utilities = require('../../../utilities');
// const styles = utilities.views.constants.styles;
// const randomKey = Math.random;

// module.exports = {
//   'containers': {
//     '/optimization/create_ocr_template/upload_ocr_template/:id': {
//       layout: {
//         component: 'Container',
//         props: {},
//         bindprops: true,
//         children: [ {
//           component: 'ResponsiveForm',
//           bindprops: true,
//           props: {
//             blockPageUI: true,
//             flattenFormData: true,
//             footergroups: false,
//             'onSubmit': {
//               url: '/optimization/api/upload_ocr_template?unflatten=true&handleupload=true',
//               options: {
//                 method: 'PUT',
//               },
//               successCallback: 'func:window.closeModalAndCreateNotification',
//               successProps: {
//                 text: 'Changes saved successfully!',
//                 timeout: 10000,
//                 type: 'success',
//               },
//               responseCallback: 'func:this.props.refresh',
//             },
//             formgroups: [
//               {
//                 gridProps: {
//                   key: randomKey(),
//                 },
//                 formElements: [ {
//                   label: 'Upload PDF Template',
//                   type: 'file',
//                   name: 'upload_file',
//                   thisprops: {},
//                 },
//                 ],
//               }, {
//                 gridProps: {
//                   key: randomKey(),
//                   className: 'modal-footer-btns'
//                 },
//                 formElements: [ {
//                   type: 'submit',
//                   value: 'CONTINUE',
//                   passProps: {
//                     color: 'isPrimary',
//                   },
//                   layoutProps: {},
//                 },
//                 ],
//               },
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
//             onSuccess: [ 'func:window.redirect', ],
//             onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
//             blocking: true,
//             renderOnError: false,
//           },
//         },
//       },
//       callbacks: [ 'func:window.setHeaders', 'func:window.filtertemplateFile', ],
//       'onFinish': 'render',
//     },
//   },
// };