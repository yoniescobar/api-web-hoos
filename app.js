const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise'); // Importa el módulo mysql2/promise

const app = express();
const PORT = 3000;

const API_URL = 'https://jsonplaceholder.typicode.com/users';
const INTERVAL_SECONDS = 10;

let previousData;

// Configuración de la conexión a la base de datos MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '12003906',
    database: 'db_usuarios',
};

// Función para realizar la solicitud a la API externa
async function fetchData() {
    try {
        const response = await axios.get(API_URL);

        // Extraer las propiedades name, email y phone de todos los elementos en la respuesta
        const extractedData = response.data.map(({ name, email, phone }) => ({ name, email, phone }));

        // Mostrar solo name, email y phone de todos los elementos en la consola
        extractedData.forEach(({ name, email, phone }) => {
            console.log('Nombre:', name);
            console.log('Email:', email);
            console.log('Phone:', phone);
        });

        // Devolver el array con objetos que contienen name, email y phone
        return extractedData;
    } catch (error) {
        console.error('Error al obtener datos de la API:', error.message);
        throw error;
    }
}



// Función para establecer la conexión a la base de datos
async function conectarBaseDeDatos() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        throw error;
    }
}

// Función para guardar datos en la base de datos MySQL
async function guardarDatosEnBaseDeDatos(data) {
    const connection = await conectarBaseDeDatos();

    try {
        // Realizar la operación de inserción en la base de datos
        const [result] = await connection.query(
            'INSERT INTO usuarios (name,email,phone) VALUES (?, ?, ?)',
            [data.name, data.email, data.phone]
        );
        console.log('Datos a insertar:', data.name, data.email, data.phone);

        console.log('Datos insertados en la base de datos:', result);
    } catch (error) {
        console.error('Error al guardar datos en la base de datos:', error.message);
    } finally {
        await connection.end(); // Cierra la conexión a la base de datos
    }
}

// Función para monitorear cambios en la API y responder con acciones específicas
async function monitorChanges() {
    try {
        const currentData = await fetchData();

        // Compara los datos actuales con los datos anteriores
        if (JSON.stringify(currentData) !== JSON.stringify(previousData)) {
            console.log('Se detectaron cambios en la API.');

            // Itera sobre los elementos en currentData y guarda cada uno en la base de datos
            for (const userData of currentData) {
                await guardarDatosEnBaseDeDatos(userData);
            }

            previousData = currentData; // Actualiza los datos anteriores
        }
    } catch (error) {
        console.error('Error al monitorear cambios:', error.message);
    } finally {
        setTimeout(monitorChanges, INTERVAL_SECONDS * 1000); // Configura el siguiente monitoreo después de un intervalo
    }
}

// Ruta para obtener los datos actuales desde el navegador
app.get('/currentData', async (req, res) => {
    try {
        const currentData = await fetchData();
        res.json(currentData);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos actuales.' });
    }
});

// Inicia el servidor y el monitoreo de cambios
app.listen(PORT, () => {
    console.log(`El demonio está escuchando en http://localhost:${PORT}`);
    monitorChanges(); // Inicia el monitoreo de cambios.
});
