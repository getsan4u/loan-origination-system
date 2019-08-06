'use strict';

const formElements = require('../../../formElements');
const styles = require('../../../../constants/styles');
const randomKey = Math.random;

function approveRejectButtons(options) {
  return {
    component: 'Section',
    props: {
      style: {
        padding: 0,
        marginBottom: 20,
        background: 'none',
        display: 'flex',
      },
    },
    children: [
      {
        component: 'ResponsiveButton',
        asyncprops: {
          onclickPropObject: ['applicantdata', 'applicant', 'transform', 'verification'],
          processing: ['applicantdata', 'applicant', 'transform', 'verification', 'processing',],
          successProps: ['applicantdata', 'applicant', 'transform', 'redirectProps',]
        },
        comparisonprops: [{
          left: ['processing', `${options.approve.step}_single_button`],
          operation: 'eq',
          right: false,
        },],
        props: {
          style: Object.assign({}, styles.buttons.approveAction, { width: '100%', marginRight: '10px', fontSize: '17px', }),
          // 'onClick': 'func:this.props.debug',
          'onClick': 'func:this.props.fetchAction',
          'onclickBaseUrl': `/dsa/verification/:id?step=${options.approve.step}&action=pass`,
          'onclickLinkParams': [{
            'key': ':id', 'val': '_id',
          },],
          'fetchProps': {
            'method': 'PUT',
          },
          // 'successProps': {
          //   'success': true,
          //   'successCallback': 'func:this.props.refresh',
          // },
          'confirmModal': styles.defaultconfirmModalStyle,
          buttonProps: {
            color: 'isSuccess',
            size: 'isMedium',
          },
        },
        children: options.approve.label,
      },
      {
        component: 'ResponsiveButton',
        asyncprops: {
          onclickPropObject: ['applicantdata', 'applicant', 'transform', 'verification'],
          processing: ['applicantdata', 'applicant', 'transform', 'verification', 'processing',],
          successProps: ['applicantdata', 'applicant', 'transform', 'redirectProps',]
        },
        comparisonprops: [{
          left: ['processing', `${options.approve.step}_single_button`],
          operation: 'eq',
          right: false,
        },],
        props: {
          style: Object.assign({}, styles.buttons.rejectAction, { width: '100%', fontSize: '17px', }),
          // 'onClick': 'func:this.props.debug',
          'onClick': 'func:this.props.fetchAction',
          'onclickBaseUrl': `/dsa/verification/:id?step=${options.reject.step}&action=fail`,
          'onclickLinkParams': [{
            'key': ':id', 'val': '_id',
          },],
          'fetchProps': {
            'method': 'PUT',
          },
          // 'successProps': {
          //   'success': true,
          //   'successCallback': 'func:this.props.refresh',
          // },
          'confirmModal': styles.defaultconfirmModalStyle,
          buttonProps: {
            color: 'isDanger',
            size: 'isMedium',
          },
        },
        children: options.reject.label,
      },
      {
        component: 'ResponsiveButton',
        asyncprops: {
          onclickPropObject: ['applicantdata', 'applicant', 'transform', 'verification'],
          processing: ['applicantdata', 'applicant', 'transform', 'verification', 'processing',],
        },
        comparisonprops: [{
          left: ['processing', `${options.approve.step}_single_button`],
          operation: 'eq',
          right: true,
        },],
        props: {
          style: Object.assign({}, styles.buttons.approveAction, { width: '100%', marginRight: '10px', fontSize: '17px', }),
          // 'onClick': 'func:this.props.debug',
          'onClick': 'func:this.props.fetchAction',
          'onclickBaseUrl': `/dsa/verification/:id?step=${options.adjust.step}&action=adjust`,
          'onclickLinkParams': [{
            'key': ':id', 'val': '_id',
          },],
          'fetchProps': {
            'method': 'PUT',
          },
          'successProps': {
            'success': true,
            'successCallback': 'func:this.props.refresh',
          },
          'confirmModal': styles.defaultconfirmModalStyle,
          buttonProps: {
            color: 'isSuccess',
            size: 'isMedium',
          },
        },
        children: `${options.adjust.label} is complete. Click here if you need to adjust this.`,
      },
    ],
  };
}

module.exports = {
  approveRejectButtons,
};