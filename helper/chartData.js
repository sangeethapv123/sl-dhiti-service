//function for instance observation final response creation
exports.instanceReportChart = async function (data) {
    var obj;
    var mutiSelectArray = []

    try {
        // obj is the response object which we are sending as a API response   
        obj = {
            entityName: data[0].event.entityName,
            observationName: data[0].event.observationName,
            observationId: data[0].event.observationId,
            entityType: data[0].event.entityType,
            entityId: data[0].event.entityId,
            response: []
        }

        await Promise.all(data.map(element => {
            // Response object creation for text type
            if (element.event.questionResponseType == "text") {
                var resp = {
                    question: element.event.questionName,
                    responseType: element.event.questionResponseType,
                    answers: [element.event.questionAnswer],
                    chart: {}
                }
                obj.response.push(resp);
            }
            // Response object creation for radio type
            else if (element.event.questionResponseType == "radio") {
                var resp = {
                    question: element.event.questionName,
                    responseType: element.event.questionResponseType,
                    answers: [],
                    chart: {
                        type: "pie",
                        data: [
                            {
                                data: [{
                                    name: element.event.questionResponseLabel,
                                    y: 100,
                                }]
                            }
                        ]
                    }
                }
                obj.response.push(resp);

            }
            // Response object creation for slider type
            else if (element.event.questionResponseType == "slider") {
                var resp = {
                    question: element.event.questionName,
                    responseType: element.event.questionResponseType,
                    answers: element.event.questionAnswer,
                    chart: {}
                }
                obj.response.push(resp);
            }

            // Response object creation for number type
            else if (element.event.questionResponseType == "number") {
                var resp = {
                    question: element.event.questionName,
                    responseType: element.event.questionResponseType,
                    answers: [element.event.questionAnswer],
                    chart: {}
                }
                obj.response.push(resp);
            }

            // Response object creation for date type
            else if (element.event.questionResponseType == "date") {
                var resp = {
                    question: element.event.questionName,
                    responseType: element.event.questionResponseType,
                    answers: [element.event.questionAnswer],
                    chart: {}
                }
                obj.response.push(resp);
            }
        }))

        //filter all the objects whose questionResponseType is multiselect
        await Promise.all(data.map(element => {
            if (element.event.questionResponseType == "multiselect") {
                mutiSelectArray.push(element)
            }
        }))
        
        //group the multiselect questions based on their questionName
        result = mutiSelectArray.reduce(function (r, a) {
            r[a.event.questionName] = r[a.event.questionName] || [];
            r[a.event.questionName].push(a);
            return r;
        }, Object.create(null));

        var res = Object.keys(result);

        //loop the keys and construct a response object for multiselect questions
        res.forEach(ele => {
            var multiSelectResp = instanceMultiselectFunc(result[ele])
            obj.response.push(multiSelectResp);

        })

        //return final response object
        return obj;
     }
    catch (err) {
        console.log(err);
    }
}


//Function to create a response object for multiselect question (Instance level Report)
async function instanceMultiselectFunc(data) {
    var dataArray = [];
    var labelArray = [];
    var valueArray = [];
    var question;
    var responseType;

    await Promise.all(data.map(element => {
        if (dataArray.includes(element.event.questionAnswer)) {
        } else {
            dataArray.push(element.event.questionAnswer);
        }
        if (labelArray.includes(element.event.questionResponseLabel)) {
        } else {
            labelArray.push(element.event.questionResponseLabel);
        }
        question = element.event.questionName;
        responseType = element.event.questionResponseType;
    }))

    for (j = 1; j <= dataArray.length; j++) {
        var k = 1;
        var value = (k / dataArray.length) * 100;
        value = value.toFixed(2);
        valueArray.push(value);
    }
    
    //response object for multiselect questions
    var resp = {
        question: question,
        responseType: responseType,
        answers: [],
        chart: {
            type: "bar",
            data: [
                {
                    data: valueArray
                }
            ],
            xAxis: {
                categories: labelArray,
                title: {
                    text: "Responses"
                }
            },
            yAxis: {
                title: {
                    text: "Responses in percentage"
                }
            }
        }
    }

    return resp;

}


//Function for entity Observation and observation report's final response creation
exports.entityReportChart = async function (data) {
    var obj;
    var mutiSelectArray = [];
    var textArray = [];
    var radioArray = [];
    var sliderArray = [];
    var numberArray = [];
    var dateArray = [];
    try {
        // obj is the response object which we are sending as a API response  
        if(data[0].event.entityId){ 

        obj = {
            entityName: data[0].event.entityName,
            observationName: data[0].event.observationName,
            observationId: data[0].event.observationId,
            entityType: data[0].event.entityType,
            entityId: data[0].event.entityId,
            response: []
        }
    }
    else {

        obj = {
            observationName: data[0].event.observationName,
            observationId: data[0].event.observationId,
            response: []
        }
    }

        //filter all the objects whose questionResponseType is multiselect
        // for (var i = 0; i < data.length; i++) {
        await Promise.all(data.map(element => {
            if (element.event.questionResponseType == "text") {
                textArray.push(element)
            }
            else if (element.event.questionResponseType == "radio") {
                radioArray.push(element)
            }
            else if (element.event.questionResponseType == "multiselect") {
                mutiSelectArray.push(element)
            }
            else if (element.event.questionResponseType == "slider") {
                sliderArray.push(element)
            }
            else if (element.event.questionResponseType == "number") {
                numberArray.push(element)
            }
            else if (element.event.questionResponseType == "date") {
                dateArray.push(element)
            }
        // }
        }))

        //group the text questions based on their questionName
        textResult = await groupArrayElements(textArray);

        //group the radio questions based on their questionName
        radioResult = await groupArrayElements(radioArray);

        //group the multiselect questions based on their questionName
        multiSelectResult = await groupArrayElements(mutiSelectArray)

        //group the slider questions based on their questionName
        sliderResult = await groupArrayElements(sliderArray);

        //group the number questions based on their questionName
        numberResult = await groupArrayElements(numberArray);
        
        //group the date questions based on their questionName
         dateResult = await groupArrayElements(dateArray);

        var textRes = Object.keys(textResult);
        //loop the keys and construct a response object for text questions
        textRes.forEach(ele => {
            var textResponse = responseObjectCreateFunc(textResult[ele])
            obj.response.push(textResponse);

        })

        var sliderRes = Object.keys(sliderResult);
        //loop the keys and construct a response object for slider questions
        sliderRes.forEach(ele => {
            var sliderResp = responseObjectCreateFunc(sliderResult[ele])
            obj.response.push(sliderResp);
        })

        var numberRes = Object.keys(numberResult);
        //loop the keys and construct a response object for slider questions
        numberRes.forEach(ele => {
            var numberResp = responseObjectCreateFunc(numberResult[ele])
            obj.response.push(numberResp);
        })
         
        var dateRes = Object.keys(dateResult);
        //loop the keys and construct a response object for slider questions
        dateRes.forEach(ele => {
            var dateResp = responseObjectCreateFunc(dateResult[ele])
            obj.response.push(dateResp);
        })

        var radioRes = Object.keys(radioResult);
        //loop the keys and construct a response object for slider questions
        radioRes.forEach(ele => {
            var radioResp = radioObjectCreateFunc(radioResult[ele])
            obj.response.push(radioResp);
        })

        var multiSelectRes = Object.keys(multiSelectResult);
        //loop the keys and construct a response object for multiselect questions
        multiSelectRes.forEach(ele => {
            var multiSelectResp = multiSelectObjectCreateFunc(multiSelectResult[ele])
            obj.response.push(multiSelectResp);
        })

        return obj;
    
  }
    catch (err) {
        console.log(err);
    }

}

// Function for grouping the array based on certain field name
function groupArrayElements (array){
    result = array.reduce(function (r, a) {
        r[a.event.questionName] = r[a.event.questionName] || [];
        r[a.event.questionName].push(a);
        return r;
    }, Object.create(null));

    return result;

}

//function to create response onject for text and slider questions (Entiry Report)
function responseObjectCreateFunc(data) {
    var dataArray = [];
    var question;
    var responseType;
    
    //loop the data and push answers to oe array
    for (i = 0; i < data.length; i++) {
        dataArray.push(data[i].event.questionAnswer);
        question = data[i].event.questionName;
        responseType = data[i].event.questionResponseType;
    }

    //response object
    var resp = {
        question: question,
        responseType: responseType,
        answers: dataArray,
        chart: {}
    }
    return resp;
}


//function to create response onject for radio questions (Entiry Report)
function radioObjectCreateFunc(data) {
    var dataArray = [];
    var labelArray = [];
    var chartdata = [];
    var question;
    var responseType;

    for (var i = 0; i < data.length; i++) {
        dataArray.push(data[i].event.questionAnswer);
        if (labelArray.includes(data[i].event.questionResponseLabel)) {
        } else {
            labelArray.push(data[i].event.questionResponseLabel);
        }

        question = data[i].event.questionName;
        responseType = data[i].event.questionResponseType;

    }

    var responseArray = count(dataArray)   //call count function to count occurences of elements in the array
    responseArray = Object.entries(responseArray);  //to convert object into array

    for (var j = 0; j < responseArray.length; j++) {
        var k = 0;
        var element = responseArray[j];
        var value = (element[k + 1] / dataArray.length) * 100;
        value = value.toFixed(2);
        var dataObj = {
            name: labelArray[j],
            y: value,
        }

        chartdata.push(dataObj);
    }

    var resp = {
        question: question,
        responseType: responseType,
        answers: [],
        chart: {
            type: "pie",
            data: [
                {
                    data: chartdata
                }
            ]
        }
    }

    return resp;
}

//function to create response onject for multiselect questions (Entiry Report)
function multiSelectObjectCreateFunc(data) {
    var dataArray = [];
    var labelArray = [];
    var chartdata = []

    //group the multiselect questions based on their observationSubmissionId
    multiSelectResult = data.reduce(function (r, a) {
        r[a.event.observationSubmissionId] = r[a.event.observationSubmissionId] || [];
        r[a.event.observationSubmissionId].push(a);
        return r;
    }, Object.create(null));

    var multiSelectRes = Object.keys(multiSelectResult);
    //loop the keys and construct a response object for multiselect questions
    multiSelectRes.forEach(ele => {
        var multiSelectResp = entityMultiselectGrouping(multiSelectResult[ele])
        dataArray.push(multiSelectResp[0]);
        labelArray.push(multiSelectResp[1]);
    })

    var dataMerged = [].concat.apply([], dataArray);   // to merger multiple arrays into single array
    var labelMerged = [].concat.apply([], labelArray);  // to merger multiple arrays into single array

    labelMerged = Array.from(new Set(labelMerged))  //remove duplicates from label array
    uniqueDataArray = Object.entries(count(dataMerged));

    for (var j = 0; j < uniqueDataArray.length; j++) {
        var k = 0;
        var element = uniqueDataArray[j];
        var value = (element[k + 1] / dataMerged.length) * 100;
        value = value.toFixed(2);
        chartdata.push(value);
    }

    var resp = {
        question: data[0].event.questionName,
        responseType: data[0].event.questionResponseType,
        answers: [],
        chart: {
            type: "bar",
            data: [
                {
                    data: chartdata
                }
            ],
            xAxis: {
                categories: labelMerged,
                title: {
                    text: "Responses"
                }
            },
            yAxis: {
                title: {
                    text: "Responses in percentage"
                }
            }
        }
    }

    return resp;

}

// to count the occurances of same elements in the array
function count(arr) {
    return arr.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {})
}

//Function to create data and label array for multiselect 
function entityMultiselectGrouping(data) {
    var dataArray = [];
    var labelArray = [];

    for (i = 0; i < data.length; i++) {
        if (dataArray.includes(data[i].event.questionAnswer)) {
        } else {
            dataArray.push(data[i].event.questionAnswer);
        }
        if (labelArray.includes(data[i].event.questionResponseLabel)) {
        } else {
            labelArray.push(data[i].event.questionResponseLabel);
        }
    }
    return [dataArray, labelArray];
}





//=========================================  assessment chart data ===============================================

exports.listProgramsObjectCreate = async function(data){
    try {
    var responseObj = []
    var dataArray = []

    for(var i=0;i<data.length;i++){
         dataArray.push(data[i].event);
    }
     
    // Function for grouping the array based on program Id
      result = dataArray.reduce(function (r, a) {
            r[a.programId] = r[a.programId] || [];
            r[a.programId].push(a);
            return r;
        }, Object.create(null));

        var res = Object.keys(result);

        //loop the keys 
        await Promise.all(res.map(async ele => {
            var programListResp = await programListRespObjCreate(result[ele])
            responseObj.push(programListResp);

        }));

      return responseObj;
    }
    catch(err){
        console.log(err);
    }
}

//Function to create program object and solution array  -- listPrograms API
async function programListRespObjCreate(data){
    try {
    var pgmObj = {
        programName: data[0].programName,
        programId: data[0].programId,
        programDescription: data[0].programDescription,
        programExternalId: data[0].programExternalId,
        solutions: []
    }

     await Promise.all(data.map(element => {
        var solutionObj = {
            solutionName : element.solutionName,
            solutionId : element.solutionId,
            solutionDescription: element.solutionDescription,
            solutionExternalId: element.solutionExternalId
        }

     pgmObj.solutions.push(solutionObj);
      }));

    return pgmObj;

 }
 catch(err){
     console.log(err);
 }
}


exports.entityAssessmentChart = async function (inputObj) {
    try {
    data = inputObj.data;
    childEntity = inputObj.childEntity;
    entityName = inputObj.entityName;
    levelCount = inputObj.levelCount;
    entityType = inputObj.entityType;

    var domainArray = [];
    var firstScoreArray =[];
    var secondScoreArray = [];
    var thirdScoreArray = [];
    var fourthScoreArray = [];
    var obj ={};

    //Store the domain Names in an array
    await Promise.all(data.map(async ele => {               
        if (domainArray.includes(ele.event[entityName])) {

        } else {
            domainArray.push(ele.event[entityName]);
        }
    }));
   
    //group the json objects based on entityName
    var res = await groupArrayByDomainName(data,entityName);

    var dt = Object.keys(res);
    await Promise.all(dt.map(element => {
        var l1 = "";
        var l2 = "";
        var l3 = "";
        var l4 = "";
        var foundL1 = res[element].some(function (el) {
            if (el.event.level === 'L1') {
                l1 = el;
                return el;
            } else {
                return false;
            }
        });

        var foundL2 = res[element].some(el => {
            if (el.event.level === 'L2') {
                l2 = el;
                return el;
            } else {
                return false;
            }
        });

        var foundL3 = res[element].some(el => {
            if (el.event.level === 'L3') {
                l3 = el;
                return el;
            } else {
                return false;
            }
        });

        var foundL4 = res[element].some(el => {
            if (el.event.level === 'L4') {
                l4 = el;
                return el;
            } else {
                return false;
            }
        })
        

        //if domainCount is found, then push the count, otherwise push 0 
        if (foundL1) {
            obj = {
                y: l1.event[levelCount],
                entityId: l1.event[childEntity]
            }
            firstScoreArray.push(obj);
        } else {
            obj = {
                y: 0,
                entityId: ""
            }
            firstScoreArray.push(obj);
        }
        if (foundL2) {
            obj = {
                y: l2.event[levelCount],
                entityId: l2.event[childEntity]
            }
            secondScoreArray.push(obj);
        } else {
            obj = {
                y: 0,
                entityId: ""
            }
            secondScoreArray.push(obj);
        }
        if (foundL3) {
            obj = {
                y: l3.event[levelCount],
                entityId: l3.event[childEntity]
            }
            thirdScoreArray.push(obj);
        } else {
            obj = {
                y: 0,
                entityId: ""
            }
            thirdScoreArray.push(obj);
        }
        if (foundL4) {
            obj = {
                y: l4.event[levelCount],
                entityId: l4.event[childEntity]
            }
            fourthScoreArray.push(obj);
        } else {
            obj = {
                y: 0,
                entityId: ""
            }
            fourthScoreArray.push(obj);
        }
    }));

      var titleName = "";
      var chartTitle = "";
      if(childEntity == ""){
          titleName = "School";
          chartTitle = "domain"
      }
      else{
          titleName = "Entity";
          chartTitle = "Entity"
      }

      var designation = await designationCreateFunction(entityType);

      var chartObj = {
        title: titleName + " Perfomance report for " + designation + " View",
        reportSections: [
            {
                order: 1,
                chart: {
                    type: "bar",
                    nextChildEntityType: childEntity,
                    stacking: "percent",
                    title: "Criteria vs level mapping aggregated at " + chartTitle + " level",
                    xAxis: {
                        categories: domainArray,
                        title: ""
                    },
                    yAxis: {
                        title: {
                            text: "Criteria"
                        }
                    },
                    data: [
                        {
                            name: "Level 1",
                            data: firstScoreArray
                        },
                        {
                            name: "Level 2",
                            data: secondScoreArray
                        },
                        {
                            name: "Level 3",
                            data: thirdScoreArray
                        },
                        {
                            name: "Level 4",
                            data: fourthScoreArray
                        }
                    ]
                }
            }
        ]
    }
// console.log(chartObj.reportSections[0].chart);
  return chartObj;
}
catch(err){
    console.log(err);
}
}



//Function for creating response object to show domainNames, criteria's and level's   -- expansion view entity assessment API
exports.entityTableViewFunc = async function(dataObj){
    try {
    var data = dataObj.entityData;
    var entityType = dataObj.entityType;
    var childType = dataObj.childEntityType;
    var result = await groupArrayByDomainName(data,childType);
    var res = Object.keys(result);
    
    var titleName;
    if(entityType == "school"){
        titleName = "school";
    }
    else{
        titleName = "Entity"
    }
    var designation = await designationCreateFunction(entityType);
    var tableObj = {
        order: 2,
        chart: {
            type: "expansion",
            title: "Descriptive view for " + designation + " for " + titleName + " performance",
            entities : []
        }
    }
    
    // wait till the final entity response object comes
    await Promise.all(res.map(async element => {
        var tableData = await tableDataCreateFunc(result[element],childType)
        tableObj.chart.entities.push(tableData);
    }));

    return tableObj;
    }
    catch(err){
        console.log(err);
    }

}

//create criteria array based on domainName
async function tableDataCreateFunc(data,entityType){
    try{
    var result = await groupArrayByDomainName(data,"domainName");
    var res = Object.keys(result);

    var chartdata = {
        entityName: data[0].event[entityType + "Name"],
        entityId: data[0].event[entityType],
        domains : []
     }

    // chartdata.domains = await domainLoopFunction(result,res)
    await Promise.all(res.map( async element => {
        var tableData = await domainCriteriaCreateFunc(result[element])
        chartdata.domains.push(tableData);
    }));

    return chartdata;
    }
    catch(err){
        console.log(err);
    }
}

//Function to create criteria array based on the domain Name -- expansion view of entity assessment API
async function domainCriteriaCreateFunc (data){
    try{
    var chartObj = {
        domainName: data[0].event.domainName,
        domainId: data[0].event.domainExternalId,
        criterias: []
    }

    await Promise.all(data.map(async ele => { 
        if (ele.event.childType == "criteria") {
            var obj = {
                name: ele.event.childName
            }
            if (ele.event.level == "L1") {
                obj.level = "Level 1"
            }
            else if (ele.event.level == "L2") {
                obj.level = "Level 2"
            }
            else if (ele.event.level == "L3") {
                obj.level = "Level 3"
            }
            else if (ele.event.level == "L4") {
                obj.level = "Level 4"
            }
            chartObj.criterias.push(obj);
        }

    }));
       return chartObj;
  }
 catch(err){
    console.log(err);
 }
}

// Function for grouping the array based on certain field name
function groupArrayByDomainName (array,name){
    result = array.reduce(function (r, a) {
        r[a.event[name]] = r[a.event[name]] || [];
        r[a.event[name]].push(a);
        return r;
    }, Object.create(null));

    return result;
}

//function to create the title
function designationCreateFunction(entityType){
    var value;
    if(entityType == "school"){
       value = "HM"
    }
    else if(entityType == "cluster"){
        value = "CRP"
    }
    else if(entityType == "zone"){
        value = "ZONE"
    }
    else if(entityType == "block"){
        value = "BEO"
    }
    else if(entityType == "district"){
        value = "DEO"
    }
    else if(entityType == "state"){
        value = "State"
    }
    else if(entityType == "hub"){
        value = "HUB"
    }

  return value;
}