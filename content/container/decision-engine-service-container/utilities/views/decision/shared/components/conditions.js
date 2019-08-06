'use strict';

const styles = require('../../../constants').styles;
const randomKey = Math.random;

function generateComponent(options) {
  return {
    type: 'datatable',
    name: options.name,
    useInputRows: false,
    addNewRows: false,
    label: ' ',
    labelProps: {
      style: {
        flex: 1,
      },
    },
    passProps: {
      turnOffTableSort: true,
      formRowUpButton: {
        icon: 'fa fa-arrow-up',
        className: '__icon_button',
      },
      formRowDownButton: {
        icon: 'fa fa-arrow-down',
        className: '__icon_button'
      },
      formRowDeleteButton: {
        icon: 'fa fa-trash',
        color: 'isDanger',
        className: '__icon_button'
      },
      formRowUpButtonLabel: ' ',
      formRowDownButtonLabel: ' ',
      formRowDeleteButtonLabel: ' ',
    },
    layoutProps: {},
    headers: options.headers.concat([{
      label: ' ',
      formRowButtons: true,
      dynamicFormRowWidth: 45,
      columnProps: {
        style: {
          whiteSpace: 'nowrap',
        }
      },
      buttons: [{
        passProps: {
          buttonProps: {
            icon: 'fa fa-pencil',
            className: '__icon_button'
          },
          onClick: 'func:this.props.reduxRouter.push',
          onclickBaseUrl: `/decision/${options.name}/:id/detail`,
          onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
        },
      }]
    }]),
  };
}

module.exports = generateComponent;
