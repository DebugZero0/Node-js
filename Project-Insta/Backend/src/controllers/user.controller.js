const followModel=require('../model/follow.model');
const followEdgeModel=require('../model/followEdge.model');
const userModel=require('../model/user.model');

async function followUser(req,res){
    const followerUserName=req.user.username;
    const followId=req.params.username;
    
    // Check if the user is trying to follow themselves
    if(followerUserName===followId){
        return res.status(400).json({message:"You cannot follow yourself"});
    }

    // check if the followee user exists
    const followeeExists=await userModel.findOne({username:followId});
    if(!followeeExists){
        return res.status(404).json({message:"User to follow not found"});
    }

    // Check if an accepted relationship already exists
    const existingEdge=await followEdgeModel.findOne({follower:followerUserName,followee:followId});
    if(existingEdge){
        return res.status(400).json({message:"You are already following this user"});
    }

    // Check if a follow request already exists
    const existingRequest=await followModel.findOne({follower:followerUserName,followee:followId});
    if(existingRequest){
        if(existingRequest.status==='pending'){
            return res.status(400).json({message:"Follow request is already pending"});
        }
        if(existingRequest.status==='accepted'){
            return res.status(400).json({message:"You are already following this user"});
        }
        existingRequest.status='pending';
        await existingRequest.save();
        return res.status(200).json({message:"Follow request sent successfully",followRequest:existingRequest});
    }

    // Create a follow request with pending status
    try{
        const followRequest = await followModel.create({follower:followerUserName,followee:followId,status:'pending'});
        res.status(201).json({message:"Follow request sent successfully",followRequest});
    }catch(err){
        res.status(500).json({message:"Error sending follow request",error:err.message});
    }
}

async function acceptFollowRequest(req,res){
    const followeeUserName=req.user.username;
    const followerUserName=req.params.username;

    const followRequest=await followModel.findOne({follower:followerUserName,followee:followeeUserName});
    if(!followRequest){
        return res.status(404).json({message:"Follow request not found"});
    }

    if(followRequest.status==='accepted'){
        return res.status(400).json({message:"Follow request already accepted"});
    }

    if(followRequest.status==='rejected'){
        return res.status(400).json({message:"Follow request already rejected"});
    }

    try{
        const followEdge=await followEdgeModel.create({follower:followerUserName,followee:followeeUserName});
        followRequest.status='accepted';
        await followRequest.save();

        return res.status(200).json({
            message:"Follow request accepted",
            followRequest,
            followEdge
        });
    }catch(err){
        if(err.code===11000){
            followRequest.status='accepted';
            await followRequest.save();
            return res.status(200).json({message:"Follow request accepted",followRequest});
        }
        return res.status(500).json({message:"Error accepting follow request",error:err.message});
    }
}

async function rejectFollowRequest(req,res){
    const followeeUserName=req.user.username;
    const followerUserName=req.params.username;

    const followRequest=await followModel.findOne({follower:followerUserName,followee:followeeUserName});
    if(!followRequest){
        return res.status(404).json({message:"Follow request not found"});
    }

    if(followRequest.status==='accepted'){
        return res.status(400).json({message:"Cannot reject an accepted follow request"});
    }

    if(followRequest.status==='rejected'){
        return res.status(400).json({message:"Follow request already rejected"});
    }

    followRequest.status='rejected';
    await followRequest.save();

    return res.status(200).json({message:"Follow request rejected",followRequest});
}

async function unfollowUser(req,res){
    const followerUserName=req.user.username;
    const followId=req.params.username;

    // check if accepted follow edge exists
    const isUserFollowing=await followEdgeModel.findOne({follower:followerUserName,followee:followId});
    if(!isUserFollowing){
        return res.status(404).json({message:`You are not following ${followId}`});
    }

    // Delete the follow edge and mark request as rejected
    await followEdgeModel.findByIdAndDelete(isUserFollowing._id);
    await followModel.findOneAndUpdate(
        {follower:followerUserName,followee:followId,status:'accepted'},
        {$set:{status:'rejected'}}
    );

    res.status(200).json({message:"User unfollowed successfully"});
}

module.exports={
    followUser,
    acceptFollowRequest,
    rejectFollowRequest,
    unfollowUser
}


