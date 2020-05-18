const Category = require('../models/category_model');
const Subject = require('../models/subject_model');
const {deleteMultipleSubjects} = require('../middleware/subject_middleware');

module.exports ={
    retrieveCategory: (req, res, next) =>{
        Category.find({},'categoryName')
        .then(
            category =>{
                if(category){
                    res.status(200).send({categories: category});
                }
                else{
                    req.err = {
                        status: false,
                        message: 'Categories do not exist',
                        code: 404
                    }
                    next()
                    return
                }
            }
        ).catch(err => {res.send(500).send({status: false, message: err})});
    },

    createCategory: (req, res, next) =>{
        if (!req.user.isAdmin){
            res.err = {
                status: false,
                message: 'Admin authorization needed',
                code: 403
            }
            next();
            return
        }
        else if (!req.body.category_name || !req.body.subjects) {
            req.err = {
                status: false,
                message: 'Category must have a name and subjects',
                code: 400
            }
            next();
            return
        }

        else if(!Array.isArray(req.body.subjects) || !req.body.subjects.length) {
            req.err = {
                status: false,
                message: 'Missing required property at subjects',
                code: 400
            }
            next();
            return
        }
        else if (!req.body.subjects[0].subject_title) {
            req.err = {
                status: false,
                message: 'Missing required property: subject title at subjects',
                code: 400
            }
            next();
            return
        }
        const categoryName = req.body.category_name;
        const subjects = req.body.subjects;
        Category.findOne({categoryName})
        .then( category =>{
            if (category) {
                req.err = {
                    status: false, 
                    message: "This category already exists",
                    code: 403
                }
                next();
                return 
            }
            Category.create({categoryName})
            .then(
                async category => {
                    const dataArray = []
                    subjects.forEach( element =>{
                        let data = {};
                        data.category = category._id;
                        data.subjectTitle = element.subject_title;
                        dataArray.push(data);
                    })
                    Subject.create(dataArray)
                    .then(
                        (subject)=>{
                            const createdSubjects = [];
                            subject.forEach(element =>{
                                createdSubjects.push(element._id);
                            })
                            category.updateOne({subjects: createdSubjects})
                            .then(
                                res.status(200).send({
                                    status: true,
                                    category_Id: category._id,
                                    message: 'Created category successfully'
                                })
                            ).catch(err => console.log(err))
                        }
                    ).catch(err => console.log(err))                    
                }
            ).catch(err => console.log(err))
        }).catch(err => console.log(err))
    },


    updateCategory: (req, res, next) =>{
        if (!req.user.isAdmin){
            req.err = {
                status: false,
                message: 'Admin authorization needed',
                code: 403
            }
            next();
            return
        }
        else if (!req.body.category_name || !req.body.category_id) {
            req.err = {
                status: false,
                message: 'Missing required fields',
                code: 400
            }
            next();
            return
        }
        const category_id = req.body.category_id
        const categoryName = req.body.category_name;
        Category.findOne({_id: category_id})
        .then( async category =>{
            if (!category) {
                req.err = {
                    status: false, 
                    message: "This category does not exist",
                    code: 403
                }
                next();
                return 
            }
            const result = await category.updateOne({categoryName: categoryName})
            if (result.nModified == 1) {
                res.status(200).send({
                    status: true,
                    category_Id: category._id,
                    message: 'Updated category successfully'
                })
            }
            else{
                res.status(500).send({
                    status: false,
                    message: 'Error updating Category'
                })
            }
        }).catch(err => {
            req.err ={
                status: false,
                message: 'Invalid id',
                code: 400
            }
        })
    },

    deleteCategory: async (req, res, next)=>{
        const categoryId = req.params.id;
        if (req.user.isAdmin == false) {
            req.err ={
                status: false,
                message: 'Authorization Error',
                code: 403
            }
            next()
            return
        }
        else if (!categoryId) {
            req.err ={
                status: false,
                message: 'Missing id parameter',
                code: 400
            }
            next()
            return
        }

        Category.findById(categoryId).then(
            async category =>{
                if (!category) {
                    req.err ={
                        status: false,
                        message: 'Category not found',
                        code: 403
                    }
                    next()
                    return
                }
                const subjectArray = category.subjects;
                await deleteMultipleSubjects(subjectArray);

                Category.deleteOne({_id: category._id}, function(err, result){
                    if (err) {
                        res.status(500).send({status: false, message:err})
                    }
                    else{
                        res.status(200).send({status: true, category_id: category._id, message:'Category deleted successfully'})
                    }
                })

            }
        ).catch(err =>{
            req.err ={
                status: false,
                message: 'Invalid id parameter',
                code: 400
            }
            next()
            return
        })
    }


}
