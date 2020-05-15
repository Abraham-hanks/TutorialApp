const Subject = require('../models/subject_model');
const Category = require('../models/category_model');

module.exports ={
    createSubject: (req, res, next) =>{
        const subjectTitle = req.body.subject_title;
        const categoryId = req.body.category_id;
        if (!req.user.isAdmin){
            res.err = {
                status: false,
                message: 'Admin authorization needed',
                code: 403
            }
            next();
            return
        }
        else if (!subjectTitle || !categoryId) {
            req.err = {
                status: false,
                message: 'All fields are required',
                code: 400
            }
            next();
            return
        }
        else if (typeof subjectTitle !='string') {
            req.err = {
                status: false,
                message: 'Subject title must be a string',
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
                        console.log(element.subjectTitle, subjectTitle)
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
                    console.log(subjectExistsInCategory)
                    if (subjectExistsInCategory) {
                        next()
                        return
                    }
                    else{
                        Subject.create({subjectTitle: subjectTitle, category: doc._id})
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
                                ).catch(err => console.log(err))
                            }
                        ).catch(err => console.log(err))
                    }
                }
            ).catch(err => console.log(err))
        }
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
        ).catch(err => {console.log(err)})
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
                    Result: 'No subject found'
                })
            }
            subjectsArray.sort((a, b) => (a.subjectTitle > b.subjectTitle) ? 1 : 
            (a.subjectTitle === b.subjectTitle) ? ((a.subjectTitle > b.subjectTitle) ? 1 : -1) : -1 );
            return res.status(200).send({
                Result: subjectsArray
            })
        }).catch( err =>{
            console.log(err)
        })
    }

}