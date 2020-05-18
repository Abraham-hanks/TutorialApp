const router = require("express").Router();
const { auth, signUp, login, generateAPI_KEY, auth_API_Key } = require("../controllers/auth_controller")
const {retrieveCategory, createCategory, updateCategory, deleteCategory} = require('../controllers/category_controller');
const { createAdmin, retrieveTutorsBySubject, updateRegisteredSubject, retrieveTutorByName, retrieveAllTutors, retrieveTutorsById, deactivateTutor, retrieveAllStudents, registerTutor, retrieveRegisteredSubjects } = require('../controllers/user_controller');
const { createSubject, deleteRegisteredSubject, deleteSubject, updateSubject, retrieveSubjects, retrieveSubjectsById, retrieveSubjectsByName} = require('../controllers/subject_controller');
const {createLesson, updateLesson, retrieveAllLessons, retrieveLessonById, deleteLesson} = require('../controllers/lesson_controller');
const { errorResponse} = require('../controllers/error_controller');

//General get route
router.get("/", (req, res) =>{
    res.send("This is the Tutoring web app API. You have now entered express");
});

//Route to get an API Key
router.get('/api/key/:token', auth, generateAPI_KEY, errorResponse);
//Route to get all tutors
router.get('/user/tutor', auth_API_Key, retrieveAllTutors, errorResponse);
//Route to get all tutors by id
router.get('/user/tutor/:id', auth_API_Key, retrieveTutorsById, errorResponse);
//Route to get subjects registered by tutor
router.get('/user/:tutor/subjects', auth_API_Key, retrieveRegisteredSubjects, errorResponse);
//Route to get tutor by name
router.get('/user/tutor/search/:tutorName', auth_API_Key, retrieveTutorByName, errorResponse);
//Route to get all students
router.get('/user/student', auth_API_Key, retrieveAllStudents, errorResponse);
//Route to get all categories
router.get('/category', auth_API_Key, retrieveCategory, errorResponse);
//Route to get subjects by category
router.get('/:categoryId/subject', auth_API_Key, retrieveSubjects, errorResponse);
//Route to get subjects by id
router.get('/category/subject/:id', auth_API_Key, retrieveSubjectsById, errorResponse);
//Route to get subject by name
router.get('/category/subject/search/:subjectName', auth_API_Key, retrieveSubjectsByName, errorResponse);
//Route to get tutors taking a subject in a category
router.get('/category/:subjectId/tutors', auth_API_Key, retrieveTutorsBySubject, errorResponse);
//Route to get all lessons
router.get('/user/lesson', auth_API_Key, retrieveAllLessons, errorResponse);
//Route to get a lesson by id
router.get('/user/lesson/:id', auth_API_Key, retrieveLessonById, errorResponse);


//Route to create a user account
router.post("/signup", signUp, errorResponse);
//Route to login a user
router.post("/login", login, errorResponse);
//Register a tutor for a subject
router.post('/user/tutor', auth_API_Key, registerTutor, errorResponse)
//Route to create a category
router.post('/category', auth_API_Key, createCategory, errorResponse);
//Route to create a subject in a category
router.post('/category/subject', auth_API_Key, createSubject, errorResponse);
//Route to create a lesson
router.post('/user/lesson', auth_API_Key, createLesson, errorResponse);


//Route to create an admin
router.patch('/user/admin/:id', auth_API_Key, createAdmin, errorResponse);
//Route to update a category
router.patch('/category', auth_API_Key, updateCategory, errorResponse);
//Route to update a subject
router.patch('/category/subject', auth_API_Key, updateSubject, errorResponse);
//Route to update a lesson
router.patch('/user/lesson/:id', auth_API_Key, updateLesson, errorResponse)
//Route to update a tutor(specifically deactivate or activate a tutor)
router.patch('/user/tutor/:id', auth_API_Key, deactivateTutor, errorResponse);
//Route to update a registered subject
router.patch('/user/tutor/subject', auth_API_Key, updateRegisteredSubject, errorResponse)


//DELETE Routes
//Route to delete a subject
router.delete('/category/:id', auth_API_Key, deleteCategory, errorResponse)
//Route to delete a subject
router.delete('/category/subject/:id', auth_API_Key, deleteSubject, errorResponse)
//Route to delete a registered subject
router.delete('/user/:tutorId/subject/:subjectId', auth_API_Key, deleteRegisteredSubject, errorResponse)
//Route to delete a lesson
router.delete('/user/lesson/:id', auth_API_Key, deleteLesson, errorResponse)

const {deleteLessonTest} = require('../controllers/temp')
router.delete('/test/category/subject/lesson', auth_API_Key, errorResponse)


module.exports = router;