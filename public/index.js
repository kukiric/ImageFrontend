function setLoaderVisible(state) {
    var loader = $("#loader");
    var content = $("#content");
    if (state) { 
        content.addClass("hidden");
        loader.removeClass("hidden");
    }
    else {
        loader.addClass("hidden");
        content.removeClass("hidden");
    }
}

function preview(event) {
    var img = $("#preview").get(0);
    var file = event.files[0];
    var url = URL.createObjectURL(file);
    img.src = url;
}

$("#image").on("change", function() {
    preview($(this).get(0));
});

$("#submit").on("click", function() {
    setLoaderVisible(true);
});

$(window).on("pagehide", function() {
    setLoaderVisible(false);
});

setLoaderVisible(false);
