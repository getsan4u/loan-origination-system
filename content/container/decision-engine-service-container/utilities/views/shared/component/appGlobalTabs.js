'use strict';

/** Create tabs  */

function getTabComponent(tab, tabname, baseURL, plainHeader) {
  return (tab.dropdown) 
    ? {
      component: 'Tab',
      props: {
        isActive: ((tab.location === tabname) || (tab.label === tabname)),
      },
      children: [{
        component: 'Semantic.Dropdown',
        props: {
          text: tab.label,
          className: '__des_dropdown',
          icon: tab.icon,
          style: {
            width: '100%',
          },
        },
        children: [{
          component: 'Semantic.DropdownMenu',
          props: {},
          children: tab.dropdown.map(item => {
            return {
              component: 'Semantic.DropdownItem',
              children: [{
                component: 'ResponsiveLink',
                props: {
                  location: item.location,
                },
                children: (item.icon) ? [{
                  component: 'Semantic.Icon',
                  props: {
                    name: item.icon,
                    style: {
                      fontSize: '1em',
                      margin: '0 10px 0 -5px'
                    }
                  },
                }, {
                  component: 'div',
                  props: {
                    style: {
                      display: 'inline-block'
                    }
                  },
                  children: item.name,
                }] : item.name,
              }, ],
            };
          }),
        }, ],
      }, ],
    }
    : {
      component: 'Tab',
      props: {
        isActive: ((tab.location === tabname) || (tab.label === tabname)),
        style: {},
      },
      children: [{
        component: 'ResponsiveButton',
        props: {
          onClick: 'func:this.props.reduxRouter.push',
          onclickProps: `/${baseURL || tab.baseURL}/${tab.location}`,
          style: (plainHeader) ? { border: 'none', } : {
            border: 'none',
            height: '44px',
            width: '100%',
            display: 'inline-flex',
          },
        },
        children: (tab.icon) 
          ? [{
            component: 'Semantic.Icon',
            props: {
              name: tab.icon,
            },
          }, {
            component: 'div',
            children: tab.label,
          }]
          : tab.label,
      }, ],
    };
}

/**
 * Create tabs under header.
 * @param {Object[]} tabs Array of objects containing tab label and location.
 * @param {String} tabname Current tab. Appends to base url for full url.
 * @param {String} baseURL Base url.
 * @return {Object} Returns tab component.
 */
function appGlobalTabs(tabs, tabname, baseURL) {
  return {
    component: 'div',
    props: {
      style: {
        width:'100%',
      },
      className:'__cis_global_breadcrumb',
    },
    children: [{
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
          }, ],
        }, {
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
              borderColor: 'transparent',
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
          }, ],
        }, ],
      },
      ],
    }, ],
  };
}

/**
 * Create plain tabs component (without white background and padding)
 * @param {Object[]} tabs Array of objects containing tab label and location.
 * @param {String} tabname Current tab. Appends to base url for full url.
 * @param {String} baseURL Base url.
 * @return {Object} Returns tab component.
 */ 
function plainTabs(tabs, tabname, baseURL) {
  return {
    component: 'Columns',
    children: [{
      component: 'Column',
      props: {
        style: {
          marginTop: '10px',
        },
      },
      children: [{
        component: 'Tabs',
        children: [{
          component: 'TabGroup',
          children: tabs.map(tab => getTabComponent(tab, tabname, baseURL, true)),
          props: {
            className: 'breadcrumb',
          },
        }, ],
      }, ],
    }, ],
  };
}

module.exports = {
  appGlobalTabs,
  getTabComponent,
  plainTabs,
};