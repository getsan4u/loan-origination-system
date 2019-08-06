// 'use strict';
// const capitalize = require('capitalize');
// const pluralize = require('pluralize');
// const utilities = require('../../../utilities');
// const formConfigs = require('../../../utilities/views/decision/shared/components/formConfigs');
// const decisionTabs = require('../../../utilities/views/decision/shared/components/decisionTabs');
// const collectionDetailTabs = require('../../../utilities/views/decision/shared/components/collectionDetailTabs');
// const detailAsyncHeaderTitle = require('../../../utilities/views/shared/component/layoutComponents').detailAsyncHeaderTitle;
// const detailHeaderButtons = require('../../../utilities/views/decision/shared/components/detailHeaderButtons');
// const styles = require('../../../utilities/views/constants/styles');
// const CONSTANTS = require('../../../utilities/views/decision/constants');
// const cardprops = require('../../../utilities/views/decision/shared/components/cardProps');
// const formElements = require('../../../utilities/views/decision/shared/components/formElements');
// const COMPARATOR_DROPDOWN = CONSTANTS.COMPARATOR_DROPDOWN;
// const randomKey = Math.random;
// const settings = {
//   title: 'Rule Detail',
//   type: 'rule',
//   location: 'detail',
// };

// function getRuleFormElement(options) {
//   let { prop, index, labels = {}, } = options;
//   let ruleFormElements = {
//     to: {
//       name: `rule*0*state_property_attribute_value_comparison`,
//       valueCheckOnBlur: true,
//       onBlur: true,
//       errorIconRight: true,
//       label: 'To (Email Address)',
//       layoutProps: {
//         style: {
//           width: '70%',
//           paddingRight: '7px',
//           display: 'inline-block',
//           verticalAlign: 'top',
//         }
//       },
//     },
//     subject: {
//       name: `rule*1*state_property_attribute_value_comparison`,
//       valueCheckOnBlur: true,
//       onBlur: true,
//       value: '',
//       errorIconRight: true,
//       label: 'Subject',
//       layoutProps: {
//         style: {
//           width: '70%',
//           paddingRight: '7px',
//           display: 'inline-block',
//           verticalAlign: 'top',
//         }
//       },
//     },
//     state_property_attribute_value_comparison_type: {
//       name: `rule*${index}*state_property_attribute_value_comparison_type`,
//       type: 'dropdown',
//       passProps: {
//         selection: true,
//         fluid: true,
//       },
//       value: 'value',
//       options: [ {
//         'label': 'Value',
//         'value': 'value',
//       }, {
//         'label': 'Variable',
//         'value': 'variable',
//       }],
//       label: labels[ 'state_property_attribute_value_comparison_type' ] ||
//         'Value type',
//       labelProps: {
//         style: {
//           visibility: 'hidden',
//           whiteSpace: 'nowrap',
//         }
//       },
//       layoutProps: {
//         style: {
//           width: '30%',
//           display: 'inline-block',
//           verticalAlign: 'top',
//         }
//       },
//     },
//     first_state_property_attribute_value_comparison_type: {
//       name: `rule*0*state_property_attribute_value_comparison_type`,
//       type: 'dropdown',
//       passProps: {
//         selection: true,
//         fluid: true,
//       },
//       value: 'value',
//       options: [ {
//         'label': 'Value',
//         'value': 'value',
//       }, {
//         'label': 'Variable',
//         'value': 'variable',
//       }],
//       customLabel: {
//         component: 'ResponsiveButton',
//         children: 'Create New Variable',
//         props: {
//           onClick: 'func:window.closeModalAndCreateNewModal',
//           onclickProps: {
//             title: 'Create New Variable',
//             pathname: '/decision/variables/create',
//           },
//           style: {
//             display: 'inline-block',
//             lineHeight: 1,
//             fontWeight: 'normal',
//             cursor: 'pointer',
//             border: 'transparent',
//           },
//         },
//       },
//       labelProps: {
//         style: {
//           textAlign: 'right',
//         }
//       },
//       layoutProps: {
//         style: {
//           width: '30%',
//           display: 'inline-block',
//           verticalAlign: 'top',
//         }
//       },
//     },
//     html_content: {
//       name: `rule*2*state_property_attribute_value_comparison`,
//       type: 'code',
//       valueCheckOnBlur: true,
//       onBlur: true,
//       errorIconRight: true,
//       label: 'Email Content',
//       codeMirrorProps: {
//         options: {
//           mode: 'application/x-ejs',
//         },
//       },
//       layoutProps: {
//         style: {
//           width: '70%',
//           display: 'inline-block',
//           verticalAlign: 'top',
//           paddingRight: '7px',
//         }
//       },
//     },
//     formheader: {
//       name: 'formheader',
//       type: 'layout',
//       value: {
//         component: 'div',
//         props: {
//           style: {
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             flexDirection: 'column',
//             margin: '10px 0',
//             position: 'relative',
//           }
//         },
//         children: [
//           {
//             component: 'hr',
//             props: {
//               style: {
//                 border: 'none',
//                 borderBottom: '1px dashed #bbb',
//                 width: '100%',
//               }
//             }
//           },
//           {
//             component: 'span',
//             props: {
//               style: {
//                 padding: '0 20px',
//                 background: 'white',
//                 position: 'absolute',
//                 color: '#bbb',
//                 fontWeight: 900,
//                 fontSize: '13px',
//               }
//             },
//             children: 'RULE PASSES IF'
//           }
//         ]
//       }
//     },
//   };
//   return Object.assign({}, ruleFormElements[ prop ]);
// }

// let { validations, hiddenFields, formgroups, additionalComponents } = formConfigs[ settings.type ].edit;
// let pluralizedType = pluralize(settings.type);
// let url = `/decision/api/standard_${pluralizedType}/:id?format=json`;
// let headerButtons = detailHeaderButtons({ type: settings.type, location: settings.location });
// module.exports = {
//   'containers': {
//     [ `/decision/rules/email/:id` ]: {
//       layout: {
//         component: 'div',
//         children: [
//           {
//             component: 'Container',
//             children: [
//               {
//                 component: 'ResponsiveFormContainer',
//                 asyncprops: {
//                   formdata: [ 'ruledata', 'data' ],
//                   __formOptions: [ 'ruledata', 'formoptions' ],
//                 },
//                 props: {
//                   validations: {
//                   },
//                   formgroups: [
//                     {
//                       gridProps: {
//                         key: randomKey(),
//                         className: '__dynamic_form_elements',
//                         style: {
//                           display: 'flex',
//                           justifyContent: 'center',
//                         },
//                       },
//                       formElements: [
//                         getRuleFormElement({
//                           prop: 'to', index: 0, labels: {
//                             'to': 'To (Phone Number)',
//                           },
//                         }),
//                         getRuleFormElement({
//                           prop: 'first_state_property_attribute_value_comparison_type', index: 0, labels: {},
//                         }),
//                         getRuleFormElement({
//                           prop: 'subject', index: 1, labels: {
//                             'subject': 'Subject',
//                           },
//                         }),
//                         getRuleFormElement({
//                           prop: 'state_property_attribute_value_comparison_type', index: 1, labels: {},
//                         }),
//                         getRuleFormElement({
//                           prop: 'html_content', index: 2, labels: {
//                             'html_content': 'Email Content',
//                           },
//                         }),
//                         getRuleFormElement({
//                           prop: 'state_property_attribute_value_comparison_type', index: 2, labels: {},
//                         }),
//                       ],
//                       order: [
//                         'rule*0*state_property_attribute_value_comparison',
//                         'rule*0*state_property_attribute_value_comparison_type',
//                         'rule*1*state_property_attribute_value_comparison',
//                         'rule*1*state_property_attribute_value_comparison_type',
//                         'rule*2*state_property_attribute_value_comparison',
//                         'rule*2*state_property_attribute_value_comparison_type',
//                       ],
//                     }, {
//                       gridProps: {
//                         key: randomKey(),
//                         className: 'modal-footer-btns',
//                       },
//                       order: [ 'submit' ],
//                       formElements: [ {
//                         type: 'submit',
//                         name: 'submit',
//                         value: 'SAVE CHANGES',
//                         passProps: {
//                           color: 'isPrimary',
//                         },
//                         layoutProps: {
//                           style: {
//                             textAlign: 'center'
//                           }
//                         }
//                       }, ]
//                     }, ],
//                   renderFormElements: {
//                     'rule*0*state_property_attribute_value_comparison': 'func:window.EmailDynamicFilter',
//                     'rule*1*state_property_attribute_value_comparison': 'func:window.EmailDynamicFilter',
//                     'rule*2*state_property_attribute_value_comparison': 'func:window.EmailHTMLFilter',
//                   },
//                   form: {
//                     "cardForm": false,
//                     cardFormTitle: 'Rule Detail',
//                     "cardFormProps": styles.cardFormProps,
//                     flattenFormData: true,
//                     footergroups: false,
//                     useFormOptions: true,
//                     onSubmit: {
//                       url: `/decision/api/standard_rules/:id?format=json&method=editRule&collection=rules`,
//                       params: [
//                         { 'key': ':id', 'val': '_id' },
//                       ],
//                       options: {
//                         headers: {
//                           'Content-Type': 'application/json',
//                         },
//                         method: 'PUT',
//                       },
//                       successProps: {
//                         type: 'success',
//                         text: 'Changes saved successfully!',
//                         timeout: 10000,
//                       },
//                       successCallback: 'func:window.hideModalandCreateNotificationandRefresh',
//                     },
//                     validations: [],
//                     hiddenFields: [ {
//                       form_name: '_id',
//                       form_val: '_id',
//                     }, {
//                       form_name: 'type',
//                       form_static_val: 'email',
//                     }, {
//                       form_name: 'rule_type',
//                       form_static_val: 'AND',
//                     }, {
//                       form_name: 'name',
//                       form_val: 'name',
//                     }, {
//                       form_name: 'rule*0*static_state_property_attribute',
//                       form_static_val: 'to',
//                     }, {
//                       form_name: 'rule*1*static_state_property_attribute',
//                       form_static_val: 'subject',
//                     }, {
//                       form_name: 'rule*2*static_state_property_attribute',
//                       form_static_val: 'html',
//                     }, ],
//                   },
//                 }
//               }
//             ],
//           }],
//       },
//       'resources': {
//         [ `ruledata` ]: `/decision/api/standard_rules/:id?modal=true&format=json`,
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
//       'callbacks': [ 'func:window.dynamicModalHeight' ],
//       'pageData': {
//         'title': settings.title,
//         'navLabel': 'Decision Product',
//       },
//       'onFinish': 'render',
//     },
//   },
// };
