google.charts.load('current', {'packages':['corechart', 'controls']});
google.charts.setOnLoadCallback(createDashboard);

//color blind friendly colors for the four severity levels
const sev1Color = '#0C7BDC';
const sev2Color = '#FFC20A';
const sev3Color = '#E66100';
const sev4Color = '#5D3A9B';

/*
    JSON objects for the column headers of each of the four google.visualization.DataTable
    that are generated
*/
//column names for the original data table
//make sure these match the csv file
const origColNames = {CourseID: 0, Teacher: 1, Semester: 2,
    AssignmentNo: 3, subjectID: 4, SubmissionNo: 5, SubmissionTime: 6, LinesOfCode: 7,
    severity: 8, Error: 15
}

let LOCcol = origColNames["LinesOfCode"];
//column names for the groupedData table
const groupColNames = {CourseID: origColNames["CourseID"], Teacher: origColNames["Teacher"], 
    Semester: origColNames["Semester"], AssignmentNo: origColNames["AssignmentNo"], 
    subjectID: origColNames["subjectID"], SubmissionNo: origColNames["SubmissionNo"], 
    SubmissionTime: origColNames["SubmissionTime"], LinesOfCode: origColNames["LinesOfCode"],
    Sev1: LOCcol + 1, Sev2: LOCcol + 2, Sev3: LOCcol + 3, Sev4: LOCcol + 4, TotalNum: LOCcol + 5, 
    Sev1kLOC: LOCcol + 6, Sev2kLOC: LOCcol + 7, Sev3kLOC: LOCcol + 8, Sev4kLOC: LOCcol + 9, 
    TotalkLOC: LOCcol + 10, stuckLevel: LOCcol + 11
}

//column names for the groupedClassData table
//first few up until Sev1 should be same as origColNames minus subjectId and SubmissionTime
//after sev1, all of those metrics are added within the script
const groupClassColNames = {CourseID: 0, Teacher: 1, Semester: 2,
    AssignmentNo: 3, SubmissionNo: 4, LinesOfCode: 5, Sev1: 6,
    Sev2: 7, Sev3: 8, Sev4: 9, TotalNum: 10, Sev1kLOC: 11,
    Sev2kLOC: 12, Sev3kLOC: 13, Sev4kLOC: 14, TotalkLOC: 15,
    "25thPercentile": 16, "50thPercentile": 17, "75thPercentile": 18, numStudents: 19, 
    stuckOnSev1: 20, stuckOnSev2: 21, stuckOnSev3: 22, stuckOnSev4: 23, avgStuckLevel: 24
}

//column names for the groupedClassDataByDate table
//first few up until Sev1 should be same as origColNames minus subjectId and SubmissionNo
//after sev1, all of those metrics are added within the script
const groupClassColNamesByDate = {CourseID: 0, Teacher: 1, Semester: 2,
    AssignmentNo: 3, SubmissionTime: 4, LinesOfCode: 5, Sev1: 6,
    Sev2: 7, Sev3: 8, Sev4: 9, TotalNum: 10, Sev1kLOC: 11,
    Sev2kLOC: 12, Sev3kLOC: 13, Sev4kLOC: 14, TotalkLOC: 15,
    "25thPercentile": 16, "50thPercentile": 17, "75thPercentile": 18, numStudents: 19, 
    stuckOnSev1: 20, stuckOnSev2: 21, stuckOnSev3: 22, stuckOnSev4: 23, avgStuckLevel: 24
}

//data variables representing the four different data tables formed in data generation (columns can be found above in JSON objects)
let groupedData = null; //data grouped by each submission
let groupedClassData = null; //data aggregated by each submission per class
let data = null; // original data, same as .csv file but in google.DataTable form
let groupedClassDataByDate = null; //data aggregated by class over time instead of submission number

/**
 * Creates dashboard and all charts associated with it
 * @param {google.visualization.DataTable} data - Google DataTable with all data to be visualized; 
 * same data/format as csv file
 * @param {String Array} userDetails - array with [projectName, viewerType, CRN, studentID]
 */
function createDashboard(data, userDetails) {
    if (!data || data.getNumberOfRows() == 0) return;

    const projectName = userDetails[0], viewerType = userDetails[1], 
        crnNum = userDetails[2], subjectID = userDetails[3];

    resetDashboards(viewerType);
    generateTitle("Loading...");

    /*
        Following section gathers all relevant data views of the data tables in order to generate the charts
    */
    //gets google.visualization.DataView for groupedData and groupedClassData with matching class and project
    let filterArr = [];
    filterArr.push({column: groupColNames["CourseID"], value: crnNum});
    filterArr.push({column: groupColNames["AssignmentNo"], value: projectName});
    let matchingClassAndProjectView = getDataView(groupedData, filterArr);
    let matchingGroupedClassAndProjectView = getDataView(groupedClassData, filterArr);
    let timeMatchingGroupedClassAndProjectView = getDataView(groupedClassDataByDate, filterArr);
    let origDataMatchingClassAndProjectView = getDataView(data, filterArr);

    //gets google.visualization.DataView for data with matching student and all projects
    filterArr = [];
    filterArr.push({column: groupColNames["subjectID"], value: subjectID});
    let matchingStudentView = getDataView(groupedData, filterArr);
    
    //gets google.visualization.DataView for groupedData with matching student and project
    filterArr = [];
    filterArr.push({column: groupColNames["AssignmentNo"], value: projectName});
    let matchingStudentAndProjectView = getDataView(matchingStudentView, filterArr);
    
    filterArr = [];
    filterArr.push({column: groupColNames["subjectID"], value: subjectID});
    filterArr.push({column: groupColNames["AssignmentNo"], value: projectName});
    let origDataMatchingStudentAndProjectView = getDataView(data, filterArr);
    
    //gets google.visualization.DataView for groupedClassData with matching class
    filterArr = [];
    filterArr.push({column: groupColNames["CourseID"], value: crnNum});
    let matchingGroupedClassView = getDataView(groupedClassData, filterArr);

    //calls all the build chart functions
    if (viewerType == "student") {
        generateTitle("Student View");
        let mostRecentSub = buildStudentSubTable(matchingStudentAndProjectView);
        buildProjCompChart(matchingStudentView, "s_projectcomp_div", groupColNames);
        buildStudentStackedAreaProgressChart(matchingStudentAndProjectView, origDataMatchingStudentAndProjectView, "s_area_chart");
        buildStudentStackedAreaProgressChart(matchingStudentAndProjectView, origDataMatchingStudentAndProjectView, "s_time_area_chart");
        buildClassStackedAreaChart(matchingGroupedClassAndProjectView, "s_area_chart_optional", origDataMatchingClassAndProjectView, mostRecentSub);
        buildClassTimeStackedAreaChart(timeMatchingGroupedClassAndProjectView, "s_area_chart_class_time", origDataMatchingClassAndProjectView);
        buildClassStuckAreaChart(matchingGroupedClassAndProjectView, matchingStudentAndProjectView, "s_class_stuck_chart", mostRecentSub);
        buildClassStuckAreaChart(timeMatchingGroupedClassAndProjectView, matchingStudentAndProjectView, "s_class_time_stuck_chart");
        buildTopXSevBarChart(matchingStudentAndProjectView, data);
        buildClassCompLineChart(matchingGroupedClassAndProjectView, matchingStudentAndProjectView, "s_classcomp_div", mostRecentSub);
        buildClassCompLineChart(timeMatchingGroupedClassAndProjectView, matchingStudentAndProjectView, "s_time_classcomp_div", mostRecentSub);
    }
    else if (viewerType == "teacher") {
        generateTitle("Teacher View");
        buildClassStackedAreaChart(matchingGroupedClassAndProjectView, "t_area_chart", origDataMatchingClassAndProjectView);
        buildClassStuckAreaChart(matchingGroupedClassAndProjectView, matchingStudentAndProjectView, "t_class_stuck_chart");
        buildClassStuckAreaChart(timeMatchingGroupedClassAndProjectView, matchingStudentAndProjectView, "t_class_time_stuck_chart");
        buildClassTimeStackedAreaChart(timeMatchingGroupedClassAndProjectView, "t_area_chart_class_time", origDataMatchingClassAndProjectView);
        buildTeacherClassCompLineChart(groupedClassData);
        buildProjCompChart(matchingGroupedClassView, "t_projectcomp_div", groupClassColNames);
        buildTeacherSubTable(matchingGroupedClassAndProjectView);
        buildBottom5StudChart(matchingClassAndProjectView, origDataMatchingClassAndProjectView);
        buildTeachTopXSevChart(origDataMatchingClassAndProjectView);
        buildBottom5StuckChart(matchingClassAndProjectView, origDataMatchingClassAndProjectView);
    }
}

/*************************            DATA GROUPING AND GENERATING SECTION                  *************************************/

/**
 * Parses .csv file using PapaParse
 * @param {*} evt - event from HTML file where we get the user details from its form
 */
function parseData(evt) {
    //get viewer info from form
    const projectName = evt.target[0].value;
    let viewerType = "";
    if (evt.target[4].checked) {
        viewerType = "student";
    } else if (evt.target[5].checked) {
        viewerType = "teacher";
    } else if (evt.target[6].checked) {
        viewerType = "administrator";
    }
    resetDashboards("none");
    generateTitle("Loading...");
    
    const className = evt.target[1].value;
    const studentId= evt.target[2].value;

    let viewerInfoArr = [projectName, viewerType, className, studentId];
    createDashboard(data, viewerInfoArr);
}

/**
 * Formats data to a Google DataTable and calls createDashboard when done
 * @param {*} newData  - data to be visualized; PapaParse parsed .csv file object
 * @param {String Array} inputArr - [projectName, viewerType, className, studentId]
 */
function formatData(newData, inputArr) {
    if (!newData) {
        //display no data found
    }
    else {
        //converts parsed data to google DataTable
        data = new google.visualization.DataTable();

        //add headers row
        let numColumns = 0;
        if (newData.meta.fields[0]) {
            numColumns = newData.meta.fields.length;
        }
        for (i = 0; i < numColumns; i++) {
            if (isColNumeric(i)) {
                data.addColumn('number', newData.meta.fields[i]);
            }
            else if (i == origColNames["SubmissionTime"]) {
                data.addColumn('date', newData.meta.fields[i]);
            }
            else {
                data.addColumn('string', newData.meta.fields[i]);
            }
        }

        //add data entries; conver to number if numeric column
        let arr = [];
        newData.data.forEach(entry => {
            let valuesArr = Object.values(entry);
            if (valuesArr.length == numColumns) {
                for (i = 0; i < numColumns; i++) {
                    if (isColNumeric(i)) {
                        valuesArr[i] = Number(valuesArr[i]);
                    }
                }
                arr.push(valuesArr);
            }
        });
        
        data.addRows(arr);
        createDashboard(data, inputArr);
    }
}

/**
 * Reads in the csv file and calls setData once it is loaded
 * @param {*} event 
 */
function generateData(event) {
    //parse .csv file
    let file = event.target.files[0];

    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = setData;
    reader.onerror = function() {
        alert('Unable to read ' + file.fileName);
    };
}

/**
 * Converts all data from csv file to google DataTable using papaparse
 * At the end, it generates the other aggregated data tables
 * @param {*} event 
 */
function setData(event) {
    let csvData = event.target.result;
    data = Papa.parse(csvData, {header : true});
    let dataTable = new google.visualization.DataTable();

    if (!data) {
        //display no data found
    }
    else {
        //converts parsed data to google DataTable
        
        //add headers row
        let numColumns = 0;
        if (data.meta.fields[0]) {
            numColumns = data.meta.fields.length;
        }
        for (i = 0; i < numColumns; i++) {
            if (isColNumeric(i)) {
                dataTable.addColumn('number', data.meta.fields[i]);
            }
            else if (i == origColNames["SubmissionTime"]) {
                dataTable.addColumn('date', data.meta.fields[i]);
            }
            else {
                dataTable.addColumn('string', data.meta.fields[i]);
            }
        }

        //add data entries; conver to number if numeric column
        let arr = [];
        data.data.forEach(entry => {
            let valuesArr = Object.values(entry);
            if (valuesArr.length == numColumns) {
                for (i = 0; i < numColumns; i++) {
                    if (isColNumeric(i)) {
                        valuesArr[i] = Number(valuesArr[i]);
                    }
                    else if (i == origColNames["SubmissionTime"]) {
                        //create date object for time column
                        let dateAndTimeArr = valuesArr[i].split(" ");
                        let dateArr = dateAndTimeArr[0].split("/");
                        let day = dateArr[1];
                        if (Number(day) < 10 && day.substring(0, 1) != "0") {
                            day = "0" + day;
                        }
                        let year = "20" + dateArr[2];
                        let month = dateArr[0];
                        let timeArr = dateAndTimeArr[1].split(":");
                        let hour = timeArr[0];
                        let minute = timeArr[1].substring(0, 2);
                        if (timeArr[1].substring(2) == "PM") {
                            hour = Number(hour) + 12;
                        }
                        valuesArr[i] = new Date(year, month, day, hour, minute);
                    }
                }
                arr.push(valuesArr);
            }
        });
        
        dataTable.addRows(arr);
    }
    data = dataTable;
    /*
        the groupedData DataTable groups all unique submissions into one row together with column names 
        that can be seen in the groupColNames JSON object

        the groupedClassData DataTable groups all submissions from one class from groupedData into one row
        together with column names that can be seen in the groupClassColNames JSON object
    */
    groupedData = groupDataBySubmission(data);
    groupedClassData = groupDataByClass(groupedData);
    groupedClassDataByDate = groupDataByClassAndDate(groupedData);
}

/**
 * Takes grouped data and groups every unique class submission together into one row and counts average of 
 * each severity as well as percentile
 * @param {gooogle.visualization.DataTable} groupedData - all data obtained from groupBySubmission() as a Google Data Table
 * 
 * Returns new google.visualization.DataTable with newly grouped data
 * For all columns, see groupClassColNames JSON object
 */
function groupDataByClass(groupedData) {
    /**
     * Creates new google.visualization.DataTable that takes the groupedData from above and groups
     * data from each class together according to their average
     */
    let filterCols = [groupColNames["CourseID"], groupColNames["Teacher"],
                  groupColNames["Semester"], groupColNames["AssignmentNo"],
                  groupColNames["SubmissionNo"]];
    let groupedClassData = google.visualization.data.group(
        groupedData,
        filterCols,
        [{'column': groupColNames["LinesOfCode"], 'label': "Average # Lines of Code", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev1"], 'label': "Severity 1 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev2"], 'label': "Severity 2 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev3"], 'label': "Severity 3 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev4"], 'label': "Severity 4 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["TotalNum"], 'label': "Total # Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev1kLOC"], 'label': "Severity 1 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev2kLOC"], 'label': "Severity 2 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev3kLOC"], 'label': "Severity 3 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev4kLOC"], 'label': "Severity 4 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["TotalkLOC"], 'label': "Total # Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["TotalkLOC"], 'label': "25th Percentile", 'aggregation': percentile25, 'type': 'number'},
        {'column': groupColNames["TotalkLOC"], 'label': "50th Percentile", 'aggregation': percentile50, 'type': 'number'},
        {'column': groupColNames["TotalkLOC"], 'label': "75th Percentile", 'aggregation': percentile75, 'type': 'number'},
        {'column': groupColNames["TotalkLOC"], 'label': "Number of Submissions", 'aggregation': google.visualization.data.count, 'type': 'number'},
        {'column': groupColNames["stuckLevel"], 'label': "# Stuck on Level 1", 'aggregation': countSev1, 'type': 'number'},
        {'column': groupColNames["stuckLevel"], 'label': "# Stuck on Level 2", 'aggregation': countSev2, 'type': 'number'},
        {'column': groupColNames["stuckLevel"], 'label': "# Stuck on Level 3", 'aggregation': countSev3, 'type': 'number'},
        {'column': groupColNames["stuckLevel"], 'label': "# Stuck on Level 4", 'aggregation': countSev4, 'type': 'number'},
        {'column': groupColNames["stuckLevel"], 'label': "Class Avg. Stuck Level", 'aggregation': google.visualization.data.avg, 'type': 'number'},
    ]
    );
    return groupedClassData;
}

/**
 * Takes grouped data and groups every unique class submission together into one row and counts average of 
 * each severity as well as percentile, disregards submission # and uses submission time instead, only factors in most 
 * recent submission at that current time
 * @param {gooogle.visualization.DataTable} groupedData - all data obtained from groupBySubmission() as a Google Data Table
 * 
 * Returns new google.visualization.DataTable with newly grouped data
 * For all columns, see groupClassColNamesByDate JSON object
 */
function groupDataByClassAndDate(groupedData) {
    /**
     * Creates new google.visualization.DataTable that takes the groupedData from above and groups
     * data from each class together according to their average
     */
    let filterCols = [groupColNames["CourseID"], groupColNames["Teacher"],
                  groupColNames["Semester"], groupColNames["AssignmentNo"],
                  groupColNames["subjectID"], groupColNames["SubmissionTime"]];

    let groupedClassDataByDate = google.visualization.data.group(
        groupedData,
        filterCols,
        [{'column': groupColNames["LinesOfCode"], 'label': "Average # Lines of Code", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev1"], 'label': "Severity 1 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev2"], 'label': "Severity 2 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev3"], 'label': "Severity 3 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev4"], 'label': "Severity 4 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["TotalNum"], 'label': "Total # Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev1kLOC"], 'label': "Severity 1 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev2kLOC"], 'label': "Severity 2 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev3kLOC"], 'label': "Severity 3 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["Sev4kLOC"], 'label': "Severity 4 Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["TotalkLOC"], 'label': "Total # Errors", 'aggregation': google.visualization.data.avg, 'type': 'number'},
        {'column': groupColNames["TotalkLOC"], 'label': "25th Percentile", 'aggregation': percentile25, 'type': 'number'},
        {'column': groupColNames["TotalkLOC"], 'label': "50th Percentile", 'aggregation': percentile50, 'type': 'number'},
        {'column': groupColNames["TotalkLOC"], 'label': "75th Percentile", 'aggregation': percentile75, 'type': 'number'},
        {'column': groupColNames["TotalkLOC"], 'label': "Number of Submissions", 'aggregation': google.visualization.data.count, 'type': 'number'},
        {'column': groupColNames["stuckLevel"], 'label': "# Stuck on Level 1", 'aggregation': countSev1, 'type': 'number'},
        {'column': groupColNames["stuckLevel"], 'label': "# Stuck on Level 2", 'aggregation': countSev2, 'type': 'number'},
        {'column': groupColNames["stuckLevel"], 'label': "# Stuck on Level 3", 'aggregation': countSev3, 'type': 'number'},
        {'column': groupColNames["stuckLevel"], 'label': "# Stuck on Level 4", 'aggregation': countSev4, 'type': 'number'},
        {'column': groupColNames["stuckLevel"], 'label': "Class Avg. Stuck Level", 'aggregation': google.visualization.data.avg, 'type': 'number'},
    ]
    );
    groupedClassDataByDate.sort([{column: 5}]); //sort based on date

    //get all unique class, semester, teacher, and project names combined into one
    let projNames = new Map();
    for (i = 0; i < groupedClassDataByDate.getNumberOfRows(); i++) {
        let projName = "";
        let filterCols = [];
        for (j = 0; j < 4; j++) {
            projName = projName + groupedClassDataByDate.getValue(i, j);
            filterCols.push({'column': j, 'value': groupedClassDataByDate.getValue(i, j)});
        }
        if (!projNames.get(projName)) {
            projNames.set(projName, getDataView(groupedClassDataByDate, filterCols));
        }
    }
    
    let finalDataArr = new google.visualization.DataTable();
    finalDataArr.addColumn('string', "CourseID");
    finalDataArr.addColumn('string', "Teacher");
    finalDataArr.addColumn('string', "Semester");
    finalDataArr.addColumn('string', "AssignmentNo");
    finalDataArr.addColumn('date', "SubmissionTime");
    finalDataArr.addColumn('number', "LinesOfCode");
    finalDataArr.addColumn('number', "Sev1");
    finalDataArr.addColumn('number', "Sev2");
    finalDataArr.addColumn('number', "Sev3");
    finalDataArr.addColumn('number', "Sev4");
    finalDataArr.addColumn('number', "TotalNum");
    finalDataArr.addColumn('number', "Sev1kLOC");
    finalDataArr.addColumn('number', "Sev2kLOC");
    finalDataArr.addColumn('number', "Sev3kLOC");
    finalDataArr.addColumn('number', "Sev4kLOC");
    finalDataArr.addColumn('number', "TotalkLOC");
    finalDataArr.addColumn('number', "25thPercentile");
    finalDataArr.addColumn('number', "50thPercentile");
    finalDataArr.addColumn('number', "75thPercentile");
    finalDataArr.addColumn('number', "numStudents");
    finalDataArr.addColumn('number', "stuckOnSev1");
    finalDataArr.addColumn('number', "stuckOnSev2");
    finalDataArr.addColumn('number', "stuckOnSev3");
    finalDataArr.addColumn('number', "stuckOnSev4");
    finalDataArr.addColumn('number', "avgStuckLevel");

    //following section aggregates the data based on the most recent submission
    let mapIter = projNames.values();
    //for each unique project
    for (i = 0; i < projNames.size; i++) {
        let dataArr = mapIter.next().value.toDataTable();
        let studentNames = new Map();
        //scan through all rows updating each row with the most recent submission data for all students
        for (j = 0; j < dataArr.getNumberOfRows(); j++) {
            let subjName = dataArr.getValue(j, groupColNames["subjectID"]);
            
            let row = [];
            for (k = 0; k < 6; k++) {
                if (k == 4) continue; //don't want to add subjectID to class data
                row.push(dataArr.getValue(j, k));
            }

            if (!studentNames.get(subjName)) {
                studentNames.set(subjName, 1);
            }
            else {
                studentNames.set(subjName, studentNames.get(subjName) + 1);
            }

            let iterStudNames = new Map();
            const iterator1 = studentNames.keys();
            for (m = 0; m < studentNames.size; m++) {
                iterStudNames.set(iterator1.next().value, 0);
            }

            //look through all rows and only count the student's most recent submissions
            for (k = 0; k <= j; k++) {
                let subjId = dataArr.getValue(k, groupColNames["subjectID"]);
                iterStudNames.set(subjId, iterStudNames.get(subjId) + 1)
                //we know it is most recent submission when iterStudNames matches studNames data
                if (iterStudNames.get(subjId) == studentNames.get(subjId)) {
                    let numCols = Object.keys(groupClassColNamesByDate).length;
                    //if first time entering data, just put it in
                    if (row[5] == null) {
                        for (x = 5; x < groupClassColNamesByDate["25thPercentile"]; x++) {
                            row.push(dataArr.getValue(k, x + 1));
                        }
                        for (x = groupClassColNamesByDate["25thPercentile"]; x < groupClassColNamesByDate["numStudents"]; x++) {
                            row.push([dataArr.getValue(k, x + 1)]);
                        }
                        row.push(studentNames.size);
                        for (x = groupClassColNamesByDate["stuckOnSev1"]; x < numCols; x++) {
                            row.push(dataArr.getValue(k, x + 1));
                        }
                    }
                    //else add to existing data
                    else {
                        for (x = 5; x < groupClassColNamesByDate["25thPercentile"]; x++) {
                            row[x] += dataArr.getValue(k, x + 1);
                        }
                        for (x = groupClassColNamesByDate["25thPercentile"]; x < groupClassColNamesByDate["numStudents"]; x++) {
                            row[x].push(dataArr.getValue(k, x + 1));
                        }
                        for (x = groupClassColNamesByDate["stuckOnSev1"]; x < numCols; x++) {
                            row[x] += dataArr.getValue(k, x + 1);
                        }
                    }
                }
            }

            //once everything is looked through, divide by numStudents for averages and calculate percentiles
            for (x = 5; x < groupClassColNamesByDate["25thPercentile"]; x++) {
                row[x] /= studentNames.size;
            }

            row[groupClassColNamesByDate["25thPercentile"]] = percentile25(row[groupClassColNamesByDate["25thPercentile"]]);
            row[groupClassColNamesByDate["50thPercentile"]] = percentile50(row[groupClassColNamesByDate["50thPercentile"]]);
            row[groupClassColNamesByDate["75thPercentile"]] = percentile75(row[groupClassColNamesByDate["75thPercentile"]]);
            row[groupClassColNamesByDate["avgStuckLevel"]] = row[groupClassColNamesByDate["avgStuckLevel"]] /= studentNames.size;
            finalDataArr.addRows([row]);
        }
    }

    return finalDataArr;
}

/**
 * Takes original data and groups every unique submission together into one row and counts number of 
 * each severity
 * @param {gooogle.visualization.DataTable} data - all data from the original CSV file as a Google Data Table
 * 
 * Returns new google.visualization.DataTable with newly grouped data
 */
function groupDataBySubmission(data) {
    /**
     * Creates new google.visualization.DataTable with data grouped by class, teacher, semester, assignment, 
     * student, and submission. Also, it tallies up number of each severity error in each group and stores 
     * that in additional columns. For all columns, see declared groupColNames JSON object.
     */
    let filterCols = [origColNames["CourseID"], origColNames["Teacher"],
                  origColNames["Semester"], origColNames["AssignmentNo"],
                  origColNames["subjectID"], origColNames["SubmissionNo"],
                  origColNames["SubmissionTime"], origColNames["LinesOfCode"]];

    let groupedData = google.visualization.data.group(
        data,
        filterCols,
        [{'column': origColNames["severity"], 'label': "Severity 1 Errors", 'aggregation': countSev1, 'type': 'number'},
        {'column': origColNames["severity"], 'label': "Severity 2 Errors", 'aggregation': countSev2, 'type': 'number'},
        {'column': origColNames["severity"], 'label': "Severity 3 Errors", 'aggregation': countSev3, 'type': 'number'},
        {'column': origColNames["severity"], 'label': "Severity 4 Errors", 'aggregation': countSev4, 'type': 'number'},
        {'column': origColNames["severity"], 'label': "Total # Errors", 'aggregation': google.visualization.data.count, 'type': 'number'},]
    );

    //Adds 5 columns that show error rate per 1000 lines of code
    groupedData.addColumn('number', "Severity 1 Errors / kLOC");
    groupedData.addColumn('number', "Severity 2 Errors / kLOC");
    groupedData.addColumn('number', "Severity 3 Errors / kLOC");
    groupedData.addColumn('number', "Severity 4 Errors / kLOC");
    groupedData.addColumn('number', "Total # Errors / kLOC");
    groupedData.addColumn('number', "Stuck Level");
    for (i = 0; i < groupedData.getNumberOfRows(); i++) {
        let loc = groupedData.getValue(i, groupColNames["LinesOfCode"]);
        let kLinesOfCode = loc / 1000;
        groupedData.setCell(i, groupColNames["Sev1kLOC"], groupedData.getValue(i, groupColNames["Sev1"]) / kLinesOfCode);
        groupedData.setCell(i, groupColNames["Sev2kLOC"], groupedData.getValue(i, groupColNames["Sev2"]) / kLinesOfCode);
        groupedData.setCell(i, groupColNames["Sev3kLOC"], groupedData.getValue(i, groupColNames["Sev3"]) / kLinesOfCode);
        groupedData.setCell(i, groupColNames["Sev4kLOC"], groupedData.getValue(i, groupColNames["Sev4"]) / kLinesOfCode);
        groupedData.setCell(i, groupColNames["TotalkLOC"], groupedData.getValue(i, groupColNames["TotalNum"]) / kLinesOfCode);
        
        let stuckLevel = 0;
        for (j = 1; j <= 4; j++) {
            if (groupedData.getValue(i, groupColNames["Sev1kLOC"] - 1 + j) > 0) {
                stuckLevel = j;
                break;
            }
        }
        groupedData.setCell(i, groupColNames["stuckLevel"], stuckLevel);
    }

    groupedData.sort([{column: groupColNames["SubmissionNo"]}]);
    return groupedData;
}

/*********************         CHART BUILDING FUNCTIONS                 *************************************/

/**
 * Build the bottom X Stuck Chart which shows students who have the worst stuck level
 * @param {*} matchingClassAndProjectView - groupedData with view set to filter matching class and project
 * @param {*} origDataMatchingClassAndProjectView - original data with matching class and project for tooltip
 */
function buildBottom5StuckChart(matchingClassAndProjectView, origDataMatchingClassAndProjectView) {
    if (matchingClassAndProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("BarChart", "t_bot5_div");
        return;
    }
    //build top 5 current students bar chart
    let dataArr = matchingClassAndProjectView.toDataTable();
    dataArr.sort([{column: groupColNames["stuckLevel"]}, {column: groupColNames["Sev1kLOC"], desc: true},
        {column: groupColNames["Sev2kLOC"], desc: true}, {column: groupColNames["Sev3kLOC"], desc: true}, 
        {column: groupColNames["Sev4kLOC"], desc: true}]);
    
    let numRows = dataArr.getNumberOfRows();
    if (numRows > 20) {
        numRows = 20;
    }
    let firstXRows = [];
    for (i = 0; i < numRows; i++) {
        firstXRows.push(i);
    }

    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });

    // For each row of primary data, draw a chart of its tooltip data.
    for (var i = 1; i <= dataArr.getNumberOfRows(); i++) {
        let filterArr = [];
        filterArr.push({column: groupColNames["SubmissionNo"], value: dataArr.getValue(i - 1, origColNames["SubmissionNo"])});
        filterArr.push({column: groupColNames["subjectID"], value: dataArr.getValue(i - 1, origColNames["subjectID"])});
        let toolTipRows = origDataMatchingClassAndProjectView.getFilteredRows(filterArr);
        let origDataRows = origDataMatchingClassAndProjectView.getViewRows();
        let rows = [];
        for (j = 0; j < toolTipRows.length; j++) {
            rows.push(origDataRows[toolTipRows[j]]);
        }

        let sev1Map = new Map();
        let sev2Map = new Map();
        let sev3Map = new Map();
        let sev4Map = new Map();
        rows.forEach(i => {
            const severity = data.getValue(i, origColNames["severity"]);
            const errorType = data.getValue(i, origColNames["Error"]);
            
            if (severity == 1) {
                const errorNum = sev1Map.get(errorType);
                if (!errorNum) {
                    sev1Map.set(errorType, 1);
                }
                else {
                    sev1Map.set(errorType, errorNum + 1);
                }
            } else if (severity == 2) {
                const errorNum = sev2Map.get(errorType);
                if (!errorNum) {
                    sev2Map.set(errorType, 1);
                }
                else {
                    sev2Map.set(errorType, errorNum + 1);
                }
    
            } else if (severity == 3) {
                const errorNum = sev3Map.get(errorType);
                if (!errorNum) {
                    sev3Map.set(errorType, 1);
                }
                else {
                    sev3Map.set(errorType, errorNum + 1);
                }
    
            } else if (severity == 4) {
                const errorNum = sev4Map.get(errorType);
                if (!errorNum) {
                    sev4Map.set(errorType, 1);
                }
                else {
                    sev4Map.set(errorType, errorNum + 1);
                }
            }
        });

        //for each map add map in decreasing order
        let sev1Arr = mapToSortedArray(sev1Map, sev1Color);
        let sev2Arr = mapToSortedArray(sev2Map, sev2Color);
        let sev3Arr = mapToSortedArray(sev3Map, sev3Color);
        let sev4Arr = mapToSortedArray(sev4Map, sev4Color);

        let dataArrNumCols = dataArr.getNumberOfColumns();
        let tooltipImg = getBot5ChartTooltipHTML(sev1Arr, 1, dataArr, i - 1, "grouped");
        // Add the new tooltip image to your data rows.
        dataArr.setValue(i - 1, dataArrNumCols - 4, tooltipImg);
        tooltipImg = getBot5ChartTooltipHTML(sev2Arr, 2, dataArr, i - 1, "grouped");
        dataArr.setValue(i - 1, dataArrNumCols - 3, tooltipImg);
        tooltipImg = getBot5ChartTooltipHTML(sev3Arr, 3, dataArr, i - 1, "grouped");
        dataArr.setValue(i - 1, dataArrNumCols - 2, tooltipImg);
        tooltipImg = getBot5ChartTooltipHTML(sev4Arr, 4, dataArr, i - 1, "grouped");
        dataArr.setValue(i - 1, dataArrNumCols - 1, tooltipImg);
    }

    let dataArrNumCols = dataArr.getNumberOfColumns();
    //build bottom 5 students bar chart
    let bot5StudentBarChart = new google.visualization.ChartWrapper({
        'chartType': 'BarChart',
        'containerId': 't_botXStuck_div',
        'dataTable': dataArr,
        'view': {rows: firstXRows, columns: [groupColNames["subjectID"], groupColNames["Sev4kLOC"], dataArrNumCols - 1,
            groupColNames["Sev3kLOC"], dataArrNumCols - 2, groupColNames["Sev2kLOC"], dataArrNumCols - 3, 
            groupColNames["Sev1kLOC"], dataArrNumCols - 4,
            { calc: "stringify", sourceColumn: groupColNames["stuckLevel"], type: "string", role: "annotation" }],},
            'options': {
                tooltip: {isHtml: true, showColorCode: true, ignoreBounds: true},
                'title': 'Current Bottom Students in Class by Stuck Level', 
                'colors': [sev4Color, sev3Color, sev2Color, sev1Color],
                titleTextStyle: {
                    fontSize: 18,
                    bold: true
                },
                'height': '100%',
                'width': '100%',
                isStacked: true,
                vAxis: {
                    title: 'Student ID'
                },
                hAxis: {
                    title: 'Number of Errors / kLOC'
                },
                legend: {
                    position: 'bottom'
                },
            }
    });
    bot5StudentBarChart.draw();
}

/**
 * Loads a chart that has either date or submission number on bottom x axis and number of submissions on y axis
 * Stacked chart with number of people stuck on each level making up the layers
 * @param {*} matchingGroupedClassAndProjectView - 
 * @param {*} matchingStudentAndProjectView 
 * @param {*} elementId - HTML id name to insert chart into
 * @param {*} mostRecentSub - most recent submission to cut off at for student view; if not entered, it loads all data
 */
function buildClassStuckAreaChart(matchingGroupedClassAndProjectView, matchingStudentAndProjectView, elementId, mostRecentSub) {
    if (matchingGroupedClassAndProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("AreaChart", elementId);
        return;
    }
    
    let dataArr = matchingGroupedClassAndProjectView.toDataTable();
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });

    let dataArrNumCols = dataArr.getNumberOfColumns();

    let studentDataArr = matchingStudentAndProjectView.toDataTable();
    // For each row of primary data, draw a chart of its tooltip data.
    if (elementId != "s_class_stuck_chart") {
        mostRecentSub = dataArr.getNumberOfRows();
    }
    for (var i = 1; i <= mostRecentSub; i++) {
        for (j = 1; j <= 4; j++) {
            let tooltip = "<div>";
            tooltip = tooltip + "<h4>Submission: " + matchingGroupedClassAndProjectView.getValue(i - 1, groupClassColNames["SubmissionNo"]) + "</h4><br>";
            tooltip = tooltip + "<h6># Class Submissions: " + matchingGroupedClassAndProjectView.getValue(i - 1,  groupClassColNames["numStudents"]).toFixed(0) + "</h6><br>";
            tooltip = tooltip + "<h6># Stuck on Level " + j + ": " + matchingGroupedClassAndProjectView.getValue(i - 1,  groupClassColNames["stuckOnSev" + j + ""]).toFixed(0) + "</h6><br>";
            tooltip = tooltip + "<h6>Avg. Class Stuck Level: " + matchingGroupedClassAndProjectView.getValue(i - 1,  groupClassColNames["avgStuckLevel"]).toFixed(2) + "</h6><br>";
            tooltip = tooltip + "<h6>Avg # Errors/kLOC for Level " + j + ": " + matchingGroupedClassAndProjectView.getValue(i - 1,  groupClassColNames["Sev" + j + "kLOC"]).toFixed(2) + "</h6><br>";
            if (elementId == "s_class_stuck_chart") {
                tooltip = tooltip + "<h6>Your Stuck Level: " + studentDataArr.getValue(i - 1,  groupColNames["stuckLevel"]).toFixed(0) + "</h6><br>";
                tooltip = tooltip + "<h6>Your # Errors/kLOC for Level " + j + ": " + studentDataArr.getValue(i - 1,  groupColNames["Sev" + j + "kLOC"]).toFixed(2) + "</h6><br>";
            }
            tooltip = tooltip + "</div";
            dataArr.setValue(i - 1, dataArrNumCols - j, tooltip);
        }
    }

    let rowsArr;
    if (elementId == "s_class_stuck_chart") {
        rowsArr = [];
        for (i = 0; i < mostRecentSub; i++) {
            rowsArr.push(i);
            
        }
    }
    else {
        rowsArr = [];
        for (i = 0; i < dataArr.getNumberOfRows(); i++) {
            rowsArr.push(i);
            
        }
    }
    let typeOfChart;
    if (elementId == "s_class_stuck_chart" || elementId == "t_class_stuck_chart") {
        typeOfChart = "ColumnChart";
        title = "# Student Submissions and Stuck Level by Subm #";
        xAxis = "Submission #";
    }
    else {
        typeOfChart = "AreaChart";
        title = "# Student Submissions and Stuck Level Over Time";
        xAxis = "Date";
    }
    let classStackedAreaChart = new google.visualization.ChartWrapper({
        'chartType': typeOfChart,
        'containerId': elementId,
        'dataTable': dataArr,
        'view': {rows : rowsArr,
            columns: [groupClassColNames["SubmissionNo"], groupClassColNames["stuckOnSev4"], dataArrNumCols - 4,
                groupClassColNames["stuckOnSev3"], dataArrNumCols - 3, groupClassColNames["stuckOnSev2"],
                dataArrNumCols - 2, groupClassColNames["stuckOnSev1"],dataArrNumCols - 1,]},
        'options': {
            tooltip: {isHtml: true, showColorCode: true, ignoreBounds: true}, 
            'title': title, 
            'colors': [sev4Color, sev3Color, sev2Color, sev1Color],
            'areaOpacity': 0.7,
            titleTextStyle: {
                fontSize: 11,
                bold: true
            },
            'height': '100%',
            'width': '100%',
            isStacked: true,
            vAxis: {
                title: 'Number of Submissions'
            },
            hAxis: {
                title: xAxis,
            },
            legend: {
                position: 'bottom'
            },
            chartArea: {
                bottom: '30%'
            }
        }
    }
    );
    classStackedAreaChart.draw();
}

/**
 * Builds a data table for when no data is entered
 * @param {*} chartType - type of chart to be displayed
 * @param {*} elementId - HTML id to insert chart at
 */
function buildErrorDataTable(chartType, elementId) {
    let errorTable = new google.visualization.DataTable();
    errorTable.addColumn('number', "Insufficient data");
    errorTable.addColumn('number', "");
    errorTable.addRows([[0, 0]]);
    let errorChart = new google.visualization.ChartWrapper({
        'chartType': chartType,
        'containerId': elementId,
        'dataTable':  errorTable,
        'options': {
            'title': 'Insufficient Data', 
            'height': '100%',
            'width': '100%',
            titleTextStyle: {
                fontSize: 14,
                bold: true
            },
        }
    });
    errorChart.draw();
}

/**
 * Builds the line chart that compares projects to other different projects
 * @param {*} matchingStudentView - groupedData view that is filtered by the matching student
 * @param {*} elementId - HTML id to enter chart at
 * @param {*} groupCol - one of the JSON Objects at top of file
 */
function buildProjCompChart(matchingStudentView, elementId, groupCol) {
        if (matchingStudentView.getNumberOfRows() == 0) {
            buildErrorDataTable("LineChart", elementId);
            return;
        }
        /*
            Generate data rows array in the form [[sub # 1, proj 1 total, tooltip, proj 2 total, ..], [sub # 2, .....]]
        */
       let projNames = new Map();
       let dataArr = [];
       for (i = 0; i < matchingStudentView.getNumberOfRows(); i++) {
           let tooltip = "<div>";
           let projName = matchingStudentView.getValue(i, groupCol["AssignmentNo"]);
           tooltip = tooltip + "<h4>" + projName + "</h4><br>";
           let projNameIndex = projNames.get(projName);
           if (!projNameIndex) {
               projNameIndex = projNames.size + 1;
               projNames.set(projName, projNameIndex);
           }
           let currSubNumber = matchingStudentView.getValue(i, groupCol["SubmissionNo"]);
           tooltip = tooltip + "<h6>Submission: " + currSubNumber + "</h6><br>";
           if (groupCol == groupClassColNames) {
                tooltip = tooltip + "<div><h6>Avg. Total # Errors: " + matchingStudentView.getValue(i, groupCol["TotalNum"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6># of Submissions: " + matchingStudentView.getValue(i, groupCol["numStudents"]).toFixed(0) + "</h6><br>";
                tooltip = tooltip + "<h6>Avg. Stuck Level: " + matchingStudentView.getValue(i, groupCol["avgStuckLevel"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6>Avg. Lines of Code: " + matchingStudentView.getValue(i, groupCol["LinesOfCode"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6>Avg. Sev 1 Errors/kLOC: " + matchingStudentView.getValue(i, groupCol["Sev1kLOC"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6>Avg. Sev 2 Errors/kLOC: " + matchingStudentView.getValue(i, groupCol["Sev2kLOC"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6>Avg. Sev 3 Errors/kLOC: " + matchingStudentView.getValue(i, groupCol["Sev3kLOC"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6>Avg. Sev 4 Errors/kLOC: " + matchingStudentView.getValue(i, groupCol["Sev4kLOC"]).toFixed(2) + "</h6><br>";
            }
           else if (groupCol == groupColNames) {
                tooltip = tooltip + "<div><h6>Total # Errors: " + matchingStudentView.getValue(i, groupCol["TotalNum"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6>Stuck Level: " + matchingStudentView.getValue(i, groupCol["stuckLevel"]).toFixed(0) + "</h6><br>";
                tooltip = tooltip + "<h6>Lines of Code: " + matchingStudentView.getValue(i, groupCol["LinesOfCode"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6>Sev 1 Errors/kLOC: " + matchingStudentView.getValue(i, groupCol["Sev1kLOC"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6>Sev 2 Errors/kLOC: " + matchingStudentView.getValue(i, groupCol["Sev2kLOC"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6>Sev 3 Errors/kLOC: " + matchingStudentView.getValue(i, groupCol["Sev3kLOC"]).toFixed(2) + "</h6><br>";
                tooltip = tooltip + "<h6>Sev 4 Errors/kLOC: " + matchingStudentView.getValue(i, groupCol["Sev4kLOC"]).toFixed(2) + "</h6><br>";

            }
           
           let errorFreq = matchingStudentView.getValue(i, groupCol["TotalkLOC"]);
           
           if (currSubNumber - 1 >= dataArr.length || !dataArr[currSubNumber - 1]) {
               dataArr[currSubNumber - 1] = [currSubNumber];
           }
           tooltip = tooltip + "</div>";
           dataArr[currSubNumber - 1][projNameIndex * 2 - 1] = errorFreq;
           dataArr[currSubNumber - 1][projNameIndex * 2] = tooltip;
       }
       //inserts nulls to make array "rectangular" in dimensions
       for (i = 0; i < dataArr.length; i++) {
            if (!dataArr[i]) {
                dataArr[i] = null;
                continue;
            }
            for (j = 0; j < projNames.size * 2 + 1; j++) {
                if (!dataArr[i][j]) {
                    dataArr[i][j] = null;
                }
            }
        }

       let projectCompData = new google.visualization.DataTable();
       projectCompData.addColumn('number', 'Submission #');
       let projNamesArr = Array.from(projNames.keys());
       projNamesArr.sort((a,b) => projNames.get(a) - projNames.get(b));
       for (i = 0; i < projNamesArr.length; i++) {
           projectCompData.addColumn('number', projNamesArr[i]);
           projectCompData.addColumn({
            type: 'string',
            label: 'Tooltip Chart',
            role: 'tooltip',
            'p': {'html': true}
        });
       }
       projectCompData.addRows(dataArr);

       let projectCompLineChart = new google.visualization.ChartWrapper({
           'chartType': 'LineChart',
           'containerId': elementId,
           'dataTable': projectCompData,
           'options': {
               tooltip: {isHtml: true, showColorCode: true, ignoreBounds: true}, 
               'title': 'Current Project vs Other Projects', 
               'height': '100%',
               'width': '100%',
               titleTextStyle: {
                   fontSize: 14,
                   bold: true
               },
               vAxis: {
                   title: 'Number of Errors / kLOC'
               },
               hAxis: {
                   title: 'Submission #'
               },
               legend: {
                   position: 'bottom'
               },
               chartArea: {
                bottom: '25%'
            }
           }
       });
       projectCompLineChart.draw();
}

/**
 * Builds the stacked area chart where the student's progress is seen by submission number
 * @param {*} matchingStudentProjectView - groupedData view with filters matching current student and project
 * @param {*} origDataMatchingStudentAndProjectView  - original data view with filters matching current student and project
 * @param {*} elementId - HTML id to enter chart at
 */
function buildStudentStackedAreaProgressChart(matchingStudentProjectView, origDataMatchingStudentAndProjectView, elementId) {
    
    if (matchingStudentProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("AreaChart", elementId);
        return;
    }
    let dataArr = matchingStudentProjectView.toDataTable();
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    if (elementId == "s_area_chart") {
        subCol = "SubmissionNo";
        title = "Current Project by Subm #";
        xAxis = "Submission #";
    }
    else {
        subCol = "SubmissionTime"
        title = "Current Project Over Time";
        xAxis = "Date";
    }
    // For each row of primary data, draw a chart of its tooltip data.
    for (var i = 1; i <= matchingStudentProjectView.getNumberOfRows(); i++) {
        let filterArr = [];
        let val = i;
        if (elementId == "s_time_area_chart") {
            val = matchingStudentProjectView.getValue(i - 1, groupColNames["SubmissionTime"]);
        }
        filterArr.push({column: groupColNames[subCol], value: val});
        let toolTipRows = origDataMatchingStudentAndProjectView.getFilteredRows(filterArr);
        let origDataRows = origDataMatchingStudentAndProjectView.getViewRows();
        let rows = [];
        for (j = 0; j < toolTipRows.length; j++) {
            rows.push(origDataRows[toolTipRows[j]]);
        }

        let sev1Map = new Map();
        let sev2Map = new Map();
        let sev3Map = new Map();
        let sev4Map = new Map();
        
        rows.forEach(i => {
            const severity = data.getValue(i, origColNames["severity"]);
            const errorType = data.getValue(i, origColNames["Error"]);
            
            if (severity == 1) {
                const errorNum = sev1Map.get(errorType);
                if (!errorNum) {
                    sev1Map.set(errorType, 1);
                }
                else {
                    sev1Map.set(errorType, errorNum + 1);
                }
            } else if (severity == 2) {
                const errorNum = sev2Map.get(errorType);
                if (!errorNum) {
                    sev2Map.set(errorType, 1);
                }
                else {
                    sev2Map.set(errorType, errorNum + 1);
                }
    
            } else if (severity == 3) {
                const errorNum = sev3Map.get(errorType);
                if (!errorNum) {
                    sev3Map.set(errorType, 1);
                }
                else {
                    sev3Map.set(errorType, errorNum + 1);
                }
    
            } else if (severity == 4) {
                const errorNum = sev4Map.get(errorType);
                if (!errorNum) {
                    sev4Map.set(errorType, 1);
                }
                else {
                    sev4Map.set(errorType, errorNum + 1);
                }
            }
        });

        //for each map add map in decreasing order
        let sev1Arr = mapToSortedArray(sev1Map, sev1Color);
        let sev2Arr = mapToSortedArray(sev2Map, sev2Color);
        let sev3Arr = mapToSortedArray(sev3Map, sev3Color);
        let sev4Arr = mapToSortedArray(sev4Map, sev4Color);


        let tooltipImg = getAreaChartTooltipHTML(sev1Arr, 1, dataArr, i, "groupedTime");
        let dataArrNumCols = dataArr.getNumberOfColumns();
        // Add the new tooltip image to your data rows.
        dataArr.setValue(i - 1, dataArrNumCols - 4, tooltipImg);
        tooltipImg = getAreaChartTooltipHTML(sev2Arr, 2, dataArr, i, "groupedTime");
        dataArr.setValue(i - 1, dataArrNumCols - 3, tooltipImg);
        tooltipImg = getAreaChartTooltipHTML(sev3Arr, 3, dataArr, i, "groupedTime");
        dataArr.setValue(i - 1, dataArrNumCols - 2, tooltipImg);
        tooltipImg = getAreaChartTooltipHTML(sev4Arr, 4, dataArr, i, "groupedTime");
        dataArr.setValue(i - 1, dataArrNumCols - 1, tooltipImg);
    }
    let dataArrNumCols = dataArr.getNumberOfColumns();
    

    let stackedAreaChart = new google.visualization.ChartWrapper({
        'chartType': 'AreaChart',
        'containerId': elementId,
        'dataTable': dataArr,
        'view': {columns: [groupColNames[subCol], groupColNames["Sev4kLOC"], dataArrNumCols - 1, 
                groupColNames["Sev3kLOC"], dataArrNumCols - 2, groupColNames["Sev2kLOC"], dataArrNumCols - 3, 
                groupColNames["Sev1kLOC"], dataArrNumCols - 4,]},
        'options': {
            isStacked: true,
            tooltip: {isHtml: true, showColorCode: true, ignoreBounds: true}, 
            'title': title, 
            'areaOpacity': 0.7,
            titleTextStyle: {
                fontSize: 18,
                bold: true
            },
            'colors': [sev4Color, sev3Color, sev2Color, sev1Color],
            'height': '100%',
            'width': '500px',
            vAxis: {
                title: 'Number of Errors / kLOC'
            },
            hAxis: {
                title: xAxis,
            },
            legend: {
                position: 'bottom'
            },
            chartArea: {
                bottom: '25%'
            }
        }
    });
    stackedAreaChart.draw();
}

/**
 * Builds stacked area chart that displays class progress over time
 * @param {*} matchingGroupedClassAndProjectView - groupedClassByDate data view with matching class and project
 * @param {*} elementId - HTML id to enter chart at
 * @param {*} origDataMatchingClassAndProjectView - original data view with matching class and project filters
 */
function buildClassTimeStackedAreaChart(matchingGroupedClassAndProjectView, elementId, origDataMatchingClassAndProjectView) {
    if (matchingGroupedClassAndProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("AreaChart", elementId);
        return;
    }
    
    let dataArr = matchingGroupedClassAndProjectView.toDataTable();
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    
    // For each row of primary data, draw a chart of its tooltip data.
    for (var i = 1; i <= matchingGroupedClassAndProjectView.getNumberOfRows(); i++) {
        let dataArrNumCols = dataArr.getNumberOfColumns();

        let sev1Arr = [];
        let sev2Arr = [];
        let sev3Arr = [];
        let sev4Arr = [];
        
        let tooltipImg = getAreaChartTooltipHTML(sev1Arr, 1, dataArr, i, "groupedClass");
        // Add the new tooltip image to your data rows.
        dataArr.setValue(i - 1, dataArrNumCols - 4, tooltipImg);
        tooltipImg = getAreaChartTooltipHTML(sev2Arr, 2, dataArr, i, "groupedClass");
        dataArr.setValue(i - 1, dataArrNumCols - 3, tooltipImg);
        tooltipImg = getAreaChartTooltipHTML(sev3Arr, 3, dataArr, i, "groupedClass");
        dataArr.setValue(i - 1, dataArrNumCols - 2, tooltipImg);
        tooltipImg = getAreaChartTooltipHTML(sev4Arr, 4, dataArr, i, "groupedClass");
        dataArr.setValue(i - 1, dataArrNumCols - 1, tooltipImg);
    }
    
    let dataArrNumCols = dataArr.getNumberOfColumns();    
    let classStackedAreaChart = new google.visualization.ChartWrapper({
        'chartType': 'AreaChart',
        'containerId': elementId,
        'dataTable': dataArr,
        'view': {columns: [groupClassColNamesByDate["SubmissionTime"], groupClassColNames["Sev4kLOC"], dataArrNumCols - 1,
                groupClassColNames["Sev3kLOC"], dataArrNumCols - 2, groupClassColNames["Sev2kLOC"],
                dataArrNumCols - 3, groupClassColNames["Sev1kLOC"],dataArrNumCols - 4,]},
        'options': {
            tooltip: {isHtml: true, showColorCode: true, ignoreBounds: true}, 
            'title': 'Class Progress Over Time', 
            'colors': [sev4Color, sev3Color, sev2Color, sev1Color],
            'areaOpacity': 0.7,
            titleTextStyle: {
                fontSize: 18,
                bold: true
            },
            'height': '100%',
            'width': '100%',
            isStacked: true,
            vAxis: {
                title: 'Number of Errors / kLOC'
            },
            hAxis: {
                title: 'Date'
            },
            legend: {
                position: 'bottom'
            },
            chartArea: {
                bottom: '25%'
            }

        }
    });
    classStackedAreaChart.draw();
}

/**
 * Build class stacked area chart by submission number
 * @param {*} matchingGroupedClassAndProjectView - groupedClassData view with matching class and project
 * @param {*} elementId - HTML id to enter chart at
 * @param {*} origDataMatchingClassAndProjectView - original data view with matching class and project
 * @param {*} mostRecentSub - most recent submission number to cut off at; if not there, displays all data
 */
function buildClassStackedAreaChart(matchingGroupedClassAndProjectView, elementId, origDataMatchingClassAndProjectView, mostRecentSub) {
    if (matchingGroupedClassAndProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("AreaChart", elementId);
        return;
    }
    
    let dataArr = matchingGroupedClassAndProjectView.toDataTable();
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });

    // For each row of primary data, draw a chart of its tooltip data.
    for (var i = 1; i <= matchingGroupedClassAndProjectView.getNumberOfRows(); i++) {
        let filterArr = [];
        filterArr.push({column: groupColNames["SubmissionNo"], value: i});
        let toolTipRows = origDataMatchingClassAndProjectView.getFilteredRows(filterArr);
        let origDataRows = origDataMatchingClassAndProjectView.getViewRows();
        let rows = [];
        for (j = 0; j < toolTipRows.length; j++) {
            rows.push(origDataRows[toolTipRows[j]]);
        }

        let sev1Map = new Map();
        let sev2Map = new Map();
        let sev3Map = new Map();
        let sev4Map = new Map();
        rows.forEach(i => {
            const severity = data.getValue(i, origColNames["severity"]);
            const errorType = data.getValue(i, origColNames["Error"]);
            
            if (severity == 1) {
                const errorNum = sev1Map.get(errorType);
                if (!errorNum) {
                    sev1Map.set(errorType, 1);
                }
                else {
                    sev1Map.set(errorType, errorNum + 1);
                }
            } else if (severity == 2) {
                const errorNum = sev2Map.get(errorType);
                if (!errorNum) {
                    sev2Map.set(errorType, 1);
                }
                else {
                    sev2Map.set(errorType, errorNum + 1);
                }
    
            } else if (severity == 3) {
                const errorNum = sev3Map.get(errorType);
                if (!errorNum) {
                    sev3Map.set(errorType, 1);
                }
                else {
                    sev3Map.set(errorType, errorNum + 1);
                }
    
            } else if (severity == 4) {
                const errorNum = sev4Map.get(errorType);
                if (!errorNum) {
                    sev4Map.set(errorType, 1);
                }
                else {
                    sev4Map.set(errorType, errorNum + 1);
                }
            }
        });
        let dataArrNumCols = dataArr.getNumberOfColumns();
        
        //for each map add map in decreasing order
        let sev1Arr = mapToSortedArray(sev1Map, sev1Color);
        let sev2Arr = mapToSortedArray(sev2Map, sev2Color);
        let sev3Arr = mapToSortedArray(sev3Map, sev3Color);
        let sev4Arr = mapToSortedArray(sev4Map, sev4Color);

        let tooltipImg = getAreaChartTooltipHTML(sev1Arr, 1, dataArr, i, "groupedClass");
        // Add the new tooltip image to your data rows.
        dataArr.setValue(i - 1, dataArrNumCols - 4, tooltipImg);
        tooltipImg = getAreaChartTooltipHTML(sev2Arr, 2, dataArr, i, "groupedClass");
        dataArr.setValue(i - 1, dataArrNumCols - 3, tooltipImg);
        tooltipImg = getAreaChartTooltipHTML(sev3Arr, 3, dataArr, i, "groupedClass");
        dataArr.setValue(i - 1, dataArrNumCols - 2, tooltipImg);
        tooltipImg = getAreaChartTooltipHTML(sev4Arr, 4, dataArr, i, "groupedClass");
        dataArr.setValue(i - 1, dataArrNumCols - 1, tooltipImg);
    }

    let rowsArr;
    if (elementId == "s_area_chart_optional") {
        rowsArr = [];
        for (i = 0; i < mostRecentSub; i++) {
            rowsArr.push(i);
        }
    }
    else {
        rowsArr = [];
        for (i = 0; i < dataArr.getNumberOfRows(); i++) {
            rowsArr.push(i);
        }
    }

    let dataArrNumCols = dataArr.getNumberOfColumns();    
    let classStackedAreaChart = new google.visualization.ChartWrapper({
        'chartType': 'AreaChart',
        'containerId': elementId,
        'dataTable': dataArr,
        'view': {rows : rowsArr,
            columns: [groupClassColNames["SubmissionNo"], groupClassColNames["Sev4kLOC"], dataArrNumCols - 1,
                groupClassColNames["Sev3kLOC"], dataArrNumCols - 2, groupClassColNames["Sev2kLOC"],
                dataArrNumCols - 3, groupClassColNames["Sev1kLOC"],dataArrNumCols - 4,]},
        'options': {
            tooltip: {isHtml: true, showColorCode: true, ignoreBounds: true}, 
            'title': 'Class Progress By Submission #', 
            'colors': [sev4Color, sev3Color, sev2Color, sev1Color],
            'areaOpacity': 0.7,
            titleTextStyle: {
                fontSize: 18,
                bold: true
            },
            'height': '100%',
            'width': '100%',
            isStacked: true,
            vAxis: {
                title: 'Number of Errors / kLOC'
            },
            hAxis: {
                title: 'Submission #'
            },
            legend: {
                position: 'bottom'
            },
            chartArea: {
                bottom: '25%'
            }

        }
    });
    classStackedAreaChart.draw();
}

/**
 * Builds the student submission table
 * @param {*} matchingStudentProjectView - groupedData view with matching student and project 
 */
function buildStudentSubTable(matchingStudentProjectView) {
    if (matchingStudentProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("Table", "s_chart2_div");
        return 0;
    }
    //build latest submission table
    const numRows = matchingStudentProjectView.getNumberOfRows() - 1;
    let lastSubDataTable = new google.visualization.ChartWrapper({
        'chartType': 'Table',
        'containerId': 's_chart2_div',
        'dataTable': matchingStudentProjectView,
        'view': {rows: matchingStudentProjectView.getSortedRows({column: groupColNames["SubmissionNo"], desc: true}),
             columns: [5,6,7,8,9,10,11, groupColNames["stuckLevel"]]},
        'options': {
            'title': 'Most Recent Submission Results', 
            titleTextStyle: {
                fontSize: 18,
                bold: true
            },
            'height': '100%',
            'width': '100%'
        }
    });
    lastSubDataTable.draw();
    return numRows + 1;
}

/**
 * Builds bar chart that shows error frequencys by severity
 * @param {*} matchingStudentProjectView - data view with error submissions to display
 * @param {*} data - original google.DataTable with csv file data
 */
function buildTopXSevBarChart(matchingStudentProjectView, data) {
    if (matchingStudentProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("BarChart", "s_topXSev_div");
        return;
    }
    //build top X by severity bar chart
    let lastSubFilters = [];
    const numRows = matchingStudentProjectView.getNumberOfRows() - 1;
    for (i = 5; i >= 0; i--) {
        lastSubFilters.push({column: i, value: matchingStudentProjectView.getValue(numRows, i)});
    }
    let dataView = getDataView(data, lastSubFilters);

    let sev1Map = new Map();
    let sev2Map = new Map();
    let sev3Map = new Map();
    let sev4Map = new Map();
    dataView.getViewRows().forEach(i => {
        const severity = data.getValue(i, origColNames["severity"]);
        const errorType = data.getValue(i, origColNames["Error"]);
        
        if (severity == 1) {
            const errorNum = sev1Map.get(errorType);
            if (!errorNum) {
                sev1Map.set(errorType, 1);
            }
            else {
                sev1Map.set(errorType, errorNum + 1);
            }
        } else if (severity == 2) {
            const errorNum = sev2Map.get(errorType);
            if (!errorNum) {
                sev2Map.set(errorType, 1);
            }
            else {
                sev2Map.set(errorType, errorNum + 1);
            }

        } else if (severity == 3) {
            const errorNum = sev3Map.get(errorType);
            if (!errorNum) {
                sev3Map.set(errorType, 1);
            }
            else {
                sev3Map.set(errorType, errorNum + 1);
            }

        } else if (severity == 4) {
            const errorNum = sev4Map.get(errorType);
            if (!errorNum) {
                sev4Map.set(errorType, 1);
            }
            else {
                sev4Map.set(errorType, errorNum + 1);
            }
        }
    });

    let currErrorData = new google.visualization.DataTable();
    currErrorData.addColumn('string', 'error name');
    currErrorData.addColumn('number', 'frequency');
    currErrorData.addColumn({role: 'style'});

    //for each map add map in decreasing order
    currErrorData.addRows(mapToSortedArray(sev1Map, sev1Color));
    currErrorData.addRows(mapToSortedArray(sev2Map, sev2Color));
    currErrorData.addRows(mapToSortedArray(sev3Map, sev3Color));
    currErrorData.addRows(mapToSortedArray(sev4Map, sev4Color));


    let topXSevChart = new google.visualization.ChartWrapper({
        'chartType': 'BarChart',
        'containerId': 's_topXSev_div',
        'dataTable': currErrorData,
        'view' : [{columns: [0,1,2, { calc: "stringify",
        sourceColumn: 1,
        type: "string",
        role: "annotation" }]}],
        'options': {
            'title': 'Errors in Most Recent Submission by Severity', 
            titleTextStyle: {
                fontSize: 18,
                bold: true
            },
            'width': '100%',
            'height': '100%',
            vAxis: {
                title: 'Error Name (Most Severe at Top)'
            },
            hAxis: {
                title: 'Frequency'
            },
            legend: {
                position: 'none'
            },
            chartArea: {
                left: '45%'
            }
        }
    });
    topXSevChart.draw();
}

/**
 * Builds class comparison line chart
 * @param {*} matchingGroupedClassAndProjectView - groupedClassData view wiith matching class and project
 * @param {*} matchingStudentProjectView - groupedData view with matching student and project filters
 * @param {*} elementId -HTML id to enter chart at
 * @param {*} mostRecentSub - most recent sub number to cut off at; displays all if not entered
 */
function buildClassCompLineChart(matchingGroupedClassAndProjectView, matchingStudentProjectView, elementId, mostRecentSub) {
    if (matchingGroupedClassAndProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("LineChart", elementId);
        return;
    }
    let subCol;
    if (elementId == "s_classcomp_div") {
        subCol = "SubmissionNo";
        xAxis = "Submission #";
    }
    else {
        subCol = "SubmissionTime";
        xAxis = "Date";
    }
    let classPercentileData = google.visualization.data.join(
        matchingGroupedClassAndProjectView, 
        matchingStudentProjectView, 'full', [[groupClassColNames["SubmissionNo"], groupColNames[subCol]]], 
            [groupClassColNames["25thPercentile"], groupClassColNames["50thPercentile"], 
            groupClassColNames["75thPercentile"], groupClassColNames["LinesOfCode"]], [groupColNames["TotalkLOC"]]);
    
    let currNumErrors = null;
    for (i = 0; i < classPercentileData.getNumberOfRows(); i++) {
        if (classPercentileData.getValue(i, 5) != null) {
            currNumErrors = classPercentileData.getValue(i, 5);
        }
        else {
            classPercentileData.setValue(i, 5, currNumErrors);
        }
    }
    let numCols = classPercentileData.getNumberOfColumns();
    
    classPercentileData.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    for (i = 0; i < classPercentileData.getNumberOfRows(); i++) {
        let tooltip = "<div>";
        tooltip = tooltip + "<h4>Submission: " + classPercentileData.getValue(i, 0) + "</h4><br>";
        if (classPercentileData.getValue(i, 5) == null) {
            tooltip = tooltip + "<h6>Total # Errors/kLOC in Your Project: N/A" + "</h6><br>";
        }
        else {
            tooltip = tooltip + "<h6>Total # Errors/kLOC in Your Project: " + classPercentileData.getValue(i, 5).toFixed(2) + "</h6><br>";
        }
        tooltip = tooltip + "<h6>Class 75th Percentile Errors/kLOC: " + classPercentileData.getValue(i, 3).toFixed(2) + "</h6><br>";
        tooltip = tooltip + "<h6>Class 50th Percentile Errors/kLOC: " + classPercentileData.getValue(i, 2).toFixed(2) + "</h6><br>";
        tooltip = tooltip + "<h6>Class 25th Percentile Errors/kLOC: " + classPercentileData.getValue(i, 1).toFixed(2) + "</h6><br>";
        tooltip = tooltip + "</div";
        classPercentileData.setValue(i, numCols, tooltip);
    }

    let rowsArr = [];
    if (elementId == "s_classcomp_div") {
        rowsArr = [];
        for (i = 0; i < mostRecentSub; i++) {
            rowsArr.push(i);
        }
    }
    else {
        rowsArr = [];
        for (i = 0; i < classPercentileData.getNumberOfRows(); i++) {
            rowsArr.push(i);
        }
    }
    let classCompLineChart = new google.visualization.ChartWrapper({
        'chartType': 'LineChart',
        'containerId': elementId,
        'dataTable': classPercentileData,
        'view': {rows : rowsArr, columns: [0, 6, 1, 6, 2, 6, 3, 6, 5, 6]},
        'options': {
            tooltip: {isHtml: true, showColorCode: true, ignoreBounds: true}, 
            'title': 'Current Project vs Class 25, 50, 75 Percentile', 
            titleTextStyle: {
                fontSize: 14,
                bold: true
            },
            'colors': [sev1Color, sev1Color, sev1Color, 'red'],
            'height': '100%',
            'width': '100%',
            vAxis: {
                title: 'Number of Errors / kLOC'
            },
            hAxis: {
                title: xAxis
            },
            legend: {
                position: 'bottom'
            },
            chartArea: {
                bottom: '25%'
            }
        }
    });
    classCompLineChart.draw();
}

/**
 * Builds line chart that compares teacher's projects to other class projects
 * @param {*} groupedClassData - groupedClassData data table
 */
function buildTeacherClassCompLineChart(groupedClassData) {
    if (groupedClassData.getNumberOfRows() == 0) {
        buildErrorDataTable("LineChart", "t_teacherclasscomp_div");
        return;
    }
    //start building project comparison chart
    let classNames = new Map();
    let dataArr = [];
    //prep data rows in the form [[sub # 1, proj 1 total, proj 2 total, ..], [sub # 2, .....]]
    for (i = 0; i < groupedClassData.getNumberOfRows(); i++) {
        let className = groupedClassData.getValue(i, groupClassColNames["CourseID"]);
        let tooltip = "<div>";
        tooltip = tooltip + "<h4>" + className + "</h4><br>";
        let classNameIndex = classNames.get(className);
        if (!classNameIndex) {
            classNameIndex = classNames.size + 1;
            classNames.set(className, classNameIndex);
        }
        let currSubNumber = groupedClassData.getValue(i, groupClassColNames["SubmissionNo"]);

        tooltip = tooltip + "<h6>Submission: " + currSubNumber + "</h6><br>";
        tooltip = tooltip + "<h6>Total Number of Errors: " + groupedClassData.getValue(i, groupClassColNames["TotalNum"]).toFixed(2) + "</h6><br>";
        tooltip = tooltip + "<h6>Avg. Lines of Code: " + groupedClassData.getValue(i, groupClassColNames["LinesOfCode"]).toFixed(2) + "</h6><br>";
        tooltip = tooltip + "<h6>Avg. Stuck Level: " + groupedClassData.getValue(i, groupClassColNames["avgStuckLevel"]).toFixed(2) + "</h6><br>";
        tooltip = tooltip + "<h6>Sev 1 Errors/kLOC: " + groupedClassData.getValue(i, groupClassColNames["Sev1kLOC"]).toFixed(2) + "</h6><br>";
        tooltip = tooltip + "<h6>Sev 2 Errors/kLOC: " + groupedClassData.getValue(i, groupClassColNames["Sev2kLOC"]).toFixed(2) + "</h6><br>";
        tooltip = tooltip + "<h6>Sev 3 Errors/kLOC: " + groupedClassData.getValue(i, groupClassColNames["Sev3kLOC"]).toFixed(2) + "</h6><br>";
        tooltip = tooltip + "<h6>Sev 4 Errors/kLOC: " + groupedClassData.getValue(i, groupClassColNames["Sev4kLOC"]).toFixed(2) + "</h6><br>";

        let errorFreq = groupedClassData.getValue(i, groupClassColNames["TotalkLOC"]);
        tooltip = tooltip + "</div>";
        if (currSubNumber - 1 >= dataArr.length || !dataArr[currSubNumber - 1]) {
            dataArr[currSubNumber - 1] = [currSubNumber];
        }
        dataArr[currSubNumber - 1][classNameIndex * 2 - 1] = errorFreq;
        dataArr[currSubNumber - 1][classNameIndex * 2] = tooltip;
    }

    
    let lastRow = [];
    for (i = 0; i < dataArr.length; i++) {
        if (!dataArr[i]) {
            dataArr[i] = null;
            continue;
        }
        for (j = 0; j < classNames.size * 2 + 1; j++) {
            if (!dataArr[i][j]) {
                dataArr[i][j] = lastRow[j];
            }
        }
        lastRow = dataArr[i];
    }


    let classCompData = new google.visualization.DataTable();
    classCompData.addColumn('number', 'Submission #');
    let classNamesArr = Array.from(classNames.keys());
    classNamesArr.sort((a,b) => classNames.get(a) - classNames.get(b));
    for (i = 0; i < classNamesArr.length; i++) {
        classCompData.addColumn('number', classNamesArr[i]);
        classCompData.addColumn({
            type: 'string',
            label: 'Tooltip Chart',
            role: 'tooltip',
            'p': {'html': true}
        });
    }
    classCompData.addRows(dataArr);
    
    let classCompLineChart = new google.visualization.ChartWrapper({
        'chartType': 'LineChart',
        'containerId': 't_teacherclasscomp_div',
        'dataTable': classCompData,
        'options': {
            tooltip: {isHtml: true, showColorCode: true, ignoreBounds: true}, 
            'title': "Current Project vs Other Class' Projects", 
            titleTextStyle: {
                fontSize: 14,
                bold: true
            },
            'height': '100%',
            'width': '100%',
            vAxis: {
                title: 'Number of Errors / kLOC'
            },
            hAxis: {
                title: 'Submission #'
            },
            legend: {
                position: 'bottom'
            },
            chartArea: {
                bottom: '25%'
            }
        }
    });
    classCompLineChart.draw();
}

/**
 * Builds teacher submission table
 * @param {*} matchingGroupedClassAndProjectView - groupedClassData view with matching class and project
 */
function buildTeacherSubTable(matchingGroupedClassAndProjectView) {
    if (matchingGroupedClassAndProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("Table", "t_subm_div");
        return;
    }
    //build highest submissions data table
    let lastSubDataTable = new google.visualization.ChartWrapper({
        'chartType': 'Table',
        'containerId': 't_subm_div',
        'dataTable': matchingGroupedClassAndProjectView,
        'view': {columns: [4,groupClassColNames["numStudents"],groupClassColNames["avgStuckLevel"],5,6,7,8,9,10,  ], 
            rows: matchingGroupedClassAndProjectView.getSortedRows({column: groupClassColNames["SubmissionNo"], desc: true})},
        'options': {
            'title': 'Results by Submission #', 
            titleTextStyle: {
                fontSize: 18,
                bold: true
            },
            'height': '100px',
            'width': '100%',
        }
    });
    lastSubDataTable.draw();
}

/**
 * Builds bottom X student chart based on total number of errors / kLOC
 * 
 * @param {*} matchingClassAndProjectView - groupedData with view set to filter matching class and project
 * @param {*} origDataMatchingClassAndProjectView - original data with matching class and project for tooltip
 */
function buildBottom5StudChart(matchingClassAndProjectView, origDataMatchingClassAndProjectView) {
    if (matchingClassAndProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("BarChart", "t_bot5_div");
        return;
    }
    //build top 5 current students bar chart

    let studentMap = new Map();
    let numStudentSubs = matchingClassAndProjectView.getViewRows();
    let removedRows = [];
    for (i = numStudentSubs.length - 1; i >= 0; i--) {
        let studentName = matchingClassAndProjectView.getValue(i, groupColNames["subjectID"]);
        let subNumber = matchingClassAndProjectView.getValue(i,  groupColNames["SubmissionNo"]);
        let currSub = studentMap.get(studentName);
        if (!currSub || (currSub && currSub < subNumber)) {
            studentMap.set(studentName, subNumber);
        }
        else {
            removedRows.push(numStudentSubs[i]);
        }
    }
    matchingClassAndProjectView.hideRows(removedRows);
    let viewRows = matchingClassAndProjectView.getSortedRows([{column: groupColNames["TotalkLOC"]}]);
    let tableRows = matchingClassAndProjectView.getViewRows();
    let arr = [];
    for (i = viewRows.length - 1; i >= 0; i--) {
        arr.push(tableRows[viewRows[i]]);
    }
    matchingClassAndProjectView.setRows(arr);

    let numRows;
    if (viewRows.length < 20) {
        numRows = matchingClassAndProjectView.getNumberOfRows();
    }
    else {
        numRows = 20;
    }
    viewRows = matchingClassAndProjectView.getViewRows();
    let firstXRows = [];
    for (i = 0; i < numRows; i++) {
        firstXRows.push(viewRows[i]);
    }
    matchingClassAndProjectView.setRows(firstXRows);

    let dataArr = matchingClassAndProjectView.toDataTable();
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    dataArr.addColumn({
        type: 'string',
        label: 'Tooltip Chart',
        role: 'tooltip',
        'p': {'html': true}
    });
    

    // For each row of primary data, draw a chart of its tooltip data.
    for (var i = 1; i <= dataArr.getNumberOfRows(); i++) {
        let filterArr = [];
        filterArr.push({column: groupColNames["SubmissionNo"], value: dataArr.getValue(i - 1, origColNames["SubmissionNo"])});
        filterArr.push({column: groupColNames["subjectID"], value: dataArr.getValue(i - 1, origColNames["subjectID"])});
        let toolTipRows = origDataMatchingClassAndProjectView.getFilteredRows(filterArr);
        let origDataRows = origDataMatchingClassAndProjectView.getViewRows();
        let rows = [];
        for (j = 0; j < toolTipRows.length; j++) {
            rows.push(origDataRows[toolTipRows[j]]);
        }

        let sev1Map = new Map();
        let sev2Map = new Map();
        let sev3Map = new Map();
        let sev4Map = new Map();
        rows.forEach(i => {
            const severity = data.getValue(i, origColNames["severity"]);
            const errorType = data.getValue(i, origColNames["Error"]);
            
            if (severity == 1) {
                const errorNum = sev1Map.get(errorType);
                if (!errorNum) {
                    sev1Map.set(errorType, 1);
                }
                else {
                    sev1Map.set(errorType, errorNum + 1);
                }
            } else if (severity == 2) {
                const errorNum = sev2Map.get(errorType);
                if (!errorNum) {
                    sev2Map.set(errorType, 1);
                }
                else {
                    sev2Map.set(errorType, errorNum + 1);
                }
    
            } else if (severity == 3) {
                const errorNum = sev3Map.get(errorType);
                if (!errorNum) {
                    sev3Map.set(errorType, 1);
                }
                else {
                    sev3Map.set(errorType, errorNum + 1);
                }
    
            } else if (severity == 4) {
                const errorNum = sev4Map.get(errorType);
                if (!errorNum) {
                    sev4Map.set(errorType, 1);
                }
                else {
                    sev4Map.set(errorType, errorNum + 1);
                }
            }
        });

        //for each map add map in decreasing order
        let sev1Arr = mapToSortedArray(sev1Map, sev1Color);
        let sev2Arr = mapToSortedArray(sev2Map, sev2Color);
        let sev3Arr = mapToSortedArray(sev3Map, sev3Color);
        let sev4Arr = mapToSortedArray(sev4Map, sev4Color);

        let dataArrNumCols = dataArr.getNumberOfColumns();
        let tooltipImg = getBot5ChartTooltipHTML(sev1Arr, 1, dataArr, i - 1, "grouped");
        // Add the new tooltip image to your data rows.
        dataArr.setValue(i - 1, dataArrNumCols - 4, tooltipImg);
        tooltipImg = getBot5ChartTooltipHTML(sev2Arr, 2, dataArr, i - 1, "grouped");
        dataArr.setValue(i - 1, dataArrNumCols - 3, tooltipImg);
        tooltipImg = getBot5ChartTooltipHTML(sev3Arr, 3, dataArr, i - 1, "grouped");
        dataArr.setValue(i - 1, dataArrNumCols - 2, tooltipImg);
        tooltipImg = getBot5ChartTooltipHTML(sev4Arr, 4, dataArr, i - 1, "grouped");
        dataArr.setValue(i - 1, dataArrNumCols - 1, tooltipImg);
    }

    let dataArrNumCols = dataArr.getNumberOfColumns();
    //build bottom 5 students bar chart
    let bot5StudentBarChart = new google.visualization.ChartWrapper({
        'chartType': 'BarChart',
        'containerId': 't_bot5_div',
        'dataTable': dataArr,
        'view': {columns: [groupColNames["subjectID"], groupColNames["Sev4kLOC"], dataArrNumCols - 1,
            groupColNames["Sev3kLOC"], dataArrNumCols - 2, groupColNames["Sev2kLOC"], dataArrNumCols - 3, 
            groupColNames["Sev1kLOC"], dataArrNumCols - 4,
            { calc: "stringify", sourceColumn: groupColNames["TotalkLOC"], type: "string", role: "annotation" }],},
            'options': {
                tooltip: {isHtml: true, showColorCode: true, ignoreBounds: true},
                'title': 'Current Bottom Students in Class by Errors/kLOC', 
                'colors': [sev4Color, sev3Color, sev2Color, sev1Color],
                titleTextStyle: {
                    fontSize: 18,
                    bold: true
                },
                'height': '100%',
                'width': '100%',
                isStacked: true,
                vAxis: {
                    title: 'Student ID'
                },
                hAxis: {
                    title: 'Number of Errors / kLOC'
                },
                legend: {
                    position: 'bottom'
                },
            }
    });
    bot5StudentBarChart.draw();
}

/**
 * Builds bar chart that displays total frequency of errors for all submissions in a class
 * @param {*} origDataMatchingClassAndProjectView  - original data view with matching class and project
 */
function buildTeachTopXSevChart(origDataMatchingClassAndProjectView) {
    if (origDataMatchingClassAndProjectView.getNumberOfRows() == 0) {
        buildErrorDataTable("BarChart", "t_topXSev_div");
        return;
    }
    let sev1Map = new Map();
    let sev2Map = new Map();
    let sev3Map = new Map();
    let sev4Map = new Map();
    
    for (i = origDataMatchingClassAndProjectView.getNumberOfRows() - 1; i >= 0; i--) {
        const severity = origDataMatchingClassAndProjectView.getValue(i, origColNames["severity"]);
        const errorType = origDataMatchingClassAndProjectView.getValue(i, origColNames["Error"]);
        
        if (severity == 1) {
            const errorNum = sev1Map.get(errorType);
            if (!errorNum) {
                sev1Map.set(errorType, 1);
            }
            else {
                sev1Map.set(errorType, errorNum + 1);
            }
        } else if (severity == 2) {
            const errorNum = sev2Map.get(errorType);
            if (!errorNum) {
                sev2Map.set(errorType, 1);
            }
            else {
                sev2Map.set(errorType, errorNum + 1);
            }

        } else if (severity == 3) {
            const errorNum = sev3Map.get(errorType);
            if (!errorNum) {
                sev3Map.set(errorType, 1);
            }
            else {
                sev3Map.set(errorType, errorNum + 1);
            }

        } else if (severity == 4) {
            const errorNum = sev4Map.get(errorType);
            if (!errorNum) {
                sev4Map.set(errorType, 1);
            }
            else {
                sev4Map.set(errorType, errorNum + 1);
            }
        }
    }

    let currErrorData = new google.visualization.DataTable();
    currErrorData.addColumn('string', 'error name');
    currErrorData.addColumn('number', 'frequency');
    currErrorData.addColumn({role: 'style'});
    

    //for each map add map in decreasing order
    currErrorData.addRows(mapToSortedArray(sev1Map, sev1Color));
    currErrorData.addRows(mapToSortedArray(sev2Map, sev2Color));
    currErrorData.addRows(mapToSortedArray(sev3Map, sev3Color));
    currErrorData.addRows(mapToSortedArray(sev4Map, sev4Color));
    let topXSevChart = new google.visualization.ChartWrapper({
        'chartType': 'BarChart',
        'containerId': 't_topXSev_div',
        'dataTable': currErrorData,
        'view' : [{columns: [0,1,2, { calc: "stringify",
        sourceColumn: 1,
        type: "string",
        role: "annotation" }]}],
        'options': {
            'title': 'Total Frequency of Each Error (All Submissions)', 
            titleTextStyle: {
                fontSize: 18,
                bold: true
            },
            'height': '100%',
            'width': '100%',
            vAxis: {
                title: 'Error Name (Most Severe at Top)'
            },
            hAxis: {
                title: 'Frequency'
            },
            legend: {
                position: 'none'
            },
            chartArea: {
                left: '45%'
            },
        }
    });
    topXSevChart.draw();
}

/*********************         HELPER FUNCTIONS SECTION                  *************************************/

/**
 * Sorts an array in ascending order
 * @param {Array} arr - array of values to be sorted
 */
const asc = arr => arr.sort((a, b) => a - b);

/**
 * Gets percentile based on parameter array value
 * @param {Array} arr - array of values
 * @param {Number} q - number from 0 to 1 specifying percentile;
 *                      ex: .5 for 50th percentile
 */
const quantile = (arr, q) => {
    const sorted = asc(arr);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
};

/**
 * Gets 25th percentile based on parameter array value
 * @param {Array} arr - array of values
 */
const percentile25 = (arr) => {
    return quantile(arr, .25);
}
/**
 * Gets 75th percentile based on parameter array value
 * @param {Array} arr - array of values
 */
const percentile75 = (arr) => {
    return quantile(arr, .75);
}
/**
 * Gets 50th percentile based on parameter array value
 * @param {Array} arr - array of values
 */
const percentile50 = (arr) => {
    return quantile(arr, .50);
}

/**
 * Converts a Map to a sorted array for input into a chart
 * @param {Map} map - map to be converted to sorted array
 * @param {String} color - color of bar for bar chart based on severity
 */
function mapToSortedArray(map, color) {
    var array = [];
    for (let [key, value] of map) {
        array.push([key, value, color]);
    }

    return array.sort(function(a, b) {
        return (a[1] < b[1]) ? 1 : ((b[1] < a[1]) ? -1 : 0)
    });
}

/**
 * Helper function for parsing CSV file; specifies which columns are numeric
 * @param {Integer} colNum - column index
 */
function isColNumeric(colNum) {
    switch (colNum) {
        case 5:
        case 7:
        case 8:
        case 13:
        case 14:
            return true;
        default:
            return false;
    }
}

/**
 * Aggregation function to count number of severity 1 errors
 * @param {Integer Array} values 
 */
function countSev1(values) {
    let count = 0;
    for (i = 0; i < values.length; i++) {
        if (values[i] == 1) count++;
    }
    return count;
}

/**
 * Aggregation function to count number of severity 2 errors
 * @param {Integer Array} values 
 */
function countSev2(values) {
    let count = 0;
    for (i = 0; i < values.length; i++) {
        if (values[i] == 2) count++;
    }
    return count;
}

/**
 * Aggregation function to count number of severity 3 errors
 * @param {Integer Array} values 
 */
function countSev3(values) {
    let count = 0;
    for (i = 0; i < values.length; i++) {
        if (values[i] == 3) count++;
    }
    return count;
}

/**
 * Aggregation function to count number of severity 4 errors
 * @param {Integer Array} values 
 */
function countSev4(values) {
    let count = 0;
    for (i = 0; i < values.length; i++) {
        if (values[i] == 4) count++;
    }
    return count;
}


/**
 * Disables student button when appropriate
 */
function disableStudent() {
    let val = document.getElementById("student-id").value;
    let classVal = document.getElementById("class").value;
    let projectVal = document.getElementById("project").value;
    if (!val || val.length == 0 || !classVal 
        || classVal.length == 0 || !projectVal ||projectVal.length == 0) {
        document.getElementById("student").disabled = true;
    }
    else {
        document.getElementById("student").disabled = false;
    }
}
/**
 * Disables teacher button when appropriate
 */
function disableTeacher() {
    
    let val = document.getElementById("class").value;
    let projectVal = document.getElementById("project").value;
    if (!val || val.length == 0 || !projectVal || projectVal.length == 0) {
        document.getElementById("teacher").disabled = true;
    }
    else {
        document.getElementById("teacher").disabled = false;
    }
}


/**
 * Form control function to disable buttons
 */
$(document).ready(function(){
    $("#filterform").submit(function(event) {
        parseData(event);
        event.preventDefault();
    });

    
    $("#txtFileUpload").on('input', function(event) {
        resetDashboards("none");
        
        generateTitle("Loading Data...")
        
        let element = document.createElement("div");
        element.className = "lds-ring";
        for (i = 0; i < 4; i++) {
            let divElement = document.createElement("div");
            element.appendChild(divElement);
        }
        document.getElementById("dashboard_title2").appendChild(element);
        
        

        generateData(event);
        setTimeout(function() { 
            generateTitle("");
            document.getElementById("dashboard_title2").innerHTML = "";
        }, 1000);
        
        event.preventDefault();
    });

    $("#project").on('input', function(event) {
        disableStudent();
        disableTeacher();
        event.preventDefault();
    });

    $("#class").on('input', function(event) {
        disableStudent();
        disableTeacher();
        event.preventDefault();
    });


    $("#student-id").on('input', function(event) {
        disableStudent();
        disableTeacher();
        event.preventDefault();
    });
});


/**
 * Resets the dashboards to original blank state
 */
function resetDashboards(viewerType) {
    let chartElementIDs = [["dashboard_title", "dashboard_title2"], ["s_chart2_div", "s_area_chart", "s_area_chart_optional", 
    "s_topXSev_div", "s_classcomp_div", "s_time_area_chart", "s_time_classcomp_div", "s_class_time_stuck_chart", "s_area_chart_class_time", "s_projectcomp_div", "s_class_stuck_chart"], ["t_subm_div", "t_area_chart", 
    "t_projectcomp_div", "t_area_chart_class_time", "t_class_time_stuck_chart", "t_topXSev_div", "t_teacherclasscomp_div", "t_bot5_div", "t_class_stuck_chart", "t_botXStuck_div"]];

    let elementArrIndex = -1;
    if (viewerType == "student") {
        elementArrIndex = 1;
    } else if (viewerType == "teacher") {
        elementArrIndex = 2;
    } else if (viewerType == "administrator") {
        elementArrIndex = 3;
    } 

    for (i = 0; i < chartElementIDs.length; i++) {
        for (j = 0; j < chartElementIDs[i].length; j++) {
            let element = document.getElementById(chartElementIDs[i][j]);
            element.innerHTML = "";
            if (i == elementArrIndex) {
                element.style.border = "solid 1px black";
            } else {
                element.style.border = "0px";
            }
        }
    }
}

/**
 * Gets relevant google.visualization.DataView according to parameter info 
 * @param {google.visualization.DataTable/DataView} data - google.visualization.DataTable/DataView to 
 * generate the view on
 * @param {JSON Object Array} filterColumnNames - column names array with each element being a JSON
 * object in the format {column: , value: }; intended to be put into the 
 * DataTable.getFilteredRows(filterColumnNames) function
 */
function getDataView(data, filterColumnNames) {    
    let matchingRows = data.getFilteredRows(filterColumnNames);
    let matchingView = new google.visualization.DataView(data);
    matchingView.setRows(matchingRows);
    return matchingView;
}

/**
 * Generates the dashboard title
 * @param {String} titleText - title text to display
 */
function generateTitle(titleText) {
    document.getElementById("dashboard_title").innerText = titleText;
}

/**
 * Adds null values wherever there is an empty row or cell
 * Charts won't generate if array has weird dimensions, so we insert
 * null values to keep dimensions uniform throughout array
 * @param {Array} dataArr - 2D array to add null values to
 */
function addNullValues(dataArr, projNames) {
    for (i = 0; i < dataArr.length; i++) {
        if (!dataArr[i]) {
            dataArr[i] = null;
            continue;
        }
        for (j = 0; j < projNames.size + 1; j++) {
            if (!dataArr[i][j]) {
                dataArr[i][j] = null;
            }
        }
    }
    return dataArr;
}

/**
 * Helper function to generate tooltip HTML for the stacked area charts
 * @param {*} sevArr - 2D array with array names and array frequencies as elements 0 and 1 in nested array
 * @param {*} sevNum - what severity level the tooltip is being used for
 * @param {*} dataArr - dataTable where the data is coming from
 * @param {*} subNum - current submission number
 * @param {*} type - grouped or groupedTime depending on if you want submission num or submission time
 */
function getAreaChartTooltipHTML(sevArr, sevNum, dataArr, subNum, type) {
    let colNames;
    if (type == "grouped" || type == "groupedTime") {
        colNames = groupColNames;
    } else if (type == "groupedClass") {
        colNames = groupClassColNames;
    }
    let rowsStr = "";
    let errCount = 0;
    
    rowsStr = rowsStr + "<table border='1'><tr><td><b>Type</b></td><td><b>Frequency</b></td></tr>";
    for (j = 0; j < sevArr.length; j++) {
        rowsStr = rowsStr + "<tr>";
        rowsStr = rowsStr + "<td>";
        rowsStr = rowsStr + sevArr[j][0];
        rowsStr = rowsStr + "</td>";
        rowsStr = rowsStr + "<td>";
        rowsStr = rowsStr + sevArr[j][1];
        errCount = errCount + sevArr[j][1];
        rowsStr = rowsStr + "</td>";
        rowsStr = rowsStr + "</tr>";
    }
    if (sevArr.length > 0) {
        rowsStr = rowsStr + '</table></div>';
    }
    else {
        rowsStr = "</div>";
    }
    let headStr = "<div>";
    let subCol = "SubmissionNo";
    if (type == "groupedTime") subCol = "SubmissionTime";
    headStr = headStr + "<h4>Submission: " + dataArr.getValue(subNum - 1, colNames[subCol]) + "</h4><br>";
    if (type == "groupedClass") {
        headStr = headStr + "<h5>Avg. Total # Errors: " + dataArr.getValue(subNum - 1, colNames["TotalNum"]).toFixed(2) + "</h5><br>";
        headStr = headStr + "<h5># of Submissions: " + dataArr.getValue(subNum - 1, colNames["numStudents"]).toFixed(0) + "</h5><br>";
        headStr = headStr + "<h5>Avg. Stuck Level: " + dataArr.getValue(subNum - 1, colNames["avgStuckLevel"]).toFixed(2) + "</h5><br>";
    }
    else if (type == "grouped") {
        headStr = headStr + "<h5>Total # Errors: " + dataArr.getValue(subNum - 1, colNames["TotalNum"]).toFixed(2) + "</h5><br>";
        headStr = headStr + "<h5>Stuck Level: " + dataArr.getValue(subNum - 1, colNames["stuckLevel"]).toFixed(0) + "</h5><br>";
    }
    headStr = headStr + "<h5>Severity " + sevNum + " Errors: " + errCount + "</h5><br>";
    headStr = headStr + "<h5>Lines of Code: " + dataArr.getValue(subNum - 1, colNames["LinesOfCode"]).toFixed(2) + "</h5><br>";
    headStr = headStr + "<h5>Sev " + sevNum + " Errors/kLOC: " 
        + dataArr.getValue(subNum - 1, colNames["Sev" + sevNum + "kLOC"]).toFixed(2) + "</h5><br>";
    rowsStr = headStr + rowsStr;
    return rowsStr;
}

/**
 * Helper function to generate tooltip HTML for the bottom X charts
 * @param {*} sevArr - 2D array with array names and array frequencies as elements 0 and 1 in nested array
 * @param {*} sevNum - what severity level the tooltip is being used for
 * @param {*} dataArr - dataTable where the data is coming from
 * @param {*} subNum - current submission number
 * @param {*} type - grouped or groupedTime depending on if you want submission num or submission time
 */
function getBot5ChartTooltipHTML(sevArr, sevNum, dataArr, subNum, type) {
    let colNames;
    if (type == "grouped") {
        colNames = groupColNames;
    } else if (type == "groupedClass") {
        colNames = groupClassColNames;
    }
    let rowsStr = "";
    let errCount = 0;
    
    rowsStr = rowsStr + "<table border='1'><tr><td><b>Type</b></td><td><b>Frequency</b></td></tr>";
    for (j = 0; j < sevArr.length; j++) {
        rowsStr = rowsStr + "<tr>";
        rowsStr = rowsStr + "<td>";
        rowsStr = rowsStr + sevArr[j][0];
        rowsStr = rowsStr + "</td>";
        rowsStr = rowsStr + "<td>";
        rowsStr = rowsStr + sevArr[j][1];
        errCount = errCount + sevArr[j][1];
        rowsStr = rowsStr + "</td>";
        rowsStr = rowsStr + "</tr>";
    }
    if (sevArr.length > 0) {
        rowsStr = rowsStr + '</table></div>';
    }
    else {
        rowsStr = "</div>";
    }
    let headStr = "<div><h5>Total # Errors: " + dataArr.getValue(subNum, colNames["TotalNum"]).toFixed(2) + "</h5><br>";
    headStr = headStr + "<h5>Stuck Level: " + dataArr.getValue(subNum, colNames["stuckLevel"]).toFixed(0) + "</h5><br>";
    headStr = headStr + "<h5>Severity " + sevNum + " Errors: " + errCount + "</h5><br>";
    headStr = headStr + "<h5>Lines of Code: " + dataArr.getValue(subNum, colNames["LinesOfCode"]).toFixed(2) + "</h5><br>";
    headStr = headStr + "<h5>Sev " + sevNum + " Errors/kLOC: " 
        + dataArr.getValue(subNum, colNames["Sev" + sevNum + "kLOC"]).toFixed(2) + "</h5><br>";
    rowsStr = headStr + rowsStr;
    return rowsStr;
}