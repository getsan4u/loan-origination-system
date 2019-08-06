'use strict';
const pluralize = require('pluralize');

// OLD COLLECTION TABS
// const TABS = [ {
//   label: 'All Versions',
//   location: 'all',
// }, {
//   label: 'Active Versions',
//   location: 'active',
// }, {
//   label: 'Testing Versions',
//   location: 'testing',
// }, ];

const NEW_TABS = [ {
  label: 'Strategies',
  location: 'strategies/all',
  name: 'all',
}, {
  label: 'Variables',
  location: 'variables/all',
  name: 'variablesall',
}, ];

const VARIABLE_TABS = [ {
  label: 'Input Variables',
  location: 'input',
}, {
  label: 'Output Variables',
  location: 'output',
}, ];

// function getTabComponent(tab, options) {
//   return {
//     component: 'Tab',
//     props: {
//       isActive: (tab.location === options.tabname),
//       style: {
//         textAlign: 'center'
//       },
//     },
//     children: [ {
//       component: 'ResponsiveButton',
//       asyncprops: {
//         // onclickPropObject: [`${options.collection}data`, 'data']
//       },
//       props: {
//         onClick: 'func:this.props.reduxRouter.push',
//         onclickBaseUrl: `/decision/${pluralize(options.collection)}/${tab.location}`,
//         style: {
//           border: 'none',
//         },
//       },
//       children: tab.label,
//     }, ],
//   };
// }

function getTabComponent(tab, options) {
  return {
    component: 'Tab',
    props: {
      isActive: (tab.name === options.tabname),
      style: {
        textAlign: 'center'
      },
    },
    children: [ {
      component: 'ResponsiveButton',
      asyncprops: {
        // onclickPropObject: [`${options.collection}data`, 'data']
      },
      props: {
        onClick: 'func:this.props.reduxRouter.push',
        onclickBaseUrl: `/decision/${tab.location}`,
        style: {
          border: 'none',
        },
      },
      children: tab.label,
    }, ],
  };
}

function generateComponent(options) {
  let { tabname, } = options;
  // let tabArr = (options.collection === 'variable') ? VARIABLE_TABS : NEW_TABS;
  return {
    component: 'div',
    props: {
      className: 'global-sub-tabs',
      style: {
        marginBottom: '20px',
        borderBottom: '1px solid #d3d6db',
      }
    },
    children: [ {
      component: 'Container',
      children: [ {
        component: 'Tabs',
        props: {
          tabStyle: 'isBoxed',
          style: {
            marginBottom: '-1px',
            marginTop: '-10px',
          }
        },
        children: [
          {
            component: 'TabGroup',
            children: NEW_TABS.map(tab => getTabComponent(tab, options)),
            props: {},
          },
        ]
      }]
    }]
  }
};

module.exports = generateComponent;