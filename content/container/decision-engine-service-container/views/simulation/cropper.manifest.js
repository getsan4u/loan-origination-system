// 'use strict';
// const periodic = require('periodicjs');
// const utilities = require('../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const randomKey = Math.random;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const simulationTabs = utilities.views.simulation.components.simulationTabs;

// module.exports = {
//   'containers': {
//     [ `/processing/cropper` ]: {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           {
//             component: 'Container',
//             children: [
//               plainHeaderTitle({
//                 title: [ {
//                   component: 'span',
//                   children: 'Invoice Template',
//                 }, ],
//               }),
//               {
//                 component: 'ResponsiveForm',
//                 props: {
//                   flattenFormData: true,
//                   footergroups: false,
//                   useFormOptions: true,
//                   // formdata: {
//                   //   page_num: '1',
//                   //   template_name: 'Invoice Template',
//                   //   createdat: '2018-08-09',
//                   //   updatedat: '2018-08-09',
//                   //   description: 'This is a description',
//                   // },
//                   onSubmit: {
//                     url: '/simulation/api/cropper',
//                     params: [
//                       // { 'key': ':id', 'val': '_id', },
//                     ],
//                     options: {
//                       headers: {
//                         'Content-Type': 'application/json',
//                       },
//                       method: 'POST',
//                     },
//                     successProps: {
//                       type: 'success',
//                       text: 'Changes saved successfully!',
//                       timeout: 10000,
//                     },
//                     successCallback: 'func:window.editFormSuccessCallback',
//                   },
//                   // validations,
//                   // hiddenFields: hiddenFields,
//                   // formgroups: formgroups[ settings.location ]
//                   formgroups: [ {
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
//                         cardTitle: 'Variables to Extract',
//                         cardStyle: {
//                           marginBottom: 0,
//                         },
//                       }),
//                     },
//                     formElements: [ formElements({
//                       twoColumns: true,
//                       doubleCard: true,
//                       left: [ {
//                         label: 'OCR Template Name',
//                         name: 'template_name',
//                         passProps: {
//                           state: 'isDisabled',
//                         },
//                       }, {
//                         label: 'Created',
//                         name: 'createdat',
//                         passProps: {
//                           state: 'isDisabled',
//                         },
//                       }, {
//                         label: 'Updated',
//                         name: 'updatedat',
//                         passProps: {
//                           state: 'isDisabled',
//                         },
//                       }, {
//                         label: 'Description',
//                         name: 'description',
//                       } ],
//                       right: [ {
//                         type: 'layout',
//                         value: {
//                           component: 'ResponsiveTable',
//                           props: {
//                             rows: [ {
//                               page: 1,
//                               location: '(12, 180) to (80, 190)',
//                               output_variable: 'PO Box',
//                             }, ],
//                             headers: [ {
//                               label: 'Page',
//                               sortid: 'page',
//                               sortable: false,
//                             }, {
//                               label: 'Location',
//                               sortid: 'location',
//                               sortable: false,
//                             }, {
//                               label: 'Variable Assigned',
//                               sortid: 'output_variable',
//                               sortable: false,
//                             }, {
//                               label: ' ',
//                               headerColumnProps: {
//                                 style: {
//                                   width: '80px',
//                                 },
//                               },
//                               columnProps: {
//                                 style: {
//                                   whiteSpace: 'nowrap',
//                                 },
//                               },
//                               buttons: [ {
//                                 passProps: {
//                                   buttonProps: {
//                                     icon: 'fa fa-pencil',
//                                     className: '__icon_button',
//                                   },
//                                   onClick: 'func:this.props.reduxRouter.push',
//                                   onclickBaseUrl: '/processing/test_cases/:id/detail',
//                                   onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
//                                 },
//                               }, {
//                                 passProps: {
//                                   buttonProps: {
//                                     icon: 'fa fa-trash',
//                                     color: 'isDanger',
//                                     className: '__icon_button',
//                                   },
//                                   onClick: 'func:this.props.fetchAction',
//                                   onclickBaseUrl: '/processing/api/test_cases/:id',
//                                   onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
//                                   fetchProps: {
//                                     method: 'DELETE',
//                                   },
//                                   successProps: {
//                                     success: {
//                                       notification: {
//                                         text: 'Changes saved successfully!',
//                                         timeout: 10000,
//                                         type: 'success',
//                                       },
//                                     },
//                                     successCallback: 'func:this.props.refresh',
//                                   },
//                                   confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
//                                     title: 'Delete Automated Processing Case',
//                                     textContent: [ {
//                                       component: 'p',
//                                       children: 'Do you want to delete this case?',
//                                       props: {
//                                         style: {
//                                           textAlign: 'left',
//                                           marginBottom: '1.5rem',
//                                         },
//                                       },
//                                     }, ],
//                                   }),
//                                 },
//                               }, ],
//                             }, ]
//                           },
//                         },
//                       } ],
//                     }), ],
//                   }, {
//                     gridProps: {
//                       key: randomKey(),
//                     },
//                     card: {
//                       props: cardprops({
//                         cardTitle: 'Variable Selection',
//                       }),
//                     },
//                     formElements: [ {
//                       name: 'page_num',
//                       label: 'Page Number',
//                       type: 'dropdown',
//                       passProps: {
//                         selection: true,
//                         fluid: true,
//                       },
//                       options: [ {
//                         'label': '1 of 2',
//                         // 'value': '/path/to/image_0',
//                         'value': '1',
//                       }, {
//                         'label': '2 of 2',
//                         // 'value': '/path/to/image_1',
//                         value: '2',
//                       } ],
//                       layoutProps: {
//                       },
//                     }, {
//                       name: 'cropped',
//                       type: 'cropper',
//                       passProps: {
//                         includeFileInput: false,
//                         cropperSrc: 'croppersrc',
//                         cropperProps: {
//                           style: {
//                             height: 612,
//                             width: 792,
//                           },
//                           minCanvasWidth: 612,
//                           minCanvasHeight: 792,
//                           scalable: true,
//                         }
//                       }
//                     }, ],
//                   }, {
//                     gridProps: {
//                       key: randomKey(),
//                     },
//                     formElements: [ {
//                       // name: 'cropped',
//                       type: 'submit',
//                       value: 'SAVE',
//                     }
//                     ],
//                   }, ],
//                 },
//                 asyncprops: {
//                   formdata: [ `cropperdata`, 'formdata' ],
//                   // versions: [ `${settings.type}data`, 'data', 'versions' ],
//                   // changelogs: [ `${settings.type}data`, 'data', 'changelogs' ],
//                   // __formOptions: [ `${settings.type}data`, 'formoptions' ],
//                 },
//               },
//               // {
//               //   component: 'ResponsiveCropper',

//               // }

//             ]
//           } ]
//       },
//       'resources': {
//         [ `cropperdata` ]: `/simulation/api/cropperdata?format=json`,
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
//       'pageData': {
//         'title': 'DigiFi | Automation Management',
//         'navLabel': 'Automation Management',
//       },
//       'onFinish': 'render',
//     },
//   },
// };