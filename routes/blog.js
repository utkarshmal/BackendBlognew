const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authmiddleware');

const { createPost, getAllPosts, getPostById, deletePost, getMyPosts ,updatePost,} = require('../controllers/postController');
const { createComment, deleteComment } = require('../controllers/commentController');
const { likePost, dislikePost } = require('../controllers/likeController');

// Post Routes
router.post('/create', auth, createPost);
router.get('/', getAllPosts);
router.get('/my-posts', auth, getMyPosts);

// Actions on a specific post using :postId
router.post('/:postId/like', auth, likePost);
router.post('/:postId/dislike', auth, dislikePost);
router.post('/:postId/comments', auth, createComment);
router.delete('/:postId/comments/:commentId', auth, deleteComment);
router.put('/posts/:postId', auth, updatePost);
// Get or Delete a specific post
router.get('/:postId', getPostById);
router.delete('/:postId', auth, deletePost);

module.exports = router;