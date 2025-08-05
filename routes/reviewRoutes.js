const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController'); // Import the review controller

// Route to fetch all reviews (Admin or authorized users)
router.get('/all-reviews', reviewController.getAllReviews);

// Route to fetch all reviews for a specific link
router.get('/:linkId', reviewController.getReviewsForLink);

// Route to add a review for a specific link
router.post('/:linkId', reviewController.addReview);

router.delete('/delete-by-key/:userId',reviewController.deleteReviewsByKey);

// Route to delete a specific review associated with a link
router.delete('/:linkId', reviewController.deleteReview);

// Route to delete all reviews (Admin only)
router.delete('/delete-reviews/:linkId', reviewController.deleteAllReviews);

module.exports = router; // Export the router for use in the main application
