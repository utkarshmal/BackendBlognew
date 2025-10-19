const Post = require("../models/postModel");
const Comment = require("../models/commentModel");

// Like a POST

 exports.likePost = async (req, res) => {
    try {
        const { postId } = req.params; // Change this
        const userId = req.user.id;
        const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Remove user from dislikes if they had disliked it before
    post.dislikes.pull(userId);

    // Add user to likes if they haven't liked it already
    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
    }

    await post.save();
    const populatedPost = await Post.findById(postId).populate("likes", "firstName").populate("dislikes", "firstName");

    return res.status(200).json({
      success: true,
      message: "Post liked",
      post: populatedPost
    });

  } catch (err) {
    console.error("Error liking post:", err);
    return res.status(500).json({ success: false, error: "Error while liking post" });
  }
};

// Dislike a POST
// dislikePost function
exports.dislikePost = async (req, res) => {
    try {
        const { postId } = req.params; // Change this
        const userId = req.user.id;
        const post = await Post.findById(postId); // And this
//...
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Remove user from likes if they had liked it before
    post.likes.pull(userId);

    // Add user to dislikes if they haven't disliked it already
    if (!post.dislikes.includes(userId)) {
      post.dislikes.push(userId);
    }

    await post.save();
    const populatedPost = await Post.findById(postId).populate("likes", "firstName").populate("dislikes", "firstName");

    return res.status(200).json({
      success: true,
      message: "Post disliked",
      post: populatedPost
    });

  } catch (err) {
    console.error("Error disliking post:", err);
    return res.status(500).json({ success: false, error: "Error while disliking post" });
  }
};


// Like/Unlike a COMMENT
exports.toggleCommentLike = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if(!comment) {
            return res.status(404).json({ success: false, error: "Comment not found" });
        }

        const isLiked = comment.likes.some(likeId => likeId.equals(userId));

        if (isLiked) {
            comment.likes.pull(userId);
        } else {
            comment.likes.push(userId);
        }
        
        await comment.save();
        const populatedComment = await Comment.findById(commentId).populate("likes", "firstName lastName");


        return res.status(200).json({
            success: true,
            message: isLiked ? "Comment unliked" : "Comment liked",
            comment: populatedComment
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: "Error while toggling like on comment" });
    }
};