'use strict';
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;
const periodic = require('periodicjs');

module.exports = {
  'containers': {
    '/modal/ml/data_source_progress': {
      layout: {
        component: 'Container',
        props: {},
        children: [
          {
            component: 'ResponsiveForm',
            // asyncprops: {
            //   __formOptions: [ 'templatedata', 'formoptions' ],
            // },
            hasWindowFunc: true,
            asyncprops: {
              formdata: ['mlmodeldata', 'mlmodel'],
            },
            props: {
              blockPageUI: true,
              blockPageUILayout: styles.modalBlockPageUILayout,
              flattenFormData: true,
              ref: 'func:window.addRef',
              footergroups: false,
              useFormOptions: true,
              'onSubmit': {},
              formgroups: [ {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'div',
                    props: {
                      style: {
                        margin: '0px 50px', 
                        display: 'flex',
                      }
                    },
                    children: [{
                      component: 'span',
                      children: 'Analyzing & Cleaning Data',
                      props: {
                        style: {
                          flex: 1,
                        },
                      }
                    }, {
                      component: 'Semantic.Progress',
                      // {row.progressBar.progress } indicating= { indicating } progress= { progress } success= { success } warning= { warning } error= { error } disabled= { disabled } style= { style }
                      props: {
                        className: 'analyzing',
                        style: {
                          flex: 2,
                          maxWidth: 'none',
                          marginBottom: '10px',
                        },
                        percent: 0,
                        progress: true,
                        success: true,
                        onSubmit: null,
                        indicating: true,
                        active: true,
                      },
                    },]
                  }
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'div',
                    props: {
                      style: { 
                        display: 'flex',
                        margin: '0px 50px',
                      }
                    },
                    children: [{
                      component: 'span',
                      children: 'Preparing Transformations',
                      props: {
                        style: {
                          flex: 1,
                        },
                      }
                    }, {
                      component: 'Semantic.Progress',
                      // {row.progressBar.progress } indicating= { indicating } progress= { progress } success= { success } warning= { warning } error= { error } disabled= { disabled } style= { style }
                      props: {
                        className: 'transformations',
                        style: {
                          flex: 2,
                          maxWidth: 'none',
                          marginBottom: '10px',
                        },
                        percent: 0,
                        progress: true,
                        success: true,
                        onSubmit: null,
                        indicating: true,
                        active: true,
                      },
                    },]
                  }
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'div',
                    props: {
                      style: {
                        margin: '0px 50px', 
                        display: 'flex',
                      }
                    },
                    children: [{
                      component: 'span',
                      children: 'Identifying Correlations',
                      props: {
                        style: {
                          flex: 1,
                        },
                      }
                    }, {
                      component: 'Semantic.Progress',
                      // {row.progressBar.progress } indicating= { indicating } progress= { progress } success= { success } warning= { warning } error= { error } disabled= { disabled } style= { style }
                      props: {
                        className: 'correlations',
                        style: {
                          flex: 2,
                          maxWidth: 'none',
                          marginBottom: '10px',
                        },
                        percent: 0,
                        progress: true,
                        success: true,
                        onSubmit: null,
                        indicating: true,
                        active: true,
                      },
                    },]
                  }
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'div',
                    props: {
                      style: {
                        margin: '0px 50px', 
                        display: 'flex',
                      }
                    },
                    children: [{
                      component: 'span',
                      children: 'Preparing Data For Review',
                      props: {
                        style: {
                          flex: 1,
                        },
                      }
                    }, {
                      component: 'Semantic.Progress',
                      // {row.progressBar.progress } indicating= { indicating } progress= { progress } success= { success } warning= { warning } error= { error } disabled= { disabled } style= { style }
                      props: {
                        style: {
                          flex: 2,
                          maxWidth: 'none',
                          marginBottom: '10px',
                        },
                        className: 'review',
                        percent: 0,
                        progress: true,
                        success: true,
                        onSubmit: null,
                        indicating: true,
                        active: true,
                      },
                    },]
                  }
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'div',
                    props: {
                      style: {
                        margin: '0px 50px', 
                        display: 'flex',
                      }
                    },
                    children: [{
                      component: 'span',
                      children: 'Saving Results',
                      props: {
                        style: {
                          flex: 1,
                        },
                      }
                    }, {
                      component: 'Semantic.Progress',
                      // {row.progressBar.progress } indicating= { indicating } progress= { progress } success= { success } warning= { warning } error= { error } disabled= { disabled } style= { style }
                      props: {
                        className: 'saving',
                        style: {
                          flex: 2,
                          maxWidth: 'none',
                          marginBottom: '10px',
                        },
                        percent: 0,
                        progress: true,
                        success: true,
                        onSubmit: null,
                        indicating: true,
                        active: true,
                      },
                    },]
                  }
                }, ],
              },{
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [ {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveButton',
                    thisprops: {
                      onclickPropObject: [ 'formdata', ],
                    },
                    props: {
                      onClick: 'func:this.props.reduxRouter.push',
                      onclickBaseUrl: '/ml/models/:id/training/review_and_train',
                      onclickLinkParams: [ { key: ':id', val: '_id', }, ],
                      buttonProps: {
                        color: 'isPrimary',
                      },
                    },
                    children: 'CONTINUE',
                  },
                }, ],
              },
              ],
            },
          },
        ],
      },
      'resources': {
        mlmodeldata: '/ml/api/models/data_source_progress?format=json',
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
      callbacks: ['func:window.clearDataProcessing', 'func:window.runDataProcessing'],
      'onFinish': 'render',
    },
  },
};