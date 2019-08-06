'use strict';
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;
const periodic = require('periodicjs');

module.exports = {
  'containers': {
    '/modal/upload_bulk_ocr_documents': {
      layout: {
        component: 'Container',
        props: {},
        children: [
          {
            component: 'ResponsiveForm',
            props: {
              flattenFormData: true,
              footergroups: false,
              useFormOptions: true,
              onSubmit: {
                url: '/simulation/api/process_ocr_documents?',
                options: {
                  headers: {},
                  method: 'POST',
                },
                // successCallback: 'func:window.downloadFileAndClose',
                // successProps: {},
                responseCallback: 'func:window.downloadFileAndClose',
              },
              formgroups: [{
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'file',
                  label: 'Documents for OCR Text Extraction',
                  name: 'upload_file',
                },
                ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  label: 'OCR Template',
                  name: 'ocr_id',
                  type: 'dropdown',
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
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
                  aProps: {},
                  value: 'EXTRACT TEXT',
                  'passProps': {
                    'color': 'isPrimary',
                  },
                  'layoutProps': {
                    'style': {
                      'textAlign': 'center',
                    },
                  },
                },
                ],
              },
              ],
            },
            asyncprops: {
              __formOptions: ['documentdata', 'formoptions',]
            }
          },
        ],
      },
      'resources': {
        documentdata: '/simulation/api/get_documentocr_dropdown',
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
      callbacks: ['func:window.filtertemplateFile',  'func:window.allowMultipleFiles'],
      'onFinish': 'render',
    },
  },
};