// routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const _ = require('lodash');

// Generate JWT token for authentication
const generateAuthToken = (user) => {
    return jwt.sign({ _id: user._id.toString() }, 'yourSecretKey', { expiresIn: '1h' });
};

// User Registration
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is not valid').not().isEmpty().isEmail(),
    check('phone', 'Phone is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty()
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const email = req.body.email;
        // Check if the username already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send({ error: 'Email already exists' });
        }

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: req.body.password,
        });
        await user.save();
        const token = generateAuthToken(user);
        res.status(201).send({ user, token });
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
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).send({ message: 'Invalid email address' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).send({ message: 'Invalid credentials' });
        }

        const token = generateAuthToken(user);
        const userObj = _.pick(user, ['_id', 'name', 'email', 'phone']);
        res.send({
            user: userObj, token
        });
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
