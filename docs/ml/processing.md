# Machine Learning Processing (Technical Overview) 
The processing section of ML allows end users to take their `complete` mlmodels and run individual and batch test cases through their models. A good way to test for proper processing is to download the `batch training` or `batch testing` data that is available on the `DOWNLOAD` dropdown in the mlmodel charts. The results of processing a sample case from one of those download files should result in the same result output for each particular algorithm that was trained.

## Interface Processing

### How Processing Works (Individual)
- When navigating to the `Individual Processing` section, a dropdown containing all `status: complete` mlmodels exists. 
- Once one of those models is selected, all relevant predictor variable inputs will show up in a form to be filled out.
- These inputs should be the `untransformed` or `raw` version of the inputs (e.g. FICO Score: 780, HOUSING_STATUS: RENT, Favorite Color: Blue). 
  - The processing middleware functions run the same exact transformations on the input data that run during the model training process (This includes type coercion, one hot encoding (of string and boolean values), filling in missing values, transformations (using the transformation functions saved onto the associated datasource), and any normalization that might be necessary (currently only for neural networks)).
  - For AWS ML, leaving empty inputs will send NULL
  - For all other models including AWS Sagemaker, leaving empty inputs will send the average (for Number input types) and the encoders_count (for String or Boolean types)
    - NOTE: encoders_count is a map in the datasource that holds the (total number of unique values of a string or boolean column) + 1. It is the same concept as an "OTHER" category. By using this, when no input (or an input that does not exist in the encoders map) is entered, that predictor variable is categorized into the "OTHER" section.
The router that individual ml processing accesses is the following:

```
MlRouter.post('/individual/run/:id', // Machine Learning Individual
  ensureApiAuthenticated,
  organizationController.APIgetOrg,
  organizationController.checkOrganizationBalance,
  paymentController.setRequestTypeAndCost,
  mlController.getModel,
  mlController.getScoreAnalysisDocument,
  mlController.predictSingleMLCase,
  paymentController.stageProcessingTransactionForCreation,
  paymentController.addTransaction,
  mlController.createIndividualMLCase);
```
- The `mlController.getScoreAnalysisDocument` is only necessary for industry-specific models. The major prediction function is in `mlController.predictSingleMLCase` as shown below:

```
async function predictSingleMLCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.mlmodel) {
      let selected_provider = req.controllerData.mlmodel.selected_provider;
      let single_ml_result = await SINGLE_ML_FUNCTIONS[ selected_provider || 'aws' ](req);
      req.controllerData = Object.assign({}, req.controllerData, {
        single_ml_result,
      });
      next();
    } else {
      throw new Error('Could not find model for prediction');
    }
  } catch (e) {
    let errResp = {};
    if (req.controllerData.transactionParams) {
      errResp = {
        status_code: 400,
        status_message: 'Error',
        errors: [ {
          message: 'Error predicting ML Case.',
        }, ],
      };
    } else {
      errResp = {
        message: 'Error predicting ML Case.',
      };
    }
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(errResp);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return res.status(401).send(errResp);
    }
  }
}
```
- The `predictSingleMLCase` function processes single ml cases through functions that are exported from `decision-engine-service-container/utilities/mlresource/processing/individual/index.js`. This file contains all of the prediction functions for each of the algorithms available on the platform. ML Individual API requests to ml models also flow through these functions. The individual prediction functions work very similarly to what happens during the data preprocessing phase prior to training an mlmodel:
  - The first step is to coerce all values according to the proper types that the datasource schema provides
  - The second step is to one hot encode all string and boolean values to numeric categories
  - The third step is to fill in any null values with averages (if Number) or the associated encoder_counts value (if String or Boolean)
  - The fourth step is to run transformation functions, which come from the saved `transformations` map in the associated datasource
  - The fifth step is to run the prediction with the cleaned data and retrieve the response - `ONLY DURING PROCESSING`
  - The final step is to run explainability, which will be discussed below - `ONLY DURING PROCESSING`

### Explainability
The purpose of explainability is to give a sense of the positive or negative contributors to a decision result. Running explainability results in an array of up to 5 positive contributors and up to 5 negative contributors to a decision result. This is very important for specific industries, such as lending, because these reasons are required when reporting the loan decision to a customer. Explainability is also very insightful and invaluable to understanding the primary factors for pushing a machine learning model's decision in a particular direction, which is generally difficult to observe with more "black box" approaches in machine learning. The DigiFi process of determining explainability involves running:
1.) The original prediction
2.) N more predictions (where N represents the number of predictor variables in the model)
  - In each of these predictions, one predictor input variable's value is replaced with the average (in the case of a Number input) and the encoder_counts value (basically the "OTHER" category in the case of a String and Boolean input).
  - The values that return from each of these predictions are then subtracted from the original prediction, resulting in positive or negative value. This value represents a `scaled directional impact value` of how that single predictor input value changed the overall prediction when compared to the "`average`".

- Explainability is always run in ml processing and in BRE processing, but it is optionally run in the API when a flag called `return_top_contributors` is set to `true`.
- The explainability code can be found in any of the `single${AlgorithmType}Processing` functions that can be found in `decision-engine-service-container/utilities/mlresource/processing/individual/index.js` as shown below:
```
if (run_explainability) {
  await Promise.all(datasource_headers.map(async (header, i) => {
    let new_cleaned = cleaned.slice();
    if (strategy_data_schema[ header ] && strategy_data_schema[ header ].data_type === 'Number') {
      new_cleaned[ i ] = (statistics[ header ] && statistics[ header ].mean !== undefined) ? statistics[ header ].mean : null;
      averages[ header ] = new_cleaned[ i ];
      if (transformations && transformations[ header ] && transformations[ header ].evaluator) {
        let applyTransformFunc = new Function('x', transformations[ header ].evaluator);
        new_cleaned[ i ] = applyTransformFunc(new_cleaned[ i ]);
      }
      let { min, max } = column_scale[ datasource_headers[ i ] ];
      new_cleaned[ i ] = normalize(min, max)(new_cleaned[ i ]);
    } else if (strategy_data_schema[ header ] && (strategy_data_schema[ header ].data_type === 'String' || strategy_data_schema[ header ].data_type === 'Boolean') && statistics[ header ].mode !== undefined) {
      new_cleaned[ i ] = statistics[ header ].mode || null;
      averages[ header ] = new_cleaned[ i ];
      if (new_cleaned[ i ] !== undefined && datasource.encoders[ header ] && datasource.encoders[ header ][ new_cleaned[ i ] ] !== undefined) {
        new_cleaned[ i ] = datasource.encoders[ header ][ new_cleaned[ i ] ];
      } else {
        new_cleaned[ i ] = datasource.encoder_counts[ header ];
      }
      let { min, max } = column_scale[ datasource_headers[ i ] ];
      new_cleaned[ i ] = normalize(min, max)(new_cleaned[ i ]);
    }
    let explainability_result = classifier(new_cleaned);
    if (mlmodel.type === 'binary') {
      explainability_result = !isNaN(parseFloat(explainability_result[ 'true' ])) ? explainability_result[ 'true' ] : 1 - explainability_result[ 'false' ];
      // if (runIndustryProcessing) explainability_result = generateProjectedResult(scoreanalysis, explainability_result);
    } else if (mlmodel.type === 'categorical') {
      explainability_result = Object.keys(explainability_result).reduce((arr, key) => {
        arr[ Number(key) ] = explainability_result[ key ];
        return arr;
      }, []);
    }
    explainability_results[ header ] = explainability_result;
  }));
}
```

### How Processing Works (Batch)
- The only difference between ml batch and individual processing is that batch processing requires a CSV upload of data rows to be processed through a model. A `download template` link exists after selecting a model. This template can be filled out with multiple rows (each row is a case) and the processed results will be saved into the system as an `MLSimulation` that contains `MLBatches` which contain up to 100 `MLCases` each. The functionality that they run through is identical and the cases are run in series. The code for ml batch processing can be found in `decision-engine-service-container/utilities/mlresource/processing/batch/index.js`. The route for batch processing is shown below:
```
MlRouter.post('/batch/run', // Machine Learning Batch
  ensureApiAuthenticated,
  organizationController.APIgetOrg,
  organizationController.checkOrganizationBalance,
  paymentController.setRequestTypeAndCost,
  mlController.getUploadedMLData,
  mlController.getModel,
  mlController.getScoreAnalysisDocument,
  mlController.registerMLSimulation,
  paymentController.stageProcessingTransactionForCreation,
  paymentController.addTransaction,
  mlController.runBatchMLProcess);
```

## API Processing
API processing allows end-users to programatically access their models via api_request. The route for api processing is shown below:

### Individual:
```
APIRouter.post('/v2/ml_models',
  isClientAuthenticated,
  organizationController.APIgetOrg,
  apiController.checkPublicKey,
  paymentController.checkOrganizationStatus,
  paymentController.setRequestTypeAndCost,
  transformController.pretransform,
  apiController.createAPIMLRequestRecord,
  mlController.getModelByName,
  mlController.getScoreAnalysisDocument,
  apiController.mlVariableCheck,
  mlController.predictSingleMLCase,
  paymentController.stageAPITransactionForCreation,
  paymentController.addTransaction,
  apiController.updateSimulationRequestRecord,
  transformController.posttransform,
  apiController.sendResponse);
```

### Batch:
```
APIRouter.post('/v2/machine_learning_batch',
  isClientAuthenticated,
  transformController.pretransform,
  organizationController.APIgetOrg,
  apiController.checkPublicKey,
  apiController.limitMaxStrategies,
  paymentController.checkOrganizationStatus,
  paymentController.setRequestTypeAndCost,
  apiController.createAPIMLBatchRequestRecord,
  mlController.batchGetModels,
  mlController.getBatchApiScoreAnalysisDocs,
  // apiController.batchMLVariableCheck,
  mlController.predictBatchMLCase,
  apiController.batchFormatMLResponse,
  paymentController.stageAPITransactionForCreation,
  paymentController.addTransaction,
  apiController.updateAPIRequestRecord,
  transformController.posttransform,
  apiController.sendResponse);
```

Note: The API router uses the same `mlController.predictSingleMLCase` (in the individual case) and the same `mlController.predictBatchMLCase` (in the batch case). The middleware functions that occur before and after that function simply stage the inputs for processing the prediction values in the same way and then format the outputs to send back to the end-user via api response.

Sample API requests for a specific mlmodel can be downloaded by navigating to `Company Settings` --> `API` --> `DOWNLOAD API REQUEST TEMPLATE`, and then selecting the request in `XML` or `JSON` format. 
