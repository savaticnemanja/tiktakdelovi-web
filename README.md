# WhatsApp Notification MVP (Single package)

React (Vite) frontend + Express backend in one project. The app sends a WhatsApp message (from the form) to all configured seller numbers via the Meta Cloud API. The server serves the built frontend in production; during dev, Vite runs separately.

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
META_WEBHOOK_VERIFICATION_TOKEN=replace_me
META_TEMPLATE_SELLER_INQUIRY=seller_inquiry
META_TEMPLATE_SELLER_INQUIRY_FLOW_TITLE=Podaci za dostavu
META_TEMPLATE_LANGUAGE=sr
META_TEMPLATE_BUYER_OFFER=bid_offer_to_buyer
META_TEMPLATE_BUYER_OFFER_FLOW_TITLE=Podaci za dostavu
META_TEMPLATE_OWNER_NOTIFICATION=bid_offer_to_owner
OWNER_NUMBER=+15551230099
BID_STORE_TTL_HOURS=72
BID_ID_START=10001

# Comma-separated seller phone numbers (E.164)
SELLER_NUMBERS=+15551230001,+15551230002

# Ports (HOST_PORT is what the VPS exposes; PORT is what the container listens on)
HOST_PORT=8081
PORT=4000

# Frontend API base URL
VITE_API_BASE_URL=http://localhost:4000
```

## Run locally
```
npm install
npm run dev   # Vite on 5173, API on PORT
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
- `POST /api/request` with `{ name, customerNumber, bidMessage, make, model, year, fuelType, chassis }`
- `GET /webhook` Meta verification endpoint (uses `META_WEBHOOK_VERIFICATION_TOKEN`)
- `POST /webhook` Meta inbound messages; expects seller replies in `BID_ID PRICE` format and sends offer templates to buyer + owner


- OWNER IMA CTA DA PROSLEDI POTVRDU DOSTAVLJACU I PRODAVCU (ODVOJENO)
