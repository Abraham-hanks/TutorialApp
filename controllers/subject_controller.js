const Subject = require('../models/subject_model');
const Category = require('../models/category_model');
const User = require('../models/user_model');
const {deleteMultipleLesson} = require('../middleware/lesson_validation')

module.exports ={
    createSubject: (req, res, next) =>{
        const subjectTitle = req.body.subject_title;
        const categoryId = req.body.category_id;
        const description = req.body.subject_description;
        if (!req.user.isAdmin){
            res.err = {
                status: false,
                message: 'Admin authorization needed',
                code: 403
            }
            next();
            return
        }
        else if (!subjectTitle || !categoryId || !description) {
            req.err = {
                status: false,
                message: 'All fields are required',
                code: 400
            }
            next();
            return
        }
        else if (typeof subjectTitle !='string' || typeof description != 'string') {
            req.err = {
                status: false,
                message: 'Subject title and description must be of type String',
                code: 400
            }
            next();
            return
        }
        else{
            Category.findOne({_id: categoryId})
            .then(
               async doc => {
                    if (!doc) {
                        req.err = {
                            status: false,
                            message:'Category not found',
                            code: 404
                        }
                        next();
                        return
                    }
                    let subjectExistsInCategory =false;
                    await doc.populate('subjects').execPopulate();
                    const categorySubjects = doc.subjects 
                    categorySubjects.forEach(element => {
                        if(element.subjectTitle == subjectTitle){
                            req.err = {
                                status: false,
                                message:'Subject already exists in this Category',
                                code: 404
                            }
                            subjectExistsInCategory = true
                            return
                        }
                    })
                    if (subjectExistsInCategory) {
                        next()
                        return
                    }
                    else{
                        Subject.create({subjectTitle: subjectTitle, category: doc._id, description: description})
                        .then(
                            subject =>{
                                categorySubjects.push(subject._id);
                                doc.updateOne({subjects: categorySubjects})
                                .then(
                                    res.status(200).send({
                                        status: true,
                                        subjectId: subject._id,
                                        message: 'Subject created successfully'
                                    })
                                ).catch(err => res.status(500).send({status: false, message: err}))
                            }
                        ).catch(err => res.status(500).send({status: false, message: err}))
                    }
                }
            ).catch(err => {
                req.err ={
                    status: false,
                    message: 'Invalid id',
                    code: 400
                }
                next()
                console.log(err)
            })
        }
    },


    updateSubject: (req, res, next) =>{
        if (req.user.isAdmin == false) {
            res.status(403).send({
                status: false,
                message: 'Authorization Error'
            })
        }
        const subjectId = req.body.subject_id;
        const subjectTitle = req.body.subject_title;
        const description = req.body.subject_description;
        if (!subjectTitle || !subjectId || !description) {
            req.err = {
                status: false,
                message: 'All fields required',
                code: 400
            }
            next()
            return
        }
        Subject.findById(subjectId)
        .then( async subject =>{
            if (!subject) {
                req.err ={
                    status: false,
                    message: 'Subject not found',
                    code: 404
                }
                next()
                return
            }
            const result = await subject.updateOne({subjectTitle: subjectTitle, description: description})
            if (result.nModified == 1) {
                res.status(200).send({
                    status: true,
                    subject_id: subject._id,
                    message: 'Update successful'
                })
            }
            else{
                req.err ={
                    status: false,
                    message: 'Error updating subject',
                    code: 500
                }
                next();
                return
            }
        }).catch(err =>{
            console.log(err);
            req.err ={
                status: false,
                message: 'Invalid Id sent',
                code: 400
            }
            next()
            return
        })
    },

    retrieveSubjects: (req, res, next)=>{
        const categoryId = req.params.categoryId;
        Category.findOne({_id: categoryId})
        .then(
            category =>{
                if(category){
                    const categorySubjects = category.subjects;
                    if (categorySubjects.length != 0){
                        category.populate('subjects', (err, populatedCategory)=>{
                            if (err) {
                                console.log(err)
                            }
                            return res.status(200).send({
                                category_id: category._id,
                                subjects: populatedCategory.subjects
                            })
                        })
                    }
                    else{
                        req.err = {
                            status: false,
                            message:'Subjects do not exist for this category',
                            code: 404
                        }
                        next();
                        return
                    }
                }
                else{
                    req.err = {
                        status: false,
                        message:'This category does not exist',
                        code: 404
                    }
                    next();
                    return
                }
            }
        ).catch(err =>{ 
            req.err = {
                status: false,
                message:'Invalid Category Id',
                code: 405
            }
            next();
            return
        })
    },

    retrieveSubjectsById: (req, res, next) =>{
        const id = req.params.id;
        if(!id){
            req.err = {
                status: false,
                message: 'Id parameter not provided',
                code: 404
            }
            next()
            return
        }
        Subject.findById(id)
        .then(
            subject =>{
                if(!subject){
                    req.err = {
                        status: false,
                        message: 'Subject not found',
                        code: 404
                    }
                    next()
                    return
                }
               else{
                   res.status(200).send({
                       status: true,
                       subject: subject
                   })
               }
            }
        ).catch(err => {
            res.status(400).send({status: false, message:'Invalid Id'})
            console.log(err)})
    },


    retrieveSubjectsByName: (req, res, next) =>{
        const subjectName = req.params.subjectName;
        if (!subjectName) {
            res.status(400).send({
                status: false,
                message:'Misssing required search parameter'
            })
        }
        Subject.find({}, 'subjectTitle')
        .then( subjects =>{
            const subjectsArray =[];
            subjects.forEach(element=>{
                if(element.subjectTitle.toLowerCase().includes(subjectName.toLowerCase())){
                    subjectsArray.push(element)
                }
            })
            if (subjectsArray.length == 0) {
                return res.status(404).send({
                    Result: 'No match found'
                })
            }
            subjectsArray.sort((a, b) => (a.subjectTitle > b.subjectTitle) ? 1 : 
            (a.subjectTitle === b.subjectTitle) ? ((a.subjectTitle > b.subjectTitle) ? 1 : -1) : -1 );
            return res.status(200).send({
                Result: subjectsArray
            })
        }).catch( err =>{
            res.status(500).send({status: false, message: err})
        })
    },

    deleteSubject: (req,res, next) =>{
        if (req.user.isAdmin == false){
            res.status(403).send({status: false, message:'Authorization Error'})
        }
        const subjectId = req.params.id;
        Subject.findById(subjectId).then( async subject =>{
            await Category.findByIdAndUpdate({ _id: subject.category}, 
                { $pull: { subjects: subject._id } }, 
                {new: true, useFindAndModify: false}
            );
            const tutorArray = subject.tutors;
            const lessonArray = subject.lessons;
            tutorArray.forEach(async element=>{
                await User.findByIdAndUpdate({ _id: element}, 
                    { $pull: { subjects: subject._id } }, {new: true, useFindAndModify: false})
            })
            await deleteMultipleLesson(lessonArray);
            
            Subject.deleteOne({_id: subject._id}, function(err, result){
                if (err) {
                    res.status(500).send({status: false, message:err})
                }
                else{
                    res.status(200).send({status: true, subject_id: subject._id, message:'Subject deleted successfully'})
                }
            })
            
        }).catch(err => res.send({status:false, message: 'Invalid id'}))
    },

    deleteRegisteredSubject: async (req,res, next) =>{
        const subjectId = req.params.subjectId;
        const tutorId = req.params.tutorId;
        if (!subjectId || !tutorId) {
            req.err ={
                status: false,
                message: 'Missing required parameter',
                code: 400
            }
            next()
            return
        }
        User.findById(tutorId)
        .then( async tutor  =>{
            if(!tutor){
                req.err = {
                    status: false,
                    message: 'Tutor not found',
                    code: 404
                }
                next()
                return
            }
            else if (tutor.role != 'tutor') {
                req.err = {
                    status: false,
                    message: 'Id does not belong to a tutor',
                    code: 404
                }
                next()
                return
            }
            let validSubject = false
            const tutorSubjects = tutor.subjects
            tutorSubjects.forEach(element =>{
                if (element == subjectId) {
                    validSubject = true
                    return
                }
            })
            if (!validSubject) {
                req.err ={
                    status: false,
                    message: 'Tutor has not registered this subject',
                    code:404
                }
                next()
                return
            }
            const filteredTutorSubjects = tutorSubjects.filter( subject => subject != subjectId); 
            Subject.findById(subjectId)
            .then( async subject =>{
                const subjectTutors = subject.tutors;
                const filteredSubjectTutors = subjectTutors.filter( tutor => tutor != tutorId);
                const result = await tutor.updateOne({subjects: filteredTutorSubjects});
                const result2 = await subject.updateOne({tutors: filteredSubjectTutors});
                if (result.nModified == 1 && result2.nModified == 1) {
                    res.status(200).send({
                        status: true,
                        subject_id: subject._id,
                        message: 'Successfully Unregistered subject'
                    })
                }
                else{
                    res.status(500).send({
                        status: false,
                        message: 'Error unregistering Subject'
                    })
                }
            }
            ).catch(err =>{
                req.err ={
                    status: false,
                    message: 'Invalid Id sent',
                    code: 400
                }
                next()
                return
            })
        }
        ).catch(err => {
            console.log(err);
            req.err ={
                status: false,
                message: 'Invalid Id sent',
                code: 400
            }
            next()
            return
        })
    }


}