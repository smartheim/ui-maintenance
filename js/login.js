import { openhabLoginOK, nav, openhabHost } from './app.js';

function prepareLoginForm() {
    var inputHost = document.getElementById('inputHost');
    if (!inputHost) return;
    
    console.log("loaded input");
    inputHost.value = openhabHost();
    openhabLoginOK().then(() => nav.go("index.html")).catch(e => {
        if (e == "404") // host not correct
        inputHost.classList.add("text-danger");
        else if (e == "crossorigin") {
            document.getElementById("crossorigin").classList.remove("d-none");
        }
        else { // auth error
            document.getElementsByClassName("credentials").forEach(element => element.classList.remove("d-none") ); 
            document.getElementsByClassName("hostonly").forEach(element => element.classList.add("d-none") ); 
        }
    });
    document.getElementById('loginform').addEventListener("submit", event => {
        event.preventDefault();
        localStorage.setItem("host", new FormData(event.target).get("host"));
        nav.go("index.html");
    })
}

document.addEventListener("DOMContentLoaded", prepareLoginForm);