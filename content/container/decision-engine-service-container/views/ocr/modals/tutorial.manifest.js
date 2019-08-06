'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/ocr/tutorial': {
      layout: {
        component: 'Container',
        props: {
          style: {
          },
        },
        children: [ {
          component: 'p',
          children: 'This tutorial walks you through creating a text recognition template and extracting handwritten text from a file.'
        }, {
          component: 'p',
          children: 'The sample files include a blank template ("OCR Text Recognition – Blank Template") and filled version for processing ("OCR Text Recognition – Processing Example"). Download the sample documents and follow the steps below to complete the tutorial.'
        },
        {
          component: 'p',
          children: [ { component: 'span', children: 'Step 1: Creating a Template', props: { style: { fontWeight: 800 } } }, {
            component: 'ul',
            children: [ {
              component: 'li', children: 'Click the CREATE NEW TEMPLATE button on the Templates tab and provide the name "Sample Template"'
            }, {
              component: 'li', children: 'Click the UPLOAD SAMPLE PDF DOCUMENT button and select the file named "OCR Text Recognition – Blank Template"'
            }, {
              component: 'li', children: 'Your document will appear on the right-hand side of the page'
            }, ],
          } ],
        }, {
          component: 'p',
          children: [ { component: 'span', children: 'Step 2: Selecting Fields to Extract', props: { style: { fontWeight: 800 } } }, {
            component: 'ul',
            children: [ {
              component: 'li', children: 'Highlight where the customer would be expected to write the Loan Type (note: do not include the words "LOAN TYPE" within your highlighted box)'
            }, {
              component: 'li', children: 'Provide a field name and click the SAVE FIELD button. Your field will appear on the left-hand side'
            }, {
              component: 'li', children: 'Repeat this process for as many fields as you would like to extract'
            }, ],
          } ],
        }, {
          component: 'p',
          children: [ { component: 'span', children: 'Step 3: Processing', props: { style: { fontWeight: 800 } } }, {
            component: 'ul',
            children: [ {
              component: 'li', children: 'Navigate to the Processing tab'
            }, {
              component: 'li', children: 'Select the template you made (named "Sample Template") and upload the "OCR Text Recognition – Processing Example" document'
            }, {
              component: 'li', children: 'Click the EXTRACT TEXT button to run the process. This will take a few seconds'
            }, {
              component: 'li', children: "You'll be navigated to a results page, which includes the extracted text",
            }, ],
          } ],
        }, {
          component: 'Columns',
          props: {
            className: 'modal-footer-btns'
          },
          children: [ {
            component: 'Column',
            props: {
              size: 'isNarrow',
            },
            children: [ {
              component: 'ResponsiveButton',
              children: 'DOWNLOAD BLANK TEMPLATE',
              props: {
                'onclickBaseUrl': '/ocr/api/download_tutorial_data?type=ml_vision_blank_template&export_format=pdf',
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-success',
                  style: {
                  },
                },
              },
            }, ]
          }, {
            component: 'Column',
            props: {
              size: 'isNarrow',
            },
            children: [ {
              component: 'ResponsiveButton',
              children: 'DOWNLOAD PROCESSING FILE',
              props: {
                'onclickBaseUrl': '/ocr/api/download_tutorial_data?type=ml_vision_processing_example&export_format=pdf',
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-primary',
                  style: {
                  },
                },
              },
            }, ]
          }, {
            component: 'Column',
            props: {
              size: 'isNarrow',
            },
            children: [ {
              component: 'ResponsiveButton',
              children: 'DOWNLOAD INSTRUCTIONS',
              props: {
                'onclickBaseUrl': '/ocr/api/download_tutorial_data?type=ml_vision_instructions&export_format=rtf',
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-primary purple',
                  style: {
                  },
                },
              },
            }, ]
          },]
        },
        ],
      },
      'resources': {
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