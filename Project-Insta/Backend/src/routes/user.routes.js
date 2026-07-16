const express=require('express');
const userRouter=express.Router();
const userController=require('../controllers/user.controller');
const identifyUser=require('../middlewire/auth.middlewire');


/*
    @route POST /api/users/follow/:username
    @desc Follow a user
    @access Private
*/

userRouter.post('/follow/:username',identifyUser,userController.followUser);

/*
    @route POST /api/users/follow/accept/:username
    @desc Accept a follow request from :username
    @access Private
*/
userRouter.post('/follow/accept/:username',identifyUser,userController.acceptFollowRequest);

/*
    @route POST /api/users/follow/reject/:username
    @desc Reject a follow request from :username
    @access Private
*/
userRouter.post('/follow/reject/:username',identifyUser,userController.rejectFollowRequest);

/*
    @route POST /api/users/unfollow/:username
    @desc Unfollow a user
    @access Private
*/
userRouter.post('/unfollow/:username',identifyUser,userController.unfollowUser);

module.exports=userRouter;