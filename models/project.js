const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User',
    },
});
const Project = mongoose.model('Project', projectSchema);
module.exports = Project;