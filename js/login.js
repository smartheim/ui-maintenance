import { nav, openhabHost, checkLogin } from './app.js';

function prepare(inputHost, loginform) {
    inputHost.value = openhabHost();
    document.getElementById("crossorigin").classList.add("d-none");
    loginform.querySelectorAll(".credentials").forEach(element => element.classList.add("d-none"));
    loginform.querySelectorAll(".hostonly").forEach(element => element.classList.remove("d-none"));
    return checkLogin().catch(e => {
        if (e.message == "404") // host not correct
            inputHost.classList.add("text-danger");
        else if (e.message == "crossorigin") {
            document.getElementById("crossorigin").classList.remove("d-none");
        }
        else { // auth error
            console.log(e);
            loginform.querySelectorAll(".credentials").forEach(element => element.classList.remove("d-none"));
            loginform.querySelectorAll(".hostonly").forEach(element => element.classList.add("d-none"));
        }
        throw e;
    });
}

function prepareLoginForm() {
    const inputHost = document.getElementById('inputHost');
    const loginform = document.getElementById('loginform');
    if (!inputHost || !loginform) return;
    loginform.addEventListener("submit", event => {
        event.preventDefault();
        localStorage.setItem("host", new FormData(event.target).get("host"));
        prepare(inputHost, loginform).then(() => nav.go("index.html")).catch(() => { });
    });
    prepare(inputHost, loginform).catch(() => { });
}

document.addEventListener("DOMContentLoaded", () => prepareLoginForm());
if (['interactive', 'complete'].includes(document.readyState)) prepareLoginForm();
