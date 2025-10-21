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
    const allowed = allowedOrigins.some(o => origin.startsWith(o));
    if (allowed) callback(null, true);
    else {
      console.error("🚫 CORS Blocked Origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// ✅ Handle preflight (OPTIONS) requests globally
app.options('*', cors());

// ==========================================================
// 🧩 Essential Middlewares
// ==========================================================
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// ==========================================================
// 🧠 Connect Database & Cloudinary
// ==========================================================
database.connect();
cloudinaryConnect();

// ==========================================================
// 🚏 Routes
// ==========================================================
app.use("/api/v1/posts", blogRoutes);
app.use("/api/v1/auth", authRoutes);

// ==========================================================
// 🧪 CORS Test Route (optional for debugging)
// ==========================================================
app.get("/cors-test", (req, res) => {
  res.json({ message: "✅ CORS is working fine!" });
});

// ==========================================================
// 🏁 Default Route (for Render health check)
// ==========================================================
app.get("/", (req, res) => {
  res.send("<h1>Backend API is running successfully on Render!</h1>");
});

// ==========================================================
// 🚀 Start Server
// ==========================================================
app.listen(PORT, () => {
  console.log(`✅ Server running successfully at port ${PORT}`);
  console.log("Allowed Origins:", allowedOrigins);
});
