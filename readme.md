# Link in Bio - Setup Instructions

## Firebase Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "link-in-bio")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google" provider
5. Toggle "Enable"
6. Add your project's domain to "Authorized domains"
7. Set up OAuth consent screen if prompted
8. Click "Save"

### 3. Set up Realtime Database

1. Go to "Realtime Database" in the left sidebar
2. Click "Create database"
3. Choose your location (closest to your users)
4. Start in "Test mode" for now (we'll update rules later)
5. Click "Done"

### 4. Get Firebase Configuration

1. Go to Project Settings (gear icon next to "Project Overview")
2. Scroll down to "Your apps" section
3. Click "Web" icon (</>) to add a web app
4. Enter app nickname (e.g., "Link in Bio Web")
5. Check "Also set up Firebase Hosting" (optional but recommended)
6. Click "Register app"
7. Copy the Firebase configuration object

### 5. Update Configuration Files

Replace the placeholder values in `config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 6. Deploy Database Rules

1. In Firebase Console, go to "Realtime Database"
2. Click on "Rules" tab
3. Replace the default rules with the content from `database.rules.json`
4. Click "Publish"

### 7. Set up Firebase Hosting (Optional but Recommended)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project directory:
   ```bash
   firebase init
   ```
   - Select "Hosting" and "Database"
   - Choose your existing project
   - Set public directory to current directory (.)
   - Configure as single-page app: No
   - Set up automatic builds: No
   - Don't overwrite existing files

4. Deploy to Firebase Hosting:
   ```bash
   firebase deploy
   ```

### 8. Custom Domain Setup (Optional)

1. In Firebase Console, go to "Hosting"
2. Click "Add custom domain"
3. Enter your domain name
4. Follow the verification steps
5. Update DNS records as instructed

## File Structure

```
MyWeb/
├── index.html          # Main dashboard and login page
├── profile.html        # Public profile page
├── styles.css          # All styling
├── app.js             # Main application logic
├── profile.js         # Public profile page logic
├── config.js          # Firebase configuration
├── firebase.json      # Firebase hosting configuration
├── database.rules.json # Database security rules
└── README.md          # This file
```

## Features Included

✅ **Google Authentication** - Secure login with Firebase Auth  
✅ **Username Selection** - Custom username with real-time availability check  
✅ **Real-time Validation** - Instant feedback on username availability  
✅ **Link Management** - Add, edit, delete unlimited links  
✅ **Drag & Drop Reordering** - Intuitive link organization  
✅ **Custom Icons** - Support for emojis, text, or symbols  
✅ **Public Profiles** - Clean, shareable profile pages  
✅ **Responsive Design** - Mobile-first, works on all devices  
✅ **Smooth Animations** - Professional UI with hover effects  
✅ **Bio Section** - Personal description up to 200 characters  
✅ **Firebase Hosting** - Fast, reliable hosting  
✅ **SEO Optimized** - Meta tags and social sharing support  

## URL Structure

- **Dashboard**: `yoursite.com/` (index.html)
- **Public Profile**: `yoursite.com/profile.html?username=USERNAME`
- **With URL Rewriting**: `yoursite.com/USERNAME` (requires Firebase Hosting)

## Security Features

- **Authentication Required** - Only logged-in users can manage their profiles
- **User Ownership** - Users can only edit their own data
- **Input Validation** - Client and server-side validation
- **XSS Protection** - HTML escaping for user content
- **Database Rules** - Comprehensive Firebase security rules

## Performance Optimizations

- **CDN Assets** - Font Awesome and Firebase from CDN
- **Optimized Images** - Cached profile images
- **Minimal JavaScript** - Vanilla JS, no heavy frameworks
- **Compressed CSS** - Efficient styling
- **Firebase Caching** - Automatic caching with Firebase Hosting

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Customization

### Changing Colors
Edit the CSS custom properties in `styles.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
}
```

### Adding Custom Icons
Support for:
- Emojis (🔗, 📱, 💼)
- Font Awesome icons
- Unicode symbols
- Text labels

### URL Customization
Update `firebase.json` rewrite rules to change URL structure.

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check Firebase config values
   - Verify Google Auth is enabled
   - Check authorized domains

2. **Database permission denied**
   - Verify database rules are deployed
   - Check user authentication status

3. **Username availability not checking**
   - Verify database rules allow read access
   - Check network connectivity

4. **Hosting not working**
   - Verify firebase.json configuration
   - Check deployment status
   - Verify custom domain DNS settings

### Getting Help

1. Check browser console for error messages
2. Verify Firebase configuration
3. Test with Firebase local emulator
4. Check Firebase Console for usage and errors

## License

This project is open source and available under the MIT License.

## Credits

Built with:
- Firebase (Authentication, Database, Hosting)
- Font Awesome (Icons)
- Vanilla JavaScript (No frameworks!)
- CSS3 (Modern styling)
