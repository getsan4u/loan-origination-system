'use strict';
const periodic = require('periodicjs');
const { styles, } = require('../../utilities/views/constants');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];

module.exports = {
  containers: {
    '/mfa': {
      layout: {
        component: 'Hero',
        props: {
          size: 'isFullheight',
          className:'login',
        },
        children: [
          {
            component: 'HeroBody',
            props: {
              style: styles.pages.login,
            },
            children: [
              {
                component: 'Container',
                props: {
                  style: {},
                },
                children: [
                  {
                    component: 'Columns',
                    props: {
                      'isGapless': true,
                    },
                    children: [
                      {
                        component: 'Column',
                        props: {
                          size: 'is1',
                        },
                      },
                      {
                        component: 'Column',
                        props: {
                          size: 'is10',
                        },
                        children: [
                          {
                            component: 'Box',
                            props: {
                              style: {
                                maxWidth: '800px',
                                margin: '0 auto',
                                'borderRadius': '12px',
                                'overflow': 'hidden',
                                'width': '100%',
                                'padding': '0',
                                'boxShadow':'0px 0px 90px 10px rgba(17, 17, 17, 0.34)',
                              },
                            },
                            children: [
                              {
                                component: 'Columns',
                                props: {
                                  'isGapless': true,
                                  style: {
                                    'height': '100%',
                                    minHeight: '415px',
                                  },
                                },
                                children: [
                                  {
                                    component: 'Column',
                                    props: {
                                      size: 'isHalf',
                                      style: {
                                        'background': 'linear-gradient(30deg, black, grey)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                      },
                                    },
                                    children: [
                                      {
                                        component: 'Title',
                                        props: {
                                          size: 'is4',
                                          style: {
                                            'color': 'white',
                                            'fontWeight': '500',
                                            'padding': '40px 30px 20px',
                                            fontSize: '28px',
                                            marginBottom: '0px',
                                          },
                                        },
                                        children: `Welcome to DigiFi!`,
                                      },
                                      {
                                        component: 'hr',
                                        props: {
                                          style: {
                                            'backgroundColor': 'white',
                                            'border': '0 none',
                                            'color': 'white',
                                            'height': '3px',
                                            'marginLeft': '30px',
                                            'width': '15%',
                                          },
                                        },
                                      },
                                      {
                                        component: 'Subtitle',
                                        props: {
                                          size: 'is6',
                                          style: {
                                            'color': 'white',
                                            'fontWeight': '500',
                                            'padding': '20px 30px 40px',
                                            fontSize:'20px',
                                          },
                                        },
                                        children: 'Please Enter Code',
                                      },
                                      {
                                        component: 'div',
                                        props: {
                                          style: {
                                            'backgroundImage': 'url(/images/elements/orange-graph-lines.svg)',
                                            'minWidth': '100%',
                                            backgroundSize: '100% auto',
                                            'flex': '1 1 auto',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'bottom',
                                          },
                                        },
                                      },
                                    ],
                                  },
                                  {
                                    component: 'Column',
                                    props: {
                                      size: 'isHalf',
                                      style: {},
                                    },
                                    children: [{
                                      component: 'div',
                                      props: {
                                        style: {
                                          padding:'40px 30px',
                                        },
                                      },
                                      children: [
                                        {
                                          component: 'Image',
                                          props: styles.images.login,
                                        },
                                        {
                                          component: 'p',
                                          props: {},
                                          asyncprops: {
                                            children: ['userdata', 'mfaPhoneText',],
                                          },
                                        },
                                        {
                                          component: 'ResponsiveForm',
                                          props: {
                                            'onSubmit': 'func:this.props.validateMFA',
                                            'validations': [{
                                              'name': 'code',
                                              'constraints': {
                                                'code': {
                                                  'presence': {
                                                    'message': 'is required',
                                                  },
                                                  'length': {
                                                    'minimum': 6,
                                                    'message': 'must be at least 6 digits',
                                                  },
                                                },
                                              },
                                            },],
                                            'footergroups': [],
                                            'formgroups': [
                                              {
                                                'gridProps': {
                                                  style: {
                                                  },
                                                },
                                                'formElements': [
                                                  {
                                                    'type': 'text',
                                                    'label': '',
                                                    'submitOnEnter': true,
                                                    'name': 'code',
                                                    hasIcon: true,
                                                    errorIconRight: true,
                                                    errorIcon: 'fa fa-exclamation',
                                                    placeholder:'Authentication Code',
                                                    'passProps': {
                                                      'type':'text',
                                                    },
                                                  },
                                                ],
                                              },
                                              {
                                                'gridProps': {
                                                  style: {
                                                    'justifyContent': 'center',
                                                  },   
                                                  isMultiline: false,
                                                  responsive: 'isMobile',
                                                },
                                                'formElements': [
                                                  {
                                                    'type': 'submit',
                                                    'value': 'Authenticate',
                                                    'name': 'signin',
                                                    'passProps': {
                                                      color: 'isPrimary',
                                                      style: {
                                                        width: '100%',
                                                      }
                                                    },
                                                    'layoutProps': {
                                                      style: {
                                                        textAlign: 'center'
                                                      }
                                                    },
                                                  },
                                                ],                                          
                                              },
                                              {
                                                'gridProps': {
                                                  'style': {
                                                    'justifyContent': 'center',
                                                  },
                                                },
                                                'formElements': [
                                                  {
                                                    'type': 'layout',
                                                    'layoutProps': {
                                                      'size': 'isNarrow',
                                                      style: {
                                                        padding: '10px 3px',
                                                      }
                                                    },
                                                    'value': {
                                                      'component': 'div',
                                                      'children': 'Didn\'t receive code?',
                                                    },
                                                  },
                                                  {
                                                    'type': 'layout',
                                                    'layoutProps': {
                                                      'size': 'isNarrow',
                                                      style: {
                                                        padding: '10px 3px',
                                                      }
                                                    },
                                                    'value': {
                                                      component: 'ResponsiveButton',
                                                      props: {
                                                        onClick: 'func:this.props.fetchAction',
                                                        onclickBaseUrl: '/auth/resend_mfa_phone',
                                                        fetchProps: {
                                                          method: 'POST',
                                                        },
                                                        successProps: {
                                                          successCallback: 'func:this.props.createNotification',
                                                        },
                                                        style: {
                                                          color: styles.colors.primary,
                                                        },
                                                      },
                                                      children: 'Resend Code',
                                                    },
                                                  },
                                                ],
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      {
                        component: 'Column',
                        props: {
                          size: 'is1',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      'resources': {
        userdata: '/user/get_user_info',
        successdata: {
          url: '/auth/success',
          options: {
            onSuccess: ['func:window.hideHeader',],
          },
        },
      },
      callbacks: [],
      'onFinish': 'render',
      'pageData':{
        'title':'DigiFi | Multi-Factor Authentication',
        'navLabel':'Multi-Factor Authentication',
      },
    },
  },
};