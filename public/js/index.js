// Initializing variables to reference DOM elements
let searchInputElement = null;
const containerMoviesDiv = document.getElementById('movies-container');
const containerMoviesFavorites = document.getElementById('movies-container-favorite');
const welcomeUser = document.getElementById('welcome');
let debounceTimer;

// Event listener to trigger after the DOM has been fully loaded
document.addEventListener("DOMContentLoaded", async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message) {
        alert(message);     // Naughty user :)
    }

    // Get the search input element and pre-fill it with query if available
    searchInputElement = document.getElementById("search-txt-movie");
    if (query.length > 0) {
        searchInputElement.value = query;
        document.getElementById("loading-spinner").style.visibility = "visible"; // Show loading spinner
        containerMoviesDiv.style.visibility = "hidden";
        try {
            const movies = await MovieAPI.fetchMovies(query);
            MovieAPI.RenderMoviesCard(movies, containerMoviesDiv, query);
        } catch (error) {
            console.error("Error fetching movies:", error);
        } finally {
            document.getElementById("loading-spinner").style.visibility = "hidden"; // Hide spinner when done
            containerMoviesDiv.style.visibility = "visible";
        }
    }

    // Event listener for input changes in the search field
    searchInputElement.addEventListener('input', function() {
        inputSearch();
    });
});

// Function to handle search input and fetch movies
async function inputSearch() {
    let querys = searchInputElement.value;
    if (querys.length >= 3) { // Only search if the input length is 3 or more characters
        containerMoviesDiv.innerHTML = "";
        document.getElementById("loading-spinner").style.visibility = "visible"; // Show loading spinner
        containerMoviesDiv.style.visibility = "hidden"; 

        clearTimeout(debounceTimer);

            debounceTimer = setTimeout(async () => {
            try {
                const movies = await MovieAPI.fetchMovies(querys); // Fetch movies based on input
                MovieAPI.RenderMoviesCard(movies, containerMoviesDiv, querys); // Render the movie cards
            } catch (error) {
                console.error("Error fetching movies:", error);
            } finally {
                document.getElementById("loading-spinner").style.visibility = "hidden";
                containerMoviesDiv.style.visibility = "visible";
            }
        },500);
    }
    else {
        containerMoviesDiv.innerHTML = "";
    }
}

// Function to show the favorites page
function showFavorites() {
    let url = '/favorites';
    if (searchInputElement.value) {
        url += '?query=' + searchInputElement.value; // Append query to URL if there's a search input
    }
    window.location.href = url; // Navigate to favorites page
}

// Function to show the user's dashboard
function showDashboard() {
    window.location.href = `/dashboarduser/${user}`;
}

// Function to show the Admin's dashboard
function showDashboardAdmin() {
    window.location.href = `/dashboard/${role}`;
}
