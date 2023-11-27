const Project = require('../models/project');
const {faker} = require('@faker-js/faker');
const User = require("../models/user");

async function seed() {
    const projectCount = await Project.countDocuments();
    if (projectCount > 0) {
        return;
    }
    for (let i = 0; i < 30; i++) {
        let createdBy = await User.findOne({});
        const newProject = new Project({
            title: faker.lorem.sentence(),
            createdBy: createdBy._id,
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
