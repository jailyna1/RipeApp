// server.js
require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const axios = require('axios');

const app = express();
app.use(fileUpload());
app.use(express.static('public'));

// Load partner credentials from .env
const VERYFI_CLIENT_ID = process.env.VERYFI_CLIENT_ID;
const VERYFI_CLIENT_SECRET = process.env.VERYFI_CLIENT_SECRET;
const VERYFI_USERNAME = process.env.VERYFI_USERNAME;
const VERYFI_API_KEY = process.env.VERYFI_API_KEY;

// POST /api/scan-receipt
app.post('/api/scan-receipt', async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.receipt) {
      return res.status(400).json({ error: 'No receipt file uploaded' });
    }

    const receiptFile = req.files.receipt;
    const fileBuffer = receiptFile.data;

    // Partner endpoint
    const url = 'https://api.veryfi.com/api/v7/partner/documents/';

    // Make request to Veryfi
    const response = await axios.post(
      url,
      {
        file_name: receiptFile.name,
        file_data: fileBuffer.toString('base64'),
        categories: ['Groceries'] // optional
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'CLIENT-ID': VERYFI_CLIENT_ID,
          'CLIENT-SECRET': VERYFI_CLIENT_SECRET,
          'AUTHORIZATION': `apikey ${VERYFI_USERNAME}:${VERYFI_API_KEY}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error calling Veryfi:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
