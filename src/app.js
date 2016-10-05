let express = require("express");
let app = express();

const listenPort = 8080;

app.get("/", function(req, res) {
    res.setHeader("X-Greeting", "Hello World!");
    res.send("<h1>Hello Express!</h1>");
    res.end();
});

app.listen(listenPort, function() {
    console.log("Servidor iniciado na porta " + listenPort);
})
