'use strict';
const INTERMEDIARY_TABS = [ {
  label: 'Details',
  location: '',
}, {
  label: 'Applications',
  location: 'applications_dashboard',
}, {
  label: 'Documents',
  location: 'docs',
}, ];

function getTabComponent(tab, tabname) {
  return {
    component: 'Tab',
    props: {
      isActive: (tab.location === tabname),
      style: {
        textAlign: 'center'
      },
    },
    children: [ {
      component: 'ResponsiveButton',
      asyncprops: {
        onclickPropObject: [ 'intermediarydata', 'intermediary', ],
      },
      props: {
        onClick: 'func:this.props.reduxRouter.push',
        onclickBaseUrl: `/los/intermediaries/:id/${tab.location}`,
        onclickLinkParams: [ {
          key: ':id',
          val: '_id',
        } ],
        style: {
          border: 'none',
        },
      },
      children: tab.label,
    }, ],
  };
}

function generateComponent(tabname) {
  return {
    component: 'div',
    props: {
      className: 'global-sub-tabs',
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
            children: INTERMEDIARY_TABS.map(tab => getTabComponent(tab, tabname)),
            props: {},
          },
        ]
      } ]
    } ]
  }
}

module.exports = generateComponent;