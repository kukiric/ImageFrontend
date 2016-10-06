require("materialize-css/dist/css/materialize.css");

setLoaderVisible(false);

document.getElementById("submit").addEventListener("click", function() {
    setLoaderVisible(true);
});

window.addEventListener("pagehide", function() {
    setLoaderVisible(false);
});
