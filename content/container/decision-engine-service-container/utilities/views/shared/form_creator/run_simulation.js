'use strict';

/**
 * This function returns text for formCreator.
 * @param {string} text text for formCreator.
 * @returns {Object} Returns text for formCreator.
 */
function fullText(text) {
  return {
    gridProps: {
    },
    text: {
      type: 'layout',
      value: {
        component: 'p',
        props: {
          style: {
            textAlign: 'left',
          },
        },
        children: text,
      },
    },
  };
}
/**
 * This function returns a list for formCreator.
 * @param {Object} Object with title string and Array of strings for formCreator.
 * @returns {Object} Returns list text for formCreator.
 */
function listText(arr) {
  return {
    gridProps: {
    },
    text: {
      type: 'layout',
      value: {
        component: 'div',
        children: [{
          component: 'p',
          children: arr.title,
        }, {
            component: 'ul',
            props: {
              style: {
                textAlign: 'left',
              },
            },
            children: (arr.list) 
              ? arr.list.map(text => {
                return {
                  component: 'li',
                  children: text,
                }
              })
              : '',
          },
        ]
      }
    },
  };
}

/**
 * This function returns the runSimulation submit button for formCreator.
 * @returns {Object} Returns the runSimulation submit button for formCreator.
 */
function runSimulation() {
  return {
    'gridProps': {
      className: 'modal-footer-btns',
      isMultiline: false,
      responsive: 'isMobile',
    },
    runSimulation: {
      type: 'layout',
      value: {
        component: 'ResponsiveButton',
        props: {
          onClick: 'func:window.submitRefForm',
          buttonProps: {
            color: 'isSuccess',
          },
        },
        children: 'GENERATE RESULTS',
      },
    },
    cancel: {
      type: 'layout',
      value: {
        component: 'ResponsiveButton',
        children: 'Cancel',
        thisprops: {},
        props: {
          onClick: 'func:window.hideModal',
          aProps: {
            className: '__re-bulma_button __re-bulma_is-primary',
          },
        },
      },
    },
  };
}

module.exports = {
  fullText,
  runSimulation,
  listText,
};