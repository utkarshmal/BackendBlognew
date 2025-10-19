const User = require('../models/User');
const Post = require('../models/postModel'); // Import Post model
const Comment = require('../models/commentModel');

// Get current user's profile
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch profile" });
    }
};
// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const { about } = req.body;
        const userId = req.user.id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { about }, // Sirf 'about' ko update karein
            { new: true }
        ).select("-password");

        res.status(200).json({ 
            success: true, 
            message: "Profile updated successfully", 
            user: updatedUser 
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};

// controllers/profileController.js
 // Import Comment model

// ... (getMyProfile and updateProfile functions remain the same)

// For Admin: Delete any user account
// controllers/profileController.js


// ... getMyProfile और updateProfile फंक्शन्स वैसे ही रहेंगे ...

// --- ADMIN ACTIONS ---

// GET ALL USERS (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password'); // पासवर्ड के अलावा सब कुछ भेजें
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch users." });
    }
};

// DELETE USER (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // यूज़र से जुड़ी सभी पोस्ट और कमेंट्स डिलीट करें
        await Post.deleteMany({ author: id });
        await Comment.deleteMany({ user: id });

        // अब यूज़र को डिलीट करें
        await User.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "User and their content deleted successfully." });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while deleting user." });
    }
};