'use strict';

const moment = require('moment');
const utilities = require('../../../utilities');
const randomKey = Math.random; 
const pluralize = require('pluralize');
const styles = utilities.views.constants.styles;

module.exports = {
  'containers': {
      [`/decision/strategies/:id/add_segment`]: {
        layout: {
          privileges: [101, 102],
          component: 'Hero',
          children: [{
            component: 'ResponsiveForm',
            props: {
              flattenFormData: true,
              footergroups: false,
              useFormOptions: true,
              onSubmit: {
                url: `/decision/api/standard_strategies/:id?format=json&method=addSegment`,
                params: [
                  { 'key': ':id', 'val': '_id', },
                ],
                options: {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  method: 'PUT',
                },
                successProps: ['last', {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                },
                ],  
                successCallback: ['func:this.props.hideModal', 'func:this.props.createNotification', ],
                responseCallback: 'func:this.props.reduxRouter.push',
              },
              hiddenFields: [{
                'form_val': 'module_name',
                'form_name': 'module_name',
              }, {
                'form_val': 'redirect_index',
                'form_name': 'redirect_index',
              },],
              formgroups: [ {
                gridProps: {
                  key: randomKey(),
                  className: '__dynamic_form_elements',
                },
                formElements: [ {
                  name: 'display_module_name',
                  label: 'Process Module',
                  passProps: {
                    state: 'isDisabled',
                  },
                  // type: 'dropdown',
                  // passProps: {
                  //   selection: true,
                  //   fluid: true,
                  //   search: false,
                  // },
                }, {
                  name: 'name',
                  keyUp: 'func:window.nameOnChange',
                  label: 'Name',
                  passProps: {
                  },
                }, {
                  name: 'description',
                  label: 'Description',
                  passProps: {
                  },
                }, ]
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [ {
                  type: 'submit',
                  value: 'ADD SEGMENT',
                  passProps: {
                    color: 'isPrimary'
                  },
                  layoutProps: {
                    style: {
                      textAlign: 'center',
                      padding: 0,
                    },
                  },
                }, ]
              }, ]
            },
            asyncprops: {
              formdata: [ `pagedata`, 'data' ],
              __formOptions: [`pagedata`, 'formoptions'],
            },
          },],
        },
        'resources':  {
          [ `pagedata` ]: `/decision/api/standard_strategies/:id/addSegment?format=json`,
          checkdata: {
            url: '/auth/run_checks',
            options: {
              onSuccess: [ 'func:window.redirect', ],
              onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
              blocking: true, 
              renderOnError: false,
            },
          },
        },
        'pageData': {
          // 'title': `${options.title}`,
          'navLabel': 'Decision Engine',
        },
        'onFinish': 'render',
      },
    },
};