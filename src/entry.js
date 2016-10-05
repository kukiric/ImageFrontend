require("materialize-css/dist/css/materialize.css");

setLoaderVisible(false);

document.getElementById("submit").addEventListener("click", function() {
    setLoaderVisible(true);
});

document.getElementById("form").addEventListener("submit", function() {
    setLoaderVisible(false);
});
