// 'use strict';

// const utilities = require('../../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
// const simulationTabs = utilities.views.simulation.components.simulationTabs;
// const batchProcessingTabs = utilities.views.simulation.components.batchProcessingTabs;
// let randomKey = Math.random;

// module.exports = {
//   'containers': {
//     [ '/processing/batch/results' ]: {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           simulationTabs('batch/run'),
//           plainHeaderTitle({
//             title: [ {
//               component: 'span',
//               children: 'Batch Processing',
//             }, ],
//           }),
//           batchProcessingTabs('results'),
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
//                     size: 'isNarrow',
//                   },
//                   children: [{
//                     component: 'ResponsiveButton',
//                     props: {
//                       onClick: 'func:this.props.createModal',
//                       onclickProps: {
//                         title: 'Upload Documents',
//                         pathname: '/modal/upload_bulk_ocr_documents',
//                       },
//                       buttonProps: {
//                         color: 'isSuccess',
//                       },
//                     },
//                     children: 'UPLOAD DOCUMENTS',
//                   },],
//                 }, {
//                   component: 'Column',
//                   props: {
//                     className: 'global-search-bar'
//                   },
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
//                 hasWindowFunc: true,
//                 props: {
//                   ref: 'func:window.addRef',
//                   flattenRowData: true,
//                   limit: 10,
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
//                   baseUrl: '/simulation/api/batch/results?format=json&pagination=batchsimulations',
//                   'tableSearch': true,
//                   'simpleSearchFilter': true,
//                   filterSearchProps: {
//                     icon: 'fa fa-search',
//                     hasIconRight: false,
//                     className: 'global-table-search',
//                     placeholder: 'SEARCH',
//                   },
//                   headers: [ {
//                     label: 'Batch Name',
//                     sortid: 'name',
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

//                   }, {
//                     label: 'Created',
//                     sortid: 'createdat',
//                     sortable: false,
//                   }, {
//                     label: 'Progress',
//                     progressBar: true,
//                     sortid: 'status',
//                     sortable: false,
//                     headerColumnProps: {
//                       style: {
//                         width: '170px',
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
//                           onclickBaseUrl: '/processing/batch/results/:id',
//                           onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
//                         },
//                       },  {
//                         passProps: {
//                           onclickBaseUrl: '/simulation/api/simulation_results/:id/download?export_format=csv&section=batch',
//                           onclickLinkParams: [{ 'key': ':id', 'val': '_id', },],
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
//                           onclickBaseUrl: '/simulation/api/batch/results/:id',
//                           onclickLinkParams: [{ 'key': ':id', 'val': '_id', },],
//                           fetchProps: {
//                             method: 'DELETE',
//                           },
//                           successProps: {
//                             success: {
//                               notification: {
//                                 text: 'Result deleted!',
//                                 timeout: 10000,
//                                 type: 'success',
//                               },
//                             },
//                             successCallback: 'func:this.props.refresh',
//                           },
//                           confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
//                             title: 'Delete Result',
//                             textContent: [{
//                               component: 'p',
//                               children: 'Do you want to delete this result?',
//                               props: {
//                                 style: {
//                                   textAlign: 'left',
//                                   marginBottom: '1.5rem',
//                                 },
//                               },
//                             },
//                             ],
//                           }),
//                         },
//                       },
//                     ],
//                   }, ],
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
//         [ 'pagedata' ]: '/simulation/api/batch/results?format=json&pagination=batchsimulations',
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
