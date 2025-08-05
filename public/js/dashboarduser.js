// Wait for the document to be fully loaded before executing the code
const spinner = document.getElementById('loading-spinner');
document.addEventListener("DOMContentLoaded", async function () {
    spinner.style.display = 'block';
    spinner.style.visibility='visible';

    let source = 'card';
    await fetchAndDisplayTopMovies(source);  // Call when the DOM content is fully loaded
});

async function fetchAndDisplayTopMovies(source){

    try {
         // Fetch the links data from the server
        const linksResponse = await fetch('/links/fetch-links', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        // Handle errors if links data fetching fails
        if (!linksResponse.ok) throw new Error('Failed to fetch links');
        const response = await linksResponse.json();
        const links = response.links.filter(link => link.linkType === 'Public');                        // Filter out non-public links
        const movies = await Promise.all(links.map(link => MovieAPI.fetchMoviesDetails(link.movieID))); // Fetch movie details in parallel
        const bestLinks = {};
        links.forEach(link => {
            if (!bestLinks[link.movieID] || link.clicks > bestLinks[link.movieID].clicks) {
                bestLinks[link.movieID] = link;                                                         // Keep the one with highest clicks
            }
        });

        const uniqueBestLinks = Object.values(bestLinks);                                               // Initialize pagination with the first page
        const linksPerPage = 10;
        let currentPage = 1;

        function renderPage(page) {
            const start = (page - 1) * linksPerPage;
            const end = page * linksPerPage;
            const linksToDisplay = uniqueBestLinks.slice(start, end);
            displayTopMovies(movies, linksToDisplay,source);
            displayPaginationControls(page, uniqueBestLinks.length, linksPerPage);
        }
        renderPage(currentPage);    // Display the first page on load

    } catch (error) {
        console.error("Error fetching links:", error);
    } finally {
        spinner.style.display = 'none';
    }
}

// Function to display top movies
function displayTopMovies(movies, links,source) {
    const movieContainer = document.getElementById("admin-table");
    movieContainer.innerHTML = '';
    if (links.length === 0) {
        movieContainer.innerHTML += `<h5>No top movies available.</h5>`;
        return;
    }
    const sortedMovies = links.sort((a, b) => b.clicks - a.clicks);     // Sort movies by highest clicks (descending order) and take the top 10

    sortedMovies.forEach(link => {
        const movie = movies.find(m => m.id === link.movieID);
        if (movie) {
            // Generate a card for each movie
            const card = `
            <div class="col-md-3 mb-4">
              <div class="card-second" style="width: 18rem;">
              <h5 class="title">${movie.title}</h5>
                <img src="${movie.poster}" class="card-img-top" alt="${movie.title}">
                <div class="card-body">
                  <a href="${link.link}" target="_blank" class="btn btn-info special btn-sm view-link" data-link-id="${link.linkID}" data-source="${source}"><i class="fas fa-eye"></i> View Link</a>
                  <a href="/details?imdbID=${movie.id}" class="btn btn-primary-third">Details</a>
                  <h1 class="card-text"><b>Clicked ${link.clicks} Times!</b></h1>
                </div>
              </div>
            </div>
            `; 
            movieContainer.insertAdjacentHTML('beforeend', card);
        }
    });
    
    // After the cards are inserted, attach event listeners to each "View Link" button
    setTimeout(() => {
        const viewLinkButtons = document.querySelectorAll('.view-link');
        viewLinkButtons.forEach(button => {
            button.addEventListener('click', function (event) {
                const linkId = button.getAttribute('data-link-id');
                const source = button.getAttribute('data-source');
                event.preventDefault();
                MovieAPI.incrementClick(linkId, source);
                window.open(button.href, '_blank');
            });
        });
    
        // Add fade-in effect
        const cards = document.querySelectorAll('.card-second');
        cards.forEach(card => {
            card.classList.add('fade-in');
        });
    }, 200); // Delay to allow cards to be inserted first
    
}

// Function to display pagination controls
function displayPaginationControls(currentPage, totalLinks, linksPerPage) {
    if(totalLinks === 0){
        return;
    }
    const paginationContainer = document.getElementById("pagination-controls");
    const totalPages = Math.ceil(totalLinks / linksPerPage);
    let paginationHTML = `<div class="pagination-controls" style="text-align: center;">`;

    if (currentPage > 1) {
        paginationHTML += `<button onclick="changePage(${currentPage - 1})" class="btn btn-secondary">⬅ Previous</button>`;
    }

    paginationHTML += ` <span> Page ${currentPage} of ${totalPages} </span> `;

    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${currentPage + 1})" class="btn btn-secondary">Next ➡</button>`;
    }

    paginationHTML += `</div>`;
    paginationContainer.innerHTML = paginationHTML;
}

// Function to handle page changes
function changePage(page) {
    currentPage = page;
    renderPage(currentPage);
}