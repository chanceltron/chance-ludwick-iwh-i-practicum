require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Private app token lives in .env — never commit it.
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS_TOKEN;
const CUSTOM_OBJECT_TYPE = process.env.HUBSPOT_OBJECT_TYPE;
const CUSTOM_PROPERTIES = ['name', 'kind', 'weight'];
const HUBSPOT_API = 'https://api.hubapi.com';

const hubspotHeaders = () => ({
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    'Content-Type': 'application/json'
});

const missingConfigMessage = () => {
    if (!PRIVATE_APP_ACCESS) {
        return 'Missing PRIVATE_APP_ACCESS_TOKEN. Copy .env.example to .env and add your private app token.';
    }
    if (!CUSTOM_OBJECT_TYPE) {
        return 'Missing HUBSPOT_OBJECT_TYPE. Run npm run setup after your token is in .env.';
    }
    return null;
};

// ROUTE 1 — Homepage: GET custom object records and render them in a table.
app.get('/', async (req, res) => {
    const title = 'Livestock Lots | Integrating With HubSpot I Practicum';
    const configError = missingConfigMessage();
    if (configError) {
        return res.render('homepage', { title, data: [], error: configError });
    }

    const search = new URLSearchParams({ limit: '100' });
    CUSTOM_PROPERTIES.forEach((property) => search.append('properties', property));
    const url = `${HUBSPOT_API}/crm/v3/objects/${CUSTOM_OBJECT_TYPE}?${search.toString()}`;
    try {
        const resp = await axios.get(url, {
            headers: hubspotHeaders()
        });
        const data = resp.data.results || [];
        res.render('homepage', { title, data });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.render('homepage', {
            title,
            data: [],
            error: 'Could not load livestock lots from HubSpot. Check your token, object type, and scopes.'
        });
    }
});

// ROUTE 2 — Form page: render the pug template that creates a new custom object record.
app.get('/update-cobj', (req, res) => {
    res.render('updates', {
        title: 'Update Custom Object Form | Integrating With HubSpot I Practicum'
    });
});

// ROUTE 3 — Create a custom object record from the form, then redirect home.
app.post('/update-cobj', async (req, res) => {
    const formTitle = 'Update Custom Object Form | Integrating With HubSpot I Practicum';
    const configError = missingConfigMessage();
    if (configError) {
        return res.status(400).render('updates', { title: formTitle, error: configError });
    }

    const { name, kind, weight } = req.body;
    const url = `${HUBSPOT_API}/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`;
    const newRecord = {
        properties: {
            name,
            kind,
            weight
        }
    };

    try {
        await axios.post(url, newRecord, { headers: hubspotHeaders() });
        res.redirect('/');
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).render('updates', {
            title: formTitle,
            error: 'Could not create the livestock lot in HubSpot. Check the form values and API scopes.'
        });
    }
});

/**
* * This is sample code to give you a reference for how you should structure your calls.

* * App.get sample
app.get('/contacts', async (req, res) => {
    const contacts = 'https://api.hubspot.com/crm/v3/objects/contacts';
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
    try {
        const resp = await axios.get(contacts, { headers });
        const data = resp.data.results;
        res.render('contacts', { title: 'Contacts | HubSpot APIs', data });
    } catch (error) {
        console.error(error);
    }
});

* * App.post sample
app.post('/update', async (req, res) => {
    const update = {
        properties: {
            "favorite_book": req.body.newVal
        }
    }

    const email = req.query.email;
    const updateContact = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try {
        await axios.patch(updateContact, update, { headers } );
        res.redirect('back');
    } catch(err) {
        console.error(err);
    }

});
*/

app.listen(3000, () => console.log('Listening on http://localhost:3000'));
