document.addEventListener("DOMContentLoaded", () => { //plus réactif que LOAD//
    const API_URL = "http://localhost:5678/api"; 
    const LOGIN_URL = `${API_URL}/users/login`; 

    const loginForm = document.getElementById("loginForm"); //Récupèrationd du formulaire de connexion grâce à son ID//
    if (loginForm) {      // Si le formulaire existe, on lui ajoute un "écouteur d'événement"//
        loginForm.addEventListener("submit", handleSubmit); //Quand l'utilisateur soumet le formulaire (submit), on exécute la fonction handleSubmit//
    }

    async function handleSubmit(event) {  //Empêcher le comportement par défaut du formulaire (rechargement de page)//
        event.preventDefault();
        
        const errorMessage = document.getElementById("error-message"); //Récupère d'élément prévu pour afficher un message d'erreur//
        if (errorMessage) { // On cache le message d'erreur au début (au cas où il serait déjà affiché)//
            errorMessage.style.display = "none";
        }
        
        let user = {  //Création d'un objet "user" avec l'email et le mot de passe saisis par l'utilisateur//
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
        };
        
        let response = await fetch(LOGIN_URL, {
            method: "POST", //méthode HTTP//
            headers: {
                "Content-Type": "application/json", //Transformation d'objet "user" en JSON//
            },
            body: JSON.stringify(user),
        });
        
        if (response.status != 200) {         
            if (errorMessage) {
                errorMessage.style.display = "flex";
            }
        } else { //Si la connexion est réussie : on lit le JSON envoyé par le serveur//
            let result = await response.json();
            //console.log(result);//
            sessionStorage.setItem("authToken", result.token);  //Changé pour sessionStorage, utilisateur devra se reconnecter après fermeture du navigateur//
            window.location.href = "index.html";
        }
    }
});

//Formulaire fonctionnel (écoute submit, empêche le reload)//
//Redirection vers la page d’accueil quand la connexion est confirmée (window.location.href = "index.html")//
//Message d’erreur quand les identifiants sont faux (errorMessage.style.display = "flex" si status != 200)//
//Token d’authentification stocké (sessionStorage.setItem("authToken", result.token)), permet d’appeler les routes protégées (envois/suppressions)//