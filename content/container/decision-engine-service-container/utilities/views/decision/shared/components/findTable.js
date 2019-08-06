'use strict';
const styles = require('../../../constants').styles;
const pluralize = require('pluralize');

const strategy = [
  // {
  //   label: 'Strategy Name',
  //   sortid: 'title',
  //   sortable: false,
  //   'link': {
  //     'baseUrl': '/decision/strategies/:id/detail',
  //     'params': [ { 'key': ':id', 'val': '_id', }, ],
  //   },
  //   'linkProps': {
  //     'style': {
  //       'textDecoration': 'none',
  //     },
  //   },
  // },
  {
    label: 'Strategy Name',
    headerColumnProps: {
      style: {
        width: '30%'
      },
    },
    sortid: 'display_title',
    sortable: false,
  },
  {
    label: 'Version',
    sortid: 'version',
    sortable: false,
  }, {
    label: 'Status',
    sortid: 'status',
    sortable: false,
  }, {
    label: 'Updated',
    sortid: 'formatted_updatedat',
    sortable: false,
  }, {
    label: 'Description',
    sortid: 'description',
    sortable: false,
    headerColumnProps: {
      style: {
        width: '20%'
      },
    },
  }, {
    label: ' ',
    headerColumnProps: {
      style: {
        width: '80px'
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
        onclickBaseUrl: '/decision/strategies/:id/overview',
        onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
      },
    }, {
      passProps: {
        buttonProps: {
          icon: 'fa fa-trash',
          color: 'isDanger',
          className: '__icon_button'
        },
        onClick: 'func:this.props.fetchAction',
        onclickBaseUrl: '/decision/api/standard_strategies/:id',
        onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
        fetchProps: {
          method: 'DELETE',
        },
        successProps: {
          success: {
            notification: {
              text: 'Changes saved successfully!',
              timeout: 10000,
              type: 'success',
            },
          },
          successCallback: 'func:this.props.refresh',
        },
        confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
          title: 'Delete Strategy',
          textContent: [ {
            component: 'p',
            children: 'Do you want to permanently delete this Strategy?',
            props: {
              style: {
                textAlign: 'left',
                marginBottom: '1.5rem',
              }
            }
          }, ],
        })
      },
    }, ],
  }, ];

const variable = [
  // {
  // label: 'Variable Name',
  // sortid: 'title',
  // sortable: false,
  // 'link': {
  //   'baseUrl': '/decision/variables/:id/detail',
  //   'params': [ { 'key': ':id', 'val': '_id', }, ],
  // },
  // 'linkProps': {
  //   'style': {
  //     'textDecoration': 'none',
  //   },
  // },
  // },
  {
    label: 'Display Name',
    sortid: 'display_title',
    sortable: false,
    headerColumnProps: {
      style: {
        width: '20%'
      },
    },
  },
  {
    label: 'System Name',
    sortid: 'title',
    sortable: false,
    headerColumnProps: {
      style: {
        width: '20%'
      },
    },
  },
  {
    label: 'Variable Type',
    sortid: 'type',
    sortable: false,
  },
  {
    label: 'Data Type',
    sortid: 'data_type',
    sortable: false,
  }, {
    label: 'Created',
    sortid: 'formatted_createdat',
    sortable: false,
  }, {
    label: 'Description',
    sortid: 'description',
    sortable: false,
    headerColumnProps: {
      style: {
        width: '20%'
      },
    },
  }, {
    label: ' ',
    headerColumnProps: {
      style: {
        width: '80px'
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
        onclickBaseUrl: '/decision/variables/:id/detail',
        onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
      },
    }, {
      passProps: {
        buttonProps: {
          icon: 'fa fa-trash',
          color: 'isDanger',
          className: '__icon_button'
        },
        onClick: 'func:this.props.fetchAction',
        onclickBaseUrl: '/decision/api/standard_variables/:id',
        onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
        fetchProps: {
          method: 'DELETE',
        },
        successProps: {
          success: {
            notification: {
              text: 'Changes saved successfully!',
              timeout: 10000,
              type: 'success',
            },
          },
          successCallback: 'func:this.props.refresh',
        },
        confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
          title: 'Delete Variable',
          textContent: [ {
            component: 'p',
            children: 'Do you want to delete this variable?',
            props: {
              style: {
                textAlign: 'left',
                marginBottom: '1.5rem',
              }
            }
          } ],
          buttonWrapperProps: {
            className: 'modal-footer-btns',
          },
        })
      },
    }, ],
  }, ];

const HEADERS = {
  strategy,
  variable,
};

const findTable = (options) => ({
  component: 'ResponsiveTable',
  props: {
    flattenRowData: true,
    limit: 10,
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
    calculatePagination: true,
    hasPagination: true,
    simplePagination: true,
    baseUrl: `/decision/api/standard_${pluralize(options.collection)}?format=json&type=${options.tabname}`,
    'tableSearch': true,
    'simpleSearchFilter': true,
    filterSearchProps: {
      icon: 'fa fa-search',
      hasIconRight: false,
      className: 'global-table-search',
      placeholder: 'SEARCH',
    },
    headers: HEADERS[ options.collection ],
    headerLinkProps: {
      style: {
        textDecoration: 'none',
      },
    },
  },
  asyncprops: {
    rows: [ `${options.collection}data`, 'rows', ],
    numItems: [ `${options.collection}data`, 'numItems', ],
    numPages: [ `${options.collection}data`, 'numPages', ],
  },
});

module.exports = findTable;