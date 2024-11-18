document.addEventListener('DOMContentLoaded', () => {
    console.log('Espace personnel script chargé.');
  
    // Fonction appelée après la connexion Google
    window.handleCredentialResponse = async function (response) {
        try {
            console.log('ID Token reçu :', response.credential);
    
            // Envoyer le token au serveur pour validation
            const serverResponse = await fetch('/.netlify/functions/validate-google-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: response.credential }),
            });
    
            const data = await serverResponse.json();
    
            if (data.authorized) {
                console.log('Utilisateur autorisé :', data.userEmail);
                document.getElementById('google-signin-container').style.display = 'none';
                document.getElementById('personal-space-content').style.display = 'block';
                document.getElementById('user-email').innerText = `Connecté en tant que : ${data.userEmail}`;
            } else {
                alert('Accès refusé : votre e-mail n’est pas autorisé.');
            }
        } catch (error) {
            console.error('Erreur lors de la validation du token Google :', error);
            alert('Erreur lors de la connexion. Veuillez réessayer.');
        }
    };
    
  });
  
