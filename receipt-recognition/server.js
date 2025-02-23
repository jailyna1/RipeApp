require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const axios = require('axios');

const app = express();
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

// Load API credentials from .env
const VERYFI_CLIENT_ID = process.env.VERYFI_CLIENT_ID;
const VERYFI_CLIENT_SECRET = process.env.VERYFI_CLIENT_SECRET;
const VERYFI_USERNAME = process.env.VERYFI_USERNAME;
const VERYFI_API_KEY = process.env.VERYFI_API_KEY;

// Verify that credentials are loaded correctly
if (!VERYFI_CLIENT_ID || !VERYFI_CLIENT_SECRET || !VERYFI_USERNAME || !VERYFI_API_KEY) {
    console.error("❌ ERROR: Missing Veryfi API credentials. Check your .env file.");
    process.exit(1); // Stop server if missing credentials
}

// POST /api/scan-receipt
app.post('/api/scan-receipt', async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.files || !req.files.receipt) {
            return res.status(400).json({ error: "No receipt file uploaded" });
        }

        const receiptFile = req.files.receipt;
        const fileBuffer = receiptFile.data;

        // Ensure file size is within limits (Veryfi allows up to 20MB)
        if (receiptFile.size > 20 * 1024 * 1024) {
            return res.status(400).json({ error: "File too large. Max size is 20MB." });
        }

        // API Endpoint
        const url = "https://api.veryfi.com/api/v8/partner/documents/";

        // Make request to Veryfi API
        const response = await axios.post(
            url,
            {
                file_name: receiptFile.name,
                file_data: fileBuffer.toString("base64"),
                categories: ["Groceries"] // Optional
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "CLIENT-ID": VERYFI_CLIENT_ID,
                    "CLIENT-SECRET": VERYFI_CLIENT_SECRET,
                    "AUTHORIZATION": `apikey ${VERYFI_USERNAME}:${VERYFI_API_KEY}`
                }
            }
        );

        res.json(response.data);

    } catch (error) {
        console.error("❌ Error calling Veryfi:", error.response?.data || error.message);

        if (error.response?.status === 400) {
            return res.status(400).json({ error: "Bad Request: Check API request format." });
        } else if (error.response?.status === 401) {
            return res.status(401).json({ error: "Not Authorized: Check API credentials." });
        } else {
            return res.status(500).json({ error: "Server error: Failed to process receipt." });
        }
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
