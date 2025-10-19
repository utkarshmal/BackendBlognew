// routes/auth.js
const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middleware/authmiddleware");

const { sendOTP, signup, login, forgotPassword, resetPassword, deleteAccount, deleteUserByAdmin } = require("../controllers/authController");

// ... (rest of the file)

// This route will now work perfectly

const {
    getMyProfile,
    updateProfile,
    deleteUser,   // Admin action
    getAllUsers   // Admin action - Added
} = require("../controllers/profileController");


// --- AUTH ROUTES ---
router.post("/sendotp", sendOTP);
router.post("/signup", signup);
router.post("/login", login);

// --- PASSWORD RESET ROUTES ---
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// --- PROFILE & ACCOUNT ROUTES (Protected) ---
router.get("/me", auth, getMyProfile);
router.put("/profile", auth, updateProfile);
router.delete("/account", auth, deleteAccount);
router.delete('/admin/delete-user/:userId', auth, deleteUserByAdmin);

// --- ADMIN ROUTES ---
router.get("/users", auth, isAdmin, getAllUsers); // Added this route
router.delete("/delete-user/:id", auth, isAdmin, deleteUser);

module.exports = router;