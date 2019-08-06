'use strict';
const pluralize = require('pluralize');
const formConfigs = require('../../../../../utilities/views/decision/shared/components/formConfigs');
const decisionTabs = require('../../../../../utilities/views/decision/shared/components/decisionTabs');
const collectionDetailTabs = require('../../../../../utilities/views/decision/shared/components/collectionDetailTabs');
const detailAsyncHeaderTitle = require('../../../../../utilities/views/shared/component/layoutComponents').detailAsyncHeaderTitle;
const styles = require('../../../../../utilities/views/constants/styles');
const references = require('../../../../../utilities/views/constants/references');
const cardprops = require('../../../../../utilities/views/decision/shared/components/cardProps');
const strategyNavBar = require('./strategy_nav_bar');
const randomKey = Math.random;
const formGlobalButtonBar = require('../../../../../utilities/views/shared/component/globalButtonBar').formGlobalButtonBar;
const addPopulationButtons = require('./rule_dropdowns').addPopulationButtons;
const addRuleDropdown = require('./rule_dropdowns').addRuleDropdown;
const settings = {
  title: 'Strategy Detail',
  type: 'strategy',
  location: 'segment',
};

let { validations, hiddenFields, formgroups, additionalComponents } = formConfigs[ settings.type ].edit;
let pluralizedType = pluralize(settings.type);
let url = `/decision/api/standard_strategies/:id/segments/documentcreation/:index?method=editSegment`;

const SEGMENT = function (options) {
  let { init, currentSegment, } = options;
  let template_upload_modal = `/decision/strategies/add_documentcreation_template`;
  if (options.init) {
    return [
      decisionTabs(pluralizedType),
      detailAsyncHeaderTitle({ title: settings.title, type: settings.type, }),
      collectionDetailTabs({ tabname: settings.location, collection: settings.type }),
      {
        component: 'Container',
        props: {
          style: {
            display: 'flex',
          }
        },
        children: [
          {
            component: 'div',
            children: [ strategyNavBar(settings.type), ]
          },
          {
            component: 'ResponsiveForm',
            hasWindowFunc: true,
            props: {
              style: {
                flex: '1 1 auto',
              },
              ref: 'func:window.addRef',
              flattenFormData: true,
              footergroups: false,
              useFormOptions: true,
              onChange: 'func:window.checkPopulation',
              onSubmit: {
                url,
                params: [
                  { 'key': ':id', 'val': '_id', },
                ],
                options: {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  method: 'PUT',
                },
                successProps: {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                },
                successCallback: 'func:window.editFormSuccessCallback',
              },
              formgroups: [ formGlobalButtonBar({
                left: [],
                right: [ {
                  type: 'submit',
                  value: 'SAVE',
                  layoutProps: {
                    size: 'isNarrow',
                  },
                  passProps: {
                    color: 'isPrimary',
                  },
                }, {
                  guideButton: true,
                  location: references.guideLinks.decision[ '/strategies/:id/:type/:segment' ],
                } ]
              }), {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  twoColumns: true,
                  props: cardprops({
                    cardStyle: {
                      marginBottom: 0,
                    },
                    headerStyle: {
                      display: 'none',
                    }
                  }),
                },
                formElements: [ {
                  formGroupElementsLeft: [ {
                    label: 'Name',
                    keyUp: 'func:window.nameOnChange',
                    name: 'segment_name',
                    passProps: {
                      // state: 'isDisabled',
                    }
                  }, ],
                  formGroupElementsRight: [ {
                    label: 'Description',
                    name: 'segment_description',
                    passProps: {
                      // state: 'isDisabled',
                    }
                  }, ],
                } ],
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'documentcreation_rules',
                },
                card: {
                  props: cardprops({
                    cardTitle: 'Document Creation',
                    cardProps: {
                      className: 'primary-card-gradient',
                    },
                    cardStyle: {
                      marginBottom: 0,
                      marginTop: 20,
                    },
                  }),
                },
                formElements: [
                  {
                    type: 'layout',
                    value: {
                      component: 'p',
                      children: 'This module generates a PDF document and populates the document’s fillable fields.',
                      props: {
                        style: {
                          fontStyle: 'italic',
                          color: styles.colors.gray,
                        },
                      },
                    }
                  },
                  {
                    type: 'layout',
                    name: 'updated_ruleset',
                    value: {
                      component: 'div',
                    }
                  },
                  {
                    type: 'layout',
                    layoutProps: {
                      size: 'isNarrow',
                      style: {
                        display: 'inline-flex',
                        height: '55px',
                        alignItems: 'center',
                      }
                    },
                    value: addRuleDropdown([ {
                      name: 'CREATE NEW',
                      onclickProps: {
                        title: 'Add Document Template',
                        pathname: template_upload_modal,
                      },
                    }, {
                      name: 'COPY EXISTING',
                      onclickProps: {
                        title: 'Copy Existing Document Creation Template',
                        pathname: `/decision/strategies/:id/documentcreation/copy`,
                        params: [ { key: ':id', val: '_id', } ]
                      }
                    } ], 'ADD TEMPLATE'),
                  }, {
                    type: 'Semantic.checkbox',
                    label: 'Create document for a specific population',
                    passProps: {
                      className: 'reverse-label',
                    },
                    layoutProps: {
                      size: 'isNarrow',
                      style: {
                        display: 'inline-flex',
                        height: '55px',
                        float: 'right',
                        alignItems: 'center',
                      }
                    },
                    name: 'has_population',
                  } ],
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'population_rules',
                },
                card: {
                  props: cardprops({
                    cardTitle: 'Population Rules',
                    cardProps: {
                      className: 'primary-card-gradient',
                    },
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [
                  {
                    type: 'layout',
                    name: 'updated_conditions',
                    value: {
                      component: 'div',
                    }
                  },
                  {
                    type: 'dndtable',
                    name: 'conditions',
                    hasWindowFunction: true,
                    submitOnChange: true,
                    handleRowUpdate: 'func:window.handleRowUpdate',
                    flattenRowData: true,
                    useInputRows: false,
                    addNewRows: false,
                    passProps: {
                      itemHeight: 45,
                      className: 'dnd-text-table dnd-and',
                    },
                    ignoreTableHeaders: [ '_id', ],
                    headers: [{
                      label: {
                        component: 'Columns',
                        children: [{
                          component: 'Column',
                          props: {
                            size: 'is5',
                          },
                          children: 'Variable',
                        }, {
                          component: 'Column',
                          props: {
                            size: 'is3',
                          },
                          children: 'Comparison',
                        }, {
                          component: 'Column',
                          props: {
                            size: 'is4',
                          },
                          children: 'Value',
                        }]
                      },
                      sortid: 'combined_value_comparison_property',
                      sortable: false,
                    }, {
                      label: ' ',
                      sortid: 'buttons',
                      sortable: false,
                      columnProps: {
                        style: {
                          width: '90px',
                        }
                      },
                    }, ],
                  }, {
                    type: 'layout',
                    value: addPopulationButtons()
                  }, ],
              }, ],
            },
            asyncprops: {
              formdata: [ `${settings.type}data`, 'data' ],
              __formOptions: [ `${settings.type}data`, 'formsettings' ],
            },
          }, ]
      } ]
  } else {
    return [
      decisionTabs(pluralizedType),
      detailAsyncHeaderTitle({ title: settings.title, type: settings.type, }),
      collectionDetailTabs({ tabname: settings.location, collection: settings.type }),
      {
        component: 'Container',
        props: {
          style: {
            display: 'flex',
          }
        },
        children: [
          {
            component: 'div',
            children: [ strategyNavBar(settings.type), ]
          },
          {
            component: 'ResponsiveForm',
            hasWindowFunc: true,
            props: {
              style: {
                flex: '1 1 auto',
              },
              ref: 'func:window.addRef',
              flattenFormData: true,
              footergroups: false,
              useFormOptions: true,
              onChange: 'func:window.checkPopulation',
              onSubmit: {
                url,
                params: [
                  { 'key': ':id', 'val': '_id', },
                ],
                options: {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  method: 'PUT',
                },
                successProps: {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                },
                successCallback: 'func:window.editFormSuccessCallback',
              },
              formgroups: [ formGlobalButtonBar({
                left: [],
                right: [ {
                  type: 'submit',
                  value: 'SAVE',
                  layoutProps: {
                    size: 'isNarrow',
                  },
                  passProps: {
                    color: 'isPrimary',
                  },
                }, {
                  guideButton: true,
                  location: references.guideLinks.decision[ '/strategies/:id/:type/:segment' ],
                } ]
              }), {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  twoColumns: true,
                  props: cardprops({
                    cardStyle: {
                      marginBottom: 0,
                    },
                    headerStyle: {
                      display: 'none',
                    }
                  }),
                },
                formElements: [ {
                  formGroupElementsLeft: [ {
                    label: 'Name',
                    keyUp: 'func:window.nameOnChange',
                    name: 'segment_name',
                    passProps: {
                      // state: 'isDisabled',
                    }
                  }, ],
                  formGroupElementsRight: [ {
                    label: 'Description',
                    name: 'segment_description',
                    passProps: {
                      // state: 'isDisabled',
                    }
                  }, ],
                } ],
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'documentcreation_rules',
                },
                card: {
                  props: cardprops({
                    cardTitle: 'Document Creation',
                    cardProps: {
                      className: 'primary-card-gradient',
                    },
                    cardStyle: {
                      marginBottom: 0,
                      marginTop: 20,
                    },
                  }),
                },
                formElements: [
                  {
                    type: 'layout',
                    value: {
                      component: 'p',
                      children: 'This module generates a PDF document and populates the document’s fillable fields.',
                      props: {
                        style: {
                          fontStyle: 'italic',
                          color: styles.colors.gray,
                        },
                      },
                    }
                  },
                  {
                    type: 'layout',
                    name: 'updated_ruleset',
                    value: {
                      component: 'div',
                    }
                  },
                  {
                    type: 'datatable',
                    name: 'inputs',
                    flattenRowData: true,
                    useInputRows: false,
                    addNewRows: false,
                    ignoreTableHeaders: [ '_id', ],
                    headers: [ {
                      label: 'Field Name',
                      sortid: 'display_name',
                      sortable: false,
                    }, {
                      label: 'Variable Used',
                      sortable: false,
                      sortid: 'input_variable',
                    }, ],
                  },
                  {
                    type: 'layout',
                    layoutProps: {
                      size: 'isNarrow',
                      style: {
                        display: 'inline-flex',
                        height: '55px',
                        alignItems: 'center',
                      }
                    },
                    value: {
                      component: 'ResponsiveButton',
                      thisprops: {
                        onclickPropObject: [ 'formdata' ],
                      },
                      props: {
                        onClick: 'func:this.props.createModal',
                        onclickProps: {
                          title: 'Variables Required By Document',
                          pathname: `/modal/required_documentcreation_variables/:id`,
                          params: [ { key: ':id', val: '_id', }, ],
                        },
                        buttonProps: {
                          color: 'isPrimary'
                        },
                      },
                      children: 'EDIT',
                    }
                  }, {
                    type: 'layout',
                    layoutProps: {
                      size: 'isNarrow',
                      style: {
                        display: 'inline-flex',
                        height: '55px',
                        alignItems: 'center',
                      }
                    },
                    value: {
                      component: 'ResponsiveButton',
                      children: 'DOWNLOAD RESULTS',
                      props: {
                        'onclickBaseUrl': `/decision/api/download_document_template/${encodeURI(currentSegment.filename)}?`,
                        aProps: {
                          className: '__re-bulma_button __re-bulma_is-success',
                        },
                      },
                    },
                  }, {
                    type: 'layout',
                    layoutProps: {
                      size: 'isNarrow',
                      style: {
                        display: 'inline-flex',
                        height: '55px',
                        alignItems: 'center',
                      }
                    },
                    value: addRuleDropdown([ {
                      name: 'CREATE NEW',
                      onclickProps: {
                        title: 'Add Document Template',
                        pathname: template_upload_modal,
                      },
                    }, {
                      name: 'COPY EXISTING',
                      onclickProps: {
                        title: 'Copy Existing Document Creation Template',
                        pathname: `/decision/strategies/:id/documentcreation/copy`,
                        params: [ { key: ':id', val: '_id', } ]
                      }
                    } ], 'ADD TEMPLATE'),
                  }, {
                    type: 'Semantic.checkbox',
                    label: 'Create document for a specific population',
                    passProps: {
                      className: 'reverse-label',
                    },
                    layoutProps: {
                      size: 'isNarrow',
                      style: {
                        display: 'inline-flex',
                        height: '55px',
                        float: 'right',
                        alignItems: 'center',
                      }
                    },
                    name: 'has_population',
                  } ],
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'population_rules',
                },
                card: {
                  props: cardprops({
                    cardTitle: 'Population Rules',
                    cardProps: {
                      className: 'primary-card-gradient',
                    },
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [
                  {
                    type: 'layout',
                    name: 'updated_conditions',
                    value: {
                      component: 'div',
                    }
                  },
                  {
                    type: 'dndtable',
                    name: 'conditions',
                    hasWindowFunction: true,
                    submitOnChange: true,
                    handleRowUpdate: 'func:window.handleRowUpdate',
                    flattenRowData: true,
                    useInputRows: false,
                    addNewRows: false,
                    passProps: {
                      itemHeight: 45,
                    },
                    ignoreTableHeaders: [ '_id', ],
                    headers: [{
                      label: {
                        component: 'Columns',
                        children: [{
                          component: 'Column',
                          props: {
                            size: 'is5',
                          },
                          children: 'Variable',
                        }, {
                          component: 'Column',
                          props: {
                            size: 'is3',
                          },
                          children: 'Comparison',
                        }, {
                          component: 'Column',
                          props: {
                            size: 'is4',
                          },
                          children: 'Value',
                        }]
                      },
                      sortid: 'combined_value_comparison_property',
                      sortable: false,
                    }, {
                      label: ' ',
                      sortid: 'buttons',
                      sortable: false,
                      columnProps: {
                        style: {
                          width: '90px',
                        }
                      },
                    }, ],
                  }, {
                    type: 'layout',
                    value: addPopulationButtons()
                  }, ],
              }, ],
            },
            asyncprops: {
              formdata: [ `${settings.type}data`, 'data' ],
              __formOptions: [ `${settings.type}data`, 'formsettings' ],
            },
          }, ]
      } ]

  }
}

module.exports = SEGMENT;