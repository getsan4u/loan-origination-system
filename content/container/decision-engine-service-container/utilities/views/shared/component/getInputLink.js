'use strict';
const styles = require('../../constants/styles');

function getInputLink(link) {
  return {
    'type': 'link',
    'name': link.name,
    'label': link.label,
    leftIcon: link.leftIcon,
    wrapperProps: {
      style: Object.assign({}, styles.inputStyle, {
        paddingLeft: (link.leftIcon) ? '27px' : 0,
      })
    },
    'linkWrapperProps':{
      'style': {
        'display': 'block',
        'paddingLeft': '8px',
        'paddingRight': '8px',
        'width': '100%',
      },
    },
    'value': {
      'component': 'ResponsiveButton',
      'props': Object.assign({
        'onClick': 'func:this.props.reduxRouter.push',
        'onclickBaseUrl': link.baseurl, //'/r-admin/contentdata/accounts/:id',
        'onclickThisProp': link.thisprop,
        'displayThisProps': link.displayprop,
        'onclickLinkParams': link.params, //[{ 'key':':id', 'val':'headerHost', },],
        'style': {
          'color': styles.colors.primary,
          'width': '100%',
        },
        className: 'testing-los'
      }, link.passProps),
      'children': link.displayprop,
    },
  };
}

module.exports = getInputLink;