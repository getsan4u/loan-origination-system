// 'use strict';

// const utilities = require('../../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
// const simulationTabs = utilities.views.simulation.components.simulationTabs;
// const individualProcessingTabs = utilities.views.simulation.components.individualProcessingTabs;
// let randomKey = Math.random;

// module.exports = {
//   'containers': {
//     [ '/processing/individual/results' ]: {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           simulationTabs('individual/run'),
//           plainHeaderTitle({
//             title: [ {
//               component: 'span',
//               children: 'Individual Processing',
//             }, ],
//           }),
//           individualProcessingTabs('results'),
//           {
//             component: 'Container',
//             children: [ {
//               component: 'Container',
//               props: {
//                 style: {
//                   // padding: 0, 
//                   margin: '20px auto',
//                 }
//               },
//               children: [ {
//                 component: 'Columns',
//                 children: [ {
//                   component: 'Column',
//                   props: {
//                     className: 'global-search-bar'
//                   }
//                 }, {
//                   component: 'Column',
//                   props: {
//                     size: 'isNarrow',
//                     className: 'global-guide-btn',
//                   },
//                   children: [ {
//                     component: 'ResponsiveButton',
//                     props: {
//                       onclickBaseUrl: '',
//                       aProps: {
//                         target: '_blank',
//                         className: '__re-bulma_button __re-bulma_is-primary',
//                       }
//                     },
//                     children: [ {
//                       component: 'span',
//                       children: 'GUIDE',
//                     }, {
//                       component: 'Icon',
//                       props: {
//                         icon: 'fa fa-external-link'
//                       }
//                     } ],
//                   }, ]
//                 }, ]
//               } ]
//             },
//             {
//               component: 'ResponsiveCard',
//               props: cardprops({
//                 headerStyle: {
//                   display: 'none',
//                 }
//               }),
//               children: [ {
//                 component: 'ResponsiveTable',
//                 bindprops: true,
//                 props: {
//                   flattenRowData: true,
//                   limit: 25,
//                   dataMap: [ {
//                     'key': 'rows',
//                     value: 'rows',
//                   }, {
//                     'key': 'numItems',
//                     value: 'numItems',
//                   }, {
//                     'key': 'numPages',
//                     value: 'numPages',
//                   } ],
//                   hasPagination: true,
//                   simplePagination: true,
//                   useInputRows: false,
//                   addNewRows: false,
//                   baseUrl: '/simulation/api/individual/results?pagination=true',
//                   'tableSearch': true,
//                   'simpleSearchFilter': true,
//                   filterSearchProps: {
//                     icon: 'fa fa-search',
//                     hasIconRight: false,
//                     className: 'global-table-search',
//                     placeholder: 'SEARCH',
//                   },
//                   headers: [ {
//                     label: 'Case Name',
//                     sortid: 'case_name',
//                     sortable: false,
//                     headerColumnProps: {
//                       style: {
//                         width: '35%',
//                       },
//                     },
//                   }, {
//                     label: 'Strategy',
//                     sortid: 'strategy_name',
//                     sortable: false,
//                     headerColumnProps: {
//                       style: {
//                         // width: '10%',
//                       },
//                     },
//                   }, {
//                     label: 'Created',
//                     sortid: 'createdat',
//                     sortable: false,
//                     headerColumnProps: {
//                       style: {
//                         // width: '10%',
//                       },
//                     },
//                   }, {
//                     'headerColumnProps': {
//                       style: {
//                         width: '125px',
//                       },
//                     },
//                     columnProps: {
//                       style: {
//                         whiteSpace: 'nowrap',
//                       },
//                     },
//                     label: ' ',
//                     buttons: [
//                       {
//                         passProps: {
//                           buttonProps: {
//                             icon: 'fa fa-pencil',
//                             className: '__icon_button',
//                           },
//                           onClick: 'func:this.props.reduxRouter.push',
//                           onclickBaseUrl: '/processing/individual/results/:id',
//                           onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
//                         },
//                       }, {
//                         passProps: {
//                           onclickBaseUrl: '/simulation/api/download/case/:id',
//                           onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
//                           aProps: {
//                             className: '__icon_button __re-bulma_button icon-save-content',
//                           },
//                         },
//                       }, {
//                         passProps: {
//                           buttonProps: {
//                             icon: 'fa fa-trash',
//                             color: 'isDanger',
//                             className: '__icon_button',
//                           },
//                           onClick: 'func:this.props.fetchAction',
//                           onclickBaseUrl: '/simulation/api/individual/results/:id',
//                           onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
//                           confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
//                             title: 'Delete Case',
//                             textContent: [ {
//                               component: 'p',
//                               children: 'Do you want to permanently delete this case?',
//                               props: {
//                                 style: {
//                                   textAlign: 'left',
//                                   marginBottom: '1.5rem',
//                                 },
//                               },
//                             },
//                             ],
//                           }),
//                           fetchProps: {
//                             method: 'DELETE',
//                           },
//                           successProps: {
//                             success: {
//                               notification: {
//                                 text: 'Changes saved successfully!',
//                                 timeout: 10000,
//                                 type: 'success',
//                               },
//                             },
//                             successCallback: 'func:this.props.refresh',
//                           },
//                         },
//                       },
//                     ],
//                   }, ],
//                   // rows: [ {
//                   //   case_name: 'Loan Application 1',
//                   //   strategy_name: 'Lending Strategy V1 (Active)',
//                   //   createdat: '07/11/2018 by Demo User',

//                   // } ],
//                   headerLinkProps: {
//                     style: {
//                       textDecoration: 'none',
//                     },
//                   },
//                 },
//                 asyncprops: {
//                   rows: [ 'pagedata', 'rows', ],
//                   numItems: [ 'pagedata', 'numItems', ],
//                   numPages: [ 'pagedata', 'numPages', ],
//                 },
//               } ]
//             }, ],
//           },
//         ],
//       },
//       'resources': {
//         [ 'pagedata' ]: '/simulation/api/individual/results?format=json&pagination=true',
//         checkdata: {
//           url: '/auth/run_checks',
//           settings: {
//             onSuccess: [ 'func:window.redirect', ],
//             onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
//             blocking: true,
//             renderOnError: false,
//           },
//         },
//       },
//       'callbacks': [ 'func:window.globalBarSaveBtn', 'func:window.updateGlobalSearchBar', 'func:window.setHeaders', ],
//       pageData: {
//         title: 'DigiFi | Automated Processing',
//         navLabel: 'Automated Processing',
//       },
//       'onFinish': 'render',
//     },
//   },
// };
