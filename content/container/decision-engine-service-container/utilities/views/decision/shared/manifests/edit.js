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
const detailHeaderTitle = require('../../../shared/component/layoutComponents').detailHeaderTitle;
const detailAsyncHeaderTitle = require('../../../shared/component/layoutComponents').detailAsyncHeaderTitle; 
const getDetailHeaderButtons = require('../components/detailHeaderButtons');


function edit(options) {
  let { validations, hiddenFields, formgroups, additionalComponents } = (options.segmentDetail) ? formConfigs[ 'segment' ].edit : formConfigs[ options.type ].edit;
  let pluralizedType = pluralize(options.type);
  options.resources = options.resources || {};
  hiddenFields = Array.isArray(hiddenFields) ? hiddenFields : [];
  let url = (options.segmentDetail) ? `/decision/api/standard_${pluralizedType}/:id?format=json&type=editSegment` : `/decision/api/standard_${pluralizedType}/:id?format=json`;
  let pathname = (options.location === 'dependencies')
    ? `/decision/${pluralizedType}/:id/${options.location}/:status`
    : (options.segmentDetail)
      ? `/decision/${pluralizedType}/:id/segments/:category/:index`
      : `/decision/${pluralizedType}/:id/${options.location}`
  additionalComponents = ((options.location === 'detail' && additionalComponents) || options.segmentDetail || options.location === 'rulesets') ? additionalComponents : [];
  
  let displayTitle = options.title;
  let displayLocation = (options.location === 'update_history') 
    ? 'Update History' 
    : (options.location === 'rulesets')
      ? 'Process Modules'
      : capitalize(options.location)
  let headerTitle = ((options.location === 'segments' || options.location === 'detail') || options.location === 'versions') ? detailAsyncHeaderTitle : (options.location) ? detailHeaderTitle : plainHeaderTitle;
  let pageTitle = `${displayTitle}`;
  return {
    'containers': {
      [pathname]: {
        layout: {
          component: 'div',
          props: {
            style: styles.pageContainer,
          },
          children: [decisionTabs(pluralizedType),
            headerTitle({ title: pageTitle, type: options.type, }),
            collectionDetailTabs({ tabname: (options.location === 'segments') ? 'detail' : options.location  , collection: options.type }),
            getDetailHeaderButtons({ type: options.type, location: options.location}),
            {
            component: 'Container',
            children: [
              {
                component: 'ResponsiveForm',
                props: {
                  flattenFormData: true,
                  footergroups: false,
                  useFormOptions: true,
                  onSubmit: {
                    url,
                    params: [
                      { 'key': ':id', 'val': '_id', },
                    ],
                    options: {
                      headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'PUT',
                  },
                  successProps: {
                    type: 'success',
                    text: 'Changes saved successfully!',
                    timeout: 10000,
                  },
                  successCallback: 'func:window.editFormSuccessCallback',
                },
                asyncprops: {
                  formdata: [ `${options.type}data`, 'data' ],
                  __formOptions: [`${options.type}data`, 'formoptions'],
                },
                // validations,
                hiddenFields: hiddenFields,
                formgroups: formgroups[options.location]
              },
              asyncprops: {
                formdata: [`${options.type}data`, 'data'],
                versions: [`${options.type}data`, 'data', 'versions'],
                changelogs: [`${options.type}data`, 'data', 'changelogs'],
                __formOptions: [`${options.type}data`, 'formoptions'],
              },
            },].concat(additionalComponents)
          }]
        },
        'resources': Object.assign({}, {
          [ `${options.type}data` ]: `/decision/api/standard_${pluralizedType}/:id?format=json`,
          checkdata: {
            url: '/auth/run_checks',
            options: {
              onSuccess: [ 'func:window.redirect', ],
              onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
              blocking: true, 
              renderOnError: false,
            },
          },
        }, options.resources),
        'pageData': {
          'title': 'DigiFi | Decision Engine',
          'navLabel': 'Decision Engine',
        },
        'callbacks': ['func:window.globalBarSaveBtn'],
        'onFinish': 'render',
      },
    },
  };
}

module.exports = {
  edit,
}