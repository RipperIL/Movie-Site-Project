const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController'); // Import the link controller

// Route to fetch all links (Admin or authorized users)
router.get('/fetch-links', linkController.getAllLinks);

// Route to add a new link to a specific movie
router.post('/:movieId/links', linkController.addLinkToMovie);

// Route to fetch public links for a specific movie
router.get('/:movieId/links/public', linkController.getPublicLinksForMovie);

// Route to fetch private links for a specific movie (for authorized users)
router.get('/:movieId/links', linkController.getPrivateLinksForMovie);

// Route to update a specific link associated with a movie
router.put('/:movieId/links/:linkId', linkController.updateLink);

// Route to delete a specific link associated with a movie
router.delete('/:movieId/links/:linkId', linkController.deleteLink);

// Route to delete all links associated with a specific movie
router.delete('/:movieId/allLinks', linkController.deleteAllLinks);

// Route to fetch a specific link by its link ID
router.get('/links/:linkId', linkController.getLinkById);

// Route to increment the click count for a specific link
router.put('/:linkId/increment', linkController.updateClick);

module.exports = router; // Export the router for use in the main application
