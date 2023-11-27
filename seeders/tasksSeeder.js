const Task = require('../models/task');
const User = require('../models/user');
const { faker } = require('@faker-js/faker');
async function seedData() {
    const tasksCount = await Task.countDocuments();
    if (tasksCount > 0) {
        return;
    }
    for (let i = 0; i < 100; i++) {
        const user = await User.findOne();
        const newTask = new Task({
            title: faker.lorem.sentence(),
            description: faker.lorem.paragraph(),
            priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
            completed: faker.datatype.boolean(),
            createdBy: user._id,
        });
        await newTask.save();
    }
}

seedData().then(() => {
    console.log('Tasks seeded successfully');
}).catch((error) => {
    console.log(error);
    process.exit();
});