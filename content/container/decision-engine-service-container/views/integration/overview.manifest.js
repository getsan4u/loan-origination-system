// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const integrationTabs = utilities.views.integration.components.integrationTabs;
// const getResourceList = require('../shared/components/overview_data_components').getResourceList;
// const getInfoBoxes = require('../shared/components/overview_data_components').getInfoBoxes;
// let randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/integration/overview': {
//       layout: {
//         component: 'div',
//         privileges: [101,],
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           integrationTabs('overview'),
//           plainHeaderTitle({
//             title: 'Technical Setup',
//             subtitle: 'Manage data sources, documents and API connections',
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
//                 title: 'Connect Data Sources',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'share livicon',
//                   },
//                 }, ],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Connect external and internal data sources to use data within automated processes.',
//                 }, ],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/integration/dataintegrations',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO DATA INTEGRATIONS',
//                 }, ],
//               }, {
//                 title: 'Manage Documents',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'notebook livicon',
//                   },
//                 }, ],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Manage the templates used to extract information from documents and generate new documents.',
//                 },],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/integration/documents/ocr',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO DOCUMENTS',
//                 },],
//               }, {
//                 title: 'Integrate With API',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'servers livicon',
//                   },
//                 }, ],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Set up the API request from your systems to DigiFi to run processes in real-time.',
//                 },],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/integration/api_setup/request',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO API SETUP',
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
//                     location: 'https://docs.digifi.io/docs/overview-ti',
//                     name: 'Overview of Technical Setup',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/api-response',
//                     name: 'Receiving an API Response',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/data-integrations',
//                     name: 'Setting Up Data Integrations',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/welcome-to-digifi',
//                     name: 'View All',
//                     style: {
//                       fontWeight: 700,
//                     },
//                   }, {
//                     location: 'https://docs.digifi.io/docs/api-request', 
//                     name: 'Sending an API Request',
//                   },],
//                 }, {
//                   title: 'DigiFi Support',
//                   textContent: [{
//                     name: 'Phone: 646.663.3392',
//                   }, {
//                     name: 'Email: support@digifi.io',
//                   }, ],
//                 },
//                 ]), ],
//               }, ],
//           },
//         ],
//       },
//       resources: {
//         checkdata: {
//           url: '/auth/run_checks',
//           options: {
//             onSuccess: ['func:window.redirect', ],
//             onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
//             blocking: true, 
//             renderOnError: false,
//           },
//         },
//       },
//       callbacks: ['func:window.initIntegrationIcons', ],
//       onFinish: 'render',
//       pageData: {
//         title: 'DecisionVision | Overview',
//         navLabel: 'Technical Setup',
//       },
//     },
//   },
// };
