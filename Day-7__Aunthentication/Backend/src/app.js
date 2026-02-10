const express=require('express');
const authRouter=require('./routes/auth.routes');
const cookieParser=require('cookie-parser');


const app=express();

app.use(cookieParser());
app.use(express.json());
app.use('/api/auth', authRouter); // prefix for auth routes so that no conflict with other routes in future

module.exports=app;