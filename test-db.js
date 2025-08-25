// test-db.js
require('dotenv').config();
const mongoose = require('mongoose');

async function conectarDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Conexión exitosa a MongoDB Atlas');
        process.exit(0); // Cierra el proceso
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        process.exit(1); // Sale con error
    }
}

conectarDB();
