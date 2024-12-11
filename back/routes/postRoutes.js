const express = require('express');
const {
    getPosts,
    createPost,
    getPostDetails,
    getComments,
    addComment,
} = require('../controllers/postController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/getPosts', verifyToken, getPosts); // Get posts
router.post('/createPosts', verifyToken, createPost); // Create post
router.get('/getPostDetails/:postNum', verifyToken, getPostDetails); // Get post details
router.get('/:postNum/comments', verifyToken, getComments); // Get comments for a post
router.post('/:postNum/comments', verifyToken, addComment); // Add a comment

module.exports = router;
