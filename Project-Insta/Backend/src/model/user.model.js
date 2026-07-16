const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, 'Username already exists'],
        required: [true, 'Username is required']
    },
    email: {
        type: String,
        unique: [true, 'Email already exists'],
        required: [true, 'Email is required']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false // Exclude password from query results by default
    },
    bio: String,
    profileImage:{
        type: String,
        default: 'https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png'
    }
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;