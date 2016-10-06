var express = require("express");
var multer = require("multer");
var net = require("net");
var fs = require("fs");

var httpPort = 3000;
var sockPort = 3099;
var upload = multer({dest: "uploads/"});

// Servidor HTTP (recenbe a imagem do cliente e armazena na fila)
var app = express();
app.use(express.static('public'));
app.post("/upload", upload.single("image"), function(request, response) {
    console.log(request.file);
    if (request.file) { 
        response.sendStatus(200);
        fs.unlinkSync(request.file.path);
    }
    else {
        response.sendStatus(400);
    }
});
app.listen(httpPort, function() {
    console.log("Servidor HTTP iniciado na porta " + httpPort);
});

// Servidor sockets (envia a primeira imagem da ao pedido do cliente)
var sender = net.createServer(function(socket) {
    socket.on("data", function(data) {
        var command = data.toString().trim().toLowerCase();
        switch (command) {
            case "ready":
                socket.write("Enviando a primeira imagem...");
                break;
            case "pop":
                socket.write("Deletando a primeira imagem...");
                break;
            case "quit":
                socket.write("Terminando a conexão...");
                socket.end();
                break;
        }
    });
})
sender.listen(sockPort, function() {
    console.log("Servidor Sockets iniciado na porta " + sockPort)
});
