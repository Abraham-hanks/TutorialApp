const User = require('../models/user_model');
const Subject = require('../models/subject_model');
const Lesson = require('../models/lesson_model');
const {validateUsers, validateRequestData, updateUsersAndSubject, deleteLessonHandler} = require('../middleware/lesson_validation');


module.exports= {
    createLesson: async (req, res, next) =>{
        if (req.user.role !='student' && req.user.isAdmin == false) {
            req.err = {
                status: false,
                message: 'Authorization Error',
                code: 403
            }
            next()
            return
        }
        const date = req.body.date
        const tutorId = req.body.tutor_id;
        const studentId = req.body.student_id;
        const subjectId = req.body.subject_id;
        const valid = validateRequestData(req,date, tutorId, studentId, subjectId);
        if (!valid) {
            next()
            return
        }
        else{
            const data = await validateUsers(req, res);
            if (data[0].valid == false) {
                next()
                return
            }
            else{
                const tutorDoc = data[1];
                const studentDoc = data[2];
                const subjectDoc = data[3];
                //create requested lesson
                const lesson = await Lesson.create({date: date, tutor: tutorDoc._id, subject: subjectDoc._id, student: studentDoc._id})
                .then( async lessonDoc =>{
                    if (!lessonDoc) {
                        req.err= {
                            status: false,
                            message: 'Error in booking lesson',
                            status: 500
                        }
                        next();
                        return
                    }
                    //update the tutor, student and subject docs with lesson
                    const updateUsers = await updateUsersAndSubject(data, lessonDoc);
                    if (updateUsers[0].valid == false) {
                        req.err = {
                            status: false,
                            message: 'Error in saving booked lesson',
                            code: 500
                        }
                        next();
                        return
                    }
                    else{
                        res.status(200).send({
                            status: true,
                            lesson_id: lessonDoc._id,
                            message: 'Successfully booked lesson'
                        });
                    }
                }).catch(err => {
                    req.err= {
                        status: false,
                        message: 'Error in booking lesson',
                        status: 500
                    }
                    next();
                    console.log(err)
                    return }
                )
            }
        }
    },

    retrieveAllLessons: (req, res, next)=>{
        if (req.user.isAdmin == false) {
            req.err = {
                status: false,
                message: 'Authorization Error',
                code: 403
            }
            next()
            return
        }
        Lesson.find({})
        .then( lesson => {
            if (lesson.length == 0) {
                req.err = {
                    status: false,
                    lessons: lesson,
                    message: 'No lesson(s) found',
                    code: 404
                }
                next()
                return
            }
            else{
                res.status(200).send({
                    status: true,
                    lessons: lesson
                })
                return
            }
        }).catch(err => {
            req.err = {
                status: false,
                message: err,
                code: 500
            }
            next()
        })
    },

    retrieveLessonById: (req, res, next) =>{
        if (req.user.isAdmin == false) {
            req.err = {
                status: false,
                message: 'Authorization Error',
                code: 403
            }
            next()
            return
        }
        const lessonId = req.params.id;
        Lesson.find({_id: lessonId})
        .then( lesson => {
            if (!lesson) {
                req.err = {
                    status: false,
                    message: 'No lesson found',
                    code: 404
                }
                next()
                return
            }
            else{
                res.status(200).send({
                    status: true,
                    lesson: lesson
                })
                return
            }
        })
        
    },

    updateLesson: async (req, res, next) =>{
        if (req.user.isAdmin == false) {
            req.err = {
                status: false,
                message: 'Authorization Error',
                code: 403
            }
            next()
            return
        }
        const date = req.body.date;
        const lessonId = req.params.id;
        const dateRegEx = RegExp(/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/);
        if (!dateRegEx.test(date)) {
            req.err ={
                status: false,
                message:'Invalid date or date format',
                code: 400
            }
            next()
            return
        }
        const updatedLesson = await  Lesson.findByIdAndUpdate(lessonId, {date: date}, 
            {new: true, useFindAndModify: false});
        if (updatedLesson.date == date) {
            res.status(200).send({
                status: true,
                lesson: updatedLesson,
                message: "Update successful"
            })
        }
        else{
            req.err ={
                status: false,
                message: 'Error updating lesson',
                code: 500
            }
            next()
            return
        }
    },

    deleteLesson: async (req, res, next) =>{
        if (req.user.isAdmin == false) {
            req.err = {
                status: false,
                message: 'Authorization Error',
                code: 403
            }
            next()
            return
        }
        const lessonId = req.params.id;
        const valid = await deleteLessonHandler(req, lessonId)
        if (!valid) {
            // req.err ={
            //     status: false,
            //     message: 'Error deleting lesson',
            //     code: 500
            // }
            next()
            return
        }
        else{
           Lesson.findOneAndDelete({_id: lessonId}, (err)=>{
               if (err) {
                   console.log(err)
                   req.err ={
                    status: false,
                    message: 'Error deleting lesson',
                    code: 500}
                    next()
                    return
                }
                else{
                    res.status(200).send({
                        status: true,
                        lesson_id: lessonId,
                        message: 'Successfully deleted lesson'
                    })
                    return true
                }
            });
        }
    }
}