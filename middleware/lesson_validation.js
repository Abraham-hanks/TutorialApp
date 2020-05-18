const Lesson = require('../models/lesson_model');
const Subject = require('../models/subject_model');
const User = require('../models/user_model');

// ValidateUsers: Checks if the users sent in request exist and returns an array of user docs
const validateUsers =  async function(req, res){
    const docsArray = [{valid: false}];
    const tutor_id = req.body.tutor_id;
    const student_id = req.body.student_id;
    const subject_id = req.body.subject_id;
    const findUser = await User.findById(tutor_id)
    .then(
        async tutor =>{
            //check if tutor exists
            if (!tutor) {
                req.err ={
                    status: false,
                    message: 'Tutor not found',
                    code: 404
                }
                return
            }
            //check if user is a tutor
            else if (tutor.role != 'tutor') {
                req.err ={
                    status: false,
                    message: 'Tutor Id sent does not belong to a tutor',
                    code: 404
                }
            }
            //check if tutor is deactivated
            else if (!tutor.active) {
                req.err ={
                    status: false,
                    message: 'Tutor is deactivated',
                    code: 404
                }
                return
            }
            //get array of registered subjects
            const tutorSubjects = tutor.subjects;
            
            //check if tutor is registered to take subject
            let registeredTutor = false;
            tutorSubjects.forEach(element =>{
                if (element == subject_id) {
                    registeredTutor = true
                }
            })
            
            if (!registeredTutor) {
                req.err ={
                    status: false,
                    message: 'Tutor not registered to take subject',
                    code: 404
                }
                return
            }
            //
            //add tutor docs to docsArray
            docsArray.push(tutor);
            //validate student
            const studentDoc = await User.findById(student_id)
            .then(
                async student =>{
                    //check if student exists
                    if (!student) {
                        req.err ={
                            status: false,
                            message: 'Student not found',
                            code: 404
                        }
                        return
                    }
                    else if (student.role != 'student') {
                        req.err ={
                            status: false,
                            message: 'Student Id sent does not belong to a student',
                            code: '404'
                        }
                        return
                    }
                    //add student docs to docsArray
                    docsArray.push(student);
                    //validate subject
                    const subjectDoc = await Subject.findById(subject_id)
                    .then(
                        subject =>{
                            //check if subject exists
                            if (!subject) {
                                req.err ={
                                    status: false,
                                    message: 'Subject not found',
                                    code: 404
                                }
                                return
                            }
                            //add subject docs to docsArray
                            docsArray.push(subject)
                            //set valid to true
                            docsArray[0].valid = true
                            return
                        }
                    ).catch(err => {
                        req.err ={
                            status: false,
                            message: 'Invalid subject id',
                            code: 404
                        }
                        return
                    })
                }
            ).catch(err => {
                req.err ={
                    status: false,
                    message: 'Invalid Student id',
                    code: 404
                }
                return
            })
        }
    ).catch(err => {
        req.err ={
            status: false,
            message: 'Invalid Tutor id',
            code: 404
        }
        return
    })
    //returns an array of dicuments
    return docsArray;
}

const validateRequestData = function(req, date, tutor_id, student_id, subject_id){
    const dateRegEx = RegExp(/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/);
    const subject = req.body.subject_id;
    if(!date || !tutor_id || !student_id || !subject_id){
        req.err ={
            status: false,
            message:'All field required',
            code: 400
        }
        return false
    }
    else if (!dateRegEx.test(date)) {
        req.err ={
            status: false,
            message:'Invalid date or date format',
            code: 400
        }
        return false
    }
    else if (typeof student_id != 'string' || student_id.length == 0) {
        req.err = {
            status: false,
            message: 'Missing required property of type string: student_id',
            code: 400
        }
        return false
    }
    else if (typeof tutor_id !='string' || tutor_id.length == 0) {
        req.err = {
            status: false,
            message: 'Missing required property of type string: tutor_id',
            code: 400
        }
        return false
    }
    else{
        return true
    }
}


const updateUsersAndSubject= async (data, lesson) =>{
    data[0].valid = false;
    const tutorDoc = data[1];
    const studentDoc = data[2];
    const subjectDoc = data[3];
    const subjectArray =subjectDoc.lessons;
    const studentArray =studentDoc.lessons;
    const tutorArray =tutorDoc.lessons;
    subjectArray.push(lesson._id);
    studentArray.push(lesson._id);
    tutorArray.push(lesson._id);
    // tutorDoc.lessons.push(lesson._id);
    // subjectDoc.lessons.push(lesson._id);
    const newSubjectDoc = await subjectDoc.updateOne({lessons: subjectArray});
    const newStudentDoc = await studentDoc.updateOne({lessons: studentArray});
    const newTutorDoc = await tutorDoc.updateOne({lessons: tutorArray});
    if (newSubjectDoc.nModified == 1 && newStudentDoc.nModified == 1 && newTutorDoc.nModified == 1) {
        data[0].valid = true;
        return data
    }
    return data;       
}

const deleteLessonHandler = async (req, lessonId)=>{
    let valid = false;
    const doc = await Lesson.findById(lessonId)
    .then( async lesson =>{
        if (!lesson) {
            req.err ={
                status: false,
                message: 'Lesson not found',
                code: 404
            }
            return
        }
        //get the _id student, tutor and subject associated with lesson
        const student = lesson.student;
        const tutor = lesson.tutor;
        const subject = lesson.subject;
        //get individual docs of each
        const studentDoc = await User.findById(student);
        const tutorDoc = await User.findById(tutor);
        const subjectDoc = await Subject.findById(subject);
        //get each array of lessons 
        const studentLessons = studentDoc.lessons;
        const tutorLessons = tutorDoc.lessons;
        const subjectLessons = subjectDoc.lessons;
        //remove the lesson to be deleted
        const filteredStudentLessons = studentLessons.filter( lesson => lesson != lessonId);
        const filteredTutorLessons = tutorLessons.filter( lesson => lesson != lessonId);
        const filteredSubjectLessons = subjectLessons.filter( lesson => lesson != lessonId);
        //update the individual docs
        const result = await studentDoc.updateOne({lessons: filteredStudentLessons});
        const result2 = await tutorDoc.updateOne({lessons: filteredTutorLessons});
        const result3 = await subjectDoc.updateOne({lessons: filteredSubjectLessons});
        if (result.nModified == 1 && result2.nModified == 1 && result3.nModified == 1) {
            valid = true;
        }
        return
    }).catch(err=>{
        req.err ={
            status: false,
            message: 'Invalid id',
            code: 400
        }
        return
    })

    return valid
}

const deleteMultipleLesson = async (lessonArray) =>{
    Lesson.find({ _id: {$in: lessonArray } }).then( async result =>{
        result.forEach(async element =>{
            const tutor = element.tutor
            const student = element.student
            await User.findByIdAndUpdate(
                { _id: tutor}, 
                { $pull: { lessons: { $in: lessonArray } } }, 
                {new: true, useFindAndModify: false}
            ).catch(err => console.log(err))
            await User.findByIdAndUpdate(
                { _id: student}, 
                { $pull: { lessons: { $in: lessonArray } } },
                {new: true, useFindAndModify: false}
            ).catch(err => console.log(err))
        })

        await Lesson.deleteMany({ _id: {$in: lessonArray } }, function(err, result) {
            if (err) {
                console.log(err)
            } 
        });
    }).catch(err => console.log(err))
}


module.exports = {validateRequestData, validateUsers, updateUsersAndSubject, deleteLessonHandler, deleteMultipleLesson}