'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const getRadioButtonGroup = utilities.views.decision.shared.components.radioButtonGroup;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/optimization/create_ml_model': {
      layout: {
        privileges: [101, 102,],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveFormContainer',
          props: {
            validations: {
              name: {
                'name': 'name',
                'constraints': {
                  'name': {
                    'presence': {
                      'message': '^Model Name is required.',
                    },
                  },
                },
              },
              ['data_source_binary']: {
                'name': 'data_source_binary',
                'constraints': {
                  ['data_source_binary']: {
                    'presence': {
                      'message': '^Data Source is required.',
                    },
                  },
                },
              },
              ['data_source_categorical']: {
                'name': 'data_source_categorical',
                'constraints': {
                  ['data_source_categorical']: {
                    'presence': {
                      'message': '^Data Source is required.',
                    },
                  },
                },
              },
              ['data_source_regression']: {
                'name': 'data_source_regression',
                'constraints': {
                  ['data_source_regression']: {
                    'presence': {
                      'message': '^Data Source is required.',
                    },
                  },
                },
              },
            },
            formgroups: [
              getRadioButtonGroup([ {
                name: 'type',
                value: 'binary',
                icon: styles.moduleIcons[ 'adjust' ],
                title: 'BINARY MODEL',
                subtext: 'Predicts the probability that an event will occur',
              }, {
                name: 'type',
                value: 'regression',
                icon: styles.moduleIcons[ 'lineChart' ],
                title: 'LINEAR MODEL',
                subtext: 'Predicts the most likely numeric value',
              },
              {
                name: 'type',
                value: 'categorical',
                icon: styles.moduleIcons[ 'pieChart' ],
                title: 'CATEGORICAL MODEL',
                subtext: 'Predicts the most likely categorical value',
              },
              ]),
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  label: 'Data Source',
                  name: 'data_source_binary',
                  type: 'dropdown',
                  validateOnChange: true,
                  'errorIconRight': true,
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
                  },
                  layoutProps: {
                    style: {
                      textAlign: 'center',
                      padding: 0,
                    },
                  },
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  label: 'Model Name',
                  name: 'name',
                  keyUp: 'func:window.nameOnChange',
                  onBlur: true,
                  validateOnBlur: true,
                  errorIconRight: true,
                  passProps: {},
                  layoutProps: {
                    style: {
                      textAlign: 'center',
                      padding: 0,
                    },
                  },
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  customLabel: {
                    component: 'span',
                    children: [ {
                      component: 'span',
                      children: 'Description',
                    }, {
                      component: 'span',
                      props: {
                        style: {
                          fontStyle: 'italic',
                          color: '#ccc',
                          marginLeft: '7px',
                          fontWeight: 'normal',
                        },
                      },
                      children: 'Optional',
                    }, ],
                  },
                  name: 'description',
                  layoutProps: {
                    style: {
                      textAlign: 'center',
                      padding: 0,
                    },
                  },
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [ {
                  type: 'submit',
                  value: 'TRAIN MODEL',
                  passProps: {
                    color: 'isPrimary',
                  },
                  layoutProps: {},
                },
                ],
              },
            ],
            form: {
              flattenFormData: true,
              footergroups: false,
              useFormOptions: true,
              'onSubmit': {
                url: '/optimization/api/ml_model?format=json&type=createMLModel',
                options: {
                  method: 'POST',
                },
                successCallback: 'func:window.closeModalAndCreateNotification',
                successProps: {
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                  type: 'success',
                },
                responseCallback: 'func:this.props.refresh',
                validations: [],
                hiddenFields: [],
              },
            },
            renderFormElements: {
              ['data_source_categorical']: 'func:window.filterDataSourceDropdown',
              ['data_source_binary']: 'func:window.filterDataSourceDropdown',
              ['data_source_regression']: 'func:window.filterDataSourceDropdown',
            },
          },
          asyncprops: {
            formdata: [ 'mlmodeldata', 'data', ],
            __formOptions: [ 'mlmodeldata', 'formoptions', ],
          },
        },
        ],
      },
      'resources': {
        mlmodeldata: '/optimization/api/get_ml_create_data',
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
      callbacks: [ 'func:window.setHeaders', ],
      'onFinish': 'render',
    },
  },
};