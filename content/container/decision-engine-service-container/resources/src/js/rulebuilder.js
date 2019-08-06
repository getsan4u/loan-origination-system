'use strict';
exports.init = function () {
  function isCurrentCondition(options) {
    let { index, formElement, prevState, currState } = options;
    let currRuleCount = (currState[ 'rule_index' ] === undefined && prevState[ 'rule_index' ] !== undefined) ? prevState[ 'rule_index' ] : currState[ 'rule_index' ];
    if (index === 0 || (currState[ 'rule_index' ] && (currState[ 'rule_index' ] === prevState[ 'rule_index' ]))) {
      return formElement;
    } else if (index <= currRuleCount) {
      return formElement;
    } else {
      return false;
    }
  }
  window.isCurrentCondition = isCurrentCondition;
  function formElementExistsTwo(formElementsQueue, value) {
    let exists = formElementsQueue.reduce((exists, element) => {
      return (exists || (element.name === value)) ? true : false;
    }, false);
    return exists;
  }
  window.formElementExistsTwo = formElementExistsTwo;

  function getVariableTypeTwo(prevState, currState, formElement) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let stateAttribute = `rule*${index}*state_property_attribute`;
    return (currState[ stateAttribute ]) ? prevState.variable_types[ currState[ stateAttribute ] ] : prevState.variable_types[ prevState[ stateAttribute ] ];
  }
  window.getVariableTypeTwo = getVariableTypeTwo;

  function getComparatorDropdownTwo(type) {
    switch (type) {
      case 'Boolean':
        return [ {
          label: ' ',
          value: '',
        }, {
          label: '=',
          value: 'EQUAL',
        }, {
          label: '<>',
          value: 'NOT EQUAL'
        }, {
          label: 'Is Null',
          value: 'IS NULL',
        }, {
          label: 'Is Not Null',
          value: 'IS NOT NULL',
        } ];
      case 'Date':
        return [ {
          label: ' ',
          value: '',
        }, {
          label: '=',
          value: 'EQUAL',
        }, {
          label: '<>',
          value: 'NOT EQUAL'
        }, {
          label: '>=',
          value: 'FLOOR',
        }, {
          label: '<=',
          value: 'CAP',
        }, {
          label: '>',
          value: 'GT',
        }, {
          label: '<',
          value: 'LT',
        }, {
          label: 'Between',
          value: 'RANGE',
        }, {
          label: 'Is Null',
          value: 'IS NULL',
        }, {
          label: 'Is Not Null',
          value: 'IS NOT NULL',
        } ];
      case 'String':
        return [ {
          label: ' ',
          value: '',
        }, {
          label: '=',
          value: 'EQUAL',
        }, {
          label: '<>',
          value: 'NOT EQUAL'
        }, {
          label: 'In',
          value: 'IN',
        }, {
          label: 'Not In',
          value: 'NOT IN',
        }, {
          label: 'Is Null',
          value: 'IS NULL',
        }, {
          label: 'Is Not Null',
          value: 'IS NOT NULL',
        } ];
      default:
        return [ {
          label: ' ',
          value: '',
        }, {
          label: '=',
          value: 'EQUAL',
        }, {
          label: '<>',
          value: 'NOT EQUAL'
        }, {
          label: '>=',
          value: 'FLOOR',
        }, {
          label: '<=',
          value: 'CAP',
        }, {
          label: '>',
          value: 'GT',
        }, {
          label: '<',
          value: 'LT',
        }, {
          label: 'Between',
          value: 'RANGE',
        }, {
          label: 'In',
          value: 'IN',
        }, {
          label: 'Not In',
          value: 'NOT IN',
        },
        {
          label: 'Is Null',
          value: 'IS NULL',
        }, {
          label: 'Is Not Null',
          value: 'IS NOT NULL',
        } ];
    }
  }
  window.getComparatorDropdownTwo = getComparatorDropdownTwo;

  function numberMaskTwo() {
    return {
      prefix: '',
      suffix: '',
      allowDecimal: true,
      allowNegative: true,
      decimalLimit: 4,
    };
  }
  window.numberMaskTwo = numberMaskTwo;

  function variableTypeFilterTwo(currState, formElementsQueue, formElement, prevState) {
    let prevVarType = getVariableTypeTwo(prevState, {}, formElement);
    let currVarType = getVariableTypeTwo(prevState, currState, formElement);
    let varChange = prevVarType !== currVarType;
    currVarType = currVarType ? currVarType : prevVarType;
    formElement.value.children[ 1 ].props.value = currVarType;
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    return isCurrentCondition({ index, formElement, prevState, currState });
  }
  window.variableTypeFilterTwo = variableTypeFilterTwo;

  function comparatorFilterTwo(currState, formElementsQueue, formElement, prevState) {
    let prevVarType = getVariableTypeTwo(prevState, {}, formElement);
    let currVarType = getVariableTypeTwo(prevState, currState, formElement);
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let isCurrent = isCurrentCondition({ index, formElement, prevState, currState });
    let varChange = prevVarType !== currVarType;
    currVarType = currVarType ? currVarType : prevVarType;
    let turnRange = (currVarType === 'Number' || currVarType === 'Date') && ((!currState[ `rule*${index}*condition_test` ] && prevState[ `rule*${index}*condition_test` ] === 'RANGE') || (prevState[ `rule*${index}*condition_test` ] !== 'RANGE' && currState[ `rule*${index}*condition_test` ] === 'RANGE'));
    let hasProp = turnRange ? formElementExistsTwo(formElementsQueue, `rule*${index}*state_property_attribute_value_minimum`) : formElementExistsTwo(formElementsQueue, `rule*${index}*state_property_attribute_value_comparison`);
    formElement.options = getComparatorDropdownTwo(currVarType);
    let comparatorIsNull = (!currState[ `rule*${index}*condition_test` ] && (prevState[ `rule*${index}*condition_test` ] === 'IS NULL' || prevState[ `rule*${index}*condition_test` ] === 'IS NOT NULL')) || (currState[ `rule*${index}*condition_test` ] === 'IS NULL' || currState[ `rule*${index}*condition_test` ] === 'IS NOT NULL');
    if (isCurrent) {
      if (hasProp) {
        return formElement;
      } else if (turnRange && (currVarType === 'Number' || currVarType === 'Date')) {
        formElementsQueue.push({
          type: 'maskedinput',
          label: 'Minimum',
          validateOnBlur: true,
          onBlur: true,
          errorIconRight: true,
          errorIcon: 'fa fa-exclamation',
          createNumberMask: true,
          passProps: {
            guid: false,
            mask: 'func:window.numberMaskTwo',
            placeholderChar: '\u2000',
          },
          name: `rule*${index}*state_property_attribute_value_minimum`,
          value: '',
          layoutProps: {
            style: {
              width: '70%',
              display: 'inline-block',
              verticalAlign: 'top',
              paddingRight: '7px',
            }
          },
        }, {
            name: `rule*${index}*state_property_attribute_value_minimum_type`,
            type: 'dropdown',
            passProps: {
              selection: true,
              fluid: true,
            },
            label: 'Minimum Type',
            labelProps: {
              style: {
                visibility: 'hidden',
                whiteSpace: 'nowrap',
              }
            },
            value: 'value',
            validateOnChange: true,
            errorIconRight: true,
            errorIcon: 'fa fa-exclamation',
            options: [ {
              'label': 'Value',
              'value': 'value',
            }, {
              'label': 'Variable',
              'value': 'variable',
            } ],
            layoutProps: {
              style: {
                width: '30%',
                display: 'inline-block',
                verticalAlign: 'top',
              }
            },
          }, {
            type: 'maskedinput',
            label: 'Maximum',
            validateOnBlur: true,
            onBlur: true,
            createNumberMask: true,
            errorIcon: 'fa fa-exclamation',
            errorIconRight: true,
            passProps: {
              guid: false,
              mask: 'func:window.numberMaskTwo',
              placeholderChar: '\u2000',
            },
            name: `rule*${index}*state_property_attribute_value_maximum`,
            value: '',
            layoutProps: {
              style: {
                width: '70%',
                display: 'inline-block',
                verticalAlign: 'top',
                paddingRight: '7px',
              }
            },
          }, {
            name: `rule*${index}*state_property_attribute_value_maximum_type`,
            type: 'dropdown',
            passProps: {
              selection: true,
              fluid: true,
            },
            label: 'Maximum Type',
            labelProps: {
              style: {
                visibility: 'hidden',
                whiteSpace: 'nowrap',
              }
            },
            value: 'value',
            validateOnChange: true,
            errorIcon: 'fa fa-exclamation',
            errorIconRight: true,
            options: [ {
              'label': 'Value',
              'value': 'value',
            }, {
              'label': 'Variable',
              'value': 'variable',
            } ],
            layoutProps: {
              style: {
                width: '30%',
                display: 'inline-block',
                verticalAlign: 'top',
              }
            },
          });
        return formElement;
      } else if (!comparatorIsNull) {
        formElementsQueue.push({
          label: 'Value',
          name: `rule*${index}*state_property_attribute_value_comparison`,
          value: '',
          validateOnBlur: true,
          onBlur: true,
          errorIconRight: true,
          errorIcon: 'fa fa-exclamation',
          layoutProps: {
            style: {
              width: '70%',
              paddingRight: '7px',
              display: 'inline-block',
              verticalAlign: 'top',
            }
          },
        }, {
            name: `rule*${index}*state_property_attribute_value_comparison_type`,
            type: 'dropdown',
            passProps: {
              selection: true,
              fluid: true,
            },
            value: 'value',
            validateOnChange: true,
            errorIcon: 'fa fa-exclamation',
            errorIconRight: true,
            options: [ {
              'label': 'Value',
              'value': 'value',
            }, {
              'label': 'Variable',
              'value': 'variable',
            } ],
            label: 'Value type',
            labelProps: {
              style: {
                visibility: 'hidden',
                whiteSpace: 'nowrap',
              }
            },
            layoutProps: {
              style: {
                width: '30%',
                display: 'inline-block',
                verticalAlign: 'top',
              }
            },
          });
        return formElement;
      } else {
        return formElement;
      }
    } else {
      return false;
    }
  }
  window.comparatorFilterTwo = comparatorFilterTwo;


  function adverseFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let isVariable = ((!currState[ `condition_output*0*value_type` ] && prevState[ `condition_output*0*value_type` ] === 'variable') || currState[ `condition_output*0*value_type` ] === 'variable');
    return (isVariable) ? {
      name: `condition_output*0*value`,
      value: '',
      errorIconRight: true,
      label: 'Decline Reason (If Rule Fails)',
      valueCheckOnChange: true,
      errorIcon: 'fa fa-exclamation',
      type: 'remote_dropdown',
      passProps: {
        emptyQuery: true,
        search: true,
        multiple: false,
        debounce: 250,
        searchProps: {
          baseUrl: '/decision/api/variable_dropdown?',
          limit: 100,
          sort: 'display_title',
          response_field: 'variable_dropdown',
        },
      },
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px',
        }
      },
    } : {
        name: 'condition_output*0*value',
        label: 'Decline Reason (If Rule Fails)',
        keyUp: 'func:window.nameOnChange',
        valueCheckOnBlur: true,
        onBlur: true,
        errorIconRight: true,
        errorIcon: 'fa fa-exclamation',
        type: 'text',
        layoutProps: {
          style: {
            width: '70%',
            display: 'inline-block',
            verticalAlign: 'top',
            paddingRight: '7px',
          }
        },
      };
  }

  window.adverseFilter = adverseFilter;

  function weightFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let isVariable = ((!currState[ `condition_output*0*value_type` ] && prevState[ `condition_output*0*value_type` ] === 'variable') || currState[ `condition_output*0*value_type` ] === 'variable');
    return (isVariable) ? {
      name: `condition_output*0*value`,
      value: '',
      errorIconRight: true,
      label: 'Weight (If Rule Passes)',
      valueCheckOnChange: true,
      type: 'remote_dropdown',
      passProps: {
        emptyQuery: true,
        search: true,
        multiple: false,
        debounce: 250,
        searchProps: {
          baseUrl: '/decision/api/variable_dropdown?',
          limit: 100,
          sort: 'display_title',
          response_field: 'variable_dropdown',
        },
      },
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px',
        }
      },
    } : {
        name: `condition_output*0*value`,
        label: 'Weight (If Rule Passes)',
        valueCheckOnBlur: true,
        errorIconRight: true,
        onBlur: true,
        type: 'maskedinput',
        passProps: {
          mask: 'func:window.numberMaskTwo',
          guid: false,
          placeholderChar: '\u2000',
        },
        createNumberMask: true,
        layoutProps: {
          style: {
            width: '70%',
            display: 'inline-block',
            verticalAlign: 'top',
            paddingRight: '7px',
          }
        },
      };
  }

  window.weightFilter = weightFilter;

  function minimumFilterTwo(currState, formElementsQueue, formElement, prevState) {
    let variableType = getVariableTypeTwo(prevState, currState, formElement);
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let isRange = ((!currState[ `rule*${index}*condition_test` ] && prevState[ `rule*${index}*condition_test` ] === 'RANGE') || currState[ `rule*${index}*condition_test` ] === 'RANGE');
    let isVariable = ((!currState[ `rule*${index}*state_property_attribute_value_minimum_type` ] && prevState[ `rule*${index}*state_property_attribute_value_minimum_type` ] === 'variable') || currState[ `rule*${index}*state_property_attribute_value_minimum_type` ] === 'variable');
    if (isCurrentCondition({ index, formElement, prevState, currState })) {
      formElement = (isVariable)
        ? {
          name: `rule*${index}*state_property_attribute_value_minimum`,
          value: '',
          errorIconRight: true,
          label: 'Minimum',
          validateOnChange: true,
          errorIcon: 'fa fa-exclamation',
          type: 'remote_dropdown',
          passProps: {
            emptyQuery: true,
            search: true,
            multiple: false,
            debounce: 250,
            searchProps: {
              baseUrl: '/decision/api/variable_dropdown?',
              limit: 100,
              sort: 'display_title',
              response_field: 'variable_dropdown',
            },
          },
          layoutProps: {
            style: {
              width: '70%',
              display: 'inline-block',
              verticalAlign: 'top',
              paddingRight: '7px',
            }
          },
        }
        : (variableType === 'Date')
          ? {
            name: `rule*${index}*state_property_attribute_value_minimum`,
            validateOnChange: true,
            errorIcon: 'fa fa-exclamation',
            errorIconRight: true,
            passProps: {
              hideKeyboardShortcutsPanel: true,
            },
            label: 'Minimum',
            type: 'singleDatePicker',
            leftIcon: 'fas fa-calendar-alt',
            layoutProps: {
              style: {
                width: '70%',
                display: 'inline-block',
                verticalAlign: 'top',
                paddingRight: '7px',
              }
            },
          }
          : {
            name: `rule*${index}*state_property_attribute_value_minimum`,
            validateOnBlur: true,
            onBlur: true,
            errorIconRight: true,
            errorIcon: 'fa fa-exclamation',
            value: '',
            createNumberMask: true,
            passProps: {
              mask: 'func:window.numberMaskTwo',
              guid: false,
              placeholderChar: '\u2000',
            },
            label: 'Minimum',
            type: 'maskedinput',
            layoutProps: {
              style: {
                width: '70%',
                display: 'inline-block',
                verticalAlign: 'top',
                paddingRight: '7px',
              }
            },
          };
      return ((variableType === 'Number' || variableType === 'Date') && isRange) ? formElement : false;
    } else {
      return false;
    }
  }
  window.minimumFilterTwo = minimumFilterTwo;

  function minMaxTypeFilter(currState, formElementsQueue, formElement, prevState) {
    let variableType = getVariableTypeTwo(prevState, currState, formElement);
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let isRange = ((!currState[ `rule*${index}*condition_test` ] && prevState[ `rule*${index}*condition_test` ] === 'RANGE') || currState[ `rule*${index}*condition_test` ] === 'RANGE');
    if (isCurrentCondition({ index, formElement, prevState, currState })) {
      return ((variableType === 'Number' || variableType === 'Date') && isRange) ? formElement : false;
    } else {
      return false;
    }
  }
  window.minMaxTypeFilter = minMaxTypeFilter;

  function valueTypeFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let variableType = getVariableTypeTwo(prevState, currState, formElement);
    let isCurrent = isCurrentCondition({ index, formElement, prevState, currState });
    let comparatorIsNull = (!currState[ `rule*${index}*condition_test` ] && (prevState[ `rule*${index}*condition_test` ] === 'IS NULL' || prevState[ `rule*${index}*condition_test` ] === 'IS NOT NULL')) || (currState[ `rule*${index}*condition_test` ] === 'IS NULL' || currState[ `rule*${index}*condition_test` ] === 'IS NOT NULL');
    let comparatorIsIn = (!currState[ `rule*${index}*condition_test` ] && (prevState[ `rule*${index}*condition_test` ] === 'IN' || prevState[ `rule*${index}*condition_test` ] === 'NOT IN')) || (currState[ `rule*${index}*condition_test` ] === 'IN' || currState[ `rule*${index}*condition_test` ] === 'NOT IN');
    let comparatorIsRange = ((variableType === 'Number' || variableType === 'Date') && ((!currState[ `rule*${index}*condition_test` ] && prevState[ `rule*${index}*condition_test` ] === 'RANGE') || currState[ `rule*${index}*condition_test` ] === 'RANGE'));
    if (isCurrent && (!comparatorIsNull && ((!currState[ `rule*${index}*condition_test` ] && prevState[ `rule*${index}*condition_test` ]) || currState[ `rule*${index}*condition_test` ]) && !comparatorIsRange)) {
      return formElement;
    } else {
      return false;
    }
  }
  window.valueTypeFilter = valueTypeFilter;

  function maximumFilterTwo(currState, formElementsQueue, formElement, prevState) {
    let variableType = getVariableTypeTwo(prevState, currState, formElement);
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let isRange = ((!currState[ `rule*${index}*condition_test` ] && prevState[ `rule*${index}*condition_test` ] === 'RANGE') || currState[ `rule*${index}*condition_test` ] === 'RANGE');
    let isVariable = ((!currState[ `rule*${index}*state_property_attribute_value_maximum_type` ] && prevState[ `rule*${index}*state_property_attribute_value_maximum_type` ] === 'variable') || currState[ `rule*${index}*state_property_attribute_value_maximum_type` ] === 'variable');
    if (isCurrentCondition({ index, formElement, prevState, currState, })) {
      formElement = (isVariable) ?
        {
          name: `rule*${index}*state_property_attribute_value_maximum`,
          value: '',
          errorIconRight: true,
          label: 'Maximum',
          validateOnChange: true,
          errorIcon: 'fa fa-exclamation',
          type: 'remote_dropdown',
          passProps: {
            emptyQuery: true,
            search: true,
            multiple: false,
            debounce: 250,
            searchProps: {
              baseUrl: '/decision/api/variable_dropdown?',
              limit: 100,
              sort: 'display_title',
              response_field: 'variable_dropdown',
            },
          },
          layoutProps: {
            style: {
              width: '70%',
              display: 'inline-block',
              verticalAlign: 'top',
              paddingRight: '7px',
            }
          },
        }
        : (variableType === 'Date') ?
          {
            name: `rule*${index}*state_property_attribute_value_maximum`,
            validateOnChange: true,
            errorIcon: 'fa fa-exclamation',
            errorIconRight: true,
            passProps: {
              hideKeyboardShortcutsPanel: true,
            },
            label: 'Maximum',
            type: 'singleDatePicker',
            leftIcon: 'fas fa-calendar-alt',
            layoutProps: {
              style: {
                width: '70%',
                display: 'inline-block',
                verticalAlign: 'top',
                paddingRight: '7px',
              }
            },
          }
          : {
            name: `rule*${index}*state_property_attribute_value_maximum`,
            validateOnBlur: true,
            onBlur: true,
            errorIconRight: true,
            errorIcon: 'fa fa-exclamation',
            createNumberMask: true,
            value: '',
            passProps: {
              mask: 'func:window.numberMaskTwo',
              guid: false,
              placeholderChar: '\u2000',
            },
            label: 'Maximum',
            type: 'maskedinput',
            layoutProps: {
              style: {
                width: '70%',
                display: 'inline-block',
                verticalAlign: 'top',
                paddingRight: '7px',
              }
            },
          };
      return ((variableType === 'Number' || variableType === 'Date') && isRange) ? formElement : false;
    } else {
      return false;
    }
  }
  window.maximumFilterTwo = maximumFilterTwo;

  function valueFilterTwo(currState, formElementsQueue, formElement, prevState) {
    let variableType = getVariableTypeTwo(prevState, currState, formElement);
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let isCurrent = isCurrentCondition({ index, formElement, prevState, currState });
    let comparatorIsNull = (!currState[ `rule*${index}*condition_test` ] && (prevState[ `rule*${index}*condition_test` ] === 'IS NULL' || prevState[ `rule*${index}*condition_test` ] === 'IS NOT NULL')) || (currState[ `rule*${index}*condition_test` ] === 'IS NULL' || currState[ `rule*${index}*condition_test` ] === 'IS NOT NULL');
    let comparatorIsIn = (!currState[ `rule*${index}*condition_test` ] && (prevState[ `rule*${index}*condition_test` ] === 'IN' || prevState[ `rule*${index}*condition_test` ] === 'NOT IN')) || (currState[ `rule*${index}*condition_test` ] === 'IN' || currState[ `rule*${index}*condition_test` ] === 'NOT IN');
    let comparatorIsRange = ((variableType === 'Number' || variableType === 'Date') && ((!currState[ `rule*${index}*condition_test` ] && prevState[ `rule*${index}*condition_test` ] === 'RANGE') || currState[ `rule*${index}*condition_test` ] === 'RANGE'));
    let isVariable = ((!currState[ `rule*${index}*state_property_attribute_value_comparison_type` ] && prevState[ `rule*${index}*state_property_attribute_value_comparison_type` ] === 'variable') || currState[ `rule*${index}*state_property_attribute_value_comparison_type` ] === 'variable');
    if (isCurrent && !comparatorIsRange && !comparatorIsNull) {
      if (isVariable) {
        return {
          name: `rule*${index}*state_property_attribute_value_comparison`,
          value: '',
          errorIconRight: true,
          label: 'Value',
          validateOnChange: true,
          errorIcon: 'fa fa-exclamation',
          type: 'remote_dropdown',
          passProps: {
            emptyQuery: true,
            search: true,
            multiple: false,
            debounce: 250,
            searchProps: {
              baseUrl: '/decision/api/variable_dropdown?',
              limit: 100,
              sort: 'display_title',
              response_field: 'variable_dropdown',
            },
          },
          layoutProps: {
            style: {
              width: '70%',
              display: 'inline-block',
              verticalAlign: 'top',
              paddingRight: '7px',
            }
          },
        }
      } else if (!comparatorIsIn && ((!currState[ `rule*${index}*condition_test` ] && prevState[ `rule*${index}*condition_test` ]) || currState[ `rule*${index}*condition_test` ])) {
        switch (variableType) {
          case 'Boolean':
            return {
              label: 'Value',
              type: 'dropdown',
              name: `rule*${index}*state_property_attribute_value_comparison`,
              passProps: {
                selection: true,
                fluid: true,
              },
              value: 'true',
              options: [ {
                label: 'True',
                value: 'true',
              }, {
                label: 'False',
                value: 'false',
              } ],
              validateOnBlur: true,
              onBlur: true,
              errorIconRight: true,
              errorIcon: 'fa fa-exclamation',
              layoutProps: {
                style: {
                  width: '70%',
                  paddingRight: '7px',
                  display: 'inline-block',
                  verticalAlign: 'top',
                }
              },
            };
          case 'Date':
            return {
              label: 'Value',
              type: 'singleDatePicker',
              leftIcon: 'fas fa-calendar-alt',
              name: `rule*${index}*state_property_attribute_value_comparison`,
              passProps: {
                hideKeyboardShortcutsPanel: true,
              },
              validateOnChange: true,
              errorIcon: 'fa fa-exclamation',
              errorIconRight: true,
              layoutProps: {
                style: {
                  width: '70%',
                  paddingRight: '7px',
                  display: 'inline-block',
                  verticalAlign: 'top',
                }
              },
            };
          case 'Number':
            return {
              label: 'Value',
              name: `rule*${index}*state_property_attribute_value_comparison`,
              type: 'maskedinput',
              passProps: {
                guid: false,
                mask: 'func:window.numberMaskTwo',
                placeholderChar: '\u2000',
              },
              value: '',
              createNumberMask: true,
              validateOnBlur: true,
              onBlur: true,
              errorIconRight: true,
              errorIcon: 'fa fa-exclamation',
              layoutProps: {
                style: {
                  width: '70%',
                  paddingRight: '7px',
                  display: 'inline-block',
                  verticalAlign: 'top',
                }
              },
            };
          default:
            return {
              label: 'Value',
              name: `rule*${index}*state_property_attribute_value_comparison`,
              validateOnBlur: true,
              errorIcon: 'fa fa-exclamation',
              value: '',
              onBlur: true,
              errorIconRight: true,
              layoutProps: {
                style: {
                  width: '70%',
                  paddingRight: '7px',
                  display: 'inline-block',
                  verticalAlign: 'top',
                }
              },
            };
        }
      } else if (comparatorIsIn) {
        return {
          label: 'Value',
          name: `rule*${index}*state_property_attribute_value_comparison`,
          validateOnBlur: true,
          errorIcon: 'fa fa-exclamation',
          value: '',
          onBlur: true,
          errorIconRight: true,
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
        return false;
      }
    } else {
      return false;
    }
  }
  window.valueFilterTwo = valueFilterTwo;

  function valueFilterThree(currState, formElementsQueue, formElement, prevState) {
    let variableType = getVariableTypeTwo(prevState, currState, formElement);
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let isCurrent = isCurrentCondition({ index, formElement, prevState, currState });
    let isVariable = ((!currState[ `rule*${index}*state_property_attribute_value_comparison_type` ] && prevState[ `rule*${index}*state_property_attribute_value_comparison_type` ] === 'variable') || currState[ `rule*${index}*state_property_attribute_value_comparison_type` ] === 'variable');
    if (isVariable) {
      return {
        name: `rule*${index}*state_property_attribute_value_comparison`,
        value: '',
        errorIconRight: true,
        label: 'Value',
        validateOnChange: true,
        errorIcon: 'fa fa-exclamation',
        type: 'remote_dropdown',
        passProps: {
          emptyQuery: true,
          search: true,
          multiple: false,
          debounce: 250,
          searchProps: {
            baseUrl: '/decision/api/variable_dropdown?',
            limit: 100,
            sort: 'display_title',
            response_field: 'variable_dropdown',
          },
        },
        layoutProps: {
          style: {
            width: '70%',
            display: 'inline-block',
            verticalAlign: 'top',
            paddingRight: '7px',
          }
        },
      }
    } else {
      switch (variableType) {
        case 'Boolean':
          return {
            label: 'Value',
            type: 'dropdown',
            name: `rule*${index}*state_property_attribute_value_comparison`,
            passProps: {
              selection: true,
              fluid: true,
            },
            value: 'true',
            options: [ {
              label: 'True',
              value: 'true',
            }, {
              label: 'False',
              value: 'false',
            } ],
            validateOnBlur: true,
            onBlur: true,
            errorIconRight: true,
            errorIcon: 'fa fa-exclamation',
            layoutProps: {
              style: {
                width: '70%',
                paddingRight: '7px',
                display: 'inline-block',
                verticalAlign: 'top',
              }
            },
          };
        case 'Date':
          return {
            label: 'Value',
            type: 'singleDatePicker',
            leftIcon: 'fas fa-calendar-alt',
            name: `rule*${index}*state_property_attribute_value_comparison`,
            passProps: {
              hideKeyboardShortcutsPanel: true,
            },
            validateOnChange: true,
            errorIcon: 'fa fa-exclamation',
            errorIconRight: true,
            layoutProps: {
              style: {
                width: '70%',
                paddingRight: '7px',
                display: 'inline-block',
                verticalAlign: 'top',
              }
            },
          };
        case 'Number':
          return {
            label: 'Value',
            name: `rule*${index}*state_property_attribute_value_comparison`,
            type: 'maskedinput',
            passProps: {
              guid: false,
              mask: 'func:window.numberMaskTwo',
              placeholderChar: '\u2000',
            },
            value: '',
            createNumberMask: true,
            validateOnBlur: true,
            onBlur: true,
            errorIconRight: true,
            errorIcon: 'fa fa-exclamation',
            layoutProps: {
              style: {
                width: '70%',
                paddingRight: '7px',
                display: 'inline-block',
                verticalAlign: 'top',
              }
            },
          };
        default:
          return {
            label: 'Value',
            name: `rule*${index}*state_property_attribute_value_comparison`,
            validateOnBlur: true,
            value: '',
            onBlur: true,
            errorIconRight: true,
            errorIcon: 'fa fa-exclamation',
            layoutProps: {
              style: {
                width: '70%',
                paddingRight: '7px',
                display: 'inline-block',
                verticalAlign: 'top',
              }
            },
          };
      }
    }
  }
  window.valueFilterThree = valueFilterThree;


  function operatorFilterTwo(currState, formElementsQueue, formElement, prevState) {
    if ((!currState.condition_operation && prevState.condition_operation === 'OR') || (prevState.condition_operation !== 'OR' && currState.condition_operation === 'OR')) {
      let hasProp = formElementExistsTwo(formElementsQueue, 'condition_group_id');
      if (!hasProp) {
        formElementsQueue.push({
          label: 'OR Group ID',
          name: 'condition_group_id',
          errorIconRight: true,
          validateOnBlur: true,
          errorIcon: 'fa fa-exclamation',
          onBlur: true,
          layoutProps: {
          },
        });
      }
      return formElement;
    } else {
      return formElement;
    }
  }
  window.operatorFilterTwo = operatorFilterTwo;


  function orGroupFilterTwo(currState, formElementsQueue, formElement, prevState) {
    return (currState.condition_operation === 'OR' || (!currState.condition_operation && prevState.condition_operation === 'OR')) ? formElement : false;
  }
  window.orGroupFilterTwo = orGroupFilterTwo;

  function addNewConditionFilterTwo(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let newFormElements = [ {
      name: `rule*${index}*rule_separator`,
      type: 'layout',
      value: {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            margin: '10px 0',
            position: 'relative',
          }
        },
        children: [
          {
            component: 'hr',
            props: {
              style: {
                border: 'none',
                borderBottom: '1px dashed #bbb',
                width: '100%',
              }
            }
          },
          {
            component: 'span',
            props: {
              style: {
                padding: '0 20px',
                background: 'white',
                position: 'absolute',
                color: '#bbb',
                fontWeight: 900,
                fontSize: '13px',
              }
            },
            children: 'OR'
          }
        ]
      }
    }, {
      name: `rule*${index}*state_property_attribute`,
      value: '',
      errorIconRight: true,
      label: 'Variable',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      type: 'remote_dropdown',
      passProps: {
        emptyQuery: true,
        search: true,
        multiple: false,
        debounce: 250,
        searchProps: {
          baseUrl: '/decision/api/variable_dropdown?',
          limit: 100,
          sort: 'display_title',
          response_field: 'variable_dropdown',
        },
      },
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px'
        }
      },
    },
    {
      type: 'layout',
      name: `rule*${index}*variable_type`,
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
      passProps: {
        className: '__re-bulma_column',
      },
      value: {
        component: 'div',
        props: {
          className: '__re-bulma_control __form_element_has_value',
        },
        children: [ {
          component: 'label',
          props: {
            className: '__re-bulma_label',
            style: {
              visibility: 'hidden',
              whiteSpace: 'nowrap',
            }
          },
          children: 'Variable Type',
        },
        {
          component: 'Input',
          props: {
            readOnly: true,
            value: '',
          }
        } ]
      }
    },
    {
      name: `rule*${index}*state_property_attribute`,
      value: '',
      errorIconRight: true,
      label: 'Variable',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      type: 'remote_dropdown',
      passProps: {
        emptyQuery: true,
        search: true,
        multiple: false,
        debounce: 250,
        searchProps: {
          baseUrl: '/decision/api/variable_dropdown?',
          limit: 100,
          sort: 'display_title',
          response_field: 'variable_dropdown',
        },
      },
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px'
        }
      },
    },
    {
      label: 'Comparison',
      name: `rule*${index}*condition_test`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: '',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      // layoutProps: {
      // },
      options: getComparatorDropdownTwo(),
    },
    {
      name: `rule*${index}*state_property_attribute_value_comparison`,
      validateOnBlur: true,
      errorIcon: 'fa fa-exclamation',
      onBlur: true,
      errorIconRight: true,
      label: 'Value',
      type: 'text',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
    },
    {
      name: `rule*${index}*state_property_attribute_value_comparison_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'value',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      options: [ {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      } ],
      label: 'Value type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
    },
    {
      name: `rule*${index}*state_property_attribute_value_minimum`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      createNumberMask: true,
      passProps: {
        mask: 'func:window.numberMaskTwo',
        guid: false,
        placeholderChar: '\u2000',
      },
      value: '',
      label: 'Minimum',
      type: 'maskedinput',
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px',
        }
      },
    },
    {
      name: `rule*${index}*state_property_attribute_value_maximum`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      createNumberMask: true,
      passProps: {
        mask: 'func:window.numberMaskTwo',
        guid: false,
        placeholderChar: '\u2000',
      },
      value: '',
      label: 'Maximum',
      type: 'maskedinput',
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px',
        }
      },
    }, ];
    if (index !== 0 && (((currState[ formElement.name ] === undefined && prevState[ formElement.name ] === 'on') || (!prevState[ formElement.name ] && currState[ formElement.name ] === 'on')))) {
      formElementsQueue.push(...newFormElements);
    }

    return isCurrentCondition({ index: index, formElement, prevState, currState }) ? formElement : false;
    // return formElement;
  }
  window.addNewConditionFilterTwo = addNewConditionFilterTwo;

  function variableDropdownFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    formElement.options = prevState.__formOptions.state_property_attribute;
    return isCurrentCondition({ index, formElement, prevState, currState });
  }
  window.variableDropdownFilter = variableDropdownFilter;

  function ruleSeparaterFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    if (isCurrentCondition({ index, formElement, prevState, currState })) {
      if (prevState.rule_type === 'OR') {
        return {
          name: `rule*${index}*rule_separator`,
          type: 'layout',
          value: {
            component: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                margin: '10px 0',
                position: 'relative',
              }
            },
            children: [
              {
                component: 'hr',
                props: {
                  style: {
                    border: 'none',
                    borderBottom: '1px dashed #bbb',
                    width: '100%',
                  }
                }
              },
              {
                component: 'span',
                props: {
                  style: {
                    padding: '0 20px',
                    background: 'white',
                    position: 'absolute',
                    color: '#bbb',
                    fontWeight: 900,
                    fontSize: '13px',
                  }
                },
                children: 'OR'
              }
            ]
          }
        };
      } else if (prevState.rule_type === 'AND') {
        return {
          name: `rule*${index}*rule_separator`,
          type: 'layout',
          value: {
            component: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                margin: '10px 0',
                position: 'relative',
              }
            },
            children: [
              {
                component: 'hr',
                props: {
                  style: {
                    border: 'none',
                    borderBottom: '1px dashed #bbb',
                    width: '100%',
                  }
                }
              },
              {
                component: 'span',
                props: {
                  style: {
                    padding: '0 20px',
                    background: 'white',
                    position: 'absolute',
                    color: '#bbb',
                    fontWeight: 900,
                    fontSize: '13px',
                  }
                },
                children: 'AND'
              }
            ]
          }
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  window.ruleSeparaterFilter = ruleSeparaterFilter;

  function scorecardVariableFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let currVal = currState[ 'rule*0*state_property_attribute' ] || prevState[ 'rule*0*state_property_attribute' ];
    if (currVal && prevState.__formOptions && prevState.__formOptions.state_property_attribute) {
      formElement.value.children[ 1 ].props.value = prevState.__formOptions.state_property_attribute.filter(elmt => elmt.value === currVal)[ 0 ].label;
    } else {
      formElement.value.children[ 1 ].props.value = '';
    }
    return isCurrentCondition({ index, formElement, prevState, currState });
  }
  window.scorecardVariableFilter = scorecardVariableFilter;

  function scorecardVariableTypeFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let prevVarType = getVariableTypeTwo(prevState, {}, { name: 'rule*0*state_property_attribute' });
    let currVarType = getVariableTypeTwo(prevState, currState, { name: 'rule*0*state_property_attribute' });
    currVarType = currVarType || prevVarType;
    formElement.value.children[ 1 ].props.value = currVarType;
    return isCurrentCondition({ index, formElement, prevState, currState });
  }
  window.scorecardVariableTypeFilter = scorecardVariableTypeFilter;

  function addNewConditionPricingFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let newFormElements = [ {
      name: `rule*${index - 1}*rule_separator`,
      type: 'layout',
      value: {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            margin: '10px 0',
            position: 'relative',
          }
        },
        children: [
          {
            component: 'hr',
            props: {
              style: {
                border: 'none',
                borderBottom: '1px dashed #bbb',
                width: '100%',
              }
            }
          },
          {
            component: 'span',
            props: {
              style: {
                padding: '0 20px',
                background: 'white',
                position: 'absolute',
                color: '#bbb',
                fontWeight: 900,
                fontSize: '13px',
              }
            },
            children: 'OR'
          }
        ]
      }
    }, {
      name: `rule*0*condition_output*${index}*variable`,
      value: '',
      errorIconRight: true,
      label: 'Output Variable',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      type: 'remote_dropdown',
      passProps: {
        emptyQuery: true,
        search: true,
        multiple: false,
        debounce: 250,
        searchProps: {
          baseUrl: '/decision/api/variable_dropdown?type=Output',
          limit: 100,
          sort: 'display_title',
          response_field: 'variable_dropdown',
        },
      },
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px',
        }
      },
    }, {
      type: 'layout',
      name: `rule*0*condition_output*${index}*variable_type`,
      passProps: {
        className: '__re-bulma_column',
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
      value: {
        component: 'div',
        props: {
          className: '__re-bulma_control __form_element_has_value',
        },
        children: [ {
          component: 'label',
          props: {
            className: '__re-bulma_label',
            style: {
              visibility: 'hidden',
              whiteSpace: 'nowrap',
            }
          },
          children: 'Output Variable Type',
        },
        {
          component: 'Input',
          props: {
            readOnly: true,
            value: '',
          }
        } ]
      }
    },
    {
      name: `rule*0*condition_output*${index}*value`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      label: 'Output Value',
      type: 'text',
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px',
        }
      },
    },
    {
      name: `rule*0*condition_output*${index}*value_type`,
      type: 'dropdown',
      label: 'Output Value Type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'value',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      options: [ {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      } ],
    }, ];
    if (index !== 0 && (((currState[ formElement.name ] === undefined && prevState[ formElement.name ]) || (!prevState[ formElement.name ] && currState[ formElement.name ])))) {
      formElementsQueue.push(...newFormElements);
    }
    return formElement;
  }
  window.addNewConditionPricingFilter = addNewConditionPricingFilter;

  function overviewOnChange(first, second) {
    window.refForm.setState({ underwriting_toggle: { [ `has_${second.name}` ]: second.checked } }, () => {
      window.refForm.submitForm();
    })
  }
  window.overviewOnChange = overviewOnChange;

  function plusCounterOnClick(formElement) {
    let maxVal = formElement.max || 3;
    let newVal = (this.state.rule_index === maxVal) ? maxVal : 1;
    if (this.state.rule_index && this.state.rule_index < maxVal) {
      newVal = this.state.rule_index + 1;
    }
    this.setState({ rule_index: newVal }, () => {
      if (newVal === maxVal) {
        window.overlayProps.createNotification({ type: 'error', timeout: 10000, text: 'Maximum reached' });
      }
    });
  }
  window.plusCounterOnClick = plusCounterOnClick;

  function minusCounterOnClick() {
    let newVal = this.state.rule_index ? this.state.rule_index - 1 : 0;
    this.setState({ rule_index: newVal });
  }
  window.minusCounterOnClick = minusCounterOnClick;

  function plusOutputCounterOnClick(formElement) {
    let maxVal = formElement.max || 10;
    let newVal = (this.state.output_index === maxVal) ? maxVal : 1;
    if (this.state.output_index && this.state.output_index < maxVal) {
      newVal = this.state.output_index + 1;
    }
    this.setState({ output_index: newVal }, () => {
      if (newVal === maxVal) {
        window.overlayProps.createNotification({ type: 'error', timeout: 10000, text: 'Maximum reached' });
      }
    });
  }
  window.plusOutputCounterOnClick = plusOutputCounterOnClick;

  function minusOutputCounterOnClick() {
    let newVal = this.state.output_index ? this.state.output_index - 1 : 0;
    this.setState({ output_index: newVal });
  }
  window.minusOutputCounterOnClick = minusOutputCounterOnClick;

  function generateStandardRuleFields(index) {
    return [ {
      name: `rule*${index}*rule_separator`,
      type: 'layout',
      value: {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            margin: '10px 0',
            position: 'relative',
          }
        },
        children: [
          {
            component: 'hr',
            props: {
              style: {
                border: 'none',
                borderBottom: '1px dashed #bbb',
                width: '100%',
              }
            }
          },
          {
            component: 'span',
            props: {
              style: {
                padding: '0 20px',
                background: 'white',
                position: 'absolute',
                color: '#bbb',
                fontWeight: 900,
                fontSize: '13px',
              }
            },
            children: 'AND'
          }
        ]
      }
    }, {
      name: `rule*${index}*state_property_attribute`,
      value: '',
      type: 'remote_dropdown',
      passProps: {
        emptyQuery: true,
        search: true,
        multiple: false,
        debounce: 250,
        searchProps: {
          baseUrl: '/decision/api/variable_dropdown?',
          limit: 100,
          sort: 'display_title',
          response_field: 'variable_dropdown',
        },
      },
      errorIconRight: true,
      label: 'Variable',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
        }
      },
    },
    {
      type: 'layout',
      name: `rule*${index}*variable_type`,
      passProps: {
        className: '__re-bulma_column',
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
      value: {
        component: 'div',
        props: {
          className: '__re-bulma_control __form_element_has_value',
        },
        children: [ {
          component: 'label',
          props: {
            className: '__re-bulma_label',
            style: {
              visibility: 'hidden',
              whiteSpace: 'nowrap',
            }
          },
          children: 'Variable Type',
        },
        {
          component: 'Input',
          props: {
            readOnly: true,
            value: '',
          }
        } ]
      }
    },
    {
      name: `rule*${index}*state_property_attribute`,
      value: '',
      type: 'remote_dropdown',
      passProps: {
        emptyQuery: true,
        search: true,
        multiple: false,
        debounce: 250,
        searchProps: {
          baseUrl: '/decision/api/variable_dropdown?',
          limit: 100,
          sort: 'display_title',
          response_field: 'variable_dropdown',
        },
      },
      errorIconRight: true,
      label: 'Variable',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
        }
      },
    },
    {
      label: 'Comparison',
      name: `rule*${index}*condition_test`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: '',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      // layoutProps: {
      // },
      options: getComparatorDropdownTwo(),
    },
    {
      name: `rule*${index}*state_property_attribute_value_comparison`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      label: 'Value',
      type: 'text',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
    },
    {
      name: `rule*${index}*state_property_attribute_value_comparison_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'value',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      options: [ {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      } ],
      label: 'Value type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
    },
    {
      name: `rule*${index}*state_property_attribute_value_minimum`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      createNumberMask: true,
      passProps: {
        mask: 'func:window.numberMaskTwo',
        guid: false,
        placeholderChar: '\u2000',
      },
      value: '',
      label: 'Minimum',
      type: 'maskedinput',
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px',
        }
      },
    }, {
      name: `rule*${index}*state_property_attribute_value_minimum_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      label: 'Minimum Type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }
      },
      value: 'value',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      options: [ {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      } ],
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
    },
    {
      name: `rule*${index}*state_property_attribute_value_maximum`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      createNumberMask: true,
      passProps: {
        mask: 'func:window.numberMaskTwo',
        guid: false,
        placeholderChar: '\u2000',
      },
      value: '',
      label: 'Maximum',
      type: 'maskedinput',
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px',
        }
      },
    }, {
      name: `rule*${index}*state_property_attribute_value_maximum_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      label: 'Maximum Type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }
      },
      value: 'value',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      options: [ {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      } ],
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
    } ];
  }

  function plusCounterFilter(currState, formElementsQueue, formElement, prevState) {
    let currIndex = (currState[ 'rule_index' ] === undefined) ? 0 : Number(currState[ 'rule_index' ]);
    let prevIndex = (prevState[ 'rule_index' ] === undefined) ? 0 : Number(prevState[ 'rule_index' ])
    if ((!prevIndex && currIndex > 0) || (currState[ 'rule_index' ] === undefined && prevIndex > 0)) {
      formElementsQueue.push({
        label: ' ',
        name: 'minus_counter',
        type: 'button',
        onClick: 'func:window.minusCounterOnClick',
        value: 0,
        layoutProps: {
          style: {
            width: 'auto',
            display: 'inline-block',
            margin: '1rem 5px',
          }
        },
        passProps: {
          children: 'DELETE CONDITION',
          color: 'isDanger',
        },
      })
    }
    if (currState[ 'rule_index' ] === undefined && prevState[ 'rule_index' ] !== undefined && Number(prevState[ 'rule_index' ]) > 0) {
      for (let i = 1; i <= Number(prevState[ 'rule_index' ]); i++) {
        formElementsQueue.push(...generateStandardRuleFields(i));
      }
    } else if (currIndex > prevIndex) {
      formElementsQueue.push(...generateStandardRuleFields(currIndex));
    }
    return (prevState.rule_type && prevState.rule_type === 'simple') ? {
      name: 'plus_counter',
      label: ' ',
      type: 'button',
      max: 3,
      layoutProps: {
        style: {
          width: 'auto',
          display: 'inline-block',
          margin: '1rem 5px',
          display: 'none',
        }
      },
      passProps: {
        children: 'ADD CONDITION',
        color: 'isSuccess',
        style: {
        }
      },
      onClick: 'func:window.plusCounterOnClick',
      value: 0,
    } : {
        name: 'plus_counter',
        label: ' ',
        type: 'button',
        max: 3,
        passProps: {
          children: 'ADD CONDITION',
          color: 'isSuccess',
        },
        layoutProps: {
          style: {
            width: 'auto',
            display: 'inline-block',
            margin: '1rem 5px',
          }
        },
        onClick: 'func:window.plusCounterOnClick',
        value: 0,
      };
  }

  window.plusCounterFilter = plusCounterFilter;

  function minusCounterFilter(currState, formElementsQueue, formElement, prevState) {
    let currIndex = (currState[ 'rule_index' ] === undefined) ? 0 : Number(currState[ 'rule_index' ]);
    let prevIndex = (prevState[ 'rule_index' ] === undefined) ? 0 : Number(prevState[ 'rule_index' ])
    if (currIndex || (currState[ 'rule_index' ] === undefined && prevIndex > 0)) {
      return formElement;
    } else {
      return false;
    }
  }
  window.minusCounterFilter = minusCounterFilter;

  function isCurrentOutput(options) {
    let { index, formElement, prevState, currState } = options;
    let currOutputCount = (currState[ 'output_index' ] === undefined && prevState[ 'output_index' ] !== undefined) ? prevState[ 'output_index' ] : currState[ 'output_index' ];
    if (index === 0 || (currState[ 'output_index' ] && (currState[ 'output_index' ] === prevState[ 'output_index' ]))) {
      return formElement;
    } else if (currOutputCount && index <= currOutputCount) {
      return formElement;
    } else {
      return false;
    }
  }
  window.isCurrentOutput = isCurrentOutput;

  function generateStandardOutputFields(index) {
    return [ {
      name: `output_separator*${index}`,
      type: 'layout',
      value: {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            margin: '10px 0',
            position: 'relative',
          }
        },
        children: [
          {
            component: 'hr',
            props: {
              style: {
                border: 'none',
                borderBottom: '1px dashed #bbb',
                width: '100%',
              }
            }
          },
          {
            component: 'span',
            props: {
              style: {
                padding: '0 20px',
                background: 'white',
                position: 'absolute',
                color: '#bbb',
                fontWeight: 900,
                fontSize: '13px',
              }
            },
            children: `RESULT ${index + 1} (ASSIGNED IF RULE PASSES)`
          }
        ]
      }
    }, {
      name: `condition_output*${index}*variable`,
      value: '',
      errorIconRight: true,
      label: 'Output Variable',
      type: 'remote_dropdown',
      passProps: {
        emptyQuery: true,
        search: true,
        multiple: false,
        debounce: 250,
        searchProps: {
          baseUrl: '/decision/api/variable_dropdown?type=Output',
          limit: 100,
          sort: 'display_title',
          response_field: 'variable_dropdown',
        },
      },
      valueCheckOnChange: true,
      errorIcon: 'fa fa-exclamation',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
        }
      },
    }, {
      type: 'layout',
      name: `condition_output*${index}*variable_type`,
      passProps: {
        className: '__re-bulma_column',
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
      value: {
        component: 'div',
        props: {
          className: '__re-bulma_control __form_element_has_value',
        },
        children: [ {
          component: 'label',
          props: {
            className: '__re-bulma_label',
            style: {
              visibility: 'hidden',
              whiteSpace: 'nowrap',
            }
          },
          children: 'Output Variable Type',
        },
        {
          component: 'Input',
          props: {
            readOnly: true,
            value: '',
          }
        } ]
      }
    }, {
      name: `condition_output*${index}*value`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      label: 'Output Value',
      type: 'text',
      layoutProps: {
        style: {
          width: '70%',
          display: 'inline-block',
          verticalAlign: 'top',
          paddingRight: '7px',
        }
      },
    }, {
      name: `condition_output*${index}*value_type`,
      type: 'dropdown',
      label: 'Output Value Type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }
      },
      passProps: {
        selection: true,
        fluid: true,
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
      value: 'value',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      options: [ {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      } ],
    }, ];
  }

  function getPricingVariableType(prevState, currState, formElement) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let variable = `condition_output*${index}*variable`;
    return (currState[ variable ]) ? prevState.variable_types[ currState[ variable ] ] : prevState.variable_types[ prevState[ variable ] ];
  }
  window.getPricingVariableType = getPricingVariableType;

  function conditionOutputVariableFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    formElement.options = prevState.__formOptions.output_variables || [];
    return isCurrentOutput({ index, formElement, prevState, currState });
  }
  window.conditionOutputVariableFilter = conditionOutputVariableFilter;

  function conditionOutputVariableTypeFilter(currState, formElementsQueue, formElement, prevState) {
    let prevVarType = getPricingVariableType(prevState, {}, formElement);
    let currVarType = getPricingVariableType(prevState, currState, formElement);
    let varChange = prevVarType !== currVarType;
    currVarType = currVarType ? currVarType : prevVarType;
    formElement.value.children[ 1 ].props[ 'value' ] = currVarType;
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    return isCurrentOutput({ index, formElement, prevState, currState });
  };
  window.conditionOutputVariableTypeFilter = conditionOutputVariableTypeFilter;

  function getOutputVariableType(prevState, currState, formElement) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    let variable = `condition_output*${index}*variable`;
    return (currState[ variable ]) ? prevState.variable_types[ currState[ variable ] ] : prevState.variable_types[ prevState[ variable ] ];
  }
  window.getOutputVariableType = getOutputVariableType;

  function conditionOutputValueFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    let currVarType = getOutputVariableType(prevState, currState, formElement);
    index = Number(index);
    let isVariable = ((!currState[ `condition_output*${index}*value_type` ] && prevState[ `condition_output*${index}*value_type` ] === 'variable') || currState[ `condition_output*${index}*value_type` ] === 'variable');
    if (isCurrentOutput({ index, formElement, prevState, currState })) {
      if (isVariable) {
        return {
          name: `condition_output*${index}*value`,
          value: '',
          errorIconRight: true,
          label: 'Output Value',
          validateOnChange: true,
          errorIcon: 'fa fa-exclamation',
          type: 'remote_dropdown',
          passProps: {
            emptyQuery: true,
            search: true,
            multiple: false,
            debounce: 250,
            searchProps: {
              baseUrl: '/decision/api/variable_dropdown?',
              limit: 100,
              sort: 'display_title',
              response_field: 'variable_dropdown',
            },
          },
          layoutProps: {
            style: {
              width: '70%',
              display: 'inline-block',
              verticalAlign: 'top',
              paddingRight: '7px',
            }
          },
        }
      } else {
        switch (currVarType) {
          case 'Boolean':
            return {
              label: 'Output Value',
              type: 'dropdown',
              name: `condition_output*${index}*value`,
              passProps: {
                selection: true,
                fluid: true,
              },
              options: [
                //   {
                //   label: 'Select Comparator',
                //   value: '',
                // },
                {
                  label: 'True',
                  value: 'true',
                }, {
                  label: 'False',
                  value: 'false',
                } ],
              value: '',
              validateOnBlur: true,
              onBlur: true,
              errorIconRight: true,
              errorIcon: 'fa fa-exclamation',
              layoutProps: {
                style: {
                  width: '70%',
                  paddingRight: '7px',
                  display: 'inline-block',
                  verticalAlign: 'top',
                }
              },
            };
          case 'Date':
            return {
              label: 'Output Value',
              type: 'singleDatePicker',
              leftIcon: 'fas fa-calendar-alt',
              name: `condition_output*${index}*value`,
              passProps: {
                hideKeyboardShortcutsPanel: true,
              },
              validateOnChange: true,
              errorIcon: 'fa fa-exclamation',
              errorIconRight: true,
              layoutProps: {
                style: {
                  width: '70%',
                  paddingRight: '7px',
                  display: 'inline-block',
                  verticalAlign: 'top',
                }
              },
            };
          case 'Number':
            return {
              label: 'Output Value',
              name: `condition_output*${index}*value`,
              type: 'maskedinput',
              passProps: {
                guid: false,
                mask: 'func:window.numberMaskTwo',
                placeholderChar: '\u2000',
              },
              value: '',
              createNumberMask: true,
              validateOnBlur: true,
              onBlur: true,
              errorIconRight: true,
              errorIcon: 'fa fa-exclamation',
              layoutProps: {
                style: {
                  width: '70%',
                  paddingRight: '7px',
                  display: 'inline-block',
                  verticalAlign: 'top',
                }
              },
            };
          default:
            return {
              label: 'Output Value',
              name: `condition_output*${index}*value`,
              validateOnBlur: true,
              value: '',
              onBlur: true,
              errorIconRight: true,
              layoutProps: {
                style: {
                  width: '70%',
                  paddingRight: '7px',
                  display: 'inline-block',
                  verticalAlign: 'top',
                }
              },
            };
        }
      }
    } else {
      return false;
    }
  }
  window.conditionOutputValueFilter = conditionOutputValueFilter;

  function conditionOutputValueTypeFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 2 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    return isCurrentOutput({ index, formElement, prevState, currState });
  }
  window.conditionOutputValueTypeFilter = conditionOutputValueTypeFilter;

  function plusOutputCounterFilter(currState, formElementsQueue, formElement, prevState) {
    let currIndex = (currState[ 'output_index' ] === undefined) ? 0 : Number(currState[ 'output_index' ]);
    let prevIndex = (prevState[ 'output_index' ] === undefined) ? 0 : Number(prevState[ 'output_index' ])
    if ((!prevIndex && currIndex > 0) || (currState[ 'output_index' ] === undefined && prevIndex > 0)) {
      formElementsQueue.push({
        label: ' ',
        name: 'minus_output_counter',
        type: 'button',
        onClick: 'func:window.minusOutputCounterOnClick',
        value: 0,
        layoutProps: {
          style: {
            width: 'auto',
            display: 'inline-block',
            margin: '1rem 5px',
          }
        },
        passProps: {
          children: 'DELETE RESULT',
          color: 'isDanger',
        },
      })
    }
    if (currState[ 'output_index' ] === undefined && prevState[ 'output_index' ] !== undefined && Number(prevState[ 'output_index' ]) > 0) {
      for (let i = 1; i <= Number(prevState[ 'output_index' ]); i++) {
        formElementsQueue.push(...generateStandardOutputFields(i));
      }
    } else if (currIndex > prevIndex) {
      formElementsQueue.push(...generateStandardOutputFields(currIndex));
    }
    return formElement;
  }

  window.plusOutputCounterFilter = plusOutputCounterFilter;

  function minusOutputCounterFilter(currState, formElementsQueue, formElement, prevState) {
    let currIndex = (currState[ 'output_index' ] === undefined) ? 0 : Number(currState[ 'output_index' ]);
    let prevIndex = (prevState[ 'output_index' ] === undefined) ? 0 : Number(prevState[ 'output_index' ])
    if (currIndex || (currState[ 'output_index' ] === undefined && prevIndex > 0)) {
      return formElement;
    } else {
      return false;
    }
  }
  window.minusOutputCounterFilter = minusOutputCounterFilter;

  function outputSeparaterFilter(currState, formElementsQueue, formElement, prevState) {
    let index = formElement.name.split('*').length > 1 ? formElement.name.split('*')[ 1 ] : 0;
    index = Number(index);
    return isCurrentOutput({ index, formElement, prevState, currState });
  }
  window.outputSeparaterFilter = outputSeparaterFilter;


  function modalPlusCounterFilter(currState, formElementsQueue, formElement, prevState) {
    let currIndex = (currState[ 'rule_index' ] === undefined) ? 0 : Number(currState[ 'rule_index' ]);
    let prevIndex = (prevState[ 'rule_index' ] === undefined) ? 0 : Number(prevState[ 'rule_index' ])
    if ((!prevIndex && currIndex > 0) || (currState[ 'rule_index' ] === undefined && prevIndex > 0)) {
      formElementsQueue.push({
        label: ' ',
        name: 'minus_counter',
        type: 'button',
        onClick: 'func:window.minusCounterOnClick',
        value: 0,
        layoutProps: {
          style: {
            width: 'auto',
            display: 'inline-block',
            margin: '1rem 5px',
          }
        },
        passProps: {
          children: 'DELETE CONDITION',
          color: 'isDanger',
        },
      })
    }
    if (currState[ 'rule_index' ] === undefined && prevState[ 'rule_index' ] !== undefined && Number(prevState[ 'rule_index' ]) > 0) {
      for (let i = 1; i <= Number(prevState[ 'rule_index' ]); i++) {
        formElementsQueue.push(...generateStandardRuleFields(i));
      }
    } else if (currIndex > prevIndex) {
      formElementsQueue.push(...generateStandardRuleFields(currIndex));
    }
    return ((!currState.rule_type && prevState.rule_type && prevState.rule_type === 'simple') || (currState.rule_type && currState.rule_type === 'simple')) ? {
      name: 'plus_counter',
      label: ' ',
      type: 'button',
      max: 10,
      layoutProps: {
        style: {
          width: 'auto',
          display: 'inline-block',
          margin: '1rem 5px',
          display: 'none',
        }
      },
      passProps: {
        children: 'ADD CONDITION',
        color: 'isSuccess',
      },
      onClick: 'func:window.plusCounterOnClick',
      value: 0,
    } : {
        name: 'plus_counter',
        label: ' ',
        type: 'button',
        max: 10,
        passProps: {
          children: 'ADD CONDITION',
          color: 'isSuccess',
        },
        layoutProps: {
          style: {
            width: 'auto',
            display: 'inline-block',
            margin: '1rem 5px',
          }
        },
        onClick: 'func:window.plusCounterOnClick',
        value: 0,
      };
  }
  window.modalPlusCounterFilter = modalPlusCounterFilter;

}