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
OWNER_NUMBER=+15551230099
COURIER_NUMBER=+15551230098
BID_STORE_TTL_HOURS=72
BID_ID_START=10001
BUYER_INQUIRY_THROTTLE_SECONDS=30
BUYER_INQUIRY_IP_THROTTLE_ENABLED=true
EXPRESS_TRUST_PROXY_HOPS=1

# City-specific phone numbers live in `src/shared/phoneNumbers.json`.
# Add cities there to appear in the form dropdowns.
# If a selected city has no numbers configured, the server sends to all numbers
# configured across all cities for that service.
#
# Example structure:
# {
#   "beograd": {
#     "label": "Beograd",
#     "sellers": ["+381..."],
#     "towDrivers": [],
#     "mechanics": []
#   }
# }

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
- `POST /api/request` with `{ name, customerNumber, bidMessage, make, model, year, fuelType, chassis, city }`
- `POST /api/mechanic-request` with `{ name, customerNumber, bidMessage, make, model, year, fuelType, chassis, city }`
- `POST /api/tow-request` with `{ name, customerNumber, serviceType, locationFrom, locationTo, details, city }`
- `GET /webhook` Meta verification endpoint (uses `META_WEBHOOK_VERIFICATION_TOKEN`)
- `POST /webhook` Meta inbound messages; expects seller replies in `BID_ID PRICE` format and sends offer templates to buyer + owner

Buyer inquiry endpoints (`/api/request`, `/api/mechanic-request`, `/api/tow-request`) are throttled by default to one valid request per 30 seconds per endpoint scope, keyed by customer number and IP. When throttled they return `429` with:
- `Retry-After` response header
- JSON payload `{ error, code: "BUYER_INQUIRY_THROTTLED", retryAfterSeconds, blockedBy }`
