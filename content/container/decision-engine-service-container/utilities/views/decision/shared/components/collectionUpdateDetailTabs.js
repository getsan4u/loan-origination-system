'use strict';

const COLLECTION_TABS = require('../../constants').COLLECTION_TABS;
const pluralize = require('pluralize');

function getTabComponent(tab, options) {
  if (tab.location === 'segment') {
    return {
      component: 'Tab',
      props: {
        isActive: (tab.location === options.tabname),
        style: {
          textAlign: 'center'
        },
      },
      asyncprops: {
        existsdata: [`${options.collection}data`, 'data', 'entity_exists']
      },
      conditionalprops: ['existsdata',],
      children: [ {
        component: 'ResponsiveButton',
        asyncprops: {
          onclickPropObject: [ `${options.collection}data`, 'data' ],
          onclickBaseUrl: [ `${options.collection}data`, 'data', 'onclickBaseUrl' ],
        },
        props: {
          onClick: 'func:this.props.reduxRouter.push',
          onclickLinkParams: [ {
            key: ':id',
            val: '_id'
          }, {
            key: ':type',
            val: 'type',
          }],
          style: {
            border: 'none',
          },
        },
        children: tab.label,
      }, ],
    };
  } else {
    return {
      component: 'Tab',
      props: {
        isActive: (tab.location === options.tabname),
        style: {
          textAlign: 'center'
        },
      },
      asyncprops: {
        existsdata: [`${options.collection}data`, 'data', 'entity_exists']
      },
      conditionalprops: ['existsdata',],
      children: [ {
        component: 'ResponsiveButton',
        asyncprops: {
          onclickPropObject: [ `${options.collection}data`, 'data' ]
        },
        props: {
          onClick: 'func:this.props.reduxRouter.push',
          onclickBaseUrl: (options.category) ? `/decision/${pluralize(options.collection)}/:type/:id/${tab.location}` : `/decision/${pluralize(options.collection)}/:id/${tab.location}`,
          onclickLinkParams: [ {
            key: ':id',
            val: '_id'
          }, {
            key: ':type',
            val: 'type',
          }],
          style: {
            border: 'none',
          },
        },
        children: tab.label,
      }, ],
    };
  }
}

function generateComponent(options) {
  let { tabname, collection } = options;
  let tabs = COLLECTION_TABS[ collection ];
  let collectionTabs = tabs.filter(tab => (tab.location !== 'update_history_detail'));
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
            children: collectionTabs.map(tab => getTabComponent(tab, options)),
            props: {},
          },
        ]
      }]
    }]
  }
};

module.exports = generateComponent;