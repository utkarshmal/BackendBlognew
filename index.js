// Backened/index.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const fileUpload = require('express-fileupload');
const path = require('path');

const { cloudinaryConnect } = require('./config/cloudinary');
const database = require('./config/database'); // ✅ Sahi import tareeka
const blogRoutes = require('./routes/blog');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS ko aache se configure karein
app.use(cors({
    origin: 'http://localhost:3000', // Aapka frontend is port par chal raha hai
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Zaroori Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// Database aur Cloudinary se connect karein
database.connect(); // ✅ Sahi function call
cloudinaryConnect();

// Routes ko mount karein
app.use("/api/v1/posts", blogRoutes);
app.use("/api/v1/auth", authRoutes);

// --- Production ke liye React App ko Serve Karein ---
// Yeh code production build ke liye hai. Development me iski zaroorat nahi hoti.
app.use(express.static(path.join(__dirname, '../Frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/build/index.html'));
});
// ----------------------------------------------------

// Server ko start karein
app.listen(PORT, () => {
    console.log(`✅ Server is running successfully at http://localhost:${PORT}`);
});
