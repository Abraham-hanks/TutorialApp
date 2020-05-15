const router = require('express').Router();


const { retrieveCategory} = require('../controllers/category_controller');


router.get('/', retrieveCategory);

module.exports = router;