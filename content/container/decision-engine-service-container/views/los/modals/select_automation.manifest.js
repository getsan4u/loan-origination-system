'use strict';
const moment = require('moment');
const utilities = require('../../../utilities');
const randomKey = Math.random;
const pluralize = require('pluralize');
const styles = utilities.views.constants.styles;
const getRadioButtonGroup = utilities.views.decision.shared.components.radioButtonGroup;
const periodic = require('periodicjs');

const radioButtonGroup = [
  {
    name: 'type',
    value: 'decision',
    icon: styles.moduleIcons[ 'decision' ],
    title: 'Decision Engine',
    subtext: 'Run underwriting or gather data',
  }, {
    name: 'type',
    value: 'ml',
    icon: styles.moduleIcons[ 'machineLearning' ],
    title: 'MACHINE LEARNING',
    subtext: 'Run a predictive credit risk model',
  }, {
    name: 'type',
    value: 'wizard',
    icon: styles.moduleIcons[ 'artificialintelligence' ],
    title: 'UNDERWRITING WIZARD',
    subtext: 'Test pricing and ROE scenarios',
  },
];

module.exports = {
  'containers': {
    [ '/los/applications/:id/select_automation' ]: {
      layout: {
        privileges: [ 101, 102, 103, ],
        component: 'div',
        children: [
          {
            component: 'Container',
            children: [
              {
                component: 'ResponsiveFormContainer',
                asyncprops: {
                  __formOptions: [ 'moduledata', 'formoptions', ],
                  formdata: [ 'moduledata', 'data', ],
                },
                props: {
                  validations: {
                    type: {
                      'name': 'type',
                      'constraints': {
                        'type': {
                          'presence': {
                            'message': '^Automation Type is required.',
                          },
                        },
                      },
                    },
                    strategy: {
                      name: 'strategy',
                      constraints: {
                        strategy: {
                          presence: {
                            message: '^Strategy Name is required.',
                          },
                        },
                      },
                    },
                    mlmodel: {
                      name: 'mlmodel',
                      constraints: {
                        mlmodel: {
                          presence: {
                            message: '^Model Name is required.',
                          },
                        },
                      },
                    },
                    scenario: {
                      name: 'scenario',
                      constraints: {
                        scenario: {
                          presence: {
                            message: '^Scenario Name is required.',
                          },
                        },
                      },
                    },
                  },
                  formgroups: [
                    getRadioButtonGroup(radioButtonGroup),
                    {
                      gridProps: {
                        key: randomKey(),
                        className: '__dynamic_form_elements test',
                      },
                      order: [
                        'strategy',
                        'mlmodel',
                        'scenario',
                      ],
                      formElements: [ {
                        name: 'strategy',
                        label: 'Strategy Name',
                        value: '',
                        type: 'dropdown',
                        errorIconRight: true,
                        validateOnChange: true,
                        errorIcon: 'fa fa-exclamation',
                        validIcon: 'fa fa-check',
                        options: [],
                        passProps: {
                          selection: true,
                          fluid: true,
                          search: true,
                          selectOnBlur: false,
                        },
                        layoutProps: {
                        },
                      }, {
                        name: 'mlmodel',
                        label: 'Model Name',
                        value: '',
                        type: 'dropdown',
                        errorIconRight: true,
                        validateOnChange: true,
                        errorIcon: 'fa fa-exclamation',
                        validIcon: 'fa fa-check',
                        options: [],
                        passProps: {
                          selection: true,
                          fluid: true,
                          search: true,
                          selectOnBlur: false,
                        },
                        layoutProps: {
                        },
                      }, {
                        name: 'scenario',
                        label: 'Scenario Name',
                        validateOnBlur: true,
                        onBlur: true,
                        errorIconRight: true,
                        errorIcon: 'fa fa-exclamation',
                        validIcon: 'fa fa-check',
                      }, ],
                    }, {
                      gridProps: {
                        key: randomKey(),
                        className: 'modal-footer-btns',
                      },
                      formElements: [ {
                        name: 'submit',
                        type: 'submit',
                        value: 'CONTINUE',
                        passProps: {
                          color: 'isPrimary',
                        },
                        layoutProps: {
                          style: {
                            textAlign: 'center',
                            padding: 0,
                          },
                        },
                      }, ],
                    }, ],
                  renderFormElements: {
                    strategy: 'func:window.filterAutomationModuleName',
                    mlmodel: 'func:window.filterAutomationModuleName',
                    scenario: 'func:window.filterAutomationModuleName',
                    type: 'func:window.testAutomationType',
                  },
                  form: {
                    useFormOptions: true,
                    flattenFormData: true,
                    footergroups: false,
                    setInitialValues: false,
                    onSubmit: {
                      url: '/los/api/applications/:id/select_automation?format=json',
                      params: [
                        { 'key': ':id', 'val': '_id', },
                      ],
                      options: {
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        method: 'POST',
                      },
                      successCallback: 'func:this.props.createNotification',
                      successProps: {
                        text: 'Changes saved successfully!',
                        timeout: 10000,
                        type: 'success',
                      },
                      responseCallback: 'func:window.closeModalAndCreateNewModal',
                    },
                    validations: [],
                    hiddenFields: [],
                  },
                },
              },
            ],
          }, ],
      },
      'resources': {
        [ 'moduledata' ]: '/los/api/moduledata',
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
      'callbacks': [ 'func:window.dynamicModalHeight', ],
      'pageData': {
        // 'title': `${options.title}`,
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};
