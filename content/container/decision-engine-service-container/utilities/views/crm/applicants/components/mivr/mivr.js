'use strict';

const mivrrow = require('./mivrrow').mivrRow;
const styles = require('../../../../constants/styles');

function mivr() {
  return {
    component: 'ResponsiveForm',
    props: {
      onSubmit: {
        url:'/dsa/verification/:id?format=json&unflatten=true&step=mivr',
        params: [
          { 'key': ':id', 'val': 'verification_id', },
        ],
        options:{
          method:'PUT',
        },
        success: true,
        successCallback:'func:this.props.refresh',
        errorCallback: 'func:this.props.createNotification',
      },
      'hiddenFields':[{
        'form_name':'verification_id',
        'form_val':'verification_id',
      }, ],
      flattenFormData: true,
      footergroups: false,
      style:{
        overflow:'hidden',
      },
      formgroups: [
        {
          gridProps: {
            isMultiline: false,
            style:{
              overflow:'hidden',
              borderBottom: '1px solid #d3d6db',
            },
          },
          columnProps:{
            style:{
              overflow:'hidden',
            },
          },
          formElements: [{
            layoutProps: {
              style: {
                textAlign: 'left',
              },
              size: 'is4',
            },
            passProps: {
              style: {
                display: 'none',
              },
            },
            labelProps: {
              style: {
                fontWeight: 'normal',
                margin: 0,
              },
            },
            type: 'text',
            label: 'Description',
          }, 
            {
            layoutProps: {
              size: 'is6',
              style: {
                textAlign: 'left',
              },
            },
            passProps: {
              style: {
                display: 'none',
              },
            },
            labelProps: {
              style: {
                fontWeight: 'normal',
                margin: 0,
              },
            },
            type: 'text',
            label: 'Automated Result',
          }, 
            { 
            layoutProps: {
              size: 'is2',
              style: {
                textAlign: 'left',
              },
            },
            passProps: {
              style: {
                display: 'none',
              },
            },
            labelProps: {
              style: {
                fontWeight: 'normal',
                margin: 0,
              },
            },
            type: 'text',
            label: 'Passed?',
          }, ],
        }, mivrrow({
          label: 'Valid SSN',
          value: 'ssn.notes',
          passed: 'ssn.passed',
        }), mivrrow({
          label: 'Valid Date of Birth',
          value: 'valid_dob.notes',
          passed: 'valid_dob.passed',
        }), mivrrow({
          label: 'Valid Personal Phone Number',
          value: 'valid_phone.notes',
          passed: 'valid_phone.passed',
        }), mivrrow({
          label: 'Valid Personal Email Address',
          value: 'valid_email.notes',
          passed: 'valid_email.passed',
        }), mivrrow({
          label: 'Valid Personal Physical Address',
          value: 'valid_address.notes',
          passed: 'valid_address.passed',
        }), mivrrow({
          label: 'No Unresolved OFAC Alerts',
          value: 'ofac.notes',
          passed: 'ofac.passed',
        }), mivrrow({
          label: 'No Unresolved Consumer Statement Alerts',
          value: 'consumer_statement.notes',
          passed: 'consumer_statement.passed',
        }), mivrrow({
          label: 'Automated Fraud Score <=\u00a0LOW RISK (or Manually Approved)',
          value: 'fraud_score.notes',
          passed: 'fraud_score.passed',
        }), {
          gridProps: {
            isMultiline: false,
            style: {
              borderBottom: '1px solid #d3d6db',
              overflow:'hidden',
            },
          },
          formElements: [{
            layoutProps: {
              size: 'is12',
              style: {
                textAlign: 'center'
              }
            },
            passProps: {
              rows: '2',
              color: 'isPrimary'
            },
            type: 'submit',
            value: 'Save'
          }, ],
        },
      ],
    },
    asyncprops: {
      formdata: ['applicantdata', 'applicant', 'transform', 'mivrValues', ],
    },
  };
}
module.exports = {
  mivr,
};