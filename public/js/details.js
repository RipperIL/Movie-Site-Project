document.addEventListener("DOMContentLoaded", async function() {
// Define the necessary variables
const url = "https://www.imdb.com/";
const detailsContainer = document.getElementById("Details");
const imgContainer = document.getElementById("image-container");
const allLinks = document.getElementById("links");
const spinner = document.getElementById("loading-spinner");

 // Show the loading spinner and hide other content initially
spinner.style.visibility = "visible";
detailsContainer.style.visibility ="hidden";
imgContainer.style.visibility ="hidden";
allLinks.style.visibility ="hidden";

// Check if imdbid or query is null, return early if so
if(imdbid === null || query === null) return

let query_changable = query;
let findMovie;
let favorites;

// Retrieve the favorites and check if the movie exists in the favorites list
await getFavorites().then(movies =>{ 
  findMovie = movies.find(movie => movie.id === imdbid);
  favorites = movies;
})

// Fetch movie details from the API
MovieAPI.fetchMoviesDetails(imdbid).then(response => {
  let youtubeIframe = MovieAPI.searchYouTubeTrailer(response.title);    // Search for YouTube trailer for the movie
  let hrefUrl = '/favorites'
  const movieImage = `<img src="${response.poster}" alt="${response.title}" class="img-fluid">`;
  let buttonHTML = '';
  let btn = null;
  let backToFavorites = null;

// If the movie is already in the favorites, change the button to 'Remove from Favorites'
  if(findMovie){
    buttonHTML = `class="btn btn-outline-danger"`;
    btn = `<button onclick="MovieAPI.addFavorite('${response.imdbID}','${query_changable}')" ${buttonHTML} id="remove"><i class="fas fa-clapperboard"></i> Remove from Favorites</button>`;
    backToFavorites = `<a href="${hrefUrl}" class="btn btn-outline-warning"><i class="fas fa-film"></i> Back to Favorites</a>`;
  }
  else{
    buttonHTML = `class="btn btn-outline-success"`;
    btn = `<button onclick="MovieAPI.addFavorite('${response.imdbID}','${query_changable}')" ${buttonHTML} id="changable"><i class="fas fa-film"></i> Add to Favorites</button>`;
    backToFavorites = ``;
    }

// Display the movie image and the button for adding/removing from favorites
    document.getElementById('image').innerHTML = movieImage;
// Modify href URL based on the query
    if(query_changable != '')
      hrefUrl = `?query=${query_changable}`; 
    else
      hrefUrl = '';

    let ratings = response.rating.map(element => `
        <p class="rating-item"><i class="fa-solid fa-arrow-right" style="color: #54ff4a;"></i> <b>${element.Source}:</b> ${element.Value}</p>
    `).join('');
      
// Movie details display
    const detail = `
                  <p><div class="custom-h">Released:</div> ${response.released}</p>
                  <p><div class="custom-h">Genre:</div> ${response.genre}</p>
                  <p><div class="custom-h">Director:</div> ${response.director}</p>
                  <p><div class="custom-h">Actors:</div> ${response.actors}</p>
                  <p><div class="custom-h">Plot:</div><br> ${response.plot}</p>
                  <p><div class="custom-h">Box Office:</div> ${response.boxOffice}</p>
                  <p><div class="custom-h">Runtime:</div> ${response.runtime}</p>
                  <p><div class="custom-h">Ratings:</div> ${ratings}</b></p>
                  ${btn}
                  <a href="${url}title/${response.imdbID}" target="_blank" class="btn btn-outline-warning"><i class="fab fa-imdb"></i> IMDB</a>
                  ${backToFavorites}
                  <a href="/${hrefUrl}" class="btn btn-outline-warning"><i class="fas fa-search"></i> Back to Search</a>
                  `;
      detailsContainer.innerHTML = detail;

// Handle the YouTube trailer if available
      youtubeIframe.then(htmlElement => {
      if(htmlElement !== null){
        detailsContainer.innerHTML += `<button id="showTrailer" class="btn btn-outline-warning" onclick="showTrailer()"><i class="fa-solid fa-film"></i> Show Trailer</button>`;
        detailsContainer.innerHTML += htmlElement.iframeString;
        
        // Render links associated with the movie
        if(youtubeIframe){
          MovieAPI.renderLinks(imdbid,1,role);
          
          spinner.style.visibility ="hidden";
          detailsContainer.style.visibility ="visible";
          imgContainer.style.visibility ="visible";
          allLinks.style.visibility ="visible";
        }
      }
    })
  });
});

// Function to retrieve favorite movies
async function getFavorites(){
  try{
  const response = await fetch('/favorites/retrieve', {
      method: 'GET',
      credentials: 'include',
    });
  if(response.ok){
      const data = await response.json();
      return data.movies;
  }
  }catch(err){
    console.error(err);
  }
}

// Function to toggle trailer visibility
function showTrailer() {
  try {
    let button = document.getElementById('showTrailer');
    let iframe = document.getElementById('youtube-iframe');

    if (button.textContent.trim() === 'Show Trailer') {
      iframe.style.display = 'block'; // Use 'block' instead of 'visible'
      button.innerHTML = `<i class="fa-solid fa-film"></i> Hide Trailer`;
    } else {
      iframe.style.display = 'none'; // Hides completely
      button.innerHTML = `<i class="fa-solid fa-film"></i> Show Trailer`;
    }
  } catch (err) {
    console.error(err);
  }
}