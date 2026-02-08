
require('dotenv').config(); // Load environment variables from .env file

const server = require('./src/app');
const connectToDatabase = require('./src/config/Database');


// Start the server and connect to the database
connectToDatabase();

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});