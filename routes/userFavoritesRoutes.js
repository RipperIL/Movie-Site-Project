const express = require("express");
const router = express.Router();
const userFavoritesController = require("../controllers/userFavoriteController"); // Import the user favorites controller

// Route to retrieve a user's favorite movies
router.get("/retrieve", userFavoritesController.retrieveFavorites);

// Route to add a movie to the user's favorites by movie ID
router.post("/add/:id", userFavoritesController.addMovie);

// Route to remove a movie from the user's favorites by movie ID
router.delete("/remove/:id", userFavoritesController.removeMovie);

module.exports = router; // Export the router for use in the main application
