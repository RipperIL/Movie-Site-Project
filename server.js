// All requires
const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const sqlite3 = require("sqlite3").verbose();
const session = require('express-session');
const path = require("path");
const userRouter = require("./routes/userRoutes");
const favoriteRouter = require("./routes/userFavoritesRoutes");
const linkRouter = require("./routes/linksRoutes");
const reviewController = require("./routes/reviewRoutes")
const flash = require('connect-flash');

// App and Port
const app = express();
const PORT = 3000;

// MongoDB Database connection
const mongoURI = "mongodb+srv://alexieilchuk:TQXyehJEw4Oq29q1@devcluster.kuggj.mongodb.net/Appdata?retryWrites=true&w=majority&appName=devCluster";
mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// SQLite Database connection
const db = new sqlite3.Database("linksDatabase.sqlite", (err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    InitDatabase();
    InitReviewsRating();
  }
});

// All sets and uses with routers
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views")); 
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized:false,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:true }));
app.use(flash());
app.use(express.static(path.join(__dirname, "public"))); 
app.use("/users", userRouter);                              // Handle User registers and logins
app.use("/favorites", favoriteRouter);                      // Handle favorite movies
app.use("/links", linkRouter);                              // Handle all links
app.use("/reviews",reviewController);                       // Handle all reviews for links

// Default page manipulation hide index.html
app.get("/", (req, res) => {
    if(req.session.user && req.session){
        if(req.query.query != undefined) res.render("index",{ fullName : req.session.user.fullName,role: req.session.user.role ,query: req.query.query});
        else res.render("index",{ fullName : req.session.user.fullName,role: req.session.user.role , query: ''});
    }
    else{
        res.render("home");
    }
  });

// Handle login page
app.get('/login', (req, res) =>{
    res.render("login", { 
        success : req.flash('success'),
        error : req.flash('error'),
    });
});

// Handle registration page
app.get('/register', (req, res) =>{
    res.render("register", { 
        success : req.flash('success'),
        error : req.flash('error'),
    });
});

// Handle favorites page if not logged in redirect
app.get('/favorites', (req, res) =>{
    if(req.session.user && req.session){
        res.render("favorites",{ fullName : req.session.user.fullName, role: req.session.user.role });
    }else{
        res.redirect('/login');
    }
});

// Handle details page if not logged in redirect
app.get('/details', async (req, res) => {
    if(req.session.user && req.session){
        const { imdbID, query } = req.query;
        res.render("details", { imdbID, query , fullName : req.session.user.fullName,role: req.session.user.role});
    }else{
        res.redirect('/login');
    }
});

// Handle dashboarduser for top links
app.get('/dashboarduser/:userID', (req, res) => {
    if (req.session && req.session.user && req.params.userID === req.session.user.fullName) {
        res.render('dashboarduser', { fullName: req.session.user.fullName });
    }
    else {
        res.redirect(`/Unauthorized user :)`);
    }
});

// Handle Admin dashboards
app.get('/dashboard/:userID', (req, res) => {
    if (req.session && req.session.user) {
        if(req.session.user.role === 'Admin'){
            res.render('dashboard',{ userName: req.session.user.userName });
        }
    }else {
        res.redirect(`/Unauthorized user :)`);
    }
});

// Handle logout
app.post('/logout', (req, res) => {
    req.session.user = null;
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/');
    });
});

app.get('/N/A', (req, res) => {});

// Handle 404 page
app.use((req, res, next) => {
    res.status(404).render(path.join(__dirname, "Views", "404"));
});

// Activate server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Create the Links Table in SQLite3
function InitDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS Links (
        linkID INTEGER PRIMARY KEY AUTOINCREMENT,
        movieID TEXT,
        userID TEXT,
        linkName TEXT,
        link TEXT,
        linkDescription TEXT,
        linkType TEXT,
        clicks INTEGER DEFAULT 0
    );`, (err) => {
        if (err) {
            console.error("Error creating Links table:", err.message);
        }
    });
}

// Create the Reviews Table in SQLite3
function InitReviewsRating(){
    db.run(`
        CREATE TABLE IF NOT EXISTS Reviews (
        linkID INTEGER,
        userID TEXT,
        review TEXT NULL,
        rating INTEGER NULL,
        FOREIGN KEY (linkId) REFERENCES links(linkId),
        FOREIGN KEY (userId) REFERENCES users(userId)
    );`, (err) => {
        if (err) {
            console.error("Error creating Links table:", err.message);
        }
    });
}
