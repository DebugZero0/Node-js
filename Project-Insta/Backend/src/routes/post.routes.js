const postRoutes = require('express').Router();
const postController = require('../controllers/post.controller');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const identifyUser = require('../middlewire/auth.middlewire');

/*
    @desc: Create a new post
    @route: POST /api/posts
    @access: Private
*/
postRoutes.post('/', identifyUser, upload.single('image'), postController.createPost); 
// image is the name of the field coming from the client

postRoutes.get('/', identifyUser, postController.getAllPosts);

postRoutes.get('/details/:postId', identifyUser, postController.getPostById);

/*
    @desc: Like a post
    @route: POST /api/posts/like/:postId
    @access: Private
*/
postRoutes.post('/like/:postId', identifyUser, postController.likePost);

/*
    @desc: Get all posts
    @route: GET /api/posts/feed
    @access: Private
*/
postRoutes.get('/feed', identifyUser, postController.getFeedPosts);

module.exports = postRoutes;