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
function displayAdminMode() {
  const token = sessionStorage.getItem("authToken");
  const authLink = document.getElementById("authLink");
  
  if (!authLink) {
    console.error("authLink introuvable - vérifier le HTML");
    return;
  }
  
  if (token) {
    document.body.classList.add("is-admin");
    
    if (!document.querySelector(".topbar")) {
      const bar = document.createElement("div");
      bar.className = "topbar";
      bar.innerHTML = `<i class="fa-regular fa-pen-to-square"></i> Mode édition`;
      document.body.prepend(bar);
    }
    
    authLink.innerText = "logout";
    authLink.href = "#";
    authLink.onclick = (e) => {
      e.preventDefault();
      sessionStorage.removeItem("authToken");
      displayAdminMode();
    };
  } else {
    document.body.classList.remove("is-admin");
    document.querySelector(".topbar")?.remove();
    
    authLink.innerText = "login";
    authLink.href = "login.html";
    authLink.onclick = null;
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
    
    gallery.innerHTML = ""; // Vide la galerie avant de la remplir (évite les doublons)
    
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
    let visibleCount = 0; // Compteur pour vérifier combien d'images sont visibles
    
    for (let i = 0; i < figures.length; i++) { // Parcourt toutes les figures
      const figCatId = figures[i].dataset.catId; // ID de catégorie de la figure
      const show = !id || String(figCatId) === String(id); // true si "Tous" (!id) ou si catégorie correspond (conversion en string pour comparaison stricte)
      
      figures[i].classList.toggle("is-hidden", !show); // Ajoute is-hidden si !show=true, retire si false
      
      if (show) visibleCount++; // Montre combien d'images sont affichées au final
  }  
}



  // ========== RÉCUPÈRE ET AFFICHE LES CATÉGORIES ==========
  async function getCategories() { // Fonction pour créer les boutons de filtre
    const cats = await fetchData("http://localhost:5678/api/categories"); // Récupère les catégories depuis l'API
    
    if (!cats) { // Si l'API a échoué
      categoriesDiv.innerHTML = "<p class='error'>Impossible de charger les catégories</p>"; // Message d'erreur
      return; // Stop la fonction
    }
    
    categoriesDiv.innerHTML = ''; // Vide le conteneur des boutons
    
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
  await getWorks(); // Charge et affiche les projets au démarrage
  await getCategories(); // Charge et affiche les catégories au démarrage
  displayAdminMode(); // Active le mode admin si token présent

  // ========== GESTION DE LA MODALE (V2) ==========

  // Variables globales pour la modale
  let modalWorks = null;  // Stockage des works pour éviter les requêtes répétées
  let currentView = 'gallery';  // Vue actuelle : 'gallery' ou 'add'

  // Éléments de la modale (à récupérer une fois)
  const modal = document.getElementById('modal'); // Récupère l'élément avec l'ID 'modal' dans le document HTML
  const modalWrapper = modal?.querySelector('.modal-wrapper'); // Récupère l'élément avec la classe CSS '.modal-wrapper' à l'intérieur de la modale
  // L'opérateur '?.' est utilisé pour éviter une erreur si 'modal' est null ou undefined
  // Si 'modal' existe, 'modalWrapper' contiendra l'élément correspondant à '.modal-wrapper'
  // Sinon, 'modalWrapper' sera undefined

  // ========== VÉRIFIER L'EXISTENCE DE LA MODALE ==========
  if (!modal || !modalWrapper) {
    console.error("Structure de modale manquante (#modal/.modal-wrapper)");
    return; // Stop l'exécution si la modale n'existe pas
  }

  // ========== CRÉATION DE LA STRUCTURE DE BASE (UNE SEULE FOIS) ==========
  function initModal() {
    // Vider le wrapper une seule fois
    modalWrapper.innerHTML = '';

    // Bouton fermer (déjà présent dans le HTML : .modal-close) → on branche l'event ici
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Créer le bouton retour (caché par défaut)
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'modal-back';
    backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
    backBtn.setAttribute('aria-label', 'Retour à la galerie');
    backBtn.style.display = 'none';  // Caché au départ
    backBtn.addEventListener('click', () => switchView('gallery'));
    modalWrapper.appendChild(backBtn);

    // Créer le titre (dynamique)
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.id = 'modal-title';  // ID pour le modifier facilement
    modalWrapper.appendChild(title);

    // Créer le conteneur principal qui contiendra les différentes vues
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalWrapper.appendChild(modalContent);

    // Vue 1 : Galerie
    const galleryView = document.createElement('div');
    galleryView.className = 'view-gallery';
    galleryView.id = 'view-gallery';
    modalContent.appendChild(galleryView);

    // Vue 2 : Formulaire d'ajout
    const addView = document.createElement('div');
    addView.className = 'view-add';
    addView.id = 'view-add';
    addView.style.display = 'none';  // Cachée par défaut
    modalContent.appendChild(addView);

    // Initialiser le contenu de la vue galerie
    setupGalleryView(galleryView);

    // Initialiser le contenu de la vue ajout
    setupAddView(addView);
  }

  // ========== CHANGER DE VUE ==========
  function switchView(view) {
    const galleryView = document.getElementById('view-gallery');
    const addView = document.getElementById('view-add');
    const modalTitle = document.getElementById('modal-title');
    const backBtn = document.querySelector('.modal-back');

    currentView = view;

    if (view === 'gallery') {
      // Afficher la vue galerie
      galleryView.style.display = 'block';
      addView.style.display = 'none';
      modalTitle.textContent = 'Galerie photo';
      backBtn.style.display = 'none';
    } else if (view === 'add') {
      // Afficher la vue ajout
      galleryView.style.display = 'none';
      addView.style.display = 'block';
      modalTitle.textContent = 'Ajout photo';
      backBtn.style.display = 'block';
    }
  }

  // ========== OUVRIR LA MODALE ==========
  function openModal() {
    // Si c'est la première ouverture, initialiser la structure
    if (!modalWrapper.querySelector('.modal-content')) {
      initModal();
    }

    // Si les works ne sont pas encore chargés dans la modale, les charger
    if (!modalWorks) {
      refreshModalGallery();
    }

    // Toujours revenir à la vue galerie à l'ouverture
    switchView('gallery');

    // Afficher la modale (classe + ARIA)
    modal.classList.add('show');
    modal.removeAttribute('aria-hidden');
    modal.setAttribute('aria-modal', 'true');
    modal.style.display = 'block';
  }

  // ========== FERMER LA MODALE ==========
  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    modal.style.display = 'none';

    // Réinitialiser le formulaire si on était dans la vue ajout
    const form = document.getElementById('add-photo-form');
    if (form) form.reset();
  }

  // ========== RAFRAÎCHIR LA GALERIE DE LA MODALE ==========
  async function refreshModalGallery() {
    const galleryGrid = document.getElementById('modal-gallery-grid');
    if (!galleryGrid) return;

    // Récupérer les works (soit depuis la variable globale, soit depuis l'API)
    const works = await fetchData("http://localhost:5678/api/works");

    if (!works) {
      galleryGrid.innerHTML = '<p>Erreur de chargement</p>';
      return;
    }

    // Stocker les works pour éviter de refaire la requête
    modalWorks = works;

    // Vider et remplir la grille
    galleryGrid.innerHTML = '';

    for (let i = 0; i < works.length; i++) {
      const figure = document.createElement('figure');
      figure.className = 'modal-figure';
      figure.dataset.workId = works[i].id;

      const img = document.createElement('img');
      img.src = works[i].imageUrl;
      img.alt = works[i].title;

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-work';
      deleteBtn.dataset.id = works[i].id;
      deleteBtn.setAttribute('aria-label', `Supprimer ${works[i].title}`);
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
      deleteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteWork(this.dataset.id);
      });

      figure.appendChild(img);
      figure.appendChild(deleteBtn);
      galleryGrid.appendChild(figure);
    }
  }

  // ========== CONFIGURATION DE LA VUE GALERIE ==========
  function setupGalleryView(container) {
    // Créer la grille de miniatures
    const modalGallery = document.createElement('div');
    modalGallery.className = 'modal-gallery';
    modalGallery.id = 'modal-gallery-grid';
    container.appendChild(modalGallery);

    // Ligne de séparation
    const separator = document.createElement('hr');
    separator.className = 'modal-separator';
    container.appendChild(separator);

    // Bouton ajouter une photo
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-add-photo';
    addBtn.textContent = 'Ajouter une photo';
    addBtn.addEventListener('click', () => switchView('add'));
    container.appendChild(addBtn);
  }

  // ========== CONFIGURATION DE LA VUE AJOUT ==========
  function setupAddView(container) {
    // Formulaire d'ajout
    const form = document.createElement('form');
    form.className = 'add-photo-form';
    form.id = 'add-photo-form';

    // Zone de téléchargement d'image
    const uploadZone = document.createElement('div');
    uploadZone.className = 'upload-zone';
    uploadZone.innerHTML = `
      <i class="fa-regular fa-image"></i>
      <label for="photo-upload" class="upload-label">+ Ajouter photo</label>
      <input type="file" id="photo-upload" name="image" accept="image/jpg, image/png" style="display: none;">
      <p class="upload-info">jpg, png : 4mo max</p>
    `;
    form.appendChild(uploadZone);

    // Champ titre
    const titleGroup = document.createElement('div');
    titleGroup.className = 'form-group';
    titleGroup.innerHTML = `
      <label for="photo-title">Titre</label>
      <input type="text" id="photo-title" name="title" required>
    `;
    form.appendChild(titleGroup);

    // Champ catégorie
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'form-group';
    categoryGroup.innerHTML = `
      <label for="photo-category">Catégorie</label>
      <select id="photo-category" name="category" required>
        <option value="">-- Choisir une catégorie --</option>
      </select>
    `;
    form.appendChild(categoryGroup);

    // Ligne de séparation
    const separator = document.createElement('hr');
    separator.className = 'modal-separator';
    form.appendChild(separator);

    // Bouton valider
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn-validate';
    submitBtn.textContent = 'Valider';
    submitBtn.disabled = true;  // Désactivé par défaut
    form.appendChild(submitBtn);

    container.appendChild(form);

    // Charger les catégories dans le select
    loadCategories();
  }

  // ========== CHARGER LES CATÉGORIES DANS LE SELECT ==========
  async function loadCategories() {
    const select = document.getElementById('photo-category');
    if (!select) return;

    const cats = await fetchData("http://localhost:5678/api/categories");

    if (!cats) {
      console.error('Impossible de charger les catégories');
      return;
    }

    // Garder l'option par défaut et ajouter les catégories
    select.innerHTML = '<option value="">-- Choisir une catégorie --</option>';

    for (let i = 0; i < cats.length; i++) {
      const option = document.createElement('option');
      option.value = cats[i].id;
      option.textContent = cats[i].name;
      select.appendChild(option);
    }
  }

  // ========== SUPPRIMER UN WORK ==========
  async function deleteWork(id) {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      alert('Vous devez être connecté');
      return;
    }

    if (confirm('Voulez-vous vraiment supprimer ce projet ?')) {
      try {
        const res = await fetch(`http://localhost:5678/api/works/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          // Rafraîchir la galerie de la modale
          await refreshModalGallery();
          // Rafraîchir la galerie principale
          await getWorks();
        } else {
          alert(`Suppression impossible (HTTP ${res.status})`);
        }
      } catch (err) {
        console.error('Erreur suppression:', err);
        alert('Erreur lors de la suppression');
      }
    }
  }

  // ========== ÉVÉNEMENTS GLOBAUX ==========

  // Fermer avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });

  // Fermer au clic en dehors
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Connecter le bouton modifier
  const editBtn = document.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', openModal);
  }
}); // ✅ Fin du window.addEventListener("load")

console.log('Figures dans .gallery:', document.querySelectorAll('.gallery figure').length);
console.log('Contenu de .gallery:', document.querySelector('.gallery').innerHTML.substring(0, 200));





//1.	J’ai utilisé forEach au lieu de for (...) plus lisible.//
//	2.	J’ai supprimé setFigure et setFilter → directement intégrés là où on en a besoin (moins de fonctions dispersées).//
//3.	J’ai utilisé innerHTML pour la <figure> (rapide et court)-> API contrôlée, projet simple, pas d'événements//
//	4.	J’ai mis les await directement dans les appels initiaux pour bien enchaîner.//
