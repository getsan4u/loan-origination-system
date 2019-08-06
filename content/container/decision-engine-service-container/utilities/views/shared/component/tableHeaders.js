'use strict';

exports.external_products = [
  {
    label:'Model Code',
    placeholder:'Model Code',
    footerFormElementPassProps:{ placeholder:'Model Code', },
    sortid: 'model_code',
    formtype:'text',
    sortable:true,
    columnProps:{
      style:{
        maxWidth:250,
      },
    },
  },
  {
    label:'SOR Product Id',
    placeholder:'ProductId',
    footerFormElementPassProps:{ placeholder:'ProductId', },
    formtype:'text',
    sortid:'product',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:250,
      },
    },
  },
];

exports.credit_parser = [
  {
    label:'State',
    placeholder:'State',
    footerFormElementPassProps:{ placeholder:'State', },
    sortid: 'state_property_attribute',
    sortable:true,
    columnProps:{
      style:{
        maxWidth:250,
      },
    },
  },
  {
    label:'Resource',
    placeholder:'Resource',
    footerFormElementPassProps:{ placeholder:'Resource', },
    sortid:'resource_property_attribute',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:250,
      },
    },
  },
  {
    label:'Priority',
    placeholder:'Priority',
    footerFormElementPassProps:{ placeholder:'Priority', },
    sortid:'priority',
    sortable:true,
  },
  {
    label:'Type',
    placeholder:'Type',
    footerFormElementPassProps:{ placeholder:'Type', },
    sortid:'calculation_type',
    sortable:true,
  },
  {
    label: 'Operation',
    footerFormElementPassProps: {
      placeholder: 'Operation',
    },
    formtype:'code',
    wrapPreOutput: true,
    sortid:'calculation_operation',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:300,
      },
    },
  },
];

exports.scorecard_calculations = [
  {
    label:'State',
    sortid:'state_property_attribute',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:150,
      },
    },
  },
  {
    label:'Resource',
    sortid:'resource_property_attribute',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:200,
      },
    },
  },
  {
    label:'Type',
    sortid:'calculation_type',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'Operation',
    sortid:'calculation_operation',
    sortable: true,
    wrapPreOutput: true,
    formtype:'code',
    columnProps:{
      style:{
        maxWidth:300,
      },
    },
  },
];

exports.segment_score_conditions = [
  {
    label:'Operation',
    sortid:'condition_operation',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'Property',
    sortid:'state_property_attribute',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:200,
      },
    },
  },
  {
    label:'Test',
    sortid:'condition_test',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'Value',
    sortid:'state_property_attribute_value_comparison',
    sortable: true,
  },
  {
    label:'Max',
    sortid:'state_property_attribute_value_maximum',
    sortable: true,
  },
  {
    label:'Min',
    sortid:'state_property_attribute_value_minimum',
    sortable: true,
  },
  {
    label:'Condition Group',
    sortid:'condition_group_id',
    sortable: true,
  },
  {
    label:'Name',
    sortid:'name',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'label',
    sortid:'description',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:300,
      },
    },
  },
];

exports.segment_mcr_rule_rulesets = [
  {
    label:'Object',
    sortid:'object',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'Field',
    sortid:'field',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'Max',
    sortid:'maximum',
    sortable: true,
  },
  {
    label:'Min',
    sortid:'minimum',
    sortable: true,
  },
  {
    label:'Operand',
    sortid:'operand',
    sortable: true,
  },
  {
    label:'Or Group',
    sortid:'or_group',
    sortable: true,
  },
  {
    label:'Output',
    sortid:'output',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:300,
      },
    },
  },
];

exports.segment_score_rule_rulesets = [
  {
    label:'Object',
    sortid:'object',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'Field',
    sortid:'field',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'Max',
    sortid:'maximum',
    sortable: true,
  },
  {
    label:'Min',
    sortid:'minimum',
    sortable: true,
  },
  {
    label:'Avg Weight',
    sortid:'average_weight',
    sortable: true,
  },
  {
    label:'Weight',
    sortid:'weight',
    sortable: true,
  },
  {
    label:'Reason Code',
    sortid:'reason_code',
    sortable: true,
  },
  {
    label:'Score Cap',
    sortid:'score_cap',
    sortable: true,
  },
  {
    label:'label',
    sortid:'label',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:300,
      },
    },
  },
];

exports.segment_output_rule_rulesets = [
  {
    label:'Minimum',
    sortid:'minimum_full_score',
    sortable: true,
  },
  {
    label:'Maximum',
    sortid:'maximum_full_score',
    sortable: true,
  },
  {
    label:'Rating',
    sortid:'rating',
    sortable: true,
  },
  {
    label:'Orig. Fee',
    sortid:'origination_fee_rate',
    sortable: true,
  },
  {
    label:'APR',
    sortid:'apr',
    sortable: true,
  },
  {
    label:'Exp. Default Rate',
    sortid:'expected_annual_default_rate',
    sortable: true,
  },
  {
    label:'Term',
    sortid:'term',
    sortable: true,
  },
  {
    label:'Guarantor',
    sortid:'guarantor_required',
    sortable: true,
  },
];

exports.segment_limits_rule_rulesets = [
  {
    label:'Object',
    sortid:'object',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'Field',
    sortid:'field',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'Max',
    sortid:'maximum',
    sortable: true,
  },
  {
    label:'Min',
    sortid:'minimum',
    sortable: true,
  },
  {
    label:'Product',
    sortid:'product',
    sortable: true,
  },
  {
    label:'Attribute',
    sortid:'attribute',
    sortable: true,
  },
  {
    label:'Limit',
    sortid:'limit',
    sortable: true,
  },
  {
    label:'Limit Type',
    sortid:'limit_type',
    sortable: true,
  },
  {
    label:'Apply To',
    sortid:'apply_to',
    sortable: true,
  },
  {
    label:'Output',
    sortid:'output',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:150,
      },
    },
  },
  {
    label:'Comment',
    sortid:'comment',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:200,
      },
    },
  },
];

exports.segment_adverse_rule_rulesets = [
  {
    label:'Product',
    sortid:'product',
    sortable: true,
  },
  {
    label:'Step',
    sortid:'step',
    sortable: true,
  },
  {
    label:'Fail Reason',
    sortid:'fail_reason_label',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:200,
      },
    },
  },
  {
    label:'Source',
    sortid:'source',
    sortable: true,
  },
  {
    label:'Variable',
    sortid:'variable',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:150,
      },
    },
  },
  {
    label:'Value',
    sortid:'value',
    sortable: true,
  },
  {
    label:'Reason Code',
    sortid:'reason_code',
    sortable: true,
  },
  {
    label:'Reason Text',
    sortid:'reason_code_text',
    sortable: true,
    columnProps:{
      style:{
        maxWidth:175,
      },
    },
  },
];


exports.segment_pipeline_rule_rulesets = [
  {
    label:'Function name',
    sortid:'function_name',
    sortable: true,
    stringify: true,
    formtype:'textarea',
    columnProps:{
      style:{
        maxWidth:100,
      },
    },
  },
  {
    label:'Function Modifiers',
    sortid:'function_modifiers',
    sortable: true,
    formtype:'textarea',
    textareaProps: {
    },
    stringify: true,
    columnProps:{
      style:{
        maxWidth:300,
      },
    },
  },
  {
    label:'Default State',
    sortid:'default_state',
    formtype: 'textarea',
    stringify: true,
    sortable: true,
    columnProps:{
      style:{
        maxWidth:200,
      },
    },
  },
];