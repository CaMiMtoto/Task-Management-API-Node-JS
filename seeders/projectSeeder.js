const Project = require('../models/project');
const {faker} = require('@faker-js/faker');
const User = require("../models/user");

async function seed() {
    const projectCount = await Project.countDocuments();
    if (projectCount > 0) {
        return;
    }

    const projects = [
        "Starting up a company",
        "Building a website",
        "Building an app",
        "Build a user interface",
        "Design a logo",
        "Design a website",
        "Create a marketing plan",
        "Create a business plan",
        "Create a marketing campaign",
        "Create a social media campaign",
        "Advertising campaign",
        "Migration to the cloud"
    ]

    for (const f of projects) {
        let createdBy = await User.findOne({});
        const newProject = new Project({
            title: f,
            createdBy: createdBy?._id,
        });
        await newProject.save();
    }


}

seed().then(() => {
    console.log('Projects seeded successfully');
}).catch((error) => {
    console.log(error);
    process.exit();
});
