const User = require("../models/user_model");
const Subject = require('../models/subject_model');
const Category = require('../models/category_model');
const {tutorRegisterValidator} = require('../middleware/user_middleware')

module.exports ={
    createAdmin: (req, res, next)=>{
        const id = req.params.id;
        const isAdmin = req.user.isAdmin;
        if (!isAdmin) {
            return res.status(400).send({
                status: false,
                message: 'Admin level permission needed'
            })            
        }
        User.findById(id)
        .then(
            async user =>{
                if (!user) {
                    return res.status(400).send({
                        status: false,
                        message: "User does not exist. Please send a valid id"
                    })
                }
                else{
                    const role = user.role;
                    if (user.isAdmin || role.toLowerCase() != 'tutor') {
                        return res.status(400).send({
                            status: false,
                            message: 'User is already an Admin or User is not a tutor'
                        })
                    }
                    user.updateOne({isAdmin: true})
                    .then(
                        result => {
                            if (result.nModified === 0) {
                                return res.status(400).send({
                                    status: false,
                                    message: "Failed to create Admin"
                                })
                            }
                            else{
                                return user.save();
                            }
                        }
                    ).then(
                        () => {
                            return res.status(200).send({ 
                                status: true,
                                admin_id: user._id,
                                message: "Admin created successfully"
                            })
                        }
                    ).catch(err => console.log(err))
                }
            }
        ).catch(err =>{
            req.err ={
                status: false,
                message: 'Invalid Id',
                code: 400
            }
            next()
            return
        })
    },


    retrieveAllTutors: (req, res, next) =>{
        if (req.user.isAdmin == false) {
            res.status(403).send({status: false, message: 'Authorization Error'})
        }
        User.find({role: 'tutor'})
        .then(
            user =>{
                if(!user){
                    res.status(404).send({
                        status: false,
                        message: 'No Tutors found'
                    })
                    next()
                    return
                }
                res.status(200).send({
                    Tutors: user
                })
            }
        ).catch(err =>{
            res.status(500).send({status:false, message: err})
        })
    },

    
    retrieveTutorsById: (req, res, next) =>{
        if (req.user.isAdmin == false) {
            res.status(403).send({statu: false, message: 'Authorization error'})
            return
        }
        const id = req.params.id;
        if(!id){
            req.err ={
                status: false,
                message: 'Id not provided',
                code: 400
            }
            next()
            return
        }
        User.findById(id)
        .then(
            user =>{
                res.status(200).send({
                    Tutor: user
                })
            }
        ).catch(err =>{
            res.status(400).send({status: false, message: 'Invalid Id'})
        })
    },


    deactivateTutor: (req, res, next) =>{
        const active = req.body.active;
        const id = req.params.id;
        if(!req.user.isAdmin){
            req.err ={
                status: false,
                message: 'Admin level permission needed',
                code: 403
            }
            next()
            return
        }
        else if(active == null || active == undefined){
            req.err ={
                status: false,
                message:'Missing required property: active',
                code: 400
            }
            next()
            return
        }
        else if(typeof active != "boolean"){
            req.err ={
                status: false,
                message:'Active must be a boolean value',
                code: 400
            }
            next()
            return
        }
        else{
            User.findById(id)
            .then(
                user =>{
                    if(!user){
                        req.err={
                            status: false,
                            message:'User not found',
                            code: 404
                        }
                        next()
                        return
                    }
                    else if(user.role !== 'tutor'){
                        req.err={
                            status: false,
                            message:'You can only activate or deactivate a tutor',
                            code: 405
                        }
                        next()
                        return
                    }
                    user.active = active;
                    user.save()
                    .then(
                        doc =>{
                            if(user.active){
                                res.status(200).send({
                                    id: user._id,
                                    status: true,
                                    message: 'user activated'
                                })
                            }
                            else{
                                res.status(200).send({
                                    id: user._id,
                                    status: true,
                                    message: 'user deactivated'
                                })
                            }
                        }
                    ).catch(err => console.log(err))
                }
            ).catch(err => {
                res.status(400).send({status: false, message: 'Invalid Id'})
            })
        }

    },


    retrieveAllStudents: (req, res, next) =>{
        if (req.user.isAdmin) {
            res.status(403).send({status: false, message: 'Authorization Error'})
            return
        }
        User.find({role: 'student'})
        .then(
            user =>{
                if(!user){
                    res.status(404).send({
                        status: false,
                        message: 'No student found'
                    })
                    next()
                    return
                }
                res.status(200).send({
                    Students: user
                })
            }
        ).catch(err =>{
            res.status(500).send({status: false, message: err})
        })
    },


    registerTutor: async (req, res, next) =>{
        const subjectId = req.body.subject_id;
        const tutorId = req.body.tutor_id;
        if (req.user.role != 'tutor') {
            req.err = {
                status: false,
                message: 'Authorization Error',
                code: 403
            }
            next()
            return
        }
        else if (!subjectId || !tutorId) {
            req.err = {
                status: false,
                message: 'All fields required',
                code: 400
            }
            next()
            return
        }
        //Returns an array of docs for tutor, subject and category
        const docsArray = await tutorRegisterValidator(req, tutorId, subjectId);
        if (docsArray[0].valid == false) {
            next()
        }
        else{
            const tutorDoc = docsArray[1];
            const subjectDoc = docsArray[2];
            const tutorSubjects = docsArray[1].subjects;
            const subjectTutors = docsArray[2].tutors;
            subjectTutors.push(tutorDoc._id);
            tutorSubjects.push(subjectDoc._id);

            const result = await tutorDoc.updateOne({subjects: tutorSubjects});
            const result2 = await subjectDoc.updateOne({tutors: subjectTutors});
            if (result.nModified == 1 && result2.nModified == 1) {
                return res.status(200).send({
                    status:true,
                    tutor_id: tutorDoc._id,
                    subject_id: subjectDoc._id,
                    message: 'Registered tutor'
                })
            }
            else{
                req.err ={
                    status: false,
                    message: 'Error registering subject',
                    code: 500
                }
                next()
                return
            }
        }
    },


    retrieveRegisteredSubjects: (req, res, next)=>{
        if (req.user.role != 'tutor') {
            req.err ={
                status: false,
                message: 'Authorization Error',
                code: 403
            }
            next()
            return
        }
        const tutorId = req.params.tutor;
        if (!tutorId) {
            req.err = {
                status: false,
                message: 'Missing required parameter: {:tutor} ',
                code: 400
            }
            next();
            return
        }
        User.findById(tutorId)
        .then(
            tutor =>{
                if (!tutor) {
                    req.err ={
                        status: false,
                        message: 'Tutor not found',
                        code: 404
                    }
                    next()
                    return
                }
                tutor.populate('subjects',(err, doc)=>{
                    if (err) {
                        res.status(500).send({
                            status: false,
                            message: 'Error retreiving registered subjects'
                        });
                    }
                    else{
                        const subjects = doc.subjects;
                        res.status(200).send({
                            status: true,
                            Subjects: subjects
                        });
                    }
                })
            }
        ).catch( err =>{
            req.err = {
                status: false,
                message: 'Invalid Id',
                code: 403
            }
            next();
            return
        })
    },

    updateRegisteredSubject: async (req, res, next) =>{
        const subjectId = req.body.subject_id;
        const tutorId = req.body.tutor_id;
        const subjectTitle = req.body.subject_title;
        const description = req.body.subject_description;
        if (req.user.role != 'tutor') {
            res.status(403).send({status: false, message:'Authorization Error'})
        }
        if (!subjectTitle || !subjectId || !tutorId || !description) {
            req.err = {
                status: false,
                message: 'All fields required',
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
                    message: 'Tutor is not registered to take this subject',
                    code:404
                }
                next()
                return
            }
            const subjectDoc = await  Subject.findByIdAndUpdate(subjectId, 
                {subjectTitle: subjectTitle, description: description}, 
                {new: true, useFindAndModify: false});
            
            if (subjectDoc.subjectTitle == subjectTitle && subjectDoc.description == description) {
                res.status(200).send({
                    status: true,
                    subject_id: subjectDoc._id,
                    message: 'Updated subject successfully'
                })
            }
            else{
                res.status(500).send({
                    status: false,
                    message:'Error updating subject'
                })
            }
        }
        ).catch(err => {
            req.err ={
                status: false,
                message: 'Invalid Id sent',
                code: 400
            }
            next()
            return
        })
    },


    retrieveTutorsBySubject:  async (req, res, next) =>{
        if (req.user.role != 'student') {
            res.status(403).send({status: false, message: 'Authorization Error'})
        }
        const subjectId = req.params.subjectId;
        Subject.findOne({_id: subjectId})
        .then(
            async subject =>{
                if (!subject) {
                    req.err = {
                        status: false,
                        message: 'Subject not found',
                        code: 404
                    }
                    next();
                    return
                }
                subject.populate('tutors', (err, doc)=>{
                    if (err) {
                        req.err ={
                            status: false,
                            message: 'Error retrieving data',
                            code: 500
                        }
                        next()
                    }
                    else{
                        res.status(200).send({
                            status: true,
                            Tutors: doc.tutors
                        })
                    }

                })
            }
        ).catch(err => {
            req.err = {
                status: false,
                message: 'Invalid id',
                code: 400
            }
            next()})
    },


    retrieveTutorByName: (req, res, next) =>{
        const tutorName = req.params.tutorName;
        if (!tutorName) {
            res.status(400).send({
                status:false,
                message: 'Missing required search parameter'
            })
        }
        User.find({}, 'firstName role')
        .then( tutors =>{
            const tutorArray =[];
            tutors.forEach(element=>{
                if(element.firstName.toLowerCase().includes(tutorName.toLowerCase()) && element.role =='tutor'){
                    tutorArray.push(element)
                }
            })
            if (tutorArray.length == 0) {
                return res.status(404).send({
                    Result: 'No match found'
                })
            }
            tutorArray.sort((a, b) => (a.firstName > b.firstName) ? 1 : 
            (a.firstName === b.firstName) ? ((a.firstName > b.firstName) ? 1 : -1) : -1 );
            return res.status(200).send({
                Result: tutorArray
            })
        }).catch( err =>{
            res.status(500).send({status: false, message: err});
        })
    },



}
