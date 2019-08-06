'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
    'containers': {
      [`/decision/strategies/:id/:type/add_calculations_rule`]: {
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
                url: `/decision/api/standard_strategies/:id/:name/:segment_index?format=json&method=addRule`,
                params: [
                  { 'key': ':id', 'val': '_id', },
                  { 'key': ':name', 'val': 'pathname.4', },
                  { 'key': ':segment_index', 'val': 'pathname.5', },
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
                responseCallback: 'func:this.props.refresh',
              },
              hiddenFields: [{
                form_name: 'type',
                form_val: 'type',
              },],
              formgroups: [{
                gridProps: {
                  key: randomKey(),
                  className: '__dynamic_form_elements',
                },
                formElements: [ {
                  name: 'rule',
                  label: 'Rule Name',
                  type: 'dropdown',
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
                  },
                  layoutProps: {
                  },
                },
                ]
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [ {
                  type: 'submit',
                  value: 'Save',
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
              formdata: [ `strategydata`, 'data' ],
              __formOptions: [`strategydata`, 'formoptions'],
            },
          },],
        },
        'resources':  {
          [ `strategydata` ]: `/decision/api/standard_strategies/:id/:type?calculations=true&modal=true&format=json`,
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
        'callbacks': ['func:window.dynamicModalHeight'],
        'pageData': {
          'title': 'DigiFi | Decision Engine',
          'navLabel': 'Decision Engine',
        },
        'onFinish': 'render',
      },
    },
  };