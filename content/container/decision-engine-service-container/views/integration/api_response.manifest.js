// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../utilities');
// const shared = utilities.views.shared;
// const formElements = utilities.views.decision.shared.components.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const references = utilities.views.constants.references;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
// let randomKey = Math.random;
// const integrationTabs = utilities.views.integration.components.integrationTabs;
// const apiTabs = utilities.views.integration.components.apiTabs;

// module.exports = {
//   containers: {
//     '/integration/api_setup/response': {
//       layout: {
//         component: 'div',
//         privileges: [ 101, ],
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           integrationTabs('api_setup/request'),
//           plainHeaderTitle({
//             title: 'API Response',
//           }),
//           styles.fullPageDivider,
//           apiTabs('response'),
//           plainGlobalButtonBar({
//             left: [
//               {
//                 component: 'Semantic.Dropdown',
//                 props: {
//                   className: '__re-bulma_button __re-bulma_is-success',
//                   text: 'DOWNLOAD API RESPONSE FORMAT',
//                 },
//                 children: [ {
//                   component: 'Semantic.DropdownMenu',
//                   children: [ {
//                     component: 'Semantic.Item',
//                     children: [ {
//                       component: 'ResponsiveButton',
//                       buttonProps: {
//                         color: 'isSuccess',
//                       },
//                       asyncprops: {
//                         onclickPropObject: [ 'orgdata', 'org', 'association', 'client', ],
//                       },
//                       props: {
//                         onclickBaseUrl: '/api/download_response/json/:client_id',
//                         aProps: {
//                           className: '__re-bulma_button __re-bulma_is-primary',
//                           token: true,
//                         },
//                         onclickLinkParams: [ { key: ':client_id', val: 'client_id' },],
//                       },
//                       children: 'JSON'
//                     }, ],
//                   }, {
//                     component: 'Semantic.Item',
//                     children: [ {
//                       component: 'ResponsiveButton',
//                       buttonProps: {
//                         color: 'isSuccess',
//                       },
//                       asyncprops: {
//                         onclickPropObject: [ 'orgdata', 'org', 'association', 'client', ],
//                       },
//                       props: {
//                         onclickBaseUrl: '/api/download_response/xml/:client_id',
//                         aProps: {
//                           className: '__re-bulma_button __re-bulma_is-primary',
//                           token: true,
//                         },
//                         onclickLinkParams: [ { key: ':client_id', val: 'client_id' },],
//                       },
//                       children: 'XML',
//                     }, ],
//                   }, ],
//                 }, ],
//               }, 
//             ],
//             right: [{
//               guideButton: true,
//               location: references.guideLinks.integration['/api_response'],
//             },
//             ],
//           }),
//           {
//             component: 'Container',
//             props: {
//               style: {},
//             },
//             children: [
//               {
//                 component: 'ResponsiveForm',
//                 props: {
//                   formgroups: [{
//                     gridProps: {
//                       key: randomKey(),
//                     },
//                     card: {
//                       doubleCard: true,
//                       leftCardProps: cardprops({
//                         cardTitle: 'Overview',
//                         cardStyle: {
//                           marginBottom: 0,
//                         },
//                       }),
//                       rightCardProps: cardprops({
//                         cardTitle: 'API Response Format',
//                         cardStyle: {
//                           marginBottom: 0,
//                         },
//                       }),
//                     },    
//                     formElements: [formElements({
//                       twoColumns: true,
//                       doubleCard: true,
//                       left: [{
//                         type: 'layout',
//                         value: {
//                           component: 'div',
//                           children: [{
//                             component: 'p',
//                             children: 'The API responds to requests with a single HTTPS response containing the body type used in the request (JSON or XML).',
//                           }, {
//                             component: 'p',
//                             children: 'Responses are in the format shown in the example to the right. For full documentation of the response elements click the guide button.',
//                           }, {
//                             component: 'p',
//                             props: {
//                               style: {
//                                 fontStyle: 'italic',
//                               },
//                             },
//                             children: 'Note: Data items shown in the API Response Format section are for example purposes only. The actual items provided in the API response will vary depending on the Strategy. ',
//                           },
//                           ],
//                         },
//                       },
//                       ],
//                       right: [
//                         {
//                           type: 'layout',
//                           layoutProps: {
//                             className: 'tabbed-code-mirror',
//                           },
//                           value: {
//                             component: 'ResponsiveTabs',
//                             bindprops: true,
//                             props: {
//                               tabsProps: {
//                                 tabStyle: 'isBoxed',
//                               },
//                               isButton: false,
//                             },
//                             thisprops: {
//                               tabs: ['tabs', ],
//                             },
//                           },
//                         },
//                       ],
//                     }),
//                     ],
//                   },
//                   ],
//                 },
//                 asyncprops: {
//                   formdata: ['orgdata', 'org', 'association', 'client', ],
//                   tabs: ['apidata', 'tabs', ],
//                 },
//               },
//             ],
//           },
//         ],
//       },
//       resources: {
//         orgdata: '/organization/get_org',
//         apidata: '/api/api_tabs?page=response',
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
//       callbacks: [],
//       onFinish: 'render',
//       pageData: {
//         title: 'DecisionVision | API Response',
//         navLabel: 'Technical Setup',
//       },
//     },
//   },
// };
