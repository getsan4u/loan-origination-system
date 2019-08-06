'use strict';

const moment = require('moment');
const utilities = require('../../../utilities');
const randomKey = Math.random;
const pluralize = require('pluralize');
const styles = utilities.views.constants.styles;
const getRadioButtonGroup = utilities.views.decision.shared.components.radioButtonGroup;

module.exports = {
  'containers': {
    [ `/decision/strategies/:id/:type/create/init` ]: {
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
              url: `/decision/api/standard_strategies/:id/:name/:segment_index/createRule?init=true`,
              params: [
                { 'key': ':id', 'val': 'pathname.3', },
                { 'key': ':name', 'val': 'pathname.4', },
                { 'key': ':segment_index', 'val': 'pathname.5', },
              ],
              options: {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'POST',
                setDynamicData: true,
              },
              successCallback: 'func:window.closeModalAndCreateRuleForm',
              // successProps: 'last',
              // responseCallback: 'func:this.props.refresh',
            },
            // validations,
            // hiddenFields,
            hiddenFields: [ {
              form_name: 'id',
              form_val: 'id',
            }, {
              form_name: 'type',
              form_val: 'type',
            }, {
              form_name: 'module_name',
              form_val: 'lookup_name',
            }, {
              form_name: 'segment_index',
              form_val: 'pathname.5',
            }],
            formgroups: [{
                gridProps: {
                  key: randomKey(),
                  style: {
                    margin: 0,
                  }
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'label',
                    props: {
                      className: '__re-bulma_label'
                    },
                    children: 'Rule Type'
                  }
                }]
              },
              getRadioButtonGroup([{
                name: 'rule_type',
                value: 'simple',
                customIcon: [{
                  component: 'span',
                  props: {
                    className: 'radio-icon',
                    style: {
                      width: '50px',
                      height: '25px',
                      marginTop: 0,
                      backgroundImage: 'url(/images/elements/half-grid.svg)',
                    }
                  }
                }],
                title: 'Simple Rule',
                subtext: 'A rule with a single comparative condition',
              }, {
                name: 'rule_type',
                value: 'AND',
                  customIcon: [{
                    component: 'span',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                      }
                    },
                    children: [{
                      component: 'span',
                      props: {
                        className: 'radio-icon',
                        style: {
                          width: '50px',
                          height: '25px',
                          marginTop: 0,
                          backgroundImage: 'url(/images/elements/half-grid.svg)',
                        }
                      }
                    }, {
                        component: 'span',
                        children: 'and',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            margin: '0px 3px'
                          }
                        }
                    }, {
                        component: 'span',
                        props: {
                          className: 'radio-icon',
                          style: {
                            width: '50px',
                            height: '25px',
                            margin: 0,
                            backgroundImage: 'url(/images/elements/half-grid.svg)',
                          }
                        }
                      } 
                    ]
                  }],
                title: 'Complex Rule: AND',
                subtext: 'A rule with multiple comparative conditions that all must pass',
              }, {
                name: 'rule_type',
                value: 'OR',
                  customIcon: [{
                    component: 'span',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                      }
                    },
                    children: [{
                      component: 'span',
                      props: {
                        className: 'radio-icon',
                        style: {
                          width: '50px',
                          height: '25px',
                          marginTop: 0,
                          backgroundImage: 'url(/images/elements/half-grid.svg)',
                        }
                      }
                    }, {
                        component: 'span',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            margin: '0px 3px'
                          }
                        },  
                      children: 'or',
                    }, {
                      component: 'span',
                      props: {
                        className: 'radio-icon',
                        style: {
                          width: '50px',
                          height: '25px',
                          margin: 0,
                          backgroundImage: 'url(/images/elements/half-grid.svg)',
                        }
                      }
                    }
                    ]
                  }],
                title: 'COMPLEX RULE: OR',
                subtext: 'A rule with multiple comparative conditions, of which only one must pass',
              }]),
              {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns'
                },
                formElements: [ {
                  type: 'submit',
                  value: 'CONTINUE',
                  passProps: {
                    color: 'isPrimary'
                  },
                  layoutProps: {
                    style: {
                      alignSelf: 'flex-end',
                      textAlign: 'center',
                      padding: 0,
                    },
                  },
                }, ]
              }, ]
          },
          asyncprops: {
            formdata: [ `pagedata`, 'data' ],
            __formOptions: [ `pagedata`, 'formoptions' ],
          },
        }, ],
      },
      'resources': {
        [ `pagedata` ]: `/decision/api/standard_strategies/:id/:type/createRule?init=true`,
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