// routes/taskRoutes.js
const express = require('express');
const Task = require('../models/task');
const authMiddleware = require('../middleware/authMiddleware');

const {check, validationResult} = require('express-validator');
const uploadMiddleware = require("../middleware/uploadMiddleware");
const {unlink} = require("fs");
const router = express.Router();
router.post('/',
    authMiddleware,
    uploadMiddleware.single('attachment'),
    [
        check('title', 'Title is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty(),
        check('start_date', 'Start date is required').not().isEmpty().isDate(),
        check('end_date', 'End date is required').not().isEmpty().isDate(),
        // check('assignees', 'Assignees must be an array').isArray().not().isEmpty(),
        // check('assignees.*', 'Assignees must be an array of ObjectIds').isMongoId(),
        // check('projects', 'Projects must be an array').isArray().not().isEmpty(),
        // check('projects.*', 'Projects must be an array of ObjectIds').isMongoId(),
        check('priority', 'Priority must be one of Low, Medium, High').isIn(['Low', 'Medium', 'High']),
        check('attachment').optional().isString(),
    ],

    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        try {
            const task = new Task({
                title: req.body.title,
                description: req.body.description,
                startDate: req.body.start_date,
                endDate: req.body.end_date,
                assignees: req.body.assignees ?? [],
                projects: req.body.projects ?? [],
                priority: req.body.priority,
                attachment: req.file?.path,
                createdBy: req.user._id,
            });
            await task.save();
            res.status(201).send(task);
        } catch (error) {
            res.status(400).send(error);
        }
    }
);

// Get All Tasks
router.get('/', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page ?? 1);
        const limit = parseInt(req.query.limit ?? 10);
        const skip = (page - 1) * limit;
        const sortColumn = req.query.sortColumn ?? '_id';
        const sortOrder = req.query.sortOrder ?? 'asc';


        // get all tasks paginated from the database and populate the createdBy field with the name and email of the user

        const tasks = await Task.find({createdBy: req.user._id})
            .populate('assignees', 'name email')
            .populate('projects', 'title')
            .sort({[sortColumn]: sortOrder})
            .skip(skip)
            .limit(limit)
            .exec();
        const totalTasks = await Task.countDocuments({createdBy: req.user._id});
        const totalPages = Math.ceil(totalTasks / limit);
        const response = {
            total: totalTasks,
            page: page,
            limit: limit,
            totalPages: totalPages,
            results: tasks,
            nextPage: page < totalPages ? `/tasks?page=${page + 1}&limit=${limit}` : null,
            prevPage: page > 1 ? `/tasks?page=${page - 1}&limit=${limit}` : null,
        };
        res.send(response);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Read Task by ID
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignees', 'name email')
            .populate('projects', 'title')
            .exec();
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update Task by ID
router.put('/:id',
    authMiddleware,
    uploadMiddleware.single('attachment'),
    [
        check('title', 'Title is required').not().isEmpty(),
        check('description', 'Description must be a string').optional().isString(),
        check('priority', 'Priority must be one of Low, Medium, High').isIn(['Low', 'Medium', 'High']),
        check('attachment').optional().isString(),
        check('assignees', 'Assignees must be an array').optional().isArray(),
        check('assignees.*', 'Assignees must be an array of ObjectIds').optional().isMongoId(),
        check('projects', 'Projects must be an array').optional().isArray(),
        check('projects.*', 'Projects must be an array of ObjectIds').optional().isMongoId(),
        check('start_date', 'Start date is required').optional().isDate(),
        check('end_date', 'End date is required').optional().isDate(),

    ],
    async (req, res) => {

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ['title', 'description', 'completed', 'priority'];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).send({error: 'Invalid updates!'});
        }

        try {
            let path = req.file?.path;

            if (path) {
                // delete the old attachment
                const task = await Task.findById(req.params.id);
                if (task.attachment) {
                    await unlink(task.attachment);
                }
            }

            const task = await Task.findByIdAndUpdate(req.params.id, {
                ...req.body,
                attachment: path,
            }, {new: true, runValidators: true});
            if (!task) {
                return res.status(404).send();
            }
            res.status(200).send(task);
        } catch (error) {
            res.status(400).send(error);
        }
    });

// Delete Task by ID
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});


module.exports = router;
