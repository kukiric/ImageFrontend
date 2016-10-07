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

function getQueryParam(key) {
    var query = window.location.search;
    if (query) {
        var regex = new RegExp(key + "=([^&]*)");
        var result = regex.exec(query);
        if (result) {
            return result[1];
        }
    }
    return undefined;
}

function validateForm() {
    var image = getSelectedImage();
    var password = $("#secret").val();
    setSubmitEnabled(image != undefined && password.length == 6);
}

$("#secret").on("input", validateForm);

$("#image").on("change", validateForm);

$("#submit").on("click", function() {
    setLoaderVisible(true);
});

$(window).on("pagehide", function() {
    setLoaderVisible(false);
});

validateForm();

switch (parseInt(getQueryParam("status"))) {
    // Sucesso
    case 0:
        $("#message").text("Imagem enviada com sucesso");
        break;
    // Falha
    case 1:
        $("#message").text("Erro no envio da imagem");
        break;
    case 2:
        $("#message").text("Senha de envio incorreta");
        break;
    // Nada
    default:
        $("#message").text("");
        break;
}
