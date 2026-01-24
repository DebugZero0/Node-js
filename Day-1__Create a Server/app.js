// Importing the Express library .. why require? Because CommonJS module system is used in Node.js
const express = require('express'); 

const app = express(); // When server is called an Instance of server is created
const port = 3000;
app.use(express.json());

//start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Define a simple route any request to the root URL will respond with "Hello, World!"
app.get('/', (req, res) => {
  res.send('Hello, World!');
});
// Define a route to handle get requests to /about 
app.get('/about', (req, res) => {
  res.send('This is the About page.');
});
