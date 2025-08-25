// === 0. Configuración inicial ===
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('./config/cloudinary');
const User = require('./models/User');
const Documento = require('./models/Documento');

const validarToken = require('./middleware/auth');
const verificarRol = require('./middleware/role');

const app = express();
app.use(express.json());

// === 1. Conexión a MongoDB Atlas ===
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error de conexión:', err));

// === 2. Configuración Multer ===
const storage = multer.memoryStorage();
const upload = multer({ storage });

// === 3. Rutas ===

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express funcionando 🚀');
});

// Registro de usuario
app.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const existeUsuario = await User.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ error: 'El usuario ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new User({ nombre, email, password: hashedPassword });
    await nuevoUsuario.save();

    const token = jwt.sign(
      { userId: nuevoUsuario._id, rol: nuevoUsuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ mensaje: 'Usuario registrado con éxito', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login de usuario
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { userId: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ mensaje: 'Login exitoso', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta protegida de ejemplo
app.get('/ruta-protegida',
  validarToken,
  verificarRol(['miembro', 'editor', 'admin']),
  (req, res) => {
    res.json({ mensaje: 'Acceso concedido a ruta protegida', usuario: req.usuario });
  }
);

// === 4. Subida de archivos a Cloudinary (cualquier tipo) ===
app.post(
  '/upload',
  validarToken,
  verificarRol(['editor', 'admin']),
  upload.single('file'),
  async (req, res) => {
    try {
      const { titulo, descripcion, categoria } = req.body;

      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
      if (!titulo || !categoria) return res.status(400).json({ error: 'Título y categoría son obligatorios' });

      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'uploads',
        resource_type: resourceType
      });

      const nuevoDoc = new Documento({
        titulo,
        descripcion,
        categoria,
        tipoArchivo: resourceType,
        archivoURL: result.secure_url,
        subidoPor: req.usuario.userId
      });

      await nuevoDoc.save();

      res.json({ mensaje: 'Archivo subido y guardado', documento: nuevoDoc });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir archivo' });
    }
  }
);

// === 5. Listar documentos por categoría ===
app.get(
  '/documentos/:categoria',
  validarToken,
  verificarRol(['editor', 'admin']), // Aquí defines los roles que pueden listar
  async (req, res) => {
    try {
      const { categoria } = req.params;

      const documentos = await Documento.find({ categoria })
        .populate('subidoPor', 'nombre email');

      res.json({ documentos });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al listar documentos' });
    }
  }
);

// === 6. Levantar servidor ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
