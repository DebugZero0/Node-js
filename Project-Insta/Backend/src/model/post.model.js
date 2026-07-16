const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    caption: {
        type: String,
        default: ''
    },
    imgUrl:{
        type: String,
        required: [ true, 'Image URL is required' ]
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: [ true, 'User reference is required' ]
    }
});

const PostModel = mongoose.model('Post', postSchema);

module.exports = PostModel;