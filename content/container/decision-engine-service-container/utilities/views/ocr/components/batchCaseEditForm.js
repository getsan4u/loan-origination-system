'use strict';

const ocrTabs = require('./ocrTabs');
const plainHeaderTitle = require('../../shared/component/layoutComponents').plainHeaderTitle;
const formGlobalButtonBar = require('../../shared/component/globalButtonBar').formGlobalButtonBar;
const styles = require('../../constants').styles;
const cardprops = require('../../shared/props/cardprops');
const formElements = require('../../shared/props/formElements').formElements;
const randomKey = Math.random;

function generateInputs(field) {
  return {
    gridProps: {
      key: randomKey(),
    },
    formElements: [ {
      label: field.key,
      name: field.key,
      value: field.value,
      layoutProps: {
        style: {
          textAlign: 'center',
          padding: 0,
        },
      },
    }, ],
  };
}


function generateForm(options) {
  let { id, casedoc, extracted_fields, } = options;
  extracted_fields = extracted_fields.map(generateInputs);
  return {
    component: 'ResponsiveForm',
    props: {
      flattenFormData: true,
      footergroups: false,
      'onSubmit': {
        url: `/ocr/api/processing/batch/${id}/cases/${casedoc._id}`,
        options: {
          method: 'PUT',
        },
        successCallback: 'func:window.closeModalAndCreateNotification',
        successProps: {
          text: 'Changes saved successfully!',
          timeout: 10000,
          type: 'success',
        },
        responseCallback: 'func:this.props.refresh',
      },
      formgroups: [ {
        gridProps: {
          key: randomKey(),
        },
        formElements: [ {
          label: 'Document Name',
          name: 'name',
          value: casedoc.filename,
          passProps: {
            state: 'isDisabled',
          },
        }, ],
      }, ...extracted_fields, {
        gridProps: {
          key: randomKey(),
          className: 'modal-footer-btns',
        },
        formElements: [ {
          type: 'submit',
          value: 'SAVE CHANGES',
          passProps: {
            color: 'isPrimary',
          },
          layoutProps: {},
        },
        ],
      },
      ],
    },
    asyncprops: {},
  };
}

module.exports = generateForm;