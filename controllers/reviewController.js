const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("linksDatabase.sqlite");

const reviewController = {

    // Add a review to a specific link
    addReview: (req,res) =>{
        const { review, rating } = req.body;
        const linkId = req.params.linkId;
        db.run(
            `INSERT INTO Reviews (linkID, userID, review, rating)
             VALUES (?, ?, ?, ?)`,
             [linkId, req.session.user.userName, review, rating],
             function (err){
                if(err){
                    return res.status(500).json({ message: `Error adding review` , error: err.message });
                }
                else{
                    return res.status(200).json({ message: 'Review added'});
                }
             }
        );
    },

    // Delete a specific review by the logged-in user
    deleteReview: (req,res) => {
        const linkId = req.params.linkId;
        db.run(
            `DELETE FROM Reviews WHERE userID = ? AND linkID = ?`,
            [req.session.user.userName, linkId],
            function(err){
                if(err){
                    return res.status(500).json({ message: "Error deleting Review" });
                }
                if (this.changes === 0) {
                    return res.status(200).json({ message: "Review not found" });
                }
                return res.status(200).json({ message: "Review deleted" , userReview : false});
            }
        );
    },

    // Get all reviews for a specific link
    getReviewsForLink: (req, res) => {
        const linkId = req.params.linkId;
        db.all(
            `SELECT * FROM Reviews WHERE linkID = ?`,[linkId],
            (err, rows) => {
                if(err){
                    return res.status(500).json({ message: "Error finding reviews"})
                }
                if (rows.length === 0) {
                    return res.status(200).json({ message: "Reviews not found", reviews : [] });
                }
                return res.status(200).json({ reviews: rows , userReview : rows.some(row => row.userID === req.session.user.userName) });
            }
        );
    },
    
    // Get all reviews from the database
    getAllReviews: (req, res) => {
        db.all(
            `SELECT * FROM Reviews`,[],
            (err, rows) => {
                if(err){
                    return res.status(500).json({ message: "Error finding reviews"})
                }
                if (rows.length === 0) {
                    return res.status(200).json({ message: "Reviews not found", reviews : [] });
                }
                return res.status(200).json({ reviews: rows });
            }
        );
    },
    
    deleteReviewsByKey: (req, res) =>{
        const userId = req.params.userId;
        const { linkID } = req.body;
        db.run(
            `DELETE FROM Reviews WHERE userID = ? AND linkID = ?`,[userId,linkID],(err) =>{
                if(err){
                    return res.status(500).json({message: "Error deleting all reviews"});
                }
                return res.status(200).json({ message: "All reviews for link deleted"})
            }
        )
    },

    // Delete all reviews for a specific link
    deleteAllReviews: (req, res) => {
        const linkId = req.params.linkId;
        db.run(
            `DELETE FROM Reviews WHERE linkID = ?`,[linkId],(err) => {
                if(err){
                    return res.status(500).json({message: "Error deleting all reviews"});
                }
                return res.status(200).json({ message: "All reviews for link deleted"})
            }
        );
    },
}

module.exports = reviewController;