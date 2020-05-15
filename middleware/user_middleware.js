const Subject = require('../models/subject_model');
const Category = require('../models/category_model');
const User = require('../models/user_model');


const tutorRegisterValidator = async(req, tutorId, subjectId, categoryId)=>{
    const docsArray = [{valid: false}]
    const find = await User.findById(tutorId)
    .then(
        async tutor =>{
            if (!tutor) {
                req.err = {
                    status: false,
                    message: 'No tutor found',
                    code: 404
                }
                return
            }
            else if (tutor.role != 'tutor') {
                req.err = {
                    status: false,
                    message: 'User is not a tutor',
                    code: 403
                }
                return
            }
            docsArray.push(tutor);
            const findCat = await Category.findById(categoryId)
            .then(
                async category =>{
                    if (!category) {
                        req.err = {
                            status: false,
                            message: 'Category not found',
                            code: 404
                        }            
                        return                
                    }
                    let validSubject = false
                    const subjectArray = category.subjects;
                    subjectArray.forEach(element => {
                        if(element == subjectId){
                            validSubject = true
                        }
                    });
                    if (!validSubject) {
                        req.err ={
                            status: false,
                            message: 'Subject does not belong to this category',
                            code: 405
                        }
                        return
                    }
                    docsArray.push(category)
                    const findSub = await Subject.findById(subjectId)
                    .then(
                        subject =>{
                            if (!subject) {
                                req.err = {
                                    status: false,
                                    message: 'Subject not found',
                                    code: 404
                                }  
                                return
                            }
                            let tutorRegistered = false;
                            const subjectTutors = subject.tutors;
                            subjectTutors.forEach( element=> {
                                if (element == tutorId) {
                                    tutorRegistered = true
                                }
                            })
                            if (tutorRegistered) {
                                req.err ={
                                    status: false,
                                    message: 'Tutor is already registered',
                                    code: 404
                                }
                                return
                            }
                            else{
                                docsArray.push(subject)
                                docsArray[0].valid = true;
                                return
                            }
                        }
                    ).catch(err => {
                        req.err = {
                            status: false,
                            message: 'Invalid Subject Id',
                            code: 404
                        }
                        return
                    })
                }
            ).catch(err => {
                console.log(err);
                req.err ={
                    status: false,
                    message: 'Invalid category Id',
                    code:'404'
                }
                return
            })
        }
    ).catch(err => {
        req.err = {
            status: false,
            message: 'Invalid User Id',
            code: 404
        }
        return
    })

    return docsArray;
}






module.exports = {tutorRegisterValidator}