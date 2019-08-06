'use strict';
const PEOPLE_TABS = [ {
  label: 'Details',
  location: '',
}, {
  label: 'Documents',
  location: 'docs',
}, {
  label: 'Communications',
  location: 'communications',
}, {
  label: 'Tasks',
  location: 'tasks',
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
        onclickPropObject: [ 'peopledata', 'person', ],
      },
      props: {
        onClick: 'func:this.props.reduxRouter.push',
        onclickBaseUrl: `/los/people/:id/${tab.location}`,
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
            children: PEOPLE_TABS.map(tab => getTabComponent(tab, tabname)),
            props: {},
          },
        ]
      } ]
    } ]
  }
}

module.exports = generateComponent;