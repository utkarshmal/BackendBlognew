// backend/models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true }, // Email unique hai, yeh sahi hai
    password: { type: String, required: true },
    about: { type: String, trim: true, default: "" },
    image: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);