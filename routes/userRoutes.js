/**
 * @swagger
 * /api/users:
 *  get:
 *      summary: Get all users
 *      tags: [Users]
 *      responses:
 *          200:
 *              description: A list of users
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/User'
 *          500:
 *              description: Internal server error
 */

/**
 * @swagger
 * /api/users/{id}:
 *  get:
 *      summary: Get a user by ID
 *      tags: [Users]
 *      parameters:
 *        - in: path
 *          name: id
 *          schema:
 *            type: string
 *          required: true
 *          description: User ID
 *      responses:
 *          200:
 *              description: A user object
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/User'
 *          404:
 *              description: User not found
 *          500:
 *              description: Internal server error
 */

/**
 * @swagger
 * /api/users/{id}:
 *  put:
 *      summary: Update a user
 *      tags: [Users]
 *      parameters:
 *        - in: path
 *          name: id
 *          schema:
 *            type: string
 *          required: true
 *          description: User ID
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
 *              description: The user was successfully updated
 *          400:
 *              description: Invalid input
 *          500:
 *              description: Internal server error
 */

/**
 * @swagger
 * /api/users/{id}:
 *  delete:
 *      summary: Delete a user
 *      tags: [Users]
 *      parameters:
 *        - in: path
 *          name: id
 *          schema:
 *            type: string
 *          required: true
 *          description: User ID
 *      responses:
 *          200:
 *              description: The user was successfully deleted
 *          404:
 *              description: User not found
 *          500:
 *              description: Internal server error
 */





const express = require('express');
const router = express.Router();
const _ = require('lodash');
const {check, validationResult} = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/user');


router.get('/', async (req, res) => {
    const users = await User.find();
    // pick only the required fields
    const usersResponse = users.map(user => _.pick(user, ['_id', 'name', 'email']));
    res.send({
        results: usersResponse
    });
});

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.put('/:id', authMiddleware, [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is required').not().isEmpty().isEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
});


module.exports = router;
