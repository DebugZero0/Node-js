const express = require('express');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const authRouter = express.Router();
const crypto = require('crypto');

// Authentication route for user registration
authRouter.post('/register', async(req, res) => {

    try {
        // Extracting user details from request body
        const {name, email, password} = req.body; 

        // Check if user with the same email already exists
        const existingUser = await userModel.findOne({email});
        if(existingUser){
            return res.status(400).json({message: 'Email already exists'});
        }

        // Hashing the password using md5 for security
        const hashedPassword = crypto.createHash('md5').update(password).digest('hex'); 

        // If this is a new user, create the new user in the database
        const user = await userModel.create({name, email, password: hashedPassword});
        
        // Token generation after successful registration
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET); // This sign method creates a JWT token with the user's ID as payload and a secret key from environment variables

        // Setting the token in a cookie for client-side storage

        res.cookie('jwt_token', token);

        res.status(201).json({message: 'User registered successfully', user, token});
    } catch (err) {
        res.status(500).json({message: 'Error registering user', error: err.message});
    }
});

authRouter.post('/protected', async(req, res) => {
    console.log(req.cookies); // Log the cookies to see if the token is being sent correctly
    res.status(200).json({message: 'This is a protected route', cookies: req.cookies});
});

authRouter.post('/login', async(req, res) => {
    try {
        // Extracting email and password from request body
        const {email, password} = req.body;

        // Find the user in the database by email
        const user = await userModel.findOne({email});
        
        // Hash the incoming password and compare with stored hash
        if(!user || user.password !== crypto.createHash('md5').update(password).digest('hex')){ 
            return res.status(401).json({message: 'Invalid email or password'});
        }

        // If the user is found and the password matches, generate a JWT token
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
        res.cookie('jwt_token', token);
        res.status(200).json({message: 'Login successful', user, token});

    } catch (err) {
        res.status(500).json({message: 'Error logging in', error: err.message});
    }
});

module.exports=authRouter;