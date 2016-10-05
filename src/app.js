let express = require("express");
let multer = require("multer");

const listenPort = 8080;
const upload = multer({storage: multer.memoryStorage()});
const app = express();

app.use(express.static('public'));

app.post("/upload", upload.single("image"), function(req, res) {
    console.log(req.file);
    if (req.file) { 
        res.sendStatus(200);
    }
    else {
        res.sendStatus(400);
    }
});

app.listen(listenPort, function() {
    console.log("Servidor iniciado na porta " + listenPort);
});
