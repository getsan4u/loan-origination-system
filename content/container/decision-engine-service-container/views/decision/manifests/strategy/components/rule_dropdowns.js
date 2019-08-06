'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];

function addPopulationButtons(options) {
  let createPopSegment = {
    component: 'ResponsiveButton',
    bindprops: true,
    thisprops: {
      onclickPropObject: ['formdata',],
    },
    props: {
      onClick: 'func:this.props.createModal',
      onclickProps: {
        title: 'Add Segment to Strategy',
        pathname: '/decision/strategies/:id/add_segment',
        params: [{ key: ':id', val: '_id', },],
      },
      buttonProps: {
        color: 'isSuccess',
        className: 'add_segment_button',
      },
      style: {
        float: 'right',
      },
    },
    children: 'CREATE NEW POPULATION SEGMENT',
  };

  let children = [
    {
      component: 'Semantic.Dropdown',
      props: {
        onSubmit: null,
        className: '__re-bulma_button __re-bulma_is-success',
        text: 'ADD RULE',
      },
      children: [{
        component: 'Semantic.DropdownMenu',
        props: {
          onSubmit: null,
        },
        children: [{
          component: 'Semantic.Item',
          props: {
            onSubmit: null,
          },
          children: [{
            component: 'ResponsiveButton',
            children: 'CREATE NEW',
            bindprops: true,
            thisprops: {
              onclickPropObject: ['formdata', ],
            },
            props: {
              onClick: 'func:this.props.createModal',
              onclickProps: {
                title: 'Create New Population Rule',
                pathname: '/decision/strategies/:id/population/create/init',
                params: [{ key: ':id', val: '_id', }, ],
              },
            },
          }, ],
        }, {
          component: 'Semantic.Item',
          props: {
            onSubmit: null,
          },
          children: [{
            component: 'ResponsiveButton',
            bindprops: true,
            thisprops: {
              onclickPropObject: ['formdata', ],
            },
            props: {
              onclickProps: {
                title: 'Copy Existing Population Set',
                pathname: '/decision/strategies/:id/population/copy',
                params: [{ key: ':id', val: '_id', },],
              },
              onClick: 'func:this.props.createModal',
            },
            children: 'COPY EXISTING',
          }, ],
        }, {
          component: 'Semantic.Item',
          props: {
            onSubmit: null,
          },
          children: [{
            component: 'ResponsiveButton',
            bindprops: true,
            thisprops: {
              onclickPropObject: ['formdata', ],
            },
            props: {
              onclickProps: {
                title: 'Upload Population Segment',
                pathname: '/modal/decision/upload_csv_segment/population',
              },
              onClick: 'func:this.props.createModal',
              style: {
                display: (THEMESETTINGS.advanced_ruleset_upload) ? '' : 'none',
              }
            },
            children: 'UPLOAD CSV',
          }, ],
        },],
      },],
    }, ];
  
  if (!options || (options && !options.blockPopulation)) children.push(createPopSegment);
  return {
    component: 'div',
    children,
  };
}  

function addRuleDropdown(buttonData, buttonTitle) {
  let modalButtons = buttonData.map(data => {
    return {
      component: 'Semantic.Item',
      props: {
        onSubmit: null,
      },
      children: [{
        component: 'ResponsiveButton',
        children: data.name,
        bindprops: true,
        thisprops: {
          onclickPropObject: ['formdata', ],
        },
        props: {
          onClick: 'func:this.props.createModal',
          onclickProps: data.onclickProps,
          style: data.passProps? data.passProps.style : {},
        },
      }, ],
    };
  });

  return {
    component: 'Semantic.Dropdown',
    props: {
      onSubmit: null,
      className: '__re-bulma_button __re-bulma_is-success',
      text: (buttonTitle) ? buttonTitle : 'ADD RULE',
    },
    children: [{
      component: 'Semantic.DropdownMenu',
      props: {
        onSubmit: null,
      },
      children: modalButtons,
    },],
  };
}

module.exports = {
  addPopulationButtons,
  addRuleDropdown,
};