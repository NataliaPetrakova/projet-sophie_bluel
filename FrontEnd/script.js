// ========== FONCTION COMMUNE POUR FETCH (GLOBALE) ==========
async function fetchData(url) { // Fonction asynchrone réutilisable pour tous les appels API
  try { // Bloc try pour gérer les erreurs
    const res = await fetch(url); // Appel API et attente de la réponse
    if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`); // Si status pas entre 200-299, lance une erreur
    return await res.json(); // Convertit la réponse en JSON et la retourne
  } catch (err) { // Attrape toute erreur (réseau etc.)
    console.error(`Erreur fetch ${url}:`, err); // Log l'erreur dans la console avec l'URL concernée
    return null; // Retourne null pour indiquer l'échec (permet de tester facilement)
  }
}

// ========== GESTION DU MODE ADMIN (en dehors du load) - accessibles partout ==========
function displayAdminMode() { // Fonction qui active/désactive le mode édition selon l'état de connexion
  const token = sessionStorage.getItem("authToken"); // Récupère le token d'authentification stocké dans sessionStorage
  const authLink = document.getElementById("authLink"); // Récupère le lien login/logout dans le menu de navigation
  if (!authLink) {
    console.error("authLink introuvable - vérifier le HTML");
    return;
  } // Si le lien n'existe pas dans le HTML, affiche une erreur et arrête la fonction
  
  if (token) { // Si un token existe (utilisateur connecté)
    document.body.classList.add("is-admin"); // Ajoute la classe "is-admin" au body (active tous les styles admin (topbar, bouton modifier, etc.))
    authLink.innerText = "logout"; // Change le texte du lien en "logout"
    authLink.href = "#"; // Change le lien pour pointer vers "#" (ancre vide)
    
    authLink.onclick = (e) => { // Attache un gestionnaire de clic pour déconnecter l'utilisateur
      e.preventDefault(); // Empêche le comportement par défaut du lien
      sessionStorage.removeItem("authToken"); // Supprime le token de sessionStorage (déconnexion)
      displayAdminMode(); // Rappelle displayAdminMode pour mettre à jour l'interface
    };
    
  } else { // Si pas de token (utilisateur non connecté)
    document.body.classList.remove("is-admin"); // Retire la classe "is-admin" du body (cache tous les éléments admin)
    authLink.innerText = "login"; // Remet le texte "login"
    authLink.href = "login.html"; // Remet le lien vers la page de connexion
    authLink.onclick = null; // Supprime le gestionnaire de clic
  }
}

window.addEventListener("load", async () => { // Attend que toute la page soit chargée (DOM + images) - s'exécute au chargement
  const gallery = document.querySelector(".gallery"); // Récupère le conteneur de la galerie principale
  const categoriesDiv = document.querySelector(".div-categories"); // Récupère le conteneur des boutons filtres
  let figures = []; // Tableau qui stockera toutes les figures pour le filtrage (sans recharger l'API)

  // ========== SÉCURISER LES CONTENEURS AU DÉMARRAGE ==========
  if (!gallery || !categoriesDiv) { // Vérifie que les éléments existent
    console.error("Éléments .gallery ou .div-categories introuvables"); // Log d'erreur 
    return; // Stop l'exécution si éléments manquants
  }

  // ========== RÉCUPÈRE ET AFFICHE LES PROJETS ==========
  async function getWorks() { // Fonction pour charger tous les projets depuis l'API
    const works = await fetchData("http://localhost:5678/api/works"); // Appel API pour récupérer les works
    
    if (!works) { // Si l'API a échoué (fetchData a retourné null)
      gallery.innerHTML = "<p class='error'>Impossible de charger les images</p>"; // Message d'erreur dans la galerie
      return; // Stop la fonction
    }
    
    gallery.replaceChildren(); //Remettre à zéro
    
    // Utiliser for au lieu de forEach
    for (let i = 0; i < works.length; i++) { // Boucle sur chaque projet
      const figure = document.createElement("figure"); // Crée un élément <figure> en mémoire
      figure.dataset.catId = works[i].categoryId; // Stocke l'ID de catégorie dans data-cat-id + Ajout du contenu
      figure.innerHTML = ` 
        <img src="${works[i].imageUrl}" alt="${works[i].title}"> 
        <figcaption>${works[i].title}</figcaption>
      `;
      gallery.append(figure); // Ajoute la figure à la fin de la galerie (visible sur la page)
    }
    
    // Mise à jour du tableau figures
    figures = Array.from(gallery.querySelectorAll("figure")); // Convertit NodeList en Array pour stocker toutes les figures 
  }

  // ========== FILTRAGE (avec classList.toggle) ==========
  function applyFilter(id) { // Fonction qui masque/affiche selon la catégorie
    console.log(`=== FILTRAGE : ID cliqué = "${id}" (type: ${typeof id}) ===`); // Debug
    
    for (let i = 0; i < figures.length; i++) { // Parcourt toutes les figures
      const figCatId = figures[i].dataset.catId; // ID de catégorie de la figure
      const show = !id || String(figCatId) === String(id); // true si "Tous" (!id) ou si catégorie correspond (conversion en string pour comparaison stricte)
      
      figures[i].classList.toggle("is-hidden", !show); // Ajoute is-hidden si !show=true, retire si false
  }  
}


  // ========== RÉCUPÈRE ET AFFICHE LES CATÉGORIES ==========
  async function getCategories() { // Fonction pour créer les boutons de filtre
    const cats = await fetchData("http://localhost:5678/api/categories"); // Récupère les catégories depuis l'API
    
    if (!cats) { // Si l'API a échoué
      categoriesDiv.innerHTML = "<p class='error'>Impossible de charger les catégories</p>"; // Message d'erreur
      return; // Stop la fonction
    }
    
    categoriesDiv.replaceChildren();
    
    // Créer le bouton "Tous"
    const btnTous = document.createElement('button'); // Crée un élément button
    btnTous.type = 'button'; // Type button pour éviter soumission de form
    btnTous.className = 'filter is-active'; // Classes CSS (is-active par défaut)
    btnTous.textContent = 'Tous'; // Texte du bouton
    btnTous.dataset.catId = ''; // ID vide = tous les projets
    btnTous.setAttribute('aria-pressed', 'true'); // Accessibilité : bouton actuellement pressé (indique aux lecteurs d'écran que le bouton est actif)
    categoriesDiv.appendChild(btnTous); // Ajoute le bouton au conteneur (visible sur la page)
    
    // Créer les autres boutons avec for
    for (let i = 0; i < cats.length; i++) { // Boucle sur chaque catégorie
      const btn = document.createElement('button'); // Crée un bouton
      btn.type = 'button'; // Type="button"
      btn.className = 'filter'; // Classe CSS (sans is-active)
      btn.textContent = cats[i].name; // Nom de la catégorie comme texte
      btn.dataset.catId = cats[i].id; // Stocke l'ID de catégorie
      btn.setAttribute('aria-pressed', 'false'); // Accessibilité : bouton non pressé
      categoriesDiv.appendChild(btn); // Ajoute au conteneur
    }
    
    // Récupérer tous les boutons créés
    const allButtons = categoriesDiv.querySelectorAll('.filter'); // Sélectionne tous les boutons filter
    
    // Attacher les événements avec for
    for (let i = 0; i < allButtons.length; i++) { // Parcourt chaque bouton
      allButtons[i].addEventListener('click', function() { // Ajoute écouteur de clic
        // Appliquer le filtre
        applyFilter(allButtons[i].dataset.catId); // Filtre avec l'ID du bouton cliqué
        
        // Désactiver tous les boutons avec for
        for (let j = 0; j < allButtons.length; j++) { // Parcourt tous les boutons
          allButtons[j].classList.remove('is-active'); // Retire la classe active
          allButtons[j].setAttribute('aria-pressed', 'false'); // Met aria-pressed à false
        }
        
        // Activer celui cliqué
        allButtons[i].classList.add('is-active'); // Ajoute is-active au bouton cliqué
        allButtons[i].setAttribute('aria-pressed', 'true'); // Met aria-pressed à true
      });
    }
  }

  // ========== APPELS INITIAUX ==========
  await getWorks(); // Charge et affiche les projets au démarrage (chargement de la page)
  await getCategories(); // Charge et affiche les catégories au démarrage
  displayAdminMode(); // Active le mode admin si token présent dans sessionStorage


  // ========== GESTION DES MODALES (V3) ==========
  const modalGallery = document.getElementById('modal-gallery'); // Récupère la modale galerie par son ID
  const modalAdd = document.getElementById('modal-add'); // Récupère la modale ajout par son ID (Vérifie que 2 modales existent dans le HTML)

  if (!modalGallery || !modalAdd) {
    console.error('Modales introuvables dans le HTML');  // Si une des modales est manquante, affiche une erreur
    return; // Arrête l'exécution pour éviter d'autres erreurs
  }


  // ========== OUVRIR LA MODALE GALERIE (Point d’entrée utilisateur) ==========
  function openModalGallery() { // Fonction pour afficher la modale galerie
    if (!document.getElementById('modal-gallery-grid').children.length) {
      loadGalleryView(); // Vérifie si la galerie de la modale est vide (si - vide, charge les images depuis l'API)
    }
    
    modalGallery.classList.add('show'); // Ajoute la classe "show" pour afficher la modale galerie (CSS: display: flex)
    modalGallery.removeAttribute('aria-hidden'); // Retire l'attribut aria-hidden (pour les lecteurs d'écran)
    modalGallery.setAttribute('aria-modal', 'true'); // Indique que c'est une modale active (accessibilité)
    
    modalAdd.classList.remove('show'); // Cache la modale ajout au cas où elle serait ouverte
    modalAdd.setAttribute('aria-hidden', 'true'); // Met aria-hidden à "true" sur la modale ajout
    
    document.body.classList.add('modal-open'); // Ajoute la classe "modal-open" au body pour bloquer le scroll de la page
  }

  // ========== OUVRIR LA MODALE AJOUT (Transition naturelle) ==========
  function openModalAdd() { // Fonction pour afficher la modale d'ajout de photo
    const select = document.getElementById('photo-category');  // Récupère le select des catégories
    if (select.options.length === 1) { // Vérifie si le select contient seulement l'option par défaut (donc vide)
      loadCategories(); // Si oui, charge les catégories depuis l'API
    }
    
    modalAdd.classList.add('show'); // Ajoute la classe "show" pour afficher la modale ajout
    modalAdd.removeAttribute('aria-hidden'); // Retire aria-hidden pour l'accessibilité
    modalAdd.setAttribute('aria-modal', 'true'); // Indique que c'est une modale active
    
    modalGallery.classList.remove('show'); // Cache la modale galerie au cas où elle serait ouverte
    modalGallery.setAttribute('aria-hidden', 'true'); // Met aria-hidden à "true" sur la modale galerie
    
    document.body.classList.add('modal-open'); // Bloque le scroll de la page
  }

  // ========== FERMER TOUTES LES MODALES (Évite les modales superposées) ==========
  function closeModals() { // Fonction pour fermer les deux modales et nettoyer l'interface
    modalGallery.classList.remove('show'); // Retire la classe "show" de la modale galerie 
    modalGallery.setAttribute('aria-hidden', 'true'); // Ajoute aria-hidden="true" pour l'accessibilité
    
    modalAdd.classList.remove('show'); // Retire la classe "show" de la modale ajout
    modalAdd.setAttribute('aria-hidden', 'true'); // Ajoute aria-hidden="true"
    
    document.body.classList.remove('modal-open'); // Retire la classe "modal-open" du body pour réactiver le scroll de la page
    
    // REMETTRE À ZÉRO le formulaire (Pas de données restées)
    const form = document.getElementById('add-photo-form'); // Récupère le formulaire d'ajout
    if (form) { // Si le formulaire existe
      form.reset(); // Réinitialise tous les champs du formulaire (vide les inputs, reset le select)
      
      const submitBtn = form.querySelector('.btn-validate'); // Récupère le bouton "Valider"
      if (submitBtn) submitBtn.disabled = true; // Si le bouton existe, le désactive (gris)
      
      const uploadZone = document.getElementById('upload-zone'); // Récupère la zone d'upload
      const preview = uploadZone?.querySelector('img'); // Cherche s'il y a une image de prévisualisation
      if (preview) preview.remove(); // Si une prévisualisation existe, la supprime
    }
  }

  // ========== CHARGER LA VUE GALERIE (Voir la photo ajoutée) ==========
  async function loadGalleryView() { // Fonction asynchrone pour remplir la galerie de la modale avec les images
    const galleryGrid = document.getElementById('modal-gallery-grid'); // Récupère le conteneur de la grille de miniatures dans la modale
    if (!galleryGrid) return;  // Si le conteneur n'existe pas, arrête la fonction
    
    const works = await fetchData("http://localhost:5678/api/works"); // Appelle l'API pour récupérer tous les projets
    
    if (!works) { // Si l'API a échoué
      galleryGrid.innerHTML = '<p>Erreur de chargement</p>'; // Affiche un message d'erreur dans la grille
      return;  // Arrête la fonction
    }
    
    // REMETTRE À ZÉRO
    galleryGrid.replaceChildren(); // Vide la grille de miniatures
    
    for (let i = 0; i < works.length; i++) { // Boucle sur chaque projet retourné par l'API
      const figure = document.createElement('figure');  // Crée un élément <figure> pour la miniature
      figure.className = 'modal-figure';  // Ajoute la classe CSS "modal-figure"
      figure.dataset.workId = works[i].id; // Stocke l'ID du projet dans un attribut data-work-id
      
      const img = document.createElement('img'); // Crée un élément <img> pour l'image
      img.src = works[i].imageUrl; // Définit la source de l'image
      img.alt = works[i].title; // Définit le texte alternatif pour l'accessibilité
      
     //===== BOUTON DE SUPPRESSION =====
      const deleteBtn = document.createElement('button'); // Crée un bouton pour supprimer le projet
      deleteBtn.type = 'button';  // Type "button" pour éviter de soumettre un formulaire
      deleteBtn.className = 'delete-work'; // Classe CSS pour le style du bouton (petite poubelle noire)
      deleteBtn.dataset.id = works[i].id; // Stocke l'ID du projet dans le bouton pour savoir quoi supprimer
      deleteBtn.setAttribute('aria-label', `Supprimer ${works[i].title}`); // Attribut ARIA pour décrire l'action aux lecteurs d'écran
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>'; // Insère l'icône de poubelle FA
      
      figure.appendChild(img); // Ajoute l'image à la figure
      figure.appendChild(deleteBtn); // Ajoute le bouton de suppression à la figure (superposé sur l'image)
      galleryGrid.appendChild(figure); // Ajoute la figure complète à la grille de la modale
    }
  }

  // ========== CHARGER LES CATÉGORIES (Actualiser les choix disponibles) ==========
  async function loadCategories() {  // Fonction asynchrone pour remplir le menu déroulant des catégories
    const select = document.getElementById('photo-category'); // Récupère l'élément <select> du formulaire d'ajout
    if (!select) return; // Si le select n'existe pas, arrête la fonction
    
    const cats = await fetchData("http://localhost:5678/api/categories"); // Appelle l'API pour récupérer les catégories
    if (!cats) { // Si l'API a échoué
      console.error('Impossible de charger les catégories'); // Affiche une erreur dans la console
      return;
    }

    
    // ===== OPTIONS DES CATÉGORIES =====
    for (let i = 0; i < cats.length; i++) { // Boucle sur chaque catégorie retournée par l'API
      const option = document.createElement('option'); // Crée un élément <option>
      option.value = cats[i].id; // Définit la valeur de l'option (l'ID de la catégorie)
      option.textContent = cats[i].name; // Définit le texte visible (le nom de la catégorie)
      select.appendChild(option); // Ajoute l'option au select
    }
  }

  // ========== SUPPRIMER UN WORK ==========
  async function deleteWork(id) { // Fonction asynchrone pour supprimer un work via l'API
    const token = sessionStorage.getItem('authToken'); // Récupère le token d'authentification depuis sessionStorage
    if (!token) {  // Si pas de token (utilisateur non connecté)
      alert('Vous devez être connecté'); // Affiche un message d'alerte
      return;  // Arrête la fonction
    }
    
    if (confirm('Voulez-vous vraiment supprimer ce projet ?')) { // Demande confirmation à l'utilisateur avant de supprimer confirm retourne true si OK, false si Annuler
      try { // Fait un appel API DELETE pour supprimer le projet
        const res = await fetch(`http://localhost:5678/api/works/${id}`, {
          method: 'DELETE', // Méthode HTTP DELETE
          headers: { 'Authorization': `Bearer ${token}` } // Headers avec le token d'authentification
        });
        
        if (res.ok) { // Si la suppression a réussi (status 200-299)
          await loadGalleryView(); // Recharge la galerie de la modale pour retirer l'image supprimée
          await getWorks(); // Recharge aussi la galerie principale
        } else {
          alert(`Suppression impossible (HTTP ${res.status})`); // Si la suppression a échoué, affiche le code d'erreur
        }
      } catch (err) { // Si une erreur réseau ou autre se produit
        console.error('Erreur suppression:', err); // Affiche l'erreur dans la console
        alert('Erreur lors de la suppression'); // Informe l'utilisateur
      }
    }
  }

  document.addEventListener('click', function(e) { //1 seul écouteur pour gérer TOUS les clics
  
  // Bouton "MODIFIER"
  if (e.target.classList.contains('edit-btn')) {
    openModalGallery();
  }
  
  // Bouton "AJOUTER UNE PHOTO"
  if (e.target.id === 'btn-show-add') {
    openModalAdd();
  }
  
  // Bouton "RETOUR" 
  if (e.target.closest('.modal-back')) {
    openModalGallery();
  }
  
  // Boutons "FERMER" 
  if (e.target.classList.contains('modal-close')) {
    closeModals();
  }
  
  // Bouton "SUPPRIMER"
  if (e.target.closest('.delete-work')) {
    const btn = e.target.closest('.delete-work');
    deleteWork(btn.dataset.id);
  }
  
  // Fermer en cliquant sur l'overlay
  if (e.target === modalGallery || e.target === modalAdd) {
    closeModals();
  }
});

// Fermer avec la touche Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalGallery.classList.contains('show') || modalAdd.classList.contains('show')) {
      closeModals();
    }
  }
});

  // ========== GESTION DU FORMULAIRE D'AJOUT ==========
const addPhotoForm = document.getElementById('add-photo-form'); // Récupère le formulaire
if (addPhotoForm) { // Si le formulaire existe
  
  // PRÉVISUALISATION DE L'IMAGE
const photoUpload = document.getElementById('photo-upload'); // Récupère l'input de type file pour l'upload de photo
const uploadZone = document.getElementById('upload-zone'); // Récupère la zone d'affichage de la prévisualisation

photoUpload.addEventListener('change', function(e) { // Écoute l'événement change' déclenché quand l'utilisateur sélectionne un fichier
  const file = e.target.files[0]; // Récupère le premier fichier sélectionné par l'utilisateur
  if (!file) return; // Si aucun fichier n'est sélectionné, arrête la fonction
  
  // Supprimer l'ancienne prévisualisation
  const oldPreview = uploadZone.querySelector('img.preview'); // Cherche s'il existe déjà une image de prévisualisation
  if (oldPreview) { // Si une ancienne prévisualisation existe
    URL.revokeObjectURL(oldPreview.src); // Libère la mémoire en supprimant l'URL temporaire précédente
    oldPreview.remove(); // Supprime l'ancienne image du DOM
  }
  
  // Créer la nouvelle prévisualisation
  const img = document.createElement('img'); // Crée un nouvel élément <img> pour la prévisualisation
  img.src = URL.createObjectURL(file); // Crée une URL temporaire pointant vers le fichier local (plus rapide que base64)
  img.className = 'preview'; // Ajoute la classe CSS 'preview' pour le style
  img.alt = 'Aperçu de l\'image'; // Définit le texte alternatif pour l'accessibilité
  
  uploadZone.classList.add('has-preview'); // Ajoute la classe 'has-preview' pour cacher l'icône et le texte d'upload
  uploadZone.prepend(img); // Insère l'image au début de la zone d'upload (avant les autres éléments)
  
  checkFormValidity(); // Vérifie si tous les champs du formulaire sont remplis pour activer le bouton "Valider"
});
  
  // ===== VALIDATION DU FORMULAIRE =====
  // Fonction qui vérifie si tous les champs sont remplis
  function checkFormValidity() {
    const title = document.getElementById('photo-title').value.trim(); // Récupère la valeur du champ titre et supprime les espaces avant/après avec trim() - Pour éviter que l’utilisateur entre "   Mon image  " et que ton script traite ça comme "Mon image"
    const category = document.getElementById('photo-category').value;  // Récupère la valeur sélectionnée dans le select des catégories
    const file = photoUpload.files[0]; // Récupère le fichier sélectionné dans l'input file
    const submitBtn = addPhotoForm.querySelector('.btn-validate'); // Récupère le bouton de soumission du formulaire
    
    // Active le bouton si tous les champs sont remplis
    if (title && category && file) { // Vérifie que les 3 champs sont remplis (title non vide, category choisie, file sélectionné)
      submitBtn.disabled = false; // Si tous les champs sont remplis, active le bouton (le rend cliquable et vert)
    } else { 
      submitBtn.disabled = true; // Sinon, désactive le bouton (gris et non cliquable)
    }
  }
  
  document.getElementById('photo-title').addEventListener('input', checkFormValidity);  // Écoute l'événement 'input' sur le champ titre (déclenché à chaque frappe au clavier) - à chaque changement, vérifie la validité du formulaire
  document.getElementById('photo-category').addEventListener('change', checkFormValidity);  // Écoute l'événement 'change' sur le select catégorie (déclenché quand on choisit une option) à chaque changement, vérifie la validité du formulaire
  
  // ===== SOUMISSION DU FORMULAIRE =====
  addPhotoForm.addEventListener('submit', async function(e) {   // Écoute l'événement 'submit' sur le formulaire (déclenché quand on clique sur "Valider")
    e.preventDefault(); // Empêche le rechargement de la page
    
    const token = sessionStorage.getItem('authToken'); // Récupère le token d'authentification
    if (!token) { // Si pas de token, l'utilisateur n'est pas connecté
      alert('Vous devez être connecté pour ajouter un projet');
      return;
    }
    
    const title = document.getElementById('photo-title').value.trim(); // Récupère la valeur du champ titre (avec trim pour supprimer les espaces)
    const category = document.getElementById('photo-category').value; // Récupère la valeur de la catégorie sélectionnée
    const file = photoUpload.files[0]; // Récupère le fichier image sélectionné
    
    // Vérifie que tous les champs sont remplis
    if (!title || !category || !file) {  // Si un champ manque, affiche une alerte et arrête la fonction
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    const formData = new FormData(); // Crée un objet FormData qui permet d'envoyer des fichiers via HTTP
    formData.append('title', title); // Ajoute le titre au FormData avec la clé 'title'
    formData.append('category', category); // Ajoute l'ID de la catégorie au FormData avec la clé 'category'
    formData.append('image', file); // Ajoute le fichier image au FormData avec la clé 'image'
    
    const submitBtn = addPhotoForm.querySelector('.btn-validate'); // Récupère le bouton de soumission pour le désactiver pendant l'envoi
    submitBtn.disabled = true; // Désactive le bouton pour éviter les doubles clics
    submitBtn.textContent = 'Envoi en cours...'; // Change le texte du bouton pour indiquer que l'envoi est en cours
    
    try {
      const response = await fetch('http://localhost:5678/api/works', { // Fait un appel HTTP POST vers l'API pour créer un nouveau projet
        method: 'POST',
        headers: { // Headers HTTP : uniquement Authorization avec le token
          'Authorization': `Bearer ${token}`// Ajoute le token Bearer pour l'authentification
        },
        body: formData // Corps de la requête : envoie le FormData contenant l'image et les données
      });
      
      if (response.ok) { // Vérifie si la réponse HTTP est OK (status 200-299)
        const newWork = await response.json(); // Convertit la réponse JSON en objet JavaScript (le nouveau projet créé)
        
        console.log('Projet ajouté avec succès :', newWork); // Affiche dans la console le projet nouvellement créé pour le débogage
        
        await loadGalleryView(); // Recharge la galerie de la modale pour afficher le nouveau projet
        await getWorks(); // Recharge la galerie principale de la page pour afficher le nouveau projet
        
        openModalGallery(); // Ferme la modale ajout et ouvre la modale galerie pour voir le résultat
        
        addPhotoForm.reset(); // Réinitialise tous les champs du formulaire (vide les inputs)
        uploadZone.classList.remove('has-preview'); // Retire la classe 'has-preview' pour réafficher l'icône et le bouton d'upload
        const preview = uploadZone.querySelector('img.preview'); // Cherche l'image de prévisualisation dans la zone upload
        if (preview) preview.remove(); // Si une image de prévisualisation existe, la supprime du DOM
        
      } else { // Si l'API retourne une erreur (erreur 400, 401, 500, etc.)
        const error = await response.json(); // Tente de récupérer le message d'erreur renvoyé par l'API en JSON
        console.error('Erreur API :', error); // Affiche l'erreur dans la console pour le débogage
        alert(`Erreur lors de l'ajout : ${error.message || response.status}`); // Affiche une alerte à l'utilisateur avec le message d'erreur ou le code HTTP
      }
      
    } catch (err) { // Si une erreur réseau se produit
      console.error('Erreur lors de l\'ajout :', err); // Affiche l'erreur dans la console pour le débogage
      alert('Erreur lors de l\'ajout du projet. Vérifiez votre connexion.'); // Affiche une alerte à l'utilisateur pour l'informer du problème
      
    } finally { // Bloc finally : s'exécute TOUJOURS, que la requête ait réussi ou échoué
      submitBtn.disabled = false; // Réactive le bouton pour permettre une nouvelle tentative
      submitBtn.textContent = 'Valider'; // Remet le texte d'origine sur le bouton
    }
  });
}
  
}); // Fin du window.addEventListener("load")
