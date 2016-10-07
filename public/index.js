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

function setSubmitEnabled(state) {
    $("#submit").prop("disabled", !state);
}

function getSelectedImage() {
    return $("#image").get(0).files[0];
}

function validateForm() {
    var image = getSelectedImage();
    setSubmitEnabled(image != undefined);
}

$("#image").on("change", validateForm);

$("#submit").on("click", function() {
    setLoaderVisible(true);
});

$(window).on("pagehide", function() {
    setLoaderVisible(false);
});

validateForm();
