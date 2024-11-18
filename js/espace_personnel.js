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

                // Stocker le token et l'email utilisateur dans localStorage
                localStorage.setItem("userToken", idToken);
                localStorage.setItem("userEmail", data.userEmail);

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

    // Vérifier si un token existe dans localStorage
    const storedToken = localStorage.getItem("userToken");
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
                console.log('Utilisateur autorisé :', data.userEmail);
                localStorage.setItem('userEmail', data.userEmail);
                document.getElementById('google-signin-container').style.display = 'none';
                document.getElementById('personal-space-content').style.display = 'block';
                document.getElementById('user-email').innerText = `Connecté en tant que : ${data.userEmail}`;
            } else {
                alert('Accès refusé : votre e-mail n’est pas autorisé.');
            }
        })
        .catch(error => console.error("Erreur lors de la validation du token depuis localStorage :", error));
    }

    // Ajouter l'événement de déconnexion uniquement si le bouton est présent
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Supprimer l'email de l'utilisateur et le token du localStorage
            localStorage.removeItem("userToken");
            localStorage.removeItem("userEmail");
    
            // Réinitialiser l'affichage
            const signinContainer = document.getElementById('google-signin-container');
            const personalSpaceContent = document.getElementById('personal-space-content');
            const userEmailElement = document.getElementById('user-email');
    
            if (signinContainer) signinContainer.style.display = 'block';
            if (personalSpaceContent) personalSpaceContent.style.display = 'none';
            if (userEmailElement) userEmailElement.innerText = '';
    
            console.log("Utilisateur déconnecté.");
        });
    } else {
        console.warn("Bouton de déconnexion introuvable !");
    }
});
