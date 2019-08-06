'use strict';

const capitalize = require('capitalize');
const pluralize = require('pluralize');
const utilities = require('../../../../utilities');
const decisionTabs = require('../../../../utilities/views/decision/shared/components/decisionTabs');
const collectionDetailTabs = require('../../../../utilities/views/decision/shared/components/collectionDetailTabs');
const detailAsyncHeaderTitle = require('../../../../utilities/views/shared/component/layoutComponents').detailAsyncHeaderTitle;
const detailHeaderButtons = require('../../../../utilities/views/decision/shared/components/detailHeaderButtons');
const styles = require('../../../../utilities/views/constants/styles');
const cardprops = require('../../../../utilities/views/decision/shared/components/cardProps');
const formElements = require('../../../../utilities/views/decision/shared/components/formElements');
const randomKey = Math.random;
let headerButtons = detailHeaderButtons({ type: 'strategy', location: 'versions' });

module.exports = {
  'containers': {
    [ '/decision/strategies/:id/versions' ]: {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          decisionTabs('strategies'),
          detailAsyncHeaderTitle({ title: 'Versions & Updates', type: 'strategy', }),
          collectionDetailTabs({ tabname: 'versions', collection: 'strategy' }),
          headerButtons,
          {
            component: 'Container',
            children: [
              {
                component: 'Columns',
                children: [ {
                  component: 'Column',
                  props: {
                    size: 'isHalf',
                  },
                  children: [ {
                    component: 'ResponsiveCard',
                    props: cardprops({
                      cardTitle: 'Versions',
                    }),
                    children: [ {
                      component: 'ResponsiveTable',
                      asyncprops: {
                        rows: [ 'versiondata', 'rows', ],
                        numItems: [ 'versiondata', 'numItems' ],
                        numPages: [ 'versiondata', 'numPages' ],
                        baseUrl: [ 'versiondata', 'baseUrl' ],
                      },
                      props: {
                        flattenRowData: true,
                        limit: 5,
                        dataMap: [ {
                          'key': 'rows',
                          value: 'rows',
                        }, {
                          'key': 'numItems',
                          value: 'numItems',
                        }, {
                          'key': 'numPages',
                          value: 'numPages',
                        } ],
                        hasPagination: true,
                        simplePagination: true,
                        'tableSearch': false,
                        'simpleSearchFilter': false,
                        headers: [ {
                          label: 'Version',
                          sortid: 'version',
                          headerColumnProps: {
                            style: {
                              width: '15%',
                            }
                          },
                        }, {
                          label: 'Updated Date',
                          momentFormat: styles.momentFormat.birthdays,
                          sortid: 'updatedat',
                          sortable: false,
                        }, {
                          label: 'Updated By',
                          sortid: 'user',
                          sortable: false,
                        }, {
                          label: 'Status',
                          sortid: 'status',
                          sortable: false,
                        }, {
                          label: ' ',
                          headerColumnProps: {
                            style: {
                              width: '40px',
                            }
                          },
                          columnProps: {
                            style: {
                              whiteSpace: 'nowrap',
                            }
                          },
                          buttons: [ {
                            passProps: {
                              buttonProps: {
                                icon: 'fa fa-pencil',
                                className: '__icon_button'
                              },
                              onClick: 'func:this.props.reduxRouter.push',
                              onclickBaseUrl: '/decision/strategies/:id/overview',
                              onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ]
                            },
                          },
                          ],
                        }, ],
                      }
                    }
                    ],
                  }, ],
                }, {
                  component: 'Column',
                  props: {
                    size: 'isHalf',
                  },
                  children: [ {
                    component: 'ResponsiveCard',
                    props: cardprops({
                      cardTitle: 'Update History',
                    }),
                    children: [ {
                      component: 'ResponsiveTable',
                      bindprops: true,
                      asyncprops: {
                        rows: [ 'changelogdata', 'rows', ],
                        numItems: [ 'changelogdata', 'numItems' ],
                        numPages: [ 'changelogdata', 'numPages' ],
                        baseUrl: [ 'changelogdata', 'baseUrl' ],
                      },
                      props: {
                        flattenRowData: true,
                        limit: 5,
                        dataMap: [ {
                          'key': 'rows',
                          value: 'rows',
                        }, {
                          'key': 'numItems',
                          value: 'numItems',
                        }, {
                          'key': 'numPages',
                          value: 'numPages',
                        } ],
                        hasPagination: true,
                        simplePagination: true,
                        'tableSearch': false,
                        'simpleSearchFilter': false,
                        headers: [ {
                          label: 'Date',
                          sortid: 'updatedat',
                          momentFormat: styles.momentFormat.birthdays,
                          sortable: false,
                        }, {
                          label: 'User',
                          sortid: 'user',
                          sortable: false,
                        }, {
                          label: 'Update Type',
                          sortid: 'change_type',
                          sortable: false,
                        }, {
                          label: ' ',
                          headerColumnProps: {
                            style: {
                              width: '40px'
                            },
                          },
                          columnProps: {
                            style: {
                              whiteSpace: 'nowrap',
                            }
                          },
                          buttons: [ {
                            passProps: {
                              buttonProps: {
                                icon: 'fa fa-pencil',
                                className: '__icon_button'
                              },
                              onClick: 'func:this.props.reduxRouter.push',
                              'onclickBaseUrl': '/decision/strategies/:endroute',
                              'onclickLinkParams': [ { key: ':endroute', val: 'endroute' }, ],
                            },
                          } ]
                        }, ]
                      }
                    }
                    ],
                  }, ],
                } ],
              },
            ]
          }
        ]
      },
      'resources': {
        [ 'strategydata' ]: '/decision/api/standard_strategies/:id/general_info',
        [ 'versiondata' ]: '/decision/api/standard_strategies/:id/versions?format=json&paginate=true',
        [ 'changelogdata' ]: '/decision/api/standard_strategies/:id/changelogs?format=json&paginate=true',
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
        'title': 'DigiFi | Decision Engine',
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};