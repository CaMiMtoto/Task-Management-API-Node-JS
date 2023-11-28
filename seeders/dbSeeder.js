const mongoose = require('mongoose');
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager';
mongoose.connect(DB_URI)
    .then(() => {
        console.log('Connected to database');
    })
    .catch(() => {
        console.log('Connection failed');
    });


require('./usersSeeder');
require('./projectSeeder');
