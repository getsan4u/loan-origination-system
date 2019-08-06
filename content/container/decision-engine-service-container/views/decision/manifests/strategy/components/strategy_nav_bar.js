'use strict';
const styles = require('../../../../../utilities/views/constants/styles');

function getDeleteSegmentButton(segmentType) {
  return {
    passProps: {
      buttonProps: {
        icon: 'fa fa-trash',
        color: 'isLink',
      },
      style: {
        display: null,
      },
      onClick: 'func:this.props.fetchAction',
      onclickBaseUrl: `/decision/api/standard_strategies/:id/segments/${segmentType}/:index?method=delete`,
      onclickLinkParams: [ { key: ':id', val: '_id', }, {'key': ':index', 'val': 'index', }],
      fetchProps: {
        method: 'PUT',
      },
      successProps: {
        success: {
          notification: {
            text: 'Changes saved successfully!',
            timeout: 10000,
            type: 'success',
          },
        },
        successCallback: 'func:window.deleteRedirect',
      },
      confirmModal: styles.defaultconfirmModalStyle,
    },
  };
}

function strategyNavBar(type) {
  return {
    component: 'ResponsiveNavBar',
    asyncprops: {
      navData: [ `${type}data`, 'data', 'all_segments' ],
      _id: [ `${type}data`, 'data', '_id'],
      toggleData: [ `${type}data`, 'data', 'toggle_data' ],
      navSections: [`${type}data`, 'data', 'nav_sections' ],
    },
    props: {
      params: [ { key: ':id', val: '_id', }, {'key': ':index', 'val': 'index', }],
      accordionProps: {
        className: 'strategy-sidebar ',
      },
      sectionProps: {
        fitted: true,
      },
    },
  };
}

module.exports = strategyNavBar;