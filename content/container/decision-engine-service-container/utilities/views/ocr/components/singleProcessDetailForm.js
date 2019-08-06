'use strict';

const ocrTabs = require('./ocrTabs');
const plainHeaderTitle = require('../../shared/component/layoutComponents').plainHeaderTitle;
const formGlobalButtonBar = require('../../shared/component/globalButtonBar').formGlobalButtonBar;
const styles = require('../../constants').styles;
const cardprops = require('../../shared/props/cardprops');
const formElements = require('../../shared/props/formElements').formElements;
const references = require('../../constants').references;
const randomKey = Math.random;

function generateForm(options) {
  let { id, casedoc, } = options;
  let { results, filename, template, user, results_list, } = casedoc;
  return {
    component: 'ResponsiveForm',
    props: {
      blockPageUI: true,
      'onSubmit': {
        url: `/ocr/api/processing/individual/${id}`,
        'options': {
          'method': 'PUT',
        },
        successCallback: 'func:this.props.createNotification',
        successProps: {
          type: 'success',
          text: 'Changes saved successfully!',
          timeout: 10000,
        },
        responseCallback: 'func:this.props.refresh',
      },
      useFormOptions: true,
      flattenFormData: true,
      footergroups: false,
      formgroups: [
        formGlobalButtonBar({
          left: [ {
            type: 'layout',
            value: {
              component: 'ResponsiveButton',
              children: 'DOWNLOAD RESULTS',
              props: {
                'onclickBaseUrl': `/ocr/api/download/processing/individual/${id}?export_format=csv`,
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-success',
                },
              },
            },
          },
          ],
          right: [ {
            type: 'submit',
            value: 'SAVE',
            layoutProps: {
              size: 'isNarrow',
            },
            passProps: {
              color: 'isPrimary',
            }
          }, {
            guideButton: true,
            location: references.guideLinks.vision.individualProcessing,
          } ],
        }),
        {
          gridProps: {
            key: randomKey(),
          },
          card: {
            doubleCard: true,
            leftDoubleCardColumn: {
              style: {
                display: 'flex',
              },
            },
            rightDoubleCardColumn: {
              style: {
                display: 'flex',
              },
            },
            leftCardProps: cardprops({
              cardTitle: 'Overview',
              cardStyle: {
                marginBottom: 0,
              },
            }),
            rightCardProps: cardprops({
              cardTitle: 'Extracted Text',
              cardStyle: {
                marginBottom: 0,
              },
            }),
          },
          formElements: [ formElements({
            twoColumns: true,
            doubleCard: true,
            left: [ {
              label: 'File Name',
              value: filename,
              passProps: {
                'state': 'isDisabled',
              },
            }, {
              label: 'Template Name',
              value: template? template.name: casedoc.template_name,
              passProps: {
                'state': 'isDisabled',
              },
            }, {
              label: 'Source',
              value: 'Individual Process',
              passProps: {
                'state': 'isDisabled',
              },
            }, {
              label: 'Created',
              value: casedoc.formatted_created,
              passProps: {
                'state': 'isDisabled',
              },
            }, {
              label: 'Updated',
              value: casedoc.formatted_updated,
              passProps: {
                'state': 'isDisabled',
              },
            }, ],
            right: results_list,
          }),
          ],
        },
      ],
    },
    asyncprops: {
    },
  };
}

module.exports = generateForm;