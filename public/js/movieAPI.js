// Define API keys and base URLs for external services
const API_KEY = '3fb43c5f';
const API_YOUTUBE_KEY = 'AIzaSyAZr8AFRDjCYOOAB9MwyMh1HJA961pnHVM';
const YOUTUBE_URL = "https://www.googleapis.com/youtube/v3/search";
const BASE_URL='http://www.omdbapi.com/';
const linksHTML = document.getElementById('links');
let edited = false;

// Movie class to represent movie objects with relevant properties
class Movie{
    constructor(id, title,year,plot,imdbid,poster,released,genre,director,actors,rating,BoxOffice,Runtime){
        this.id = id;
        this.title = title;
        this.year = year;
        this.plot = plot;
        this.imdbID = imdbid;
        this.poster = poster;
        this.released = released;
        this.genre = genre;
        this.director = director;
        this.actors = actors
        this.rating = rating;
        this.boxOffice = BoxOffice;
        this.runtime = Runtime;
        this.links = [];
    }
}

// MovieAPI class to interact with external APIs and handle movie-related actions
class MovieAPI{
    
// Fetch a list of movies from the OMDB API based on a search query
    static async fetchMovies(search){
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${search}`);
        const data = await response.json();
        if(data.Response === "True"){
            let moviesListFound = data.Search;
            return moviesListFound.map(movie => new Movie(movie.imdbID,movie.Title,movie.Year,movie.Plot,movie.imdbID,movie.Poster,movie.Released,movie.Genre,movie.Director,movie.Actors,movie.imdbRating, null, null));
        }
        return [];
    }
    
// Fetch details for a specific movie based on its IMDb ID
    static async fetchMoviesDetails(imdbid){
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbid}`);
        const data = await response.json();
        if(data.Response === "True"){
            return new Movie(data.imdbID,data.Title,data.Year,data.Plot,data.imdbID,data.Poster,data.Released,data.Genre,data.Director,data.Actors,data.Ratings,data.BoxOffice,data.Runtime);
        }
        return null;
    }

// Render the movies as cards inside a container element
    static RenderMoviesCard(movies, container,query){
      let url = '';
      if(query != ''){
        url += '&query=' + query;
      }
        movies.forEach(movie => {

          // Generate a card for each movie
          const card = `
          <div class="col-md-3 mb-4">
            <div class="card" style="width: 18rem;">
              <img src="${movie.poster}" class="card-img-top" alt="${movie.title}" onclick="window.location.href='/details?imdbID=${movie.id}${url}'">
              <div class="card-body">
                <h5 class="card-title">${movie.title}</h5>
                <p class="card-text">${movie.year}</p>
                <a href="/details?imdbID=${movie.id}${url}" class="btn btn-primary">Details</a>
              </div>
            </div>
          </div>
          `; 
          container.insertAdjacentHTML('beforeend', card);
        });

        setTimeout(() => {
          const cards = container.querySelectorAll('.card');
          cards.forEach(card => {
              card.classList.add('fade-in');
          });
      },200); // Delay to allow cards to be inserted first
    }

// Adds or removes a movie from the favorites list
    static async addFavorite(id,query){
      const removeButton = document.getElementById("remove");
      const changeBtn = document.getElementById("changable");

  // If 'remove' button is present, show a confirmation before removing the movie
      if (removeButton != null) { 
        Swal.fire({
          title: 'Are you sure?',
          text: "You can always add this movie back later!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#008000',
          cancelButtonColor: '#d33',
          cancelButtonText: `<i class="fa fa-thumbs-down"></i> Cancel`,
          confirmButtonText: `<i class="fa-solid fa-thumbs-up"></i> Yes, delete it!`
        }).then(async (result) => {
            if (result.isConfirmed) { 

  // Remove the movie from favorites
              const response = await fetch(`/favorites/remove/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
              });

              const result = await response.json();
              if(response.ok){

                // Show success message and update UI
                Swal.fire({
                  title: 'Deleted!',
                  text: 'The movie has been deleted.',
                  icon: 'success',
                  showConfirmButton: false,
                  timer: 800 
                }).then(() => {

  // Handle UI updates
                  setTimeout( async () => {

                    const addLinkButton = document.getElementById("addLink");
                    addLinkButton.className = "btn btn-secondary btn-sm disabled";
                    addLinkButton.id = "addLinkError";
                    addLinkButton.onclick = () => null;

                    removeButton.className = "btn btn-outline-success";
                    removeButton.innerHTML = `<i class="fas fa-film"></i> Add to Favorites`;
                    removeButton.id = "changable";

  // Remove associated links that the user created for the movie
                    const responseB = await fetch(`/links/${id}/allLinks`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                      });

                    if(responseB.ok){

                    // Re-render links
                      MovieAPI.renderLinks(id);
                    }
                  }, 500);
                });
              }else{

  // Action failed redirect on error
                Swal.fire({
                  title: 'Error!',
                  text: result.message,
                  icon: 'error',
                  showConfirmButton: false,
                  timer: 800 
                }).then(() => {
                  setTimeout(() => {
                    window.location.href = '/index?query=' + query;
                  }, 800);
                });
              }
            }
            });
            return;
          }

  // If movie is not in favorites, add it
        try{
          const response = await fetch(`/favorites/add/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if(response.ok){

    // Show success message after adding to favorites
              Swal.fire({
                icon: 'success',
                title: 'Movie added!',
                text: 'Movie has been added to favorites!',
                timer: 1000,
                showConfirmButton: false
              }).then(() => {
    // Update UI to show the movie was added
                  const AddLinkButton = document.getElementById("addLinkError");
                  AddLinkButton.className = "btn btn-outline-warning";
                  AddLinkButton.id = "addLink";
                  AddLinkButton.onclick = () => MovieAPI.addLink(id);

                  changeBtn.className = "btn btn-outline-danger";
                  changeBtn.innerHTML = `<i class="fas fa-clapperboard"></i> Remove from Favorites`;
                  changeBtn.id = "remove";
                  MovieAPI.renderLinks(id); // Re-render the links
                  },1000);
          }
          else{
    // Show error message if movie could not be added
            Swal.fire({
              title: 'Error!',
              text: result.message,
              icon: 'error',
              showConfirmButton: false,
              timer: 800 
            }).then(() => {},800);
          }
        }catch(err){
          console.error(err);
        }
}

// Sort the list of favorite movies by different criteria (release date, rating, name)
    static sortFavorites(sortBy) {
      var moviesFavorites = [];
      getFavorites().then(movies => {
          const promises = movies.map(movie => {
          return MovieAPI.fetchMoviesDetails(movie.id).then(data => {
              moviesFavorites.push(data);
              });
          });

// Once all movie details are fetched, sort them based on the selected criteria
      Promise.all(promises).then(() => {
        let tempMovies = moviesFavorites;
        switch (sortBy) {
          case 'release':
              tempMovies.sort((a, b) => new Date(b.released) - new Date(a.released));
              break;
          case 'rating':
              tempMovies.sort((a, b) => b.rating - a.rating);
              break;
          case 'name':
              tempMovies.sort((a, b) => a.title.localeCompare(b.title));
              break;
          default:
              break;
      }

  // Render the sorted list of favorite movies
      container.innerHTML = '';
      this.RenderMoviesCard(tempMovies, document.getElementById('movies-container-favorite'), '');
    });
  });
}

// Add a link to a movie
    static addLink(movieId){

  // Show swal asking the user to enter link details
      Swal.fire({
        title: 'Enter Details',
        html: `
            <input type="text" id="name" class="swal2-input" placeholder="Link name">
            <input type="text" id="link" class="swal2-input" placeholder="Your Link">
            <input type="text" id="description" class="swal2-input" placeholder="Description">
            <select id="linkType" class="swal2-input">
                  <option value="Private">Private</option>
                  <option value="Public">Public</option>
            </select>
        `,
        confirmButtonText: `<i class="fa-solid fa-thumbs-up"></i> Add Link!`,
        confirmButtonColor: '#008000',
        showCancelButton: true,
        cancelButtonColor: '#d33',
        cancelButtonText: `<i class="fa fa-thumbs-down"></i> Cancel`,
        focusConfirm: false,
        preConfirm: () => {

  // Get values from input fields
          const name = document.getElementById('name').value;
          const link = document.getElementById('link').value;
          const description = document.getElementById('description').value;
          const linkType = document.getElementById('linkType').value;

  // Check if all fields are filled and description is under 50 characters      
          if (!name || !link || !description || description.length > 50 || !linkType) {
              Swal.showValidationMessage('Please fill out all fields');
          }
          return { name, link, description, linkType }; // Return the entered data
      }
        }).then(async (result) => {
        if (result.isConfirmed) {

  // Create an object with the link details
          let url = result.value.link;
          const linkObj = {
            linkName: result.value.name,
            link: url,
            linkDescription: result.value.description,
            linkType: result.value.linkType
          };

  // Send the link data to the server via a POST request
          const response = await fetch(`/links/${movieId}/links`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify( linkObj ),
        });
        const resultA = await response.json();
        if(response.ok){

  // Show success or error message based on server response
          swal.fire({
            title: 'Success!',
            text: resultA.message,
            icon: 'success',
            showConfirmButton: false,
            timer: 1000
          }).then(()=>{MovieAPI.renderLinks(movieId)},1000);
      }else{
        Swal.fire({
          title: 'Error!',
          text: resultA.message,
          icon: 'error',
          showConfirmButton: false,
          timer: 800 
        }).then(() => {},800);
      }
    }
  });
}

// Edit a link to a movie
    static async editLink(movieId,linkId,isAdmin = false){

  // Fetch current link data from the server
      const response = await fetch(`/links/links/${linkId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if(response.ok){
        const oldLinkData = await response.json();

  // Show swal pre-filled with the current link data
        Swal.fire({
          title: 'Enter Details',
          html: `
              <input type="text" id="name" class="swal2-input" placeholder="Link name" value="${oldLinkData.link[0].linkName}">
              <input type="text" id="link" class="swal2-input" placeholder="Your Link" value="${oldLinkData.link[0].link}">
              <input type="text" id="description" class="swal2-input" placeholder="Description" value="${oldLinkData.link[0].linkDescription}">
              <select id="linkType" class="swal2-input">
                    <option value="Private" ${oldLinkData.link[0].linkType === "Private" ? 'selected' : ''}>Private</option>
                    <option value="Public" ${oldLinkData.link[0].linkType === "Public" ? 'selected' : ''}>Public</option>
              </select>
          `,
          confirmButtonText: `<i class="fa-solid fa-thumbs-up"></i> Update!`,
          showCancelButton: true,
          cancelButtonColor: "#d33",
          cancelButtonText: `<i class="fa-solid fa-thumbs-down"></i> Cancel`,
          focusConfirm: false,
          preConfirm: () => {

  // Get updated values from input fields
            const name = document.getElementById('name').value;
            const link = document.getElementById('link').value;
            const description = document.getElementById('description').value;
            const linkType = document.getElementById('linkType').value;

  // Validate the form
            if (!name || !link || !description || description.length > 50 || !linkType) {
              Swal.showValidationMessage('Please fill out all fields');
            }
            return { name, link, description, linkType };   // Return the entered data
          },
        }).then(async (result) => {
            if (result.isConfirmed) {
              if(oldLinkData.link[0].linkName === result.value.name &&
                 oldLinkData.link[0].link === result.value.link &&
                 oldLinkData.link[0].linkDescription === result.value.description &&
                 oldLinkData.link[0].linkType === result.value.linkType
              ){
                return;
              }
              let url = result.value.link;
    // Create an object with the updated link details
              const linkObj = {
                linkName: result.value.name,
                link: url,
                linkDescription: result.value.description,
                linkType: result.value.linkType
              };

    // Send the updated link data via a PUT request
              const responseA = await fetch(`/links/${movieId}/links/${linkId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify( linkObj ),
              });
              const resultA = await responseA.json();

    // Show success or error message based on server response
              if(responseA.ok){
                swal.fire({
                  title: 'Success!',
                  text: resultA.message,
                  icon: 'success',
                  showConfirmButton: false,
                  timer: 1000
                }).then(()=>{isAdmin ? showLinksTable(true) :  MovieAPI.renderLinks(movieId) },1000);
              }else{
                Swal.fire({
                  title: 'Error!',
                  text: resultA.message,
                  icon: 'error',
                  showConfirmButton: false,
                  timer: 800 
                }).then(() => {},800);
              }
            }
    });
  }
}

// Remove a link from a movie
    static async removeLink(movieId,linkId,isAdmin = false){
      let check = { ok : true };

  // Show confirmation swal before deletion
      swal.fire({
        title: 'Delete Link!',
        text: 'Are you sure you want to delete this link?',
        icon: 'warning',
        confirmButtonText: `<i class="fa-solid fa-thumbs-up"></i> Delete!`,
        showCancelButton: true,
        cancelButtonColor: "#d33",
        cancelButtonText: `<i class="fa-solid fa-thumbs-down"></i> Cancel`,

      }).then(async (confirmButton) => {
        if (confirmButton.isConfirmed) {

  // Send DELETE request to remove the link
          const response = await fetch(`/links/${movieId}/links/${linkId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          });
          const result = await response.json();

  // If the user is an admin, also delete related reviews
          if(isAdmin){
              check = await fetch(`/reviews/delete-reviews/${linkId}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
          });
          }
      
  // Show success or error message based on server response
          if(response.ok && check.ok){
            swal.fire({
              title: 'Success!',
              text: result.message,
              icon: 'success',
              showConfirmButton: false,
              timer: 1000
            }).then(()=>{isAdmin ? showLinksTable(true) :  MovieAPI.renderLinks(movieId)},1000);
          }else{
            Swal.fire({
              title: 'Error!',
              text: result.message,
              icon: 'error',
              showConfirmButton: false,
              timer: 800 
            }).then(() => {},800);
          }
      }});
}

// Render the links on each movie, with pagination (5 links per page)
    static async renderLinks(movieId, page = 1, isAdmin) {
      
  // Clear the container where links will be displayed
      linksHTML.innerHTML = '';
      let htmlChanger = '';
      let startButtonChanger = '';
      let indicator = false;

  // Get public and private links (and user information)
      const { links: publicLinks, userId } = await getLinksByType(movieId, 'public');
      const { links: privateLinks, privateuserId } = await getLinksByType(movieId, 'private');
      const removeButton = document.getElementById("remove");
    
  // Determine which "Add Link" button to show based on the presence of a "remove" button
      if (removeButton || isAdmin === 'Admin') {
          startButtonChanger = `
                              <div class="col mb-4 mt-4">
                                <div>
                                  <button onclick="MovieAPI.addLink('${movieId}')" class="btn btn-outline-warning" id="addLink">Add Link</button>
                                </div>
                              </div>`;
      } else {
          startButtonChanger = `
                              <div class="col mb-4 mt-4">
                                <div>
                                  <button class="btn btn-secondary btn-sm" disabled id="addLinkError">Add link</button>
                                </div>
                              </div>`;
          indicator = true;   // Set flag to include only public links
      }
      let allLinks = startButtonChanger;
      
      // If no links exist, display a message
      if (publicLinks.length === 0 && privateLinks.length === 0) {
          allLinks += '<p>No links available for this movie.</p>';
          linksHTML.innerHTML = allLinks;
          return;
      }
    
      // Build the table header
      allLinks += `
                    <table class="table table-bordered text-white custom-table">
                      <thead>
                        <tr>
                          <th>Link Name</th>
                          <th>Description</th>
                          <th>Link</th>
                          <th>Privacy</th>
                          <th>Actions</th>
                          <th>Rating</th>
                          <th>Clicks</th>
                        </tr>
                      </thead>
                      <tbody`;

      // Get ratings for public links
      const ratings = await getRatings(publicLinks);
      
      // Combine public and private links based on your indicator
      const UpdatedLinks = indicator ? publicLinks : publicLinks.concat(privateLinks);
      
      // ======= Pagination Setup =======
      const perPage = 5; // 5 links per page
      const totalPages = Math.ceil(UpdatedLinks.length / perPage);
      const startIndex = (page - 1) * perPage;
      const linksPage = UpdatedLinks.slice(startIndex, startIndex + perPage);
      // =================================

  // Build table rows for only the links on the current page
      let locked = `<i class="fa-solid fa-lock"></i>`;
      linksPage.forEach(element => {
      if (element.userID !== userId) {
        htmlChanger = `<button onclick="showReviews('${element.linkID}','${movieId}')" class="btn btn-outline-light"><i class="fa-solid fa-star"></i></button>`;
      } else {
        htmlChanger = `<button onclick="showReviews('${element.linkID}','${movieId}')" class="btn btn-outline-light"><i class="fa-solid fa-star"></i></button>
                       <button onclick="MovieAPI.editLink('${movieId}','${element.linkID}')" class="btn btn-outline-warning"><i class="fas fa-edit"></i></button>
                       <button onclick="MovieAPI.removeLink('${movieId}','${element.linkID}')" class="btn btn-outline-danger"><i class="fas fa-trash-alt"></i></button>`;
      }
      allLinks += `
                  <tr>
                    <td>${element.linkName}</td>
                    <td>${element.linkDescription}</td>
                    <td align="center"><a href="${element.link}" target="_blank" onclick="MovieAPI.incrementClick(${element.linkID},'${'details'}','${movieId}', '${isAdmin}')" class="btn btn-info btn-sm"><i class="fas fa-eye"></i>View Link</a></td>
                    <td align="center">${element.linkType}</td>
                    <td align="center">${htmlChanger}</td>
                    <td align="center">${element.linkType === 'Public' ? ratings[element.linkID] : locked}</td>
                    <td align="center">${element.clicks}</td>
                  </tr>`;
      });

      allLinks += `</tbody></table>`;
    
      // Add pagination controls if more than one page exists
      if (totalPages > 1) {
      allLinks += `
                  <div class="pagination-controls" style="text-align: center; margin-top: 10px; color:white;">
                    <button class="btn btn-outline-warning" onclick="MovieAPI.renderLinks('${movieId}', ${page - 1})" ${page <= 1 ? 'disabled' : ''}>⬅ Previous</button>
                    <span> Page ${page} of ${totalPages} </span>
                    <button class="btn btn-outline-warning" onclick="MovieAPI.renderLinks('${movieId}', ${page + 1})" ${page >= totalPages ? 'disabled' : ''}>Next ➡</button>
                  </div>`;
      }
    
      // Render the HTML in the container element
      linksHTML.innerHTML = allLinks;
      return true;
}

// Increment the click count for a link
    static async incrementClick(linkId, source, movieId, isAdmin){

  // Send PUT request to increment the click count for the specified link
      await fetch(`/links/${linkId}/increment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      switch(source){
        case 'table':
          showLinksTable(true);
          break;
        case 'card':
          fetchAndDisplayTopMovies('card');
          break;
        case 'details':
          this.renderLinks(movieId,1,isAdmin);
        case 'AdminReview':
          showReviewsTable(true);
        default:
          break;
      }
    }

// Search for a trailer on YouTube
    static async searchYouTubeTrailer(MovieName) {
      const query = `${MovieName} official trailer`;
      const url = `${YOUTUBE_URL}?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${API_YOUTUBE_KEY}`;
      try {
          const response = await fetch(url);
          if (!response.ok) {
              throw new Error(`Error: ${response.status}`);
          }
          const data = await response.json();
          if (data.items && data.items.length > 0) {
              const videoId = data.items[0].id.videoId; 
              const iframeString = `
                                    <div id="youtube-iframe" class="iframe-container">
                                      <iframe 
                                        src="https://www.youtube.com/embed/${videoId}" 
                                        width="100%" 
                                        height="500" 
                                        frameborder="0" 
                                        allowfullscreen>
                                      </iframe>
                                      </div>`;
              return { iframeString: iframeString || '' };
         } else {
           return '';
         }
       } catch (error) {
         console.error('Error fetching YouTube trailer:', error);
       }
    }
    
// Signout Function
      static async signOut() {
        Swal.fire({
          title: 'Logout',
          text: 'Are you sure you want to Logout?',
          icon: 'question',
          confirmButtonText: `<i class="fa-solid fa-thumbs-down"></i> Yes!`,
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          cancelButtonText: `<i class="fa-solid fa-thumbs-up"></i> Stay`,
  
        }).then(async (confirmButton) => {
          if (confirmButton.isConfirmed) {
            try {
              const response = await fetch('/logout', {
                  method: 'POST',
                  credentials: 'include',
              });
              if (response.redirected) {
                  window.location.href = response.url;
              } else {
                  console.log('Logout failed:', await response.text());
                  Swal.fire({
                    title: 'Signout',
                    text: 'Something went wrong!',
                    icon: 'error',
                  })
              }
          } catch (error) {
              console.error('Error signing out:', error);
              Swal.fire({
                title: 'Error',
                text: 'Network error! Please try again.',
                icon: 'error',
            });
          }
          }
          
      });
 }
}

//________________________End of MovieAPI__________________________________________

// Fetch the links of a specified type ('public' or 'private') for a movie
  async function getLinksByType(movieId, linkType) {
    try {
        let endpoint = `/links/${movieId}/links`;

        // If the link type is 'public', update the endpoint
        if (linkType === 'public') {
            endpoint = `/links/${movieId}/links/public`;
        }

  // Fetch the links from the server with the specified endpoint
        const response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
        });

  // Check if the response is successful
        if (response.ok) {
            const data = await response.json();
            return { links : data.links, userId : data.userId };
        } else {
            console.error(`Failed to fetch links of type: ${linkType}`);
        }
    } catch (err) {
        console.error('Error fetching links:', err);
    }
}

// Function to show reviews for a link, called when the "Review" button is clicked
async function showReviews(linkId, movieId,isAdmin = false) {
  // Fetch reviews for the given link
  const response = await fetch(`/reviews/${linkId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  // Open a swal to display the reviews and a form to leave a new review
  Swal.fire({
      title: 'Link Reviews',
      width: '80%',
      html: `
          <div id="reviews-block" style="display: flex; justify-content: space-between; padding: 10px;">
              <div outer-container>
                  <h1>What Others Say</h1>
                  <div id="reviews">
                      <div id="loading-spinner-second" class="spinner-container-second">
                          <div class="spinner-border-second" role="status"></div>
                      </div>
                      <div id="review-list"></div>
                  </div>
              </div>

              <div class="separator"></div>

              <div review-side>
                  <h1>Leave a Review</h1>
                  <div class="mb-2">
                      <label class="form-label">Your Rating</label>
                      <div id="ratingStars">
                          <i class="fas fa-star star" data-value="1"></i>
                          <i class="fas fa-star star" data-value="2"></i>
                          <i class="fas fa-star star" data-value="3"></i>
                          <i class="fas fa-star star" data-value="4"></i>
                          <i class="fas fa-star star" data-value="5"></i>
                      </div>
                      <input type="hidden" id="ratingValue" value="0">
                  </div>
                  <div class="mb-2">
                      <label class="form-label">Your Review</label>
                      <textarea id="reviewText" class="form-control" rows="3" placeholder="Write your review..."></textarea>
                  </div>
                  <button id="reviewButton" class="btn btn-primary w-100 mt-2" onclick="submitReview(${linkId}, ${isAdmin})">Submit Review</button>
              </div>
          </div>
      `,
      showConfirmButton: false,
      didOpen: () => {
          initStarRating();   // Initialize the star rating system
      },
      didClose: () => {
        if(isAdmin && edited){
          showLinksTable(true);
        }
          else if(!isAdmin && edited){
            MovieAPI.renderLinks(movieId, 1, isAdmin);
        }
        edited = false;
    }
  });

  let reviewLinkTag = document.getElementById('review-list');
  const result = await response.json();
  if(response.ok){

  // If no reviews are found, display a message to the user
    if(result.reviews.length === 0){
      reviewLinkTag.innerHTML = `<p>No reviews yet! - Be the first one! <i class="fa-regular fa-face-smile"></i></p>`;
    }
    else{
  // If reviews are available, render them
      renderReviews(result,linkId);
    }
  }
}

// Function to handle submitting a review for a specific link
async function submitReview(linkId ,isAdmin = false) {
  const reviewText = document.getElementById('reviewText').value;
  const rating = document.getElementById('ratingValue').value;

  // Reset previous validation messages (if any)
  Swal.resetValidationMessage(); 

  // Validate that both review text and rating have been provided
  if (!reviewText.trim() || !rating) {
    Swal.showValidationMessage('Please fill out all fields');
    return;
  }

  // Show loading spinner and hide the review list while submitting the review
  document.getElementById('loading-spinner-second').style.display = "block";
  document.getElementById('review-list').style.display = "none";

  // Prepare the data to be sent in the POST request
  const data = {
      review: reviewText,
      rating: rating,
  };

  try {

  // Send the review data to the server
      const response = await fetch(`/reviews/${linkId}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
      });
      if (response.ok) {

  // If the review is successfully submitted, fetch the updated reviews
        const responseA = await fetch(`/reviews/${linkId}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
          }
        });

  // Process the updated reviews and render them
        const result = await responseA.json();
        if(responseA.ok){
          edited = true;
          renderReviews(result,linkId, isAdmin);
        }
        else{

  // Show an error if the reviews could not be fetched after submission
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Unable to submit your review. Please try again later.'
          });
        }
        
      } else {

  // If the POST request failed, show an error message
          Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: result.message || 'Something went wrong.'
          });
      }
  } catch (error) {

    // Catch any errors that occur during the request and show an error message
      Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Unable to submit your review. Please try again later.'
      });
  }
}

// Function to initialize the star rating system
function initStarRating() {
  const ratingContainer = document.getElementById("ratingStars");
  if (!ratingContainer) return;

  // Add an event listener for clicks on the stars
  ratingContainer.addEventListener("click", function(event) {
      if (event.target.classList.contains("star")) {
          const selectedRating = event.target.getAttribute("data-value");
          document.getElementById("ratingValue").value = selectedRating;

  // Update the visual appearance of the stars (selected or not)
          document.querySelectorAll(".star").forEach(star => {
          star.classList.remove("selected");
          if (star.getAttribute("data-value") <= selectedRating) {
              star.classList.add("selected");
          }
        });
      }
  });
}

// Function to render the reviews for a specific link
function renderReviews(reviews, linkId, isAdmin = false){

  // Check if the current user has already submitted a review for this link
  if(reviews.userReview){
    const button = document.getElementById('reviewButton');
    button.classList.replace('btn-primary', 'btn-danger');
    button.textContent = "Delete Review";
    document.getElementById('reviewText').setAttribute('disabled', true);
    document.querySelectorAll('#ratingStars .star').forEach(star => {
      star.style.pointerEvents = 'none';
      star.style.opacity = '0.5';
    });
    button.onclick = function() {
      deleteReview(linkId, isAdmin); 
    };
  }

  // Generate the HTML content for the reviews
  let injection = ``;
  reviews.reviews.forEach(element => {
    let stars = ``;

  // Generate the star rating for each review
    for(let i = 0; i < 5; i++){
      if(i < element.rating)
        stars += '<i class="fas fa-star text-warning"></i>';
      else
        stars += '<i class="far fa-star text-muted"></i>';
    }

    // Add the review with stars to the content string
    injection += `<strong>${element.userID}</strong>
                  <p>${element.review}<br>${stars}</p>`;
  });
  if(reviews.reviews.length === 0){
    document.getElementById('review-list').innerHTML = `<p>No reviews yet! - Be the first one! <i class="fa-regular fa-face-smile"></i></p>`;
  }else{
    document.getElementById('review-list').innerHTML = injection;
  }
  document.getElementById('loading-spinner-second').style.display = "none";
  document.getElementById('review-list').style.display = "block";
}

// Function to delete a review for a specific link
async function deleteReview(linkId){
  document.getElementById('loading-spinner-second').style.display = "block";
  document.getElementById('review-list').style.display = "none";

  // Send DELETE request to remove the review
  const response = await fetch(`/reviews/${linkId}`, {
    method: 'DELETE',
    headers: {
        'Content-Type': 'application/json',
    }
});

  // If the deletion is successful, fetch the updated reviews
  if(response.ok){
    const responseA = await fetch(`/reviews/${linkId}`, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
      }
  });
  const result = await responseA.json();

// Reset the review form to allow for new reviews
  const button = document.getElementById('reviewButton');
  button.classList.replace('btn-danger', 'btn-primary');
  button.textContent = "Submit Review";
  document.getElementById('reviewText').removeAttribute('disabled');
  document.querySelectorAll('#ratingStars .star').forEach(star => {
    star.style.pointerEvents = 'auto';
    star.style.opacity = '1';
  });
  button.onclick = function() {
    submitReview(linkId); 
  };

  edited = !edited;
  // Render the updated reviews
  renderReviews(result,linkId);
  }
  else{
    document.getElementById('loading-spinner-second').style.display = "none";
    document.getElementById('review-list').style.display = "block";
  }
}

// Function to get the average ratings for all public links
async function getRatings(publicLinks) {

  // Fetch all reviews for the public links
  const response = await fetch('/reviews/all-reviews', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  // Filter the reviews to only include those for the public links
  const publicLinkIds = new Set(publicLinks.map(link => link.linkID));
  const filteredReviews = result.reviews.filter(review => publicLinkIds.has(review.linkID));
  const returnal = {};

  // Calculate the average rating for each public link
  for (let linkId of publicLinkIds) {
    let sum = 0;
    let count = 0;
    for (let review of filteredReviews) {
      if (review.linkID === linkId) {
        sum += review.rating;
        count++;
      }
    }
    if (count > 0) {
      returnal[linkId] = (sum / count).toFixed(1);
    } else {
      returnal[linkId] = 0; 
    }
  }
  return returnal;
}

