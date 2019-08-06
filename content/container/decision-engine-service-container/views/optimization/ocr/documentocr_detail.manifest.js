// 'use strict';

// const utilities = require('../../../utilities');
// const styles = utilities.views.constants.styles;

// module.exports = {
//   containers: {
//     '/optimization/ocr/:id/:page': {
//       layout: {
//         component: 'div',
//         privileges: [ 101, ],
//         asyncprops: {
//           _children: ['optimizationdata', '_children']
//         },
//         props: {
//           style: styles.pageContainer,
//         },
//       },
//       resources: {
//         optimizationdata: {
//           url: '/optimization/api/get_documents/:id/:page?',
//           options: {
//             // onSuccess: ['func:window.hideSecurityCert',],
//           },
//         },
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
//       callbacks: [ 'func:window.setHeaders',],
//       onFinish: 'render',
//       pageData: {
//         title: 'DecisionVision | Artificial Intelligence - Overview & Credentials',
//         navLabel: 'Artificial Intelligence',
//       },
//     },
//   },
// };
