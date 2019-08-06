'use strict';

const transformhelpers = require('../../transformhelpers');
const ERROR_MESSAGES = {
  'datasource_upload': {
    'binary': '"Historical Result" values must always be set to "true" where the event occurred and to "false" for observations where the event did not occur',
    'regression': '"Historical Result" values must always be set to a numeric value',
    'categorical': '"Historical Result" values must always have at least 1 character',
    'industry': {
      'lending': {
        loan_issue_date: 'The loan_issue_date field must be set for every historical loan.  This must include the date of the loan in Number format',
        loan_amount: 'The loan_amount field must be set for every historical loan.  This must include the initial loan amount',
        total_received_principal: 'The total_received_principal field must be set for every historical loan.  This must include the amount of principal repaid over the life of the loan',
        total_received_interest: 'The total_received_interest field must be set for every historical loan.  This must include the amount of interest received over the life of the loan',
        interest_rate: 'The interest_rate field must be set for every historical loan.  This must include the loan’s interest rate',
        charge_off_date: 'The charge_off_date field must be set for every historical loan that has loan_status of “Charged Off”.  This must include the data the loan was charged off in Number format',
        charge_off_amount: 'The charge_off_amount field must be set for every historical loan that has loan_status of “Charged Off”.  This must include the principal balance when the loan was charged off',
        charge_off_month: 'The charge_off_month field must be set for every historical loan that has loan_status of “Charged Off”.  This must include the principal balance when the loan was charged off',
        comparison_score: 'The comparison_score field must be set for every historical loan. This must be in number format.',
      },
    },
  },
};

function formatDatasourceCell(cell, checkNum) {
  checkNum = checkNum || false;
  if (typeof cell === 'string') {
    cell = transformhelpers.filterCSVSpecialCharacters(cell, true);
    if (!cell.length) return '';
    if (checkNum && !isNaN(Number(cell))) {
      cell = cell.replace(/[^a-zA-Z0-9_.\s]/g, '');
    } else {
      cell = cell.replace(/[^a-zA-Z0-9_\s]/g, '');
    }
    //newline replace with empty space
    cell = cell.replace(/\r?\n|\r/g, ' ');
    switch (cell.toLowerCase()) {
      case 'true':
        cell = true;
        break;
      case 'false':
        cell = false;
        break;
      case 'null':
        cell = null;
        break;
      default:
        break;
    }
    if (typeof cell === 'string' && !isNaN(Number(cell))) cell = Number(cell);
    if (typeof cell === 'string' && cell.includes('\'')) cell = cell.replace(/'/g, '');
  }
  return cell;
}

function isValidHistoricalResult(model_type, historical_value) {
  let historical_data_valid = true;
  switch (model_type) {
    case 'binary':
      if (typeof historical_value === 'boolean') break;
      else historical_data_valid = false;
      break;
    case 'regression':
      if (typeof historical_value !== 'number') historical_data_valid = false;
      break;
    case 'categorical':
      if (!String(historical_value).length) historical_data_valid = false;
      break;
    default:
      break;
  }
  return historical_data_valid;
}

function formatDatasourceRows(row) {
  let errorMessage = '';
  try {
    const self = this;
    self.row_count++;
    let formatted_row = self.headers.reduce((acc, header, header_index) => {
      if (errorMessage) return;
      let value = row[ header_index ];
      value = formatDatasourceCell(value, true);
      if (header_index === self.historical_result_idx && !isValidHistoricalResult(self.model_type, value)) {
        errorMessage = ERROR_MESSAGES[ 'datasource_upload' ][ self.model_type ];
      } else {
        if (value !== undefined && value !== '') {
          let value_type = typeof value;
          if (value_type === 'string') {
            if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') value_type = 'boolean';
          }
          self.data_type_predictor_map[ header ][ value_type ] = (self.data_type_predictor_map[ header ][ value_type ]) ? self.data_type_predictor_map[ header ][ value_type ] + 1 : 1;
          if (value_type === 'number' && !self.unique_number_value_map[ header ][ value ]) self.unique_number_value_map[ header ][ value ] = true;
        }
      }
      acc.push(String(value));
      return acc;
    }, []);
    if (errorMessage) return new Error(errorMessage);
    if ((self.row_count - 1) % 10 <= 6) self.training_data_rows.push(formatted_row);
    else self.testing_data_rows.push(formatted_row);
    return true;
  } catch (e) {
    return e.message;
  }
}

function setDatasourceHeaders(headers) {
  const self = this;
  for (let i = 0; i < headers.length; i++) {
    headers[ i ] = transformhelpers.filterCSVSpecialCharacters(headers[ i ], true);
    if (headers[ i ] === 'historical_result') self.historical_result_idx = i;
    if (headers[ i ].trim() === '') headers[ i ] = `col${i + 1}`;
    self.data_type_predictor_map[ headers[ i ] ] = {};
    self.unique_number_value_map[ headers[ i ] ] = {};
  }
  self.headers = headers;
}

function setIndustryHeaders(headers) {
  const self = this;
  const headerIndexMap = {};
  for (let i = 0; i < headers.length; i++) {
    headers[ i ] = transformhelpers.filterCSVSpecialCharacters(headers[ i ], true);
    headerIndexMap[ headers[ i ] ] = i;
  }
  self.industry_headers = headers;
  self.industry_headers_map = headerIndexMap;
}

function getDatasourceSchema() {
  try {
    const self = this;
    if (self.strategy_data_schema && self.data_schema) {
      return { strategy_data_schema: self.strategy_data_schema, data_schema: self.data_schema, };
    } else {
      let strategy_data_schema = {};
      let data_schema = {
        attributes: [],
        dataFileContainsHeader: true,
        dataFormat: 'CSV',
        targetAttributeName: 'historical_result',
        version: '1.0',
      };
      let data_type_predictor_map = self.data_type_predictor_map;
      let unique_number_value_map = self.unique_number_value_map;
      self.headers.forEach(header_name => {
        // let dateCount = data_type_predictor_map[ header_name ].date;
        let numberCount = data_type_predictor_map[ header_name ].number;
        let stringCount = data_type_predictor_map[ header_name ].string;
        let booleanCount = data_type_predictor_map[ header_name ].boolean;
        let uniqueNumberCount = Object.keys(unique_number_value_map[ header_name ]).length;
        if (header_name === 'historical_result') {
          if (self.model_type === 'regression') {
            strategy_data_schema[ header_name ] = { data_type: 'Number', };
            data_schema.attributes.push({ attributeName: header_name, attributeType: 'NUMERIC', });
          } else if (self.model_type === 'binary') {
            strategy_data_schema[ header_name ] = { data_type: 'Boolean', };
            data_schema.attributes.push({ attributeName: header_name, attributeType: 'CATEGORICAL', });
          } else if (self.model_type === 'categorical') {
            strategy_data_schema[ header_name ] = { data_type: 'String', };
            data_schema.attributes.push({ attributeName: header_name, attributeType: 'CATEGORICAL', });
          }
        } else if (numberCount && !stringCount && !booleanCount && uniqueNumberCount < 10) {
          data_schema.attributes.push({ attributeName: header_name, attributeType: 'CATEGORICAL', });
          strategy_data_schema[ header_name ] = { data_type: 'Number', };
        } else if (numberCount && !stringCount && !booleanCount && uniqueNumberCount >= 10) {
          data_schema.attributes.push({ attributeName: header_name, attributeType: 'NUMERIC', });
          strategy_data_schema[ header_name ] = { data_type: 'Number', };
        }/*else if (dateCount && !stringCount && !booleanCount && !numberCount) {
          data_schema.attributes.push({ attributeName: header_name, attributeType: 'NUMERIC', });
          strategy_data_schema[ header_name ] = { data_type: 'Date', };
        }*/ else if (booleanCount === self.row_count) {
          data_schema.attributes.push({ attributeName: header_name, attributeType: 'BINARY', });
          strategy_data_schema[ header_name ] = { data_type: 'Boolean', };
        } else {
          data_schema.attributes.push({ attributeName: header_name, attributeType: 'CATEGORICAL', });
          strategy_data_schema[ header_name ] = { data_type: 'String', };
        }
        self.strategy_data_schema = strategy_data_schema;
        self.data_schema = data_schema;
        return { strategy_data_schema: self.strategy_data_schema, data_schema: self.data_schema, };
      });
    }
  } catch (e) {
    return e;
  }
}

function insertInputAnalysisRow(row, historical_result) {
  try {
    let errorMessage = '';
    const self = this;
    const industryHeaders = self.industry_headers;
    const industryHeadersMap = self.industry_headers_map;
    let formatted_row = industryHeaders.reduce((acc, header, header_index) => {
      if (errorMessage) return;
      let value = row[ header_index ];
      if (isNaN(parseFloat(value))) {
        if (header === 'charge_off_amount') {
          if (historical_result.toLowerCase() === 'true') {
            errorMessage = ERROR_MESSAGES['datasource_upload']['industry']['lending'][ 'charge_off_amount' ];
          } else {
            acc.push('');
          }
        } else if (header === 'charge_off_date') {
          if (historical_result.toLowerCase() === 'true') {
            errorMessage = ERROR_MESSAGES['datasource_upload']['industry']['lending'][ 'charge_off_date' ];
          } else {
            acc.push('');
          }
        } else if (header === 'charge_off_month') {
          if (historical_result.toLowerCase() === 'true') {
            errorMessage = ERROR_MESSAGES['datasource_upload']['industry']['lending'][ 'charge_off_month' ];
          } else {
            acc.push('');
          }
        } else {
          errorMessage = ERROR_MESSAGES['datasource_upload']['industry']['lending'][ header ];
        }
      } else {
        acc.push(parseFloat(value).toString());
      }
      return acc;
    }, []);
    if (errorMessage) return new Error(errorMessage);
    else {
      self.industry_rows.push(formatted_row);
    }
    return true;
  } catch (e) {
    return e.message;
  }
}

function MLDatasource() {
  this.data_type_predictor_map = {};
  this.unique_number_value_map = {};
  this.filename = null;
  this.industry = null;
  this.headers = [];
  this.industry_headers = [];
  this.industry_headers_map = {};
  this.row_count = 0;
  this.industry_rows = [];
  this.training_data_rows = [];
  this.testing_data_rows = [];
  this.historical_result_idx = -1;
  this.strategy_data_schema = null;
  this.data_schema = null;
  this.model_type = null;
  this.setIndustryHeaders = setIndustryHeaders.bind(this);
  this.setHeaders = setDatasourceHeaders.bind(this);
  this.insertRow = formatDatasourceRows.bind(this);
  this.insertInputAnalysisRow = insertInputAnalysisRow.bind(this);
  this.getDatasourceSchema = getDatasourceSchema.bind(this);
}

module.exports = MLDatasource;