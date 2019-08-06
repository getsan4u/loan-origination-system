'use strict';

const styles = require('../../constants').styles;
const cardprops = require('../../shared/props/cardprops');
const formElements = require('../../shared/props/formElements').formElements;
const randomKey = Math.random;

function generatePage(options) {
  let { _id, page, input, input_variable_dropdown, submit_url, } = options;
  let hiddenFields = [ {
    form_name: 'input.page',
    form_static_val: page,
  } ];
  hiddenFields = hiddenFields.concat([ {
    form_name: 'input.w',
    form_static_val: input.w,
  }, {
    form_name: 'input.h',
    form_static_val: input.h,
  }, {
    form_name: 'input.x',
    form_static_val: input.x,
  }, {
    form_name: 'input.y',
    form_static_val: input.y,
  } ]);
  hiddenFields.push({
    form_name: 'input.display_location',
    form_static_val: input.display_location,
  });
  return {
    component: 'Container',
    props: {
      className: 'simulation',
    },
    children: [ {
      component: 'ResponsiveForm',
      props: {
        'onSubmit': {
          url: submit_url,
          'options': {
            'method': 'PUT',
          },
          successProps: {
            type: 'success',
            text: 'Changes saved successfully!',
            timeout: 10000,
          },
          successCallback: 'func:window.closeModalAndCreateNotification',
          responseCallback: 'func:this.props.refresh',
        },
        blockPageUI: true,
        useFormOptions: true,
        flattenFormData: true,
        footergroups: false,
        hiddenFields,
        formgroups: [ {
          'gridProps': {
            'key': randomKey(),
          },
          'formElements': [ {
            label: 'Page Number',
            value: page + 1,
            passProps: {
              state: 'isDisabled',
            }
          }, ]
        }, {
          'gridProps': {
            'key': randomKey(),
          },
          'formElements': [ {
            label: 'Location on Page',
            value: input.display_location,
            passProps: {
              state: 'isDisabled',
            }
          }, ]
        }, {
          'gridProps': {
            'key': randomKey(),
          },
          'formElements': [ {
            name: 'input.input_variable',
            label: 'Output Variable Assigned',
            type: 'dropdown',
            value: input.input_variable || '',
            passProps: {
              selection: true,
              fluid: true,
              search: true,
            },
            layoutProps: {
            },
            options: input_variable_dropdown || [],
          }, ]
        }, {
          'gridProps': {
            'key': randomKey(),
            'className': 'modal-footer-btns',
          },
          'formElements': [ {
            type: 'submit',
            value: 'SAVE',
          } ]
        }, ],
      },
    }, ],
  };
}

module.exports = generatePage;