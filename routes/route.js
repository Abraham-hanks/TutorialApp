const routes = require('express').Router()
const auth_route = require('./auth_routes')


routes.get('/user', (req, res) => {
    res.status(200).json({ 
        message: 'Welcome to Tutorial app API',
        documentation: 'some url' 
    });

});

routes.use('/',auth_route)


module.exports = routes;