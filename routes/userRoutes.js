const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController"); // Import the user controller

// Route for user registration
// This handles new user sign-ups by taking user credentials and storing them in the database
router.post("/register", userController.register);

// Route for user login
// This verifies user credentials and creates a session/token for authentication
router.post("/login", userController.login);

// Route for user logout
// This ends the user's session and removes authentication details
router.get("/logout", userController.logout);

// Route for user count
router.get("/getCount", userController.getCount);

// Route for all users
router.get("/getUsers", userController.getUsers);

// Route for updating user
router.put('/update/:id', userController.updateUser);

// Route for user removal
router.delete('/update/:id', userController.removeUser);

module.exports = router; // Export the router for use in the main application
