var express = require("express");
var multer = require("multer");
var session = require("express-session");
var rightPad = require("right-pad");
var leftPad = require("left-pad");
var net = require("net");
var fs = require("fs");

var httpPort = 3000;
var sockPort = 3099;
var upload = multer({dest: "uploads/"});

var queue = [];
var password;

function log(message) {
    var date = new Date();
    var timestamp = leftPad(date.getHours(), 2, '0')
            + ":" + leftPad(date.getMinutes(), 2, '0')
            + ":" + leftPad(date.getSeconds(), 2, '0')
            + "." + leftPad(date.getMilliseconds(), 3, '0');
    console.log("[" + timestamp + "] " + message);
}

// Gera uma senha aleatória de 6 digitos
function createPassword() {
    var num = Math.random().toString().substr(2, 6);
    return rightPad(num, 6, "0");
}

// Servidor HTTP (recenbe a imagem do cliente e armazena na fila)
var app = express();
app.use(express.static('public'));
app.use(session({secret: createPassword(), path: "sessions/", maxAge: 60 * 60 * 1000, secure: false}));
app.post("/upload", upload.single("image"), function(request, response) {
    log("Upload recebido");
    // Checa a senha de upload
    if (request.session.password === password) {
        // Verifica se algum arquivo foi enviado
        if (request.file) {
            log("Salvo: \"" + request.file.path + "\"");
            // Adiciona o arquivo na fila de processamento
            queue.push(request.file.path);
            // Informa o cliente do sucesso
            response.status(200).redirect("/success.html");
            // Gera uma nova senha para envio
            password = createPassword();
            log("Nova senha gerada: " + password);
        }
        else {
            log("Erro: arquivo vazio ou inválido");
            response.status(400).redirect("/error.html");
        }
    }
    else {
        log("Erro: o cliente enviou uma senha antiga ou inválida");
        response.redirect("/error.html");
        fs.unlinkSync(request.file.path);
    }
    log();
});

// Página que requere a senha na url como parâmetro
app.get("/", function(request, response) {
    var queryPass = request.query.pass;
	log("Senha recebida: " + queryPass);
    if (queryPass == password) {
        log("Senha correta, redirecionando para o formulário");
        request.session.password = password;
		response.redirect("/form.html");
	} else {
		log("Senha incorreta, cancelando redirecionamento");
        response.redirect("/error.html");
	}
});

app.listen(httpPort, function() {
    log("Servidor HTTP iniciado na porta " + httpPort);
});

// Servidor sockets (envia a primeira imagem da ao pedido do cliente)
var sender = net.createServer(function(socket) {
    var client = socket.remoteAddress + ":" + socket.remotePort;
    log("Cliente conectado: " + client);
    socket.on("end", function() {
        log("Cliente desconectou normalmente: " + client);
    });
    socket.on("error", function(error) {
        log("Cliente desconectou com erro: " + client + " (" + error.message + ")");
    });
    socket.on("data", function(data) {
        var command = data.toString().trim().toLowerCase();
        log("Recebido comando: \"" + command + "\"");
        switch (command) {
            case "get":
                // Baixa o primeiro arquivo da fila
                // Buffer usado para alocar exatamente 4 bytes (int32_t) para o tamanho do arquivo
                var sizeBuffer = Buffer.alloc(4);
                var fileSent = false;
                // Tenta todos os arquivos até achar um válido (normalmente o primeiro)
                while (!fileSent) {
                    if (queue.length > 0) {
                        var path = queue[0];
                        try {
                            var size = fs.statSync(path).size;
                            log("Enviando arquivo: \"" + path + "\"");
                            // Envia o tamanho do arquivo seguido dos dados
                            sizeBuffer.writeInt32LE(size);
                            var contents = fs.readFileSync(path);
                            // Garante a saída do loop mesmo se houver erro durante a escrita no socket
                            fileSent = true;
                            socket.write(sizeBuffer);
                            socket.write(contents);
                            break;
                        }
                        catch (error) {
                            log("Aviso: não foi possível abrir o arquivo: \"", path, "\", tentando o próximo");
                            queue.shift();
                        }
                    }
                    else {
                        log("Erro: fila vazia");
                        // Envia um tamanho negativo como erro
                        sizeBuffer.writeInt32LE(-1);
                        socket.write(sizeBuffer);
                        break;
                    }
                }
                break;
            case "pop":
                // Remove o primeiro arquivo da fila
                if (queue.length > 0) {
                    var path = queue[0];
                    log("Deletando arquivo: " + path);
                    fs.unlinkSync(path);
                    queue.shift();
                }
                else {
                    log("Erro: fila vazia");
                }
                break;
            case "count":
                // Retorna o número de arquivos na fila
                log("Contagem de elementos: " + queue.length);
                var countBuffer = Buffer.alloc(4);
                countBuffer.writeInt32LE(queue.length);
                socket.write(countBuffer);
                break;
            case "password":
                // Retorna a senha necessária para o upload da próxima imagem
                log("Imprimindo senha de upload...");
                socket.write(password);
                break;
            case "quit":
                // Desconecta o cliente
                log("Desconectando o cliente por pedido");
                socket.end();
                break;
            default:
                log("Comando desconhecido ignorado");
                break;
        }
    });
})
sender.listen(sockPort, "0.0.0.0", function() {
    log("Servidor Sockets iniciado na porta " + sockPort)
});

// Cria uma senha para envio
password = createPassword();
log("Senha de upload: " + password);

// Adiciona os arquivos restantes da pasta de uploads à fila
fs.readdir("uploads/", function(error, files) {
    if (error) {
        log("Aviso: não foi possível abrir pasta de uploads para indexação");
        return;
    }
    for (i in files) {
        queue.push("uploads/" + files[i]);
    }
});
