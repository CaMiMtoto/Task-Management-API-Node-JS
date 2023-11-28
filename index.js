require('dotenv').config()
const express = require('express');
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const cors = require('cors');
const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager')
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
app.use("/api/projects", projectRoutes); // Project routes


const options = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "Task Manager API",
            version: "0.1.0",
            description: "This is Task Management API, which is used to manage tasks and assign them to users.",
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(options);
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {explorer: true})
);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
