// Global variables to store link data, ratings, and pagination control
let allLinksData = []; // Store all links globally
let ratingsData = []; // Store ratings globally
let userData = [];  // Store users globally
let reviewsData = []; // Store reviews globally
let reviewsMovieDetails = [];
let linkIDWithTitles = [];

let userCount = 0;
let currentPage = 1; // Keep track of the current page for pagination
let otherPage = 1;
let thirdPage = 1;

let _0x5e6f = 0;
let _0x3c4d = false;

const linksPerPage = 10; // Show 10 links per page

const user_table = document.getElementById('user-table');
const links_table = document.getElementById('links-table');
const reviews_table = document.getElementById('reviews-table');
const spinner = document.getElementById('loading-spinner');
const container = document.getElementById('container');
const searchInput = document.getElementById('search-txt');

// Search option after click on anything to edit
searchInput.addEventListener('input', function() {
    inputSearch();
});

spinner.style.display = 'block';
container.style.display = 'none';

prep(); // on accessing dashboard - load information

// Function that prepares all the information for the Admin panel
async function prep(){
    const linksResponse = await fetch('/links/fetch-links', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    const reviewResponse = await fetch('/reviews/all-reviews', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    const usersResponse = await fetch("/users/getUsers", {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    const userNum = await fetch('/users/getCount');

    // Check if the API requests were successful
    if (linksResponse.ok && reviewResponse.ok && userNum.ok && usersResponse.ok) {
        const allLinks = await linksResponse.json();
        const allReviews = await reviewResponse.json();
        const users = await userNum.json();
        const allUsers = await usersResponse.json();

        userData = allUsers;
        reviewsData = allReviews.reviews;
        clicks = allLinks.links.reduce((sum, link) => sum + link.clicks, 0);
        allLinksData = allLinks.links;
        ratingsData = getRating(allLinks, allReviews);
        userCount = users.userAmount;

        // Create a Map for linkID to movieID
        const linkIDToMovieIDMap = new Map(allLinksData.map(link => [link.linkID, link.movieID]));

        const uniqueMovieIDs = [...new Set(allLinksData.map(link => link.movieID))];

        // Fetch movie details concurrently
        const movieDetailsPromises = uniqueMovieIDs.map(movieID => MovieAPI.fetchMoviesDetails(movieID));  
        const movieDetails = await Promise.all(movieDetailsPromises);

        // Map movieID to movieTitle
        const movieIDToTitleMap = new Map(movieDetails.map(movie => [movie.id, movie.title]));
    
        // Create a new array with linkID and corresponding movie title
        linkIDWithTitles = allLinksData.map(link => ({
          linkID: link.linkID,
          movieTitle: movieIDToTitleMap.get(link.movieID),
        }));
        
        // Using Promise.all to wait for all movie details fetch operations
        reviewsMovieDetails = await Promise.all(reviewsData.map(async (review) => {
            const movieID = linkIDToMovieIDMap.get(review.linkID);
            const movieDetails = await MovieAPI.fetchMoviesDetails(movieID); // Fetch movie details
            return {
                link: allLinksData.find(link => link.linkID === review.linkID),
                movieDetails: movieDetails,
            };
        }));
    
    
    document.getElementById('amountUsers').textContent = `${userCount}`;
    document.getElementById('amountLinks').textContent = `${allLinksData.length}`;
    document.getElementById('amountReviews').textContent = `${ratingsData['review']}`;
    document.getElementById('amountClicked').textContent = `${clicks}`;

    spinner.style.display = 'none';
    container.style.display = 'flex';
    }
}
// Function to fetch links and reviews and display the admin table
async function showLinksTable(result = false, searched = null) {
    if(result) await prep();

    user_table.style.display = 'none';
    reviews_table.style.display = 'none';
    
    spinner.style.display = 'block';
    renderTable(currentPage,'',searched);
    spinner.style.display = 'none';
}

// Function that generates the userTable for edit
async function showUserTable(result = false, searched = null) {
    if(result) await prep();
    spinner.style.display = 'block';

    links_table.style.display = 'none';
    reviews_table.style.display = 'none';

    user_table.innerHTML = ""; // Clear previous table
    const startIndex = (otherPage - 1) * linksPerPage;

    const selectedUsers = searched ? searched.slice(startIndex, startIndex + linksPerPage) : userData.slice(startIndex, startIndex + linksPerPage);
    let tableHTML = `
        <table class="table table-bordered text-white custom-table-second mt-3">
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;
    selectedUsers.forEach(user => {
        tableHTML += `
            <tr>
                <td><input type="text" class="form-control" value="${user.userName}" id="username-${user._id}" data-original="${user.userName}"></td>
                <td><input type="email" class="form-control" value="${user.email}" id="email-${user._id}" data-original="${user.email}"></td>
                <td><input type="password" class="form-control" value="${user.password}" id="password-${user._id}" data-original="${user.password}"></td>
                <td>
                    <select class="form-select" id="role-${user._id}" data-original="${user.role}">
                        <option value="Admin" ${user.role === "Admin" ? "selected" : ""}>Admin</option>
                        <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-outline-warning" onclick="saveUser('${user._id}')">
                        <i class="fa-solid fa-floppy-disk"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="removeUser('${user._id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });

    tableHTML += `</tbody></table>`;
    tableHTML += paginationControls(userData, otherPage);
    user_table.innerHTML = tableHTML;

    user_table.style.display = 'block';

    setTimeout(() => {
        const table = user_table.querySelector('table');
        table.classList.add('fade-in');
    }, 200);
    spinner.style.display = 'none';

    searchInput.placeholder = "Search Users...";
    if(!searched)
        searchInput.value = '';
    searchInput.style.display = 'block';
}

// Function that generates the ReviewsTable to edit
async function showReviewsTable(result, searched = null) {
    if(result) await prep();
    if(reviewsMovieDetails.length === 0){
        reviews_table.innerHTML = `<h1>There is no DATA!</h1>`;
        reviews_table.style.display = 'block';
        user_table.style.display = 'none';
        links_table.style.display = 'none';
        searchInput.placeholder = "Search Reviews...";
        searchInput.value = '';
        return;
    }

    spinner.style.display = 'block';
    user_table.style.display = 'none';
    links_table.style.display = 'none';

    let tableBuilder = `
        <table class="table table-bordered text-white custom-table mt-3 third">
            <thead class="thead-light">
                <tr>
                    <th>Link Id</th>
                    <th>User Reviewed</th>
                    <th>Review</th>
                    <th>Movie Title</th>
                    <th>Year</th>
                    <th>View Link</th>
                    <th>Rating</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;

    const startIndex = (otherPage - 1) * linksPerPage;
    const selectedReviews = searched ? searched.slice(startIndex, startIndex + linksPerPage) : reviewsMovieDetails.slice(startIndex, startIndex + linksPerPage);

    selectedReviews.forEach((review) => {
        const rating = ratingsData[review.link.linkID] || 0; // Get rating or default to 0
        const stars = generateStars(rating); // Convert rating to star icons
        const LinkReview = reviewsData.find(element => element.linkID === review.link.linkID);
        
        tableBuilder += `
            <tr>
                <td>${review.link.linkID}</td>
                <td>${review.link.userID}</td>
                <td>${LinkReview.review}</td>
                <td>${review.movieDetails.title}</td>
                <td>${review.movieDetails.year}</td>
                <td><a href="${review.link.link}" target="_blank" onclick="MovieAPI.incrementClick('${review.link.linkID}','${'AdminReview'}')" class="btn btn-info btn-sm"><i class="fas fa-eye"></i>View Link</a></td>
                <td>${stars}</td>
                <td align="center">
                    <button class="btn btn-outline-danger" onclick="deleteReviewO('${review.link.linkID}','${review.link.userID}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });

    tableBuilder += `</tbody></table>`;
    tableBuilder += paginationControls(reviewsMovieDetails, otherPage);
    reviews_table.innerHTML = tableBuilder;

    setTimeout(() => {
        const table = reviews_table.querySelector('table');
        table.classList.add('fade-in');
    }, 200);

    spinner.style.display = 'none';
    reviews_table.style.display = 'block';

    searchInput.placeholder = "Search Reviews...";
    if(!searched)
        searchInput.value = '';
    searchInput.style.display = 'block';
}

// Function to render a specific page of the LinksTable to edit
function renderTable(page, sort = '', searched = null) {
    if(allLinksData.length === 0){
        links_table.innerHTML = `<h1>There is no DATA!</h1>`;
        spinner.style.display = 'none';
        links_table.style.display = 'block';
        searchInput.placeholder = "Search Links...";
        searchInput.value = '';
        return;
    }

    spinner.style.display = 'block';

    let tableBuilder = `
        <table class="table table-bordered text-white custom-table">
            <thead>
                <tr>
                    <th>LinkID</th>
                    <th>Posted By</th>
                    <th>Link name</th>
                    <th>Movie Name</th>
                    <th>Link</th>
                    <th>Privacy</th>
                    <th>Actions</th>
                    <th class="clickable" onclick="renderTable(${page}, 'rating${sort === 'ratingUp' ? 'Down' : 'Up'}')">Rating <i class="fa-solid fa-sort" style="color: #FFD43B;"></i></th>
                    <th class="clickable" onclick="renderTable(${page}, 'clicks${sort === 'clicksUp' ? 'Down' : 'Up'}')">Clicks <i class="fa-solid fa-sort" style="color: #FFD43B;"></i></th>
                </tr>
            </thead>
            <tbody>`;

    if(sort.length !== 0) {
        allLinksData = sortLinks(allLinksData, sort);
    }
    const startIndex = (page - 1) * linksPerPage;                                     // Calculate the start index for the current page
    
    const selectedLinks = searched ? searched.slice(startIndex, startIndex + linksPerPage) : allLinksData.slice(startIndex, startIndex + linksPerPage);
    let source = 'table';

    // Loop through selected links and add each one to the table
    selectedLinks.forEach(element => {
        const movieTitle = linkIDWithTitles.find(item => item.linkID === element.linkID)?.movieTitle || 'Unknown Title';
        tableBuilder += `
        <tr>
            <td align="center">${element.linkID}</td>
            <td align="center">${element.userID}</td>
            <td align="center">${element.linkName}</td>
            <td align="center">${movieTitle}</td>
            <td align="center"><a href="${element.link}" class="btn btn-info btn-sm" id="viewLinkBtn-${element.linkID}"><i class="fas fa-eye"></i> View Link</a></td>
            <td align="center">${element.linkType}</td>
            <td align="center">
                <button onclick="showReviews('${element.linkID}','${element.movieID}' ,'${true}')" class="btn btn-outline-light"><i class="fa-solid fa-star"></i></button>
                <button onclick="MovieAPI.editLink('${element.movieID}','${element.linkID}','${true}')" class="btn btn-outline-warning"><i class="fas fa-edit"></i></button>
                <button onclick="MovieAPI.removeLink('${element.movieID}','${element.linkID}','${true}')" class="btn btn-outline-danger"><i class="fas fa-trash-alt"></i></button>
            </td>
            <td align="center">${ratingsData[element.linkID] || 0}</td>
            <td align="center">${element.clicks}</td>
        </tr>`;
    });

    tableBuilder += `</tbody></table>`;
    tableBuilder += paginationControls(allLinksData,currentPage);
    links_table.innerHTML = tableBuilder;

    selectedLinks.forEach(element => {
        const viewLinkBtn = document.getElementById(`viewLinkBtn-${element.linkID}`);
        if (viewLinkBtn) {
            viewLinkBtn.addEventListener('click', function (e) {
                e.preventDefault();
                window.open(viewLinkBtn.href, '_blank');
                MovieAPI.incrementClick(element.linkID, source);
            });
        }
    });

    links_table.style.display = 'block';
    spinner.style.display = 'none';

    searchInput.placeholder = "Search Links...";
    if(!searched)
        searchInput.value = '';
    searchInput.style.display = 'block';

    setTimeout(()=>{
        const table = links_table.querySelector('table');
        table.classList.add('fade-in');
    },200);
    
}

// Function to sort dinamically by Clicks or by Rating
function sortLinks(selectedLinks, sort) {
    if (!sort) return;

    if (sort.startsWith('rating')) {
        column = 'rating';
        direction = sort.includes('Up') ? 'Up' : 'Down';
    } else if (sort.startsWith('clicks')) {
        column = 'clicks';
        direction = sort.includes('Up') ? 'Up' : 'Down';
    }
    const compare = (a, b) => {
        const valueA = column === 'rating' ? ratingsData[a.linkID] : a.clicks;
        const valueB = column === 'rating' ? ratingsData[b.linkID] : b.clicks;

        if (direction === 'Up') {
            return valueB - valueA;
        } else if (direction === 'Down') {
            return valueA - valueB;
        }
        return 0;
    };
    const sorted = selectedLinks.sort(compare);
    return sorted;
}

// Function that generates stars :)
function generateStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fa-solid fa-star text-warning"></i>'; // Filled star
        } else {
            stars += '<i class="fa-regular fa-star text-warning"></i>'; // Empty star
        }
    }
    return stars;
}

// Function to generate pagination buttons for navigating through pages
function paginationControls(data,page) {
    const totalPages = Math.ceil(data.length / linksPerPage);
    return `
        <div class="pagination-controls" style="text-align: center; margin-top: 10px; color:white;">
            <button onclick="changePage(-1)" ${page === 1 ? 'disabled' : ''} class="btn btn-outline-warning">⬅ Previous</button>
            <span> Page ${page} of ${totalPages} </span>
            <button onclick="changePage(1)" ${page === totalPages ? 'disabled' : ''} class="btn btn-outline-warning">Next ➡</button>
        </div>`;
}

// Function to change the current page and re-render the table
function changePage(offset) {
    const totalPages = Math.ceil(allLinksData.length / linksPerPage);
    if ((currentPage + offset) > 0 && (currentPage + offset) <= totalPages) {
        currentPage += offset;
        renderTable(currentPage);
    }
}

// Function to calculate the average rating for each link
function getRating(links, reviews) {
    const publicLinkIds = new Set(links.links.map(link => link.linkID));
    const filteredReviews = reviews.reviews.filter(review => publicLinkIds.has(review.linkID));
    const returnal = {};
    let index = 0;
    // Loop through each link ID and calculate its average rating
    for (let linkId of publicLinkIds) {
        let sum = 0;
        let count = 0;
        for (let review of filteredReviews) {
            if (review.linkID === linkId) {
                sum += review.rating;
                count++;
                index++;
            }
        }
        returnal[linkId] = count > 0 ? (sum / count).toFixed(1) : 0;
    }
    returnal['review'] = index;
    return returnal;
}

// Function that saves a user after Admin updates him in UserTable
function saveUser(userId) {
    const usernameInput = document.getElementById(`username-${userId}`);
    const emailInput = document.getElementById(`email-${userId}`);
    const passwordInput = document.getElementById(`password-${userId}`);
    const roleInput = document.getElementById(`role-${userId}`);

    // Get original values from data attributes
    const originalUsername = usernameInput.getAttribute("data-original");
    const originalEmail = emailInput.getAttribute("data-original");
    const originalPassword = passwordInput.getAttribute("data-original");
    const originalRole = roleInput.getAttribute("data-original");

    if(originalUsername === AdminName){
        swal.fire({
            title: 'Cannot edit myself.',
            text: 'Edit others only!',
            icon: 'question',
        }).then(()=>{
            usernameInput.value = originalUsername;
            emailInput.value = originalEmail;
            passwordInput.value = originalPassword;
            roleInput.value = originalRole;
        });
        return;
    }
    // Check if the values have changed
    if (
        usernameInput.value === originalUsername &&
        emailInput.value === originalEmail &&
        passwordInput.value === originalPassword &&
        roleInput.value === originalRole
    ) {
        Swal.fire({
            title: 'No Changes',
            text: 'No changes were made to the user details.',
            icon: 'info',
            confirmButtonText: 'OK',
            confirmButtonColor: "#3085d6"
        });
        return;
    }

    // Prompt the user for confirmation
    Swal.fire({
        title: 'Edit User',
        text: `Are you sure you want to edit ${originalUsername}?`,
        icon: 'question',
        confirmButtonText: `<i class="fa-solid fa-thumbs-up"></i> Yes!`,
        showCancelButton: true,
        cancelButtonColor: "#d33",
        cancelButtonText: `<i class="fa-solid fa-thumbs-down"></i> NO!`,
    }).then(async (confirmButton) => {
        if (confirmButton.isConfirmed) {
            const updatedUser = {
                userName: usernameInput.value,
                email: emailInput.value,
                password: passwordInput.value,
                role: roleInput.value
            };

            // Send updated data to the server
            const response = await fetch(`/users/update/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedUser)
            });

            // Handle the response from the server
            if (response.ok) {
                Swal.fire({
                    title: 'User edit',
                    text: 'User edited successfully!',
                    icon: 'success',
                    showCancelButton: false,
                    showConfirmButton: false,
                    timer: 1000,
                });
                showUserTable(true); // Refresh the user table
            } else {
                Swal.fire({
                    title: 'User edit',
                    text: 'User could not be edited',
                    icon: 'error',
                    showCancelButton: false,
                    timer: 1000,
                });
            }
        }
    });
}

// Function that removes a user from the UserTable
function removeUser(userId) {
    const usernameInput = document.getElementById(`username-${userId}`);
    const originalUsername = usernameInput.getAttribute("data-original");

    if(originalUsername === AdminName){
        swal.fire({
            title: 'Cannot edit myself.',
            text: 'Edit others only!',
            icon: 'question',
        });
        return;
    }

    Swal.fire({
        title: 'Remove User',
        text: `Are you sure you want to remove ${originalUsername}?`,
        icon: 'question',
        confirmButtonText: `<i class="fa-solid fa-thumbs-up"></i> Yes!`,
        showCancelButton: true,
        cancelButtonColor: "#d33",
        cancelButtonText: `<i class="fa-solid fa-thumbs-down"></i> NO!`,
    }).then(async (confirmButton) => {
        if (confirmButton.isConfirmed) {
            // Send a DELETE request to the server to remove the user
            const response = await fetch(`/users/update/${userId}`, { method: "DELETE" });
            
            // Handle the response from the server
            if (response.ok) {
                Swal.fire({
                    title: 'User removal',
                    text: 'User removed successfully!',
                    icon: 'success',
                    showCancelButton: false,
                    showConfirmButton: false,
                    timer: 1000,
                });
                showUserTable(true); // Refresh the user table
            } else {
                Swal.fire({
                    title: 'User removal',
                    text: 'User could not be removed',
                    icon: 'error',
                    showCancelButton: false,
                    timer: 1000,
                });
            }
        }
    });
}
// Special function - click amount of links 10 times 
function _0x1a2b(){if(_0x3c4d)return;_0x5e6f++;if(_0x5e6f===10){_0x5e6f=0;_0x3c4d=true;for(let _0x7a8b=0;_0x7a8b<30;_0x7a8b++){let _0x9d0e=document.createElement("img");_0x9d0e.src="/resources/nya-nyan.gif";_0x9d0e.classList.add("nyan-cat");document.body.appendChild(_0x9d0e);let _0x48c5=Math.random()*window.innerHeight,_0x29d7=Math.random()*window.innerWidth,_0x6e77=(Math.random()>0.5?-1:1)*(Math.random()*window.innerHeight),_0x6a9e=Math.random()*window.innerWidth;_0x9d0e.style.position="fixed";if(_0x7a8b%2==0){_0x9d0e.style.left=`${_0x29d7}px`;_0x9d0e.style.bottom=`${_0x48c5}px`;_0x9d0e.style.setProperty('--end-x',`${_0x6a9e}px`);_0x9d0e.style.setProperty('--end-y',`${_0x6e77}px`);}else{_0x9d0e.style.left=`${_0x48c5}px`;_0x9d0e.style.bottom=`${_0x29d7}px`;_0x9d0e.style.setProperty('--end-x',`${_0x6e77}px`);_0x9d0e.style.setProperty('--end-y',`${_0x6a9e}px`);} _0x9d0e.style.animation="nyanFly 10s linear forwards";setTimeout(()=>{_0x9d0e.remove();},10000);}setTimeout(()=>{_0x3c4d=false;},10000);}}

// Function that deletes a review from ReviewTable
async function deleteReviewO(linkID, userID){
    swal.fire({
        title: 'Delete Review!',
        text: 'Are you sure you want to delete this review?',
        icon: 'warning',
        confirmButtonText: `<i class="fa-solid fa-thumbs-up"></i> Delete!`,
        showCancelButton: true,
        cancelButtonColor: "#d33",
        cancelButtonText: `<i class="fa-solid fa-thumbs-down"></i> Cancel`,

      }).then(async (confirmButton) => {
        if (confirmButton.isConfirmed) {
            const response = await fetch(`/reviews/delete-by-key/${userID}`,{
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkID }),
            })
            if(response.ok){
                showReviewsTable(true);
            }
        }
    });
}

// Search function that allows to search each Setting in Admin Panel
function inputSearch(){
    if(searchInput.placeholder.includes('Users')){
        const filteredUsers = userData.filter(user => {
            return (
                user.userName.toLowerCase().includes(searchInput.value.toLowerCase()) || 
                user.email.toLowerCase().includes(searchInput.value.toLowerCase())
            );
            });
            showUserTable(false, filteredUsers);
    }

    else if(searchInput.placeholder.includes('Links')){
        const filteredLinks = allLinksData.filter(link => {
           return(
            link.linkID.toString().includes(searchInput.value) ||
            link.userID.toLowerCase().includes(searchInput.value.toLowerCase()) ||
            link.linkName.toLowerCase().includes(searchInput.value.toLowerCase()) ||
            (linkIDWithTitles.find(item => item.linkID === link.linkID)?.movieTitle.toLowerCase().includes(searchInput.value.toLowerCase())) ||
            link.link.toLowerCase().includes(searchInput.value.toLowerCase()) ||
            link.linkType.toLowerCase().includes(searchInput.value.toLowerCase())
        );});
        showLinksTable(false, filteredLinks);
    }

    else if(searchInput.placeholder.includes('Reviews')){
        const filteredReviews = reviewsMovieDetails.filter(review => {
            return (
                reviewsData.find(element => element.linkID === review.link.linkID).review.includes(searchInput.value.toLowerCase()) ||
                review.link.linkID.toString().includes(searchInput.value) ||
                review.link.userID.toLowerCase().includes(searchInput.value.toLowerCase()) ||
                review.movieDetails.title.toLowerCase().includes(searchInput.value.toLowerCase()) || 
                review.movieDetails.year.includes(searchInput.value.toLowerCase()) ||
                review.link.link.toLowerCase().includes(searchInput.value.toLowerCase())
            );
        });
        showReviewsTable(false, filteredReviews);
    }
}