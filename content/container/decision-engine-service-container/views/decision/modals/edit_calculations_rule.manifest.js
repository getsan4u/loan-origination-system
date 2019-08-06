'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const buildCodeTabs = utilities.controllers.helper.buildCodeTabs;
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    [ `/decision/rules/calculations/:id` ]: {
      layout: {
        privileges: [101, 102, 103],
        component: 'Hero',
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ `ruledata`, 'data' ],
            __formOptions: [ `ruledata`, 'formoptions' ],
          },
          hasWindowFunc: true,
          props: {
            footergroups: false,
            useFormOptions: false,
            useDynamicData: true,
            ref: 'func:window.addRef',
            hiddenFields: [ {
              form_name: 'type',
              form_static_val: 'calculations',
            }, {
              form_name: '_id',
              form_val: '_id',
            }, {
              form_name: 'rule*0*condition_test',
              form_static_val: 'EQUAL',
            }, {
              form_name: 'rule_type',
              form_static_val: 'simple',
            }, {
              form_name: 'rule*0*state_property_attribute',
              form_val: 'rule*0*state_property_attribute',
            }, {
              form_name: 'rule*0*state_property_attribute_value_comparison_type',
              form_val: 'rule*0*state_property_attribute_value_comparison_type',
            }, {
              form_name: 'rule*0*state_property_attribute_value_comparison',
              form_val: 'rule*0*state_property_attribute_value_comparison',
            }, {
              form_name: 'required_calculation_variables',
              form_val: 'required_calculation_variables',
            }, ],
            onSubmit: {
              url: `/decision/api/standard_rules/:id?format=json&method=editRule&collection=rules`,
              params: [
                { 'key': ':id', 'val': '_id', },
              ],
              options: {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'PUT',
              },
              successProps: [ 'last', {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              },
              ],
              successCallback: [ 'func:this.props.hideModal', 'func:this.props.createNotification', ],
              responseCallback: 'func:this.props.refresh',
            },
            formgroups: [ {
              gridProps: {
                key: randomKey(),
                className: '__dynamic_form_elements',
              },
              formElements: [ {
                name: `rule*0*state_property_attribute`,
                value: '',
                errorIconRight: true,
                errorIcon: 'fa fa-exclamation',
                label: 'Output Variable',
                validateOnChange: true,
                type: 'remote_dropdown',
                passProps: {
                  emptyQuery: true,
                  search: true,
                  multiple: false,
                  debounce: 250,
                  searchProps: {
                    baseUrl: '/decision/api/variable_dropdown?type=Output',
                    limit: 100,
                    sort: 'display_title',
                    response_field: 'variable_dropdown',
                  },
                },
                layoutProps: {
                  style: {
                    width: '70%',
                    paddingRight: '7px',
                  }
                },
              }, {
                type: 'layout',
                bindprops: true,
                passProps: {
                  className: '__re-bulma_column',
                },
                layoutProps: {
                  style: {
                    width: '30%',
                  }
                },
                value: {
                  component: 'div',
                  bindprops: true,
                  props: {
                    className: '__re-bulma_control __form_element_has_value',
                  },
                  children: [ {
                    component: 'label',
                    props: {
                      className: '__re-bulma_label',
                      style: {
                        textAlign: 'right',
                      }
                    },
                    children: [ {
                      component: 'ResponsiveButton',
                      children: 'Create New Variable',
                      props: {
                        onClick: 'func:window.closeModalAndCreateNewModal',
                        onclickProps: {
                          title: 'Create New Variable',
                          pathname: '/decision/variables/create',
                        },
                        style: {
                          display: 'inline-block',
                          lineHeight: 1,
                          fontWeight: 'normal',
                          cursor: 'pointer',
                          border: 'transparent',
                        },
                      },
                    }, ]
                  },
                  {
                    component: 'Input',
                    thisprops: {
                      value: [ 'formdata', 'rule*0*variable_type' ],
                    },
                    props: {
                      readOnly: true,
                    }
                  }, ]
                }
              }, {
                name: 'required_calculation_variables',
                // value: '',
                errorIconRight: true,
                label: 'Required Variables',
                validateOnChange: true,
                errorIcon: 'fa fa-exclamation',
                validIcon: 'fa fa-check',
                // disableOnChange: true,
                customOnChange: 'func:window.calculationRequiredVariablesDropdownOnChange',
                type: 'dropdown',
                passProps: {
                  selection: true,
                  fluid: true,
                  search: true,
                  multiple: true,
                },
                layoutProps: {
                  style: {
                    width: '100%',
                    // paddingRight: '7px',
                  },
                },
                // options: all_variables,
              }, {
                type: 'layout',
                value: {
                  component: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      margin: '10px 0px',
                      position: 'relative',
                    },
                  },
                  children: [{
                    component: 'hr',
                    props: {
                      style: {
                        borderTop: 'none',
                        borderRight: 'none',
                        borderBottom: '1px dashed rgb(187, 187, 187)',
                        borderLeft: 'none',
                        borderImage: 'initial',
                        width: '100%',
                      },
                    },
                  }, {
                    component: 'span',
                    children: 'EQUALS',
                    props: {
                      style: {
                        padding: '0px 20px',
                        background: 'white',
                        position: 'absolute',
                        color: 'rgb(187, 187, 187)',
                        fontWeight: '900',
                        fontSize: '13px',
                      },
                    },
                  }, ],
                },
              }, ]
            }, ],
          },
        }, {
          component: 'ResponsiveTabs',
          asyncprops: {
            formdata: [ 'ruledata', 'data' ],
          },
          props: {
            tabsProps: {
              tabStyle: 'isBoxed',
            },
            isButton: false,
            tabs: [ {
              edit: true,
              label: 'JavaScript',
              mode: 'javascript',
              thisprops: {
                formdata: [ 'formdata' ]
              },
            },
              //   {
              //     label: 'Python', mode: 'python', thisprops: {
              //   formdata: ['formdata']
              // },}, { label: 'R', mode: 'r', thisprops: {
              //   formdata: ['formdata']
              // }, }, { label: 'SAS', mode: 'sas', thisprops: {
              //   formdata: ['formdata']
              //   },
              //   },
            ].map(buildCodeTabs),
          },
        }, ],
      },
      'resources': {
        [ `ruledata` ]: `/decision/api/standard_rules/:id?modal=true&format=json`,
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      'callbacks': [ 'func:window.dynamicModalHeight' ],
      'pageData': {
        'title': 'DigiFi | Decision Engine',
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};