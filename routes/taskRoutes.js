// routes/taskRoutes.js
const express = require('express');
const Task = require('../models/task');
const authMiddleware = require('../middleware/authMiddleware');
const Exceljs = require('exceljs');

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
        const limit = parseInt(req.query.limit ?? 3);
        const skip = (page - 1) * limit;
        const sortColumn = req.query.sortColumn ?? '_id';
        const sortOrder = req.query.sortOrder ?? 'asc';
        const searchQuery = req.query.search ?? '';


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

// get overview tasks
router.get('/overview', authMiddleware, async (req, res) => {
    const totalTasks = await Task.countDocuments({createdBy: req.user._id});
    const dueTasks = await Task.countDocuments({createdBy: req.user._id, endDate: {$lt: new Date()}});
    const recentTasks = await Task.find({createdBy: req.user._id})
        .sort({_id: 'desc'})
        .limit(5)
        .exec();

    res.send({
        totalTasks,
        dueTasks,
        recentTasks,
    });
});
// Read Task by ID
router.get('/:id/details', async (req, res) => {
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


        try {
            let path = req.file?.path;
            let id = req.params.id;
            console.log(id);
            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).send();
            }
            task.title = req.body.title;
            task.startDate = req.body.start_date;
            task.endDate = req.body.end_date;
            task.description = req.body.description;
            task.priority = req.body.priority;
            task.assignees = req.body.assignees ?? [];
            task.projects = req.body.projects ?? [];
            task.attachment = path ?? task.attachment;
            await task.save();
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

// export tasks to excel


router.get('/export', async (req, res) => {
    const workbook = new Exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');
    worksheet.columns = [
        {header: "Title", key: 'title', width: 30},
        {header: "Start Date", key: 'startDate', width: 30},
        {header: "End Date", key: 'endDate', width: 30},
        {header: "Description", key: 'description', width: 30},
        {header: "Priority", key: 'priority', width: 30},
        {header: "Assignees", key: 'assignees', width: 30},
        {header: "Projects", key: 'projects', width: 30},
    ];
    const tasks = await Task.find()
        .populate('assignees', 'name email')
        .populate('projects', 'title')
        .exec();
    tasks.forEach(task => {

        let assignees = task.assignees.map(assignee => assignee.name).join(', ');

        let projects = task.projects.map(project => project.title).join(', ');
        worksheet.addRow({
            title: task.title,
            startDate: task.startDate,
            endDate: task.endDate,
            description: task.description,
            priority: task.priority,
            assignees: assignees,
            projects: projects,
        });
    })
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "tasks.xlsx"
    );
    workbook.xlsx.write(res).then(() => res.status(200).end());
});

router.get('/download/:id', async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).send();
    }
    res.download(task.attachment, (err) => {
        if (err) {
            res.status(500).send(err);
        }
    });
});


module.exports = router;
