const userFavorites = require("../models/UserFavorites");

// Helper function to get user from session
const getUserFromSession = async (req) => {
  if (!req.session || !req.session.user) {
      return null;
  }
  try {
      return await userFavorites.findOne({ userName: req.session.user.userName });
  } catch (err) {
      console.error("Database error:", err);
      return null;
  }
};

const userFavoriteController = {

  // Retrieve user's favorite movies
    retrieveFavorites: async (req, res) => {
        const user = await userFavorites.findOne({ userName: req.session.user.userName });
        if(!user){
          return res.status(401).json({ message: "Unauthorized access. Please log in." });
        }
        if (user.favorites.length === 0) {
            return res.status(200).json({ message: "No favorites found for this user." , movies: []}); 
          }
        return res.status(200).json({ message: "Movies loaded", movies: user.favorites });
      },

  // Remove a movie from favorites
    removeMovie: async (req, res) => {
      const user = await getUserFromSession(req);
      if (!user) {
          return res.status(401).json({ message: "Unauthorized access. Please log in." });
      }
      try {
        const movieId = req.params.id;
        const movieExists = user.favorites.some(favorite => favorite.id === movieId);

        if (!movieExists) {
            return res.status(400).json({ message: "Movie not found in favorites." });
        }

        user.favorites = user.favorites.filter(movie => movie.id !== movieId);
        await user.save();
        return res.status(200).json({ message: "Movie removed from favorites." });

    } catch (err) {
        console.error("Error removing movie from favorites:", err);
        return res.status(500).json({ message: "An error occurred while removing the movie." });
    }
  },

  // Add a movie to favorites
    addMovie: async (req, res) => {
      const user = await getUserFromSession(req);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized access. Please log in." });
      }
      try{
        const movieId = req.params.id;
        const movieExists = user.favorites.some(favorite => favorite.id === movieId);
        if (movieExists) {
          return res.status(400).json({ message: "Movie is already in favorites." });
        }

        user.favorites.push({ id: req.params.id });
        await user.save();
        return res.status(200).json({ message: "Movie added to favorites." });

      }catch(err){
        console.error("Error adding movie to favorites:", err);
        return res.status(500).json({ message: "An error occurred while adding the movie." });
      }
    },
}

module.exports = userFavoriteController;