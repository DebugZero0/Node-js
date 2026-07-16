const mongoose = require('mongoose');

const followEdgeSchema = new mongoose.Schema({
    follower: {
        type: String,
        required: true,
    },
    followee: {
        type: String,
        required: true,
    }
}, { timestamps: true });

followEdgeSchema.index({ follower: 1, followee: 1 }, { unique: true });

const FollowEdgeModel = mongoose.model('FollowEdge', followEdgeSchema);
module.exports = FollowEdgeModel;