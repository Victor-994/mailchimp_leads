
import express from "express";

import cors from "cors";

import bodyParser from "body-parser";

import fetch from "node-fetch";

import dotenv from "dotenv";

import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

// Endpoint to save data to Mailchimp
app.post('/api/save-to-mailchimp', async (req, res) => {

    const { name, email, phone, result, country, interest, background } = req.body;
    // console.log("Request body:", req.body);

    // Compute the subscriber hash (MD5 of lowercase email)
    const subscriberHash = crypto
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex');


    const url = `https://${process.env.MAILCHIMP_DATA_CENTER}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`;
    
    const data = {
        email_address: email,
        status_if_new: 'subscribed',
        merge_fields: {
            FNAME: name,
            MMERGE2: phone,
            RESULT: result,
            COUNTRY: country,
            MMERGE5: interest, 
            MMERGE7: background
        },
    };

    const auth = `Basic ${Buffer.from(`anystring:${process.env.MAILCHIMP_API_KEY}`).toString('base64')}`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: auth,
            },
            body: JSON.stringify(data),
        });

        const json = await response.json();
        if (response.ok) {
            res.status(200).json({ message: 'User updated in Mailchimp!', data: json });
        } else {
            res.status(400).json({ error: json.detail });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
