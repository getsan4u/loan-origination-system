'use strict';

const moment = require('moment');
const utilities = require('../../../utilities');
const randomKey = Math.random;
const pluralize = require('pluralize');
const styles = utilities.views.constants.styles;
const util = require('util');

module.exports = {
  'containers': {
    [ `/decision/strategies/:id/add_existing_decision_module` ]: {
      layout: {
        privileges: [101, 102, 103],
        component: 'Hero',
        children: [ {
          component: 'ResponsiveForm',
          props: {
            flattenFormData: true,
            footergroups: false,
            useFormOptions: true,
            onSubmit: {
              url: `/decision/api/standard_strategies/:id?format=json&method=copyModule`,
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
              responseCallback: 'func:this.props.refresh',
            },
            // validations,
            // hiddenFields,
            formgroups: [ {
              gridProps: {
                key: randomKey(),
                className: '__dynamic_form_elements test',
              },
              formElements: [ {
                name: 'copymodule',
                label: 'Copy From (Strategy & Module Name)',
                type: 'dropdown',
                // customOnChange: 'func:window.moduleTypeOnChange',
                passProps: {
                  selection: true,
                  fluid: true,
                  search: true,
                  className: 'module_type_dropdown',
                },
              }, ]
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [{
                type: 'submit',
                value: 'ADD MODULE',
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
            },]
          },
          asyncprops: {
            formdata: [ 'strategydata', 'data' ],
            __formOptions: [ 'strategydata', 'data', 'formoptions' ],
          },
        }, ],
      },
      'resources': {
        [ 'strategydata' ]: `/decision/api/standard_strategies/:id/copyModule?format=json`,
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
      },
      'onFinish': 'render',
    },
  },
};