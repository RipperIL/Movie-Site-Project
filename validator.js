const isValidName = (name) => /^[a-zA-Z\s]{3,50}$/.test(name);
const isValidEmail = (email) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email);
const isValidPassword = (password, confirmPassword) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9a-zA-Z]).{3,15}$/.test(password) && password === confirmPassword;
const isValidUsername = (username) => /^[a-zA-Z0-9_]{4,15}$/.test(username);

// Function to validate input fields (name, email, password, username, confirmPassword)
// Returns an array of error messages if any validation fails
const isValidInputs = (name, email, password, username, confirmPassword) => {
    const errors = [];
        // Validate name: Must be between 3 to 50 characters, containing only letters and spaces
    if (!isValidName(name)) errors.push("Invalid name, only letters and spaces\n");
        // Validate email: Must match a basic email pattern
    if (!isValidEmail(email)) errors.push("Invalid email\n");
        // Validate password: Must contain at least one lowercase letter, one uppercase letter, one number, and be between 3 to 15 characters
        // Also, ensure password matches the confirmPassword
    if (!isValidPassword(password, confirmPassword)) errors.push("Passwords do not match\n");
        // Validate username: Must be between 4 to 15 characters and contain only alphanumeric characters or underscores
    if (!isValidUsername(username)) errors.push("Invalid username, Must be between 4 to 15 characters\n");
    return errors;
};

module.exports = {isValidInputs};