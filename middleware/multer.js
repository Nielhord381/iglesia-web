const multer = require("multer");

// Usar memoria para no guardar en disco
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
