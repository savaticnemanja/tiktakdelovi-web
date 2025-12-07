# WhatsApp Notification MVP (Single package)

React (Vite) frontend + Express backend in one project. The app broadcasts buyer requests to configured seller WhatsApp numbers and forwards tagged seller replies back to the buyer. The server serves the built frontend in production; during dev, Vite runs separately with API proxy.

## Scripts
- `npm install` — install all deps
- `npm run dev` — run backend (nodemon) + Vite together
- `npm run build` — build frontend to `dist/`
- `npm start` — start Express serving `dist/`

## Env
Create `.env` at repo root:
```
# choose: meta | twilio
PROVIDER=meta

# Twilio (if PROVIDER=twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
OWNER_NUMBER=+15551239999   # receives confirmed orders

# Meta (if PROVIDER=meta)
META_WHATSAPP_TOKEN=replace_me
META_PHONE_NUMBER_ID=replace_me

# Comma-separated seller phone numbers (E.164)
SELLER_NUMBERS=+15551230001,+15551230002

PORT=4000
```

## Run locally
```
npm install
npm run dev   # Vite on 5173, API on 4000 (proxied)
```
For production preview:
```
npm run build
npm start     # serves dist via Express on 4000
```

## Docker / Compose
```
docker compose up --build
```
Compose reads `.env`, builds via Dockerfile, and exposes http://localhost:4000.

## Endpoints
- `GET /api/health`
- `POST /api/request` with `{ name, customerNumber, message }` (broadcast to sellers; returns `requestId`)
- `GET /api/offers/:id` to retrieve stored bids
- `POST /api/confirm` with `{ requestId, seller, offerText }` to forward the selected bid to `OWNER_NUMBER`
- `POST /api/webhook/whatsapp` inbound webhook (configure provider to POST here; sellers must reply with `REQ:<id>` in message)
- `POST /api/notify` legacy single-send

### WhatsApp tok (sve poruke na srpskom)
- ID zahteva je prost inkrement (1001, 1002, ...).
- Kada kreiraš zahtev, prodavci dobijaju poruku: `Novi zahtev ... ID:<id> ... Odgovori sa: /ponuda <id> <cena u EUR i detalji>`.
- Ponuda prodavca stiže kao `/ponuda {id} {cena u eur + opis}` i automatski se vezuje za zahtev.
- Kupac dobija šablon sa svim ponudama u WhatsApp-u. Svaka ponuda ima redni broj.
- Kupac odgovara `POTVRDI <broj ponude> za ID:<id>` da prihvati ili `ODBIJ <broj ponude> za ID:<id>` da odbije.
- Kada kupac potvrdi, izabrana ponuda se prosleđuje na `OWNER_NUMBER`. Šablon se ponovo šalje posle svake akcije.

## Twilio WhatsApp sandbox
- Each seller number must join your sandbox once using the join code shown in the Twilio Console.
- Set the sandbox "WHEN A MESSAGE COMES IN" URL to `https://<your-host>/api/webhook/whatsapp` so seller bids are captured (this replaces the default "you said..." message).
