require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const fileUpload = require('express-fileupload');

const { cloudinaryConnect } = require('./config/cloudinary');
const database = require('./config/database');
const blogRoutes = require('./routes/blog');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// ==========================================================
// ✅ CORS FIX: Vercel + Localhost + Render Support
// ==========================================================
const allowedOrigins = [
  'http://localhost:3000',                  // Local development
  'https://frontend-blognew.vercel.app'     // Deployed frontend (no trailing slash!)
];

// If Render external URL exists, allow it too
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) allowedOrigins.push(RENDER_URL);

// ✅ Configure CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow Postman/Server
    const allowed = allowe
