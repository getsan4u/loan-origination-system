'use strict';
const periodic = require('periodicjs');
const { styles, labels, } = require('../../utilities/views/constants');
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../../utilities/views/shared/form_creator/sign_in');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
let defaultAccountSettings = periodic.settings.container[ 'decision-engine-service-container' ].default_account;

module.exports = (options = {}) => {
  const { formLayout, subtitle, subtitleStyle, } = options;
  const form = new FormCreator();
  form.addFields('props', {
    blockPageUI: true,
    blockPageUILayout: THEMESETTINGS.blockPageUILayout,
    onSubmit: 'func:this.props.loginUser',
    hiddenFields: [{
      form_name: '__returnURL',
      form_static_val: '/home',
    },
    ],
  });
  (defaultAccountSettings && defaultAccountSettings.organization_name) ? form.addFormElements(formElement.organization(defaultAccountSettings.organization_name)) : form.addFormElements(formElement.organization())
  form.addFormElements(formElement.email());
  form.addFormElements(formElement.password());
  form.addFormElements(formElement.signInSubmit());
  form.addFormElements(Object.assign({}, formElement.text('Forgot Password?'), formElement.resetPassword()));
  (defaultAccountSettings && defaultAccountSettings.forgot_organization) ? form.addFormElements(Object.assign({}, formElement.text('Forgot Organization?'), formElement.recoverOrganization())) : null;
  (defaultAccountSettings && defaultAccountSettings.new_user) ? form.addFormElements(Object.assign({}, formElement.text('New User?'), formElement.createAccountLink())) : null;
  let loginForm = form.getForm();
  const innerFormLayout = (formLayout) ? formLayout : loginForm;
  return {
    component: 'Container',
    props: {
      className: 'login',
    },
    children: [
      {
        component: 'Hero',
        props: {
          style: Object.assign({}, styles.pages.login, {
            display: 'block',
          }),
        },
        children: [
          {
            component: 'HeroBody',
            props: {
              style: {
                flex: 0,
                alignSelf: 'center',
              },
            },
            children: [
              {
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
                            flexDirection: 'Column',
                            flexFlow: 'Column',
                            minHeight: '415px',
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
                            children: 'Welcome!',
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
                              style: Object.assign({}, {
                                'color': 'white',
                                'fontWeight': '500',
                                'padding': '20px 30px 40px',
                                fontSize: '20px',
                                lineHeight: 'normal',
                              }, subtitleStyle),
                            },
                            children: subtitle || 'Sign in',
                          },
                          {
                            component: 'div',
                            props: {
                              style: {
                                'backgroundImage': 'url(/images/elements/orange-graph-lines.svg)',
                                'backgroundSize': '100%',
                                'minWidth': '100%',
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
                        children:[
                          {
                            component: 'div',
                            props: {
                              style: {
                                padding: '30px 20px',
                                flex: '1 1 auto',
                              },
                            },
                            children: [
                              {
                                component: 'Image',
                                props: styles.images.login,
                              },
                              {
                                component: 'div',
                                children: [innerFormLayout,],
                                props: {
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
        ],
      },
    ],
  };
};