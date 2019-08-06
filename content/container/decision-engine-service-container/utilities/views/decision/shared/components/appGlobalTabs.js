'use strict';

function getTabComponent(tab, tabname, baseURL) {
  return {
    component: 'Tab',
    props: {
      isActive: (tab.category === tabname),
      style: {
      },
    },
    children: (tab.dropdownType === 'latest')
      ? [{
        component: 'ResponsiveButton',
        props: {
          onClick: 'func:this.props.reduxRouter.push',
          onclickProps: `/decision/${tab.category}/all`,
          style: {
            border: 'none',
            height: '44px',
            width: '100%',
            display: 'inline-flex',
          },
        },
        children: tab.label,
      }, ]
      : (tab.dropdownType === 'segment') 
        ? [{
          component: 'Semantic.Dropdown',
          props: {
            text: tab.label,
            className: '__des_dropdown',
            style: {
              position: 'unset',
              width: '100%',
              display: 'block',
            },
          },
          children: [{
            component: 'Semantic.DropdownMenu',
            props: {
              style: {
                left: 'unset',
              },
            },
            children: getSegmentMenu(tab),
          },],
        },]
        : (tab.dropdownType === 'input') 
          ? [{
            component: 'ResponsiveButton',
            props: {
              onClick: 'func:this.props.reduxRouter.push',
              onclickProps: `/decision/${tab.category}/input`,
              style: {
                border: 'none',
                height: '44px',
                width: '100%',
                display: 'inline-flex',
              },
            },
            children: tab.label,
          }, ]
          : (tab.dropdownType === 'none') 
            ? [{
              component: 'ResponsiveButton',
              props: {
                onClick: 'func:this.props.reduxRouter.push',
                onclickProps: `/decision/${tab.category}`,
                style: {
                  border: 'none',
                  height: '44px',
                  width: '100%',
                  display: 'inline-flex',
                },
              },
              children: tab.label,
            }, ]
            : '',
  };
}

function getActiveMenu(baseURL) {
  return ;
}

let SEGMENT_CONSTANTS = [
  {
    title: 'All',
    baseURL: 'default',
  }, 
  {
    title: 'Population',
    baseURL: 'population',
  }, 
  {
    title: 'Requirements',
    baseURL: 'requirements',
  }, 
  {
    title: 'Scorecard',
    baseURL: 'scorecard',
  }, 
  {
    title: 'Output',
    baseURL: 'output',
  }, 
  {
    title: 'Limits',
    baseURL: 'limits',
  }, 
];

function getSegmentMenu(tab, none) {
  let SEG_CONSTANTS = SEGMENT_CONSTANTS;
  SEG_CONSTANTS = SEGMENT_CONSTANTS;
  let segmentMenu = SEG_CONSTANTS.map(segment => {
    return {
      component: 'Semantic.DropdownItem',
      children: [{
        component: 'ResponsiveLink',
        props: {
          location: `/decision/${tab.category}/${segment.baseURL}` + `${(none) ? '' : '/all'}`,
        },
        children: segment.title,
      }, ],
    };
  });
  return segmentMenu;
}

const labelMap = {
  'Rule Sets': 'Create New Rule Set',
  'Calculations': 'Create New Calculation',
  'Strategies': 'Create New Strategy',
  'Rules': 'Create New Rule',
  'Variables': 'Create New Variable',
};

const titleMap = {
  'Rule Sets': 'Rule Set',
  'Calculations': 'Calculation',
  'Strategies': 'Strategy',
  'Rules': 'Rule',
  'Variables': 'Variable',
};

function getQuickAddOptions(tab) {
  return {
    component: 'Semantic.DropdownItem',
    props: {},
    children: [getQuickAddButton(tab),],
  };
}

function getQuickAddButton(tab) {
  return {
    component: 'ResponsiveButton',
    props: {
      onClick: 'func:this.props.createModal',
      onclickProps: {
        title: `Create ${tab.label}`,
        pathname: `/decision/${tab.category}/${tab.dropdownType}`,
      },
    },
    children: `${tab.label}`,
  };
}
/**
 * Create tabs under header.
 * @param {Object[]} tabs Array of objects containing tab label and location.
 * @param {String} tabname Current tab. Appends to base url for full url.
 * @param {String} baseURL Base url.
 * @return {Object} Returns tab component.
 */
function generateComponent (tabs, tabname, baseURL) {
  let dropdowntabs = [{ label: 'Input Variable', category: 'variables', dropdownType: 'new/input', }, { label: 'Output Variable', category: 'variables', dropdownType: 'new/output', },];
  return {
    component: 'div',
    props: {
      style: {
        width:'100%',
      },
      className:'__cis_global_breadcrumb',
    },
    children: [ {
      component: 'Container',
      props: {
        style: {
          display: 'flex',
        },
      },
      children: [{
        component: 'Tabs', 
        props: {
          tabStyle: 'isBoxed',
          style: {
            flex: '1 1 auto',
          },
        },
        children: [
          {
            component: 'TabGroup',
            children: tabs.map(tab => {
              return getTabComponent(tab, tabname, baseURL);
            }),
            props: {
              className: 'breadcrumb',
            },
          },
        ],
      }, 
      {
        component: 'div',
        props: {
          style: {
            width: '100px',
            display: 'flex',
            justifyContent: 'flex-end',
            flexDirection: 'row',
          },
        },
        children: [{
          component: 'Semantic.Dropdown',
          props: {
            icon: 'plus',
            className: '__quickadd_dropdown',
            style: {
              display: 'inline-flex',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            },
            buttonProps: {
              color: 'isLink',
            },
          },
          children: [{
            component: 'Semantic.DropdownMenu',
            props: {
              style: {
                left: 'unset',
                right: 0,
              },
            },
            children: dropdowntabs.map(getQuickAddOptions),
          },],
        }, 
        {
          component: 'ResponsiveButton',
          props: {
            onClick: 'func:this.props.createModal',
            onclickProps: {
              title: 'Contact the DigiFi Team',
              pathname: '/modal/contact',
            },
            style: {
              display: 'inline-flex',
              height: '100%',
              alignItems: 'center',
              paddingLeft: '5px',
              paddingRight: '5px',
              border: 'transparent',
            },
            buttonProps: {
              color: 'isLink',
            },
          },
          children: [{
            component: 'Icon',
            props: {
              icon: 'fa fa-phone',
              style: {
                margin: 0,
                fontSize: '20px',
              },
            },
          },],
        },
        {
          component: 'ResponsiveButton',
          props: {
            onClick: 'func:this.props.createModal',
            onclickProps: {
              title: 'What Do You Need Help With?',
              pathname: '/modal/search',
            },
            style: {
              display: 'inline-flex',
              height: '100%',
              alignItems: 'center',
              paddingLeft: '5px',
              paddingRight: '5px',
              border: 'transparent',
            },
            buttonProps: {
              color: 'isLink',
            },
          },
          children: [{
            component: 'Icon',
            props: {
              icon: 'fa fa-question',
              style: {
                margin: 0,
                fontSize: '22px',
              },
            },
          },],
        },],
      },
      ],
    }, ],
  };
}

module.exports = generateComponent;