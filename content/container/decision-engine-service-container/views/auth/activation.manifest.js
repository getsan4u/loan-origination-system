'use strict';

const periodic = require('periodicjs');
const { styles, labels, } = require('../../utilities/views/constants');
const THEMESETTINGS = periodic.settings.container['decision-engine-service-container'];

module.exports = {
  'containers': {
    '/auth/activation': {
      layout: {
        component: 'Container',
        props: {
          className: 'login',
          style: {
            minHeight: '90vh',
          },
        },
        children: [{
          component: 'Hero',
          props: {
            style: Object.assign({}, styles.pages.login, {
              display: 'flex',
            }),
          },
          children: [{
            component: 'HeroBody',
            props: {
              style: {
                flex: 0,
                alignSelf: 'center',
              },
            },
            children: [{
              component: 'Box',
              props: {
                style: {
                  width: '800px',
                  margin: '0 auto',
                  'borderRadius': '12px',
                  'overflow': 'hidden',
                  'padding': '0',
                  'boxShadow': '0px 0px 90px 10px rgba(17, 17, 17, 0.34)',
                },
              },
              children: [{
                component: 'Columns',
                props: {
                  'isGapless': true,
                  style: {
                    'height': '100%',
                    minHeight: '415px',
                  },
                },
                children: [{
                  component: 'Column',
                  props: {
                    size: 'isHalf',
                    style: {
                      'background': 'linear-gradient(30deg, black, grey)',
                      display: 'flex',
                      flexDirection: 'Column',
                      flexFlow: 'Column',
                    },
                  },
                  children: [{
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
                        fontSize: '20px',
                      },
                    },
                    children: 'Activation Required',
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
                    style: {
                      backgroundColor: THEMESETTINGS.header.header_background_color_fade_top,
                      display: 'flex',
                      flexDirection: 'Column',
                      flexFlow: 'Column',
                    },
                  },
                  children: [{
                    component: 'div',
                    props: {
                      style: {
                        padding: '30px 20px',
                        flex: '1 1 auto',
                        display: 'flex',
                        flexDirection: 'column',
                      },
                    },
                    children: [{
                      component: 'Image',
                      props: {
                        src: '/company_logo.png',
                        style: {
                          margin: '0 auto',
                          width: '180px',
                        },
                      },
                    },
                    {
                      component: 'div',
                      props: {
                        style: {
                          textAlign: 'center',
                          flex: '1 1 auto',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      },
                      children: [{
                        component: 'br',
                        asyncprops: {
                          active: ['checkdata', 'org', 'status', 'active',],
                        },
                        comparisonprops: [{
                          left: ['active',],
                          operation: 'eq',
                          right: false,
                        },],
                      }, {
                        component: 'p',
                        asyncprops: {
                          active: ['checkdata', 'org', 'status', 'active',],
                        },
                        comparisonprops: [{
                          left: ['active',],
                          operation: 'eq',
                          right: false,
                        },],
                        children: 'We will contact you shortly to activate your account. You may also reach out to us at support@digifi.io or (646) 663-3392.',
                      },
                      {
                        component: 'br',
                        asyncprops: {
                          active: ['checkdata', 'org', 'status', 'active',],
                        },
                        comparisonprops: [{
                          left: ['active',],
                          operation: 'eq',
                          right: false,
                        },],
                      },
                      {
                        component: 'p',
                        asyncprops: {
                          active: ['checkdata', 'user', 'status', 'active',],
                        },
                        comparisonprops: [{
                          left: ['active',],
                          operation: 'eq',
                          right: false,
                        },],
                        children: 'Your account is not active at this time. Please contact the administrator for your company.',
                      },
                      {
                        component: 'br',
                        asyncprops: {
                          active: ['checkdata', 'user', 'status', 'active',],
                        },
                        comparisonprops: [{
                          left: ['active',],
                          operation: 'eq',
                          right: false,
                        },],
                      },
                      {
                        component: 'p',
                        asyncprops: {
                          active: ['checkdata', 'user', 'status', 'email_verified',],
                        },
                        comparisonprops: [{
                          left: ['active',],
                          operation: 'eq',
                          right: false,
                        },],
                        children: 'You must verify your email to activate your account. We sent a verification email to the address you provided.',
                      },
                      {
                        component: 'br',
                        asyncprops: {
                          active: ['checkdata', 'user', 'status', 'email_verified',],
                        },
                        comparisonprops: [{
                          left: ['active',],
                          operation: 'eq',
                          right: false,
                        },],
                      },
                      {
                        component: 'p',
                        asyncprops: {
                          active: ['checkdata', 'user', 'status', 'email_verified',],
                        },
                        comparisonprops: [{
                          left: ['active',],
                          operation: 'eq',
                          right: false,
                        },],
                        children: 'If you’re having issues verifying your email, please be sure to check your junk email folder. If you need assistance, contact us at support@digifi.io or (646) 663-3392.',
                      },
                      {
                        component: 'br',
                        asyncprops: {
                          active: ['checkdata', 'user', 'status', 'email_verified',],
                        },
                        comparisonprops: [{
                          left: ['active',],
                          operation: 'eq',
                          right: false,
                        },],
                      },
                      {
                        component: 'div',
                        comparisonprops: [{
                          left: ['active',],
                          operation: 'eq',
                          right: false,
                        },],
                        asyncprops: {
                          active: ['checkdata', 'user', 'status', 'email_verified',],
                        },
                        'children': [{
                          component: 'span',
                          props: {
                            style: {
                              verticalAlign: 'middle',
                            }
                          },
                          children: 'Didn\'t receive email? ',
                        }, {
                          component: 'ResponsiveButton',
                          props: {
                            onClick: 'func:this.props.fetchAction',
                            onclickBaseUrl: '/auth/resend_email',
                            fetchProps: {
                              method: 'POST',
                            },
                            successProps: {
                              successCallback: 'func:this.props.createNotification',
                            },
                            style: {
                              color: styles.colors.primary,
                              verticalAlign: 'middle',
                            },
                          },
                          children: 'Resend Email',
                        },  
                        ],
                      },
                      {
                        component: 'ResponsiveButton',
                        children: 'Log Out',
                        props: {
                          // buttonProps: {
                          //   color: 'isPrimary',
                          // },
                          style: {
                            color: styles.colors.primary,
                            marginTop: '10px'
                          },
                          onClick: 'func:this.props.logoutUser',
                        },
                      },
                      ],
                    },
                    ],
                  },],
                },
                ],
              },],
            },],
          },],
        },],
      },
      resources: {
        successdata: {
          url: '/auth/success',
          options: {
            onSuccess: ['func:window.hideHeader',],
          },
        },
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
        'title': 'DigiFi | Home',
        'navLabel': 'Home',
      },
    },
  },
};