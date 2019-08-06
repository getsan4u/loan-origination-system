'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const randomKey = Math.random;
const formElement = require('../shared/form_creator/run_simulation');

function runSimulationForm() {
  return {
    component: 'Container',
    props: {},
    children: [ {
      component: 'ResponsiveForm',
      props: {
        flattenFormData: true,
        footergroups: false,
        useFormOptions: true,
        onSubmit: {
          url: '/simulation/api/batch/run?pagination=simulations&upload=true',
          options: {
            headers: {
              // 'Content-Type': 'application/json',
            },
            method: 'POST',
          },
          successCallback: [ 'func:this.props.refresh', 'func:this.props.createNotification', ],
          successProps: [ null, {
            type: 'success',
            text: 'Changes saved successfully!',
            timeout: 10000,
          },
          ],
        },
        formgroups: [
          {
            gridProps: {
              key: randomKey(),
            },
            formElements: [ {
              type: 'layout',
              value: {
                component: 'p',
                props: {
                  style: {
                    textAlign: 'left',
                  },
                },
                children: 'Please confirm that you would like to run this batch process. Note that each case provided in the upload file counts as an individually executed process.',
              },
            }, ],
          },
          // {
          //   gridProps: {
          //     key: randomKey(),
          //   },
          //   formElements: [ {
          //     type: 'layout',
          //     value: {
          //       component: 'div',
          //       thisprops: {
          //         _children: [ 'dynamic', 'txtswitch' ]
          //       },
          //     }
          //   }, ],
          // },
          {
            'gridProps': {
              className: 'modal-footer-btns',
              isMultiline: false,
              responsive: 'isMobile',
              key: randomKey(),
            },
            formElements: [ {
              type: 'layout',
              value: {
                component: 'ResponsiveButton',
                props: {
                  onClick: 'func:window.submitRefForm',
                  buttonProps: {
                    color: 'isSuccess',
                  },
                },
                children: 'RUN BATCH PROCESS',
              },
            }, {
              type: 'layout',
              value: {
                component: 'ResponsiveButton',
                children: 'Cancel',
                thisprops: {},
                props: {
                  onClick: 'func:window.hideModal',
                  aProps: {
                    className: '__re-bulma_button __re-bulma_is-primary',
                  },
                },
              },
            }, ],
          },
        ],
      },
      asyncprops: {
      },
    }, ],
  };
}
module.exports = runSimulationForm();