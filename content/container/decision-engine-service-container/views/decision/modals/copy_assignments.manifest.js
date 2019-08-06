'use strict';

const moment = require('moment');
const utilities = require('../../../utilities');
const randomKey = Math.random; 
const pluralize = require('pluralize');
const styles = utilities.views.constants.styles;
const util = require('util');

module.exports = {
  'containers': {
      [`/decision/strategies/:id/assignments/copy`]: {
        layout: {
          privileges: [101, 102, 103],
          component: 'Hero',
          children: [{
            component: 'ResponsiveForm',
            props: {
              flattenFormData: true,
              footergroups: false,
              useFormOptions: true,
              onSubmit: {
                url: `/decision/api/standard_strategies/:id?format=json&method=copy&entity=segment`,
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
              validations: [
                {
                  name: 'copysegment',
                  constraints: {
                    copysegment: {
                      presence: {
                        message: '^Segment is required.',
                      },
                    },
                  },
                }, 
              ],
              // hiddenFields,
              formgroups: [ {
                gridProps: {
                  key: randomKey(),
                  className: '__dynamic_form_elements',
                },
                formElements: [ {
                  name: 'copysegment',
                  label: 'Copy From (Strategy & Segment Name)',
                  type: 'dropdown',
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
                  },
                }, {
                  type: 'layout', 
                  value: {
                    component: 'span',
                    children: 'Warning: This will replace all current outputs and cannot be reversed.',
                  },
                } ]
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [ {
                  type: 'submit',
                  value: 'COPY OUTPUTS',
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
              __formOptions: [`strategydata`, 'data', 'formoptions'],
            },
          },],
        },
        'resources':  {
          [ `strategydata` ]: `/decision/api/standard_strategies/:id/assignments/copySegment?format=json`,
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
          // 'title': `${options.title}`,
          'navLabel': 'Decision Engine',
        },
        'onFinish': 'render',
      },
    },
};