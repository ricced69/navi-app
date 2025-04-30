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

const qrCodeModal = document.getElementById('qr-code-modal');
const qrCodeCanvas = document.getElementById('qr-code-canvas');
const qrRewardDescription = document.getElementById('qr-reward-description');
const qrExpiryInfo = document.getElementById('qr-expiry-info');
const closeQrModalButton = document.getElementById('close-qr-modal');

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
        ul.style.paddingLeft = '0';
        ul.style.listStyle = 'none';

        businesses.forEach(business => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.innerHTML = `
                <div>
                    <strong>${business.name}</strong><br>
                    <em>${business.description || 'No description'}</em><br>
                    <small>${business.address || 'No address'}</small><br>
                    <button class="earn-points-btn" data-business-id="${business.id}">Earn 10 Points</button>
                    <span class="earn-message" data-msg-for="${business.id}" style="margin-left: 10px;"></span>
                </div>
                <div class="rewards-list" data-rewards-for="${business.id}" style="margin-top: 10px; padding-left: 15px; border-left: 2px solid #eee;">
                    <small>Loading rewards...</small>
                </div>
            `;
            ul.appendChild(li);
        });
        businessListDiv.appendChild(ul);

        // Add event listeners for EARN buttons AFTER they are added to the DOM
        businessListDiv.querySelectorAll('.earn-points-btn').forEach(button => {
            button.addEventListener('click', handleEarnPointsClick);
        });

        // NOW, fetch rewards for each business AFTER the list is in the DOM
        console.log("[Debug] Main business list appended. Fetching rewards...");
        ul.querySelectorAll('.rewards-list').forEach(rewardsContainer => {
            const businessId = rewardsContainer.dataset.rewardsFor;
            if (businessId) {
                loadRewardsForBusiness(businessId);
            }
        });
    } catch (error) {
        console.error('[Debug] Error in loadBusinesses:', error);
        businessListDiv.innerHTML = `<p>Error loading businesses: ${error.message}</p>`;
    }
}

// Function to fetch and display rewards for a specific business
async function loadRewardsForBusiness(businessId) {
    console.log(`[Debug] loadRewardsForBusiness called for businessId: ${businessId}`);
    const rewardsContainer = businessListDiv.querySelector(`.rewards-list[data-rewards-for="${businessId}"]`);
    if (!rewardsContainer) {
        console.error(`[Debug] Could not find rewards container for businessId: ${businessId}`);
        return;
    }

    try {
        const response = await fetch(`/api/businesses/${businessId}/rewards`);
        console.log(`[Debug] Rewards fetch response for ${businessId}:`, response);

        if (!response.ok) {
            console.error(`[Debug] Rewards fetch failed for ${businessId} with status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rewards = await response.json();
        console.log(`[Debug] Rewards data for ${businessId}:`, rewards);

        if (rewards.length === 0) {
            console.log(`[Debug] No rewards found for ${businessId}`);
            rewardsContainer.innerHTML = '<small>No rewards available.</small>';
            return;
        }

        rewardsContainer.innerHTML = '<small>Available Rewards:</small><ul>'; // Start list
        const ul = document.createElement('ul');
        ul.style.paddingLeft = '0';
        ul.style.listStyle = 'none';

        rewards.forEach(reward => {
            const rewardLi = document.createElement('li');
            rewardLi.style.marginBottom = '5px';
            rewardLi.innerHTML = `
                ${reward.description} (${reward.points_cost} points)
                <button class="redeem-reward-btn" data-reward-id="${reward.id}" data-cost="${reward.points_cost}">Redeem</button>
                <span class="redeem-message" data-msg-for-reward="${reward.id}" style="margin-left: 5px; font-size: 0.85em;"></span>
            `;
            ul.appendChild(rewardLi);
        });
        rewardsContainer.appendChild(ul);

        // Add listeners for the new redeem buttons
        rewardsContainer.querySelectorAll('.redeem-reward-btn').forEach(button => {
            button.addEventListener('click', handleRedeemRewardClick);
        });

        console.log(`[Debug] Finished rendering rewards for ${businessId}`);

    } catch (error) {
        console.error(`[Debug] Error in loadRewardsForBusiness for ${businessId}:`, error);
        rewardsContainer.innerHTML = '<small>Error loading rewards.</small>';
    }
}

// Handle Earn Points button click
async function handleEarnPointsClick(event) {
    const button = event.target;
    const businessId = button.dataset.businessId;
    const messageSpan = businessListDiv.querySelector(`.earn-message[data-msg-for="${businessId}"]`);

    // DON'T disable button here. Set message and disable INSIDE the try block.
    messageSpan.textContent = 'Processing...';

    try {
        // Disable button only while processing the request
        button.disabled = true; 

        const response = await fetch(`/api/businesses/${businessId}/earn`, {
            method: 'POST'
        });
        const data = await response.json();

        if (response.ok) {
            messageSpan.textContent = data.message;
            updatePointsDisplay(data.newBalance);
            // Success or Rate Limit Hit -> Button STAYS disabled for this session
        } else {
            // Other Error (e.g., server error, bad request)
            messageSpan.textContent = `Error: ${data.message || response.statusText}`;
             // Re-enable button ONLY if it wasn't success or rate limit
            button.disabled = false; 
        }

    } catch (error) {
        // Network Error
        console.error("Error earning points:", error);
        messageSpan.textContent = 'Network error.';
        button.disabled = false; // Re-enable on network errors
    } 
    // Note: If successful or rate limited, button remains disabled until page reload.
}

// Function to display QR Code Modal
function displayQRCode(token, rewardDesc, expiryISOString) {
    const canvas = qrCodeCanvas;
    QRCode.toCanvas(canvas, token, { width: 256, errorCorrectionLevel: 'H' }, function (error) {
        if (error) {
            console.error("QR Code generation error:", error);
            alert("Failed to generate QR code.");
            return;
        }
        console.log('QR code generated successfully!');
        qrRewardDescription.textContent = rewardDesc;
        const expiryDate = new Date(expiryISOString);
        // Format time nicely (e.g., 19:05:30)
        const formattedTime = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' });
        qrExpiryInfo.textContent = `Expires at: ${formattedTime}`;
        qrCodeModal.style.display = 'flex'; // Show the modal
    });
}

// Close QR Modal Logic
closeQrModalButton.addEventListener('click', () => {
    qrCodeModal.style.display = 'none';
});

// Handle Redeem Reward button click
async function handleRedeemRewardClick(event) {
    const button = event.target;
    const rewardId = button.dataset.rewardId;
    const pointsCost = parseInt(button.dataset.cost, 10);
    const messageSpan = button.parentElement.querySelector(`.redeem-message[data-msg-for-reward="${rewardId}"]`);
    const rewardDescElement = button.parentElement; // Get the LI element
    const rewardDescText = rewardDescElement.textContent.split('(')[0].trim(); // Extract description

    // Basic check if user has enough points locally (optional, server does final check)
    const currentBalance = parseInt(pointsBalanceSpan.textContent, 10);
    if (currentBalance < pointsCost) {
        messageSpan.textContent = 'Not enough points.';
        return;
    }

    // Confirm before spending points
    if (!confirm(`Redeem "${rewardDescText}" for ${pointsCost} points?`)) {
        return;
    }

    button.disabled = true;
    messageSpan.textContent = 'Redeeming...';

    try {
        const response = await fetch(`/api/rewards/${rewardId}/redeem`, {
            method: 'POST'
        });
        const data = await response.json();

        if (response.ok) {
            messageSpan.textContent = ''; // Clear processing message
            updatePointsDisplay(data.newBalance);
            displayQRCode(data.redemptionToken, rewardDescText, data.expiresAt);
            // Keep button disabled for this session
        } else {
            messageSpan.textContent = `Error: ${data.message}`;
            button.disabled = false;
        }

    } catch (error) {
        console.error("Error redeeming reward:", error);
        messageSpan.textContent = 'Network error.';
        button.disabled = false;
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