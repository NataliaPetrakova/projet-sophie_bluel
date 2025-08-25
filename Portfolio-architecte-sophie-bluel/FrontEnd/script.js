async function getWorks(filter) {
  document.querySelector(".gallery").innerHTML = "";
  const url = "http://localhost:5678/api/works";

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    const works = await response.json();

    const list = filter ? works.filter(w => w.categoryId === filter) : works;
    for (let i = 0; i < list.length; i++) {
      setFigure(list[i]);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
  }
}

getWorks();

function setFigure(data) {
  const figure = document.createElement("figure");
  figure.innerHTML = `
    <img src="${data.imageUrl}" alt="${data.title}">
    <figcaption>${data.title}</figcaption>
  `;
  const gallery = document.querySelector(".gallery");
  if (gallery) gallery.appendChild(figure);
}

async function getCategories() {
    const API_URL = 'http://localhost:5678/api/categories';
    try {
        const response = await fetch(API_URL); 

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`); 
         } 
        
        const json = await response.json(); 
        console.log(json);
         for (let i = 0; i < json.length; i++) {
            setFilter(json[i]);
    } 

    } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
    }
}

getCategories ();

function setFilter(data) {
    console.log(data);
    const div = document.createElement("div"); 
    div.className = data.id;
    div.addEventListener("click", () => getWorks(data.id));
    div.innerHTML = `${data.name}`;
    document.querySelector(".div-categories").append(div);
} 

document.querySelector('#tous')
  .addEventListener('click', () => getWorks());
