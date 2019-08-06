'use strict';

function getInputElement(formElement) {
  return Object.assign({
    type: 'text' || formElement.type,
    label: `${formElement.label}`,
    name: `${formElement.name || formElement.label}`,
  }, formElement);
}

function generateComponent(options) {  
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
        rightOrder: options.rightOrder || [],
        leftOrder: options.leftOrder || [],
      };
    } else {
      return {
        formGroupElementsLeft: options.left.map(label => {
          return getInputElement(label); 
        }),
        formGroupElementsRight: options.right.map(label => {
          return getInputElement(label); 
        }),
        rightOrder: options.rightOrder || [], 
        leftOrder: options.leftOrder || [],
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

module.exports = generateComponent;