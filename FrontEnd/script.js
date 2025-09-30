// ========== FONCTION COMMUNE POUR FETCH (GLOBALE) ==========
async function fetchData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Erreur fetch ${url}:`, err);
    return null;
  }
}

window.addEventListener("load", async () => {
  const gallery = document.querySelector(".gallery");
  const categoriesDiv = document.querySelector(".div-categories");
  let figures = [];

  // ========== SÉCURISER LES CONTENEURS AU DÉMARRAGE ==========
  if (!gallery || !categoriesDiv) {
    console.error("Éléments .gallery ou .div-categories introuvables");
    return;
  }

  // ========== RÉCUPÈRE ET AFFICHE LES PROJETS ==========
  async function getWorks() {
    const works = await fetchData("http://localhost:5678/api/works");
    
    if (!works) {
      gallery.innerHTML = "<p class='error'>Impossible de charger les images</p>";
      return;
    }
    
    gallery.innerHTML = "";
    
    // Utiliser for au lieu de forEach
    for (let i = 0; i < works.length; i++) {
      const figure = document.createElement("figure");
      figure.dataset.catId = works[i].categoryId;
      figure.innerHTML = `
        <img src="${works[i].imageUrl}" alt="${works[i].title}">
        <figcaption>${works[i].title}</figcaption>
      `;
      gallery.append(figure);
    }
    
    // Mise à jour du tableau figures
    figures = Array.from(gallery.querySelectorAll("figure"));
  }

  // ========== FILTRAGE (avec classList.toggle) ==========
  function applyFilter(id) {
    // Utiliser for et classList.toggle 
    for (let i = 0; i < figures.length; i++) {
      const show = !id || figures[i].dataset.catId == id;
      figures[i].classList.toggle("is-hidden", !show);
    }
  }

  // ========== RÉCUPÈRE ET AFFICHE LES CATÉGORIES ==========
  async function getCategories() {
    const cats = await fetchData("http://localhost:5678/api/categories");
    
    if (!cats) {
      categoriesDiv.innerHTML = "<p class='error'>Impossible de charger les catégories</p>";
      return;
    }
    
    categoriesDiv.innerHTML = '';
    
    // Créer le bouton "Tous"
    const btnTous = document.createElement('button');
    btnTous.type = 'button'; // AJOUT : type="button"
    btnTous.className = 'filter is-active';
    btnTous.textContent = 'Tous';
    btnTous.dataset.catId = '';
    btnTous.setAttribute('aria-pressed', 'true');
    categoriesDiv.appendChild(btnTous);
    
    // Créer les autres boutons avec for
    for (let i = 0; i < cats.length; i++) {
      const btn = document.createElement('button');
      btn.type = 'button'; // AJOUT : type="button"
      btn.className = 'filter';
      btn.textContent = cats[i].name;
      btn.dataset.catId = cats[i].id;
      btn.setAttribute('aria-pressed', 'false');
      categoriesDiv.appendChild(btn);
    }
    
    // Récupérer tous les boutons créés
    const allButtons = categoriesDiv.querySelectorAll('.filter');
    
    // Attacher les événements avec for
    for (let i = 0; i < allButtons.length; i++) {
      allButtons[i].addEventListener('click', function() {
        // Appliquer le filtre
        applyFilter(allButtons[i].dataset.catId);
        
        // Désactiver tous les boutons avec for
        for (let j = 0; j < allButtons.length; j++) {
          allButtons[j].classList.remove('is-active');
          allButtons[j].setAttribute('aria-pressed', 'false');
        }
        
        // Activer celui cliqué
        allButtons[i].classList.add('is-active');
        allButtons[i].setAttribute('aria-pressed', 'true');
      });
    }
  }

  // ========== APPELS INITIAUX ==========
  await getWorks();
  await getCategories();

  // ========== GESTION DE LA MODALE ==========
  
  // Variables de la modale
  const modal = document.getElementById('modal');
  const modalWrapper = modal?.querySelector('.modal-wrapper');
  
  // ========== VÉRIFIER L'EXISTENCE DE LA MODALE DANS LE DOM ==========
  if (!modal || !modalWrapper) {
    console.error("Structure de modale manquante (#modal/.modal-wrapper)");
    return;
  }
  
  // Fonction pour ouvrir la modale
  function openModal() {
    loadGalleryView();
    modal.classList.add('show');
  }
  
  // Fonction pour fermer la modale
  function closeModal() {
    modal.classList.remove('show');
  }
  
  // ========== FERMER LA MODALE AVEC ESCAPE ==========
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
  
  // Charger la vue galerie
  async function loadGalleryView() {
    // Récupérer les works
    const works = await fetchData("http://localhost:5678/api/works");
    
    if (!works) {
      modalWrapper.innerHTML = '<p>Erreur de chargement</p>';
      return;
    }
    
    // Vider et structurer la modale
    modalWrapper.innerHTML = '';
    
    // Bouton fermer
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Fermer la modale');
    closeBtn.addEventListener('click', closeModal);
    modalWrapper.appendChild(closeBtn);
    
    // Titre
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = 'Galerie photo';
    modalWrapper.appendChild(title);
    
    // Créer la div pour la galerie (comme .gallery sur la page principale)
    const modalGallery = document.createElement('div');
    modalGallery.className = 'modal-gallery';
    modalWrapper.appendChild(modalGallery);
    
    // Générer les miniatures - MÊME LOGIQUE que la galerie principale
    for (let i = 0; i < works.length; i++) {
      // Créer une figure comme dans la galerie principale
      const figure = document.createElement('figure');
      figure.className = 'modal-figure';
      figure.dataset.workId = works[i].id;
      
      // Image
      const img = document.createElement('img');
      img.src = works[i].imageUrl;
      img.alt = works[i].title;
      
      // Bouton supprimer (icône poubelle)
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-work';
      deleteBtn.dataset.id = works[i].id;
      deleteBtn.setAttribute('aria-label', `Supprimer ${works[i].title}`);
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Empêcher la propagation
        deleteWork(this.dataset.id);
      });
      
      // Assembler
      figure.appendChild(img);
      figure.appendChild(deleteBtn);
      modalGallery.appendChild(figure);
    }
    
    // Ligne de séparation
    const separator = document.createElement('hr');
    separator.className = 'modal-separator';
    modalWrapper.appendChild(separator);
    
    // Bouton ajouter une photo
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-add-photo';
    addBtn.textContent = 'Ajouter une photo';
    modalWrapper.appendChild(addBtn);
    
    // Log pour debug
    console.log(`Galerie modale chargée avec ${works.length} projets`);
  }
  
  // Fonction pour supprimer un work
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
          // ========== RAFRAÎCHIR SANS RECHARGER LA PAGE ==========
          await loadGalleryView(); // Rafraîchir la modale
          await getWorks(); // Rafraîchir la galerie principale
          // Plus besoin de location.reload()
        } else {
          alert(`Suppression impossible (HTTP ${res.status})`);
        }
      } catch (err) {
        console.error('Erreur suppression:', err);
        alert('Erreur lors de la suppression');
      }
    }
  }
  
  // Fermer au clic en dehors
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Connecter le bouton modifier
  const editBtn = document.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', openModal);
  }

}); // Fin du window.addEventListener("load")

// ========== GESTION DU MODE ADMIN (en dehors du load) ==========
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

displayAdminMode();





//1.	J’ai utilisé forEach au lieu de for (...) plus lisible.//
//	2.	J’ai supprimé setFigure et setFilter → directement intégrés là où on en a besoin (moins de fonctions dispersées).//
//3.	J’ai utilisé innerHTML pour la <figure> (rapide et court)-> API contrôlée, projet simple, pas d'événements//
//	4.	J’ai mis les await directement dans les appels initiaux pour bien enchaîner.//
