// Profile page functionality
let profileUsername = null;
let profileData = null;

// DOM Elements
const profileNotFound = document.getElementById('profileNotFound');
const publicProfile = document.getElementById('publicProfile');
const skeletonProfile = document.getElementById('skeletonProfile');
const publicAvatar = document.getElementById('publicAvatar');
const publicDisplayName = document.getElementById('publicDisplayName');
const publicUsername = document.getElementById('publicUsername');
const publicBio = document.getElementById('publicBio');
const publicLinksList = document.getElementById('publicLinksList');
const profileTitle = document.getElementById('profileTitle');
const loadingOverlay = document.getElementById('loadingOverlay');
const shareProfileBtn = document.getElementById('shareProfileBtn');

// Utility Functions
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

function showLoading() {
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Load profile data
async function loadProfile(username) {
    try {
        // showLoading(); // functionality replaced by Skeleton

        // Wait for Firebase to be ready with timeout
        let attempts = 0;
        const maxAttempts = 50; // 10 seconds max wait

        while ((!window.firebaseInitialized || !window.database) && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }

        if (!window.firebaseInitialized || !window.database) {
            console.error('Firebase not initialized after waiting');
            showProfileNotFound();
            return;
        }

        // First, get the user ID from the username
        const userIdSnapshot = await window.database.ref('usernames/' + username.toLowerCase()).once('value');
        const userId = userIdSnapshot.val();
        console.log('[MyWebies] userId from database for', username.toLowerCase(), ':', userId, typeof userId);
        if (!userId) {
            console.log('[MyWebies] Username not found or userId is null/undefined/empty string');
            if (publicProfile) publicProfile.style.display = 'none';
            if (profileNotFound) profileNotFound.style.display = 'flex';
            showProfileNotFound();
            return;
        }
        // Get user profile data directly
        const userDataSnapshot = await window.database.ref('users/' + userId).once('value');
        const userData = userDataSnapshot.val();
        console.log('[MyWebies] userData from database:', userData);
        if (!userData) {
            console.log('[MyWebies] User data not found or null');
            showProfileNotFound();
            return;
        }
        profileData = userData;
        console.log('[MyWebies] profileData before displayProfile:', profileData);
        displayProfile();

    } catch (error) {
        console.error('Error loading profile:', error);
        showProfileNotFound();
    } finally {
        hideLoading();
    }
}

function showProfileNotFound() {
    if (skeletonProfile) skeletonProfile.style.display = 'none';
    if (profileNotFound) profileNotFound.style.display = 'flex';
    if (publicProfile) publicProfile.style.display = 'none';
    if (profileTitle) profileTitle.textContent = 'Profile Not Found - MyWebies';
}

function displayProfile() {
    if (skeletonProfile) skeletonProfile.remove(); // Remove skeleton
    if (profileNotFound) profileNotFound.style.display = 'none';
    if (publicProfile) publicProfile.style.display = 'block'; // Show content

    // Update page title
    if (profileTitle && profileData) profileTitle.textContent = `${profileData.displayName || 'No Name'} (@${profileData.username || 'nouser'}) - MyWebies`;
    // Update profile info
    if (publicAvatar && profileData) publicAvatar.src = profileData.photoURL || 'https://via.placeholder.com/120x120?text=User';
    if (publicDisplayName && profileData) publicDisplayName.textContent = profileData.displayName || 'User';
    if (publicUsername && profileData) publicUsername.textContent = '@' + (profileData.username || 'nouser');
    // Update bio
    if (publicBio && profileData && profileData.bio && profileData.bio.trim()) {
        publicBio.textContent = profileData.bio;
        publicBio.style.display = 'block';
    } else if (publicBio) {
        publicBio.style.display = 'none';
    }
    // Load and display links
    loadAndDisplayLinks();

    // Update meta tags
    updateMetaTags();

    // Add animations after a short delay
    setTimeout(addLinkAnimations, 100);
}

function loadAndDisplayLinks() {
    const links = profileData.links || {};

    // Convert to array and sort by order
    const linksArray = Object.keys(links).map(key => ({
        id: key,
        ...links[key]
    })).sort((a, b) => (a.order || 0) - (b.order || 0));

    publicLinksList.innerHTML = '';

    if (linksArray.length === 0) {
        publicLinksList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px 20px; color: #666;">
                <i class="fas fa-link" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>No links to display yet.</p>
            </div>
        `;
        return;
    }

    linksArray.forEach(link => {
        const linkElement = document.createElement('a');
        linkElement.className = 'public-link-item';
        linkElement.href = link.url;
        linkElement.target = '_blank';
        linkElement.rel = 'noopener noreferrer';

        // Track link clicks (optional analytics)
        linkElement.addEventListener('click', () => {
            trackLinkClick(link.id);
        });

        linkElement.innerHTML = `
            <div class="public-link-icon">
                ${renderLinkIcon(link.icon)}
            </div>
            <div class="public-link-content">
                <div class="public-link-title">${escapeHtml(link.title)}</div>
                <div class="public-link-url">${formatUrl(link.url)}</div>
            </div>
        `;

        publicLinksList.appendChild(linkElement);
    });
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format URL for display
function formatUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch {
        return url;
    }
}

// Track link clicks (optional analytics)
async function trackLinkClick(linkId) {
    try {
        // You can implement analytics here
        // For example, increment a click counter in Firebase
        if (window.database && profileData) {
            const clickRef = window.database.ref(`analytics/${profileData.uid}/links/${linkId}/clicks`);
            await clickRef.transaction((currentClicks) => {
                return (currentClicks || 0) + 1;
            });
        }
    } catch (error) {
        console.error('Error tracking click:', error);
    }
}

// Add some visual feedback for link interactions
function addLinkAnimations() {
    const linkElements = document.querySelectorAll('.public-link-item');

    linkElements.forEach(link => {
        link.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });

        link.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });

        link.addEventListener('mousedown', function () {
            this.style.transform = 'translateY(-1px) scale(1.01)';
        });

        link.addEventListener('mouseup', function () {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
    });
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', function () {
    // 1. Extract username from path (e.g., /anis)
    const pathParts = window.location.pathname.split('/').filter(p => p !== '');
    const lastPart = pathParts[pathParts.length - 1];
    
    // 2. Extract username from query param (e.g., ?username=anis)
    const queryUsername = getUrlParameter('username');

    if (queryUsername) {
        profileUsername = queryUsername;
    } else if (lastPart && lastPart !== 'profile.html' && lastPart !== 'index.html' && lastPart !== 'MyWebies') {
        profileUsername = lastPart.replace('.html', '');
    }

    // 3. Clean the URL if it contains profile.html or query params
    if (profileUsername) {
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        
        // If we have a username and the URL is "messy" (has .html or query params)
        if (currentPath.includes('profile.html') || currentSearch.includes('username=')) {
            // Determine the clean path
            // If on a subdirectory (like GitHub Pages or similar), we might need to be careful.
            // But here it seems to be root-level.
            const cleanUrl = '/' + profileUsername;
            
            try {
                history.replaceState(null, '', cleanUrl);
            } catch (e) {
                console.warn('Could not clean URL:', e);
            }
        }
        
        loadProfile(profileUsername);
    } else {
        // If we are on profile.html without a username, it's a 404 situation
        if (window.location.pathname.includes('profile.html')) {
            showProfileNotFound();
        }
    }
});

// Handle browser back/forward navigation
window.addEventListener('popstate', function () {
    const newUsername = getUrlParameter('username');
    if (newUsername !== profileUsername) {
        profileUsername = newUsername;
        if (profileUsername) {
            loadProfile(profileUsername);
        } else {
            showProfileNotFound();
        }
    }
});

// Add keyboard navigation support
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        // Optional: Add any escape key functionality
    }
});

// Add meta tags for better social sharing
function updateMetaTags() {
    if (!profileData) return;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }

    const description = profileData.bio
        ? `${profileData.displayName} - ${profileData.bio}`
        : `Check out ${profileData.displayName}'s links`;

    metaDescription.content = description;

    // Add Open Graph tags for better social sharing
    updateOpenGraphTags();
}

function updateOpenGraphTags() {
    const ogTags = [
        { property: 'og:title', content: `${profileData.displayName} (@${profileData.username})` },
        { property: 'og:description', content: profileData.bio || `Check out ${profileData.displayName}'s links` },
        { property: 'og:image', content: profileData.photoURL },
        { property: 'og:url', content: window.location.href },
        { property: 'og:type', content: 'profile' }
    ];

    ogTags.forEach(tag => {
        let existingTag = document.querySelector(`meta[property="${tag.property}"]`);
        if (!existingTag) {
            existingTag = document.createElement('meta');
            existingTag.setAttribute('property', tag.property);
            document.head.appendChild(existingTag);
        }
        existingTag.content = tag.content;
    });
}

// Call updateMetaTags after profile is loaded
// Duplicate function displayProfile removed



// Handle Share Button
if (shareProfileBtn) {
    shareProfileBtn.addEventListener('click', async () => {
        const shareData = {
            title: `${profileData.displayName || 'User'}'s Profile`,
            text: `Check out ${profileData.displayName || 'User'}'s links on MyWebies!`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // User cancelled or share failed
                console.log('Share cancelled');
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast('Link copied to clipboard!', 'success');
            } catch (err) {
                showToast('Failed to copy link', 'error');
            }
        }
    });
}

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
// End of file - no extra closing brace
