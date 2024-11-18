document.addEventListener('DOMContentLoaded', () => {
    console.log('Espace personnel script chargé.');

    // Assigner la fonction de rappel Google à window
    window.handleCredentialResponse = async function (response) {
        try {
            console.log("Réponse reçue de Google :", response);

            const idToken = response.credential;

            // Envoyer le token au serveur pour validation
            const serverResponse = await fetch('/.netlify/functions/validate-google-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const data = await serverResponse.json();

            if (data.authorized) {
                console.log('Utilisateur autorisé :', data.userEmail);

                // Stocker le token dans sessionStorage
                sessionStorage.setItem("userToken", idToken);

                // Mettre à jour l'affichage
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

    // Ajouter l'événement de déconnexion uniquement si le bouton est présent
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Supprimer le token du sessionStorage
            sessionStorage.removeItem("userToken");

            // Réinitialiser l'affichage
            document.getElementById('google-signin-container').style.display = 'block';
            document.getElementById('personal-space-content').style.display = 'none';
            document.getElementById('user-email').innerText = '';
            console.log("Utilisateur déconnecté.");
        });
    } else {
        console.warn("Bouton de déconnexion introuvable !");
    }
});
