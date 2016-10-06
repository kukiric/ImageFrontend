var express = require("express");
var multer = require("multer");
var net = require("net");
var fs = require("fs");

var httpPort = 3000;
var sockPort = 3099;
var upload = multer({dest: "uploads/"});

var queue = [];

// Servidor HTTP (recenbe a imagem do cliente e armazena na fila)
var app = express();
app.use(express.static('public'));
app.post("/upload", upload.single("image"), function(request, response) {
    console.log("Upload recebido");
    // Verifica se algum arquivo foi enviado
    if (request.file) {
        console.log("Arquivo: ", request.file.path);
        response.sendStatus(200);
        fs.unlinkSync(request.file.path);
    }
    else {
        console.log("Arquivo: vazio ou inválido");
        response.sendStatus(400);
    }
    console.log();
});
app.listen(httpPort, function() {
    console.log("Servidor HTTP iniciado na porta " + httpPort);
});

// Servidor sockets (envia a primeira imagem da ao pedido do cliente)
var sender = net.createServer(function(socket) {
    var client = socket.remoteAddress + ":" + socket.remotePort;
    console.log("Cliente conectado: " + client);
    socket.on("end", function() {
        console.log("Cliente desconectou normalmente: " + client);
    });
    socket.on("error", function(error) {
        console.log("Cliente desconectou com erro: " + client + " (" + error.message + ")");
    });
    socket.on("data", function(data) {
        var command = data.toString().trim().toLowerCase();
        console.log("Recebido comando: \"" + command + "\"");
        switch (command) {
            case "ready":
                if (queue.length > 0) {
                    console.log("Enviando arquivo: " + queue[0]);
                    socket.write("Y");
                    var size = Buffer.alloc(4);
                    size.writeInt32LE(1024);
                    socket.write(size);
                }
                else {
                    console.log("Erro: fila vazia");
                    socket.write("N");
                }
                break;
            case "pop":
                if (queue.length > 0) {
                    console.log("Deletando arquivo: " + queue[0]);
                    fs.unlinkSync(queue[0]);
                    queue.shift();
                }
                else {
                    console.log("Erro: fila vazia");
                }
                break;
            case "quit":
                console.log("Desconectando o cliente por pedido");
                socket.end();
                break;
            default:
                console.log("Comando desconhecido ignorado");
                break;
        }
    });
})
sender.listen(sockPort, "0.0.0.0", function() {
    console.log("Servidor Sockets iniciado na porta " + sockPort)
});
