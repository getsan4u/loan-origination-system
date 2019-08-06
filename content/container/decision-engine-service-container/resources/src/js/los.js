'use strict';
exports.init = function () {

  function losKeyInfoValueFilter(currState, formElementsQueue, formElement, prevState) {
    let prevVarType = prevState.value_type;
    let currVarType = currState.value_type;
    if (currVarType === undefined && prevVarType === undefined) return {
      name: 'value',
      label: 'Value',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    };
    if (currVarType === prevVarType) return formElement;
    let varType = currVarType ? currVarType : prevVarType;
    if (varType === 'monetary') {
      return {
        type: 'maskedinput',
        name: 'value',
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
        layoutProps: {
          style: {
            width: '70%',
            paddingRight: '7px',
            display: 'inline-block',
            verticalAlign: 'top',
          },
        },
        label: 'Value',
      }
    } else if (varType === 'percentage') {
      return {
        type: 'maskedinput',
        name: 'value',
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
        layoutProps: {
          style: {
            width: '70%',
            paddingRight: '7px',
            display: 'inline-block',
            verticalAlign: 'top',
          },
        },
        label: 'Value',
      }
    } else if (varType === 'number') {
      return {
        type: 'maskedinput',
        name: 'value',
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
        layoutProps: {
          style: {
            width: '70%',
            paddingRight: '7px',
            display: 'inline-block',
            verticalAlign: 'top',
          },
        },
        label: 'Value',
      }
    } else if (varType === 'date') {
      return {
        type: 'singleDatePicker',
        leftIcon: 'fas fa-calendar-alt',
        name: 'value',
        label: 'Value',
        passProps: {
          placeholder: '',
          hideKeyboardShortcutsPanel: true,
        },
        layoutProps: {
          style: {
            width: '70%',
            paddingRight: '7px',
            display: 'inline-block',
            verticalAlign: 'top',
          }
        },
      };
    } else if (varType === 'boolean') {
      return {
        label: 'Value',
        type: 'dropdown',
        name: 'value',
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
        } ],
        layoutProps: {
          style: {
            width: '70%',
            paddingRight: '7px',
            display: 'inline-block',
            verticalAlign: 'top',
          }
        },
      };
    } else {
      return {
        name: 'value',
        label: 'Value',
        layoutProps: {
          style: {
            width: '70%',
            paddingRight: '7px',
            display: 'inline-block',
            verticalAlign: 'top',
          },
        },
      };
    }
  }
  window.losKeyInfoValueFilter = losKeyInfoValueFilter;

  function losTemplateFieldValueFilter(currState, formElementsQueue, formElement, prevState) {
    let prevVarType = prevState.value_type;
    let currVarType = currState.value_type;
    if (currVarType === undefined && prevVarType === undefined) return {
      name: 'value',
      label: 'Value',
      customLabel: {
        component: 'span',
        thisprops: {
          children: [ 'formdata', 'name' ],
        },
      },
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    };
    if (currVarType === prevVarType) return formElement;
    let varType = currVarType ? currVarType : prevVarType;
    if (varType === 'variable') {
      return {
        label: 'Value',
        type: 'dropdown',
        name: 'value',
        passProps: {
          selection: true,
          fluid: true,
          selectOnBlur: false,
        },
        customLabel: {
          component: 'span',
          thisprops: {
            children: [ 'formdata', 'name' ],
          },
        },
        value: 'true',
        layoutProps: {
          style: {
            width: '70%',
            paddingRight: '7px',
            display: 'inline-block',
            verticalAlign: 'top',
          }
        },
      };
    } else {
      return {
        name: 'value',
        label: 'Value',
        customLabel: {
          component: 'span',
          thisprops: {
            children: [ 'formdata', 'name' ],
          },
        },
        layoutProps: {
          style: {
            width: '70%',
            paddingRight: '7px',
            display: 'inline-block',
            verticalAlign: 'top',
          },
        },
      };
    }
  }
  window.losTemplateFieldValueFilter = losTemplateFieldValueFilter;

  function losGenerateDocFieldValueFilter(currState, formElementsQueue, formElement, prevState) {
    if (formElement.field_num !== undefined) {
      let field_num = formElement.field_num;
      let prevVarType = prevState[ `fields.${field_num}.value_type` ];
      let currVarType = currState[ `fields.${field_num}.value_type` ];
      if (currVarType === undefined && prevVarType === undefined) return {
        name: `fields.${field_num}.value`,
        field_num,
        layoutProps: {
          style: {
            width: '70%',
            paddingRight: '7px',
            display: 'inline-block',
            verticalAlign: 'top',
          },
        },
        customLabel: formElement.customLabel,
      };
      if (currVarType === prevVarType) return formElement;
      let varType = currVarType ? currVarType : prevVarType;
      if (varType === 'variable') {
        let variableDropdown = (prevState && prevState.__formOptions && prevState.__formOptions.variableDropdown) ? prevState.__formOptions.variableDropdown : [];
        return {
          type: 'dropdown',
          name: `fields.${field_num}.value`,
          field_num,
          passProps: {
            fluid: true,
            selection: true,
            selectOnBlur: false,
          },
          layoutProps: {
            style: {
              width: '70%',
              paddingRight: '7px',
              display: 'inline-block',
              verticalAlign: 'top',
            },
          },
          customLabel: formElement.customLabel,
          options: variableDropdown,
        };
      } else {
        return {
          name: `fields.${field_num}.value`,
          field_num,
          layoutProps: {
            style: {
              width: '70%',
              paddingRight: '7px',
              display: 'inline-block',
              verticalAlign: 'top',
            },
          },
          customLabel: formElement.customLabel,
        };
      }
    } else {
      return formElement;
    }
  }
  window.losGenerateDocFieldValueFilter = losGenerateDocFieldValueFilter;

  function losCreateAppCustomerNameFilter(currState, formElementsQueue, formElement, prevState) {
    let product_types = prevState.product_types || {};
    let prevVarType = prevState.product ? product_types[ prevState.product ] : '';
    let currVarType = currState.product ? product_types[ currState.product ] : '';
    if (!currVarType && !prevVarType) {
      formElement.options = prevState.__formOptions.peopleDropdown.concat(prevState.__formOptions.companiesDropdown);
      return formElement;
    }
    if (currVarType === prevVarType) return formElement;
    let varType = currVarType ? currVarType : prevVarType;

    if (varType === 'person') {
      formElement.options = prevState.__formOptions.peopleDropdown;
      return formElement;
    } else {
      formElement.options = prevState.__formOptions.companiesDropdown;
      return formElement;
    }
  }
  window.losCreateAppCustomerNameFilter = losCreateAppCustomerNameFilter;

  function losProductItemValueFilter(currState, formElementsQueue, formElement, prevState) {
    let prevVarType = prevState.value_type;
    let currVarType = currState.value_type;
    if (currVarType === undefined && prevVarType === undefined) return {
      name: 'value',
      customLabel: {
        component: 'span',
        children: [ {
          component: 'span',
          children: 'Default Value',
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
    if (currVarType === prevVarType) return formElement;
    let varType = currVarType ? currVarType : prevVarType;
    if (varType === 'monetary') {
      return {
        type: 'maskedinput',
        name: 'value',
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
            children: 'Default Value',
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
      }
    } else if (varType === 'percentage') {
      return {
        type: 'maskedinput',
        name: 'value',
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
            children: 'Default Value',
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
      }
    } else if (varType === 'number') {
      return {
        type: 'maskedinput',
        name: 'value',
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
            children: 'Default Value',
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
      }
    } else if (varType === 'date') {
      return {
        type: 'singleDatePicker',
        leftIcon: 'fas fa-calendar-alt',
        name: 'value',
        passProps: {
          placeholder: '',
          hideKeyboardShortcutsPanel: true,
        },
        customLabel: {
          component: 'span',
          children: [ {
            component: 'span',
            children: 'Default Value',
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
    } else if (varType === 'boolean') {
      return {
        type: 'dropdown',
        name: 'value',
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
        } ],
        customLabel: {
          component: 'span',
          children: [ {
            component: 'span',
            children: 'Default Value',
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
    } else {
      return {
        name: 'value',
        customLabel: {
          component: 'span',
          children: [ {
            component: 'span',
            children: 'Default Value',
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
  window.losProductItemValueFilter = losProductItemValueFilter;

  function filterAutomationModuleName(currState, formElementsQueue, formElement, prevState) {
    const curr_type = (currState[ 'type' ]) ? currState[ 'type' ] : prevState[ 'type' ];
    const prev_type = prevState[ 'type' ];
    const dynamic_modules = [ 'strategy', 'mlmodel', 'scenario' ];
    if ((currState[ 'type' ] !== prevState[ 'type' ])) {
      if (curr_type === 'decision' && formElement.name !== 'strategy') {
        formElementsQueue.push({
          name: 'strategy',
          label: 'Strategy Name',
          value: '',
          type: 'dropdown',
          errorIconRight: true,
          validateOnChange: true,
          errorIcon: 'fa fa-exclamation',
          validIcon: 'fa fa-check',
          options: [],
          passProps: {
            selection: true,
            fluid: true,
            search: true,
            selectOnBlur: false,
          },
          layoutProps: {
          },
        });
        return false;
      } else if (curr_type === 'ml' && formElement.name !== 'mlmodel') {
        formElementsQueue.push({
          name: 'mlmodel',
          label: 'Model Name',
          value: '',
          type: 'dropdown',
          errorIconRight: true,
          validateOnChange: true,
          errorIcon: 'fa fa-exclamation',
          validIcon: 'fa fa-check',
          options: [],
          passProps: {
            selection: true,
            fluid: true,
            search: true,
            selectOnBlur: false,
          },
          layoutProps: {
          },
        });
        return false;
      } else if (curr_type === 'wizard' && formElement.name !== 'scenario') {
        formElementsQueue.push({
          name: 'scenario',
          label: 'Scenario Name',
          validateOnBlur: true,
          onBlur: true,
          errorIconRight: true,
          errorIcon: 'fa fa-exclamation',
          validIcon: 'fa fa-check',
        });
        return false;
      } else {
        return formElement;
      }
    } else {
      return formElement;
    }
  }
  window.filterAutomationModuleName = filterAutomationModuleName;

  function losHasCoApplicantFilter(currState, formElementsQueue, formElement, prevState) {
    if ((currState[ 'has_coapplicant' ] !== prevState[ 'has_coapplicant' ])) {
      if (currState[ 'has_coapplicant' ]) {
        formElementsQueue.push({
          name: 'coapplicant',
          label: 'Co-Applicant Name',
          leftIcon: 'fas fa-user-friends',
          type: 'dropdown',
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
        });
      }
    }
    return formElement;
  }
  window.losHasCoApplicantFilter = losHasCoApplicantFilter;

  function losNewCustomerHasCoApplicantFilter(currState, formElementsQueue, formElement, prevState) {
    if ((currState[ 'has_coapplicant' ] !== prevState[ 'has_coapplicant' ])) {
      if (currState[ 'has_coapplicant' ]) {
        formElementsQueue.push({
          name: 'coapplicant',
          label: 'Co-Applicant Name',
          leftIcon: 'fas fa-user',
        });
      }
    }
    return formElement;
  }
  window.losNewCustomerHasCoApplicantFilter = losNewCustomerHasCoApplicantFilter;

  function losNewCustomerCoApplicantFilter(currState, formElementsQueue, formElement, prevState) {
    let prevHasCoapplicant = prevState[ 'has_coapplicant' ];
    let currHasCoapplicant = currState[ 'has_coapplicant' ];
    if ((currHasCoapplicant && !prevHasCoapplicant) || (currHasCoapplicant && prevHasCoapplicant)) {
      return formElement;
    } else {
      return false;
    }
  }
  window.losNewCustomerCoApplicantFilter = losNewCustomerCoApplicantFilter;

  function losCoApplicantFilter(currState, formElementsQueue, formElement, prevState) {
    let prevHasCoapplicant = prevState[ 'has_coapplicant' ];
    let currHasCoapplicant = currState[ 'has_coapplicant' ];
    if ((currHasCoapplicant && !prevHasCoapplicant) || (currHasCoapplicant && prevHasCoapplicant)) {
      let product_types = prevState.product_types || {};
      let prevVarType = prevState.product ? product_types[ prevState.product ] : '';
      let currVarType = currState.product ? product_types[ currState.product ] : '';
      if (!currVarType && !prevVarType) {
        formElement.options = prevState.__formOptions.peopleDropdown.concat(prevState.__formOptions.companiesDropdown);
        return formElement;
      }
      let varType = currVarType ? currVarType : prevVarType;

      if (varType === 'person') {
        formElement.options = prevState.__formOptions.peopleDropdown;
        return formElement;
      } else {
        formElement.options = prevState.__formOptions.companiesDropdown;
        return formElement;
      }
    } else {
      return false;
    }
  }
  window.losCoApplicantFilter = losCoApplicantFilter;

  function testAutomationType(currState, formElementsQueue, formElement, prevState) {
    const formVal = formElement.value;
    if (!currState.type && prevState && prevState.module_active_status) {
      if (!prevState.module_active_status[ formVal ]) {
        formElement.customLabel.children = [ formElement.customLabel.children[ 0 ], {
          component: 'span',
          children: 'Not Active',
          props: {
            style: {
              position: 'absolute',
              top: '15px',
              right: '20px',
            }
          }
        }, ...formElement.customLabel.children.slice(formElement.customLabel.children.length - 2) ];
        formElement.labelProps = {
          style: {
            backgroundColor: '#efefef',
            pointerEvents: 'none',
            opacity: 0.9,
          },
        }
      } else {
        delete formElement.labelProps.style;
      }
    }
    return formElement;
  }
  window.testAutomationType = testAutomationType;

  function provideAdditionalPersonFilter(currState, formElementsQueue, formElement, prevState) {
    let prevAdditional = prevState.additional;
    let currAdditional = currState.additional;
    const style = {
      fontStyle: 'italic',
      marginLeft: '2px',
      fontWeight: 'normal',
      color: '#969696',
    };
    if (currAdditional && !prevAdditional) {
      formElementsQueue.push(
        {
          name: 'job_title',
          type: 'text',
          leftIcon: 'fas fa-user-tag',
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Job Title',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        },
        {
          name: 'company',
          type: 'dropdown',
          leftIcon: 'fas fa-building',
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
              children: 'Company',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        }, {
          name: 'email',
          type: 'text',
          leftIcon: 'fas fa-envelope',
          layoutProps: {
            style: {
              width: '50%',
              paddingRight: '7px',
              display: 'inline-block',
              verticalAlign: 'top',
            },
          },
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Email Address',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        },
        {
          type: 'maskedinput',
          name: 'phone',
          leftIcon: 'fas fa-phone icon rotated',
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Phone Number',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
          layoutProps: {
            style: {
              width: '50%',
              display: 'inline-block',
              verticalAlign: 'top',
            },
          },
          passProps: {
            guide: false,
            mask: 'func:window.phoneNumberFormatter',
            autoComplete: 'off',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            spellCheck: false,
          },
        }, {
          name: 'address',
          leftIcon: 'far fa-map-marker-alt',
          type: 'text',
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Home Address',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        },
        {
          name: 'dob',
          type: 'singleDatePicker',
          leftIcon: 'fas fa-calendar-alt',
          layoutProps: {
            style: {
              width: '50%',
              paddingRight: '7px',
              display: 'inline-block',
              verticalAlign: 'top',
            },
          },
          passProps: {
            placeholder: '',
            hideKeyboardShortcutsPanel: true,
          },
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Date of Birth',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        },
        {
          type: 'maskedinput',
          name: 'ssn',
          leftIcon: 'fas fa-lock-alt',
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Social Security Number',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
          layoutProps: {
            style: {
              width: '50%',
              display: 'inline-block',
              verticalAlign: 'top',
            },
          },
          passProps: {
            mask: 'func:window.SSNFormatter',
            guide: false,
            autoComplete: 'off',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            spellCheck: false,
          },
        }, ...this.props.additionalFormElements
      );
    }
    return formElement;
  }

  window.provideAdditionalPersonFilter = provideAdditionalPersonFilter;

  function provideAdditionalCompanyFilter(currState, formElementsQueue, formElement, prevState) {
    let prevAdditional = prevState.additional;
    let currAdditional = currState.additional;
    const style = {
      fontStyle: 'italic',
      marginLeft: '2px',
      fontWeight: 'normal',
      color: '#969696',
    };
    if (currAdditional && !prevAdditional) {
      formElementsQueue.push(
        {
          name: 'industry',
          leftIcon: 'fas fa-industry-alt',
          type: 'text',
          layoutProps: {
            style: {
              width: '50%',
              paddingRight: '7px',
              display: 'inline-block',
              verticalAlign: 'top',
            },
          },
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Industry',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        },
        {
          name: 'company_type',
          leftIcon: 'fas fa-archive',
          type: 'dropdown',
          layoutProps: {
            style: {
              width: '50%',
              display: 'inline-block',
              verticalAlign: 'top',
            },
          },
          passProps: {
            selection: true,
            fluid: true,
            search: true,
            selectOnBlur: false,
          },
          options: [ {
            label: '',
            value: '',
          }, {
            label: 'Sole Proprietor',
            value: 'sole_proprietor',
          }, {
            label: 'Limited Liability Company (LLC)',
            value: 'llc',
          }, {
            label: 'Corporation',
            value: 'corporation',
          }, {
            label: 'General Partnership',
            value: 'general_partnership',
          }, {
            label: 'Limited Partnership (LP)',
            value: 'lp',
          }, {
            label: 'Limited Liability Partnership (LLP)',
            value: 'llp',
          }, {
            label: 'Non Profit',
            value: 'non_profit',
          }, ],
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Entity Type',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        }, {
          name: 'primary_contact',
          leftIcon: 'fas fa-address-book',
          type: 'dropdown',
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
              children: 'Primary Contact Person',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        },
        {
          name: 'address',
          leftIcon: 'far fa-map-marker-alt',
          type: 'text',
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Corporate Address',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        }, {
          name: 'website',
          leftIcon: 'far fa-globe',
          type: 'text',
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Website',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        },
        {
          name: 'ein',
          leftIcon: 'fas fa-id-badge',
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Employer Identification Number',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
          type: 'maskedinput',
          errorIconRight: true,
          errorIcon: 'fa fa-exclamation',
          createNumberMask: true,
          passProps: {
            mask: 'func:window.taxIdInputLimit',
            guide: false,
            autoComplete: 'off',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            spellCheck: false,
          },
        }, ...this.props.additionalFormElements
      );
    }
    return formElement;
  }

  window.provideAdditionalCompanyFilter = provideAdditionalCompanyFilter;


  function provideAdditionalIntermediaryFilter(currState, formElementsQueue, formElement, prevState) {
    let prevAdditional = prevState.additional;
    let currAdditional = currState.additional;
    const style = {
      fontStyle: 'italic',
      marginLeft: '2px',
      fontWeight: 'normal',
      color: '#969696',
    };
    if (currAdditional && !prevAdditional) {
      formElementsQueue.push(
        {
          name: 'type',
          type: 'dropdown',
          leftIcon: 'fas fa-archive',
          passProps: {
            selection: true,
            fluid: true,
            selectOnBlur: false,
          },
          options: [ {
            label: '',
            value: '',
          }, {
            label: 'Affiliate',
            value: 'affiliate',
          }, {
            label: 'Broker',
            value: 'broker',
          }, {
            label: 'Contractor',
            value: 'contractor',
          }, {
            label: 'Dealer',
            value: 'dealer',
          }, {
            label: 'Retailer',
            value: 'retailer',
          }, {
            label: 'Other',
            value: 'other',
          }, ],
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Intermediary Type',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        }, {
          name: 'primary_contact',
          type: 'dropdown',
          leftIcon: 'fas fa-address-book',
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
              children: 'Primary Contact Person',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        },
        {
          name: 'address',
          type: 'text',
          leftIcon: 'far fa-map-marker-alt',
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Corporate Address',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        }, {
          name: 'website',
          leftIcon: 'far fa-globe',
          type: 'text',
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Website',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
        },
        {
          name: 'ein',
          leftIcon: 'far fa-id-badge',
          customLabel: {
            component: 'span',
            children: [ {
              component: 'span',
              children: 'Employer Identification Number',
            }, {
              component: 'span',
              children: 'Optional',
              props: {
                style,
              }
            } ]
          },
          type: 'maskedinput',
          errorIconRight: true,
          errorIcon: 'fa fa-exclamation',
          createNumberMask: true,
          passProps: {
            mask: 'func:window.taxIdInputLimit',
            guide: false,
            autoComplete: 'off',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            spellCheck: false,
          },
        }, ...this.props.additionalFormElements
      );
    }
    return formElement;
  }

  window.provideAdditionalIntermediaryFilter = provideAdditionalIntermediaryFilter;


  function provideAdditionalDependencyFilter(currState, formElementsQueue, formElement, prevState) {
    let prevAdditional = prevState.additional;
    let currAdditional = currState.additional;
    if (currAdditional && !prevAdditional) {
      return formElement;
    } else if (currAdditional && prevAdditional) {
      return formElement;
    } else {
      return false;
    }
  }

  window.provideAdditionalDependencyFilter = provideAdditionalDependencyFilter;
};