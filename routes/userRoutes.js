const express = require('express');
const router = express.Router();
const _ = require('lodash');
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/user');

router.post('/', authMiddleware, [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is required').not().isEmpty().isEmail(),
    check('phone', 'Phone is required').not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = new User({
            ...req.body
        });
        await user.save();
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/', async (req, res) => {
    const users = await User.find();
    // pick only the required fields
    const usersResponse = users.map(user => _.pick(user, ['_id', 'name', 'email', 'phone']));
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
    check('phone', 'Phone is required').not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
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
