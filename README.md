# error-dashboard
This project takes data from WebCAT about student's errors in coding projects and displays it into a visual dashboard using HTML, JavaScript, Google Charts, and Bootstrap. 

By: Trevor Miller

How to Use:
1. Load the dashboard.html file in a browser which should be in the same folder as the papaparse
files and build-charts.js
2. Enter the csv file (sample file should be in the samplefiles folder, for best results, I would
recommend looking at ‘Lab01’ for Project, ‘12751’ for Class, and ‘s00001’ for student because
that is the most complete data point). Note: The data generation is not part of this project. It is
assumed that you have the WebCAT data in the correct format.

Part 1) Form: <br>
The form gathers info about the user and decides which charts to generate. There are two views that can be selected: teacher view and student view. <br>
User inputs their own formatted CSV file obtained from WebCAT

Part 2) Dashboard:<br>
For most charts, individual errors are assigned a severity 1-4 and each level of severity is
displayed on the charts.<br>
Errors per 1000 lines of code is a common measurement used in almost all the visuals<br>
Charts are either displayed by submission number or over time<br>
For more in depth info about a certain chart, hover over the data points to see the tooltips.<br>

Part 3) Code Notes (Implementation Details):<br>
Once it receives a file to process, it parses the csv file using PapaParse library and generates a
google.visualization.DataTable out of the results<br>
  It is currently programmed to take in the following columns for the csv in the following
order: CourseID (string but will usually be a CRN num), Teacher (string), Semester
(string), AssignmentNo (string with project name), subjectID (string with subject
identifier), SubmissionNo (number), SubmissionTime (string timestamp in the form
MM/DD/YY 11:30PM), Lines of Code (number), severity (number 1 – 4), category
(string), ClassName (string), FileName (string), MethodName (string), Line (number), Col
(number), Error (string)<br>
  If columns are changed, you will have to update the JSON objects and isColNumeric()
function<br>
If additional identifiers are added (like semester, teacher, student, etc), the
generation functions may have to be updated as well to account for these<br>
It then creates three more google.visualization.DataTable for different ways of aggregating the
DataTable (columns can be found in JSON object at top of .js file)<br>
  groupedData – groups based on matching courseId, teacher, semester, assignmentNo,
  subjectID, SubmissionNo<br>
Intended to get one row for every student submission to make it easier for
visualization<br>
  Adds a few metrics like number of severity X errors and calculates the number
  of errors per kLOC<br>
  groupedClassData - groups based on matching courseId, teacher, semester,
assignmentNo, SubmissionNo<br>
▪ Intended to get one row for every submission number per class to make it easier
for visualization<br>
▪ Adds a few metrics like number of severity X errors and calculates the number
of errors per kLOC, also adds stuck levels and number of students who
submitted<br>
o groupedClassDataByDate – exact same as groupedClassData except it uses submission
time instead of submission number, it is aggregated such that only the most recent
submissions are considered<br>
• Then, once the user selects the load view button and either teacher or student view, it will
generate the charts for that view<br>
