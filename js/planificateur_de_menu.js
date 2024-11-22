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


// Fonction pour afficher les événements existants avec les repas associés
function displayUserEvents() {
    const user = netlifyIdentity.currentUser();

    if (user) {
        const events = user.user_metadata.events || [];
        const eventList = document.getElementById("eventList");

        if (eventList) {
            // Vider la liste avant d'ajouter les événements
            eventList.innerHTML = "";

            // Parcourir les événements et créer les divs
            events.forEach((event, eventIndex) => {
                const eventHTML = `
                    <div class="event">
                        <div class="event_cardContainer">
                            <div class="titre-section-container">
                                <svg class="titre-section-image" fill="#cb6863" width="50px" height="50px" viewBox="0 -2.89 122.88 122.88" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="enable-background:new 0 0 122.88 117.09" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style> <g> <path class="st0" d="M36.82,107.86L35.65,78.4l13.25-0.53c5.66,0.78,11.39,3.61,17.15,6.92l10.29-0.41c4.67,0.1,7.3,4.72,2.89,8 c-3.5,2.79-8.27,2.83-13.17,2.58c-3.37-0.03-3.34,4.5,0.17,4.37c1.22,0.05,2.54-0.29,3.69-0.34c6.09-0.25,11.06-1.61,13.94-6.55 l1.4-3.66l15.01-8.2c7.56-2.83,12.65,4.3,7.23,10.1c-10.77,8.51-21.2,16.27-32.62,22.09c-8.24,5.47-16.7,5.64-25.34,1.01 L36.82,107.86L36.82,107.86z M29.74,62.97h91.9c0.68,0,1.24,0.57,1.24,1.24v5.41c0,0.67-0.56,1.24-1.24,1.24h-91.9 c-0.68,0-1.24-0.56-1.24-1.24v-5.41C28.5,63.53,29.06,62.97,29.74,62.97L29.74,62.97z M79.26,11.23 c25.16,2.01,46.35,23.16,43.22,48.06l-93.57,0C25.82,34.23,47.09,13.05,72.43,11.2V7.14l-4,0c-0.7,0-1.28-0.58-1.28-1.28V1.28 c0-0.7,0.57-1.28,1.28-1.28h14.72c0.7,0,1.28,0.58,1.28,1.28v4.58c0,0.7-0.58,1.28-1.28,1.28h-3.89L79.26,11.23L79.26,11.23 L79.26,11.23z M0,77.39l31.55-1.66l1.4,35.25L1.4,112.63L0,77.39L0,77.39z"></path> </g> </g></svg>
                                <div class="titre-section-titre_border">
                                    <h2 class="titre-section-title">${event.name}</h2>
                                    <div class="titre-section-border"></div>
                                </div>
                            </div>
                            

                        </div>
                        <div class="event_ovelayContainer">
                            <div class="event_meals" id="eventMeals_${eventIndex}">
                                <!-- Les repas seront insérés ici -->
                            </div>
                            <button class="addMeal" event-id="${eventIndex}">ajouter un repas</button>
                        </div>
                    </div>
                `;
                eventList.innerHTML += eventHTML;

                // Appeler la fonction pour afficher les repas
                displayEventMeals(event, eventIndex);
            });
        }
    } else {
        console.warn("Utilisateur non connecté. Impossible de charger les événements.");
    }
}

function generateMealMenu(meal, mealMenuContainer) {
    if (!meal || !meal.menu || !Array.isArray(meal.menu)) return;

    // Vider le conteneur avant d'ajouter les catégories
    mealMenuContainer.innerHTML = "";

    // Parcourir les catégories activées
    meal.menu.forEach((category) => {
        if (category.activCategory) {
            const categoryHTML = `
                <div class="menuCategorie">
                    <h4 class="menuCategorie_title">${category.categoryMenu}</h4>
                </div>
            `;
            mealMenuContainer.innerHTML += categoryHTML;
        }
    });
}

// Fonction pour afficher les repas pour un événement donné
function displayEventMeals(event, eventIndex) {
    const mealContainer = document.getElementById(`eventMeals_${eventIndex}`);
    if (mealContainer && event.meal && Array.isArray(event.meal)) {
        // Vider le conteneur avant d'ajouter les repas
        mealContainer.innerHTML = "";

        // Parcourir les repas et créer les divs
        event.meal.forEach((meal, mealIndex) => {
            const mealHTML = `
                <div class="mealItem_container" event-id="${eventIndex}" meal-id="${mealIndex}">
                    <div class="mealItem">
                        <h3 class="mealTitle">${meal.mealDate}    ${meal.mealType}</h3>
                        <button class="deleteMealButton" event-id="${eventIndex}" meal-id="${mealIndex}">supprimer repas</button>
                    </div>
                    <div class="meal_menu" id="eventMealMenu_${eventIndex}_${mealIndex}"></div>
                </div>
            `;
            mealContainer.innerHTML += mealHTML;

            // Générer le contenu du menu pour ce repas
            const mealMenuContainer = document.getElementById(`eventMealMenu_${eventIndex}_${mealIndex}`);
            generateMealMenu(meal, mealMenuContainer);
        });
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



// Ajouter un gestionnaire pour le bouton "Nouveau repas"
document.addEventListener("click", (event) => {
    const addMealButton = event.target.closest(".addMeal");
    if (addMealButton) {
        const eventIndex = parseInt(addMealButton.getAttribute("event-id"), 10);
        openMealModal(eventIndex);
    }
});

// Fonction pour ouvrir le modal pour ajouter un repas
function openMealModal(eventIndex) {
    const mealTypes = [
        "Petit-Déjeuner",
        "Brunch",
        "Déjeuner",
        "Goûter",
        "Diner",
        "Soirée",
    ];

    const categoryMenus = {
        "Petit-Déjeuner": ["Dessert", "Céréales", "Boisson", "Boulangerie"],
        Brunch: ["Entrée", "Tapas", "Plat", "Dessert", "Céréales", "Boisson", "Boulangerie"],
        Déjeuner: ["Apéritif", "Entrée", "Tapas", "Plat", "Dessert", "Boisson", "Boulangerie"],
        Goûter: ["Dessert", "Céréales", "Boisson", "Boulangerie"],
        Diner: ["Apéritif", "Entrée", "Tapas", "Plat", "Dessert", "Boisson", "Boulangerie"],
        Soirée: ["Apéritif", "Entrée", "Tapas", "Plat", "Dessert", "Boisson", "Boulangerie"],
    };

    const today = new Date().toISOString().split("T")[0];


    // Créer le modal dynamiquement
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal">
            <h3 class="modal_Title">Ajouter un repas</h3>
            <div class="input_meal">
                <div class="input_mealDate">
                    <h4 class="modal_SubTitle">Date du repas</h4>
                    <input type="date" id="mealDateInput" value="${today}" required />
                </div>
                <div class="input_mealType">
                    <h4 class="modal_SubTitle">Type de repas</h4>
                    <select id="mealTypeInput" required>
                        <option value="" selected disabled>Sélectionnez...</option>
                        ${mealTypes.map((type, index) => `<option value="${index}">${type}</option>`).join("")}
                    </select>
                </div>
            </div>
            <div class="input_menu">
                <h4 class="modal_SubTitle">Menu avec ...</h4>
                <div id="menuCategories" class="input_menuCategories"></div>
            </div>
            <div class="modal_buttons">
                <button class="secondary-button" id="validateMeal">Valider</button>
                <button class="secondary-button" id="closeMealModal">Annuler</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Ajouter les événements
    const mealTypeInput = document.getElementById("mealTypeInput");
    const menuCategories = document.getElementById("menuCategories");

    // Met à jour les cases à cocher pour les catégories en fonction du type de repas sélectionné
    function updateCategories() {
        const selectedType = mealTypes[mealTypeInput.value];
        const categories = categoryMenus[selectedType] || [];
        menuCategories.innerHTML = categories
            .map(
                (category, index) => `
                <div class="input_menuCategorie">
                    <label>
                        <input type="checkbox" value="${category}" data-index="${index}" />
                        ${category}
                    </label>
                </div>`
            )
            .join("");
    }

    // Initialisation des catégories
    updateCategories();
    mealTypeInput.addEventListener("change", updateCategories);

    document.getElementById("validateMeal").addEventListener("click", () => validateMeal(eventIndex));
    document.getElementById("closeMealModal").addEventListener("click", closeMealModal);
}

// Fonction pour fermer le modal
function closeMealModal() {
    const modal = document.querySelector(".modal-overlay");
    if (modal) modal.remove();
}

// Fonction pour valider et ajouter un repas
function validateMeal(eventIndex) {
    const mealDateInput = document.getElementById("mealDateInput");
    const mealTypeInput = document.getElementById("mealTypeInput");
    const selectedCategories = [...document.querySelectorAll("#menuCategories input:checked")];

    const mealDate = mealDateInput ? mealDateInput.value : "";
    const mealTypeIndex = mealTypeInput ? parseInt(mealTypeInput.value, 10) : null;
    const mealType = mealTypeIndex !== null ? mealTypeInput.options[mealTypeIndex].text : "";

    if (!mealDate || mealTypeIndex === null || isNaN(mealTypeIndex)) {
        alert("Veuillez entrer une date et sélectionner un type de repas.");
        return;
    }

    const menu = selectedCategories.map((checkbox) => ({
        categoryMenu: checkbox.value,
        activCategory: true,
        recipes: [],
        ingredients: [],
    }));

    // Récupérer l'utilisateur actuel
    const user = netlifyIdentity.currentUser();

    if (user) {
        // Récupérer les événements actuels
        const events = user.user_metadata.events || [];
        const targetEvent = events[eventIndex];

        if (targetEvent) {
            // Ajouter le nouveau repas à l'événement
            const newMeal = {
                mealDate: mealDate,
                mealType: mealType,
                menu: menu,
            };

            targetEvent.meal = targetEvent.meal || [];
            targetEvent.meal.push(newMeal);

            // Mettre à jour les métadonnées utilisateur
            user.update({
                data: {
                    events: events,
                },
            })
                .then((updatedUser) => {
                    console.log("Repas ajouté avec succès :", updatedUser.user_metadata.events[eventIndex].meal);
                    closeMealModal(); // Fermer le modal après validation
                    displayUserEvents(); // Actualiser la liste des événements et repas
                })
                .catch((error) => {
                    console.error("Erreur lors de l'ajout du repas :", error);
                });
        } else {
            console.error("Événement introuvable.");
        }
    } else {
        alert("Utilisateur non connecté. Veuillez vous connecter pour ajouter un repas.");
    }
}



function deleteMeal(eventIndex, mealIndex) {
    const user = netlifyIdentity.currentUser();

    if (!user) {
        console.error("Utilisateur non connecté. Impossible de supprimer le repas.");
        return;
    }

    // Récupérer les événements de l'utilisateur
    const events = user.user_metadata.events || [];
    const targetEvent = events[eventIndex];

    if (targetEvent && targetEvent.meal && Array.isArray(targetEvent.meal)) {
        // Supprimer le repas du tableau
        targetEvent.meal.splice(mealIndex, 1);

        // Mettre à jour les métadonnées utilisateur
        user.update({
            data: {
                events: events,
            },
        })
            .then(() => {
                console.log(`Repas supprimé avec succès pour l'événement ${eventIndex}.`);
                displayUserEvents(); // Recharger les événements et repas
            })
            .catch((error) => {
                console.error("Erreur lors de la suppression du repas :", error);
            });
    } else {
        console.error("Repas ou événement introuvable.");
    }
}


document.addEventListener("click", (event) => {
    const deleteMealButton = event.target.closest(".deleteMealButton");
    if (deleteMealButton) {
        const eventIndex = parseInt(deleteMealButton.getAttribute("event-id"), 10);
        const mealIndex = parseInt(deleteMealButton.getAttribute("meal-id"), 10);

        if (!isNaN(eventIndex) && !isNaN(mealIndex)) {
            deleteMeal(eventIndex, mealIndex);
        } else {
            console.error("Les indices d'événement ou de repas ne sont pas valides.");
        }
    }
});
