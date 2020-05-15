const Lesson = require('../models/lesson_model');
const User = require('../models/user_model');
const Subject = require('../models/subject_model');
const {validateUsers, validateRequestData, updateUsersAndSubject} = require('../middleware/lesson_validation');


module.exports= {
    createLesson: async (req, res, next) =>{
        const date = req.body.date
        const tutor_id = req.body.tutor_id;
        const student_id = req.body.student_id;
        const subject_id = req.body.subject_id;
        let valid = validateRequestData(req, res);
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
                const TutorDoc = data[1];
                const studentDoc = data[2];
                const subjectDoc = data[3];
                //create requested lesson
                const lesson = await Lesson.create({date: date, tutors: TutorDoc._id, subject: subjectDoc._id, students: studentDoc._id})
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
    }
}