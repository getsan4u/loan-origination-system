// 'use strict';
// const styles = require('../../utilities/views/constants/styles');
// const randomKey = Math.random;
// const periodic = require('periodicjs');

// module.exports = {
//   'containers': {
//     '/modal/save_data_integration/:id': {
//       layout: {
//         component: 'Container',
//         props: {},
//         children: [{
//           component: 'div',
//           children: [{
//             component: 'span',
//             props: {
//               style: {
//                 textDecoration: 'underline',
//               },
//             },
//             children: 'WARNING: ',
//           }, {
//             component: 'span',
//             children: 'Changes to credentials may affect system performance. Please check before saving. Note that new credentials will only affect the real-time API once you have reactivated your Strategy within Automation Management.',
//           },
//           ],
//         }, {
//           component: 'p',
//           props: {
//             style: {
//               marginTop: '10px',
//             },
//           },
//           children: 'Please confirm that you would like to save changes.',  
//         },
//         {
//           component: 'ResponsiveForm',
//           props: {
//             flattenFormData: true,
//             footergroups: false,
//             formgroups: [{
//               gridProps: {
//                 key: randomKey(),
//                 className: 'modal-footer-btns',
//               },
//               formElements: [{
//                 type: 'layout',
//                 value: {
//                   component: 'ResponsiveButton',
//                   children: 'CONFIRM',
//                   props: {
//                     onClick: 'func:window.submitDataIntegration',
//                     buttonProps: {
//                       color: 'isPrimary',
//                     },
//                   },
//                 },
//               }, {
//                 type: 'layout',
//                 value: {
//                   component: 'ResponsiveButton',
//                   children: 'CANCEL',
//                   props: {
//                     onClick: 'func:window.hideModal',
//                     onClickProps: 'last',
//                     buttonProps: {
//                       color: 'isDanger',
//                     },
//                   },
//                 },
//               },
//               ],
//             },
//             ],
//           },
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
//       'onFinish': 'render',
//     }, 
//   },
// };