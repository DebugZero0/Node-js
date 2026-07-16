require('dotenv').config();
const server = require('./src/app');
const connectDB = require('./src/config/database');

// Connect to the database
connectDB();

const PORT = process.env.PORT || 3000;



server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});