window.addEventListener("load", async () => { //Attend que TOUTE la page soit chargée (HTML, CSS, images)//
  const gallery = document.querySelector(".gallery"); //Récupère l'élément HTML avec la classe "gallery" où seront affichés les projets//
  const categoriesDiv = document.querySelector(".div-categories"); //idem avec la classe "div-categories" où seront affichés les boutons de filtrage//
  let figures = []; // stockera les <figure> pour éviter les querySelectorAll répétés et recherche dans le DOM à chaque fois//

  // Récupère et affiche les projets
  async function getWorks() {
    try {
      const res = await fetch("http://localhost:5678/api/works"); //Fait une requête HTTP GET à l'API pour récupérer les projets//
      const works = await res.json();
      gallery.innerHTML = ""; //Vide la galerie avant d'ajouter les nouveax//

      works.forEach(w => {
        const figure = document.createElement("figure");
        figure.dataset.catId = w.categoryId; //Ajoute un attribut data-cat-id à la figure avec l'ID de catégorie (sera utilisé pour le filtrage)//
        figure.innerHTML = `
          <img src="${w.imageUrl}" alt="${w.title}">
          <figcaption>${w.title}</figcaption>
        `;
        gallery.append(figure);
      });

      // mise à jour de la liste des figures
      figures = Array.from(gallery.querySelectorAll("figure"));

    } catch (err) {
      console.error("Erreur works:", err);
      gallery.innerHTML = "<p class='error'>Impossible de charger les images</p>";
    }
  }

  // Filtrage (utilise figures déjà stockées)
  function applyFilter(id) { //Fonction qui filtre l'affichage selon la catégorie (id)//
    figures.forEach(f => { //Pour chaque figure stockée dans tableau//
      if (!id || f.dataset.catId == id) { //SI pas d'id (afficher tout) OU si la catégorie de la figure correspond à l'id demandé//
        f.classList.remove("is-hidden"); //Retire la classe "is-hidden" pour afficher la figure//
      } else { //SINON (la figure ne correspond pas au filtre)//
        f.classList.add("is-hidden"); //Ajoute la classe "is-hidden" pour cacher la figure//
      }
    });
  }

  // Récupère et affiche les catégories
  async function getCategories() {
    try {
      const res = await fetch("http://localhost:5678/api/categories");
      const cats = await res.json();

      // construit tout le HTML
      const buttonsHtml =
              `<button class="filter is-active" data-cat-id="" aria-pressed="true">Tous</button>` + // // "Tous" avec classe "is-active" PAR DÉFAUT//
        cats.map(c => `<button class="filter" data-cat-id="${c.id}" aria-pressed="false">${c.name}</button>`).join("");

      categoriesDiv.innerHTML = buttonsHtml; //Injecte tous les boutons d'un coup dans le DOM//

      // sélectionne les boutons
      const buttons = categoriesDiv.querySelectorAll(".filter"); //Récupère tous les boutons créés//
      buttons.forEach(btn => {
        btn.addEventListener("click", () => {
          applyFilter(btn.dataset.catId); //Au clique, applique le filtre avec l'id de catégorie du bouton//

       // Retire la classe active de tous les boutons
        buttons.forEach(b => {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });

        // Ajoute la classe active au bouton cliqué
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
      });
    });

    } catch (err) {
      console.error("Erreur categories:", err);
      categoriesDiv.innerHTML = "<p class='error'>Impossible de charger les catégories</p>";
    }
  }

  await getWorks();
  await getCategories();

  
  // Récupérer le bouton modifier
  const editBtn = document.querySelector('.edit-btn');
  console.log("Bouton trouvé:", editBtn); // Pour débugger
  
  if (editBtn) {
    editBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log("Clic sur modifier !"); // Pour débugger
      
      // Créer et ouvrir la modale
      openModal();
    });
  }


// Fonction pour créer/ouvrir la modale
// Fonction pour ouvrir la modale avec la galerie
async function openModal() {
  // Vérifier si elle existe déjà
  let modal = document.getElementById('modal');
  
  if (!modal) {
    // Créer la modale
    modal = document.createElement('div');
    modal.id = 'modal';
  
    
    document.body.appendChild(modal);
    
    // Fermer au clic en dehors
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Charger et afficher la galerie
  await loadGalleryView();
  modal.style.display = 'flex';
}

// Charger la vue galerie
async function loadGalleryView() {
  try {
    // Récupérer les projets
    const response = await fetch("http://localhost:5678/api/works");
    const works = await response.json();
    
    // Injecter le contenu
    const content = document.querySelector('.modal-content');
  

    
    // Attacher les événements
    document.querySelector('.close-btn').addEventListener('click', () => {
      document.getElementById('modal').style.display = 'none';
    });
    
    // Pour l'instant, log au clic sur supprimer
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Supprimer:', btn.dataset.id);
      });
    });
    
  } catch (error) {
    console.error('Erreur chargement galerie:', error);
  }
}
}); 


function displayAdminMode() {
  const token = sessionStorage.getItem("authToken"); //Récupère le token d'authentification depuis sessionStorage (null si pas connecté)//
  const authLink = document.getElementById("authLink"); //Recherche le lien de connexion par ID)
  if (!authLink) {
  console.error("authLink introuvable - vérifier le HTML");
  return;
}
  if (token) { //si utilisateur connecté//
    document.body.classList.add("is-admin"); //Ajoute la classe "is-admin" au body CSS//

    if (!document.querySelector(".topbar")) { //Si admin n'existe pas//
      const bar = document.createElement("div");
      bar.className = "topbar";
      bar.innerHTML = `<i class="fa-regular fa-pen-to-square"></i> Mode édition`;
      document.body.prepend(bar);
    }

    if (authLink) {
      authLink.innerText = "logout";
      authLink.href = "#"; //Change le texte du lien en "logout" + empêche la navigation//
      authLink.onclick = (e) => { //Au clic : empêche l'action par défaut, supprime le token, et rappelle displayAdminMode() pour rafraîchir l'interface//
        e.preventDefault();
        sessionStorage.removeItem("authToken");
        displayAdminMode();
      };
    }
  } else { //SINON (pas de token, utilisateur non connecté)//
    document.body.classList.remove("is-admin"); //retire la classe "is admin"//
    document.querySelector(".topbar")?.remove();

    if (authLink) {
      authLink.innerText = "login"; //Remet le lien en mode "login" avec redirection vers login.html//
      authLink.href = "login.html";
      authLink.onclick = null;
    }
  }
}

displayAdminMode(); //Appelle au charegement de la page//





//1.	J’ai utilisé forEach au lieu de for (...) plus lisible.//
//	2.	J’ai supprimé setFigure et setFilter → directement intégrés là où on en a besoin (moins de fonctions dispersées).//
//3.	J’ai utilisé innerHTML pour la <figure> (rapide et court)-> API contrôlée, projet simple, pas d'événements//
//	4.	J’ai mis les await directement dans les appels initiaux pour bien enchaîner.//
