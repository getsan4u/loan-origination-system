'use strict';

const cardprops = require('../../shared/props/cardprops');
const styles = require('../../constants/styles');
let randomKey = Math.random;

module.exports = {
  component: 'ResponsiveCard',
  props: cardprops({
    cardTitle: 'Notes',
    cardStyle: {
      marginTop: 20,
    },
  }),
  children: [ {
    component: 'ResponsiveForm',
    asyncprops: {
      formdata: [ 'peopledata', 'person', ],
    },
    props: {
      setInitialValues: false,
      flattenFormData: true,
      footergroups: false,
      'onSubmit': {
        url: '/los/api/notes?entity_type=person',
        params: [ { key: ':id', val: '_id', }, ],
        options: {
          method: 'POST',
        },
        successCallback: 'func:window.closeModalAndCreateNotification',
        successProps: {
          text: 'Changes saved successfully!',
          timeout: 10000,
          type: 'success',
        },
        responseCallback: 'func:this.props.refresh',
      },
      hiddenFields: [ {
        form_name: 'person',
        form_val: '_id',
      }, ],
      formgroups: [ {
        gridProps: {
          key: randomKey(),
        },
        formElements: [ {
          name: 'content',
          type: 'textarea',
          label: ' ',
          errorIconRight: true,
          validateOnBlur: true,
          onBlur: true,
        }, ],
      }, {
        gridProps: {
          key: randomKey(),
        },
        formElements: [ {
          type: 'submit',
          value: 'SAVE NOTE',
          passProps: {
            color: 'isSuccess',
          },
          layoutProps: {},
        },
        ],
      },
      ],
    },
  }, {
    component: 'div',
    props: {
      style: {
        marginTop: 20,
      },
    },
    children: [ {
      component: 'ResponsiveTable',
      props: {
        dataMap: [ {
          'key': 'rows',
          value: 'rows',
        }, {
          'key': 'numItems',
          value: 'numItems',
        }, {
          'key': 'numPages',
          value: 'numPages',
        }, ],
        flattenRowData: true,
        limit: 15,
        hasPagination: false,
        // calculatePagination: true,
        'useInputRows': true,
        // baseUrl: '/payment/getTransactions?format=json&pagination=transactions',
        headerLinkProps: {
          style: {
            textDecoration: 'none',
            // color: styles.colors.darkGreyText,
          },
        },
        headers: [ {
          label: 'Date',
          sortid: 'updatedat',
          sortable: true,
        }, {
          label: 'Author',
          sortid: 'user.creator',
          sortable: false,
        }, {
          label: 'Content',
          sortid: 'content',
          sortable: false,
        }, {
          label: ' ',
          headerColumnProps: {
            style: {
              width: '80px',
            },
          },
          columnProps: {
            style: {
              whiteSpace: 'nowrap',
              textAlign: 'right',
            },
          },
          buttons: [ {
            passProps: {
              buttonProps: {
                icon: 'fa fa-pencil',
                className: '__icon_button',
              },
              onClick: 'func:this.props.createModal',
              onclickProps: {
                title: 'Edit Note',
                pathname: '/los/notes/:id',
                params: [ { 'key': ':id', 'val': '_id', } ],
              },
            },
          }, {
            passProps: {
              buttonProps: {
                icon: 'fa fa-trash',
                color: 'isDanger',
                className: '__icon_button',
              },
              onClick: 'func:this.props.fetchAction',
              onclickBaseUrl: '/los/api/notes/:id',
              onclickLinkParams: [ { 'key': ':id', 'val': '_id', } ],
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
                title: 'Delete Note',
                textContent: [ {
                  component: 'p',
                  children: 'Do you want to delete this note?',
                  props: {
                    style: {
                      textAlign: 'left',
                      marginBottom: '1.5rem',
                    },
                  },
                },
                ],
              }),
            },
          },
          ],
        }, ],
      },
      asyncprops: {
        rows: [ 'notedata', 'rows', ],
        numItems: [ 'notedata', 'numItems', ],
        numPages: [ 'notedata', 'numPages', ],
      },
    }, ],
  }, ],
};
