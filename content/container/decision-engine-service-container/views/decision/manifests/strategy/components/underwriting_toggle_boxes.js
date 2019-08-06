'use strict';
const styles = require('../../../../../utilities/views/constants/styles');

function underwritingToggleBoxes(boxData) {
    let boxes = [];
    boxData.map((data, idx) => {
        boxes.push({
        component: 'Column',
        props: {
            style: {
                padding: 0,
                display: 'flex',
                alignItems: 'stretch',
            }
        },
         bindprops: true,
            children: [{
            component: 'Card',
            bindprops: true,
            props: {
                style: {
                    width: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }
            },
            children: [
                {
                    component: 'div',
                    bindprops: true,
                    props: {
                        style: {
                            position: 'absolute',
                            width: '100%',
                            top: 0,
                            height: '2px',
                            background: 'linear-gradient(to right, #007aff, #68d7e3)'
                        }
                    },
                    thisprops: {
                    segmentData: ['formdata', data.thisPropName,]
                    },
                    comparisonprops: [{
                        left: ['segmentData', ],
                        operation: 'eq',
                        right: true,
                    }, ],
                },
                {
                    component: 'div',
                    bindprops: true,
                    props: {
                        style: {
                            position: 'absolute',
                            width: '100%',
                            top: 0,
                            height: '2px',
                            background: 'linear-gradient(to right, rgb(103,103,103), rgb(189, 189, 189))'
                        }
                    },
                    thisprops: {
                        segmentData: ['formdata', data.thisPropName,]
                    },
                    comparisonprops: [{
                        left: ['segmentData', ],
                        operation: 'eq',
                        right: false,
                    }, ],
                },
                {
                component: 'CardContent',
                props: {
                    style: {
                        flex: '1 1 auto',
                    }
                },
                children: [{
                component: 'CardHeaderTitle',
                props: {
                    style: {
                        padding: 0,
                        marginBottom: '10px',
                    }
                },
                children: data.title
                }, {
                    component: 'p',
                    children: data.text
                }]
            }, {
                component: 'CardFooter',
                props: {
                style: {
                    alignItems: 'center',
                    padding: '15px',
                    height: '60px',
                },
                },
                bindprops: true,
                children: [{
                component: 'ResponsiveButton',
                bindprops: true,
                thisprops: {
                    onclickPropObject: [ 'formdata', ],
                },
                comparisonprops: [{
                    left: ['formdata', data.thisPropName, ],
                    operation: 'eq',
                    right: true,
                }, ],
                props: {
                    onClick: 'func:this.props.reduxRouter.push',
                    onclickBaseUrl: `/decision/strategies/:id/${data.segmentName}/0`,
                    onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, {
                    'key': ':index',
                    'val': 'index',
                    }, ],
                    buttonProps: {
                    icon: 'fa fa-pencil',
                    className: '__icon_button'
                    },
                },
                }, {
                component: 'div',
                bindprops: true,
                props: {
                    style: {
                    flex: '1 1 auto',
                    textAlign: 'right',
                    marginRight: '10px',
                    }
                },
                children: [{
                    component: 'span',
                    children: 'Enabled',
                    thisprops: {
                    segmentData: ['formdata', data.thisPropName,]
                },
                comparisonprops: [{
                    left: ['segmentData', ],
                    operation: 'eq',
                    right: true,
                }, ],
                }, {
                    component: 'span',
                    children: 'Disabled',
                    thisprops: {
                    segmentData: ['formdata', data.thisPropName,]
                },
                comparisonprops: [{
                    left: ['segmentData', ],
                    operation: 'eq',
                    right: false,
                }, ],
                }],
                },
                {
                component: 'Semantic.Checkbox',
                hasWindowFunc: true,
                bindprops: true,
                thisprops: {
                    checked: ['formdata', data.thisPropName,]
                },
                props: {
                    toggle: true,
                    onSubmit: null,
                    name: data.toggleControlName,
                    onChange: 'func:window.overviewOnChange'
                },
                }
            ]
            }]
        }]
        });
        if (idx < boxData.length - 1) {
            boxes.push({
                component: 'Icon',
                props: {
                    icon: 'fa fa-long-arrow-right',
                    style: {
                        fontSize: '25px',
                        margin: 'auto',
                        color: '#ccc',
                    }
                }
            })
        }
    }
    );

    
    return {
        component: 'Columns',
        bindprops: true,
        children: boxes,
        props: {
            style: {
                padding: '10px'
            }
        }
    }
}

module.exports = underwritingToggleBoxes;