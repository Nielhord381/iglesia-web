const cloudinary = require("../config/cloudinary");

const uploadPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo" });

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: "raw", // PDF, DOC, ZIP, etc.
      folder: "uploads"
    });

    res.json({
      public_id: result.public_id,
      url: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadPDF };
