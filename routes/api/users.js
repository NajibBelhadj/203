const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Keys = require('../../config/keys');
const passport = require('passport')

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

//load User model
const User = require('../../models/User');

// @Router   GET api/users/test
// @desc     Tests post route
// @access    Public
router.get('/test', (req, res) => res.json({msg: "users Works"}));

// @Router   GET api/users/register
// @desc     Register
// @access    Public
router.post('/register', (req, res)=>{
    const { errors, isValid } = validateRegisterInput(req.body);

    // Check Validation 
    if(!isValid){
        return res.status(400).json(errors)
    }
    User.findOne({ email: req.body.email })
        .then(user=> {
            if(user){
                errors.email= 'Email already exists'
                return res.status(400).json(errors); 
            }else {
                const avatar = gravatar.url(req.body.email,{
                    s: '200', //size
                    r: 'pg',
                    d: 'mm'
                 });

                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    avatar,
                    password: req.body.password
                });

                bcrypt.genSalt(10, (err, salt)=> {
                    bcrypt.hash(newUser.password, salt,(err, hash) => {
                        if(err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then(user => res.json(user))
                            .catch(err => console.log(err));
                    })
            })
        }
    })
});

// @Router    GET api/users/login
// @desc      login / Returning Token
// @access    Public
router.post('/login', (req, res) => {
    const { errors, isValid } = validateLoginInput(req.body);

    // Check Validation 
    if(!isValid){
        return res.status(400).json(errors)
    }
    const email = req.body.email;
    const password = req.body.password;

    // Find user by email
    User.findOne({email})
        .then(user => {
            // Chech for user   
            if(!user){
                errors.email = 'User not found';
                return res.status(404).json(errors);
            }
            
            // Chech Password
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if(isMatch){
                        // User Matched
                        const payload = { id : user.id, name: user.name, avatar: user.avatar}// Create JWT Payload

                        // Sign Tokek
                        jwt.sign(payload,
                            Keys.secretOrKey,
                            { expiresIn: 3600 },
                            (err,token) => {
                                res.json({
                                    suceess: true,
                                    token: 'Bearer '+ token
                                });
                            });
                    } else {
                        errors.password = 'password incorrect';
                        return res.status(400).json(errors);
                    }
                });
        });
});

// @Router    GET api/users/current
// @desc      Return current user
// @access    Private 
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) =>{
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    });
}),
module.exports = router;