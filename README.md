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

Part 1) Form:
• Gathers info about user to decide which charts to generate
• User inputs their own formatted CSV file obtained from WebCAT
• Teacher – Needs to at least fill in Project and CRN
• Student – Needs to fill in every field
• Can switch between views if all relevant info for that view is entered

Part 2) Dashboard:
• For most charts, individual errors are assigned a severity 1-4 and each level of severity is
displayed on the charts
• Errors per 1000 lines of code is a common measurement used in almost all the visuals
• Charts are either displayed by submission number or over time
• For more info about a certain chart, hover over the data points to see the tooltips
• Student View:
o Two stacked area charts for how the student is progressing a) over time and b) by
submission number
o Two stacked area charts for how the class is progressing a) over time and b) by
submission number
o Bar chart showing the frequency of each error in the student’s most recent submission
o Two line charts showing how the student is progressing vs the class 25, 50, 75th
percentiles
o Line chart comparing how students are doing compared to their other projects
o Chart showing how many submissions the class has made and their stuck levels on those
submissions both over time and by submission number
• Teacher View
o Stacked bar chart showing the top 20 students with the most errors in terms of number
of errors/ kLOC
o Stacked bar chart showing the top 20 students with the most errors in terms of “stuck
level”
o Bar chart showing the total frequency of each error for all submissions
o Line charts showing how current project compares to other class’ performances on
same project and to other projects within the same class
o Two stacked area charts for how the class is progressing a) over time and b) by
submission number
o Chart showing how many submissions the class has made and their stuck levels on those
submissions both over time and by submission number
Part 3) Code Notes
• Once it receives a file to process, it parses the csv file using PapaParse library and generates a
google.visualization.DataTable out of the results
o It is currently programmed to take in the following columns for the csv in the following
order: CourseID (string but will usually be a CRN num), Teacher (string), Semester
(string), AssignmentNo (string with project name), subjectID (string with subject
identifier), SubmissionNo (number), SubmissionTime (string timestamp in the form
MM/DD/YY 11:30PM), Lines of Code (number), severity (number 1 – 4), category
(string), ClassName (string), FileName (string), MethodName (string), Line (number), Col
(number), Error (string)
o If columns are changed, you will have to update the JSON objects and isColNumeric()
function
▪ If additional identifiers are added (like semester, teacher, student, etc), the
generation functions may have to be updated as well to account for these
• It then creates three more google.visualization.DataTable for different ways of aggregating the
DataTable (columns can be found in JSON object at top of .js file)
o groupedData – groups based on matching courseId, teacher, semester, assignmentNo,
subjectID, SubmissionNo
▪ Intended to get one row for every student submission to make it easier for
visualization
▪ Adds a few metrics like number of severity X errors and calculates the number
of errors per kLOC
o groupedClassData - groups based on matching courseId, teacher, semester,
assignmentNo, SubmissionNo
▪ Intended to get one row for every submission number per class to make it easier
for visualization
▪ Adds a few metrics like number of severity X errors and calculates the number
of errors per kLOC, also adds stuck levels and number of students who
submitted
o groupedClassDataByDate – exact same as groupedClassData except it uses submission
time instead of submission number, it is aggregated such that only the most recent
submissions are considered
• Then, once the user selects the load view button and either teacher or student view, it will
generate the charts for that view
