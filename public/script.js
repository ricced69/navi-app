// Frontend JavaScript - we can add more later
console.log("NAVI script loaded!");

// DOM Elements
const userStatusDiv = document.getElementById('user-status');
const authFormsDiv = document.getElementById('auth-forms');
const logoutSectionDiv = document.getElementById('logout-section');
const mainContentDiv = document.getElementById('main-content');
const businessListDiv = document.getElementById('business-list');
const userPointsDiv = document.getElementById('user-points');
const pointsBalanceSpan = document.getElementById('points-balance');

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

// Function to update points display
function updatePointsDisplay(balance) {
    pointsBalanceSpan.textContent = balance;
    userPointsDiv.style.display = 'block'; // Show the points div
}

// Function to fetch and display businesses
async function loadBusinesses() {
    businessListDiv.innerHTML = '<p>Loading businesses...</p>';
    try {
        const response = await fetch('/api/businesses');
        if (!response.ok) {
            // Handle errors, e.g., user session expired
            if (response.status === 401) {
                businessListDiv.innerHTML = '<p>Your session may have expired. Please log in again.</p>';
                updateUI(false); // Update overall UI to logged-out state
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return; // Stop execution if error
        }

        const businesses = await response.json();

        businessListDiv.innerHTML = ''; // Clear loading message

        if (businesses.length === 0) {
            businessListDiv.innerHTML = '<p>No partner businesses found.</p>';
            return;
        }

        // Create elements for each business
        const ul = document.createElement('ul');
        businesses.forEach(business => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px'; // Add some spacing
            li.innerHTML = `
                <strong>${business.name}</strong><br>
                <em>${business.description || 'No description'}</em><br>
                <small>${business.address || 'No address'}</small><br>
                <button class="earn-points-btn" data-business-id="${business.id}">Earn 10 Points</button>
                <span class="earn-message" data-msg-for="${business.id}" style="margin-left: 10px;"></span>
            `;
            ul.appendChild(li);
        });
        businessListDiv.appendChild(ul);

        // Add event listeners AFTER buttons are added to the DOM
        document.querySelectorAll('.earn-points-btn').forEach(button => {
            button.addEventListener('click', handleEarnPointsClick);
        });

    } catch (error) {
        console.error('Error loading businesses:', error);
        businessListDiv.innerHTML = `<p>Error loading businesses: ${error.message}</p>`;
    }
}

// Handle Earn Points button click
async function handleEarnPointsClick(event) {
    const button = event.target;
    const businessId = button.dataset.businessId;
    const messageSpan = businessListDiv.querySelector(`.earn-message[data-msg-for="${businessId}"]`);

    button.disabled = true; // Disable button immediately
    messageSpan.textContent = 'Processing...';

    try {
        const response = await fetch(`/api/businesses/${businessId}/earn`, {
            method: 'POST'
        });
        const data = await response.json();

        if (response.ok) {
            messageSpan.textContent = data.message; // Show success message
            updatePointsDisplay(data.newBalance); // Update total points display
            // Keep button disabled for this session to prevent spamming (simplest approach)
        } else {
            messageSpan.textContent = `Error: ${data.message}`; // Show error
            button.disabled = false; // Re-enable button on error
        }
    } catch (error) {
        console.error("Error earning points:", error);
        messageSpan.textContent = 'Network error.';
        button.disabled = false; // Re-enable button on network error
    }
}

// Update UI based on login state
function updateUI(isLoggedIn, email = '', balance = 0) {
    if (isLoggedIn) {
        userStatusDiv.textContent = `Logged in as: ${email}`;
        updatePointsDisplay(balance); // Update points display
        authFormsDiv.style.display = 'none';
        logoutSectionDiv.style.display = 'block';
        mainContentDiv.style.display = 'block';
        loadBusinesses();
    } else {
        userStatusDiv.textContent = 'You are not logged in.';
        userPointsDiv.style.display = 'none'; // Hide points display
        authFormsDiv.style.display = 'block';
        logoutSectionDiv.style.display = 'none';
        mainContentDiv.style.display = 'none';
        businessListDiv.innerHTML = '';
        signupMessageP.textContent = '';
        loginMessageP.textContent = '';
    }
}

// Check login status on page load
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user/status');
        const data = await response.json();
        // Now fetch points if logged in
        let balance = 0;
        if (data.loggedIn && data.userId) {
             // Ideally, /api/user/status would return the balance
             // For now, let's make a separate call or just update after earning
             // Simplest for now: fetch balance separately (less efficient)
            try {
                const pointsResponse = await fetch('/api/user/points'); // Need to create this endpoint
                if (pointsResponse.ok) {
                    const pointsData = await pointsResponse.json();
                    balance = pointsData.balance;
                } else {
                    console.error("Failed to fetch initial points balance");
                }
            } catch (pointsError) {
                console.error("Error fetching initial points:", pointsError);
            }
        }
        updateUI(data.loggedIn, data.email, balance);
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