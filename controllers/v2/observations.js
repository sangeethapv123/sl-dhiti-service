const config = require('../../config/config');
const rp = require('request-promise');
const request = require('request');
const model = require('../../db')
const helperFunc = require('../../helper/chart_data');
const pdfHandler = require('../../helper/common_handler');
var commonCassandraFunc = require('../../common/cassandra_func');
const authService = require('../../middleware/authentication_service');
const observationController = require('../v1/observations');
const url = require("url");
const omit = require('object.omit');

//Controller for entity solution report (cluster/block/zone/district)
exports.entitySolutionReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

      let responseData = await entitySolutionReportGeneration(req, res);
      res.send(responseData);
  
    })
  
  };
  
// Function for entity observation report generation 
async function entitySolutionReportGeneration(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      if (!req.body.entityId && !req.body.entityType && !req.body.solutionId) {
        var response = {
          result: false,
          message: 'entityId, entityType, immediateChildEntityType and solutionId are required fields'
        }
        resolve(response);
      }
  
      else {
        
        entityType = req.body.entityType;
        entityId = req.body.entityId;
        immediateChildEntityType = req.body.immediateChildEntityType;

        // Fetch query from cassandra
        model.MyModel.findOneAsync({ qid: "entity_solution_report_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            var bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }
            
            //Assign values to the query filter object 
            bodyParam.filter.fields[0].dimension = req.body.entityType;
            bodyParam.filter.fields[0].value = req.body.entityId;
            bodyParam.filter.fields[1].value = req.body.solutionId;

            if(req.body.reportType == "my"){
              let createdBy = await getCreatedByField(req,res); 
              let filter = {"type":"selector","dimension":"createdBy","value":createdBy}
              bodyParam.filter.fields.push(filter);
            }

            //Push column names dynamically to the query dimensions array 
            if (!req.body.immediateChildEntityType) {
            bodyParam.dimensions.push(entityType, entityType + "Name");
            }
            else if (req.body.immediateChildEntityType == "school") {
            bodyParam.dimensions.push(entityType, entityType + "Name", immediateChildEntityType, immediateChildEntityType + "Name");
            }
            else {
            bodyParam.dimensions.push(entityType, entityType + "Name", immediateChildEntityType, immediateChildEntityType + "Name", "school", "schoolName");
            }
  
            //pass the query as body param and get the result from druid
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);
  
            if (!data.length) {
              resolve({ "data": "No observations made for the entity" })
            }
            else {
              var responseObj = await helperFunc.entityReportChart(data,req.body.entityId,req.body.entityType)
              resolve(responseObj);
            }
          })
          .catch(function (err) {
            res.status(500);
            var response = {
              result: false,
              message: 'Data not found'
            }
            resolve(response);
          })
  
      }
  
    })
  
  }



//Function for entity solution report PDF generation
exports.entitySolutionReportPdfGeneration = async function (req, res) {

  return new Promise (async function (resolve,reject){

    var entityResponse = await entitySolutionReportGeneration(req, res);

    if (("solutionName" in entityResponse) == true) {

      let obj = {
        solutionName: entityResponse.solutionName
      }

      let resData = await pdfHandler.pdfGeneration(entityResponse, true, obj);
      let hostname = req.headers.host;

      var responseObject = {
        "status": "success",
        "message": "report generated",
        pdfUrl: "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
      }
      resolve(responseObject);
    }

    else {
      resolve(entityResponse);
    }
  });
  
};



//Controller for Entity Observation Score Report
exports.entityScoreReport = async function (req, res) {

    let data = await entityScoreReportGenerate(req, res);
  
    res.send(data);
  
  }
  
  async function entityScoreReportGenerate(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      if (!req.body.entityId && !req.body.observationId) {
        var response = {
          result: false,
          message: 'entityId and observationId are required fields'
        }
        resolve(response);
      }
  
      else {
  
        model.MyModel.findOneAsync({ qid: "entity_observation_score_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            var bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }
  
            bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
            bodyParam.filter.fields[1].fields[1].value = req.body.observationId;
  
            //pass the query as body param and get the resul from druid
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
  
            var data = await rp(options);
  
            if (!data.length) {
              resolve({ "data": "No observations made for the entity" })
            }
  
            else {
  
              var responseObj = await helperFunc.entityScoreReportChartObjectCreation(data,"v2")
              resolve(responseObj);
  
            }
          })
  
          .catch(function (err) {
            console.log(err);
            var response = {
              result: false,
              message: 'Data not found'
            }
            resolve(response);
          })
  
      }
  
    })
  
  }
  

  //Entity observation score pdf generation
  exports.entityObservationScorePdfFunc = async function (req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      var entityRes = await entityScoreReportGenerate(req, res);
  
      if (entityRes.result == true) {
  
        let obj = {
          schoolName: entityRes.schoolName,
          totalObservations: entityRes.totalObservations
        }
  
        let resData = await pdfHandler.instanceObservationScorePdfGeneration(entityRes, true, obj);
  
        let hostname = req.headers.host;
  
        resData.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
  
        resolve(resData);
      }
  
      else {
        resolve(entityRes);
      }
  
    });
  
  };
  


//Controller for listing solution Names
exports.listObservationSolutions = async function (req, res) {
    if (!req.body.entityId || !req.body.entityType) {
        res.status(400);
        var response = {
            result: false,
            message: 'entityId,entityType are required fields'
        }
        res.send(response);
    }
    else {

        let query;

        if (req.body.reportType == "my") {
            query = "list_my_solutions_query";
        } else {
            query = "list_observation_solutions_query";
        }

        //get query from cassandra
        model.MyModel.findOneAsync({ qid: query }, { allow_filtering: true })
            .then(async function (result) {

                var bodyParam = JSON.parse(result.query);

                if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                }

                if (req.body.reportType == "my") {
                    let createdBy = await getCreatedByField(req, res);
                    bodyParam.filter.fields[0].dimension = req.body.entityType;
                    bodyParam.filter.fields[0].value = req.body.entityId;
                    bodyParam.filter.fields[1].value = createdBy;
                }
                else {
                    bodyParam.filter.dimension = req.body.entityType;
                    bodyParam.filter.value = req.body.entityId;
                }

                //pass the query as body param and get the result from druid
                var options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);

                if (!data.length) {
                    res.send({ "result": false, "data": [] })
                }
                else {

                    //call the function listObservationNamesObjectCreate to create response object
                    var responseObj = await helperFunc.listSolutionNamesObjectCreate(data);
                    res.send({ "result": true, "data": responseObj });
                }
            })
            .catch(function (err) {
                res.status(500);
                var response = {
                    result: false,
                    message: 'Internal server error'
                }
                res.send(response);
            })
    }
}

  
// Function for getting createdBy field from header access token
async function getCreatedByField(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
        let token = await authService.validateToken(req, res);
  
        resolve(token.userId);
  
    })
}


//Controller function for observation score pdf reports
exports.observationScorePdfReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (req.body && req.body.entityId && req.body.observationId) {

            let resObj = await entityObservationScorePdfFunc(req, res);
            res.send(resObj);
        }
        else {
            res.send({
                status: "failure",
                message: "Invalid input"
            });
        }

    })
}


//=========================> Observation pdf API ===============

//Controller function for observation pdf reports
exports.pdfReports = async function (req, res) {

  return new Promise(async function (resolve, reject) {

     if (req.body.observationId && req.body.entityId) {

          let resObj = await entityObservationPdf(req, res);
          res.send(resObj);
      }
      else if (req.body.submissionId) {

          let resObj = await instancePdfReport(req, res);
          res.send(resObj);

      } 
      else if (req.body.observationId) {

          let resObj = await observationGenerateReport(req, res);
          res.send(resObj);

      }
      else if (req.body.entityId && req.body.entityType && req.body.solutionId) {

          let resObj = await entitySolutionReportPdfGeneration(req, res);
          res.send(resObj);
      }
      else if (req.body.entityId && req.body.entityType && req.body.solutionId && req.body.reportType) {

          let resObj = await entitySolutionReportPdfGeneration(req, res);
          res.send(resObj);
      }
      else {
          res.send({
              status: "failure",
              message: "Invalid input"
          });
      }
  })

}


//Funcion for instance observation pdf generation
async function instancePdfReport(req, res) {
  
  return new Promise(async function (resolve, reject) {

    let reqData = req.body;
    var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(reqData);

    if (dataReportIndexes && dataReportIndexes.downloadpdfpath) {

      dataReportIndexes.downloadpdfpath = dataReportIndexes.downloadpdfpath.replace(/^"(.*)"$/, '$1');
      let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);

      var response = {
        status: "success",
        message: 'Observation Pdf Generated successfully',
        pdfUrl: signedUlr
      };

      resolve(response);

    } else {

      var instaRes = await observationController.instanceObservationData(req, res);

      if (("observationName" in instaRes) == true) {
        let resData = await pdfHandler.instanceObservationPdfGeneration(instaRes);

        if (dataReportIndexes) {
          var reqOptions = {
            query: dataReportIndexes.id,
            downloadPath: resData.downloadPath
          }
          commonCassandraFunc.updateInstanceDownloadPath(reqOptions);
        } else {
          let dataInsert = commonCassandraFunc.insertReqAndResInCassandra(reqData, instaRes, resData.downloadPath);
        }

        // res.send(resData);
        resolve(omit(resData, 'downloadPath'));
      }

      else {
        resolve(instaRes);
      }
    }
  });
};



//Controller for entity observation pdf generation
async function entityObservationPdf(req, res) {
  
  return new Promise(async function (resolve, reject) {

    let responseData = await observationController.entityObservationData(req, res);

    if (("observationName" in responseData) == true) {

      let resData = await pdfHandler.pdfGeneration(responseData, true);

      if (resData.status && resData.status == "success") {

        var hostname = req.headers.host;
        var pathname = url.parse(req.url).pathname;

        console.log(pathname, "responseData", hostname);

        var obj = {
          status: "success",
          message: 'Observation Pdf Generated successfully',
          pdfUrl: "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
        }

        resolve(obj);

      } else {
        resolve(resData);
      }
    }
    else {
      resolve(responseData);
    }

  });
}

//Controller for observation pdf report
async function observationGenerateReport(req, res) {

  return new Promise(async function (resolve, reject) {

      let responseData = await observationController.observationReportData(req, res);

      if (("observationName" in responseData) == true) {

          let resData = await pdfHandler.pdfGeneration(responseData, true);

          if (resData.status && resData.status == "success") {
              var hostname = req.headers.host;
              var pathname = url.parse(req.url).pathname;
              console.log(pathname, "responseData", hostname);
              var obj = {
                  status: "success",
                  message: 'Observation Pdf Generated successfully',
                  pdfUrl: "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
              }

              resolve(obj);
          } else {
              resolve(resData);
          }
      }
      else {
          resolve(responseData);
      }


  });
}
