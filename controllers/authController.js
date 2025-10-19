// controllers/authController.js
const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../Utils/MailSender");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');

// --- OTP Bhejne Ka Logic ---
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const checkUserPresent = await User.findOne({ email });
        if (checkUserPresent) {
            return res.status(401).json({ success: false, message: "User is already registered" });
        }
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        let result = await OTP.findOne({ otp: otp });
        while (result) {
            otp = otpGenerator.generate(6, { upperCaseAlphabets: false });
            result = await OTP.findOne({ otp: otp });
        }
        const otpPayload = { email, otp };
        await OTP.create(otpPayload);
        await mailSender(
            email,
            "Verification Email from Blog Application",
            `<h1>Please confirm your OTP</h1><p>Here is your OTP code: ${otp}</p>`
        );
        res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- SIGNUP (FIXED AND FINAL VERSION) ---
exports.signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, otp, role, adminKey } = req.body;

        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({ success: false, message: "All fields are required" });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Password and Confirm Password do not match" });
        }

        // Admin Key की जाँच (सिर्फ अगर role 'admin' है)
        if (role === 'admin') {
            if (!process.env.ADMIN_KEY) {
                 console.error("ADMIN_KEY is not set in the .env file.");
                 return res.status(500).json({ success: false, message: "Server configuration error." });
            }
            if (adminKey !== process.env.ADMIN_KEY) {
                return res.status(403).json({ success: false, message: "Invalid Admin Key." });
            }
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
        if (!recentOtp || otp !== recentOtp.otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || 'user', // Default 'user' if role is not provided
        });

        const token = jwt.sign({ email: user.email, id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });

        const userDetails = user.toObject();
        delete userDetails.password;

        return res.status(200).json({
            success: true,
            message: "User registered successfully",
            token,
            user: userDetails
        });

    } catch (error) {
        console.error("SIGNUP ERROR:", error);
        return res.status(500).json({ success: false, message: "User cannot be registered. Please try again." });
    }
};


// --- LOGIN ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "User is not registered" });
        }
        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ email: user.email, id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });
            const userDetails = user.toObject();
            delete userDetails.password;
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            };
            res.cookie("token", token, options).status(200).json({ success: true, token, user: userDetails, message: "User login successful" });
        } else {
            return res.status(401).json({ success: false, message: "Password is incorrect" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "Login failure" });
    }
};


// ... (बाकी के फंक्शन्स वैसे ही रहेंगे) ...
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "This email is not registered." });
        }
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        const emailBody = `
            <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
            <p>Please click on the following link, or paste this into your browser to complete the process:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        `;
        await mailSender(email, "Password Reset Link", emailBody);

        return res.status(200).json({
            success: true,
            message: "Password reset link has been sent to your email."
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({ success: false, message: "Error sending reset password mail." });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ success: false, message: "Token is invalid or has expired." });
        }
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ success: true, message: "Password has been reset successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error resetting password." });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required." });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password." });
        }
        await Post.deleteMany({ author: userId });
        await Comment.deleteMany({ user: userId });
        await User.findByIdAndDelete(userId);
        res.status(200).json({ success: true, message: "Account deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while deleting account." });
    }
};
exports.deleteUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminUser = await User.findById(req.user.id);

        if (adminUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: "You are not authorized." });
        }

        await Post.deleteMany({ author: userId });
        await Comment.deleteMany({ user: userId });
        await User.findByIdAndDelete(userId);

        res.status(200).json({ success: true, message: "User deleted successfully by admin." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while deleting user." });
    }
};