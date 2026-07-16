const mongoose = require('mongoose');
const PostModel = require('../model/post.model');
const likeModel = require('../model/likes.model');
const ImageKit = require('@imagekit/nodejs');
const { toFile } = require('@imagekit/nodejs');
const uploadFile = require('../services/storage.service');
const jwt = require('jsonwebtoken');


async function createPostController(req, res) {

    // If the token is valid the we upload the file to the imagekit and get the URL in response
    const result = await uploadFile(req.file.buffer);

    // After getting the URL we create a new post in the database .. becareful about the field names in the post model and the data you are sending here .. they should match
    const post= await PostModel.create({
        user:req.user.id,
        caption:req.body.caption,
        imgUrl:result.url,
    });
    res.status(201).json({
        message:'Post created successfully',
        post
    });


} 

async function getAllPostsController(req, res) {

    const userId = req.user.id;
    const posts = await PostModel.find({ user: userId });
    res.status(200).json({
        message: 'Posts fetched successfully',
        posts
    });
} 

async function getPostByIdController(req, res) {
    const userId = req.user.id;
    const postId = req.params.postId;
    
    const post = await PostModel.findOne({ _id: postId, user: userId });
    if (!post) {
        return res.status(404).json({ message: 'Post not found or unauthorized access' });
    }
    const isValidUser = post.user.toString() === userId;
    if (!isValidUser) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this post' });
    }
    res.status(200).json({
        message: 'Post fetched successfully',
        post
    });
}

async function likePost(req,res){
    const username=req.user.username;
    const postId=req.params.postId;

    // Check if the post exists
    const postExists=await PostModel.findById(postId);
    if(!postExists){
        return res.status(404).json({message:"Post not found"});
    }

    // Check if the user has already liked the post
    const alreadyLiked=await likeModel.findOne({post:postId,user:username});
    if(alreadyLiked){
        return res.status(400).json({message:"You have already liked this post"});
    }
    // Create a new like record
    try{
        const likeRecord=await likeModel.create({post:postId,user:username});
        res.status(201).json({message:"Post liked successfully",likeRecord});
    }catch(err){
        res.status(500).json({message:"Error liking post",error:err.message});
    }
}

async function getFeedPosts(req,res){
    const userId = req.user.id;
    const posts = await PostModel.find().populate('user'); // Fetch all posts and populate user details, excluding password
    res.status(200).json({
        message: 'Feed posts fetched successfully',
        posts
    });
}


module.exports = { 
    createPost: createPostController, 
    getAllPosts: getAllPostsController, 
    getPostById: getPostByIdController,
    likePost: likePost,
    getFeedPosts: getFeedPosts
}