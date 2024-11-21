document.addEventListener("DOMContentLoaded", () => {
    const user = netlifyIdentity.currentUser();
    console.log(user);

    const addEventButton = document.getElementById("addEvent");

    if (addEventButton) {
        addEventButton.addEventListener("click", openEventModal);
    }
    // Charger et afficher les événements existants
    displayUserEvents();
});

// Fonction pour créer et afficher le modal
function openEventModal() {
    // Créer le modal dynamiquement
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal">
            <h4>Nom du nouvel évènement</h4>
            <input type="text" id="eventNameInput" placeholder="Nom de l'évènement" required />
            <button class="secondary-button" id="validateEvent">Valider</button>
            <button class="secondary-button" id="closeModal">Annuler</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Ajouter les événements au modal
    document.getElementById("validateEvent").addEventListener("click", validateEvent);
    document.getElementById("closeModal").addEventListener("click", closeEventModal);
}

// Fonction pour fermer le modal
function closeEventModal() {
    const modal = document.querySelector(".modal-overlay");
    if (modal) modal.remove();
}

function validateEvent() {
    const eventNameInput = document.getElementById("eventNameInput");
    const eventName = eventNameInput ? eventNameInput.value.trim() : "";

    if (!eventName) {
        alert("Veuillez entrer un nom pour l'évènement.");
        return;
    }

    // Récupérer l'utilisateur actuel
    const user = netlifyIdentity.currentUser();

    if (user) {
        // Ajouter l'événement avec la date de création/mise à jour
        const newEvent = {
            name: eventName,
            last_modified: new Date().toISOString(), // Timestamp actuel
        };

        const updatedEvents = [
            ...(user.user_metadata.events || []), // Événements existants
            newEvent, // Nouvel événement
        ];

        // Mettre à jour les métadonnées utilisateur
        user.update({
            data: {
                events: updatedEvents,
            },
        }).then((updatedUser) => {
            console.log("Événement ajouté avec succès :", updatedUser.user_metadata.events);
            closeEventModal(); // Fermer le modal après validation
        }).catch((error) => {
            console.error("Erreur lors de l'ajout de l'événement :", error);
        });
    } else {
        alert("Utilisateur non connecté. Veuillez vous connecter pour ajouter un évènement.");
    }
}


// Fonction pour afficher les événements existants
function displayUserEvents() {
    const user = netlifyIdentity.currentUser();

    if (user) {
        const events = user.user_metadata.events || [];
        const eventList = document.getElementById("eventList");

        if (eventList) {
            // Vider la liste avant d'ajouter les événements
            eventList.innerHTML = "";

            // Parcourir les événements et créer les divs
            events.forEach((event, index) => {
                const eventHTML = `
                    <div class="event">
                        <h5>${event.name}</h5>
                        <secondary-button class="deleteEventButton" event-id="${index}">
                            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 64 64">
                                <defs>
                                    <style>
                                    .cls-1 {
                                        fill: #cb6863;
                                    }
                                    </style>
                                </defs>
                                <g>
                                    <g id="Calque_1">
                                    <g>
                                        <path class="cls-1" d="M45.4,7.6V2.7c0-1.5-1.2-2.7-2.7-2.7s-2.7,1.2-2.7,2.7v4.6h-15.9V2.7c0-1.5-1.2-2.7-2.7-2.7s-2.7,1.2-2.7,2.7v4.8c-8.1,1.3-14.3,8.5-14.3,17.1v21.9c0,9.5,7.5,17.4,17,17.4h21.4c9.5,0,17-7.8,17-17.4v-21.9c0-8.6-6.1-15.8-14.3-17.1ZM42.7,58.5h-21.4c-6.3,0-11.5-5.3-11.5-11.9v-21.9c0-5.6,3.8-10.3,8.8-11.5v.6c0,1.5,1.2,2.7,2.7,2.7s2.7-1.2,2.7-2.7v-.9h15.9v.9c0,1.5,1.2,2.7,2.7,2.7s2.7-1.2,2.7-2.7v-.6c5,1.3,8.8,5.9,8.8,11.5v21.9c0,6.6-5.2,11.9-11.5,11.9Z"></path>
                                        <path class="cls-1" d="M41,26.4c-1.1-1.1-2.8-1-3.9,0l-5.2,5.3-5.2-5.3c-1.1-1.1-2.8-1.1-3.9,0-1.1,1.1-1.1,2.8,0,3.9l5.3,5.4-5.3,5.4c-1.1,1.1-1,2.8,0,3.9,1.1,1.1,2.8,1,3.9,0l5.2-5.3,5.2,5.3c1.1,1.1,2.8,1.1,3.9,0s1.1-2.8,0-3.9l-5.3-5.4,5.3-5.4c1.1-1.1,1-2.8,0-3.9Z"></path>
                                    </g>
                                    </g>
                                </g>
                            </svg>
                        </secondary-button>
                    </div>
                `;
                eventList.innerHTML += eventHTML;
            });
        }
    } else {
        console.warn("Utilisateur non connecté. Impossible de charger les événements.");
    }
}

// Ajouter un gestionnaire pour supprimer les événements
document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".deleteEventButton");
    if (deleteButton) {
        deleteUserEvent(deleteButton);
    }
});

// Fonction pour supprimer un événement
function deleteUserEvent(button) {
    const eventId = parseInt(button.getAttribute("event-id"), 10);
    const user = netlifyIdentity.currentUser();

    if (!user || isNaN(eventId)) {
        console.error("Impossible de supprimer l'événement.");
        return;
    }

    // Supprimer l'événement de la liste
    const updatedEvents = user.user_metadata.events.filter((_, index) => index !== eventId);

    // Mettre à jour les métadonnées utilisateur
    user.update({
        data: {
            events: updatedEvents,
        },
    }).then(() => {
        console.log("Événement supprimé avec succès.");
        displayUserEvents(); // Recharger la liste des événements
    }).catch((error) => {
        console.error("Erreur lors de la suppression de l'événement :", error);
    });
}

