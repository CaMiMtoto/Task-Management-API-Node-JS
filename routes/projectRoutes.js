const express = require('express');
const Project = require('../models/project');
const router = express.Router();

router.get('/', async (req, res) => {
    const projects = await Project.find();
    res.send(projects);
});
module.exports = router;