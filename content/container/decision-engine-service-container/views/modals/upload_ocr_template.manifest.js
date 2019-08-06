// 'use strict';
// const styles = require('../../utilities/views/constants/styles');
// const randomKey = Math.random;
// const periodic = require('periodicjs');

// module.exports = {
//   'containers': {
//     '/modal/simulation/upload_ocr_template': {
//       layout: {
//         component: 'Container',
//         props: {},
//         children: [
//           {
//             component: 'ResponsiveForm',
//             asyncprops: {
//               __formOptions: [ 'templatedata', 'formoptions' ],
//             },
//             props: {
//               // flattenFormData: true,
//               footergroups: false,
//               useFormOptions: true,
//               'onSubmit': {
//                 url: '/simulation/api/upload_ocr_file?',
//                 options: {
//                   method: 'POST',
//                 },
//                 successCallback: 'func:this.props.hideModal',
//                 successProps: 'last'
//               },
//               formgroups: [ {
//                 gridProps: {
//                   key: randomKey(),
//                 },
//                 formElements: [ {
//                   label: 'Document for OCR Text Extraction',
//                   type: 'file',
//                   name: 'upload_file',
//                 }, ],
//               }, {
//                 gridProps: {
//                   key: randomKey(),
//                 },
//                 formElements: [ {
//                   label: 'OCR Template',
//                   name: 'ocr_id',
//                   type: 'dropdown',
//                   passProps: {
//                     selection: true,
//                     fluid: true,
//                   },
//                 }, ],
//               }, {
//                 gridProps: {
//                   key: randomKey(),
//                   className: 'modal-footer-btns',
//                 },
//                 formElements: [ {
//                   type: 'submit',
//                   value: 'EXTRACT TEXT',
//                   passProps: {
//                     color: 'isPrimary',
//                   },
//                   layoutProps: {},
//                 }, ],
//               },
//               ],
//             },
//           },
//         ],
//       },
//       'resources': {
//         templatedata: '/simulation/api/get_documentocr_dropdown',
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
//       callbacks: ['func:window.filtertemplateFile',],
//       'onFinish': 'render',
//     },
//   },
// };