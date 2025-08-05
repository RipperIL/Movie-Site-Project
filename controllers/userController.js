const User = require("../models/user");
const userFavorites = require("../models/UserFavorites");
const validator = require("../validator");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("linksDatabase.sqlite");

const userController = {

// Handle Register function
    register: async (req, res) => {
    const { fullName, userName, email, password, confirmPassword } = req.body;
    const existingUsername = await User.findOne({ userName });
    const existingUserEmail = await User.findOne({ email });
    if(existingUsername && existingUserEmail){
        req.flash('error', 'Username and email exits.');
    }
    if (existingUsername || existingUserEmail) {
      if (existingUsername) req.flash('error', 'Username Already Exists.');
      if (existingUserEmail) req.flash('error', 'Email Already Exists.');
      return res.redirect("/register");
    }
    let errors = validator.isValidInputs(fullName, email, password, userName, confirmPassword);
    if(errors.length == 0){
        try {
            const user = new User({ fullName, userName, email, password, role: 'user' });
            await user.save();
            const subInfo = new userFavorites({ userName, favorites: [] });
            await subInfo.save();
            req.flash('success', 'Registration successful! Please log in.');
            return res.redirect("/register");
        }
        catch (err) {
            console.error("Error", err);
            req.flash('error', 'An error occurred. Please try again.');
            return res.redirect("/register");
        }
    }
    else{
      req.flash('error', errors);
      return res.redirect("/register");
    }
    },

// Handle Login function
    login: async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            req.flash('error', 'Email and password are required.');
            return res.redirect("/login");
          }
        try {
          const user = await User.findOne({ email, password });
          if (!user){
            req.flash('error', 'User not found.');
            return res.redirect("/login");
          } 
    
          req.session.user = { userName: user.userName, fullName: user.fullName, role: user.role};
          req.flash('success', 'Login successful!');
          return res.redirect("/login");

        } catch (error) {
          res.status(500).send("Error logging in: " + error.message);
        }
      },

// Handle user count
    getCount: async (req, res) => {
      try {
          const userAmount = await User.countDocuments();
          res.status(200).json({ userAmount });
      } catch (error) {
          console.error("Error fetching user count:", error);
          res.status(500).json({ message: "Server error", error: error.message });
      }
    },

// Handle getting all users
    getUsers: async (req, res) =>{
      try {
        const users = await User.find();
        res.status(200).json(users);
      } catch (error) {
          res.status(500).json({ message: 'Error fetching users', error });
      }
    },

// Handle user update
    updateUser: async (req, res) => {
      try {
        const user = await User.findById(req.params.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const originalUserName = user.userName;

        const { userName, email, password, role } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
          req.params.id,
          { userName, email, password, role },
          { new: true }
        );
    
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        db.run(`UPDATE Reviews SET userID = ? WHERE userID = ?`, [userName, originalUserName], (err) => {
          if (err) {
              return res.status(500).json({ message: "Error updating user in Reviews", error: err.message });
          }
        });
        db.run(`UPDATE Links SET userID = ? WHERE userID = ?`,[userName, originalUserName], (err) => {
          if(err){
            return res.status(500).json({message: "Error updating user in Links", error:err.message});
          }
        })

        await userFavorites.findOneAndUpdate(
          { userName: originalUserName },  
          { userName: updatedUser.userName },
          { new: true }   
        );
    

        res.status(200).json({ message: "User updated successfully" });
      } catch (error) {
        res.status(500).json({ message: "Error updating user", error });
      }
    },

// Handle remove user
    removeUser: async (req, res) => {
      try {
        const user = await User.findById(req.params.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const originalUserName = user.userName;

        const userToDel = await User.findByIdAndDelete(req.params.id);
        if (!userToDel) {
          return res.status(404).json({ message: "User not found" });
        }

        db.run(`DELETE FROM Reviews WHERE userID = ?`, [originalUserName], (err) => {
          if (err) {
              return res.status(500).json({ message: "Error deleting user reviews", error: err.message });
          }
        });
        db.run(`DELETE FROM Links WHERE userID = ?`,[originalUserName],(err) => {
          if(err){
            return res.status(500).json({ message: "Error deleting user links", error:err.message});
          }
        })
        await userFavorites.findOneAndDelete({ userName: originalUserName });
        
        res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Error deleting user", error });
      }
    },
    
    logout: (req, res) => {
      req.session.destroy();
      res.redirect("/login");
    }
}

module.exports = userController;