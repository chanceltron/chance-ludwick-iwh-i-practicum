require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS_TOKEN;
const HUBSPOT_API = 'https://api.hubapi.com';
const OBJECT_NAME = 'livestock_lot';

if (!PRIVATE_APP_ACCESS) {
    console.error('Set PRIVATE_APP_ACCESS_TOKEN in .env, then run npm run setup again.');
    process.exit(1);
}

const headers = {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    'Content-Type': 'application/json'
};

const schemaBody = {
    name: OBJECT_NAME,
    labels: {
        singular: 'Livestock Lot',
        plural: 'Livestock Lots'
    },
    primaryDisplayProperty: 'name',
    requiredProperties: ['name'],
    searchableProperties: ['name'],
    properties: [
        {
            name: 'name',
            label: 'Name',
            type: 'string',
            fieldType: 'text'
        },
        {
            name: 'kind',
            label: 'Kind',
            type: 'string',
            fieldType: 'text'
        },
        {
            name: 'weight',
            label: 'Weight (lbs)',
            type: 'number',
            fieldType: 'number'
        }
    ],
    associatedObjects: ['CONTACT']
};

const seedLots = [
    { name: '58 Feeder Steers 875#', kind: 'Steers', weight: '875' },
    { name: '40 Bred Cows 1250#', kind: 'Cows', weight: '1250' },
    { name: '32 Weaned Heifers 550#', kind: 'Heifers', weight: '550' }
];

function upsertEnv(envText, key, value) {
    const line = `${key}=${value}`;
    if (new RegExp(`^${key}=`, 'm').test(envText)) {
        return envText.replace(new RegExp(`^${key}=.*$`, 'm'), line);
    }
    const trimmed = envText.replace(/\s*$/, '');
    return `${trimmed}\n${line}\n`;
}

async function getPortalId() {
    try {
        const resp = await axios.get(`${HUBSPOT_API}/account-info/v3/details`, { headers });
        return resp.data.portalId;
    } catch (error) {
        const resp = await axios.get(`${HUBSPOT_API}/integrations/v1/me`, { headers });
        return resp.data.portalId;
    }
}

async function getOrCreateSchema() {
    const list = await axios.get(`${HUBSPOT_API}/crm/v3/schemas`, { headers });
    const existing = (list.data.results || []).find((schema) => schema.name === OBJECT_NAME);
    if (existing) {
        console.log(`Using existing schema ${existing.objectTypeId}`);
        return existing;
    }
    const created = await axios.post(`${HUBSPOT_API}/crm/v3/schemas`, schemaBody, { headers });
    console.log(`Created Livestock Lot schema ${created.data.objectTypeId}`);
    return created.data;
}

async function seedRecords(objectTypeId) {
    const existing = await axios.get(`${HUBSPOT_API}/crm/v3/objects/${objectTypeId}`, {
        headers,
        params: { properties: 'name', limit: 100 }
    });
    const names = new Set((existing.data.results || []).map((row) => row.properties && row.properties.name));
    for (const properties of seedLots) {
        if (names.has(properties.name)) {
            console.log(`Record already exists: ${properties.name}`);
            continue;
        }
        await axios.post(`${HUBSPOT_API}/crm/v3/objects/${objectTypeId}`, { properties }, { headers });
        console.log(`Created record: ${properties.name}`);
    }
}

async function writeEnv(objectTypeId, portalId) {
    const envPath = path.join(__dirname, '.env');
    let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    envText = upsertEnv(envText, 'HUBSPOT_OBJECT_TYPE', objectTypeId);
    envText = upsertEnv(envText, 'HUBSPOT_PORTAL_ID', String(portalId));
    fs.writeFileSync(envPath, envText.endsWith('\n') ? envText : `${envText}\n`);
}

async function main() {
    const schema = await getOrCreateSchema();
    const objectTypeId = schema.objectTypeId;
    const portalId = await getPortalId();
    await seedRecords(objectTypeId);
    await writeEnv(objectTypeId, portalId);

    const listUrl = `https://app.hubspot.com/contacts/${portalId}/objects/${objectTypeId}/views/all/list`;
    console.log('\nCustom object list URL (paste into README.md):');
    console.log(listUrl);
}

main().catch((error) => {
    const detail = error.response && error.response.data ? JSON.stringify(error.response.data, null, 2) : error.message;
    console.error(detail);
    process.exit(1);
});
