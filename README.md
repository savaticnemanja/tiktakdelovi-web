# WhatsApp Notification MVP (Single package)

React (Vite) frontend + Express backend in one project. The app sends a single WhatsApp message (from the form) to all configured seller numbers via the Meta Cloud API. The server serves the built frontend in production; during dev, Vite runs separately with API proxy.

## Scripts
- `npm install` — install all deps
- `npm run dev` — run backend (nodemon) + Vite together
- `npm run build` — build frontend to `dist/`
- `npm start` — start Express serving `dist/`

## Env
Create `.env` at repo root:
```
# Meta WhatsApp Cloud API
META_WHATSAPP_TOKEN=replace_me
META_PHONE_NUMBER_ID=replace_me
META_TEMPLATE_NAME=bid_request_to_seller
META_TEMPLATE_LANGUAGE=sr
META_TEMPLATE_OFFER_NAME=bid_offer_to_buyer
META_TEMPLATE_OWNER_NAME=bid_offer_to_owner
META_WEBHOOK_VERIFY_TOKEN=replace_me
OWNER_NUMBER=+15551230099
BID_STORE_TTL_HOURS=72

# Comma-separated seller phone numbers (E.164)
SELLER_NUMBERS=+15551230001,+15551230002

# Ports (HOST_PORT is what the VPS exposes; PORT is what the container listens on)
HOST_PORT=8081
PORT=80
```

## Run locally
```
npm install
npm run dev   # Vite on 5173, API on PORT (set PORT=4000 for local dev)
```
For production preview:
```
npm run build
npm start     # serves dist via Express on PORT
```

## Docker / Compose
```
docker compose up --build   # defaults to http://localhost:8081
```
Compose reads `.env`, builds via Dockerfile, and exposes http://localhost:${HOST_PORT:-8081}.

## Endpoints
- `GET /api/health`
- `POST /api/request` with `{ name, customerNumber, bidId, bidMessage }` (broadcasts the configured Meta template to sellers)
- `GET /webhook` Meta verification endpoint (uses `META_WEBHOOK_VERIFY_TOKEN`)
- `POST /webhook` Meta inbound messages; expects seller replies in `BID_ID PRICE` format and sends offer templates to buyer + owner
