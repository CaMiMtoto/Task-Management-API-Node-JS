// routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const {check, validationResult} = require('express-validator');
const router = express.Router();
const _ = require('lodash');

// Generate JWT token for authentication
const generateAuthToken = (user) => {
    return jwt.sign({_id: user._id.toString()}, process.env.SECRET_KEY, {expiresIn: '1h'});
};

// User Registration
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is not valid').not().isEmpty().isEmail(),
    check('password', 'Password is required').not().isEmpty()
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    try {
        const email = req.body.email;
        // Check if the username already exists
        const existingUser = await User.findOne({email: email});
        if (existingUser) {
            return res.status(400).send({error: 'Email already exists'});
        }

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        });
        await user.save();
        const token = generateAuthToken(user);

        res.status(201).send({user: _.pick(user, ['_id', 'name', 'email']), token});
    } catch (error) {
        res.status(400).send(error);
    }
});

// User Login
router.post('/login', [
    check('email', 'Email is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty()
], async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});

        if (!user) {
            return res.status(401).send({message: 'Invalid credentials'});
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).send({message: 'Invalid credentials'});
        }

        const token = generateAuthToken(user);
        const userObj = _.pick(user, ['_id', 'name', 'email']);
        res.send({
            user: userObj, token
        });
    } catch (error) {
        res.status(400).send(error);
    }
});


// change password
router.post('/change-password', authMiddleware, [
    check('old_password', "Old password is required").not().isEmpty(),
    check('new_password', "New password is required").not().isEmpty(),
    check('confirm_password', "Password confirmation is required").not().isEmpty()
], async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    const user = req.user;
    const {old_password, new_password, confirm_password} = req.body;
    const isPasswordMatch = await bcrypt.compare(old_password, user.password);

    if (!isPasswordMatch) {
        return res.status(400).send({message: "Invalid old password provided"});
    }
    if (new_password !== confirm_password) {
        return res.status(400).send({message: "New password must be confirmed"});
    }

    // update password
    user.password = new_password;
    await user.save();

    const token = generateAuthToken(user);
    const userObj = _.pick(user, ['_id', 'name', 'email']);
    res.send({
        user: userObj, token
    });
});

// profile
router.get('/profile', authMiddleware, async (req, res) => {
    const user = req.user;
    const userObj = _.pick(user, ['_id', 'name', 'email']);
    res.send(userObj);
});

// update profile information,(name ,email)
router.put('/profile', authMiddleware, [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is required').not().isEmpty().isEmail(),
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    const user = req.user;
    const {name, email} = req.body;
    user.name = name;
    user.email = email;
    await user.save();
    const token = generateAuthToken(user);
    const userObj = _.pick(user, ['_id', 'name', 'email']);
    res.send({
        user: userObj, token
    });
});

module.exports = router;
