'use strict';
const styles = require('../../../constants/styles');
const references = require('../../../constants/references');
const pluralize = require('pluralize');

let buttonTypes = {
  'guide': (url) => {
    let baseURL = url || '';
    return {
      component: 'ResponsiveButton',
      props: {
        // onClick: 'func:window.remoteSubmitClick',
        onclickBaseUrl: baseURL,
        aProps: {
          target: '_blank',
          className: '__re-bulma_button __re-bulma_is-primary',
        },
      },
      children: [{
        component: 'span',
        children: 'GUIDE',
      }, {
        component: 'Icon',
        props: {
          icon: 'fa fa-external-link'
        }
      }],
    }
  },
  'version': (type) => {
    return {
      component: 'ResponsiveButton',
      children: 'CREATE NEW VERSION',
      asyncprops: {
        onclickPropObject: [ `${type}data`, 'data' ],
      },
      props: {
        buttonProps: {
          color: 'isSuccess',
        },
        onClick: 'func:this.props.fetchAction',
        onclickBaseUrl: `/decision/api/standard_${pluralize(type)}?type=version`,
        fetchProps: {
          method: 'POST',
        },
        successProps: {
          success: {
            notification: {
              text: 'Created New Version',
              timeout: 10000,
              type: 'success',
            },
          },
          successCallback: 'func:this.props.reduxRouter.push',
        },
        confirmModal: styles.newVersionConfirmModalStyle
      }
    }
  },
  'variable_version': (type) => {
    return {
      component: 'ResponsiveButton',
      children: 'CREATE NEW VERSION',
      comparisonprops: [ {
        'left': [ 'onclickPropObject', 'type' ],
        'operation': 'eq',
        'right': 'Calculated'
      }],
      asyncprops: {
        onclickPropObject: [ `${type}data`, 'data' ],
      },
      props: {
        buttonProps: {
          color: 'isSuccess',
        },
        onClick: 'func:this.props.fetchAction',
        onclickBaseUrl: `/decision/api/standard_${pluralize(type)}?type=version`,
        fetchProps: {
          method: 'POST',
        },
        successProps: {
          success: {
            notification: {
              text: 'Created New Version',
              timeout: 10000,
              type: 'success',
            },
          },
          successCallback: 'func:this.props.reduxRouter.push',
        },
        confirmModal: styles.newVersionConfirmModalStyle
      }
    }
  },
  'add_ruleset': (type) => {
    return {
      component: 'ResponsiveButton',
      children: `ADD RULE SET`,
      bindprops: true,
      asyncprops: {
        onclickPropObject: [ `${type}data`, 'data' ],
      },
      props: {
        onClick: 'func:this.props.createModal',
        onclickProps: {
          title: 'Add Rule Set to Strategy',
          pathname: `/decision/strategies/:id/edit/ruleset`,
          params: [{ key: ':id', val: '_id', }]
        },
        buttonProps: {
          color: 'isSuccess'
        },
      }
    };
  },
  'add_rule': {
    component: 'ResponsiveButton',
    children: `ADD RULE`,
    bindprops: true,
    asyncprops: {
      onclickPropObject: [ 'rulesetdata', 'data' ]
    },
    props: {
      onClick: 'func:this.props.createModal',
      onclickProps: {
        title: 'Add Rule to Rule Set',
        pathname: `/decision/rulesets/rule/:id/add`,
        params: [ { key: ':id', val: '_id', }]
      },
      buttonProps: {
        color: 'isSuccess'
      },
    }
  },
};

const BUTTON_DETAILS = {
  strategy: {
    overview: {
      left: [ buttonTypes[ 'version' ]('strategy') ],
      right:[ buttonTypes[ 'guide' ], ],
    },
    detail: {
      left: [ buttonTypes[ 'add_ruleset' ]('strategy') , buttonTypes[ 'version' ]('strategy') ],
      right: [buttonTypes['guide'], ],
    },
    versions: {
      left: [ buttonTypes[ 'version' ]('strategy') ],
      right: [buttonTypes['guide'](references.guideLinks.rulesEngine.strategiesDetailVersions), ],
    },
    segments: {
      right: [buttonTypes['guide'], ],
    },
  },
  ruleset: {
    detail: {
      left: [ buttonTypes[ 'add_rule' ], buttonTypes[ 'version' ]('ruleset') ],
      right:[ buttonTypes[ 'guide' ], ],
    },  
    versions: {
      left: [ buttonTypes[ 'version' ]('ruleset') ],
      right: [buttonTypes['guide'](references.guideLinks.rulesEngine.strategiesDetailVersions),],
    },
  },
  rule: {
    detail: {
      left: [buttonTypes['version']('rule')],
      right: [buttonTypes['guide']('https://docs.digifi.io/docs/rule-building'),],
    },
    versions: {
      left: [buttonTypes['version']('rule')],
      right: [buttonTypes['guide'](references.guideLinks.rulesEngine.strategiesDetailVersions),],
    },
  },
  variable: {
    detail: {
      left: [buttonTypes['variable_version']('variable')],
      right: [buttonTypes['guide']('https://docs.digifi.io/docs/variables'), ],
    },
    versions: {
      left: [buttonTypes['variable_version']('variable')],
      right: [buttonTypes['guide'](references.guideLinks.rulesEngine.strategiesDetailVersions),],
    },
  },
}

function getDetailHeaderButtons(options) {
  options = options || {};

  if (BUTTON_DETAILS[options.type] && BUTTON_DETAILS[options.type][options.location]) {
    let leftButtons = (BUTTON_DETAILS[options.type][options.location].left)
      ? BUTTON_DETAILS[options.type][options.location].left.map(button => {
        return {
          component: 'Column',
          props: {
            size: 'isNarrow',
          },
          children: [button]
        }
      }) : [];
    let rightButtons = (BUTTON_DETAILS[options.type][options.location].right)
      ? [{
        component: 'Column',
        props: {
          className: 'global-guide-btn',
          size: 'isNarrow',
        },
        children: BUTTON_DETAILS[options.type][options.location].right
      }] : [];
    
    return {
      component: 'Container',
      props: {
        style: {
          marginBottom: '10px',
        }
      },
      children: [{
        component: 'Columns',
        props: {
          className: 'global-button-bar'
        },
        children: [
          ...leftButtons,
          {
          component: 'Column',
          },
          ...rightButtons  
        ]
      }]
    }
  } else {
    return null;
  }
}


module.exports = getDetailHeaderButtons;
