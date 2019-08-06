// 'use strict';

// const utilities = require('../../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
// const simulationTabs = utilities.views.simulation.components.simulationTabs;
// const batchProcessingTabs = utilities.views.simulation.components.batchProcessingTabs;
// let randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/processing/batch/run': {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           simulationTabs('batch/run'),
//           plainHeaderTitle({ title: 'Batch Processing', }),
//           batchProcessingTabs('run'),
//           {
//             component: 'Container',
//             props: {
//               style: {},
//             },
//             asyncprops: {
//               _children: ['setupdata', 'simulationPage', ],
//             },
//           },
//         ],
//       },
//       resources: {
//         setupdata: '/simulation/api/get_setup_data?pagination=simulations',
//         checkdata: {
//           url: '/auth/run_checks',
//           options: {
//             onSuccess: ['func:window.redirect',],
//             onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
//             blocking: true, 
//             renderOnError: false,
//           },
//         },
//       },
//       callbacks: [ 'func:window.setHeaders', 'func:window.filterDataSourceFile',  ],
//       onFinish: 'render',
//       pageData: {
//         title: 'DigiFi | Automated Processing',
//         navLabel: 'Automated Processing',
//       },
//     },
//   },
// };
