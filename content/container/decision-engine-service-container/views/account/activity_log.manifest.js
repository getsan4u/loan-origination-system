// 'use strict';

// const cardprops = require('../../utilities/views/shared/props/cardprops');
// const styles = require('../../utilities/views/constants/styles');
// const references = require('../../utilities/views/constants/references');
// const periodic = require('periodicjs');
// const reactappLocals = periodic.locals.extensions.get('periodicjs.ext.reactapp');
// const reactapp = reactappLocals.reactapp();
// const plainHeaderTitle = require('../../utilities/views/shared/component/layoutComponents').plainHeaderTitle;
// const plainGlobalButtonBar = require('../../utilities/views/shared/component/globalButtonBar').plainGlobalButtonBar;
// let randomKey = Math.random;
// const utilities = require('../../utilities');
// const account_management_tabs = utilities.views.settings.components.account_management_tabs;

// module.exports = {
//   containers: {
//     '/company-settings/account/activity': {
//       layout: {
//         component: 'div',
//         privileges: [101,],
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           account_management_tabs('account/billing'),
//           plainHeaderTitle({
//             title: 'Activity Log',
//           }),
//           {
//             'component': 'div',
//             'props': {
//               'className': 'global-sub-tabs',
//             },
//             'children': [
//               {
//                 'component': 'Container',
//                 'children': [
//                   {
//                     'component': 'Tabs',
//                     'bindprops': true,
//                     'props': {
//                       'tabStyle': 'isBoxed',
//                       'style': {
//                         'marginBottom': '-1px',
//                         'marginTop': '-10px',
//                       },
//                     },
//                     'children': [
//                       {
//                         'component': 'TabGroup',
//                         'bindprops': true,
//                         'children': [
//                           {
//                             'component': 'Tab',
//                             'bindprops': true,
//                             'props': {
//                               'isActive': false,
//                               'style': {
//                                 'textAlign': 'center',
//                                 'alignSelf': 'flex-end',
//                               },
//                             },
//                             'children': [
//                               {
//                                 'component': 'ResponsiveButton',
//                                 'props': {
//                                   'onClick': 'func:this.props.reduxRouter.push',
//                                   'onclickBaseUrl': '/company-settings/account/products',
//                                   'onclickLinkParams': [],
//                                   'style': {
//                                     'borderColor': 'transparent',
//                                     'padding': 0,
//                                   },
//                                 },
//                                 'children': 'Products',
//                               },
//                             ],
//                           },
//                           {
//                             'component': 'Tab',
//                             'bindprops': true,
//                             'props': {
//                               'isActive': false,
//                               'style': {
//                                 'textAlign': 'center',
//                                 'alignSelf': 'flex-end',
//                               },
//                             },
//                             'children': [
//                               {
//                                 'component': 'ResponsiveButton',
//                                 'props': {
//                                   'onClick': 'func:this.props.reduxRouter.push',
//                                   'onclickBaseUrl': '/company-settings/account/billing',
//                                   'onclickLinkParams': [],
//                                   'style': {
//                                     'borderColor': 'transparent',
//                                     'padding': 0,
//                                   },
//                                 },
//                                 'children': 'Billing',
//                               },
//                             ],
//                           },
//                           {
//                             'component': 'Tab',
//                             'bindprops': true,
//                             'props': {
//                               'isActive': false,
//                               'style': {
//                                 'textAlign': 'center',
//                                 'alignSelf': 'flex-end',
//                               },
//                             },
//                             'children': [
//                               {
//                                 'component': 'ResponsiveButton',
//                                 'props': {
//                                   'onClick': 'func:this.props.reduxRouter.push',
//                                   'onclickBaseUrl': '/company-settings/account/users',
//                                   'onclickLinkParams': [],
//                                   'style': {
//                                     'borderColor': 'transparent',
//                                     'padding': 0,
//                                   },
//                                 },
//                                 'children': 'Users',
//                               },
//                             ],
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//           plainGlobalButtonBar({
//             left: [{
//               component: 'ResponsiveButton',
//               children: 'DOWNLOAD',
//               asyncprops: {
//                 onclickPropObject: ['checkdata', 'org',],
//               },
//               props: {
//                 'onclickBaseUrl': '/organization/:id/download_activity_log?format=json&export_format=csv',
//                 onclickLinkParams: [{ 'key': ':id', 'val': '_id', },],
//                 aProps: {
//                   className: '__re-bulma_button __re-bulma_is-success',
//                   token: true,
//                 },
//               },
//             },],
//             right: [{
//               guideButton: true,
//               location: references.guideLinks.companySettings['/activity-log'],
//             },],
//           }),
//           {
//             component: 'Container',
//             props: {
//               style: {},
//             },
//             children: [
//               {
//                 component: 'ResponsiveCard',
//                 props: cardprops({
//                   cardTitle: 'Activity Log',
//                   headerStyle: {
//                     display: 'none',
//                   },
//                   cardStyle: {
//                     marginTop: 20,
//                   },
//                 }),
//                 children: [
//                   {
//                     component: 'ResponsiveTable',
//                     props: {
//                       flattenRowData: true,
//                       limit: 15,
//                       sort: '-createdat',
//                       dataMap: [{
//                         'key': 'rows',
//                         value: 'rows',
//                       }, {
//                         'key': 'numItems',
//                         value: 'numItems',
//                       }, {
//                         'key': 'numPages',
//                         value: 'numPages',
//                         }, ],
//                         calculatePagination: true,
//                       hasPagination: true,
//                       simplePagination: true,
//                       baseUrl: '/organization/get_activity_log?paginate=true',
//                       headers: [{
//                         label: 'Date',
//                         sortid: 'request_date',
//                         momentFormat: 'MM/DD/YYYY | hh:mm:ssA',
//                         sortable: false,
//                       }, {
//                         label: 'Process ID',
//                         sortid: 'transaction_id',
//                         sortable: false,
//                       }, {
//                         label: 'Type',
//                         sortid: 'type',
//                         sortable: false,
//                       }, {
//                         label: 'Strategy Name',
//                         sortid: 'strategy_name',
//                         sortable: false,
//                       }, {
//                         label: 'Strategy Version',
//                         sortid: 'strategy_version',
//                         sortable: false,
//                       }, {
//                         label: 'Strategy Status',
//                         sortid: 'strategy_status',
//                         sortable: false,
//                       }, {
//                         label: '# of Processes',
//                         sortid: 'overall_count',
//                         sortable: false,
//                       }, {
//                         label: 'Status',
//                         sortid: 'status_code',
//                         sortable: false,
//                       },],
//                       headerLinkProps: {
//                         style: {
//                           textDecoration: 'none',
//                         },
//                       },
//                     },
//                     asyncprops: {
//                       rows: ['activitydata', 'rows',],
//                       numItems: ['activitydata', 'numItems',],
//                       numPages: ['activitydata', 'numPages',],
//                     },

//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//       resources: {
//         activitydata: '/organization/get_activity_log?paginate=true',
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
//       callbacks: [],
//       onFinish: 'render',
//       pageData: {
//         title: 'DigiFi | Company Settings',
//         navLabel: 'Company Settings',
//       },
//     },
//   },
// };