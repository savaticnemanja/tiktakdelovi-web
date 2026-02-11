# Flow Reference

This document explains how the system asks for details and routes inquiries for:
- Auto parts
- Mechanic services
- Tow / roadside assistance

It is meant as a quick reference for future prompt or template updates.

## Shared Concepts

- **Bid**: A single customer request. Each bid gets a `bidId`.
- **Channels**:
  - WhatsApp (Meta templates + flows)
  - Telegram (text-based follow-ups)
- **Core data captured**:
  - Customer contact
  - Request details
  - Vehicle details (make/model/year/fuel/chassis)
  - Location (for tow/roadside)

## Auto Parts Inquiry Flow (Seller)

**Goal**: Collect a clear parts request and send it to sellers, then enable sellers to respond with an offer.

**Steps**
1. Customer submits a request (contact, message, optional vehicle details).
2. A `bidId` is created and saved.
3. The system sends the **Seller Inquiry** template to each seller:
   - Header: `bid_id`
   - Body: make, model, year, fuel_type, chassis, bid_message
4. The template includes a **Flow button** that opens the seller flow (offer form).
5. Seller submits offer via flow; the offer is associated with the original `bidId`.

**Why it works**
- Sellers receive consistent vehicle details.
- The flow ensures structured offer data (price, notes, contact).

## Mechanic Inquiry Flow

**Goal**: Collect repair details and route them to mechanics, then enable structured responses.

**Steps**
1. Customer submits a repair request.
2. A `bidId` is created and saved.
3. The system sends the **Mechanic Inquiry** template:
   - Header: `bid_id`
   - Body: make, model, year, fuel_type, chassis, bid_message
4. The template includes a **Flow button** for mechanics to submit an offer/response.

**Why it works**
- Mechanics get the same vehicle detail set as sellers.
- Flow response keeps offer data consistent and traceable.

## Tow / Roadside Inquiry Flow

**Goal**: Capture location and service details for towing or roadside help.

**Tow Inquiry Steps**
1. Customer submits tow details (location from/to + issue).
2. A `bidId` is created and saved.
3. The system sends the **Tow Inquiry** template:
   - Header: `bid_id`
   - Body: location, details
4. Optional **Flow button** allows tow drivers to submit a structured offer.

**Roadside Inquiry Steps**
1. Customer submits roadside details (location + issue).
2. A `bidId` is created and saved.
3. The system sends the **Roadside Inquiry** template:
   - Header: `bid_id`
   - Body: location, details
4. Optional **Flow button** allows roadside operators to respond.

**Why it works**
- Location data is front-and-center.
- Flow buttons keep responses consistent.

## Notifications & Follow-Ups

- **Owner notifications** inform internal staff about offers and routing.
- **Buyer notifications** send offers back to the customer.
- **Telegram** is used for extra details or follow-ups when the buyer prefers it.

## Template/Flow Design Notes

- All template parameters must keep their ordering.
- `bid_id` is always in the header for traceability.
- Buttons carry structured payloads with `bid_id` or flow `screen` name.

## Common Fields Reference

- `bid_id`: Unique request ID.
- `bid_message`: Original user message or issue.
- `bid_details`: Detailed description (often from flow).
- `bid_offer`: Offered price.
- `buyer_contact`: Customer phone.
- `seller_contact` / `mechanic_contact`: Provider phone.
- `location`: Tow/roadside location.

## Mapping Summary

- **Seller inquiry** -> Seller flow -> Owner/buyer notification
- **Mechanic inquiry** -> Mechanic flow -> Owner/buyer notification
- **Tow/Roadside inquiry** -> Driver flow -> Owner/buyer notification
