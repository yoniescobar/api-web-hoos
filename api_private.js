const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

const API_BASE_URL = 'https://api.privada.com';
const API_ENDPOINT = '/users';
const API_KEY = 'tu_llave_secreta';  // Reemplaza con tu llave secreta

const INTERVAL_SECONDS = 60;
let previousData;

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '12003906',
    database: 'db_usuarios',
};

async function fetchData() {
    try {
        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINT}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const extractedData = response.data.map(({ name, email, phone }) => ({ name, email, phone }));

        extractedData.forEach(({ name, email, phone }) => {
            console.log('Nombre:', name);
            console.log('Email:', email);
            console.log('Phone:', phone);
        });

        return extractedData;
    } catch (error) {
        console.error('Error al obtener datos de la API:', error.message);
        throw error;
    }
}

async function conectarBaseDeDatos() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        throw error;
    }
}

async function guardarDatosEnBaseDeDatos(data) {
    const connection = await conectarBaseDeDatos();

    try {
        const [result] = await connection.query(
            'INSERT INTO usuarios (name, email, phone) VALUES (?, ?, ?)',
            [data.name, data.email, data.phone]
        );

        console.log('Datos a insertar:', data.name, data.email, data.phone);
        console.log('Datos insertados en la base de datos:', result);
    } catch (error) {
        console.error('Error al guardar datos en la base de datos:', error.message);
    } finally {
        await connection.end();
    }
}

async function monitorChanges() {
    try {
        const currentData = await fetchData();

        if (JSON.stringify(currentData) !== JSON.stringify(previousData)) {
            console.log('Se detectaron cambios en la API.');

            for (const userData of currentData) {
                await guardarDatosEnBaseDeDatos(userData);
            }

            previousData = currentData;
        }
    } catch (error) {
        console.error('Error al monitorear cambios:', error.message);
    } finally {
        setTimeout(monitorChanges, INTERVAL_SECONDS * 1000);
    }
}

app.get('/currentData', async (req, res) => {
    try {
        const currentData = await fetchData();
        res.json(currentData);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos actuales.' });
    }
});

app.listen(PORT, () => {
    console.log(`El demonio está escuchando en http://localhost:${PORT}`);
    monitorChanges();
});
