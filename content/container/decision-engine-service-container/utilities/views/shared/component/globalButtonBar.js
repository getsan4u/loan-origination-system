'use strict';
const styles = require('../../constants/styles');
const randomKey = Math.random;

function formGlobalButtonBar(buttons) {
  let leftButtons = (buttons.left) ? buttons.left.map(button => {
    return (button.component)
      ? {
        type: 'layout',
        layoutProps: {
          size: 'isNarrow',
        },
        value: button,
      } : button;
  }) : [];
  let rightButtons = (buttons.right) ? buttons.right.map(button => {
    return (button.component || button.guideButton)
      ? {
        type: 'layout',
        layoutProps: {
          size: 'isNarrow',
          className: (button.guideButton) ? 'global-guide-btn' : '',
        },
        value: (button.guideButton)
          ? {
            component: 'a',
            children: [ {
              component: 'span',
              children: 'GUIDE',
            }, {
              component: 'Icon',
              props: {
                icon: 'fa fa-external-link',
              },
            }, ],
            props: {
              href: button.location,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: '__re-bulma_button __re-bulma_is-primary',
            },
          }
          : button,
      } : button;
  }) : [];
  return {
    gridProps: {
      key: Math.random(),
      isMulitline: false,
      className: 'global-button-bar',
    },
    formElements: [
      ...leftButtons,
      {
        type: 'layout',
        value: {
          component: 'div',
        },
      },
      ...rightButtons,
    ],
  };
}

function plainGlobalButtonBar(buttons) {
  let leftButtons = (buttons.left) ? buttons.left.map(button => {
    return {
      component: 'Column',
      props: {
        size: 'isNarrow',
        style: {
          whiteSpace: 'nowrap',
        },
      },
      children: [ button, ],
    };
  }) : [];
  let rightButtons = (buttons.right) ? buttons.right.map(button => {
    return {
      component: 'Column',
      props: {
        size: 'isNarrow',
        className: (button.guideButton) ? 'global-guide-btn' : '',
        style: {
          whiteSpace: 'nowrap',
        },
      },
      children: [
        (button.guideButton)
          ? {
            component: 'a',
            children: [ {
              component: 'span',
              children: 'GUIDE',
            }, {
              component: 'Icon',
              props: {
                icon: 'fa fa-external-link',
              },
            }, ],
            props: {
              href: button.location,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: '__re-bulma_button __re-bulma_is-primary',
            },
          }
          : button, ],
    };
  }) : [];
  return {
    component: 'Container',
    props: {
      style: {
        marginTop: '10px',
        marginBottom: '10px',
      },
    },
    children: [ {
      component: 'Columns',
      props: {
        className: 'global-button-bar',
        style: {
          marginBottom: 0,
        }
      },
      children: [
        ...leftButtons,
        {
          component: 'Column',
          props: {
            className: 'global-search-bar',
          },
        },
        ...rightButtons,
      ],
    }, ],
  };

}

module.exports = {
  plainGlobalButtonBar,
  formGlobalButtonBar,
};