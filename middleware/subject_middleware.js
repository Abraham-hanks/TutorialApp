const Subject = require('../models/subject_model');
const User = require('../models/user_model');
const {deleteMultipleLesson} = require('../middleware/lesson_validation')

const deleteMultipleSubjects = async (subjectArray)=>{
    Subject.find({_id: {$in: subjectArray } }).then( async subject =>{
        subject.forEach( async element=>{
            const tutorArray = element.tutors;
            const lessonArray = element.lessons;
            await User.updateMany({_id: {$in: tutorArray } },  { $pull: { subjects: element._id } })
            .catch(err =>{
                console.log(err,'============Updating tutor by subject');
            })
            await deleteMultipleLesson(lessonArray)
        })

        await Subject.deleteMany({ _id: {$in: subjectArray } }, function(err, result) {
            if (err) {
                console.log(err)
            } 
        });
        
    }).catch(err =>console.log(err))
}

module.exports= {deleteMultipleSubjects}