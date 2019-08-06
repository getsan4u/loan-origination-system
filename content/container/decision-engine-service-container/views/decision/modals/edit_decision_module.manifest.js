'use strict';

const moment = require('moment');
const utilities = require('../../../utilities');
const randomKey = Math.random;
const pluralize = require('pluralize');
const styles = utilities.views.constants.styles;
const util = require('util');

module.exports = {
  'containers': {
    [ '/decision/strategy/:id/modules/:name' ]: {
      layout: {
        privileges: [101, 102, 103],
        component: 'Hero',
        children: [ {
          component: 'ResponsiveForm',
          thisprops: {
            formdata: [ 'dynamic', 'decision_module_data', 'data' ],
            // __formOptions: [ 'dynamic', 'init_rule_data', 'formoptions' ],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            useFormOptions: true,
            onSubmit: {
              url: `/decision/api/standard_strategies/:id/:name?format=json&method=editModule`,
              params: [
                { 'key': ':id', 'val': 'strategy_id', },
                { 'key': ':name', 'val': 'name'},
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
            hiddenFields: [ {
              form_name: 'type',
              form_val: 'type'
            }, {
              form_name: 'lookup_name',
              form_val: 'lookup_name'
            }],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
                className: '__dynamic_form_elements',
              },
              formElements: [ {
                name: 'display_module_type',
                label: 'Process Module Type',
                passProps: {
                  state: 'isDisabled',
                }
              }, {
                name: 'display_name',
                label: 'Process Module Name',
                keyUp: 'func:window.nameOnChange',
                validateOnBlur: true,
                onBlur: true,
                errorIconRight: true,
                errorIcon: 'fa fa-exclamation',
                validIcon: 'fa fa-check',
                passProps: {
                  className: 'module_name_placeholder'
                },
              }, {
                name: 'description',
                  customLabel: {
                    component: 'span',
                    children: [{
                      component: 'span',
                      children: 'Description ',
                    }, {
                      component: 'span',
                      children: 'Optional',
                      props: {
                        style: {
                          fontStyle: 'italic',
                          marginLeft: '2px',
                          fontWeight: 'normal',
                          color: styles.colors.regGreyText,
                        }
                      }
                    }]
                  },
                passProps: {
                },
              }, {
                name: 'active',
                type: 'switch',
                label: 'Enabled',
              }, ]
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'SAVE CHANGES',
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
        }, ],
      },
      'resources': {
        'pagedata': '/decision/api/standard_strategies/:id/:name?format=json',
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