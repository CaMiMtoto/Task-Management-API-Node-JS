/**
 * @swagger
 * /api/auth/register:
 *  post:
 *      summary: Register a new user
 *      tags: [Users]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          name:
 *                              type: string
 *                          email:
 *                              type: string
 *                          password:
 *                              type: string
 *                      example:
 *                          name: John Doe
 *                          email: john@domain.com
 *                          password: 123456
 *      responses:
 *          201:
 *              description: The user was successfully registered
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/User'
 *          400:
 *              description: Invalid input or email already exists
 *          500:
 *              description: Internal server error
 */

/**
 * @swagger
 * /api/auth/login:
 *  post:
 *      summary: Login a user
 *      tags: [Users]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                          password:
 *                              type: string
 *                      example:
 *                          email: john@domain.com
 *                          password: 123456
 *      responses:
 *          200:
 *              description: The user was successfully logged in
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: Object
 *          400:
 *              description: Invalid credentials
 *          500:
 *              description: Internal server error
 */


/**
 * @swagger
 * /api/auth/change-password:
 *  post:
 *      summary: Change a user's password
 *      tags: [Users]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          old_password:
 *                              type: string
 *                          new_password:
 *                              type: string
 *                          confirm_password:
 *                              type: string
 *                      example:
 *                          old_password: 123456
 *                          new_password: 654321
 *                          confirm_password: 654321
 *      responses:
 *          200:
 *              description: The password was successfully changed
 *          400:
 *              description: Invalid old password or new password and confirm password do not match
 *          500:
 *              description: Internal server error
 */
/**
 * @swagger
 * /api/auth/profile:
 *  get:
 *      summary: Get a user's profile
 *      tags: [Users]
 *      responses:
 *          200:
 *              description: The user's profile
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/User'
 *          500:
 *              description: Internal server error
 */

/**
 * @swagger
 * /api/auth/profile:
 *  put:
 *      summary: Update a user's profile
 *      tags: [Users]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          name:
 *                              type: string
 *                          email:
 *                              type: string
 *                      example:
 *                          name: John Doe
 *                          email: john@newdomain.com
 *      responses:
 *          200:
 *              description: The profile was successfully updated
 *          400:
 *              description: Invalid input
 *          500:
 *              description: Internal server error
 */





const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const {check, validationResult} = require('express-validator');
const router = express.Router();
const _ = require('lodash');
const authMiddleware = require('../middleware/authMiddleware');

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
            return res.status(400).send({message: 'Invalid credentials'});
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(400).send({message: 'Invalid credentials'});
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
], async (req, res) => {

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
