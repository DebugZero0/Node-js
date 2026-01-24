const express=require('express');
const app=express();
const port=3000;

app.use(express.json()); // Middleware to parse JSON bodies

app.get('/',(req,res)=>{  
    res.send('Hello, World!');
});

const data=[]; 

app.post('/data',(req,res)=>{ // app.post to handle incoming data from client

    data.push(req.body); // Store received data in the array and the body contains the data sent by the client
    res.send('Data received');
}); 
app.get('/data',(req,res)=>{
    res.send(data);
});



app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});