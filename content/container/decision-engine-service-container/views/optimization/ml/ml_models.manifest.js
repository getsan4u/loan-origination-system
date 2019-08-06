// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
// const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
// const mlmodelTabs = utilities.views.optimization.components.mlmodelTabs;
// const references = utilities.views.constants.references;
// const randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/optimization/training/mlmodels': {
//       layout: {
//         privileges: [101, 102,],
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           optimizationTabs('training/historical_data'),
//           plainHeaderTitle({
//             title: 'Machine Learning Model Training',
//             subtitle: 'Train powerful models with automated machine learning'
//           }),
//           mlmodelTabs('mlmodels'),
//           plainGlobalButtonBar({
//             left: [ {
//               component: 'ResponsiveButton',
//               props: {
//                 onClick: 'func:this.props.createModal',
//                 onclickProps: {
//                   title: 'Train Machine Learning Model',
//                   pathname: '/optimization/create_ml_model',
//                 },
//                 buttonProps: {
//                   color: 'isSuccess',
//                 },
//               },
//               children: 'TRAIN MODEL',
//             }, ],
//             right: [{
//               guideButton: true,
//               location: references.guideLinks.models['modelTraining'],
//             },]
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
//                   onSubmit: {},
//                   formgroups: [ {
//                     gridProps: {
//                       key: randomKey(),
//                     },
//                     card: {
//                       twoColumns: false,
//                       props: cardprops({
//                         cardTitle: 'Machine Learning',
//                         cardStyle: {
//                           marginBottom: 0,
//                         }
//                       }),
//                     },
//                     formElements: [ {
//                       type: 'layout',
//                       value: {
//                         component: 'ResponsiveTable',
//                         bindprops: true,
//                         thisprops: {
//                           rows: [ 'mlmodeldata', 'rows', ],
//                           numItems: [ 'mlmodeldata', 'numItems', ],
//                           numPages: [ 'mlmodeldata', 'numPages', ],
//                         },
//                         hasWindowFunc: true,
//                         props: {
//                           ref: 'func:window.addSimulationRef',
//                           label: ' ',
//                           dataMap: [ {
//                             'key': 'rows',
//                             value: 'rows',
//                           }, {
//                             'key': 'numItems',
//                             value: 'numItems',
//                           }, {
//                             'key': 'numPages',
//                             value: 'numPages',
//                           },
//                           ],
//                           limit: 10,
//                           hasPagination: true,
//                           simplePagination: true,
//                           calculatePagination: true,
//                           baseUrl: '/optimization/api/get_mlmodel_data?format=json&pagination=mlmodels',
//                           flattenRowData: true,
//                           useInputRows: false,
//                           addNewRows: false,
//                           'tableSearch': true,
//                           'simpleSearchFilter': true,
//                           filterSearchProps: {
//                             icon: 'fa fa-search',
//                             hasIconRight: false,
//                             className: 'global-table-search',
//                             placeholder: 'SEARCH',
//                           },
//                           ignoreTableHeaders: [ '_id', ],
//                           headers: [ {
//                             label: 'Model Name',
//                             sortid: 'display_name',
//                             sortable: false,
//                             headerColumnProps: {
//                               style: {
//                                 // width: '50%',
//                               },
//                             },
//                           }, {
//                             label: 'Model Type',
//                             sortid: 'type',
//                             sortable: false,
//                             value: ' ',
//                             headerColumnProps: {
//                               style: {
//                                 width: '20%',
//                               },
//                             },
//                             columnProps: {
//                               style: {
//                               },
//                             },
//                           }, {
//                             label: 'Created',
//                             sortid: 'formattedCreatedAt',
//                             sortable: false,
//                             columnProps: {
//                               style: {
//                               },
//                             },
//                           }, {
//                             label: 'Data Source',
//                             sortid: 'datasource.display_name',
//                             sortable: false,
//                             columnProps: {
//                               style: {
//                               },
//                             },
//                           }, {
//                             label: 'Status',
//                             progressBar: true,
//                             sortid: 'status',
//                             sortable: false,
//                             headerColumnProps: {
//                               style: {
//                                 width: '20%',
//                               },
//                             },
//                             columnProps: {
//                             },
//                           }, {
//                             label: ' ',
//                             headerColumnProps: {
//                               style: {
//                                 width: '80px',
//                               },
//                             },
//                             columnProps: {
//                               style: {
//                                 whiteSpace: 'nowrap',
//                               },
//                             },
//                             buttons: [ {
//                               passProps: {
//                                 buttonProps: {
//                                   icon: 'fa fa-pencil',
//                                   className: '__icon_button',
//                                 },
//                                 onClick: 'func:this.props.reduxRouter.push',
//                                 onclickBaseUrl: '/optimization/mlmodels/:id',
//                                 onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
//                               },
//                             }, {
//                               passProps: {
//                                 buttonProps: {
//                                   icon: 'fa fa-trash',
//                                   color: 'isDanger',
//                                   className: '__icon_button',
//                                 },
//                                 onClick: 'func:this.props.fetchAction',
//                                 onclickBaseUrl: '/optimization/api/mlmodels/:id',
//                                 onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
//                                 fetchProps: {
//                                   method: 'DELETE',
//                                 },
//                                 successProps: {
//                                   success: {
//                                     notification: {
//                                       text: 'Changes saved successfully!',
//                                       timeout: 10000,
//                                       type: 'success',
//                                     },
//                                   },
//                                   successCallback: 'func:this.props.refresh',
//                                 },
//                                 confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
//                                   title: 'Delete Model',
//                                   textContent: [ {
//                                     component: 'p',
//                                     children: 'Do you want to delete this model?',
//                                     props: {
//                                       style: {
//                                         textAlign: 'left',
//                                         marginBottom: '1.5rem',
//                                       },
//                                     },
//                                   },
//                                   ],
//                                 }),
//                               },
//                             },
//                             ],
//                           },
//                           ],
//                         },
//                       },
//                     }, ],
//                   },
//                   ],
//                 },
//                 asyncprops: {
//                   mlmodeldata: [ 'mlmodeldata', ],
//                 },
//               },
//             ],
//           },
//         ],
//       },
//       resources: {
//         mlmodeldata: '/optimization/api/get_mlmodel_data?pagination=mlmodels',
//         checkdata: {
//           url: '/auth/run_checks',
//           options: {
//             onSuccess: [ 'func:window.redirect', ],
//             onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
//             blocking: true,
//             renderOnError: false,
//           },
//         },
//       },
//       'callbacks': [ 'func:window.setHeaders', 'func:window.updateGlobalSearchBar'],
//       onFinish: 'render',
//       pageData: {
//         title: 'DigiFi | Machine Learning',
//         navLabel: 'Machine Learning',
//       },
//     },
//   },
// };