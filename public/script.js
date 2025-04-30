// Frontend JavaScript - we can add more later
console.log("NAVI script loaded!");

// DOM Elements
const userStatusDiv = document.getElementById('user-status');
const authFormsDiv = document.getElementById('auth-forms');
const logoutSectionDiv = document.getElementById('logout-section');
const mainContentDiv = document.getElementById('main-content');

const signupForm = document.getElementById('signup-form');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupMessageP = document.getElementById('signup-message');

const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginMessageP = document.getElementById('login-message');

const logoutButton = document.getElementById('logout-button');

// --- Functions ---

// Update UI based on login state
function updateUI(isLoggedIn, email = '') {
    if (isLoggedIn) {
        userStatusDiv.textContent = `Logged in as: ${email}`;
        authFormsDiv.style.display = 'none';
        logoutSectionDiv.style.display = 'block';
        mainContentDiv.style.display = 'block';
    } else {
        userStatusDiv.textContent = 'You are not logged in.';
        authFormsDiv.style.display = 'block';
        logoutSectionDiv.style.display = 'none';
        mainContentDiv.style.display = 'none';
        signupMessageP.textContent = ''; // Clear messages on state change
        loginMessageP.textContent = '';
    }
}

// Check login status on page load
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user/status');
        const data = await response.json();
        updateUI(data.loggedIn, data.email);
    } catch (error) {
        console.error('Error checking login status:', error);
        userStatusDiv.textContent = 'Error checking status.';
        updateUI(false); // Assume not logged in if error
    }
}

// Handle Signup
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission
    signupMessageP.textContent = 'Signing up...';

    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            signupMessageP.textContent = data.message;
            console.log('Signup success:', data);
            updateUI(true, data.email); // Update UI immediately
            signupForm.reset(); // Clear form
        } else {
            signupMessageP.textContent = `Error: ${data.message}`;
            console.error('Signup error:', data);
            updateUI(false);
        }
    } catch (error) {
        signupMessageP.textContent = 'Network error during signup.';
        console.error('Network error:', error);
        updateUI(false);
    }
});

// Handle Login
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginMessageP.textContent = 'Logging in...';

    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            loginMessageP.textContent = data.message;
            console.log('Login success:', data);
            updateUI(true, data.email);
            loginForm.reset();
        } else {
            loginMessageP.textContent = `Error: ${data.message}`;
            console.error('Login error:', data);
            updateUI(false);
        }
    } catch (error) {
        loginMessageP.textContent = 'Network error during login.';
        console.error('Network error:', error);
        updateUI(false);
    }
});

// Handle Logout
logoutButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });
        const data = await response.json();

        if (response.ok) {
            console.log('Logout success:', data);
            updateUI(false);
        } else {
            console.error('Logout error:', data);
            // Optionally show an error message to the user
            alert(`Logout failed: ${data.message}`);
        }
    } catch (error) {
        console.error('Network error during logout:', error);
        alert('Network error during logout.');
    }
});

// --- Initial Load ---
checkLoginStatus(); // Check status when script loads 