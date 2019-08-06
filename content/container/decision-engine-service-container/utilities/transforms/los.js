'use strict';
const periodic = require('periodicjs');
const capitalize = require('capitalize');
const numeral = require('numeral');
const qs = require('query-string');
const moment = require('moment');
const CONSTANTS = require('../constants');
const references = require('../views/constants/references');
const transformhelpers = require('../transformhelpers');
const view_utilities = require('../views');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const styles = view_utilities.constants.styles;
const shared = view_utilities.shared;
const cardprops = shared.props.cardprops;
const getInputLink = shared.component.getInputLink;
const formGlobalButtonBar = shared.component.globalButtonBar.formGlobalButtonBar;
const randomKey = Math.random;

function coerceLoanDataType(options) {
  try {
    let { name, value, value_type, value_category } = options;
    name = name.trim();
    if (typeof value === 'string') value = value.trim();
    if (value_type === 'boolean') {
      switch (typeof value) {
        case 'boolean': break;
        case 'string':
          value = value.toLowerCase();
          value = value === 'true' ? true
            : value === 'false' ? false
              : null;
          break;
        default:
          value = null;
          break;
      }
    } else if (value_type === 'text') {
      value = value.length ? `${value}` : null;
    } else if (value_type === 'number') {
      switch (typeof value) {
        case 'number': break;
        case 'string':
          if (!value.length) {
            value = null;
          } else {
            value = numeral(value)._value;
            if (isNaN(value)) value = null;
          }
          break;
        default:
          value = null;
          break;
      }
    } else if (value_type === 'date') {
      if (typeof value === 'string') value = moment(value).toISOString();
    }
    return { name, value, value_type, value_category };
  } catch (e) {
    return e;
  }

}

function formatByValueType(options) {
  const { value, value_type, } = options;
  let formatted = value;
  if (formatted === null) return null;
  try {
    switch (value_type) {
      case 'monetary':
        formatted = numeral(value).format('$0,0.00');
        break;
      case 'percentage':
        formatted = numeral(value).format('0,0.[00]%');
        break;
      case 'number':
        formatted = numeral(value).format('0,0.[0000]');
        break;
      case 'date':
        formatted = moment(value).format('YYYY/MM/DD');
        break;
      case 'boolean':
        formatted = `${Boolean(value)}`;
        break;
      default:
        break;
    }
    return formatted;
  } catch (e) {
    return value;
  }
}

function _generateCreateTaskManifest(customer_type) {
  try {
    return [ {
      component: 'ResponsiveForm',
      asyncprops: {
        formdata: [ 'taskdata', 'formdata', ],
        __formOptions: [ 'taskdata', 'formoptions', ],
      },
      props: {
        setInitialValues: false,
        flattenFormData: false,
        footergroups: false,
        'onSubmit': {
          url: '/los/api/tasks',
          options: {
            method: 'POST',
          },
          params: [ { key: ':id', val: '_id', }, ],
          successCallback: 'func:window.closeModalAndCreateNotification',
          successProps: {
            text: 'Changes saved successfully!',
            timeout: 10000,
            type: 'success',
          },
          responseCallback: 'func:this.props.refresh',
        },
        validations: [ {
          'name': 'description',
          'constraints': {
            'description': {
              'presence': {
                'message': '^Description is required.',
              },
            },
          },
        }, {
          'name': 'done',
          'constraints': {
            'done': {
              'presence': {
                'message': '^Status is required.',
              },
            },
          },
        }, ],
        formgroups: [ {
          gridProps: {
            key: Math.random(),
          },
          formElements: [ {
            label: 'Description',
            name: 'description',
            leftIcon: 'fas fa-thumbtack',
            errorIconRight: true,
            validateOnBlur: true,
            onBlur: true,
          }, ],
        }, {
          gridProps: {
            key: Math.random(),
          },
          formElements: [ {
            name: 'done',
            type: 'dropdown',
            leftIcon: 'fas fa-clipboard-list-check',
            validateOnChange: true,
            errorIconRight: true,
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'Status',
              }, ],
            },
            passProps: {
              selectOnBlur: false,
              selection: true,
              fluid: true,
              search: false,
            },
          }, ],
        }, {
          gridProps: {
            key: Math.random(),
          },
          formElements: [ {
            name: 'team_members',
            type: 'dropdown',
            leftIcon: 'fas fa-users',
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'Team Members',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            passProps: {
              multiple: true,
              selection: true,
              fluid: true,
              search: true,
            },
          }, ],
        }, {
          gridProps: {
            key: Math.random(),
          },
          formElements: [ {
            name: 'application',
            type: 'dropdown',
            leftIcon: 'fas fa-file-alt',
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'Application',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            passProps: {
              selection: true,
              selectOnBlur: false,
              fluid: true,
              search: true,
            },
          }, ],
        }, {
          gridProps: {
            key: Math.random(),
            style: {
              display: customer_type === 'company' ? 'flex' : 'none',
            },
          },
          formElements: [ {
            name: 'company',
            type: 'dropdown',
            leftIcon: 'fas fa-building',
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'Company',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            passProps: {
              selection: true,
              fluid: true,
              search: true,
              selectOnBlur: false,
            },
          }, ],
        }, {
          gridProps: {
            key: Math.random(),
          },
          formElements: [ {
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'People',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            name: 'people',
            type: 'dropdown',
            leftIcon: 'fas fa-user',
            passProps: {
              selection: true,
              multiple: true,
              fluid: true,
              search: true,
            },
          },
          ],
        }, {
          gridProps: {
            key: Math.random(),
          },
          formElements: [ {
            type: 'singleDatePicker',
            name: 'due_date',
            leftIcon: 'fas fa-calendar-alt',
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'Due Date',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            passProps: {
              placeholder: '',
              hideKeyboardShortcutsPanel: true,
            },
          },
          ],
        }, {
          gridProps: {
            key: Math.random(),
            className: 'modal-footer-btns',
          },
          formElements: [ {
            type: 'submit',
            value: 'CREATE TASK',
            passProps: {
              color: 'isPrimary',
            },
            layoutProps: {},
          },
          ],
        },
        ],
      },
    }, ];
  } catch (e) {
    return e;
  }
}

function _generateEditTaskManifest(customer_type) {
  try {
    return [ {
      component: 'ResponsiveForm',
      asyncprops: {
        formdata: [ 'taskdata', 'formdata', ],
        __formOptions: [ 'taskdata', 'formoptions', ],
      },
      props: {
        setInitialValues: false,
        flattenFormData: false,
        footergroups: false,
        'onSubmit': {
          url: '/los/api/tasks/:id',
          options: {
            method: 'PUT',
          },
          params: [ { key: ':id', val: '_id', }, ],
          successCallback: 'func:window.closeModalAndCreateNotification',
          successProps: {
            text: 'Changes saved successfully!',
            timeout: 10000,
            type: 'success',
          },
          responseCallback: 'func:this.props.refresh',
        },
        validations: [ {
          'name': 'description',
          'constraints': {
            'description': {
              'presence': {
                'message': '^Description is required.',
              },
            },
          },
        }, {
          'name': 'done',
          'constraints': {
            'done': {
              'presence': {
                'message': '^Status is required.',
              },
            },
          },
        }, ],
        formgroups: [ {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            label: 'Description',
            name: 'description',
            errorIconRight: true,
            validateOnBlur: true,
            onBlur: true,
            leftIcon: 'fas fa-thumbtack',
          }, ],
        }, {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            name: 'done',
            type: 'dropdown',
            leftIcon: 'fas fa-clipboard-list-check',
            validateOnChange: true,
            errorIconRight: true,
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'Status',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            passProps: {
              selection: true,
              fluid: true,
              search: false,
              selectOnBlur: false,
            },
          }, ],
        }, {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            name: 'team_members',
            type: 'dropdown',
            leftIcon: 'fas fa-users',
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'Team Members',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            passProps: {
              selection: true,
              fluid: true,
              search: true,
              multiple: true,
            },
          }, ],
        }, {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            name: 'application',
            type: 'dropdown',
            leftIcon: 'fas fa-file-alt',
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'Application',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            passProps: {
              selection: true,
              fluid: true,
              search: true,
              selectOnBlur: false,
            },
          }, ],
        }, {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            name: 'company',
            type: 'dropdown',
            leftIcon: 'fas fa-building',
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'Company',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            passProps: {
              selection: true,
              fluid: true,
              search: true,
              selectOnBlur: false,
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
                children: 'People',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            name: 'people',
            type: 'dropdown',
            leftIcon: 'fas fa-user',
            passProps: {
              selection: true,
              multiple: true,
              fluid: true,
              search: true,
            },
          },
          ],
        }, {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            type: 'singleDatePicker',
            name: 'due_date',
            leftIcon: 'fas fa-calendar-alt',
            customLabel: {
              component: 'span',
              children: [ {
                component: 'span',
                children: 'Due Date',
              }, {
                component: 'span',
                children: 'Optional',
                props: {
                  style: {
                    fontStyle: 'italic',
                    marginLeft: '2px',
                    fontWeight: 'normal',
                    color: '#969696',
                  },
                },
              }, ],
            },
            passProps: {
              placeholder: '',
              hideKeyboardShortcutsPanel: true,
            },
          },
          ],
        }, {
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
    },
    ];
  } catch (e) {
    return e;
  }
}

function _createGenerateDocForm(options) {
  try {
    const { parentDirectoryDropdown, template, application, autoPopulationFieldMap, } = options;

    const fields_info = Object.entries(template.fields).map(([ name, detail, ], idx) => ({ name, value_type: detail.value_type || '', value: detail.value || '', idx, _id: template._id.toString(), }));

    const hiddenFields = fields_info.map((field, idx) => ({
      'form_name': `fields.${idx}.name`,
      'form_static_val': field.name,
    }));

    let form_fields = fields_info.map((field, idx) => {
      const field_value = (field.value === '' && autoPopulationFieldMap[ field.name ] !== undefined) ? autoPopulationFieldMap[ field.name ] : field.value;
      return {
        gridProps: {
          key: randomKey(),
        },
        formElements: [ {
          name: `fields.${idx}.value`,
          value: field_value,
          field_num: idx,
          layoutProps: {
            style: {
              width: '70%',
              paddingRight: '7px',
              display: 'inline-block',
              verticalAlign: 'top',
            },
          },
          customLabel: {
            component: 'span',
            children: field.name,
          },
        }, ],
      };
    });

    const formdata = fields_info.reduce((acc, field, idx) => {
      const field_value = (field.value === '' && autoPopulationFieldMap[ field.name ] !== undefined) ? autoPopulationFieldMap[ field.name ] : field.value;
      acc[ `fields.${idx}.value` ] = field_value;
      acc[ `fields.${idx}.value_type` ] = field.value_type;
      return acc;
    }, {});

    if (application && application.parent_directory) formdata.parent_directory = application.parent_directory;

    return {
      component: 'ResponsiveFormContainer',
      props: {
        formgroups: [
          {
            gridProps: {
              key: randomKey(),
            },
            formElements: [ {
              type: 'dropdown',
              name: 'parent_directory',
              options: parentDirectoryDropdown,
              passProps: {
                selection: true,
                fluid: true,
                search: true,
                selectOnBlur: false,
              },
              customLabel: {
                component: 'span',
                children: [ {
                  component: 'span',
                  children: 'File Folder',
                }, {
                  component: 'span',
                  children: 'Optional',
                  props: {
                    style: {
                      fontStyle: 'italic',
                      marginLeft: '2px',
                      fontWeight: 'normal',
                      color: styles.colors.regGreyText,
                    },
                  },
                }, ],
              },
            }, ],
          },
          ...form_fields,
          {
            gridProps: {
              key: randomKey(),
              className: 'modal-footer-btns',
            },
            formElements: [ {
              type: 'submit',
              value: 'GENERATE DOCUMENT',
              passProps: {
                color: 'isPrimary',
              },
              layoutProps: {},
            },
            ],
          }, ],
        form: {
          __formOptions: {
            parent_directory: parentDirectoryDropdown,
          },
          flattenFormData: true,
          footergroups: false,
          setInitialValues: false,
          useFormOptions: true,
          'onSubmit': {
            url: `/los/api/applications/${application._id}/generate_doc/${template._id}?template_param=template&populate=all`,
            options: {
              method: 'POST',
            },
            successCallback: 'func:window.closeModalAndCreateNotification',
            successProps: {
              text: 'Changes saved successfully!',
              timeout: 10000,
              type: 'success',
            },
            responseCallback: 'func:this.props.reduxRouter.push',
          },
          hiddenFields,
          formdata,
        },
      },
    };
  } catch (e) {
    return e;
  }
}

function _generateAutoPopulationMap(options) {
  let { application, customer, coapplicant, intermediary, isFormatted, } = options;
  const applicationKeyInfo = {};
  const customerKeyInfo = {};
  const coapplicantKeyInfo = {};
  const intermediaryKeyInfo = {};
  if (application && application.key_information) {
    Object.entries(application.key_information).forEach(([ name, detail, ]) => {
      if (isFormatted) {
        applicationKeyInfo[ name ] = formatByValueType(detail);
      } else {
        applicationKeyInfo[ name ] = detail.value;
      }
    });
  }
  if (customer && customer.key_information) {
    Object.entries(customer.key_information).forEach(([ name, detail, ]) => {
      if (isFormatted) {
        customerKeyInfo[ `applicant.${name}` ] = formatByValueType(detail);
      } else {
        customerKeyInfo[ `applicant.${name}` ] = detail.value;
      }
    });
  }
  if (coapplicant && coapplicant.key_information) {
    Object.entries(coapplicant.key_information).forEach(([ name, detail, ]) => {
      if (isFormatted) {
        coapplicantKeyInfo[ `coapplicant.${name}` ] = formatByValueType(detail);
      } else {
        coapplicantKeyInfo[ `coapplicant.${name}` ] = detail.value;
      }
    });
  }
  if (intermediary && intermediary.key_information) {
    Object.entries(intermediary.key_information).forEach(([ name, detail, ]) => {
      if (isFormatted) {
        intermediaryKeyInfo[ `intermediary.${name}` ] = formatByValueType(detail);
      } else {
        intermediaryKeyInfo[ `intermediary.${name}` ] = detail.value;
      }
    });
  }
  const LOS_AUTO_POPULATION_FIELDS = CONSTANTS.LOS.LOS_AUTO_POPULATION_FIELDS;
  const defaultAutoPopulationMap = {};

  Object.keys(LOS_AUTO_POPULATION_FIELDS).forEach(fieldname => {
    let value = options;
    const prop_path = LOS_AUTO_POPULATION_FIELDS[ fieldname ].path.split('.');
    for (let i = 0; i < prop_path.length; i++) {
      if (value === undefined || value === null) break;
      value = value[ prop_path[ i ] ];
    }
    if (isFormatted) {
      defaultAutoPopulationMap[ fieldname ] = formatByValueType({ value, value_type: LOS_AUTO_POPULATION_FIELDS[ fieldname ].value_type, });
    } else {
      defaultAutoPopulationMap[ fieldname ] = value;
    }
  });

  return Object.assign({}, defaultAutoPopulationMap, customerKeyInfo, intermediaryKeyInfo, coapplicantKeyInfo, applicationKeyInfo);
}

function generateTableIcon(iconUrl, teamCount) {
  return {
    component: 'div',
    props: {
      style: {
        position: 'relative',
        height: '100%',
        marginRight: '10px',
        overflow: 'visible',
      },
    },
    children: [ {
      component: 'div',
      props: {
        className: 'table-icon',
        style: {
          backgroundImage: `url(${iconUrl}`,
          backgroundSize: '100%',
        },
      },
    }, ].concat((teamCount - 1 > 0) ? [ {
      component: 'div',
      props: {
        style: {
          position: 'absolute',
          backgroundColor: '#007aff',
          color: 'white',
          fontSize: '10px',
          right: '-3px',
          bottom: '-3px',
          lineHeight: '17px',
          height: '17px',
          width: '17px',
          borderRadius: '100%',
          textAlign: 'center',
          fontWeight: 'bold',
          boxShadow: 'rgba(17, 17, 17, 0.2) 0px 0px 0px 1px',
          whiteSpace: 'nowrap',
        },
      },
      children: `+${teamCount - 1}`,
    }, ] : []),
  };
}

function _pickContrastingFontColor(bgColor) {
  var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
  var r = parseInt(color.substring(0, 2), 16); // hexToR
  var g = parseInt(color.substring(2, 4), 16); // hexToG
  var b = parseInt(color.substring(4, 6), 16); // hexToB
  var uicolors = [ r / 255, g / 255, b / 255, ];
  var c = uicolors.map((col) => {
    if (col <= 0.03928) {
      return col / 12.92;
    }
    return Math.pow((col + 0.055) / 1.055, 2.4);
  });
  var L = (0.2126 * c[ 0 ]) + (0.7152 * c[ 1 ]) + (0.0722 * c[ 2 ]);
  return (L > 0.5) ? '000000' : '#ffffff';
}

function _generateLabelTag(label, color) {
  return {
    component: 'span',
    props: {
      style: {
        backgroundColor: color,
        maxWidth: '100px',
        width: '100%',
        fontWeight: 'bold',
        borderRadius: '5px',
        color: _pickContrastingFontColor(color),
        padding: '5px 10px',
      },
    },
    children: label,
  };
}

function generateInputFields({ initValues, }) {
  return function (ipt) {
    let input;
    let initValue = (initValues[ ipt.display_title ] !== undefined) ? initValues[ ipt.display_title ] : '';
    switch (ipt.data_type) {
      case 'Number':
        input = {
          name: `inputs.${ipt.title}`,
          type: 'maskedinput',
          createNumberMask: true,
          value: initValue,
          passProps: {
            mask: 'func:window.numberMaskTwo',
            guid: false,
            placeholderChar: '\u2000',
          },
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: `${ipt.display_title} `,
            }, {
              component: 'span',
              children: ipt.data_type,
              props: {
                style: {
                  fontStyle: 'italic',
                  marginLeft: '2px',
                  fontWeight: 'normal',
                  color: '#969696',
                },
              },
            }, ],
          },
        };
        break;
      case 'String':
        input = {
          name: `inputs.${ipt.title}`,
          value: initValue,
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: `${ipt.display_title} `,
            }, {
              component: 'span',
              children: ipt.data_type,
              props: {
                style: {
                  fontStyle: 'italic',
                  marginLeft: '2px',
                  fontWeight: 'normal',
                  color: '#969696',
                },
              },
            }, ],
          },
        };
        break;
      case 'Boolean':
        input = {
          name: `inputs.${ipt.title}`,
          type: 'dropdown',
          passProps: {
            selection: true,
            fluid: true,
          },
          value: `${initValue}` || 'true',
          options: [ {
            label: 'True',
            value: 'true',
          }, {
            label: 'False',
            value: 'false',
          }, ],
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: `${ipt.display_title} `,
            }, {
              component: 'span',
              children: ipt.data_type,
              props: {
                style: {
                  fontStyle: 'italic',
                  marginLeft: '2px',
                  fontWeight: 'normal',
                  color: '#969696',
                },
              },
            }, ],
          },
        };
        break;
      case 'Date':
        input = {
          name: `inputs.${ipt.title}`,
          type: 'singleDatePicker',
          leftIcon: 'fas fa-calendar-alt',
          passProps: {
            hideKeyboardShortcutsPanel: true,
            placeholder: '',
          },
          value: initValue,
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: `${ipt.display_title} `,
            }, {
              component: 'span',
              children: ipt.data_type,
              props: {
                style: {
                  fontStyle: 'italic',
                  marginLeft: '2px',
                  fontWeight: 'normal',
                  color: '#969696',
                },
              },
            }, ],
          },
        };
        break;
      default:
        input = {
          name: `inputs.${ipt.title}`,
          value: initValue,
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: `${ipt.display_title} `,
            }, {
              component: 'span',
              children: ipt.data_type,
              props: {
                style: {
                  fontStyle: 'italic',
                  marginLeft: '2px',
                  fontWeight: 'normal',
                  color: '#969696',
                },
              },
            }, ],
          },
        };
    }
    return {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ input, ],
    };
  };
}

function _generateAutomateDecisionForm(options) {
  const { inputs, strategy_id, application_id, } = options;
  return {
    component: 'ResponsiveForm',
    props: {
      'onSubmit': {
        url: `/simulation/api/individual/run/${strategy_id}?application_id=${application_id}&redirect=true`,
        options: {
          method: 'POST',
        },
        params: [ { key: ':id', val: '_id', }, ],
        successCallback: 'func:window.closeModalAndCreateNotification',
        successProps: {
          text: 'Changes saved successfully!',
          timeout: 10000,
          type: 'success',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
      },
      hiddenFields: [
        {
          form_name: 'selected_strategy',
          form_static_val: strategy_id,
        },
      ],
      blockPageUI: true,
      useFormOptions: true,
      flattenFormData: true,
      footergroups: false,
      formgroups: [
        ...inputs,
        {
          gridProps: {
            key: randomKey(),
            className: 'modal-footer-btns',
          },
          formElements: [ {
            type: 'submit',
            value: 'RUN UNDERWRITING',
            passProps: {
              color: 'isPrimary',
            },
            layoutProps: {},
          },
          ],
        },
      ],
    },
  };
}

function _generateAutomateMLForm(options) {
  const { inputs, mlmodel_id, application_id, } = options;
  return {
    component: 'ResponsiveForm',
    props: {
      'onSubmit': {
        url: `/ml/api/individual/run/${mlmodel_id}?application_id=${application_id}&redirect=true`,
        options: {
          method: 'POST',
        },
        params: [ { key: ':id', val: '_id', }, ],
        successCallback: 'func:window.closeModalAndCreateNotification',
        successProps: {
          text: 'Changes saved successfully!',
          timeout: 10000,
          type: 'success',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
      },
      hiddenFields: [],
      blockPageUI: true,
      useFormOptions: true,
      flattenFormData: true,
      footergroups: false,
      formgroups: [
        ...inputs,
        {
          gridProps: {
            key: randomKey(),
            className: 'modal-footer-btns',
          },
          formElements: [ {
            type: 'submit',
            value: 'RUN UNDERWRITING',
            passProps: {
              color: 'isPrimary',
            },
            layoutProps: {},
          },
          ],
        },
      ],
    },
  };
}

function _formatCommunicationType(type) {
  const typeIconNames = {
    'email': 'envelope outline',
    'phone': 'phone rotated',
    'meeting': 'users',
    'other': 'ellipsis horizontal',
  };
  return (type) ? {
    component: 'div',
    children: [ {
      component: 'Semantic.Icon',
      props: {
        name: typeIconNames[ type ],
        style: {
          marginRight: '10px',
        },
      },
    }, {
      component: 'span',
      children: capitalize(type),
    }, ],
  } : '';
}

function _createMaskedFormElement({ value_type, name, }) {
  if (value_type === 'monetary') {
    return {
      type: 'maskedinput',
      name: `key_information.${name}.value`,
      placeholder: undefined,
      createNumberMask: true,
      passProps: {
        mask: 'func:window.testMaskDollarInput',
        guide: false,
        autoComplete: 'off',
        autoCorrect: 'off',
        autoCapitalize: 'off',
        spellCheck: false,
      },
      customLabel: {
        component: 'span',
        children: [ {
          component: 'span',
          children: name,
        }, {
          component: 'span',
          children: 'Optional',
          props: {
            style: {
              fontStyle: 'italic',
              marginLeft: '2px',
              fontWeight: 'normal',
              color: '#969696',
            },
          },
        }, ],
      },
    };
  } else if (value_type === 'percentage') {
    return {
      type: 'maskedinput',
      name: `key_information.${name}.value`,
      placeholder: undefined,
      createNumberMask: true,
      passProps: {
        mask: 'func:window.textMaskPercentageInput',
        guide: false,
        autoComplete: 'off',
        autoCorrect: 'off',
        autoCapitalize: 'off',
        spellCheck: false,
      },
      customLabel: {
        component: 'span',
        children: [ {
          component: 'span',
          children: name,
        }, {
          component: 'span',
          children: 'Optional',
          props: {
            style: {
              fontStyle: 'italic',
              marginLeft: '2px',
              fontWeight: 'normal',
              color: '#969696',
            },
          },
        }, ],
      },
    };
  } else if (value_type === 'number') {
    return {
      type: 'maskedinput',
      name: `key_information.${name}.value`,
      placeholder: undefined,
      createNumberMask: true,
      passProps: {
        mask: 'func:window.textMaskNumberInput',
        guide: false,
        autoComplete: 'off',
        autoCorrect: 'off',
        autoCapitalize: 'off',
        spellCheck: false,
      },
      customLabel: {
        component: 'span',
        children: [ {
          component: 'span',
          children: name,
        }, {
          component: 'span',
          children: 'Optional',
          props: {
            style: {
              fontStyle: 'italic',
              marginLeft: '2px',
              fontWeight: 'normal',
              color: '#969696',
            },
          },
        }, ],
      },
    };
  } else if (value_type === 'date') {
    return {
      type: 'singleDatePicker',
      leftIcon: 'fas fa-calendar-alt',
      name: `key_information.${name}.value`,
      label: 'Value',
      passProps: {
        placeholder: '',
        hideKeyboardShortcutsPanel: true,
      },
    };
  } else if (value_type === 'boolean') {
    return {
      customLabel: {
        component: 'span',
        children: [ {
          component: 'span',
          children: name,
        }, {
          component: 'span',
          children: 'Optional',
          props: {
            style: {
              fontStyle: 'italic',
              marginLeft: '2px',
              fontWeight: 'normal',
              color: '#969696',
            },
          },
        }, ],
      },
      type: 'dropdown',
      name: `key_information.${name}.value`,
      passProps: {
        selection: true,
        fluid: true,
        selectOnBlur: false,
      },
      value: 'true',
      options: [ {
        label: 'True',
        value: 'true',
      }, {
        label: 'False',
        value: 'false',
      }, ],
    };
  } else {
    return {
      name: `key_information.${name}.value`,
      customLabel: {
        component: 'span',
        children: [ {
          component: 'span',
          children: name,
        }, {
          component: 'span',
          children: 'Optional',
          props: {
            style: {
              fontStyle: 'italic',
              marginLeft: '2px',
              fontWeight: 'normal',
              color: '#969696',
            },
          },
        }, ],
      },
    };
  }
}

function _createApplicationDetailPage({ applicationId, application_status, keyInfoLength }) {
  const dateFormElementOptions = {
    estimated_close_date: {
      type: 'singleDatePicker',
      leftIcon: 'fas fa-calendar-check',
      name: 'estimated_close_date',
      label: 'Estimated Close Date',
      passProps: {
        placeholder: '',
        hideKeyboardShortcutsPanel: true,
      },
    },
    decision_date_approved: {
      name: 'decision_date_approved',
      label: 'Date Approved',
      leftIcon: 'fas fa-calendar-check',
      passProps: {
        state: 'isDisabled',
      },
    },
    decision_date_rejected: {
      name: 'decision_date_rejected',
      leftIcon: 'fas fa-calendar-times',
      label: 'Date Rejected',
      passProps: {
        state: 'isDisabled',
      },
    },
  };
  let dateFormElement;
  if (application_status && application_status.name === 'Approved') {
    dateFormElement = dateFormElementOptions[ 'decision_date_approved' ];
  } else if (application_status && application_status.name === 'Rejected') {
    dateFormElement = dateFormElementOptions[ 'decision_date_rejected' ];
  } else {
    dateFormElement = dateFormElementOptions[ 'estimated_close_date' ];
  }
  return {
    component: 'ResponsiveForm',
    asyncprops: {
      formdata: [ 'applicationdata', 'application', ],
      __formOptions: [ 'applicationdata', 'formoptions', ],
      casedata: [ 'casedata', ],
    },
    props: {
      flattenFormData: true,
      footergroups: false,
      onSubmit: {
        url: '/los/api/applications/:id',
        'options': {
          'method': 'PUT',
        },
        params: [ { key: ':id', val: '_id', }, ],
        successCallback: [ 'func:this.props.refresh', 'func:this.props.createNotification', ],
        successProps: [ null, {
          type: 'success',
          text: 'Changes saved successfully!',
          timeout: 10000,
        },
        ],
      },
      validations: [
      ],
      formgroups: [
        formGlobalButtonBar({
          left: [ {
            component: 'ResponsiveButton',
            children: 'Approve',
            thisprops: {
              onclickPropObject: [ 'formdata', ],
            },
            comparisonprops: [ {
              left: [ 'formdata', 'status_name', ],
              operation: 'dneq',
              right: 'Approved',
            }, {
              left: [ 'formdata', 'status_name', ],
              operation: 'dneq',
              right: 'Rejected',
            }, ],
            props: {
              onClick: 'func:this.props.fetchAction',
              onclickBaseUrl: '/los/api/applications/:id?status=approve',
              onclickLinkParams: [ { key: ':id', val: '_id', }, ],
              successProps: {
                successCallback: 'func:this.props.refresh',
              },
              confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                title: 'Approve Loan Application',
                yesButtonText: 'YES, APPROVE!',
                yesButtonProps: {
                  style: {
                    margin: '5px',
                  },
                  buttonProps: {
                    color: 'isSuccess',
                  },
                },
                noButtonText: 'NO, GO BACK',
                textContent: [ {
                  component: 'p',
                  children: 'Are you sure you want to approve this loan?',
                  props: {
                    style: {
                      textAlign: 'left',
                      marginBottom: '1.5rem',
                    },
                  },
                }, ],
              }),
              fetchProps: {
                method: 'PUT',
              },
              buttonProps: {
                color: 'isSuccess',
                marginRight: '1rem',
              },
            },
          }, {
            component: 'ResponsiveButton',
            children: 'REJECT',
            thisprops: {
              onclickPropObject: [ 'formdata', ],
              // status_name: ['app']
            },
            comparisonprops: [ {
              left: [ 'formdata', 'status_name', ],
              operation: 'dneq',
              right: 'Approved',
            }, {
              left: [ 'formdata', 'status_name', ],
              operation: 'dneq',
              right: 'Rejected',
            }, ],
            props: {
              onClick: 'func:this.props.createModal',
              onclickProps: {
                title: 'Reject Loan Application',
                pathname: '/los/applications/:id/close_loan_application',
                params: [ { 'key': ':id', 'val': '_id', }, ],
              },
              buttonProps: {
                color: 'isDanger',
              },
            },
          },
          ],
          right: [ {
            component: 'ResponsiveButton',
            children: 'RUN AUTOMATION',
            thisprops: {
              onclickPropObject: [ 'formdata', ],
            },
            props: {
              onClick: 'func:this.props.createModal',
              onclickProps: {
                title: 'Run Automation',
                pathname: '/los/applications/:id/select_automation',
                params: [ { 'key': ':id', 'val': '_id', }, ],
              },
              buttonProps: {
                color: 'isPrimary',
              },
            },
          }, {
            type: 'submit',
            value: 'SAVE',
            passProps: {
              color: 'isPrimary',
            },
            layoutProps: {
              className: 'global-button-save',
            },
          },
          ],
        }),
        {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            type: 'progress',
            passProps: {
              unstackable: true,
            },
            name: 'status',
          }, ],
        },
        {
          gridProps: {
            key: randomKey(),
            style: {
              display: 'inline-block',
              width: '50%',
              margin: 0,
            },
            subColumnProps: {
              style: {
                padding: '0 10px 0 0',
              },
            },
          },
          card: {
            props: cardprops({
              cardTitle: 'Application Information',
              cardStyle: {
                marginBottom: 0,
              },
            }),
          },
          formElements: [ {
            type: 'maskedinput',
            name: 'loan_amount',
            leftIcon: 'fas fa-usd-circle',
            placeholder: undefined,
            createNumberMask: true,
            passProps: {
              mask: 'func:window.testMaskDollarInput',
              guide: false,
              autoComplete: 'off',
              autoCorrect: 'off',
              autoCapitalize: 'off',
              spellCheck: false,
            },
            label: 'Loan Amount',
          }, {
            name: 'product',
            leftIcon: 'fas fa-star',
            customLabel: {
              component: 'span',
              props: {
                className: '__re-bulma_label',
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                },
              },
              children: [ {
                component: 'span',
                children: 'Product',
              }, ],
            },
            type: 'dropdown',
            passProps: {
              selection: true,
              fluid: true,
              search: true,
              selectOnBlur: false,
            },
          },
          getInputLink({
            label: 'Customer',
            leftIcon: 'fas fa-usd-circle',
            baseurl: '/los/:customer_baseurl',
            thisprop: [ 'formdata', ],
            displayprop: 'customer_name',
            params: [ { 'key': ':customer_baseurl', 'val': 'customer_baseurl', }, ],
            passProps: {
              spanProps: {
                className: '__ra_rb los-input-link',
              },
            },
          }),
          getInputLink({
            label: 'Co-Applicant',
            leftIcon: 'fas fa-usd-circle',
            baseurl: '/los/:customer_baseurl',
            thisprop: [ 'formdata', ],
            displayprop: 'coapplicant',
            params: [ { 'key': ':customer_baseurl', 'val': 'coapplicant_baseurl', }, ],
            passProps: {
              spanProps: {
                className: '__ra_rb los-input-link',
              },
            },
          }),
          {
            label: 'Team Members',
            name: 'team_members',
            leftIcon: 'fas fa-users',
            type: 'dropdown',
            passProps: {
              selection: true,
              multiple: true,
              fluid: true,
              search: true,
            },
            options: [],
          }, {
            name: 'intermediary',
            label: 'Intermediary',
            type: 'dropdown',
            leftIcon: 'fas fa-seedling',
            errorIconRight: true,
            validateOnChange: true,
            errorIcon: 'fa fa-exclamation',
            validIcon: 'fa fa-check',
            passProps: {
              selection: true,
              fluid: true,
              search: true,
              selectOnBlur: false,
            },
          }, dateFormElement, {
            type: 'group',
            groupElements: [ {
              name: 'createdat',
              leftIcon: 'fas fa-calendar-alt',
              passProps: {
                state: 'isDisabled',
              },
              label: 'Created',
            }, {
              name: 'updatedat',
              leftIcon: 'fas fa-calendar-plus',
              passProps: {
                state: 'isDisabled',
              },
              label: 'Updated',
            }, ],
          },
          ],
        }, {
          gridProps: {
            key: randomKey(),
            style: {
              display: 'inline-block',
              width: '50%',
              verticalAlign: 'top',
              textAlign: 'right',
              margin: 0,
            },
          },
          formElements: [ {
            type: 'layout',
            layoutProps: {
              style: {
                padding: '0 0 0 10px',
              },
            },
            value: {
              component: 'div',
              children: [ {
                component: 'ResponsiveCard',
                props: cardprops({
                  cardTitle: 'Loan Information',
                }),
                children: [ {
                  component: 'ResponsiveTable',
                  thisprops: {
                    rows: [ 'formdata', 'loan_info', ],
                    filterButtons: [ 'formdata', 'filterButtons', ],
                  },
                  bindprops: true,
                  props: {
                    'flattenRowData': true,
                    filterSearch: true,
                    useHeaderFilters: true,
                    'addNewRows': false,
                    useRowProps: true,
                    'rowButtons': false,
                    'useInputRows': true,
                    hasPagination: false,
                    baseUrl: `/los/api/applications/${applicationId}/searchLoanInformation?`,
                    dataMap: [ {
                      'key': 'rows',
                      value: 'rows',
                    }, ],
                    'tableSearch': true,
                    'simpleSearchFilter': true,
                    filterSearchProps: {
                      icon: 'fa fa-search',
                      hasIconRight: false,
                      // className: 'global-table-search',
                      placeholder: 'SEARCH FIELDS',
                    },
                    limit: keyInfoLength,
                    tableWrappingStyle: keyInfoLength > 50 ? {
                      overflowY: 'scroll',
                      maxHeight: '500px',
                    } : undefined,
                    ignoreTableHeaders: [ '_id', ],
                    headers: [ {
                      label: 'Description',
                      sortid: 'name',
                      headerColumnProps: {
                        style: {
                        },
                      },
                    }, {
                      label: 'Value',
                      sortid: 'value',
                      headerColumnProps: {
                        style: {
                        },
                      },
                    }, {
                      label: ' ',
                      headerColumnProps: {
                        style: {
                          width: '80px',
                        },
                      },
                      columnProps: {
                        style: {
                          whiteSpace: 'nowrap',
                        },
                      },
                      buttons: [ {
                        passProps: {
                          buttonProps: {
                            icon: 'fa fa-pencil',
                            className: '__icon_button',
                          },
                          onClick: 'func:this.props.createModal',
                          onclickProps: {
                            title: 'Edit Loan Info',
                            pathname: '/los/applications/:id/edit_loan_info/:idx',
                            params: [ { key: ':id', val: '_id', }, { key: ':idx', val: 'idx', }, ],
                          },
                        },
                      }, {
                        passProps: {
                          buttonProps: {
                            icon: 'fa fa-trash',
                            color: 'isDanger',
                            className: '__icon_button',
                          },
                          onClick: 'func:this.props.fetchAction',
                          onclickBaseUrl: '/los/api/applications/:id/key_information/:idx?type=delete_loan_info',
                          onclickLinkParams: [ { key: ':id', val: '_id', }, { key: ':idx', val: 'idx', }, ],
                          fetchProps: {
                            method: 'PUT',
                          },
                          successProps: {
                            success: {
                              notification: {
                                text: 'Changes saved successfully!',
                                timeout: 10000,
                                type: 'success',
                              },
                            },
                            successCallback: 'func:this.props.refresh',
                          },
                          confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                            title: 'Delete Strategy',
                            textContent: [ {
                              component: 'p',
                              children: 'Do you want to permanently delete this Strategy?',
                              props: {
                                style: {
                                  textAlign: 'left',
                                  marginBottom: '1.5rem',
                                },
                              },
                            }, ],
                          }),
                        },
                      }, ],
                    }, ],
                  },
                }, {
                  thisprops: {
                    onclickPropObject: [ 'applicationdata', 'application', ],
                  },
                  component: 'ResponsiveButton',
                  children: 'ADD LOAN INFORMATION',
                  props: {
                    onClick: 'func:this.props.createModal',
                    onclickThisProp: [ 'formdata', ],
                    onclickProps: {
                      title: 'Add Loan Information',
                      pathname: '/los/applications/:id/add_loan_info',
                      params: [ { key: ':id', val: '_id', }, ],
                    },
                    buttonProps: {
                      color: 'isSuccess',
                    },
                  },
                }, ],
              }, {
                component: 'ResponsiveCard',
                props: cardprops({
                  cardTitle: 'Automation Results',
                  cardStyle: {},
                }),
                children: [ {
                  component: 'ResponsiveTable',
                  thisprops: {
                    rows: [ 'casedata', 'rows', ],
                    numItems: [ 'casedata', 'numItems', ],
                    numPages: [ 'casedata', 'numPages', ],
                    baseUrl: [ 'casedata', 'baseUrl', ],
                  },
                  props: {
                    dataMap: [ {
                      'key': 'rows',
                      value: 'rows',
                    }, {
                      'key': 'numItems',
                      value: 'numItems',
                    }, {
                      'key': 'numPages',
                      value: 'numPages',
                    }, ],
                    flattenRowData: true,
                    limit: 10,
                    simplePagination: true,
                    hasPagination: true,
                    calculatePagination: true,
                    'useInputRows': true,
                    headerLinkProps: {
                      style: {
                        textDecoration: 'none',
                      },
                    },
                    headers: [ {
                      label: 'Date',
                      sortid: 'createdat',
                      sortable: false,
                    }, {
                      label: 'Type',
                      sortid: 'processing_type',
                      sortable: false,
                    }, {
                      label: 'Description',
                      sortid: 'case_name',
                      sortable: false,
                    }, {
                      label: 'Result',
                      sortid: 'result',
                      sortable: false,
                    }, {
                      label: ' ',
                      headerColumnProps: {
                        style: {
                          // width: '45px',
                        },
                      },
                      columnProps: {
                        style: {
                          whiteSpace: 'nowrap',
                        },
                      },
                      buttons: [ {
                        passProps: {
                          aProps: {
                            className: '__re-bulma_button __icon_button green',
                            style: {
                            },
                          },
                          onclickBaseUrl: '/:download_url',
                          onclickLinkParams: [ {
                            'key': ':download_url',
                            'val': 'download_url',
                          }, ],
                        },
                        children: [ {
                          component: 'Icon',
                          props: {
                            icon: 'fa fa-download',
                          },
                        }, ],
                      }, {
                        passProps: {
                          buttonProps: {
                            icon: 'fa fa-pencil',
                            className: '__icon_button',
                          },
                          onClick: 'func:this.props.reduxRouter.push',
                          onclickBaseUrl: '/:detail_url',
                          onclickLinkParams: [ {
                            'key': ':detail_url',
                            'val': 'detail_url',
                          }, ],
                        },
                      }, {
                        passProps: {
                          buttonProps: {
                            icon: 'fa fa-trash',
                            color: 'isDanger',
                            className: '__icon_button',
                          },
                          onClick: 'func:this.props.fetchAction',
                          onclickBaseUrl: '/:delete_url',
                          onclickLinkParams: [ { key: ':delete_url', val: 'delete_url', }, ],
                          fetchProps: {
                            method: 'DELETE',
                          },
                          successProps: {
                            success: {
                              notification: {
                                text: 'Changes saved successfully!',
                                timeout: 10000,
                                type: 'success',
                              },
                            },
                            successCallback: 'func:this.props.refresh',
                          },
                          confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                            title: 'Delete Result',
                            textContent: [ {
                              component: 'p',
                              children: 'Do you want to permanently delete this automation result?',
                              props: {
                                style: {
                                  textAlign: 'left',
                                  marginBottom: '1.5rem',
                                },
                              },
                            }, ],
                          }),
                        },
                      }, ],
                    }, ],
                  },
                }, ],
              }, ],
            },
          }, ],
        },
      ],
    },
  };
}

function _generateDocuSignTemplateDetailForm(options) {
  const { textTabs, templateId, docId, autoPopulationFieldMap = {} } = options;
  let textInputs = textTabs.map(tab => {
    let value = autoPopulationFieldMap[ tab.tabLabel ] || '';
    return {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        name: `tab.${tab.tabLabel}`,
        value,
        label: tab.tabLabel,
      } ]
    }
  });
  return {
    component: 'ResponsiveForm',
    props: {
      'onSubmit': {
        url: `/los/api/docs/docusign/templates/${templateId}?doc_id=${docId}&redirect=true`,
        options: {
          method: 'POST',
        },
        successCallback: 'func:window.closeModalAndCreateNotification',
        successProps: {
          text: 'Changes saved successfully!',
          timeout: 10000,
          type: 'success',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
      },
      hiddenFields: [],
      blockPageUI: true,
      useFormOptions: true,
      flattenFormData: true,
      footergroups: false,
      formgroups: [
        {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            label: 'Email Subject',
            name: 'emailSubject',
            value: autoPopulationFieldMap[ 'Email Subject' ] || 'Your agreements for signature',
          } ]
        },
        {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            label: 'To (Email Address)',
            name: 'recipientEmail',
            value: autoPopulationFieldMap[ 'To (Email Address)' ] || autoPopulationFieldMap[ 'applicant.Email Address' ] || '',
          } ],
        },
        {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            label: 'Carbon Copy (Email Address)',
            name: 'ccEmail',
            value: autoPopulationFieldMap[ 'Carbon Copy (Email Address)' ] || '',
          } ],
        },
        {
          gridProps: {
            key: randomKey(),
          },
          formElements: [ {
            label: 'Full Name',
            name: 'fullName',
            value: autoPopulationFieldMap[ 'Full Name' ] || autoPopulationFieldMap['applicant.Name'] || '',
          } ],
        },
        ...textInputs,
        {
          gridProps: {
            key: randomKey(),
            className: 'modal-footer-btns',
          },
          formElements: [ {
            type: 'submit',
            value: 'SEND FOR E-SIGN',
            passProps: {
              color: 'isPrimary',
            },
            layoutProps: {},
          },
          ],
        },
      ],
    },
  };
}

module.exports = {
  coerceLoanDataType,
  formatByValueType,
  _createGenerateDocForm,
  _generateCreateTaskManifest,
  _generateEditTaskManifest,
  generateTableIcon,
  _generateAutoPopulationMap,
  _pickContrastingFontColor,
  _generateLabelTag,
  generateInputFields,
  _generateAutomateDecisionForm,
  _generateAutomateMLForm,
  _formatCommunicationType,
  _createMaskedFormElement,
  _createApplicationDetailPage,
  _generateDocuSignTemplateDetailForm,
};