'use strict';

const utilities = require('../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;
const populationTag = require('../../utilities/views/modals/population_tag_form.js');
const runSimulation = require('../../utilities/views/modals/run_simulation_form.js');

module.exports = {
  'containers': {
    //     '/modal/simulation/create_new_test_case': {
    //       layout: {
    //         component: 'Container',
    //         props: {},
    //         children: [{
    //           component: 'ResponsiveForm',
    //           props: {
    //             flattenFormData: true,
    //             footergroups: false,
    //             useFormOptions: true,
    //             onSubmit: {
    //               url: '/simulation/api/test_case?format=json',
    //               options: {
    //                 headers: {
    //                   'Content-Type': 'application/json',
    //                 },
    //                 method: 'POST',
    //               },
    //               successCallback: 'func:window.closeModalAndCreateNotification',
    //               successProps: {
    //                 text: 'Changes saved successfully!',
    //                 timeout: 10000,
    //                 type: 'success',
    //               },
    //               responseCallback: 'func:this.props.reduxRouter.push',
    //             },
    //             validations: [
    //               {
    //                 name: 'displayname',
    //                 constraints: {
    //                   displayname: {
    //                     presence: {
    //                       message: '^Case name is required.',
    //                     },
    //                   },
    //                 },
    //               },
    //             ],
    //             formgroups: [
    //               {
    //                 gridProps: {
    //                   key: randomKey(),
    //                 },
    //                 formElements: [{
    //                   label: 'Case Name',
    //                   name: 'displayname',
    //                   'errorIconRight': true,
    //                   keyUp: 'func:window.nameOnChange',
    //                   layoutProps: {
    //                   },
    //                 },],
    //               }, {
    //                 gridProps: {
    //                   key: randomKey(),
    //                 },
    //                 formElements: [{
    //                   name: 'description',
    //                   placeholder: ' ',
    //                   type: 'textarea',
    //                   customLabel: {
    //                     component: 'span',
    //                     children: [{
    //                       component: 'span',
    //                       children: 'Description',
    //                     }, {
    //                       component: 'span',
    //                       props: {
    //                         style: {
    //                           fontStyle: 'italic',
    //                           color: '#ccc',
    //                           marginLeft: '7px',
    //                           fontWeight: 'normal',
    //                         },
    //                       },
    //                       children: 'Optional',
    //                     },],
    //                   },
    //                 },
    //                 ],
    //               }, {
    //                 gridProps: {
    //                   key: randomKey(),
    //                   className: 'modal-footer-btns',
    //                 },
    //                 formElements: [{
    //                   type: 'submit',
    //                   value: 'CREATE CASE',
    //                   passProps: {
    //                     color: 'isPrimary',
    //                   },
    //                   layoutProps: {
    //                     style: {
    //                       textAlign: 'center',
    //                     },
    //                   },
    //                 },],
    //               },
    //             ],
    //           },
    //           asyncprops: {
    //             formdata: ['testcasedata',],
    //             __formOptions: ['testcasedata', 'formoptions',],
    //           },
    //         },],
    //       },
    //       callbacks: ['func:window.setHeaders', ],
    //       'resources': {
    //         testcasedata: '/simulation/api/test_cases/dropdown',
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
    //       'pageData': {
    //         'title': 'DigiFi | Automated Processing',
    //         'navLabel': 'Automated Processing',
    //       },
    //       'onFinish': 'render',
    //     },
    //     '/modal/simulation/bulk_add_test_cases': {
    //       layout: {
    //         component: 'Container',
    //         props: {},
    //         asyncprops: {
    //           _children: ['modaldata', 'bulkUploadModal', ],
    //         },
    //       },
    //       'resources': {
    //         modaldata: '/simulation/api/generate_bulk_upload_modal',
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
    //       callbacks: [ 'func:window.setHeaders', 'func:window.filterDataSourceFile' ],
    //       'onFinish': 'render',
    //     },
    //     '/modal/simulation/bulk_delete_test_cases': {
    //       layout: {
    //         component: 'Container',
    //         props: {},
    //         asyncprops: {
    //           _children: ['setupdata', 'deleteTestCasesModal', ],
    //         },
    //       },  
    //       'resources': {
    //         setupdata: '/simulation/api/get_setup_data?pagination=deleteTestCasesModal',
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
    //       'onFinish': 'render',
    //     },
    //     '/modal/simulation/edit_test_case/:id': {
    //       layout: {
    //         component: 'Container',
    //         props: {},
    //         children: [{
    //           component: 'ResponsiveForm',
    //           props: {
    //             flattenFormData: true,
    //             footergroups: false,
    //             'onSubmit': {
    //               url: '/simulation/api/test_cases/:id?upload=true',
    //               params: [
    //                 { 'key': ':id', 'val': '_id', },
    //               ],
    //               options: {
    //                 method: 'PUT',
    //               },
    //               successCallback: 'func:window.closeModalAndCreateNotification',
    //               successProps: {
    //                 text: 'Changes saved successfully!',
    //                 timeout: 10000,
    //                 type: 'success',
    //               },
    //               responseCallback: 'func:this.props.refresh',
    //               errorCallback: 'func:this.props.createNotification',
    //             },
    //             formgroups: [
    //               {
    //                 gridProps: {
    //                   key: randomKey(),
    //                 },
    //                 formElements: [{
    //                   label: 'Case Detail File',
    //                   type: 'file',
    //                   name: 'tests',
    //                   thisprops: {},
    //                 },
    //                 ],
    //               }, {
    //                 gridProps: {
    //                   key: randomKey(),
    //                   className: 'modal-footer-btns',
    //                 },
    //                 formElements: [{
    //                   type: 'submit',
    //                   value: 'UPLOAD FILE',
    //                   passProps: {
    //                     color: 'isPrimary',
    //                   },
    //                   layoutProps: {},
    //                 },
    //                 ],
    //               },
    //             ],
    //           },
    //           asyncprops: {
    //             formdata: ['testcasedata', 'testcase',],
    //           },
    //         },
    //         ],
    //       },
    //       'resources': {
    //         testcasedata: '/simulation/api/test_cases/:id?format=json',
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
    //       callbacks: [ 'func:window.setHeaders', 'func:window.filterDataSourceFile' ],
    //       'onFinish': 'render',
    //     },
    //     '/modal/simulation/create_population_tag': {
    //       layout: populationTag,
    //       'resources': {
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
    //       'onFinish': 'render',
    //       callbacks: ['func:window.setHeaders', ],
    //     },
    '/modal/simulation/run_simulation': {
      layout: runSimulation,
      'resources': {
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: ['func:window.setHeaders',],
      'onFinish': 'render',
    },
  },
};