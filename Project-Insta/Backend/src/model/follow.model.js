const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    follower:{
        type: String,
    },
    followee:{
        type: String,
    },
    status:{
        type: String,   
        default: 'pending', 
        enum:{
            values: ['pending', 'accepted', 'rejected'],
            message: 'Status must be either pending, accepted, or rejected'
        }
    }
}, { timestamps: true });

// Ensure a user can only follow another user once by creating a unique index on the combination of follower and followee
followSchema.index({ follower: 1, followee: 1 }, { unique: true }); 

const FollowModel = mongoose.model('Follow', followSchema);
module.exports = FollowModel;