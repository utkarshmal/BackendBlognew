const Post = require("../models/postModel");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const Comment = require("../models/commentModel");

// Helper function to upload file to Cloudinary
async function uploadFileToCloudinary(file, folder) {
    const options = { folder, resource_type: "auto" };
    return await cloudinary.uploader.upload(file.tempFilePath, options);
}

// Blognew/Backened/controllers/postController.js

// Helper function to upload file to Cloudinary
async function uploadFileToCloudinary(file, folder) {
    // 1. Check if the file is a video based on its MIME type
    const isVideo = file.mimetype.startsWith('video');

    const options = { 
        folder, 
      
        resource_type: isVideo ? "video" : "auto",

        format: isVideo ? "mp4" : undefined, 
        
        // Optional: Quality ko best set karein re-encoding ke dauran
        quality: isVideo ? "auto:best" : undefined 
    };
    

    return await cloudinary.uploader.upload(file.tempFilePath, options);
}





// CREATE POST (Updated to handle FormData correctly)


exports.createPost = async (req, res) => {
    try {
        const title = req.body?.title;
        const body = req.body?.body;
        const authorId = req.user.id;
        const mediaFile = req.files ? req.files.postMedia : null;

        if (!title || !body) {
            return res.status(400).json({ success: false, error: "Title and body are required" });
        }
        
        let mediaUrl = "";
        let mediaType = null;

        if (mediaFile) {
            const cloudinaryResponse = await uploadFileToCloudinary(mediaFile, "BlogAppMedia");
            mediaUrl = cloudinaryResponse.secure_url;

            // Yeh logic aapke diye gaye logs ke aadhar par 100% sahi hai
            const audioFormats = ['mp3', 'wav', 'ogg', 'm4a'];
            if (cloudinaryResponse.resource_type === 'video' && audioFormats.includes(cloudinaryResponse.format)) {
                // Agar resource 'video' hai aur format 'mp3' hai, to yeh 'audio' hai
                mediaType = 'audio';
            } else if (cloudinaryResponse.resource_type === 'video') {
                // Agar upar wala case nahi hai, to yeh sach mein 'video' hai
                mediaType = 'video';
            } else {
                // Baaki sab 'image' hai
                mediaType = 'image';
            }
        }

        const post = new Post({ title, body, author: authorId, postMedia: mediaUrl, mediaType });
        const savedPost = await post.save();
        await User.findByIdAndUpdate(authorId, { $push: { posts: savedPost._id } });
        const populatedPost = await Post.findById(savedPost._id).populate("author", "firstName lastName");

        return res.status(201).json({
            success: true,
            message: "Post created successfully",
            post: populatedPost,
        });
    } catch (err) {
        console.error("Create Post Error:", err);
        return res.status(500).json({ success: false, error: "Error while creating post" });
    }
};
// GET ALL POSTS (Updated with Pagination)
exports.getAllPosts = async (req, res) => {
  try {
    // Get page number and limit from the query, with default values
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Fetch 10 posts per page
    const skip = (page - 1) * limit;

    // Fetch only the posts for the current page
    const posts = await Post.find()
      .populate("author", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    
    // Get the total number of posts to calculate total pages
    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    // Send back the posts along with pagination info
    return res.status(200).json({ 
        success: true, 
        posts,
        totalPages,
        currentPage: page
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Error while fetching posts" });
  }
};


// GET POST BY ID (Updated to populate nested comments and likes)
// getPostById function
exports.getPostById = async (req, res) => {
    try {
        const { postId } = req.params; // Change this
        const post = await Post.findById(postId) // And this
//...
            .populate("author", "firstName lastName")
            .populate("likes", "firstName lastName") 
            .populate({
                path: 'comments',
                populate: [
                    { path: 'user', select: 'firstName lastName' },
                    { path: 'likes', select: 'firstName lastName' },
                    { 
                        path: 'replies',
                        populate: [
                            { path: 'user', select: 'firstName lastName' },
                            { path: 'likes', select: 'firstName lastName' }
                        ]
                    }
                ]
            })
            .exec();
        
        if (!post) {
            return res.status(404).json({ success: false, error: "Post not found" });
        }
        
        return res.status(200).json({ success: true, post });
    } catch (err) {
        return res.status(500).json({ success: false, error: "Error while fetching the post" });
    }
};

// UPDATE POST (Yeh function missing tha)
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params; // Change from 'id' to 'postId'
        const { title, body } = req.body;
        const userId = req.user.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ success: false, error: "Post not found" });
        }
        if (post.author.toString() !== userId) {
            return res.status(403).json({ success: false, error: "You are not authorized to update this post" });
        }

        post.title = title || post.title;
        post.body = body || post.body;
        
        const updatedPost = await post.save();
        
        return res.status(200).json({ success: true, message: "Post updated successfully", post: updatedPost });

    } catch (err) {
        return res.status(500).json({ success: false, error: "Error while updating post" });
    }
};

// DELETE POST

// ... बाकी इम्पोर्ट्स वैसे ही रहेंगे ...

// DELETE POST (अपडेट किया गया)
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params; // Change from 'id' to 'postId'
        const userId = req.user.id;
        const userRole = req.user.role;

        const post = await Post.findById(postId); // Use postId
        if (!post) {
            return res.status(404).json({ success: false, error: "Post not found" });
        }

        if (post.author.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ success: false, error: "You are not authorized to delete this post" });
        }

        // ... rest of the logic to delete from Cloudinary and DB
        
        await Post.findByIdAndDelete(postId); // Use postId
        await User.findByIdAndUpdate(post.author, { $pull: { posts: postId } }); // Use postId
        
        return res.status(200).json({ success: true, message: "Post and associated comments deleted successfully" });
    } catch (err) {
        console.error("Error deleting post:", err);
        return res.status(500).json({ success: false, error: "Error while deleting post" });
    }
};

// ... बाकी के फंक्शन्स वैसे ही रहेंगे ...

//  FUNCTION user ke profile pe posts dikhane ke liye
exports.getPostsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await Post.find({ author: userId })
            .populate("author", "firstName lastName")
            .sort({ createdAt: -1 });
        
        return res.status(200).json({ success: true, posts });

    } catch (err) {
        return res.status(500).json({ success: false, error: "Failed to fetch user posts" });
    }
};
exports.getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.user.id }).populate('author', 'firstName lastName');
        res.status(200).json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
};