'use strict';

function getInputElement(formElement) {
  return Object.assign({
    type: 'text' || formElement.type,
    label: `${formElement.label}` || null,
    name: `${formElement.name || formElement.label || null}`,
  }, formElement);
}

function formElements(options) {
  if (options.twoColumns === true) {
    if (options.doubleCard) {
      return {
        leftDoubleCardColumn: {
          style: {
            display:'flex',
          },
        },
        rightDoubleCardColumn: {
          style: {
            display:'flex',
          },
        },
        formGroupCardLeft: options.left.map(label => {
          return getInputElement(label); 
        }),
        formGroupCardRight: options.right.map(label => {
          return getInputElement(label); 
        }),
      };
    } else {
      return {
        formGroupElementsLeft: options.left.map(label => {
          return getInputElement(label); 
        }),
        formGroupElementsRight: options.right.map(label => {
          return getInputElement(label); 
        }),
      };
    }
  } else {
    return {
      formGroupElements: options.labels.map(label => {
        return getInputElement(label); 
      }),
    };
  }
}

module.exports = {  
  formElements,
  getInputElement,
};