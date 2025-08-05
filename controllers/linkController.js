const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("linksDatabase.sqlite");

// Function to validate and format URLs
function validateUrl(url) {
    let bonus = "http://"; 
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }
    return bonus + url;
}

const linkController = {
    
    // Add a link to a specific movie
    addLinkToMovie: (req, res) => {
        const movieId = req.params.movieId;
        let { linkName,  link, linkDescription, linkType } = req.body;
        link = validateUrl(link); 
        db.run(
          `INSERT INTO Links (movieID, userID, linkName, link, linkDescription, linkType, clicks)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [movieId, req.session.user.userName, linkName, link, linkDescription, linkType, 0],
          function (err) {
            if (err) {
              return res.status(500).json({ message: 'Error adding link', error: err.message });
            }
            else {
              return res.status(200).json({ message: 'Link added'});
            }
          }
        );
      },

      // Increment the click count for a link
      updateClick: (req, res) => {
        const linkId = req.params.linkId;
        db.run(
            `UPDATE Links SET clicks = clicks + 1 WHERE linkID = ?`,
            [linkId],
            function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Could not increment' });
                }
                return res.status(200).json({ message: 'Incremented!' });
            }
        );
    },

    // Retrieve all public links for a given movie
      getPublicLinksForMovie: (req, res) => {
        const movieId = req.params.movieId;
        const query = `SELECT * FROM Links WHERE movieID = ? AND linkType = ?`;
        db.all(query,[movieId, 'Public'],(err, rows) => {
            if (err) {
                console.error("Error fetching public links: ", err);
                return res.status(500).json({ message: "Error fetching public links", error: err.message });
            }
            return res.status(200).json({ links: rows , userId: req.session.user.userName});
        });
    },

    // Retrieve all private links for a given movie belonging to the logged-in user
    getPrivateLinksForMovie: (req, res) => {
        const movieId = req.params.movieId;
        const userId = req.session.user.userName;
        const query = `SELECT * FROM Links WHERE movieID = ? AND userID = ? AND linkType = ?`;
        db.all(query, [movieId, userId, 'Private'],
            (err, rows) => {
              if (err) {
                return res.status(500).json({ message: 'Error retrieving links', error: err.message });
              }
              return res.status(200).json({ message: 'Links Found.', links: rows , userId: null });
            }
          );
    },

    // Update an existing link in the database
    updateLink: (req, res) => {
        const { movieId, linkId } = req.params;
        const { linkName, link, linkDescription, linkType } = req.body;
        const query = `UPDATE Links SET linkName = ?, link = ?, linkDescription = ?, linkType = ? WHERE linkID = ?`;
        db.run(query, [linkName, link, linkDescription, linkType, linkId], function(err) {
            if (err) {
                console.error("Error updating link:", err);
                return res.status(500).json({ message: "Error updating link" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "Link not found" });
            }
            return res.status(200).json({ message: "Link updated" });
        });
    },

    // Retrieve a specific link by ID
    getLinkById: (req, res) => {
        const linkId = req.params.linkId;
        const query = `SELECT * FROM Links WHERE linkID = ?`;
        db.all(query, [linkId], (err, row) => {
            if (err) {
                console.error("Error fetching link:", err);
                return res.status(500).json({ message: "Error fetching link" });
            }
            if (!row) {
                return res.status(404).json({ message: "Link not found" });
            }
            return res.status(200).json({ link: row });
        });
    },

    // Delete a specific link from the database
    deleteLink: (req, res) => {
        const { movieId, linkId } = req.params;
        const query = `DELETE FROM Links WHERE linkID = ?`;
        db.run(query, [linkId], function(err) {
            if (err) {
                console.error("Error deleting link:", err);
                return res.status(500).json({ message: "Error deleting link" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "Link not found" });
            }
            return res.status(200).json({ message: "Link deleted" });
        });
    },
    
    // Delete all links for a specific movie belonging to the logged-in user
    deleteAllLinks: (req, res) => {
        const movieId = req.params.movieId;
        const query = `DELETE FROM Links WHERE movieID = ? AND userID = ?`;
        db.run(query, [movieId, req.session.user.userName], function(err) {
            if (err) {
                console.error("Error deleting links:", err);
                return res.status(500).json({ message: "Error deleting links" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "Links not found" });
            }
            return res.status(200).json({ message: "Links deleted" });
        });
    },

    // Retrieve all links from the database
    getAllLinks: (req, res) =>{
      const query = `SELECT * FROM Links`;  
      db.all(query,[],
        (err,rows) => {
        if (err) {
            console.error("Error fetching links:", err);
            return res.status(500).json({ message: "Error fetching links" });
        }
        return res.status(200).json({ links : rows})
      });
    },
};

module.exports = linkController;
