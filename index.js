require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/userRoutes');
var cors = require('cors')
const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager-api')
    .then(() => {
        console.log('Connected to database');
    })
    .catch(() => {
        console.log('Connection failed');
    });

app.use(bodyParser.json());

app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes); // Authentication routes
app.use("/api/users", usersRoutes); // User routes

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
