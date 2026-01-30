/*
    - create a server using express
    - configure the server
*/

const express = require('express');
const app = express();
// Add middleware to parse JSON bodies ie to read req.body
app.use(express.json()); 

const notes=[];
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.post('/notes', (req, res) => {
    notes.push(req.body);
    res.send('Data received!');
});
app.get('/notes', (req, res) => {
    res.send(notes); 
});

// use params when data is small and use body when data is large

app.delete('/notes/:idx', (req, res) => {
    delete notes[req.params.idx];
    res.send('Note deleted!');
});

// Update a note partially
app.patch('/notes/:idx',(req,res)=>{
    notes[req.params.idx].content=req.body.content;
    res.send('Note updated!');
})

module.exports = app;

