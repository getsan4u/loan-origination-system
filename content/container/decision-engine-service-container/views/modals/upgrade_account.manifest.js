// 'use strict';

// const mfaCode = require('../../utilities/views/modals/mfa_code_form.js');
// const styles = require('../../utilities/views/constants/styles');
// const randomKey = Math.random;
// const cardprops = require('../../utilities/views/shared/props/cardprops');

// module.exports = {
//   'containers': {
//     '/modal/upgrade_account': {
//       layout: {
//         component: 'Container',
//         props: {
//           style: {
//             display: 'flex',
//             justifyContent: 'space-between',
//           },
//         },
//         children: [
//           {
//             component: 'div',
//             passProps: {
//               style: {
//                 width: '40%',
//                 marginLeft: 'auto',
//               },
//             },
//             children: [{
//               component: 'p',
//               children: 'Standard',
//             }, {
//               component: 'p',
//               children: '$0.25 Per Executed Process',
//             },],
//           },
//           {
//             component: 'div',
//             passProps: {
//               style: {
//                 width: '40%',
//               },
//             },
//             children: [{
//               component: 'p',
//               children: 'Premium',
//             }, {
//               component: 'p',
//               children: 'Contact Us For Pricing',
//             }, ],
//           },
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
//       'onFinish': 'render',
//     },
//   },
// };