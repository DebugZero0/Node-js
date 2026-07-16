const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Require routers
const authRouter = require('./routes/auth.routes');
const postRouter = require('./routes/post.routes');
const userRouter = require('./routes/user.routes'); 


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Use routers
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);


module.exports = app;