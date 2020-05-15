const User = require("../models/user_model");
const Subject = require('../models/subject_model');
const Category = require('../models/category_model');
const {tutorRegisterValidator} = require('../middleware/user_middleware')

module.exports ={
    createAdmin: (req, res, next)=>{
        const id = req.body.id;
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
                    user.updateOne({isAdmin: true, role: 'Admin'})
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
                                message: "Admin created successfully"
                            })
                        }
                    ).catch(err => console.log(err))
                }
            }
        )
    },


    retrieveAllTutors: (req, res, next) =>{
        User.find({role: 'tutor'},'_id isAdmin active categories subjects lessons email role userName firstName lastName')
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
        ).catch(err =>{console.log(err)})
    },

    
    retrieveTutorsById: (req, res, next) =>{
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
        User.findById(id, '_id isAdmin active categories subjects lessons email role userName firstName lastName')
        .then(
            user =>{
                res.status(200).send({
                    Tutor: user
                })
            }
        )
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
                            message:'You can only deactivate a tutor',
                            code: 405
                        }
                        next()
                        return
                    }
                    user.active = active;
                    user.save()
                    .then(
                        doc =>{
                            if(active){
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
            ).catch(err => console.log(err))
        }

    },


    retrieveAllStudents: (req, res, next) =>{
        User.find({role: 'student'},'_id isAdmin active categories subjects lessons email role userName firstName lastName')
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
        ).catch(err =>{console.log(err)})
    },


    registerTutor: async (req, res, next) =>{
        const categoryId = req.body.category_id;
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
        else if (!categoryId || !subjectId || !tutorId) {
            req.err = {
                status: false,
                message: 'All fields required',
                code: 400
            }
            next()
            return
        }
        //Returns an array of docs for tutor, subject and category
        const docsArray = await tutorRegisterValidator(req, tutorId, subjectId, categoryId);
        if (docsArray[0].valid == false) {
            next()
        }
        else{
            const tutorDoc = docsArray[1];
            const subjectDoc = docsArray[3];
            const tutorSubjects = docsArray[1].subjects;
            const subjectTutors = docsArray[3].tutors;
            subjectTutors.push(tutorDoc._id);
            tutorSubjects.push(subjectDoc._id);

            await tutorDoc.updateOne({subjects: tutorSubjects})
            await subjectDoc.updateOne({tutors: subjectTutors})
            return res.status(200).send({
                status:true,
                tutor_id: tutorDoc._id,
                subject_id: subjectDoc._id,
                message: 'Registered tutor'
            })
        }
    },


    retrieveRegisteredSubjects: (req, res, next)=>{
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
                tutor.populate('subjects',(err, doc)=>{
                    if (err) {
                        console.log(err)
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
                message: 'Tutor not found',
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
        const description = req.body.subject_description
        if (!categoryName || !subjectId || !tutorId) {
            req.err = {
                status: false,
                message: 'All fields required',
                code: 400
            }
            next()
            return
        }
        const docsArray = await tutorRegisterValidator(req, tutorId, subjectId, categoryName);
        if (docsArray[0].valid == false) {
            next()
        }
        else{

        }
    },


    retrieveTutorsBySubject:  async (req, res, next) =>{
        const categoryName = req.params.category;
        const subjectId = req.params.subjectId;
        Category.findOne({categoryName})
        .then(
            async category =>{
                if (!category) {
                    req.err = {
                        status: false,
                        message: 'Category not found',
                        code: 404
                    }
                    next();
                    return
                }
                category.populate('subjects', (err, doc)=>{
                    if (err) {
                        console.log(err)
                    }
                    else{
                        console.log(doc)
                    }

                })
            }
        ).catch(err => console.log(err))
    },


    retrieveTutorByName: (req, res, next) =>{
        const tutorName = req.params.tutorName;
        if (!tutorName) {
            res.status(400).send({
                status:false,
                message: 'Missing required search parameter'
            })
        }
        User.find({}, 'firstName')
        .then( tutors =>{
            const tutorArray =[];
            tutors.forEach(element=>{
                if(element.firstName.toLowerCase().includes(tutorName.toLowerCase())){
                    tutorArray.push(element)
                }
            })
            if (tutorArray.length == 0) {
                return res.status(404).send({
                    Result: 'No tutor found'
                })
            }
            tutorArray.sort((a, b) => (a.firstName > b.firstName) ? 1 : 
            (a.firstName === b.firstName) ? ((a.firstName > b.firstName) ? 1 : -1) : -1 );
            return res.status(200).send({
                Result: tutorArray
            })
        }).catch( err =>{
            console.log(err)
        })
    },



}
