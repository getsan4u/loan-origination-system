// 'use strict';
// const styles = require('../../utilities/views/constants/styles');
// const randomKey = Math.random;

// module.exports = {
//   'containers': {
//     '/modal/required_documentcreation_variables/:id': {
//       layout: {
//         component: 'div',
//         props: {
//         },
//         asyncprops: {
//           _children: ['modeldata', 'requiredVariablesModal',],
//         },
//       },
//       'resources': {
//         modeldata: '/decision/api/standard_strategies/required_model_variables/:id?format=json&type=documentcreation',
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