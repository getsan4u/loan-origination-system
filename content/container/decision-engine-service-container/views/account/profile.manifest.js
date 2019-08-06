'use strict';

const formElements = require('../../utilities/views/shared/props/formElements').formElements;
const cardprops = require('../../utilities/views/shared/props/cardprops');
const styles = require('../../utilities/views/constants/styles');
const references = require('../../utilities/views/constants/references');
const periodic = require('periodicjs');
const reactappLocals = periodic.locals.extensions.get('@digifi-los/reactapp');
const reactapp = reactappLocals.reactapp();
const plainHeaderTitle = require('../../utilities/views/shared/component/layoutComponents').plainHeaderTitle;
const formGlobalButtonBar = require('../../utilities/views/shared/component/globalButtonBar').formGlobalButtonBar;
let randomKey = Math.random;
const utilities = require('../../utilities');

module.exports = {
  containers: {
    '/account/profile': {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          plainHeaderTitle({
            title: 'My Information & Settings',
          }),
          styles.fullPageDivider,
          {
            component: 'Container',
            children: [
              {
                component: 'ResponsiveForm',
                props: {
                  blockPageUI: true,
                  'onSubmit': {
                    url: ' /contentdata/update_standard_users_profile/:id?format=json&unflatten=true&handleupload=true',
                    'options':{
                      'method':'PUT',
                    },
                    'params': [
                      {
                        'key':':id',
                        'val':'_id',
                      },
                    ],
                    successProps: {
                      type: 'success',
                      text: 'Changes saved successfully!',
                      timeout: 10000,
                    },
                    successCallback: 'func:this.props.createNotification',
                    'responseCallback': 'func:this.props.updateUserProfile',
                  },
                  flattenFormData: true,
                  footergroups: false,
                  validations: [
                    {
                      name: 'first_name',
                      constraints: {
                        first_name: {
                          presence: {
                            message: '^Your first name is required.',
                          },
                          length: {
                            message: '^Your first name must be under 30 characters.',
                            maximum: 30,
                          },
                        },
                      },
                    },
                    {
                      name: 'last_name',
                      constraints: {
                        last_name: {
                          presence: {
                            message: '^Your last name is required.',
                          },
                          length: {
                            message: '^Your last name must be under 30 characters.',
                            maximum: 30,
                          },
                        },
                      },
                    },
                  ],
                  formgroups: [
                    formGlobalButtonBar({
                      left: [{
                        component: 'ResponsiveButton',
                        children: 'CHANGE EMAIL',
                        props: {
                          buttonProps: {
                            color: 'isSuccess',
                          },
                          onClick: 'func:this.props.createModal',
                          onclickProps: {
                            pathname: '/modal/verify_password_for_email',
                            title: 'Change Email',
                          },
                        },
                      }, {
                        component: 'ResponsiveButton',
                        comparisonprops: [{
                          left: ['formdata', 'status', 'mfa',],
                          operation: 'eq',
                          right: false,
                        }, ],
                        children: 'ENABLE PHONE AUTHENTICATION',
                        props: {
                          buttonProps: {
                            color: 'isSuccess',
                          },
                          onClick: 'func:this.props.createModal',
                          onclickProps: {
                            pathname: '/modal/verify_password_for_mfa',
                            title: 'Phone Authentication',
                          },
                        },
                      }, {
                        component: 'ResponsiveButton',
                        comparisonprops: [{
                          left: ['formdata', 'status', 'mfa',],
                          operation: 'eq',
                          right: true,
                        },
                        ],
                        children: 'DISABLE PHONE AUTHENTICATION',
                        props: {
                          buttonProps: {
                            color: 'isSuccess',
                          },
                          onClick: 'func:this.props.createModal',
                          onclickProps: {
                            pathname: '/modal/verify_password_disable_mfa',
                            title: 'Phone Authentication',
                          },
                          style: {
                            marginLeft: '-10px',
                          }
                        },
                      }, ],
                      right: [{
                        type: 'submit',
                        value: 'SAVE',
                        layoutProps: {
                          size: 'isNarrow',
                        },
                        passProps: {
                          color: 'isPrimary',
                        },
                      }, {
                        guideButton: true,
                        location: references.guideLinks.account['myAccount'],
                      },],
                    }),
                    {
                      gridProps: {
                        key: randomKey(),
                      },
                      card: {
                        twoColumns: true,
                        props: cardprops({
                          cardTitle: 'My Information',
                        }),
                      },
                      formElements: [formElements({
                        twoColumns: true,
                        doubleCard: false,
                        left: [
                          {
                            label: 'First Name',
                            name: 'first_name',
                            onBlur: true,
                            validateOnBlur: true,
                            errorIconRight: true,
                            validateOnKeyup: false,
                            submitOnEnter: true,
                            errorIcon: 'fa fa-exclamation',
                            keyUp: 'func:window.nameOnChange',
                          }, {
                            label: 'Last Name',
                            name: 'last_name',
                            onBlur: true,
                            validateOnBlur: true,
                            errorIconRight: true,
                            validateOnKeyup: false,
                            submitOnEnter: true,
                            errorIcon: 'fa fa-exclamation',
                            keyUp: 'func:window.nameOnChange',
                          }, {
                            label: 'Time Zone',
                            name: 'time_zone',
                            type: 'dropdown',
                            passProps: {
                              fluid: true,
                              selection: true,
                              search: true,
                            },
                            options: [{
                              label: 'Eastern Standard Time (UTC -5:00)',
                              value: 'Etc/GMT+5',
                            }, {
                              label: 'Central Standard Time (UTC -6:00)',
                              value: 'Etc/GMT+6',
                            }, {
                              label: 'Mountain Standard Time (UTC -7:00)',
                              value: 'Etc/GMT+7',
                            }, {
                              label: 'Pacific Standard Time (UTC -8:00)',
                              value: 'Etc/GMT+8',
                            }, {
                              label: 'Alaskan Standard Time (UTC -9:00)',
                              value: 'Etc/GMT+9',
                            }, {
                              label: 'International Date Line West (UTC -12:00)',
                              value: 'Etc/GMT+12',
                            }, {
                              label: 'Nome Time (UTC -11:00)',
                              value: 'Etc/GMT+11',
                            }, {
                              label: 'Hawaii-Aleutian Standard Time (UTC -10:00)',
                              value: 'Etc/GMT+10',
                            }, {
                              label: 'Atlantic Standard Time (UTC -4:00)',
                              value: 'Etc/GMT+4',
                            }, {
                              label: 'Argentina Time (UTC -3:00)',
                              value: 'Etc/GMT+3',
                            }, {
                              label: 'Azores Time (UTC -2:00)',
                              value: 'Etc/GMT+2',
                            }, {
                              label: 'West Africa Time (UTC -1:00)',
                              value: 'Etc/GMT+1',
                            }, {
                              label: 'Central European Time (UTC +1:00)',
                              value: 'Etc/GMT-1',
                            }, {
                              label: 'Eastern European Time (UTC +2:00)',
                              value: 'Etc/GMT-2',
                            }, {
                              label: 'Moscow Time (UTC +3:00)',
                              value: 'Etc/GMT-3',
                            }, {
                              label: 'Samara Time (UTC +4:00)',
                              value: 'Etc/GMT-4',
                            }, {
                              label: 'Pakistan Standard Time (UTC +5:00)',
                              value: 'Etc/GMT-5',
                            }, {
                              label: 'Omsk Time (UTC +6:00)',
                              value: 'Etc/GMT-6',
                            }, {
                              label: 'Christmas Island Time (UTC +7:00)',
                              value: 'Etc/GMT-7',
                            }, {
                              label: 'China Standard Time (UTC +8:00)',
                              value: 'Etc/GMT-8',
                            }, {
                              label: 'Japan Standard Time (UTC +9:00)',
                              value: 'Etc/GMT-9',
                            }, {
                              label: 'East Australian Standard Time (UTC +10:00)',
                              value: 'Etc/GMT-10',
                            }, {
                              label: 'Sakhalin Time (UTC +11:00)',
                              value: 'Etc/GMT-11',
                            }, {
                              label: 'International Date Line East (UTC +12:00)',
                              value: 'Etc/GMT-12',
                            },],
                          }
                        ],
                        right: [
                          {
                            label: 'Email Address',
                            name: 'email',
                            passProps: {
                              state: 'isDisabled',
                            },
                          }, {
                            label: 'Phone Authentication',
                            name: 'mfa',
                            passProps: {
                              state: 'isDisabled',
                            },
                          },
                        ],
                      }),
                      ],
                    },
                    {
                      gridProps: {
                        key: randomKey(),
                      },
                      card: {
                        props: cardprops({
                          cardTitle: 'My Photo',
                        }),
                      },
                      formElements: [
                        {
                          type: 'file',
                          name: 'profileimage',
                          submitOnChange: true,
                          layoutProps: {
                            style: {
                              paddingTop: 0,
                            },
                          },
                          thisprops: {
                            src: ['userdata', 'user', 'primaryasset', 'fileurl',],
                          },
                        },
                      ],
                    },
                  ],
                },
                asyncprops: {
                  formdata: ['userdata', 'user', ],
                },
              },
            ],
          },
        ],
      },
      resources: {
        userdata: '/user/get_user_info',
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
      callbacks: [],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi |  My Account',
        navLabel: 'My Account',
      },
    },
  },
};