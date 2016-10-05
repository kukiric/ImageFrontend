let express = require("express");
let multer = require("multer");
let fs = require("fs");

const listenPort = 8080;
const upload = multer({dest: "uploads/"});
const app = express();

app.use(express.static('public'));

app.post("/upload", upload.single("image"), function(req, res) {
    console.log(req.file);
    if (req.file) { 
        res.sendStatus(200);
        fs.unlinkSync(req.file.path);
    }
    else {
        res.sendStatus(400);
    }
});

app.listen(listenPort, function() {
    console.log("Servidor iniciado na porta " + listenPort);
});
