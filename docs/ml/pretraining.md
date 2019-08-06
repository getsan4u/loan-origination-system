# Machine Learning Model Pretraining Process (Technical Overview) 
#### Step 1: Creating an mlmodel mongo document 
The first step to training a machine learning model is to hit the `Train Model` button on the Machine Learning interface. This button is a link that leads the end user to a page with guided steps in training a model. The first step is to add a `Model Name` and `Description`. After filling out these fields, clicking the `Select Model Type` button will create an `mlmodel` mongo document in the mlmodels collection of the database. The following route is executed when clicking `Select Model Type`:

```
MlRouter.post('/initialize_new_model',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  transformController.pretransform,
  mlController.createInitialMongoModel);
```

#### Step 2: Select Model Type
The second step is to select a model type. Selecting a model type will simply update the `type` field on the `mlmodel mongo document`. After clicking on one of the radio buttons for the `type` of model to train, the end user would click `Provide Historical Data` to move onto the next step. However, this route also handles other scenarios. For instance, if the user selected an industry-specific model, an `industry` field would be updated on the mlmodel mongo document as well. Also, if the user selected a model type --> moved onto the next stage --> uploaded a csv file, and then went back to change their model type, the `datasource mongo document` that was created during the upload phase would be deleted and disassociated from the current `mlmodel mongo document`. The following route is executed when clicking `Provide Historical Data`:

```
MlRouter.put('/select_model_type/:id',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  mlController.getModel,
  mlController.deleteDataSourceIfExists,
  mlController.selectModelType);
```

#### Step 3: Provide Historical Data
The third step is to provide historical data. CSV files allow for up to 100MB files to be uploaded, while xlsx and xls files allow up to 10MB. These limits use `bytes` as their unit and can be changed in the `decision-engine-service-container configuration` database mongo document in the `config.settings.optimization.data_source_upload_filesize_limit` settings:
```
"optimization" : {
  "data_source_upload_filesize_limit" : 104857600,
  "data_source_upload_min_filesize" : 10240,
  "batch_process_upload_filesize_limit" : 2097152
},
``` 
- The data files that are uploaded should have an initial column header row (which contains unique header names) followed by rows of corresponding data. 
- Data that is uploaded is streamed in as a buffer and then converted into a csv array through an NPM package called [PapaParse](https://www.npmjs.com/package/papaparse). This occurs in the `readCSVDataSource` ml middleware controller function.
  - During the process of parsing, each row of data is processed through various functions available in an MLClass (utilities/mlresource/mlclass).
  - The MLClass cleans each row element, checks that the data is valid for processing, and compartmentalizes each column_header into either a `Number`, `String`, or `Boolean` type.
  - Error handlers stop the process if certain requirements are not met and are bubbled up to the end user. (E.g. `historical_result` is a required column header in the csv data that is uploaded)
- After the csv data is fully read into the system, the data is split into training and testing data, and then uploaded to AWS S3 in the `${aws_container_name}/mloriginal` location. The details of this S3 upload can be found in the `uploadOriginalFilesToS3` controller function.
- Once the data is uploaded to S3, the `datasource mongo document` is created through the `createDataSource` ml controller function
- If the model is industry-specific, an industry data file will also be created and stored as a file object split into chunks, using mongo's GridFS solution
- The associated mlmodel is then updated with the ObjectId of the newly created `datasource mongo document` (`uploadIndustryInputFile`)
- Finally, the datasource data is transposed so that each predictor_column can be analyzed against the historical data. The purpose of this step is to generate basic statistical values on each column and produce regression functions that will then be used to transform each data column into better suited data for training the model
  - The [MLJS](https://www.npmjs.com/package/ml) library is leveraged for some of its simple `Regression` functions. In other cases, DigiFi's own implementations of well-known statistical tests are used to generate correlation coefficients and values:
  - For `Binary`  models (models in which the historical_result is true or false), the following regression tests are run:
    - `Number` predictor variable vs. `historical_result`: MLJS - Simple Linear Regression, Polynomial Regression (2nd - 5th degree), Power Regression, Exponential Regression
    - `Binary` predictor variable vs. `historical_result`: MLJS - Simple Linear Regression, Polynomial Regression (2nd - 5th degree), Power Regression, Exponential Regression
    - `Categorical` predictor variable vs. `historical_result`: Chi-Squared test w/ Cramer's V Calculation
  - For `Linear` models (models in which the historical_result is a continuous number), the following regression tests are run:
    - `Number` predictor variable vs. `historical_result`: MLJS - Simple Linear Regression, Polynomial Regression (2nd - 5th degree), Power Regression, Exponential Regression
    - `Binary` predictor variable vs. `historical_result`: MLJS - Simple Linear Regression, Polynomial Regression (2nd - 5th degree), Power Regression, Exponential Regression
    - `Categorical` predictor variable vs. `historical_result`: None
  - For `Categorical` models (models in which the historical_result is an arbitrary string value), the following regression tests are run:
    - `Number` predictor variable vs. `historical_result`: Point Biserial Correlation
    - `Binary` predictor variable vs. `historical_result`: Chi-Squared test w/ Cramer's V Calculation
    - `Categorical` predictor variable vs. `historical_result`: Chi-Squared test w/ Cramer's V Calculation
-  The results of performing these regression tests are stored in the `statistics` key of the `datasource mongo document`. The `statistics` key points to a map of each column_header, which stores an array of `transform_functions` as well as basic statistics such as `mean, median, mode, min, and max`. Each `transform function` contains key statistical values such as `r, r2, chi2, rmsd`. Here is a sample of what one of these `transform functions` may look like:

``` 
Sample Datasource mongoObject

statistics: {
  fico_score: transform_functions: [
    {
      "evaluator" : "return 0.028641771783826805 * (x ** 5) - 1.3387254147793526 * (x ** 4) + 22.165030900432274 * (x ** 3) - 162.2067642567311 * (x ** 2) + 613.4233844183428 * (x ** 1) + 635.3134910397757 * (x ** 0)",
      "display_func" : "f(x) = 0.0286 * x^5 - 1.34 * x^4 + 22.2 * x^3 - 162 * x^2 + 613 * x + 635",
      "score" : {
          "r" : 0.556767919730229,
          "r2" : 0.309990516440727,
          "chi2" : 12686.0616725163,
          "rmsd" : 27661098.6140573
      },
      "type" : "polynomial",
      "degree" : 5,
      "selected" : true
    },
    ...other_transform_function_objects
  ]
}
```

- A `transformations` object is created from the top r2 or chi2 values (based on which test is run between predictor variable and historical_result), and this object determines which transform function will be used to transform the data during the data preparation phase of model training. The `evaluator` of the `transform function` is converted into a JavaScript function and run on the fly during the data preparation phase. Here is what a transformations object looks like: 

```
Sample transformations object (inside a datasource mongo document):

{
  "accounts_opened_last_24_months" : {
      "evaluator" : "return 0.028641771783826805 * (x ** 5) - 1.3387254147793526 * (x ** 4) + 22.165030900432274 * (x ** 3) - 162.2067642567311 * (x ** 2) + 613.4233844183428 * (x ** 1) + 635.3134910397757 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "collections_excluding_medical" : {
      "evaluator" : "return -2.894845770509316 * (x ** 5) + 59.72872696533681 * (x ** 4) - 419.20329287856407 * (x ** 3) + 1197.6139099064967 * (x ** 2) - 1554.6669102622245 * (x ** 1) + 2101.8148734423867 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "credit_history" : {
      "evaluator" : "return -3.8226837754829354e-8 * (x ** 5) + 0.00003702433312700243 * (x ** 4) - 0.01308342072431398 * (x ** 3) + 2.046155431759331 * (x ** 2) - 132.8217685209536 * (x ** 1) + 3955.841523710475 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "credit_inquiries_last_6_months" : {
      "evaluator" : "return -0.4273289340730004 * (x ** 5) + 14.838106512238193 * (x ** 4) - 184.09485887289162 * (x ** 3) + 971.3622528978166 * (x ** 2) - 1921.4305751346485 * (x ** 1) + 2276.6001238949625 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "months_since_most_recent_inquiry" : {
      "evaluator" : "return 0.03328445259573392 * (x ** 5) - 1.384286275783888 * (x ** 4) + 16.61230622446778 * (x ** 3) - 28.480061429942698 * (x ** 2) - 275.8596318477998 * (x ** 1) + 1755.3706056483418 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "ninety_plus_delinquencies_last_18_months" : {
      "evaluator" : "return -0.021038195457681562 * (x ** 5) + 2.4504807625072367 * (x ** 4) - 81.33205620759439 * (x ** 3) + 662.260982096589 * (x ** 2) - 1586.4261114956862 * (x ** 1) + 1747.9723510700733 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "open_credit_accounts" : {
      "evaluator" : "return 0.016845605723326263 * (x ** 5) - 0.8580618095397443 * (x ** 4) + 15.592183446574248 * (x ** 3) - 131.58253447922283 * (x ** 2) + 619.065590715758 * (x ** 1) + 345.9487194403767 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "pre_loan_debt_to_income" : {
      "evaluator" : "return 102.6179477133617 * (x ** 5) - 1277.453664596239 * (x ** 4) + 5191.2929002045685 * (x ** 3) - 7659.779923994656 * (x ** 2) + 2967.948747773137 * (x ** 1) + 1314.24872437171 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "public_records" : {
      "evaluator" : "return 593.288043478488 * (x ** 3) - 3420.516304349107 * (x ** 2) + 4098.532608697145 * (x ** 1) + 1498.6956521739137 * (x ** 0)",
      "type" : "Polynomial (3rd Degree)"
  },
  "revolver_utilization" : {
      "evaluator" : "return 204289.4722342022 * (x ** 5) - 516928.45048462466 * (x ** 4) + 468853.3141402801 * (x ** 3) - 185690.6713528406 * (x ** 2) + 30255.7814723178 * (x ** 1) + 839.65678285747 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "thirty_plus_delinquencies_last_3_months" : {
      "evaluator" : "return -0.9165191650390625 * (x ** 4) + 38.56218141508399 * (x ** 3) - 383.36181918201305 * (x ** 2) + 588.8979751147172 * (x ** 1) + 1496.8181818181383 * (x ** 0)",
      "type" : "Polynomial (4th Degree)"
  },
  "thirty_plus_delinquencies_last_24_months" : {
      "evaluator" : "return -0.00006094474377384281 * (x ** 5) + 0.01034008527023696 * (x ** 4) - 0.6128496987807779 * (x ** 3) + 14.272418480814899 * (x ** 2) - 107.51341497741396 * (x ** 1) + 1588.8149352517657 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "total_current_balance" : {
      "evaluator" : "return 2.649056077562744e-23 * (x ** 5) - 2.7263536242647443e-17 * (x ** 4) + 7.803230135573658e-12 * (x ** 3) - 9.702783355768973e-7 * (x ** 2) + 0.0585328875006212 * (x ** 1) + 491.0660505131779 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "total_high_credit_limit" : {
      "evaluator" : "return 5.898288254790151e-24 * (x ** 5) - 7.991730123566514e-18 * (x ** 4) + 2.9981416882149366e-12 * (x ** 3) - 5.229162619765465e-7 * (x ** 2) + 0.044913665924636775 * (x ** 1) + 568.1576109517003 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  },
  "annual_income" : {
      "evaluator" : "return -2.2009300311477152e-21 * (x ** 5) + 1.0561685406175328e-15 * (x ** 4) - 1.7299147601285952e-10 * (x ** 3) + 0.000011718172425743648 * (x ** 2) - 0.2936698428331975 * (x ** 1) + 2931.442857090126 * (x ** 0)",
      "type" : "Polynomial (5th Degree)"
  }
}
```

- Once the regression tests are complete, the `datasource mongo object` is updated with the `statistics` object and `transformations` object.
- NOTE: All of the above (step 3) occurs when the file is uploaded in the interface
- Once the file upload and processing is complete, a modal (with fake progressbars) will appear showing the steps that were taken during the file upload. 
- Hitting continue at this step will redirect the end user to the `Review and Train` step.

The route that is accessed during the datasource upload step is the following:
```
MlRouter.post('/models/:id/data_source',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  mlController.getModel,
  mlController.deleteDataSourceIfExists,
  mlController.readCSVDataSource,
  mlController.uploadOriginalFilesToS3,
  mlController.createDataSource,
  mlController.uploadIndustryInputFile,
  mlController.updateModel,
  transformController.pretransform,
  mlController.updateDatasource,
  mlController.handleControllerDataResponse
);
```
#### Step 4: Review and Train
The Review and Train page displays a table of all column_headers with a variety of statistics. The include_header column allows the end user to select which predictor variables will be used during the training process. Some variables are specifically excluded and uneditable because they have too many unique values (e.g. a name column would not be a very predictive feature). After selecting which variables to include in the training process, the end user can click `Review and Train` which will trigger the following path:

```
MlRouter.post('/models/:id/train',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  mlController.getModel,
  mlController.checkIfLinearModelAndCategoricalAWS,
  mlController.updateDataSchema,
  mlController.trainProviderModels,
  mlController.handleControllerDataResponse
);
```

- The `updateDataSchema` ml controller function will update the `datasource mongo document` with an `included_columns` map. This map is created based on what columns the end user has chosen to include through the interface, and it is used throughout training and prediction processing for the specified model. 
- The `trainProviderModels` ml controller function uses Redis to store ids in the `ml_preprocessing` key, namespaced by environment and model_id as shown below:

```
await hmsetAsync(`${periodic.environment}_ml_preprocessing:${mlmodel._id.toString()}`, {
  _id: mlmodel._id.toString(),
  type: mlmodel.type,
  numErrors: 0,
  datasource: datasource._id.toString(),
  organization: mlmodel.organization._id.toString(),
  user_id: user._id ? user._id.toString() : '',
});
```

- The `trainProviderModels` ml controller function also updates the `mlmodel mongo document` with the `aws_models` and `digifi_models` that will be trained during the training process. These models are set in the `decision-engine-service-container configuration` in the `config.settings.machinelearning.providers` (AWS models) and `config.settings.machinelearning.digifi_models` (DigiFi models) fields.
- This Redis Key is retrieved in a cron (setInterval that runs every minute beginning from appStart). This kicks off the data preprocessing process, which is the first step in the automated pipeline of training an mlmodel.
- NOTE: The `model training process` for a specified mlmodel does not begin until the mlmodel training cron picks it up. This is further discussed in the [Machine Learning Model Training Section](./training.md).