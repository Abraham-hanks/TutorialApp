const User = require("../models/user_model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {TOKEN_KEY, API_KEY} = require('../configs/config');

module.exports = {
    auth: (req, res, next) => {
        if(!req.params.token){
            return res.status(403).send({
                status: false,
                message: 'Access Denied. No token provided',
                code: 403
            })
        }
        const token = req.params.token;
        try {
            const data = jwt.verify(token, TOKEN_KEY);
            req.user = data;
        } catch (error) {
            res.status(400).send('Invalid token');
        }
        User.findById(req.user._id)
        .then( user =>{
            if (!user.active) {
                res.status(403).send( {
                    status: false,
                    message: 'User deactivated'
                })
            }
            else{
                next();
            }
        }).catch(err => console.log(err))
    },


    auth_API_Key: (req, res, next) =>{
        const token = req.headers.authorization;
        if (!token){ return res.status(401).send({
            status: false,
            name: "AuthenticationError",
            message: 'API Key missing. Request requires an API Key to be sent.' });
        }
        try {
            const data = jwt.verify(token, API_KEY);
            req.user = data;
        } catch (error) {
            res.status(400).send({
                status: false,
                message: 'Invalid Authorization token'
            });
        }
        User.findById(req.user._id)
        .then( user =>{
            if (!user.active) {
                res.status(403).send( {
                    status: false,
                    message: 'API key deactivated'
                })
            }
            else{
                next();
            }
        }).catch(err => console.log(err))
    },

    signUp: (req, res, next) => {
        const data = {};
        data.email = req.body.email;
        data.password = req.body.password;
        data.role = req.body.role.toLowerCase();
        data.userName = req.body.user_name;
        data.firstName = req.body.first_name;
        data.lastName = req.body.last_name;
        const email = data.email;
        const userName = data.userName;
        const role = data.role;

        for (let key in data) {
            if (!(typeof data[key] === 'string' && data[key].length)){
                req.err = {
                    status: false,
                    message: "All fields required",
                    code: 400
                }
                next();
                return Error
            }
        };

        if (role.toLowerCase() != "student" && role.toLowerCase() != 'tutor') {
            req.err ={
                status: false,
                message: 'Invalid role. Must be "Student" or "Tutor"',
                code: 400
            }
            next()
            return Error
        }

        User.findOne({ email, userName })
        .then( user => {
            if (user) {
                req.err = { 
                    status: false, 
                    message: "This email or User name already exists",
                    code: 423
                }
                next();
                return Error
            }
            bcrypt.hash(data.password, 12).then(
                password => {
                    data.password = password;
                    return User.create(data);
                })
                .then(
                    user =>{ 
                        res.status(200).send({ 
                            status: true,
                            id: user._id,
                            user_name: user.userName, 
                            message: "Successfully created user"
                        });
                }   
            )
            .catch(err => console.log(err));
        })

    },

    login: (req, res, next) => {
        const data = {};
        data.email = req.body.email;
        data.password = req.body.password;

        if(!data.email || !data.password){
            req.err ={
                status: false,
                message: "All fields required",
                code: 404
            }
            next()
            return
        }
        const email = data.email;
        User.findOne({email})
        .then(
            user => {
                if (!user) {
                    req.err = {
                        status: false,
                        message: 'User not found, please provide valid credentials',
                        code: 404
                    }
                    next()
                    return 
                }
                bcrypt.compare(data.password, user.password)
                .then(
                    async valid => {
                        if(!valid){
                            req.err = {
                                status: false,
                                message: "Incorrect username or password, please review details and try again",
                                code: 403
                            }
                            next()
                            return 
                        }
                        else if(!user.active){
                            req.err = {
                                status: false,
                                message: "User is deactivated",
                                code: 403
                            }
                            next()
                            return 

                        }
                        const token = await user.generateAuthToken();
                        res.status(200).send({
                            status: true,
                            _id: user._id, 
                            token,
                            message:'login successful'
                        });
                })
            }
        ).catch(err => console.log(err));
    },

    generateAPI_KEY: (req, res, next) =>{
        if (!req.user._id) {
            req.err ={
                status: false,
                message: 'Invalid token',
                code: 400
            }
            next()
            return
        }
        const id = req.user._id;
        User.findById(id)
        .then(
            async user =>{
                if (!user) {
                    req.err = {
                        status: false,
                        message: "Token does not belong to an existing user",
                        code: 404
                    }
                    next()
                    return
                }
                else if (!user.active) {
                    req.err = {
                        status: false,
                        message: "Token belongs to a deactivated user",
                        code: 404
                    }
                    next()
                    return
                }
                const API_Key = await user.generateAPI_Key();
                res.status(200).send({
                    status: true,
                    API_Key,
                    message:'API Key generated successfully'
                });
            }
        ).catch(err => console.log(err))
    }
}