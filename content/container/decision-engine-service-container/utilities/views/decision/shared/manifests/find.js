'use strict';

const pluralize = require('pluralize');
const capitalize = require('capitalize');
const styles = require('../../../constants').styles;
const references = require('../../../constants').references;
const decisionTabs = require('../components/decisionTabs');
const findTable = require('../components/findTable');
const findTabs = require('../components/collectionFindTabs');
const cardprops = require('../components/cardProps');
const plainHeaderTitle = require('../../../shared/component/layoutComponents').plainHeaderTitle;

function buildContent(options) {
  let indexButtons = (options.collection === 'variable')
    ? [ {
      component: 'ResponsiveButton',
      asyncprops: {
        privilege_id: [ 'checkdata', 'permissionCode',],
      },
      comparisonorprops: true,
      comparisonprops: [{
        left: ['privilege_id'],
        operation: 'eq',
        right: 101,
      }, {
        left: ['privilege_id'],
        operation: 'eq',
        right: 102,
      }],
      props: {
        onClick: 'func:this.props.createModal',
        onclickProps: {
          title: `Create New ${capitalize(options.collection)}`,
          pathname: options.createModalUrl,
        },
        style: {
          marginRight: '10px',
        },
        buttonProps: {
          color: 'isSuccess',
        },
      },
      children: `CREATE NEW ${options.collection.toUpperCase()}`,
    }, 
    {
      component: 'ResponsiveButton',
      asyncprops: {
        privilege_id: [ 'checkdata', 'permissionCode',],
      },
      comparisonorprops: true,
      comparisonprops: [{
        left: ['privilege_id'],
        operation: 'eq',
        right: 101,
      }, {
        left: ['privilege_id'],
        operation: 'eq',
        right: 102,
      }],
      props: {
        onClick: 'func:this.props.createModal',
        onclickProps: {
          title: `Bulk Add ${capitalize(pluralize(options.collection))}`,
          pathname: `/decision/${pluralize(options.collection)}/bulk_add_variables`,
        },
        buttonProps: {
          color: 'isSuccess',
        },
      },
      children: `BULK UPLOAD VARIABLES`,
    },]
    : [ {
      component: 'ResponsiveButton',
      asyncprops: {
        privilege_id: [ 'checkdata', 'permissionCode',],
      },
      comparisonorprops: true,
      comparisonprops: [{
        left: ['privilege_id'],
        operation: 'eq',
        right: 101,
      }, {
        left: ['privilege_id'],
        operation: 'eq',
        right: 102,
      }],
      props: {
        onClick: 'func:this.props.createModal',
        onclickProps: {
          title: `Create New ${capitalize(options.collection)}`,
          pathname: options.createModalUrl,
        },
        buttonProps: {
          color: 'isSuccess',
        },
      },
      children: `CREATE NEW ${options.collection.toUpperCase()}`,
    }, ]
  return [ {
    component: 'Container',
    props: {
      style: {
        padding: 0,
        margin: '20px auto',
      }
    },
    children: [ {
      component: 'Columns',
      props: {
        className: 'global-button-bar',
      },
      children: [ {
        component: 'Column',
        props: {
          size: 'isNarrow',
        },
        children: indexButtons,
      }, {
        component: 'Column',
        props: {
          className: 'global-search-bar',
        }
      }, {
        component: 'Column',
        props: {
          size: 'isNarrow',
          className: 'global-guide-btn',
        },
        children: [ {
          component: 'ResponsiveButton',
          props: {
            onclickBaseUrl: (options.collection === 'strategy') 
              ? references.guideLinks.rulesEngine.strategies
              : (options.collection === 'variable')
                ? references.guideLinks.rulesEngine.variables
                : `https://docs.digifi.io/docs/${pluralize(options.collection)}`,
            aProps: {
              target: '_blank',
              className: '__re-bulma_button __re-bulma_is-primary',
            }
          },
          children: [ {
            component: 'span',
            children: 'GUIDE',
          }, {
            component: 'Icon',
            props: {
              icon: 'fa fa-external-link'
            }
          }],
        }, ]
      }, ]
    }]
  }, {
    component: 'ResponsiveCard',
    props: cardprops({
      // cardTitle: options.cardTitle,
      headerStyle: {
        display: 'none',
      }
    }),
    children: [ findTable(options) ]
  }, ];
}
function generateManifests(options) {
  let pageTitle = capitalize(pluralize(options.collection))
  let resource_route = (options.collection === 'variable') ? `/decision/api/standard_${pluralize(options.collection)}?format=json&type=${options.tabname}` : `/decision/api/standard_${pluralize(options.collection)}?format=json`;
  return {
    containers: {
      [ options.url ]: {
        layout: {
          privileges: options.privileges || null,
          component: 'div',
          props: {
            style: styles.pageContainer,
          },
          children: [
            decisionTabs('strategies'),
            plainHeaderTitle(
              {
                title: 'Rules Management',
                subtitle: 'Define rules-based decision and processing logic',
              }),
            findTabs({
              collection: options.collection,
              category: options.category,
              tabname: options.tabname,
            }),
            {
              component: 'Container',
              children: [
                // plainHeaderTitle({ title: pageTitle}),
                ...buildContent(options),
              ],
            },
          ],
        },
        'resources': {
          [ `${options.collection}data` ]: resource_route,
          checkdata: {
            url: '/auth/run_checks',
            options: {
              onSuccess: [ 'func:window.redirect', ],
              onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
              blocking: true,
              renderOnError: false,
            },
          },
          pagedata: '/decision/pagedata'
        },
        'callbacks': 'func:window.updateGlobalSearchBar',
        'onFinish': 'render',
        'pageData': {
          'title': 'DigiFi | Decision Engine',
          'navLabel': 'Decision Engine',
        },
      },
    },
  };
}


module.exports = generateManifests;