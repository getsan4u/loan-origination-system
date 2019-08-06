// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const simulationTabs = utilities.views.simulation.components.simulationTabs;

// module.exports = {
//   containers: {
//     '/processing/batch_processing': {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           simulationTabs('batch_processing'),
//           plainHeaderTitle({ title: 'Run Batch Process', }),
//           styles.fullPageDivider, 
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
//       callbacks: [ 'func:window.setHeaders', 'func:window.filterDataSourceFile', 'func:window.setHeaders', ],
//       onFinish: 'render',
//       pageData: {
//         title: 'DigiFi | Automated Processing',
//         navLabel: 'Automated Processing',
//       },
//     },
//   },
// };