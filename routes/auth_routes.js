const router = require("express").Router();
const { auth, signUp, login, generateAPI_KEY, auth_API_Key } = require("../controllers/auth_controller")
const {retrieveCategory, createCategory, updateCategory} = require('../controllers/category_controller');
const { createAdmin, retrieveTutorsBySubject, retrieveTutorByName, retrieveAllTutors, retrieveTutorsById, deactivateTutor, retrieveAllStudents, registerTutor, retrieveRegisteredSubjects } = require('../controllers/user_controller');
const { createSubject, updateSubject, retrieveSubjects, retrieveSubjectsById, retrieveSubjectsByName} = require('../controllers/subject_controller');
const {createLesson} = require('../controllers/lesson_controller');
const { errorResponse} = require('../controllers/error_controller');

//General get route
router.get("/", (req, res) =>{
    res.send("This is the Tutoring web app API. You have now entered express");
});

//Route to get an API Key
router.get('/api/key/:token', auth, generateAPI_KEY, errorResponse);
//Route to get all tutors
router.get('/user/tutors', auth_API_Key, retrieveAllTutors, errorResponse);
//Route to get all tutors by id
router.get('/user/tutors/:id', auth_API_Key, retrieveTutorsById, errorResponse);
//Route to get subjects registered by tutor
router.get('/user/:tutor/subjects', auth_API_Key, retrieveRegisteredSubjects, errorResponse);
//Route to get tutor by name
router.get('/user/tutors/search/:tutorName', auth_API_Key, retrieveTutorByName, errorResponse);
//Route to get all students
router.get('/user/students', auth_API_Key, retrieveAllStudents, errorResponse);
//Route to get all categories
router.get('/category', auth_API_Key, retrieveCategory, errorResponse);
//Route to get subjects by category
router.get('/:categoryId/subjects', auth_API_Key, retrieveSubjects, errorResponse);
//Route to get subjects by id
router.get('/category/subjects/:id', auth_API_Key, retrieveSubjectsById, errorResponse);
//Route to get subject by name
router.get('/category/subjects/search/:subjectName', auth_API_Key, retrieveSubjectsByName, errorResponse);
//Route to get tutors taking a subject in a category
router.get('/:category/:subjectId/tutors', auth_API_Key, retrieveTutorsBySubject, errorResponse);


//Route to create a user account
router.post("/signup", signUp, errorResponse);
//Route to login a user
router.post("/login", login, errorResponse);
//Register a tutor for a subject
router.post('/user/tutors/subject', auth_API_Key, registerTutor, errorResponse)
//Route to create a category
router.post('/category', auth_API_Key, createCategory, errorResponse);
//Route to create a subject in a category
router.post('/category/subjects', auth_API_Key, createSubject, errorResponse);
//Route to create a lesson
router.post('/category/subjects/lesson', auth_API_Key, createLesson, errorResponse);


//Route to update a category
router.put('/category', auth_API_Key, updateCategory, errorResponse);

//Route to update a tutor(specifically deactivate or activate a tutor)
router.patch('/user/tutors/:id', auth_API_Key, deactivateTutor, errorResponse);
//Register a tutor for a subject
router.patch('/user/tutors/subject', auth_API_Key, updateRegisteredSubject, errorResponse)


// router.post('/admin/add', auth, createAdmin );

// router.put('/admin/:category/subject',auth, updateSubject)

//DELETE Routes
router.delete('/user/tutors/')


module.exports = router;