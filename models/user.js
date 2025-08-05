const mongoose = require("mongoose");

// Define the user schema for MongoDB
const userSchema = new mongoose.Schema({
    // Full name of the user (Required)
    fullName: { type: String, required: true },

    // Unique username for the user (Required)
    userName: { type: String, required: true, unique: true },

    // Unique email address of the user (Required)
    email: { type: String, required: true, unique: true },

    // Password for authentication (Required, should be hashed before saving)
    password: { type: String, required: true },

    // Role of the user (Defaults to "user", can be "admin" for privileged access)
    role: { type: String, default: "user" },

}, { collection: 'Users' }); // Specify the collection name in MongoDB

// Export the model to be used in other parts of the application
module.exports = mongoose.model("User", userSchema);
