'use strict';
const moment = require('moment');
const styles = require('../../../../constants').styles;
// const helpers = require('./helpers');
const capitalize = require('capitalize');
const randomKey = Math.random;
const CONSTANTS = require('../../../constants');
const DATA_TYPES_DROPDOWN = CONSTANTS.DATA_TYPES_DROPDOWN;
const VARIABLE_TYPES_DROPDOWN = CONSTANTS.VARIABLE_TYPES_DROPDOWN;
const COLLECTION_TABS = CONSTANTS.COLLECTION_TABS;
const COLLECTION_DETAIL_CONFIGS = require('../collectionDetailConfigs');
const commentsModal = require('../../../modals/comment');
const cardprops = require('../cardProps');
const conditions = require('../conditions');
const formElements = require('../formElements');
const ACTIVE_TABS = CONSTANTS.ACTIVE_TABS;
const findTabs = require('../findTabs');

let editValidations = {};
let editHiddenFields = {};
let editFormgroups = {};

const createValidations = [
  {
    name: 'name',
    constraints: {
      name: {
        presence: {
          message: '^Variable Name is required.',
        },
      },
    },
  }, {
    name: 'type',
    constraints: {
      type: {
        presence: {
          message: '^Variable Type is required.',
        },
      },
    },
  }, {
    name: 'data_type',
    constraints: {
      data_type: {
        presence: {
          message: '^Data Type is required.',
        },
      },
    },
  },
];

let createHiddenFields = [ {
  form_name: 'category',
  form_static_val: 'Custom',
}, ];

let createFormgroups = [ {
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    name: 'name',
    label: 'Variable Display Name',
    validateOnBlur: true,
    keyUp: 'func:window.variableNameOnChange',
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    layoutProps: {
    },
  }, ]
}, {
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    name: 'type',
    label: 'Variable Type',
    type: 'dropdown',
    value: '',
    validateOnChange: true,
    passProps: {
      selection: true,
      fluid: true
    },
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    layoutProps: {
    },
    options: VARIABLE_TYPES_DROPDOWN,
  }]
}, {
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    name: 'data_type',
    label: 'Data Type',
    type: 'dropdown',
    value: '',
    validateOnChange: true,
    passProps: {
      selection: true,
      fluid: true
    },
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    layoutProps: {
    },
    options: DATA_TYPES_DROPDOWN,
  }]
},
{
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    placeholder: ' ',
    layoutProps: {
    },
  }, ]
}, {
  gridProps: {
    key: randomKey(),
    style: {
      textAlign: 'right',
    }
  },
  formElements: [ {
    type: 'Semantic.checkbox',
    label: 'Set a variable system name',
    passProps: {
      className: 'reverse-label',
    },
    layoutProps: {
    },
    name: 'has_variable_system_name', 
  }, ]
}, {
  gridProps: {
    key: randomKey(),
    className: 'variable_system_name',
  },
  formElements: [ {
    label: 'Variable System Name (Automatically generated if left blank)',
    name: 'variable_system_name',
    onChangeFilter: 'func:window.cleanVariableSystemName',
    passProps: {
      color: 'isPrimary',
    },
    layoutProps: {
      style: {
        textAlign: 'center',
        padding: 0,
      },
    },
  }, ]
}, {
  gridProps: {
    key: randomKey(),
    className: 'modal-footer-btns',
  },
  formElements: [ {
    type: 'submit',
    value: 'CREATE VARIABLE',
    passProps: {
      color: 'isPrimary',
    },
    layoutProps: {
      style: {
        textAlign: 'center',
        padding: 0,
      },
    },
  }, ]
}, ];

editHiddenFields = [ {
  form_name: '_id',
  form_val: '_id',
}, ];

COLLECTION_TABS[ 'variable' ].forEach(tab => {
  editFormgroups[ tab.location ] = COLLECTION_DETAIL_CONFIGS[ tab.location ][ 'variable' ];
})

let additionalComponents = [ {
  component: 'ResponsiveForm',
  comparisonprops: [ {
    'left': [ 'formdata', 'type' ],
    'operation': 'eq',
    'right': 'Input'
  }],
  props: {
    flattenFormData: true,
    footergroups: false,
    useFormOptions: true,
    onSubmit: {
      url: `/decision/api/standard_variables/:id?format=json`,
      params: [
        { 'key': ':id', 'val': '_id', },
      ],
      options: {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      },
      success: true,
      successCallback: 'func:this.props.refresh',
    },
    // validations: createValidations.output,
    hiddenFields: editHiddenFields,
    formgroups: [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        type: 'submit',
        value: 'SAVE',
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          className: 'global-button-save',
        }
      }, ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      card: {
        twoColumns: true,
        props: cardprops({
          cardTitle: 'Overview',
        }),
      },
      formElements: [ formElements({
        twoColumns: true,
        left: [
          {
            label: 'Variable Name',
            name: 'title',
            passProps: {
              state: 'isDisabled',
            },
          }, {
            label: 'Version',
            name: 'version',
            passProps: {
              state: 'isDisabled',
            },
          }, {
            name: 'type',
            label: 'Variable Type',
            type: 'dropdown',
            value: '',
            passProps: {
              selection: true,
              fluid: true,
              state: 'isDisabled'
            },
            layoutProps: {
            },
            options: VARIABLE_TYPES_DROPDOWN,
          }, {
            name: 'data_type',
            label: 'Data Type',
            type: 'dropdown',
            value: '',
            passProps: {
              selection: true,
              fluid: true,
            },
            layoutProps: {
            },
            options: DATA_TYPES_DROPDOWN,
          }, {
            name: 'status',
            label: 'Status',
            passProps: {
              state: 'isDisabled',
            }
          }
        ],
        right: [ {
          label: 'Created',
          name: 'formattedCreatedAt',
          passProps: {
            state: 'isDisabled',
          },
        }, {
          label: 'Updated',
          name: 'formattedUpdatedAt',
          passProps: {
            state: 'isDisabled',
          },
        }, {
          label: 'Description',
          name: 'description',
          type: 'textarea',
          sortable: false,
          headerColumnProps: {
            style: {
              whiteSpace: 'normal',
            },
          },
        }, ],
      }), ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      card: {
        props: cardprops({
          cardTitle: 'Dependencies',
          cardStyle: {
            marginBottom: 0,
          }
        }),
      },
      formElements: [ {
        type: 'datatable',
        name: 'rules',
        flattenRowData: true,
        useInputRows: false,
        addNewRows: false,
        ignoreTableHeaders: [ '_id', ],
        headers: [
          {
            label: 'Rule Name',
            sortid: 'name',
            sortable: false,
            headerColumnProps: {
              style: {
                width: '30%'
              },
            },
          }, {
            label: 'Version',
            sortid: 'version',
            sortable: false,
          }, {
            label: 'Type',
            sortid: 'type',
            sortable: false,
          }, {
            label: 'Status',
            sortid: 'status',
            sortable: false,
          }, {
            label: 'Updated',
            momentFormat: styles.momentFormat.birthdays,
            sortid: 'updatedat',
            sortable: false,
          }, {
            label: 'Description',
            sortid: 'description',
            sortable: false,
            headerColumnProps: {
              style: {
                width: '20%'
              },
            },
          }, {
            label: ' ',
            headerColumnProps: {
              style: {
                width: '45px',
              }
            },
            columnProps: {
              style: {
                whiteSpace: 'nowrap',
              }
            },
            buttons: [ {
              passProps: {
                buttonProps: {
                  icon: 'fa fa-pencil',
                  className: '__icon_button'
                },
                onClick: 'func:this.props.reduxRouter.push',
                onclickBaseUrl: '/decision/rules/:id/detail',
                onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
              },
            },
            ],
          }, ],
      }]
    }]
  },
  asyncprops: {
    formdata: [ 'variabledata', 'data' ],
    __formOptions: [ 'variabledata', 'formoptions' ],
  },
}, {
  component: 'ResponsiveForm',
  comparisonprops: [ {
    'left': [ 'formdata', 'type' ],
    'operation': 'eq',
    'right': 'Calculated'
  }],
  props: {
    flattenFormData: true,
    footergroups: false,
    useFormOptions: true,
    onSubmit: {
      url: `/decision/api/standard_variables/:id?format=json`,
      params: [
        { 'key': ':id', 'val': '_id', },
      ],
      options: {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      },
      success: true,
      successCallback: 'func:this.props.refresh',
    },
    // validations: createValidations.output,
    hiddenFields: editHiddenFields,
    formgroups: [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        type: 'submit',
        value: 'SAVE',
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          className: 'global-button-save',
        }
      }, ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      card: {
        twoColumns: true,
        props: cardprops({
          cardTitle: 'Overview',
        }),
      },
      formElements: [ formElements({
        twoColumns: true,
        left: [
          {
            label: 'Variable Name',
            name: 'title',
            passProps: {
              state: 'isDisabled',
            },
          }, {
            label: 'Version',
            name: 'version',
            passProps: {
              state: 'isDisabled',
            },
          }, {
            name: 'type',
            label: 'Variable Type',
            type: 'dropdown',
            value: '',
            passProps: {
              selection: true,
              fluid: true,
              state: 'isDisabled'
            },
            layoutProps: {
            },
            options: VARIABLE_TYPES_DROPDOWN,
          }, {
            name: 'data_type',
            label: 'Data Type',
            type: 'dropdown',
            value: '',
            passProps: {
              selection: true,
              fluid: true,
            },
            layoutProps: {
            },
            options: DATA_TYPES_DROPDOWN,
          }, {
            name: 'status',
            label: 'Status',
            passProps: {
              state: 'isDisabled',
            }
          }
        ],
        right: [ {
          label: 'Created',
          // momentFormat: styles.momentFormat.birthdays,
          name: 'formattedCreatedAt',
          passProps: {
            state: 'isDisabled',
          },
        }, {
          label: 'Updated',
          name: 'formattedUpdatedAt',
          // momentFormat: styles.momentFormat.birthdays,
          passProps: {
            state: 'isDisabled',
          },
        }, {
          label: 'Description',
          name: 'description',
          type: 'textarea',
          sortable: false,
          headerColumnProps: {
            style: {
              whiteSpace: 'normal',
            },
          },
        }, ],
      }), ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      card: {
        props: cardprops({
          cardTitle: 'Calculation',
          cardStyle: {
            marginBottom: 0,
          }
        }),
      },
      formElements: [ {
        type: 'layout',
        value: {
          component: 'div',
          bindprops: true,
          children: [ {
            component: 'span',
            thisprops: {
              children: [ 'formdata', 'state_property_attribute' ]
            },
          }, {
            component: 'span',
            children: ' =',
          }]
        }
      }, {
        name: 'value',
        type: 'code',
      }, ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      card: {
        props: cardprops({
          cardTitle: 'Variables Required for Calculation',
          cardStyle: {
            marginBottom: 0,
          }
        }),
      },
      formElements: [ {
        name: 'required_variables',
        label: 'Variables',
        type: 'dropdown',
        // validateOnChange: true,
        passProps: {
          selection: true,
          multiple: true,
          fluid: true,
          search: true,
        },
        layoutProps: {
        },
      }, ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      card: {
        props: cardprops({
          cardTitle: 'Dependencies',
          cardStyle: {
            marginBottom: 0,
          }
        }),
      },
      formElements: [ {
        type: 'layout',
        value: {
          component: 'ResponsiveTable',
          bindprops: true,
          thisprops: {
            rows: [ 'formdata', 'rules', ],
            numItems: [ 'formdata', 'numItems' ],
            numPages: [ 'formdata', 'numPages' ],
          },
          props: {
            flattenRowData: true,
            limit: 5,
            numItems: 5,
            numPages: 1,
            dataMap: [ {
              'key': 'rows',
              value: 'rows',
            }, {
              'key': 'numItems',
              value: 'numItems',
            }, {
              'key': 'numPages',
              value: 'numPages',
            }],
            hasPagination: true,
            simplePagination: true,
            // baseUrl: `/decision/api/standard_${options.collection}/:id`,
            'tableSearch': false,
            'simpleSearchFilter': false,
            headers: [
              {
                label: 'Rule Name',
                sortid: 'name',
                sortable: false,
                headerColumnProps: {
                  style: {
                    width: '30%'
                  },
                },
              }, {
                label: 'Version',
                sortid: 'version',
                sortable: false,
              }, {
                label: 'Type',
                sortid: 'type',
                sortable: false,
              }, {
                label: 'Status',
                sortid: 'status',
                sortable: false,
              }, {
                label: 'Updated',
                momentFormat: styles.momentFormat.birthdays,
                sortid: 'updatedat',
                sortable: false,
              }, {
                label: 'Description',
                sortid: 'description',
                sortable: false,
                headerColumnProps: {
                  style: {
                    width: '20%'
                  },
                },
              }, {
                label: ' ',
                headerColumnProps: {
                  style: {
                    width: '45px',
                  }
                },
                columnProps: {
                  style: {
                    whiteSpace: 'nowrap',
                  }
                },
                buttons: [ {
                  passProps: {
                    buttonProps: {
                      icon: 'fa fa-pencil',
                      className: '__icon_button'
                    },
                    onClick: 'func:this.props.reduxRouter.push',
                    onclickBaseUrl: '/decision/rules/:id/detail',
                    onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                  },
                },
                ],
              }, ],
          }
        }
      }
      ]
    }]
  },
  asyncprops: {
    formdata: [ 'variabledata', 'data' ],
    __formOptions: [ 'variabledata', 'formoptions' ],
  },
}, ]



const createConfigs = { validations: createValidations, hiddenFields: createHiddenFields, formgroups: createFormgroups };
const editConfigs = { validations: [], hiddenFields: editHiddenFields, formgroups: editFormgroups, };
module.exports = {
  create: createConfigs,
  edit: editConfigs,
}