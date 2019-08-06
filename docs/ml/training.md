# Machine Learning Model Training Process (Technical Overview) 
### Cron Initialization
The following path: `content/container/decision-engine-service-container/index.js` is where `periodic` loads on app start. In this file, the `ml_crons` (setIntervals) begin running unless the `decision-engine-service-container configuration` has its machinelearning `use_mlcrons` set to false. Here is the full code that initializes this process. I've written commented code above each of the important lines to delineate what each cron is for:

```
location: content/container/decision-engine-service-container/index.js 

let machinelearning = new AWS.MachineLearning();
periodic.aws.machinelearning = machinelearning;

if (machineLearningSettings.use_mlcrons) {
  // AWS Sagemaker training cron
  mlcrons.sageMaker();

  // DigiFi models training cron
  mlcrons.digifi();

  // Cron that updates the "selected_provider" on an mlmodel once the realtime endpoint is ready (AWS SAGEMAKER AND AWS LINEAR LEARNER ONLY)
  mlcrons.modelSelectionUpdater();

  /* Cron that checks for models that have completely trained all of its algorithms and updates the overall mlmodel document to complete. Once an mlmodel document is flipped to complete, it will be available for use in processing and in the business rules engine. */
  setInterval(() => {
    mlcrons.overallModelUpdater();
  }, 5000);

  /* Cron that kicks off the data preprocessing step - this is run in a cron to avoid long delays during the data upload step in the pretraining process above. Since model training takes a long time to begin with, adding in this process through a cron would eliminate end users being "stuck" on the data upload phase. */
  setInterval(async () => {
    const redisClient = periodic.app.locals.redisClient;
    const getAllKeys = Promisie.promisify(redisClient.keys).bind(redisClient);
    const getValues = Promisie.promisify(redisClient.hgetall).bind(redisClient);
    const allKeys = await getAllKeys(`${periodic.environment}_ml_preprocessing:*`);
    const allValues = await Promise.all(allKeys.map(key => getValues(key)));
    allValues.forEach(mlmodel => {
      // data preprocessing step runs for each redis key that is available in the current environment
      mlcrons.preTrainingProcess({ mlmodel, });
      // key is deleted after data preprocessing step completes
      redisClient.del(`${periodic.environment}_ml_preprocessing:${mlmodel._id.toString()}`);
    });
  }, 15000);
  
  /* AWS ML training cron (Should organize this better eventually like the above training crons) */
  setInterval(() => {
    periodic.app.locals.redisClient.keys(`${periodic.environment}_ml_aws:*`, function (err, model_keys) {
      if (model_keys.length) {
        let data_sources = {};
        let ml_models = {};
        let upload_datasources = {};
        let getValueAsync = (model_key) => new Promise((resolve, reject) => {
          try {
            periodic.app.locals.redisClient.hgetall(model_key, function (err, results) {
              return resolve(results);
            });
          } catch (err) {
            return reject(err);
          }
        });
        let getValues = model_keys.map(model_key => getValueAsync(model_key));
        Promise.all(getValues)
          .then(values => {
            model_keys.forEach((model_key, idx) => {
              let current_model = values[ idx ];
              if (current_model && current_model.status === 'datasource_cleanup' && !current_model.data_source_training_status) {
                upload_datasources[ current_model._id ] = current_model;
              }
              // mlcrons.uploadDatasources(machinelearning, upload_datasources);
              if (current_model && !current_model.model_id) return;
              if (current_model && current_model.data_source_training_status === 'true' && current_model.data_source_testing_status === 'true' && current_model.ml_model_status === 'false') {
                ml_models[ current_model.model_id ] = current_model;
              } else if (current_model && (current_model.data_source_training_status === 'false' || current_model.data_source_testing_status === 'false')) {
                data_sources[ current_model.model_id ] = current_model;
              } else if (current_model && current_model.data_source_training_status === 'true' && current_model.data_source_testing_status === 'true' && current_model.ml_model_status === 'true') {
                return;
              }
              mlcrons.checkDataSources(machinelearning, data_sources);
              mlcrons.checkMLModels(machinelearning, ml_models);
              mlcrons.batchUpdater({ s3, machinelearning, });
              mlcrons.modelUpdater();
            });
          });
      } else {
        mlcrons.batchUpdater({ s3, machinelearning, });
        mlcrons.modelUpdater();
      }
    });
    // }, 5000);

  }, machineLearningSettings.cron_interval || 60000);
}
```

- Redis is used to maintain the status/stage of the training process. It is also used to update important mongo_ids and keys throughout the process. The general process of training runs in the following major steps:

#### Step 1: Data preprocessing
This step takes the original csv data that is stored in S3 and applies data type coercion, `transformations` functions, oneHotEncoding, and data normalization to create a unique data set for each algorithm that is run for the specified machine learning model. These datasets are then uploaded to S3 (for AWS models) or saved into the `mldatasets` collection (for DigiFi models).
  - The code that initializes this process is in the index.js file of the decision-engine-service container as shown below: 
  ```
  setInterval(async () => {
    const redisClient = periodic.app.locals.redisClient;
    const getAllKeys = Promisie.promisify(redisClient.keys).bind(redisClient);
    const getValues = Promisie.promisify(redisClient.hgetall).bind(redisClient);
    const allKeys = await getAllKeys(`${periodic.environment}_ml_preprocessing:*`);
    const allValues = await Promise.all(allKeys.map(key => getValues(key)));
    allValues.forEach(mlmodel => {
      // data preprocessing step runs for each redis key (training-ready mlmodel) that is available in the current environment
      mlcrons.preTrainingProcess({ mlmodel, });
      // key is deleted after data preprocessing step completes for all algorithms of each mlmodel
      redisClient.del(`${periodic.environment}_ml_preprocessing:${mlmodel._id.toString()}`);
    });
  }, 15000);
  ```
  - The key step from the code snippet above is the `mlcrons.preTrainingProcess({ mlmodel, })` function call. The mlmodel in this case is just the object that is stored on Redis through a key of `${periodic.environment}_ml_preprocessing:*`. This object is passed into the preTrainingProcess function, which can be found in the `content/container/decision-engine-service-container/utilities/mlcrons` file: 

  ```
  content/container/decision-engine-service-container/utilities/mlcrons

  async function preTrainingProcess({ mlmodel, }) {
    const MLModel = periodic.datas.get('standard_mlmodel');
    const Datasource = periodic.datas.get('standard_datasource');
    try{
      let mongo_mlmodel = await MLModel.load({ query: { _id: mlmodel._id,  }, });
      mongo_mlmodel = mongo_mlmodel.toJSON? mongo_mlmodel.toJSON(): mongo_mlmodel;
      let datasource = mongo_mlmodel.datasource;
      let trainingDataRows = await FETCH_PROVIDER_BATCH_DATA[ 'original' ]({ mlmodel: mongo_mlmodel, batch_type: 'training', });
      let testingDataRows = await FETCH_PROVIDER_BATCH_DATA[ 'original' ]({ mlmodel: mongo_mlmodel, batch_type: 'testing', });
      let strategy_data_schema = JSON.parse(mongo_mlmodel.datasource.strategy_data_schema);
      let included_columns = datasource.included_columns? JSON.parse(datasource.included_columns) : {};
      let headers = trainingDataRows[0];
      trainingDataRows.splice(0, 1);
      testingDataRows.splice(0, 1);
      let historical_result_idx = headers.indexOf('historical_result');
      let columnTypes = {};
      for (let [key, val,] of Object.entries(strategy_data_schema)) {
        columnTypes[ key ] = val.data_type;
      }
      let training_data_transposed = math.transpose(trainingDataRows);
      let testing_data_transposed = math.transpose(testingDataRows);
      let included_headers = headers.filter(header => included_columns[header]? true : false);
      training_data_transposed = training_data_transposed.filter((column, idx) => {
        let header = headers[idx];
        let truthy = (included_columns[header])? true : false;
        return truthy;
      });
      testing_data_transposed = testing_data_transposed.filter((column, idx) => {
        let header = headers[idx];
        return (included_columns[header])? true : false;
      });
      let { decoders, encoders, encoder_counts,} = createHotEncodeMap({ csv_headers: included_headers, training_data_transposed, columnTypes,});
      let auto_progress_configs = {
        'aws': { 
          interval: 20000,
          max_progress: 20,
        },
        'sagemaker_ll': { 
          interval: 7000,
          max_progress: 60,
        },
        'sagemaker_xgb': { 
          interval: 8000,
          max_progress: 60,
        },
        'decision_tree': { 
          interval: 3000,
          max_progress: 60,
          progress_value: 1,
        },
        'random_forest': { 
          interval: 4000,
          max_progress: 60,
          progress_value: 1,
        },
        'neural_network': { 
          interval: 5000,
          max_progress: 60,
          progress_value: 1,
        },
      };
      await Datasource.update({
        id: datasource._id.toString(),
        isPatch: true,
        updatedoc: {
          decoders, 
          encoders, 
          encoder_counts,
        },
        updatedat: new Date(),
      });
      let providers = THEMESETTINGS.machinelearning.providers;
      let digifi_models = THEMESETTINGS.machinelearning.digifi_models[mongo_mlmodel.type] || [];
      providers.forEach(provider => {
        PROVIDER_DATASOURCE_FUNCS[provider]({ mlmodel, headers: included_headers, training_data_transposed, testing_data_transposed, columnTypes, });
        helpers.mlAutoProgress({ provider, model_id: mlmodel._id.toString(), interval: auto_progress_configs[provider].interval, organization: mlmodel.organization.toString(), max_progress: auto_progress_configs[provider].max_progress, });
      });
      PROVIDER_DATASOURCE_FUNCS['digifi']({ mlmodel, headers: included_headers, training_data_transposed, testing_data_transposed, columnTypes, });
      digifi_models.forEach(provider => {
        helpers.mlAutoProgress({ provider, model_id: mlmodel._id.toString(), interval: auto_progress_configs[provider].interval, organization: mlmodel.organization.toString(), max_progress: auto_progress_configs[provider].max_progress, progress_value: auto_progress_configs[provider].progress_value });
      });
    } catch(e){
      logger.warn(e.message);
      await MLModel.update({
        id: mlmodel._id.toString(),
        isPatch: true,
        updatedoc: {
          status: 'failed',
        },
        updatedat: new Date(),
      });
    }
  }
  ```
  - The above function queries for the `mlmodel mongo document`, which returns with the associated `datasource mongo document` populated. The `original training data` and `original testing data` are both fetched from S3 and then transposed.
  - An encodingMap is created using the training dataset for `String` and `Boolean` type columns (to recall, these data types were determined when the csv file was uploaded and read into the system). The `createHotEncodeMap` function returns an encoders map (to encode strings and booleans to categorical numeric values (1, 2, 3, etc), decoders map (to decode string or boolean inputs during processing), and an encoder_counts map that stores the maximumEncoder value + 1 of each column_header (This is the value that is used when a null value or a value that is not a part of the decoder/encoder map is entered during processing).

  ```
  let { decoders, encoders, encoder_counts,} = createHotEncodeMap({ csv_headers: included_headers, training_data_transposed, columnTypes,});
  ```

  - After creating the encodingMap for each column_header of the original training dataset, the active AWS and DigiFi provider algorithms are identified from the configuration file and their unique scripts are run to type coerce each cell to the proper data type, oneHotEncode `String` and `Boolean` values according to the encoders map created previously, and then transformed using the `datasource.transformations` functions for each column if the function exists. The functions that kick off the process are from the above file and can be seen here: 

  ```
  let providers = THEMESETTINGS.machinelearning.providers;
  let digifi_models = THEMESETTINGS.machinelearning.digifi_models[mongo_mlmodel.type] || [];
  providers.forEach(provider => {
    PROVIDER_DATASOURCE_FUNCS[provider]({ mlmodel, headers: included_headers, training_data_transposed, testing_data_transposed, columnTypes, });
    helpers.mlAutoProgress({ provider, model_id: mlmodel._id.toString(), interval: auto_progress_configs[provider].interval, organization: mlmodel.organization.toString(), max_progress: auto_progress_configs[provider].max_progress, });
  });
  PROVIDER_DATASOURCE_FUNCS['digifi']({ mlmodel, headers: included_headers, training_data_transposed, testing_data_transposed, columnTypes, });
  digifi_models.forEach(provider => {
    helpers.mlAutoProgress({ provider, model_id: mlmodel._id.toString(), interval: auto_progress_configs[provider].interval, organization: mlmodel.organization.toString(), max_progress: auto_progress_configs[provider].max_progress, progress_value: auto_progress_configs[provider].progress_value });
  });
  ```
  - The `helpers.mlAutoProgress` is a setInterval that runs for each provider to emit updates to the interface's progress bars through websockets. 
  - The individual data transformation script files can be found in `content/container/decision-engine-service-container/utilities/mlresource/datasource`.
  - Once data preprocessing is complete, files are saved into mongodb (`mldatasets` collection for DigiFi models) and AWS S3 (for AWS models), and the `datasource mongo document` is updated with these new file locations. Also, Redis is updated with new keys to allow for the other crons from the `index.js` file to know that training for the `AWS` and `DigiFi` models is ready.
  - Each `mlmodel mongo document` contains a key of the algorithm name pointing to the details of each algorithm (model configurations, batch_testing_id, batch_training_id, etc)
  - Each `datasource mongo document` contains a providers object that contains a key of each of the algorithm names pointing to an object that contains datasource details (headers array, testing file location details, training file location details, batch training file location details).
#### Step 2: Model Training
- For AWS models model training is run on AWS servers, achieved through API calls using the node [AWS ML Node SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/MachineLearning.html) (AWS Machine Learning) and the node [AWS Sagemaker Node SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SageMaker.html) (AWS Linear Learner and AWS XGB).
- For DigiFi models, model training is done on DigiFi servers.

The code that initializes this process can be found in the `index.js` file of the `decision-engine-service-container` and is as follows:

```
  // AWS Sagemaker training cron
  mlcrons.sageMaker();

  // DigiFi models training cron
  mlcrons.digifi();

  /* AWS ML training cron (Should organize this better eventually like the above training crons) */
  setInterval(() => {
    periodic.app.locals.redisClient.keys(`${periodic.environment}_ml_aws:*`, function (err, model_keys) {
      if (model_keys.length) {
        let data_sources = {};
        let ml_models = {};
        let upload_datasources = {};
        let getValueAsync = (model_key) => new Promise((resolve, reject) => {
          try {
            periodic.app.locals.redisClient.hgetall(model_key, function (err, results) {
              return resolve(results);
            });
          } catch (err) {
            return reject(err);
          }
        });
        let getValues = model_keys.map(model_key => getValueAsync(model_key));
        Promise.all(getValues)
          .then(values => {
            model_keys.forEach((model_key, idx) => {
              let current_model = values[ idx ];
              if (current_model && current_model.status === 'datasource_cleanup' && !current_model.data_source_training_status) {
                upload_datasources[ current_model._id ] = current_model;
              }
              // mlcrons.uploadDatasources(machinelearning, upload_datasources);
              if (current_model && !current_model.model_id) return;
              if (current_model && current_model.data_source_training_status === 'true' && current_model.data_source_testing_status === 'true' && current_model.ml_model_status === 'false') {
                ml_models[ current_model.model_id ] = current_model;
              } else if (current_model && (current_model.data_source_training_status === 'false' || current_model.data_source_testing_status === 'false')) {
                data_sources[ current_model.model_id ] = current_model;
              } else if (current_model && current_model.data_source_training_status === 'true' && current_model.data_source_testing_status === 'true' && current_model.ml_model_status === 'true') {
                return;
              }
              mlcrons.checkDataSources(machinelearning, data_sources);
              mlcrons.checkMLModels(machinelearning, ml_models);
              mlcrons.batchUpdater({ s3, machinelearning, });
              mlcrons.modelUpdater();
            });
          });
      } else {
        mlcrons.batchUpdater({ s3, machinelearning, });
        mlcrons.modelUpdater();
      }
    });
  }, machineLearningSettings.cron_interval || 60000);
```

- Note: AWS Sagemaker, DigiFi, and AWS ML all run on separate crons.
- These three crons will run every 60s (or if a cron_interval is set, it will run at the rate of the cron_interval), and it will pick up any redisKeys that are at the training step (which means the previous datasource preprocessing step has completed). 
- Each cron will pick up one model at a time and queue them into their current stage of training. These training steps can be found in `decision-engine-service-container/utilities/mlcrons`.

General Overview:
The key phases that all of our mlmodels go through is the model training step, batch prediction creation (for testing and training data) and batch analysis. For industry-specific models, there is also an input_analysis step and score_analysis step, which will be discussed later.

- `AWS Sagemaker models` (Linear Learner and XGB) each have a pipeline that checks the associated model key on Redis and stores a `status`. Whenever the cron runs on the interval, the model will check if it has completed the asynchronous training step on the AWS Sagemaker platform through an API call, and if so, it will make the proper updates on Redis and mongodb to progress the model to its next phase. These steps can be seen below as an example for the AWS Sagemaker Linear Learner model training process:

```
const SUCCESS_STATUS = [/*'datasource_cleanup',*/ 'ready_for_training', 'trainingjob_started', 'trainingjob_complete', 'created_model', 'training_transformjob_started', 'testing_transformjob_started', 'transformjob_completed', 'check_completion'];
let PIPELINE = [ createTrainingJob, waitForTrainingJob, createModel, startTrainingBatchTransform, startTestingBatchTransform, checkBatchTransformJob, runBatchPredictionAnalysis, completeLLTrainingProcess];
const CLEAR_STATUS = {
  Completed: true,
  Stopped: true,
  Failed: true,
};
```
- Notice that there is a `PIPELINE` array that holds each function that will be run during each `SUCCESS_STATUS`. These two arrays should be the same length and each index of the `SUCCESS_STATUS` array should reflect the index in the `PIPELINE` array of the function that will be run during that step. The `SUCCESS_STATUS` values are all of the statuses that will be updated on Redis on the `status` key for the training model. The scripts for Sagemaker can be found in `decision-engine-service-container/utilities/mlcrons/sagemaker`.

- `AWS ML models` run in their own cron process, in a similar way to AWS Sagemaker. These functions can be found in `decision-engine-service-container/utilities/mlcrons`. AWS ML models start by creating a datasource on AWS ML (`createDataSource` SDK function), creating an mlmodel from that datasource (`createMLModel` SDK function), then creating batch predictions (`createBatchPrediction` SDK function), and then finally running the batch analysis function `decision-engine-service-container/utilities/mlcrons/batch_updater.js`. These steps can be identified in the following function calls which are all located in `decision-engine-service-container/utilities/mlcrons`:

```
mlcrons.checkDataSources(machinelearning, data_sources);
mlcrons.checkMLModels(machinelearning, ml_models);
mlcrons.batchUpdater({ s3, machinelearning, });
mlcrons.modelUpdater();
```

- `DigiFi models` have their own folder of cron functions as well, located in `decision-engine-service-container/utilities/mlcrons/digifi`. Since DigiFi models have to run on the server and Node is not great for compute-intensive work, the `worker-threads` module of Node (available on version 11+) is leveraged to run models in parallel on a node server that is spawned on each CPU available. 
  - Because of the use of the `worker-threads` module, script files of the algorithm training processes are saved into the `content/files/digifi_model_scripts` locations for each of the available model types `binary, categorical and regression`. These scripts are accessed by each worker thread that is spawned and passed in data that is required for training a model on each respective algorithm.
  - During training, each of these `worker-threads` runs one of each of the scripts of the current model (based on its model type) and trains the models in parallel without blocking the main node thread. Once training is complete for all algorithms, the mlmodel is updated and moved onto the next phase of the training process.
  - Since `DigiFi models` are trained `synchronously` using open source libraries available in npm modules, Redis is not necessary and thus is not used to manage training statuses. 
  - DigiFi `mlmodel mongo documents` are updated directly and are queried based on mongoID to progress the models to their next phases.
  - After model training, batch prediction cases are created and stored through GridFS , and then the batch analysis is run.

#### Step 2A: Industry-Specific input analysis and score analysis creation
Industry specific models (currently only lending is available) allow for a larger dataset to be uploaded (with specified column_headers). In addition to the model being trained (currently only as a binary model), a series of input_analysis and score_analysis calculations will be performed to produce the `Input Data Analysis` and `DigiFi Score Analysis` charts that can be viewed by an end user. 

##### What is an Input Data Analysis?
- Generates industry-specific statistics and distributions that may be more useful than the generic statistical charts that are provided in the `Model Evaluation` charts (ROC, KS-Curve etc...)
- For example, in the lending case, the following charts are available:
  - Total Loan Volume by count (bucketed by each predictor variable)
  - Total Loan Volume by amount (bucketed by each predictor variable)
  - Percent of Loan Volume by count (bucketed by each predictor variable)
  - Percent of Loan Volume by amount (bucketed by each predictor variable)
  - Average Loan Size (bucketed by each predictor variable)
  - Average Interest Rate (bucketed by each predictor variable)
  - Annual Default Rate (bucketed by each predictor variable)
  - Annual Yield (bucketed by each predictor variable)
  - Time Series By Count (bucketed by each predictor variable)
  - Time Series By Amount (bucketed by each predictor variable)
##### What is a DigiFi Score Analysis?
- Generates distributions after mapping the results of each batch prediction set (training and testing) to a `DigiFi Score`. `DigiFi Scores` (which currently range from 300 - 850) are generally the x-axis on these analysis charts and provide a means for replacing a score value (e.g. FICO Score) to show the performance of a model on the historical data provided. A comparison_score column can also be added to the dataset, allowing for a comparison of the Average Score and ROC curves that are produced by the `comparison_score` and the `DigiFi Score`. 
- For example, in the lending case, the following charts are available:
  - Loan Volume by count (bucketed by each DigiFi Score [300 - 850])
  - Loan Volume by amount (bucketed by each DigiFi Score [300 - 850])
  - Annual Default Rate (bucketed by each DigiFi Score [300 - 850])
  - Cumulative Default Rate By Count (bucketed by each DigiFi Score [300 - 850])
  - Cumulative Default Rate By Amount (bucketed by each DigiFi Score [300 - 850])
  - Time Series By Count (bucketed by each DigiFi Score [300 - 850])
  - Time Series By Amount (bucketed by each DigiFi Score [300 - 850])
  - Model Drivers (A chart that displays the average of each predictor value (or the counts of each predictor value for non numeric values) bucketed by each DigiFi Score [300 - 850])
  - Predictive Power (A chart comparison of the ROC curve of the `comparison_score` vs. ROC curve of DigiFi Score)
  - Average Score (A chart comparison of the average `comparison_score` bucketed by each DigiFi Score [300 - 850])
  - Projected Annual Default Rate (A projection chart displaying Projected ADR vs. DigiFi Score).

The key differences between a generic model training process versus an industry-specific one are as follows:
- 1.) When a dataset is uploaded through the interface, the data in the columns of specified header names will be saved into the `fs.files` collection as a collection of `fs.chunks` (This is simply a result of using GridFS to upload data). 
- 2.) The data in the `fs.files` and `fs.chunks` will be pulled and processed through the `input_analysis` cron, which can be found in the `decision-engine-service-container/utilities/mlcrons/digifi/index.js` file as shown here:

```
let input_running = false;
setInterval(async (options) => {
  if (!input_running) {
    let inputMlModels = await MLModel.model.find({ digifi_model_status: 'input_analysis' }).lean();
    if (inputMlModels) {
      input_running = true;
      await Promise.all(inputMlModels.map(async mlmodel => {
        await mlResource.input_analysis(mlmodel);
        await MLModel.update({ isPatch: true, id: mlmodel._id.toString(), updatedoc: { digifi_model_status: 'score_analysis' } });
      }));
    }
    input_running = false;
  }
}, 30000)
```

- 3.) The `mlResource.input_analysis` function will run a series of calculations to generate data that can be viewed in the `Input Analyis` section. After the `mlResource.input_analysis` function is complete, it will create an `inputanalysis mongo document` in the `inputanalyses` collection.  (E.g. a model with aws, sagemaker_ll, sagemaker_xgb, neural_network, decision_tree would have a total of 1 input analysis documents (2 for each)).
- Note: The input analysis function is run only once (AND ONLY DURING THE DIGIFI MODEL TRAINING PROCESS), and thus there is only one input analysis document for each mlmodel document that is trained.

- 4.) For the `DigiFi Score Analysis`, a training `score analysis document` and testing `score analysis document` is created for EACH ALGORITHM that is run for an `mlmodel document`. (E.g. a model with `aws`, `sagemaker_ll`, `sagemaker_xgb`, `neural_network`, `decision_tree` would have a total of 10 score analysis documents (2 for each)).
- 5.) The score analysis is run before the batch analysis phase in each of the cron processes for each algorithm. This is only done if `industry` exists.

As a final step, the overallModelUpdater runs to flip an `mlmodel` that has all of its respective algorithm statuses set to `complete` or `completed`. The cron for this is also in the `index.js` file of the `decision-engine-service` container as shown below:

```
setInterval(() => {
  mlcrons.overallModelUpdater();
}, 5000);
```

Once a model has it's overall `status` set to complete, it will be available for processing in a BRE strategy and the `ML Processing` section. Details on how processing works can be found in the [Machine Learning Processing Section](./processing.md).