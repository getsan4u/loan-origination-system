// 'use strict';
// const capitalize = require('capitalize');
// const pluralize = require('pluralize');
// const utilities = require('../../../../utilities');
// const styles = utilities.views.constants.styles;
// const CONSTANTS = utilities.views.decision.constants;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
// const decisionTabs = utilities.views.decision.shared.components.decisionTabs;
// const cardprops = require('../../../../utilities/views/decision/shared/components/cardProps');
// const getResourceList = require('../../../shared/components/overview_data_components').getResourceList;
// const getInfoBoxes = require('../../../shared/components/overview_data_components').getInfoBoxes;
// const randomKey = Math.random;

// module.exports = {
//   'containers': {
//     [ '/decision/overview' ]: {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           decisionTabs('overview'),
//           plainHeaderTitle({
//             title: 'Automation Management',
//             subtitle: 'Build, manage and activate your automated process',
//           }),
//           {
//             component: 'div',
//             props: {
//               style: {
//                 margin: '1rem 0 2rem',
//               },
//             },
//             children: [{
//               component: 'hr',
//               props: {
//                 style: {
//                   border: 'none',
//                   borderBottom: '1px solid #ccc',
//                 },
//               },
//             }, ],
//           }, {
//             component: 'Container',
//             children: [ 
//               getInfoBoxes([{
//                 title: 'Create Variables',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'grid livicon',
//                   },
//                 }, ],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Set up variables to organize your data structure and provide the building blocks for strategy creation.',
//                 }, ],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/decision/variables/input',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO VARIABLES',
//                 }, ],
//               }, {
//                 title: 'Build Strategies',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'diagram livicon',
//                   },
//                 }, ],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Create strategies for automated processing by defining workflows and adding in business logic.',
//                 }, ],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/decision/strategies/all',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO STRATEGIES',
//                 }, ],
//               }, {
//                 title: 'Activate Automation',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'bulb livicon',
//                   },
//                 }, ],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Activate strategies for use in the real-time processing engine, with no IT support required.',
//                 }, ],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/decision/activation',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO ACTIVATION',
//                 }, ],
//               }, ], 'flow'),
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
//                     location: 'https://docs.digifi.io/docs/overview-am',
//                     name: 'Overview of Automation Management',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/adding-processing-logic-to-a-strategy',
//                     name: 'Adding Processing Logic',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/variables',
//                     name: 'Data Structuring',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/activating-a-decision-strategy',
//                     name: 'Activating an Automation Strategy',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/creating-editing-strategies',
//                     name: 'Creating a New Strategy',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/other',
//                     name: 'Additional Information',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/implementing-a-decision-process',
//                     name: 'Implementing a Process Flow',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/welcome-to-digifi',
//                     name: 'View All',
//                     style: {
//                       fontWeight: 700,
//                     },
//                   }, ],
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
//       'resources': {
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
//       callbacks:['func:window.initStrategyIcons', ],
//       'pageData': {
//         'title': 'DigiFi | Strategy Overview',
//         'navLabel': 'Automation Management',
//       },
//       'onFinish': 'render',
//     },
//   },
// };
