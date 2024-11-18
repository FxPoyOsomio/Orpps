document.addEventListener('DOMContentLoaded', () => {
    console.log('Espace personnel script chargé.');

    // Vérifier si un token existe dans sessionStorage
    const storedToken = sessionStorage.getItem("userToken");
    if (storedToken) {
        console.log("Token existant trouvé. Tentative de validation...");

        // Valider le token stocké pour restaurer l'état de connexion
        fetch('/.netlify/functions/validate-google-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: storedToken }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.authorized) {
                console.log('Utilisateur autorisé via sessionStorage :', data.userEmail);
                document.getElementById('google-signin-container').style.display = 'none';
                document.getElementById('personal-space-content').style.display = 'block';
                document.getElementById('user-email').innerText = `Connecté en tant que : ${data.userEmail}`;
            } else {
                console.log("Le token dans sessionStorage n'est pas valide.");
                sessionStorage.removeItem("userToken"); // Nettoyer le token invalide
            }
        })
        .catch(error => console.error("Erreur lors de la validation du token depuis sessionStorage :", error));
    }
});

document.getElementById('logout-button').addEventListener('click', () => {
    // Supprimer le token du sessionStorage
    sessionStorage.removeItem("userToken");

    // Réinitialiser l'affichage
    document.getElementById('google-signin-container').style.display = 'block';
    document.getElementById('personal-space-content').style.display = 'none';
    document.getElementById('user-email').innerText = '';
    console.log("Utilisateur déconnecté.");
});
