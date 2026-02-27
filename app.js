// App State
let currentUser = null;
let currentEditingLinkId = null;
let draggedElement = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const usernameScreen = document.getElementById('usernameScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loadingOverlay = document.getElementById('loadingOverlay');

// Login elements
const googleLoginBtn = document.getElementById('googleLoginBtn');

// Username selection elements
const userAvatar = document.getElementById('userAvatar');
const userDisplayName = document.getElementById('userDisplayName');
const usernameInput = document.getElementById('usernameInput');
const usernameStatus = document.getElementById('usernameStatus');
const confirmUsernameBtn = document.getElementById('confirmUsernameBtn');

// Dashboard elements
const navUserAvatar = document.getElementById('navUserAvatar');
const navUsername = document.getElementById('navUsername');
const dashUserAvatar = document.getElementById('dashUserAvatar');
const dashDisplayName = document.getElementById('dashDisplayName');
const dashUsername = document.getElementById('dashUsername');
const logoutBtn = document.getElementById('logoutBtn');
const viewPublicBtn = document.getElementById('viewPublicBtn');
const shareProfileBtn = document.getElementById('shareProfileBtn');
const editProfileBtn = document.getElementById('editProfileBtn');

// Bio elements
// const bioInput = document.getElementById('bioInput'); // Removed from dashboard
// const saveBioBtn = document.getElementById('saveBioBtn'); // Removed from dashboard

// Links elements
const addLinkBtn = document.getElementById('addLinkBtn');
const linksList = document.getElementById('linksList');

// Modal elements
const linkModal = document.getElementById('linkModal');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');
const linkIcon = document.getElementById('linkIcon');
const linkTitle = document.getElementById('linkTitle');
const linkUrl = document.getElementById('linkUrl');
const cancelLinkBtn = document.getElementById('cancelLinkBtn');
const saveLinkBtn = document.getElementById('saveLinkBtn');
const defaultIconsRow = document.getElementById('defaultIconsRow');

// Add click handlers for default icon suggestions
if (defaultIconsRow && linkIcon) {
    defaultIconsRow.querySelectorAll('.icon-suggestion').forEach((btn) => {
        btn.addEventListener('click', function () {
            // If the icon is an emoji, just use the textContent
            if (btn.textContent.trim().length === 1) {
                linkIcon.value = btn.textContent.trim();
            } else {
                // Otherwise, use only the icon name (e.g. 'spotify')
                const iTag = btn.querySelector('i');
                if (iTag) {
                    // Get the last class as the icon name (e.g. 'fa-spotify' or 'fa-map-marker-alt')
                    const classes = Array.from(iTag.classList);
                    const faClass = classes.find(cls => cls.startsWith('fa-') && cls !== 'fa');
                    if (faClass) {
                        // Remove 'fa-' prefix for storage, e.g. 'spotify', 'map-marker-alt'
                        linkIcon.value = faClass.replace('fa-', '');
                    } else {
                        linkIcon.value = '';
                    }
                }
            }
            linkIcon.focus();
        });
    });
}

// Edit Profile Modal elements
const editProfileModal = document.getElementById('editProfileModal');
const closeEditProfileModal = document.getElementById('closeEditProfileModal');
const editDisplayName = document.getElementById('editDisplayName');
const editUsername = document.getElementById('editUsername');
const editBio = document.getElementById('editBio');
const cancelEditProfileBtn = document.getElementById('cancelEditProfileBtn');
const saveEditProfileBtn = document.getElementById('saveEditProfileBtn');

// Profile Picture elements
const currentProfilePic = document.getElementById('currentProfilePic');
const profilePictureInput = document.getElementById('profilePictureInput');
const uploadProfilePicBtn = document.getElementById('uploadProfilePicBtn');
const removeProfilePicBtn = document.getElementById('removeProfilePicBtn');

// Cropper elements
const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const cropCancelBtn = document.getElementById('cropCancelBtn');
const cropConfirmBtn = document.getElementById('cropConfirmBtn');
let cropper = null;

// Utility Functions
function showLoading() {
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    hideLoading();
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast-new');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-new ${type}`;

    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
    }, 3000);
}

// Username validation
function isValidUsername(username) {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username);
}

// Check username availability
let usernameCheckTimeout;
function checkUsernameAvailability(username) {
    clearTimeout(usernameCheckTimeout);

    if (!username.trim()) {
        usernameStatus.textContent = '';
        usernameStatus.className = 'username-status';
        confirmUsernameBtn.disabled = true;
        return;
    }

    if (!isValidUsername(username)) {
        usernameStatus.textContent = '❌ Invalid username format';
        usernameStatus.className = 'username-status taken';
        confirmUsernameBtn.disabled = true;
        return;
    }

    usernameStatus.textContent = '⏳ Checking availability...';
    usernameStatus.className = 'username-status checking';
    confirmUsernameBtn.disabled = true;

    usernameCheckTimeout = setTimeout(async () => {
        try {
            const snapshot = await window.database.ref('usernames/' + username.toLowerCase()).once('value');

            if (snapshot.exists()) {
                usernameStatus.textContent = '❌ Username already taken';
                usernameStatus.className = 'username-status taken';
                confirmUsernameBtn.disabled = true;
            } else {
                usernameStatus.textContent = '✅ Username available';
                usernameStatus.className = 'username-status available';
                confirmUsernameBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error checking username:', error);
            usernameStatus.textContent = '❌ Error checking availability';
            usernameStatus.className = 'username-status taken';
            confirmUsernameBtn.disabled = true;
        }
    }, 500);
}

// Authentication Functions
async function signInWithGoogle() {
    try {
        showLoading();

        // Wait for Firebase to be ready
        if (!window.firebaseInitialized) {
            await new Promise(resolve => {
                const checkFirebase = () => {
                    if (window.firebaseInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkFirebase, 100);
                    }
                };
                checkFirebase();
            });
        }

        const result = await window.auth.signInWithPopup(window.googleProvider);
        const user = result.user;

        // Check if user already has a username
        const userSnapshot = await window.database.ref('users/' + user.uid).once('value');

        if (userSnapshot.exists() && userSnapshot.val().username) {
            // User exists with username, go to dashboard
            currentUser = { ...user, ...userSnapshot.val() };
            loadDashboard();
        } else {
            // New user or user without username, show username selection
            showUsernameSelection(user);
        }
    } catch (error) {
        console.error('Error signing in:', error);
        showToast('Failed to sign in with Google', 'error');
    } finally {
        hideLoading();
    }
}

function showUsernameSelection(user) {
    userAvatar.src = user.photoURL;
    userDisplayName.textContent = user.displayName;
    showScreen(usernameScreen);
}

async function confirmUsername() {
    const username = usernameInput.value.trim().toLowerCase();

    if (!isValidUsername(username)) {
        showToast('Please enter a valid username', 'error');
        return;
    }

    try {
        showLoading();

        // Double-check availability
        const snapshot = await window.database.ref('usernames/' + username).once('value');
        if (snapshot.exists()) {
            showToast('Username is no longer available', 'error');
            hideLoading();
            return;
        }

        const user = window.auth.currentUser;
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            username: username,
            bio: '',
            links: [],
            createdAt: window.database.ServerValue.TIMESTAMP,
            updatedAt: window.database.ServerValue.TIMESTAMP
        };

        // Save user data and reserve username
        await Promise.all([
            window.database.ref('users/' + user.uid).set(userData),
            window.database.ref('usernames/' + username).set(user.uid)
        ]);

        currentUser = userData;
        loadDashboard();
        showToast('Profile created successfully!', 'success');
    } catch (error) {
        console.error('Error creating profile:', error);
        showToast('Failed to create profile', 'error');
    } finally {
        hideLoading();
    }
}

// Dashboard Functions
function loadDashboard() {
    // Update UI with user data
    if (typeof navUserAvatar !== 'undefined' && navUserAvatar) {
        navUserAvatar.src = currentUser.photoURL;
    }
    if (typeof navUsername !== 'undefined' && navUsername) {
        navUsername.textContent = '@' + currentUser.username;
    }
    if (typeof dashUserAvatar !== 'undefined' && dashUserAvatar) {
        dashUserAvatar.src = currentUser.photoURL;
    }
    if (typeof dashDisplayName !== 'undefined' && dashDisplayName) {
        dashDisplayName.textContent = currentUser.displayName;
    }
    if (typeof dashUsername !== 'undefined' && dashUsername) {
        dashUsername.textContent = currentUser.username;
    }
    if (typeof bioInput !== 'undefined' && bioInput) {
        // bioInput removed from main dashboard
        // bioInput.value = currentUser.bio || ''; 
    }

    // Set up public profile link
    viewPublicBtn.onclick = () => {
        // If we're on localhost, the clean URL might not work without a dev server that supports rewrites.
        // We'll use the full URL and let profile.js clean it up instantly.
        // On production (Firebase), both work, but the clean URL is preferred.
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const publicProfileUrl = isLocal
            ? `profile.html?username=${currentUser.username}`
            : `/${currentUser.username}`;

        console.log('[MyWebies] Opening public profile URL:', publicProfileUrl);
        window.open(publicProfileUrl, '_blank');
    };

    // Set up share profile button
    if (shareProfileBtn) {
        shareProfileBtn.onclick = async () => {
            // Shared links should always be clean
            const publicProfileUrl = `${window.location.origin}/${currentUser.username}`;
            const shareData = {
                title: `${currentUser.displayName || currentUser.username}'s MyWebies Profile`,
                text: `Check out my MyWebies profile!`,
                url: publicProfileUrl
            };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    showToast('Share cancelled', 'info');
                }
            } else {
                // Fallback: copy to clipboard
                try {
                    await navigator.clipboard.writeText(publicProfileUrl);
                    showToast('Profile link copied to clipboard!', 'success');
                } catch (err) {
                    showToast('Could not copy link', 'error');
                }
            }
        };
    }

    loadLinks();
    showScreen(dashboardScreen);
}

async function loadLinks() {
    try {
        const snapshot = await window.database.ref('users/' + currentUser.uid + '/links').once('value');
        const links = snapshot.val() || {};

        // Convert to array and sort by order
        const linksArray = Object.keys(links).map(key => ({
            id: key,
            ...links[key]
        })).sort((a, b) => (a.order || 0) - (b.order || 0));

        renderLinks(linksArray);
    } catch (error) {
        console.error('Error loading links:', error);
        showToast('Failed to load links', 'error');
    }
}

function renderLinks(links) {
    linksList.innerHTML = '';

    if (links.length === 0) {
        linksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-link" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <p style="color: #666;">No links yet. Add your first link!</p>
            </div>
        `;
        return;
    }

    links.forEach((link, index) => {
        const linkElement = document.createElement('div');
        linkElement.className = 'link-item';
        linkElement.draggable = true;
        linkElement.dataset.linkId = link.id;
        linkElement.dataset.order = index;

        linkElement.innerHTML = `
            <div class="drag-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="link-icon">
                ${renderLinkIcon(link.icon)}
            </div>
            <div class="link-content">
                <div class="link-title">${link.title}</div>
                <a href="${link.url}" target="_blank" class="link-url">${link.url}</a>
            </div>
            <div class="link-actions">
                <button class="edit-link-btn" onclick="editLink('${link.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-link-btn" onclick="deleteLink('${link.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        // Add drag and drop event listeners
        linkElement.addEventListener('dragstart', handleDragStart);
        linkElement.addEventListener('dragover', handleDragOver);
        linkElement.addEventListener('drop', handleDrop);
        linkElement.addEventListener('dragend', handleDragEnd);

        linksList.appendChild(linkElement);
        // Helper to render the icon for a link (emoji or FontAwesome)
        function renderLinkIcon(icon) {
            if (!icon || icon === '🔗') return '🔗';
            // If it's a single visible Unicode character or emoji, show as is
            if (/^\p{Emoji}|\p{Extended_Pictographic}|^[^\x00-\x7F]$/u.test(icon)) return icon;
            // FontAwesome brand icons
            const brands = ['twitter', 'snapchat', 'instagram', 'facebook', 'youtube', 'spotify', 'tiktok'];
            if (brands.includes(icon)) {
                return `<i class="fab fa-${icon}"></i>`;
            }
            // FontAwesome solid icons
            if (icon === 'location-dot') {
                return `<i class="fas fa-location-dot"></i>`;
            }
            // If not a known icon, but looks like emoji or text, show as is
            if (/^[\p{L}\p{N}\p{Emoji}\p{Extended_Pictographic}]+$/u.test(icon)) return icon;
            // Fallback to link icon
            return '🔗';
        }
    });
}

// Drag and Drop Functions
function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const afterElement = getDragAfterElement(linksList, e.clientY);
    const dragging = document.querySelector('.dragging');

    if (afterElement == null) {
        linksList.appendChild(dragging);
    } else {
        linksList.insertBefore(dragging, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
    updateLinksOrder();
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.link-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function updateLinksOrder() {
    try {
        const linkElements = [...linksList.querySelectorAll('.link-item')];
        const updates = {};

        linkElements.forEach((element, index) => {
            const linkId = element.dataset.linkId;
            updates[`users/${currentUser.uid}/links/${linkId}/order`] = index;
        });

        await window.database.ref().update(updates);
        showToast('Links reordered successfully!', 'success');
    } catch (error) {
        console.error('Error updating links order:', error);
        showToast('Failed to reorder links', 'error');
        loadLinks(); // Reload to reset order
    }
}

// Link Management Functions
function showAddLinkModal() {
    currentEditingLinkId = null;
    modalTitle.textContent = 'Add New Link';
    linkIcon.value = '';
    linkTitle.value = '';
    linkUrl.value = '';
    showModal();
}

function editLink(linkId) {
    currentEditingLinkId = linkId;
    modalTitle.textContent = 'Edit Link';

    // Load link data
    window.database.ref(`users/${currentUser.uid}/links/${linkId}`).once('value')
        .then(snapshot => {
            const link = snapshot.val();
            linkIcon.value = link.icon || '';
            linkTitle.value = link.title || '';
            linkUrl.value = link.url || '';
            showModal();
        })
        .catch(error => {
            console.error('Error loading link:', error);
            showToast('Failed to load link data', 'error');
        });
}

async function saveLink() {
    let icon = linkIcon.value.trim();
    // Only allow emoji or simple icon name (no spaces or FontAwesome classes)
    if (icon && icon.length > 1 && icon.includes(' ')) {
        icon = icon.split(' ')[0];
    }
    const title = linkTitle.value.trim();
    const url = linkUrl.value.trim();

    if (!title || !url) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Basic URL validation
    try {
        new URL(url);
    } catch {
        showToast('Please enter a valid URL', 'error');
        return;
    }

    try {
        showLoading();

        const linkData = {
            icon: icon || '🔗',
            title: title,
            url: url,
            updatedAt: window.database.ServerValue.TIMESTAMP
        };

        console.log('Saving linkData:', linkData);
        if (currentEditingLinkId) {
            // Update existing link
            await window.database.ref(`users/${currentUser.uid}/links/${currentEditingLinkId}`).update(linkData);
            showToast('Link updated successfully!', 'success');
        } else {
            // Add new link
            const linksRef = window.database.ref(`users/${currentUser.uid}/links`);
            const snapshot = await linksRef.once('value');
            const existingLinks = snapshot.val() || {};
            const newOrder = Object.keys(existingLinks).length;

            linkData.order = newOrder;
            linkData.createdAt = window.database.ServerValue.TIMESTAMP;

            await linksRef.push(linkData);
            showToast('Link added successfully!', 'success');
        }

        hideModal();
        loadLinks();
    } catch (error) {
        console.error('Error saving link:', error);
        showToast('Failed to save link', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteLink(linkId) {
    if (!confirm('Are you sure you want to delete this link?')) {
        return;
    }

    try {
        showLoading();
        await window.database.ref(`users/${currentUser.uid}/links/${linkId}`).remove();
        showToast('Link deleted successfully!', 'success');
        loadLinks();
    } catch (error) {
        console.error('Error deleting link:', error);
        showToast('Failed to delete link', 'error');
    } finally {
        hideLoading();
    }
}

// Edit Profile Functions
function showEditProfileModal() {
    // Populate the modal with current user data
    editDisplayName.value = currentUser.displayName || '';
    editUsername.value = currentUser.username || '';
    editBio.value = currentUser.bio || ''; // Populate Bio
    currentProfilePic.src = currentUser.photoURL || 'https://via.placeholder.com/80x80?text=User';

    // Show the modal
    editProfileModal.classList.add('active');
    uploadProfilePicBtn.focus();
}

function hideEditProfileModal() {
    editProfileModal.classList.remove('active');
}

async function removeProfilePicture() {
    if (!currentUser) return;

    // Fallback to Google photo URL or empty if none
    const googlePhotoURL = window.auth.currentUser.photoURL;

    if (currentUser.photoURL === googlePhotoURL) {
        showToast('Already using Google profile picture', 'info');
        return;
    }

    try {
        showLoading();
        // Update database with Google's photo URL
        await window.database.ref(`users/${currentUser.uid}/photoURL`).set(googlePhotoURL);

        // Update current user state
        currentUser.photoURL = googlePhotoURL;

        // Update UI
        updateProfilePictureInUI(googlePhotoURL);

        showToast('Reverted to Google profile picture', 'success');
    } catch (error) {
        console.error('Error removing profile picture:', error);
        showToast('Failed to remove custom picture', 'error');
    } finally {
        hideLoading();
    }
}

async function uploadProfilePicture(file) {
    try {
        showLoading();
        // Prepare Cloudinary upload
        const url = 'https://api.cloudinary.com/v1_1/du4nn0zz6/image/upload';
        const preset = 'MyWebies';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (!response.ok || !data.secure_url) {
            throw new Error(data.error?.message || 'Upload failed');
        }
        const downloadURL = data.secure_url;

        // Update the user's profile in the database
        await window.database.ref(`users/${currentUser.uid}/photoURL`).set(downloadURL);

        // Update current user data
        currentUser.photoURL = downloadURL;

        // Update UI elements
        updateProfilePictureInUI(downloadURL);

        showToast('Profile picture updated successfully!', 'success');
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        showToast('Failed to upload profile picture', 'error');
    } finally {
        hideLoading();
    }
}

function updateProfilePictureInUI(photoURL) {
    // Update all profile picture elements safely
    if (typeof navUserAvatar !== 'undefined' && navUserAvatar) navUserAvatar.src = photoURL;
    if (typeof dashUserAvatar !== 'undefined' && dashUserAvatar) dashUserAvatar.src = photoURL;
    if (typeof currentProfilePic !== 'undefined' && currentProfilePic) currentProfilePic.src = photoURL;
}

async function saveEditProfile() {
    try {
        showLoading();
        // Get new display name and username values
        const newDisplayName = editDisplayName.value.trim();
        const newUsername = editUsername.value.trim().toLowerCase();
        const newBio = editBio.value.trim();
        // Validate display name
        if (!newDisplayName) {
            showToast('Display name cannot be empty', 'error');
            hideLoading();
            return;
        }
        if (newDisplayName.length > 40) {
            showToast('Display name too long', 'error');
            hideLoading();
            return;
        }
        // Validate username
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(newUsername)) {
            showToast('Invalid username format', 'error');
            hideLoading();
            return;
        }
        // If username changed, check availability
        if (newUsername !== currentUser.username) {
            const usernameRef = window.database.ref('usernames/' + newUsername);
            const usernameSnap = await usernameRef.once('value');
            if (usernameSnap.exists()) {
                showToast('Username is already taken', 'error');
                hideLoading();
                return;
            }
            // Remove old username mapping only if it belongs to this user
            const oldUsernameRef = window.database.ref('usernames/' + currentUser.username);
            const oldUsernameSnap = await oldUsernameRef.once('value');
            if (oldUsernameSnap.exists() && oldUsernameSnap.val() === currentUser.uid) {
                await oldUsernameRef.remove();
            }
            // Set new username mapping to current UID
            await usernameRef.set(currentUser.uid);
            // Update username in user profile
            await window.database.ref(`users/${currentUser.uid}/username`).set(newUsername);
            currentUser.username = newUsername;
            dashUsername.textContent = newUsername;
            navUsername.textContent = newUsername;
        }
        // Update display name if changed
        if (newDisplayName !== currentUser.displayName) {
            await window.database.ref(`users/${currentUser.uid}/displayName`).set(newDisplayName);
            currentUser.displayName = newDisplayName;
            currentUser.displayName = newDisplayName;
            dashDisplayName.textContent = newDisplayName;
        }
        // Update bio
        if (newBio !== currentUser.bio) {
            await window.database.ref(`users/${currentUser.uid}/bio`).set(newBio);
            currentUser.bio = newBio;
        }
        showToast('Profile updated successfully!', 'success');
        hideEditProfileModal();
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Failed to save profile', 'error');
    } finally {
        hideLoading();
    }
    // Username availability check for Edit Profile modal
    editUsername.addEventListener('input', async function (e) {
        const username = e.target.value.trim().toLowerCase();
        const statusDiv = document.getElementById('editUsernameStatus');
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!username) {
            statusDiv.textContent = '';
            statusDiv.className = 'username-status';
            saveEditProfileBtn.disabled = false;
            return;
        }
        if (!usernameRegex.test(username)) {
            statusDiv.textContent = 'Invalid format';
            statusDiv.className = 'username-status taken';
            saveEditProfileBtn.disabled = true;
            return;
        }
        if (username === currentUser.username) {
            statusDiv.textContent = '';
            statusDiv.className = 'username-status available';
            saveEditProfileBtn.disabled = false;
            return;
        }
        statusDiv.textContent = 'Checking...';
        statusDiv.className = 'username-status checking';
        const usernameRef = window.database.ref('usernames/' + username);
        const snap = await usernameRef.once('value');
        if (snap.exists()) {
            statusDiv.textContent = 'Username is already taken';
            statusDiv.className = 'username-status taken';
            saveEditProfileBtn.disabled = true;
        } else {
            statusDiv.textContent = 'Username is available';
            statusDiv.className = 'username-status available';
            saveEditProfileBtn.disabled = false;
        }
    });
}

// Bio Functions - Removed standalone saveBio function


// Modal Functions
function showModal() {
    linkModal.classList.add('active');
    linkTitle.focus();
}

function hideModal() {
    linkModal.classList.remove('active');
    currentEditingLinkId = null;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Wait for Firebase ready event
    const initializeAuth = () => {
        if (window.firebaseInitialized && window.auth && window.database) {
            // Auth state observer
            window.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    try {
                        const userSnapshot = await window.database.ref('users/' + user.uid).once('value');
                        if (userSnapshot.exists() && userSnapshot.val().username) {
                            currentUser = { ...user, ...userSnapshot.val() };
                            loadDashboard();
                        } else {
                            showUsernameSelection(user);
                        }
                    } catch (error) {
                        console.error('Error loading user data:', error);
                        showToast('Failed to load user data', 'error');
                        hideLoading();
                    }
                } else {
                    currentUser = null;
                    showScreen(loginScreen);
                }
            });
        } else {
            setTimeout(initializeAuth, 100);
        }
    };

    // Listen for Firebase ready event
    window.addEventListener('firebaseReady', initializeAuth);

    // Also try to initialize immediately in case Firebase is already ready
    if (window.firebaseInitialized) {
        initializeAuth();
    }

    // Login button
    googleLoginBtn.addEventListener('click', signInWithGoogle);

    // Username input
    usernameInput.addEventListener('input', (e) => {
        checkUsernameAvailability(e.target.value.trim().toLowerCase());
    });

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !confirmUsernameBtn.disabled) {
            confirmUsername();
        }
    });

    // Confirm username button
    confirmUsernameBtn.addEventListener('click', confirmUsername);

    // Logout button
    logoutBtn.addEventListener('click', () => {
        window.auth.signOut();
        hideEditProfileModal(); // Hide edit profile modal on logout
    });


    // Edit Profile button
    editProfileBtn.addEventListener('click', showEditProfileModal);

    // Add link button
    addLinkBtn.addEventListener('click', showAddLinkModal);

    // Modal buttons
    closeModal.addEventListener('click', hideModal);
    cancelLinkBtn.addEventListener('click', hideModal);
    saveLinkBtn.addEventListener('click', saveLink);

    // Edit Profile Modal buttons
    closeEditProfileModal.addEventListener('click', hideEditProfileModal);
    cancelEditProfileBtn.addEventListener('click', hideEditProfileModal);
    saveEditProfileBtn.addEventListener('click', saveEditProfile);

    // Profile picture upload
    uploadProfilePicBtn.addEventListener('click', () => {
        profilePictureInput.click();
    });

    if (removeProfilePicBtn) {
        removeProfilePicBtn.addEventListener('click', removeProfilePicture);
    }

    profilePictureInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file', 'error');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size must be less than 5MB', 'error');
                return;
            }
            // Show crop modal
            const reader = new FileReader();
            reader.onload = function (ev) {
                cropImage.src = ev.target.result;
                cropModal.style.display = 'flex';
                if (cropper) { cropper.destroy(); }
                cropper = new Cropper(cropImage, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 1,
                    movable: true,
                    zoomable: true,
                    rotatable: false,
                    scalable: false
                });
            };
            reader.readAsDataURL(file);
        }
    });

    cropCancelBtn.addEventListener('click', () => {
        if (cropper) { cropper.destroy(); cropper = null; }
        cropModal.style.display = 'none';
        profilePictureInput.value = '';
    });

    cropConfirmBtn.addEventListener('click', async () => {
        if (!cropper) return;
        showLoading();
        cropper.getCroppedCanvas({ width: 400, height: 400 }).toBlob(async (blob) => {
            cropModal.style.display = 'none';
            if (cropper) { cropper.destroy(); cropper = null; }
            await uploadProfilePicture(blob);
            hideLoading();
            profilePictureInput.value = '';
        }, 'image/jpeg', 0.95);
    });

    // Modal click outside to close
    linkModal.addEventListener('click', (e) => {
        if (e.target === linkModal) {
            hideModal();
        }
    });

    editProfileModal.addEventListener('click', (e) => {
        if (e.target === editProfileModal) {
            hideEditProfileModal();
        }
    });

    // Form submission in modal
    linkTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            linkUrl.focus();
        }
    });

    linkUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveLink();
        }
    });
});

// Make functions globally available for onclick handlers
window.editLink = editLink;
window.deleteLink = deleteLink;
