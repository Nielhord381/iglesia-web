// models/Documento.js
const mongoose = require('mongoose');

const documentoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  categoria: { 
    type: String, 
    enum: ['Varones', 'Dorcas', 'Jovenes', 'Coro', 'EBD', 'General'], 
    required: true 
  },
  tipoArchivo: { type: String }, // pdf, jpg, png, docx, etc.
  archivoURL: { type: String, required: true }, // URL pública de Cloudinary
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // quién lo subió
});

module.exports = mongoose.model('Documento', documentoSchema);
