const express = require('express');
const noteModel=require('./Models/notes.model');
const cors = require('cors');
const path=require('path');

const app = express();

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static('./public')); // We can access all the recourse of public folder from frontend 



app.post('/api/notes', async (req, res) => {
    const notes = await noteModel.create(req.body);
    res.send({ message: 'Note created successfully', notes });
});

app.get('/api/notes', async (req, res) => {
    const notes = await noteModel.find();
    res.send(notes);
});

app.delete('/api/notes/:id', async (req, res) => {
    const { id } = req.params;
    await noteModel.findByIdAndDelete(id);
    res.send({ message: 'Note deleted successfully' });
});

app.patch('/api/notes/:id', async (req, res) => {
    const id = req.params.id;
    const { title, description } = req.body;

    await noteModel.findByIdAndUpdate(id, { title, description });
    res.send({ message: 'Note updated successfully' });
});


console.log(__dirname);
// Wildcard route to serve the React app for any unmatched routes
app.use('*name',(req, res) => {
//   res.status(404).send({ message: 'Route not found' });
    res.sendFile(path.join(__dirname,'..','/public/index.html'));
});

module.exports = app;