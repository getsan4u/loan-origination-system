'use strict';
const capitalize = require('capitalize');
const pluralize = require('pluralize');
const decisionTabs = require('../../../../utilities/views/decision/shared/components/decisionTabs');
const collectionUpdateDetailTabs = require('../../../../utilities/views/decision/shared/components/collectionUpdateDetailTabs');
const styles = require('../../../../utilities/views/constants/styles');
const CONSTANTS = require('../../../../utilities/views/decision/constants');
const DATA_TYPES_DROPDOWN = CONSTANTS.DATA_TYPES_DROPDOWN;
const cardprops = require('../../../../utilities/views/decision/shared/components/cardProps');
const formElements = require('../../../../utilities/views/decision/shared/components/formElements');
const updateOverview = require('../../../../utilities/views/decision/shared/components/updateOverview');
const updateHistoryDetailStrategyTable = require('../../../../utilities/views/decision/shared/components/updateHistoryDetailStrategyTable');
const plainHeaderTitle = require('../../../../utilities/views/shared/component/layoutComponents').plainHeaderTitle;
const randomKey = Math.random;

module.exports = {
  'containers': {
    [ '/decision/strategies/:id/update_history_detail/:index/:segment_name/:segment_index' ]: {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103 ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          decisionTabs('strategies'),
          plainHeaderTitle({ title: 'Update Detail', }),
          collectionUpdateDetailTabs({ tabname: 'versions', collection: 'strategy', }),
          {
            component: 'Container',
            asyncprops: {
              _children: [ 'strategydata', 'data', 'update_history_detail' ],
            }
          } ],
      },
      'resources': {
        [ 'strategydata' ]: '/decision/api/standard_strategies/:id/changelog?format=json&page=updateHistoryDetail&change_type=rules',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      'pageData': {
        'title': 'DigiFi | Strategy Management',
        'navLabel': 'Strategy Management',
      },
      'onFinish': 'render',
    },
  },
};