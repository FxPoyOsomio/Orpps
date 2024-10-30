#!/bin/bash

# Chemin vers votre dépôt
cd "/Users/francois-xavier.poy/Projets personnels/Sites internet/Orpps/Développement/"

# Ajoutez tous les fichiers modifiés
git add index.html script.js styles.css

# Vérifiez s'il y a des modifications à committer
if ! git diff-index --quiet HEAD --; then
    # Effectuez le commit avec un message par défaut
    git commit -m "Mise à jour automatique des fichiers"
    # Poussez les modifications
    git push origin main  # Remplacez "main" par le nom de votre branche si nécessaire
fi
