'use strict';
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/modal/required_integration_variables/:id': {
      layout: {
        component: 'div',
        props: {
        },
        asyncprops: {
          _children: ['modeldata', 'requiredVariablesModal',],
        },
      },
      'resources': {
        modeldata: '/decision/api/standard_strategies/required_model_variables/:id?format=json&type=dataintegration&variable_type=input',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.setHeaders', 'func:window.dynamicModalHeight'],
      'onFinish': 'render',
    },
    '/modal/received_integration_variables/:id': {
      layout: {
        component: 'div',
        props: {
        },
        asyncprops: {
          _children: ['modeldata', 'receivedVariablesModal',],
        },
      },
      'resources': {
        modeldata: '/decision/api/standard_strategies/required_model_variables/:id?format=json&type=dataintegration&variable_type=output',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.setHeaders', 'func:window.dynamicModalHeight'],
      'onFinish': 'render',
    },
    '/modal/upload_security_certificate/:id': {
      layout: {
        component: 'Container',
        props: {},
        children: [{
          component: 'ResponsiveForm',
          props: {
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/integrations/upload_security_cert/:id',
              options: {
                method: 'POST',
              },
              params: [{ 'key':':id', 'val':'_id', },],
              successCallback: ['func:this.props.hideModal', 'func:this.props.createNotification',],
              successProps: ['last', {
                text: 'Security Certificate Uploaded Successfully!',
                timeout: 10000,
                type: 'success',
              },
              ],  
              responseCallback: 'func:this.props.refresh',
            },
            formgroups: [
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  label: 'Security Certificate File',
                  type: 'file',
                  name: 'security_certificate',
                  thisprops: {},
                },
                ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  'type': 'layout',
                  value: {
                    component: 'div',
                    children: [{
                      component: 'span',
                      props: {
                        style: {
                          textDecoration: 'underline',
                        },
                      },
                      children: 'WARNING: ',
                    }, {
                      component: 'span',
                      children: 'Changing the security certificate may affect system performance. Note that a new security certificate will only affect the real-time API once you have reactivated your Strategy within Automation Management.',
                    },
                    ],
                  }, 
                },
                ],
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [{
                  type: 'submit',
                  value: 'UPLOAD FILE',
                  passProps: {
                    color: 'isPrimary',
                  },
                  layoutProps: {},
                },
                ],
              },
            ],
          },
          asyncprops: {
            formdata: ['integrationdata', 'dataintegration', ],
          },
        },
        ],
      },
      'resources': {
        integrationdata: '/integrations/get_dataintegrations/:id',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'onFinish': 'render',
    },
  },
};