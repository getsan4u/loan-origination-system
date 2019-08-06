// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const simulationTabs = utilities.views.simulation.components.simulationTabs;
// const getResourceList = require('../shared/components/overview_data_components').getResourceList;
// const getInfoBoxes = require('../shared/components/overview_data_components').getInfoBoxes;
// let randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/processing/overview': {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           simulationTabs('overview'),
//           plainHeaderTitle({
//             title: 'Automated Processing',
//             subtitle: 'Run your strategies against a single case or batch files and analyze the results',
//           }),
//           styles.fullPageDivider,
//           {
//             component: 'Container',
//             props: {
//               style: {
//                 marginTop: '2rem',
//               },
//             },
//             children: [
//               getInfoBoxes([{
//                 title: {
//                   component: 'span',
//                   children: [{
//                     component: 'span',
//                     children: 'Individual Processing',
//                   },],
//                 },
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'settings livicon',
//                   },
//                 },],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Run a strategy against a single case to instantly produce results.',
//                 },],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/processing/individual/run',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO INDIVIDUAL PROCESSING',
//                 },],
//               }, {
//                 title: 'Batch Processing',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'lab livicon',
//                   },
//                 },],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Run a strategy against multiple cases to produce results in batch.',
//                 },],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/processing/batch/run',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO BATCH PROCESSING',
//                 },],
//               }, {
//                 title: 'Compare Strategies',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'bar-chart livicon',
//                   },
//                 },],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Examine batch processing results with analytical tools to understand performance.',
//                 },],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/processing/analysis',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO STRATEGY ANALYSIS',
//                 },],
//               },], 'flow'),
//               {
//                 component: 'ResponsiveCard',
//                 props: cardprops({
//                   cardTitle: 'Helpful Resources',
//                   cardProps: {
//                     className: 'primary-card-gradient',
//                   },
//                 }),
//                 children: [getResourceList([{
//                   title: 'User Guide',
//                   externalIcon: true,
//                   doubleList: true,
//                   links: [{
//                     name: 'Overview of Automated Processing',
//                     location: 'https://docs.digifi.io/docs/overview-dp',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/analyze-results',
//                     name: 'Analyzing Results',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/reusable-cases',
//                     name: 'Creating Cases',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/welcome-to-digifi',
//                     name: 'View All',
//                     style: {
//                       fontWeight: 700,
//                     },
//                   }, {
//                     location: 'https://docs.digifi.io/docs/running-strategies',
//                     name: 'Running Strategies',
//                   },],
//                 }, {
//                   title: 'DigiFi Support',
//                   textContent: [{
//                     name: 'Phone: 646.663.3392',
//                   }, {
//                     name: 'Email: support@digifi.io',
//                   },],
//                 },
//                 ]),],
//               },],
//           },
//         ],
//       },
//       resources: {
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
//       callbacks: ['func:window.initSimulationIcons', 'func:window.setHeaders',],
//       onFinish: 'render',
//       pageData: {
//         title: 'DigiFi | Automated Processing',
//         navLabel: 'Automated Processing',
//       },
//     },
//   },
// };