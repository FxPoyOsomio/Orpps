document.addEventListener('DOMContentLoaded', function() {
    // Initialize Netlify Identity
    netlifyIdentity.init({
        APIUrl: 'https://orpps.netlify.app/.netlify/identity' 
    });
  
    // Check if the user is logged in
    netlifyIdentity.on('init', function(user) {
        const user = netlifyIdentity.currentUser();
        if (!user) {
            window.location.href = '/index.html';
        }
    });
  
    var logoutButton = document.getElementById('logout-button');
    var accountButton = document.getElementById('account-button');
  
    logoutButton.addEventListener('click', function() {
      netlifyIdentity.logout();
    });
  
    accountButton.addEventListener('click', function() {
      // Open the account management modal
      netlifyIdentity.open('user');
    });
  
    netlifyIdentity.on('logout', function() {
      console.log('User logged out');
      // Redirect to the home page after logout
      window.location.href = '/index.html';
    });
  });
  