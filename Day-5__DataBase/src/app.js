/*
    - Create the server 
    - Config the server 
*/ 
const express = require('express');
const noteModel = require('./model/notes.model');

const app=express();
// Middleware to parse JSON bodies
app.use(express.json());

const notes=[];

// Sample route
app.get('/', (req, res) => {
    res.send('Hello, World!This is database connected server');
});

app.post('/notes', async (req, res) => {
    // Take the data from req.body and store it in the database
    const {title,description}=req.body; 
    // Create a new note in the database
    const note=await noteModel.create({
        title,description
    });  

    res.status(201).json({
        message: 'Note created successfully',
        note
    });
});

/*

//findOne method to get a single note from the database that matches the criteria and it returns data in object format if object is found else returns null
    app.get('/notes', async (req, res) => {
        const note = await noteModel.findOne({
            title:"Second Note"
        });
        res.status(200).json({
            message: 'Note fetched successfully',
            note
        });
    });

*/

app.get('/notes', async (req, res) => {
    // Find method to get all notes from the database and it returns data in array of object format
    // If criteria is given inside find method then it will return all notes matching the criteria else it will return all notes
    const notes=await noteModel.find({
        // title:"First Note"
    });
    res.status(200).json({
        message: 'Notes fetched successfully',
        notes: notes
    });
});


app.delete('/notes/:id', async (req, res) => {
    const id=req.params.id;
    // copy the id from db and add at end of url that to postman to delete the note
    await noteModel.findOneAndDelete({
        _id: id
    });

    res.status(200).json({
        message: 'Note deleted successfully'
    });
});

app.patch('/notes/:id', async (req, res) => {
    const id=req.params.id;
    const description=req.body.description;
    // findoneandupdate takes 2 arguments first is criteria to find the note and second is what to update
    // copy the id from db and add at end of url that to postman to update the note
    await noteModel.findOneAndUpdate({_id: id}, { description: description });
    res.status(200).json({
        message:'Note updated successfully'
    });
})



module.exports=app;