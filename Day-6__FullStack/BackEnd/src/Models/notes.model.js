const mongoose = require('mongoose');

// schema for Notes -> format of the data to be stored in the database
const noteSchema = new mongoose.Schema({
    title:String,
    description:String,
});

// model for Notes-> to perform CRUD operations on the notes collection
const noteModel = mongoose.model('notes', noteSchema);

module.exports = noteModel;