// Backened/config/database.js

const mongoose = require("mongoose");
require("dotenv").config();

const connect = () => { // Function ka naam 'connect' rakha
    mongoose.connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ Database connection successful"))
    .catch((error) => {
        console.error("❌ Database connection error:", error);
        process.exit(1);
    });
};

// Function ko ek object ke andar export karein
module.exports = { connect };