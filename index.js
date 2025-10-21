require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const fileUpload = require('express-fileupload');
const path = require('path');

const { cloudinaryConnect } = require('./config/cloudinary');
const database = require('./config/database');
const blogRoutes = require('./routes/blog');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// ==========================================================
// ✅ CORS FIX: Vercel और Localhost दोनों के लिए कॉन्फ़िगरेशन
// ==========================================================
const allowedOrigins = [
    'http://localhost:3000',                  // Local Development
    'https://frontend-blognew.vercel.app/',    // Vercel Deployed Frontend URL
];

app.use(cors({
    origin: function (origin, callback) {
        // अगर origin allowed list में है, या अगर कोई origin नहीं है (जैसे Postman), तो अनुमति दें
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// ==========================================================
// Zaroori Middlewares
// ==========================================================
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// Database aur Cloudinary se connect karein
database.connect();
cloudinaryConnect();

// =s========================================================
// Routes ko mount karein
// ==========================================================
app.use("/api/v1/posts", blogRoutes);
app.use("/api/v1/auth", authRoutes);

// Default Route (Backend API status check karne ke liye)
app.get("/", (req, res) => {
    res.send("<h1>Backend API is running successfully on Render!</h1>");
});

// ==========================================================
// ⚠️ Hata Diya Gaya: React App Serving Code
// Vercel + Render setup में इसकी ज़रूरत नहीं होती।
// ==========================================================

// Server ko start karein
app.listen(PORT, () => {
    console.log(`✅ Server is running successfully at port ${PORT}`);
});
