const Post = require("../models/postModel");
const Comment = require("../models/commentModel");
const User = require("../models/User"); // Make sure User model is imported

// CREATE A COMMENT
exports.createComment = async (req, res) => {
    try {
        const { postId, body } = req.body;
        const userId = req.user.id;

        if (!body) {
            return res.status(400).json({ success: false, error: "Comment body cannot be empty." });
        }

        const comment = new Comment({
            post: postId,
            user: userId,
            body: body
        });
        const savedComment = await comment.save();

        await Post.findByIdAndUpdate(postId, { $push: { comments: savedComment._id } });

        // Populate user details for the response
        const populatedComment = await Comment.findById(savedComment._id).populate("user", "firstName lastName");

        return res.status(201).json({
            success: true,
            message: "Comment added successfully",
            comment: populatedComment,
        });

    } catch (err) {
        console.error("Error creating comment:", err);
        return res.status(500).json({ success: false, error: "Error while creating comment" });
    }
};


// DELETE A COMMENT (This is the corrected function)
exports.deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const userId = req.user.id;

        // Find the comment to be deleted
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, error: "Comment not found" });
        }

        // Find the user trying to delete it, to check their role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // --- Authorization Check ---
        // Allow deletion if the user is the comment's author OR if the user is an admin
        if (comment.user.toString() !== userId && user.role !== 'admin') {
            return res.status(403).json({ success: false, error: "You are not authorized to delete this comment" });
        }

        // Proceed with deletion
        await Post.findByIdAndUpdate(postId, { $pull: { comments: commentId } });
        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({ success: true, message: "Comment deleted successfully" });

    } catch (err) {
        console.error("Error deleting comment:", err);
        return res.status(500).json({ success: false, error: "Error while deleting comment" });
    }
};