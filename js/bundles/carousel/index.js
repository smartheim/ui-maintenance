import 'macro-carousel/dist/macro-carousel.js';
document.addEventListener("DOMContentLoaded", () => {
    var c = document.querySelectorAll("macro-carousel");
    for (var i = 0; i < c.length; ++i) c[i].update();
});
// https://github.com/ciampo/macro-carousel