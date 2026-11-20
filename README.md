# Chance Ludwick — Integrating With HubSpot I: Foundations Practicum

A Node/Express app that lists and creates **Livestock Lot** custom object records through the HubSpot CRM APIs.

**Custom object list (developer test account):** https://app.hubspot.com/contacts/<test-account-id>/objects/<custom-object-id>/views/all/list

This practicum is one of two requirements for the Integrating With HubSpot I: Foundations certification. Course directions: [practicum instructions](https://app.hubspot.com/academy/l/tracks/1092124/1093824/5493?language=en).

## Custom object

Object: **Livestock Lot** / **Livestock Lots** (`livestock_lot`)

Associated with **contacts**.

| Property | Internal name | Type |
| --- | --- | --- |
| Name | `name` | string (primary display) |
| Kind | `kind` | string |
| Weight (lbs) | `weight` | number |

## Local setup

1. Create a HubSpot **developer test account**.
2. Create a private app named **Chance’s Practicum Private App** with:
   - `crm.schemas.custom` (read and write)
   - `crm.objects.custom` (read and write)
   - `crm.objects.contacts` (read and write)
3. Copy `.env.example` to `.env` and paste the private app access token as `PRIVATE_APP_ACCESS_TOKEN`. Do not commit `.env`.
4. Install dependencies and create the custom object plus three seed records:

```bash
npm install
npm run setup
```

5. Paste the printed list URL into this README (the link at the top of the file).
6. Start the app:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). **Add to this table** opens `/update-cobj`. Submitting the form creates a new Livestock Lot and redirects home.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Fetch lots and render `views/homepage.pug` |
| GET | `/update-cobj` | Render `views/updates.pug` |
| POST | `/update-cobj` | Create a lot, then redirect to `/` |
