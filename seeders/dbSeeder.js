const mongoose = require('mongoose');


mongoose.connect('mongodb://localhost:27017/task-manager')
    .then(() => {
        console.log('Connected to database');
    })
    .catch(() => {
        console.log('Connection failed');
    });


require('./usersSeeder');
require('./tasksSeeder');
