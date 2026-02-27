// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDZZNN4LKEloWXPMDwwQPRJKFX3FpR8yqw",
    authDomain: "mywebbiee.firebaseapp.com",
    databaseURL: "https://mywebbiee-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "mywebbiee",
    storageBucket: "mywebbiee.firebasestorage.app",
    messagingSenderId: "816897535419",
    appId: "1:816897535419:web:7fa6038a6751d39d22289e",
    measurementId: "G-HEFE2449NL"
};

// Initialize Firebase when all modules are loaded
let firebaseInitialized = false;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 50; // Maximum 10 seconds (50 * 200ms)

function initializeFirebase() {
    initializationAttempts++;
    
    // Prevent infinite loop - if we've tried too many times, give up
    if (initializationAttempts > MAX_INITIALIZATION_ATTEMPTS) {
        console.error('Failed to initialize Firebase after maximum attempts. Please refresh the page.');
        alert('Failed to load Firebase services. Please check your internet connection and refresh the page.');
        return;
    }

    // Check if Firebase and all required modules are loaded
    if (typeof firebase === 'undefined') {
        console.log(`Attempt ${initializationAttempts}: Firebase not loaded yet, waiting...`);
        setTimeout(initializeFirebase, 200);
        return;
    }

    // Check if auth module is available
    if (typeof firebase.auth !== 'function') {
        console.log(`Attempt ${initializationAttempts}: Firebase Auth module not loaded yet, waiting...`);
        setTimeout(initializeFirebase, 200);
        return;
    }

    // Check if database module is available
    if (typeof firebase.database !== 'function') {
        console.log(`Attempt ${initializationAttempts}: Firebase Database module not loaded yet, waiting...`);
        setTimeout(initializeFirebase, 200);
        return;
    }

    // Check if storage module is available
    if (typeof firebase.storage !== 'function') {
        console.log(`Attempt ${initializationAttempts}: Firebase Storage module not loaded yet, waiting...`);
        setTimeout(initializeFirebase, 200);
        return;
    }

    if (firebaseInitialized) return;

    try {
        // Check if Firebase is already initialized
        if (firebase.apps.length === 0) {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
        }
        
        // Firebase services
        const auth = firebase.auth();
        const database = firebase.database();
        const storage = firebase.storage();
        
        // Google Auth Provider
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });
        
        // Make services globally available
        window.auth = auth;
        window.database = database;
        window.storage = storage;
        window.googleProvider = googleProvider;
        // Attach ServerValue for TIMESTAMP support
        window.database.ServerValue = firebase.database.ServerValue;
        window.firebaseInitialized = true;
        
        firebaseInitialized = true;
        console.log('Firebase initialized successfully');
        
        // Dispatch custom event to signal Firebase is ready
        window.dispatchEvent(new CustomEvent('firebaseReady'));
        
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        setTimeout(initializeFirebase, 1000);
    }
}

// Start initialization when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeFirebase, 100);
    });
} else {
    setTimeout(initializeFirebase, 100);
}
