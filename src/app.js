var express = require("express");
var multer = require("multer");
var session = require("express-session");
var rightPad = require("right-pad");
var net = require("net");
var fs = require("fs");

var httpPort = 3000;
var sockPort = 3099;
var upload = multer({dest: "uploads/"});

var queue = [];
var password;

// Gera uma senha aleatória de 6 digitos
function createPassword() {
    var num = Math.random().toString().substr(2, 6);
    return rightPad(num, 6, "0");
}

// Servidor HTTP (recenbe a imagem do cliente e armazena na fila)
var app = express();
app.use(express.static('public'));
app.use(session({secret: createPassword(), path: "/sessions", maxAge: 5 * 1000, secure: false}));
app.post("/upload", upload.single("image"), function(request, response) {
    console.log("Upload recebido");
    // Checa a senha de upload
    if (request.session.password === password) {
        // Verifica se algum arquivo foi enviado
        if (request.file) {
            console.log("Salvo: \"" + request.file.path + "\"");
            // Adiciona o arquivo na fila de processamento
            queue.push(request.file.path);
            // Informa o cliente do sucesso
            response.status(200).redirect("/success.html");
            // Gera uma nova senha para envio
            password = createPassword();
            console.log("Nova senha gerada: " + password);
        }
        else {
            console.log("Erro: arquivo vazio ou inválido");
            response.status(400).redirect("/error.html");
        }
    }
    else {
        console.log("Erro: o cliente enviou uma senha antiga ou inválida");
        response.redirect("/error.html");
        fs.unlinkSync(request.file.path);
    }
    console.log();
});

// Página que requere a senha na url como parâmetro
app.get("/", function(request, response) {
    var queryPass = request.query.pass;
	console.log("Senha recebida: " + queryPass);
    if (queryPass == password) {
        console.log("Senha correta, redirecionando para o formulário");
        request.session.password = password;
		response.redirect("/form.html");
	} else {
		console.log("Senha incorreta, cancelando redirecionamento");
        response.redirect("/error.html");
	}
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
            case "get":
                // Baixa o primeiro arquivo da fila
                // Buffer usado para alocar exatamente 4 bytes (int32_t) para o tamanho do arquivo
                var sizeBuffer = Buffer.alloc(4);
                if (queue.length > 0) {
                    var path = queue[0];
                    var size = fs.statSync(path).size;
                    console.log("Enviando arquivo: \"" + path + "\"");
                    // Envia o tamanho do arquivo seguido dos dados
                    sizeBuffer.writeInt32LE(size);
                    socket.write(sizeBuffer);
                    var stream = fs.createReadStream(path);
                    stream.on("readable", function() {
                        while (true) {
                            // Separa o arquivo em pedaços de 16 MiB
                            var chunk = stream.read(16 * 1024 * 1024);
                            if (chunk) {
                                socket.write(chunk);
                            }
                            else {
                                break;
                            }
                        }
                    });
                }
                else {
                    console.log("Erro: fila vazia");
                    // Envia um tamanho negativo como erro
                    sizeBuffer.writeInt32LE(-1);
                    socket.write(sizeBuffer);
                }
                break;
            case "pop":
                // Remove o primeiro arquivo da fila
                if (queue.length > 0) {
                    var path = queue[0];
                    console.log("Deletando arquivo: " + path);
                    fs.unlinkSync(path);
                    queue.shift();
                }
                else {
                    console.log("Erro: fila vazia");
                }
                break;
            case "count":
                // Retorna o número de arquivos na fila
                console.log("Contagem de elementos: " + queue.length);
                var countBuffer = Buffer.alloc(4);
                countBuffer.writeInt32LE(queue.length);
                socket.write(countBuffer);
                break;
            case "password":
                // Retorna a senha necessária para o upload da próxima imagem
                console.log("Imprimindo senha de upload...");
                socket.write(password);
                break;
            case "quit":
                // Desconecta o cliente
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

// Cria uma senha para envio
password = createPassword();
console.log("Senha de upload: " + password);

// Adiciona os arquivos restantes da pasta de uploads à fila
fs.readdir("uploads/", function(error, files) {
    if (error) {
        console.log("Aviso: não foi possível abrir pasta de uploads para indexação");
        return;
    }
    for (i in files) {
        queue.push("uploads/" + files[i]);
    }
});
