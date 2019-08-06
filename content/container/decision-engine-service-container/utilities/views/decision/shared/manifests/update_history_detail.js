'use strict';

const moment = require('moment');
const styles = require('../../../constants').styles;
const randomKey = Math.random; 
const capitalize = require('capitalize');
const formConfigs = require('../components/formConfigs');
const pluralize = require('pluralize');
const decisionTabs = require('../components/decisionTabs');
const collectionDetailTabs = require('../components/collectionDetailTabs');
const plainHeaderTitle = require('../../../shared/component/layoutComponents').plainHeaderTitle; 

function update_history_detail(options) {
  let { validations, hiddenFields, formgroups, additionalComponents, ruleUpdateDetail, } = formConfigs[ options.type ].edit;
  let pluralizedType = pluralize(options.type);
  ruleUpdateDetail = (options.type === 'rule') ? ruleUpdateDetail : [];
  return {
    'containers': {
      [`/decision/${pluralizedType}/:id/update_history_detail/:index`]: {
        layout: {
          privileges: [101, 102,],
          component: 'div',
          props: {
            style: styles.pageContainer,
          },
          children: [decisionTabs(pluralizedType),
            plainHeaderTitle({ title: `${options.title} Update Detail`, }),
            collectionDetailTabs({ tabname: 'versions', collection: options.type ,}), 
            {
              component: 'Container',
              children: [{
                component: 'ResponsiveForm',
                props: {
                  flattenFormData: true,
                  footergroups: false,
                  onSubmit: {},
                  formgroups: formgroups['update_history_detail'],
                },
                asyncprops: {
                  formdata: [`${options.type}data`, 'data',],
                },
              }, ].concat(ruleUpdateDetail),
            },],
        },
        'resources': {
          [ `${options.type}data` ]: `/decision/api/standard_${pluralizedType}/:id?format=json`,
          checkdata: {
            url: '/auth/run_checks',
            options: {
              onSuccess: ['func:window.redirect',],
              onError: ['func:this.props.logoutUser', 'func:window.redirect',],
              blocking: true, 
              renderOnError: false,
            },
          },
        },
        'pageData': {
          'title': 'DigiFi | Decision Engine',
          'navLabel': 'Decision Engine',
        },
        'onFinish': 'render',
      },
    },
  };
}

module.exports = {
  update_history_detail,
};