# Flow Data Reference

This document describes the data exchanged in inquiries and responses across the system.
Use it to keep template params, flow inputs, and webhook payloads consistent.

## Core Entities

- **Inquiry**: Initial request sent to sellers/mechanics/tow drivers.
- **Response/Offer**: Provider reply, usually via a WhatsApp Flow form.
- **Notification**: Internal or buyer-facing update derived from an offer.

## Common Fields

- `bid_id`: Unique request ID used to correlate all messages.
- `bid_message`: Original user message (free text).
- `bid_details`: Structured details provided later (often via flow).
- `bid_offer`: Price or estimate.
- `bid_note`: Optional notes from provider.
- `buyer_name`
- `buyer_contact`
- `seller_contact` / `mechanic_contact` / `roadside_contact`
- `location` or `location_from`/`location_to`
- `make`, `model`, `year`, `fuel_type`, `chassis`
- `bid_date`, `bid_time` (when needed)

## Inquiry Payloads (Outbound)

### Seller Inquiry
- Header: `bid_id`
- Body: `make`, `model`, `year`, `fuel_type`, `chassis`, `bid_message`
- Button: Flow payload `{ screen: <seller_flow_screen> }`

### Mechanic Inquiry
- Header: `bid_id`
- Body: `make`, `model`, `year`, `fuel_type`, `chassis`, `bid_message`
- Button: Flow payload `{ screen: <mechanic_flow_screen> }`

### Tow / Roadside Inquiry
- Header: `bid_id`
- Body: `location`, `details`
- Button (optional): Flow payload `{ screen: <tow_or_roadside_flow_screen> }`

## Response / Offer Data (Inbound)

Provider responses are captured by flows and mapped back to the `bid_id`.

### Seller Offer (example)
- `bid_id`
- `bid_offer`
- `bid_note` (optional)
- `seller_contact`

### Mechanic Offer (example)
- `bid_id`
- `bid_offer`
- `bid_note` (optional)
- `mechanic_contact`
- `bid_date`, `bid_time` (optional)

### Tow / Roadside Offer (example)
- `bid_id`
- `bid_offer`
- `roadside_contact`
- `details` (optional)

## Notifications (Outbound)

### Owner Notification
Used for internal routing/approval.
- Includes full context: vehicle, buyer, offer, and provider contact.

### Buyer Notification
Sent after an offer is available.
- Includes `bid_offer`, provider details, and next steps.

## Field Consistency Notes

- `bid_id` must always be present to link messages.
- `*_contact` should be normalized phone numbers.
- Use masked sanitization for user-entered free text when sending to providers.
- Parameter order must match the template definition in Meta.

## Quick Mapping Summary

- Inquiry (buyer -> provider) produces `bid_id`
- Flow response (provider -> system) includes `bid_id` + offer data
- Notifications use `bid_id` + offer data to inform owner/buyer
