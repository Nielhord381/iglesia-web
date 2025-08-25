const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { uploadPDF } = require("../controllers/uploadController");
const validarToken = require("../middleware/auth");
const verificarRol = require("../middleware/role");

// POST /upload/pdf -> solo editores o admins
router.post(
  "/pdf",
  validarToken,
  verificarRol(["editor", "admin"]),
  upload.single("file"),
  uploadPDF
);

module.exports = router;
