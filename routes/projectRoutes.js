
/**
 * @swagger
 * /api/projects:
 *  get:
 *      summary: Get all projects
 *      tags: [Projects]
 *      responses:
 *          200:
 *              description: A list of projects
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/Project'
 *          500:
 *              description: Internal server error
 */


const express = require('express');
const Project = require('../models/project');
const router = express.Router();

router.get('/', async (req, res) => {
    const projects = await Project.find();
    res.send(projects);
});
module.exports = router;