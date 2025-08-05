const mongoose = require("mongoose");

// Define the user favorites schema for MongoDB
const userFavoritesSchema = new mongoose.Schema({
    // Unique username to identify the user (Required)
    userName: { type: String, required: true, unique: true },

    // Array to store favorite movies (Default is an empty array)
    favorites: { type: Array, default: [] },

}, { collection: 'UserFavorites' }); // Specify the collection name in MongoDB

// Export the model to be used in other parts of the application
module.exports = mongoose.model("UserFavorites", userFavoritesSchema);
