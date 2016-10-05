let express = require("express");
let multer = require("multer");

const listenPort = 8080;
const upload = multer({storage: multer.memoryStorage()});
const app = express();

app.use(express.static('public'));

app.post("/upload", upload.single("image"), function(req, res) {
    console.log(req.file);
    res.sendStatus(200);
});

app.listen(listenPort, function() {
    console.log("Servidor iniciado na porta " + listenPort);
});
