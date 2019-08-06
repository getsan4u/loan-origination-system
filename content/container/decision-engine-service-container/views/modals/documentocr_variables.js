// 'use strict';
// const styles = require('../../utilities/views/constants/styles');
// const randomKey = Math.random;

// module.exports = {
//   'containers': {
//     '/modal/required_documentocr_variables/:id': {
//       layout: {
//         component: 'div',
//         props: {
//         },
//         asyncprops: {
//           _children: ['documentdata', 'receivedVariablesModal',],
//         },
//       },
//       'resources': {
//         documentdata: '/optimization/api/documents/get_document_editmodal/:id?format=json&type=ocrdocument',
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
//       'callbacks': ['func:window.setHeaders', ],
//       'onFinish': 'render',
//     },
//   },
// };