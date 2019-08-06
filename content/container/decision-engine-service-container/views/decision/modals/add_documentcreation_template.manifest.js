// 'use strict';
// const moment = require('moment');
// const pluralize = require('pluralize');
// const utilities = require('../../../utilities');
// const styles = utilities.views.constants.styles;
// const randomKey = Math.random;

// module.exports = {
//   'containers': {
//     '/decision/strategies/add_documentcreation_template': {
//       layout: {
//         component: 'Container',
//         props: {},
//         children: [{
//           component: 'ResponsiveForm',
//           props: {
//             blockPageUI: true,
//             flattenFormData: true,
//             footergroups: false,
//             'onSubmit': {
//               url: '/decision/api/add_document_template?unflatten=true&handleupload=true',
//               options: {
//                 method: 'POST',
//               },
//               successCallback: 'func:window.displayOCRExtraction',
//             },
//             formgroups: [
//               {
//                 gridProps: {
//                   key: randomKey(),
//                 },
//                 formElements: [{
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
//                 formElements: [{
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
//             url: '/auth/run_checks',
//             options: {
//               onSuccess: [ 'func:window.redirect', ],
//               onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
//               blocking: true, 
//               renderOnError: false,
//             },
//           },
//       },
//       callbacks: ['func:window.setHeaders', ],
//       'onFinish': 'render',
//     },
//   },
// };