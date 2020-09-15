const config = require('../../config/config');
const rp = require('request-promise');
const request = require('request');
const model = require('../../db');
const helperFunc = require('../../helper/chart_data');
const filesHelper = require('../../common/files_helper');

   /**
   * @api {get} /dhiti/api/v1/surveys/solutionReport?solutionId=:solutionId solution report
   * Survey solution report
   * @apiVersion 1.0.0
   * @apiGroup Surveys
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiSampleRequest /dhiti/api/v1/surveys/solutionReport?solutionId=5f58b0b8894a0928fc8aa9b3
   * @apiSuccessExample {json} Success-Response:
   * {  
   *   "solutionName" : "",
       "response": [{
         "order": "",
         "question": "",
         "responseType": "",
         "answers": [],
         "chart": {},
         "instanceQuestions":[],
         "evidences":[
              {"url":"", "extension":""}
          ]
       }]
   * }
   * @apiUse errorBody
   */

   exports.solutionReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (!req.query.solutionId) {

            let response = {
                result: false,
                message: 'solutionId is a required field'
            };

            res.send(response);

        } else {
            
            model.MyModel.findOneAsync({ qid: "survey_solutions_report_query" }, { allow_filtering: true })
                .then(async function (result) {

                    let bodyParam = JSON.parse(result.query);

                    if (config.druid.survey_datasource_name) {
                        bodyParam.dataSource = config.druid.survey_datasource_name;
                    }

                    bodyParam.filter.fields[0].value = req.query.solutionId;

                    //pass the query as body param and get the resul from druid
                    let options = config.druid.options;
                    options.method = "POST";
                    options.body = bodyParam;
                    let data = await rp(options);

                    if (!data.length) {

                        res.send({
                            result: false,
                            message: "SUBMISSIONS_NOT_FOUND"
                        });

                    } else {

                        let chartData = await helperFunc.entityReportChart
                        (  
                            data,
                            entityId="",
                            entityName="",
                            filesHelper.survey
                        );

                        //Get evidence data from evidence datasource
                        let evidenceData = await getEvidenceData
                        (
                            { solutionId: req.query.solutionId }
                        );

                        let responseObj;

                        if (evidenceData.result) {
                            responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                        } else {
                            responseObj = chartData;
                        }

                       res.send(responseObj);
                    }
                })
                .catch(function (err) {

                    let response = {
                        result: false,
                        message: 'INTERNAL_SERVER_ERROR'
                    };
                    res.send(response);
                });
            }
        });
    };



   /**
   * @api {get} /dhiti/api/v1/surveys/submissionReport?submissionId=:submissionId submission report
   * Survey submission report
   * @apiVersion 1.0.0
   * @apiGroup Surveys
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiSampleRequest /dhiti/api/v1/surveys/submissionReport?submissionId=5f58b0b8894a0928fc8aa9b3
   * @apiSuccessExample {json} Success-Response:
   * {
   *   "solutionName": "",
       "response": [{
         "order": "",
         "question": "",
         "responseType": "",
         "answers": [],
         "chart": {},
         "instanceQuestions":[],
         "evidences":[
              {"url":"", "extension":""}
          ]
       }]
   * }
   * @apiUse errorBody
   */

   exports.submissionReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (!req.query.submissionId) {

            let response = {
                result: false,
                message: 'submissionId is a required field'
            };
            res.send(response);

        } else {

            model.MyModel.findOneAsync({ qid: "survey_submission_report_query" }, { allow_filtering: true })
                .then(async function (result) {

                    let bodyParam = JSON.parse(result.query);

                    if (config.druid.survey_datasource_name) {
                        bodyParam.dataSource = config.druid.survey_datasource_name;
                    }

                    bodyParam.filter.fields[0].value = req.query.submissionId;

                    //pass the query as body param and get the resul from druid
                    let options = config.druid.options;
                    options.method = "POST";
                    options.body = bodyParam;
                    let data = await rp(options);

                    if (!data.length) {

                        res.send({
                            result: false,
                            message: "SUBMISSION_ID_NOT_FOUND"
                        });

                    } else {

                        let chartData = await helperFunc.instanceReportChart(data,filesHelper.survey);

                        //Get evidence data from evidence datasource
                        let evidenceData = await getEvidenceData(
                             { submissionId: req.query.submissionId }
                        );

                        let responseObj;

                        if (evidenceData.result) {
                            responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                        } else {
                            responseObj = chartData;
                        }

                        res.send(responseObj);
                    }
                })
                .catch(function (err) {

                    let response = {
                        result: false,
                        message: 'INTERNAL_SERVER_ERROR'
                    };
                    res.send(response);
                });
            }
        });
    };


    // Get the evidence data
    async function getEvidenceData(inputObj) {

    return new Promise(async function (resolve, reject) {

        model.MyModel.findOneAsync({ qid: "get_survey_evidence_query" }, { allow_filtering: true })
            .then(async function (result) {

                let bodyParam = JSON.parse(result.query);

                //based on the given input change the filter
                let filter = {};

                if (inputObj.submissionId) {
                    filter = { "type": "selector", "dimension": "surveySubmissionId", "value": inputObj.submissionId }
                } else if (inputObj.solutionId) {
                    filter = { "type": "selector", "dimension": "solutionId", "value": inputObj.solutionId }
                }

                if (config.druid.survey_evidence_datasource_name) {
                    bodyParam.dataSource = config.druid.survey_evidence_datasource_name;
                }

                bodyParam.filter = filter;

                //pass the query as body param and get the resul from druid
                let options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                let data = await rp(options);

                if (!data.length) {
                    resolve({
                        "result": false,
                        "message": "EVIDENCE_NOT_FOUND",
                        "data": []
                    });
                } else {
                    resolve({ "result": true, "data": data });
                }
            })
            .catch(function (err) {
                let response = {
                    result: false,
                    message: "Internal server error"
                };
                resolve(response);
            });
        })
    }




