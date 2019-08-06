'use strict';

const total_loan_volume = [ {
  subsection: 'by_count',
  subsection_title: 'By Count',
  section: 'total_loan_volume',
  unit: 'count',
  description: '',
  cardTitle: 'Total Loan Volume - By Count',
  chartFunc: '_getTotalLoanVolumeChart',
  filters: [ '_inputVariableFilter', '_numBinsFilter' ],
}, {
  subsection: 'by_amt',
  subsection_title: 'By Amount',
  section: 'total_loan_volume',
  unit: 'dollar',
  description: '',
  cardTitle: 'Total Loan Volume - By Amount',
  chartFunc: '_getTotalLoanVolumeChart',
  filters: [ '_inputVariableFilter', '_numBinsFilter' ],
}, ];

const percent_of_loan_volume = [ {
  subsection: 'by_count',
  subsection_title: 'By Count',
  unit: 'percentage',
  description: '',
  section: 'percent_of_total_loan_volume',
  cardTitle: 'Percent of Loan Volume - By Count',
  chartFunc: '_getTotalLoanVolumeChart',
  filters: [ '_inputVariableFilter', '_numBinsFilter' ],
}, {
  subsection: 'by_amt',
  subsection_title: 'By Amount',
  unit: 'percentage',
  description: '',
  section: 'percent_of_total_loan_volume',
  cardTitle: 'Percent of Loan Volume - By Amount',
  chartFunc: '_getTotalLoanVolumeChart',
  filters: [ '_inputVariableFilter', '_numBinsFilter' ],
}, ];

const population_analysis = [ {
  subsection: 'avg_loan_size',
  subsection_title: 'Average Loan Size',
  description: '',
  section: 'population_analysis',
  cardTitle: 'Population Analysis - Average Loan Size',
  unit: 'count',
  chartFunc: '_getPopulationAnalysisCharts',
  filters: [ '_inputVariableFilter', '_numBinsFilter' ],
},
{
  subsection: 'avg_interest_rate',
  subsection_title: 'Average Interest Rate',
  unit: 'percentage',
  cardTitle: 'Population Analysis - Average Interest Rate',
  description: '',
  section: 'population_analysis',
  chartFunc: '_getPopulationAnalysisCharts',
  filters: [ '_inputVariableFilter', '_numBinsFilter', '_yAxisAutoScalingFilter', ],
}, {
  subsection: 'annual_default_rate',
  subsection_title: 'Annual Default Rate',
  unit: 'percentage',
  cardTitle: 'Population Analysis - Annual Default Rate',
  description: '',
  section: 'population_analysis',
  chartFunc: '_getPopulationAnalysisCharts',
  filters: [ '_inputVariableFilter', '_numBinsFilter', '_yAxisAutoScalingFilter', ],
}, {
  subsection: 'annual_yield',
  subsection_title: 'Annual Yield (Interest Rate - Default Rate)',
  unit: 'percentage',
  description: '',
  section: 'population_analysis',
  cardTitle: 'Population Analysis - Annual Yield (Interest Rate - Default Rate)',
  chartFunc: '_getPopulationAnalysisCharts',
  filters: [ '_inputVariableFilter', '_numBinsFilter', '_yAxisAutoScalingFilter', ],
}, ];

const cumulative_default_time_series = [ {
  subsection: 'time_series_cdr_count',
  subsection_title: 'By Count',
  unit: 'count',
  description: '',
  section: 'cumulative_default_time_series',
  cardTitle: 'Cumulative Default Rate - Time Series By Count',
  chartFunc: '_getCumulativeDefaultTimeSeriesCharts',
  filters: [ '_inputVariableFilter', '_numBinsFilter', '_yAxisAutoScalingFilter', ],
}, {
  subsection: 'time_series_cdr_amt',
  subsection_title: 'By Amount',
  unit: 'count',
  description: '',
  section: 'cumulative_default_time_series',
  cardTitle: 'Cumulative Default Rate - Time Series By Amount',
  chartFunc: '_getCumulativeDefaultTimeSeriesCharts',
  filters: [ '_inputVariableFilter', '_numBinsFilter', '_yAxisAutoScalingFilter', ],
}, ];

const configurations = [ total_loan_volume, percent_of_loan_volume, population_analysis, cumulative_default_time_series, ].reduce((config, section, idx) => {
  const configLength = config.length;
  section.forEach((subsection, idx) => {
    subsection.index = configLength + idx;
    config.push(subsection);
  });
  return config;
}, []);

module.exports = configurations;