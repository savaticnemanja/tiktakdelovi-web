import React, { useState } from "react";

const offerKey = (offer) => `${offer.seller}|${offer.text}`;

export default function App() {
  const [name, setName] = useState("");
  const [customerNumber, setCustomerNumber] = useState(""); // e.g. +1234567890
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offerStatus, setOfferStatus] = useState(null);
  const [selectedOfferKey, setSelectedOfferKey] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    setOfferStatus(null);
    setConfirmStatus(null);

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          customerNumber,
          message
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unknown error");
      setRequestId(data.requestId);
      setOffers([]);
      setSelectedOfferKey(null);
      setStatus({ ok: true, text: `Sent to sellers. Request ID: ${data.requestId}` });
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  };

  const fetchOffers = async () => {
    if (!requestId) return;
    setLoadingOffers(true);
    setOfferStatus(null);
    try {
      const res = await fetch(`/api/offers/${requestId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to fetch offers");
      setOffers(data.bids || []);
      if (data.selection) {
        setSelectedOfferKey(offerKey({ seller: data.selection.seller, text: data.selection.offerText }));
      }
      setOfferStatus({ ok: true, text: `Offers: ${data.bids?.length || 0}` });
    } catch (err) {
      setOfferStatus({ ok: false, text: err.message });
    } finally {
      setLoadingOffers(false);
    }
  };

  const confirmOffer = async (offer) => {
    if (!requestId) return;
    setConfirming(true);
    setConfirmStatus(null);
    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          seller: offer.seller,
          offerText: offer.text
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to confirm offer");
      setSelectedOfferKey(offerKey(offer));
      setConfirmStatus({ ok: true, text: "Order sent to owner." });
    } catch (err) {
      setConfirmStatus({ ok: false, text: err.message });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Collect seller bids (WhatsApp)</h1>

        <form onSubmit={send}>
          <label>
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice"
              required
            />
          </label>

          <label>
            Customer number (international format, e.g. +15556667777)
            <input
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              placeholder="+1555..."
              required
            />
          </label>

          <label>
            Message
            <textarea
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hello team - new submission..."
              required
            />
          </label>

          <button type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send request to sellers"}
          </button>
        </form>

        {requestId && (
          <div className="section">
            <div className="section-header">
              <span>Request ID: {requestId}</span>
              <button onClick={fetchOffers} disabled={loadingOffers}>
                {loadingOffers ? "Refreshing..." : "Check offers"}
              </button>
            </div>
            {offerStatus && (
              <div className={`status ${offerStatus.ok ? "ok" : "err"}`}>
                {offerStatus.ok ? "OK" : "ERR"} {offerStatus.text}
              </div>
            )}
            <ul className="offers">
              {offers.length === 0 && <li className="muted">No offers yet.</li>}
              {offers.map((offer, idx) => (
                <li
                  key={`${offer.seller}-${idx}`}
                  className={selectedOfferKey === offerKey(offer) ? "selected" : ""}
                >
                  <div className="offer-meta">
                    <span className="pill">Seller: {offer.seller}</span>
                    <span className="pill">At: {new Date(offer.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="offer-text">{offer.text}</div>
                  <div className="offer-actions">
                    <button
                      type="button"
                      onClick={() => confirmOffer(offer)}
                      disabled={confirming}
                    >
                      {selectedOfferKey === offerKey(offer)
                        ? "Selected"
                        : confirming
                        ? "Selecting..."
                        : "Select this offer"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {confirmStatus && (
              <div className={`status ${confirmStatus.ok ? "ok" : "err"}`}>
                {confirmStatus.ok ? "OK" : "ERR"} {confirmStatus.text}
              </div>
            )}
          </div>
        )}

        {status && (
          <div className={`status ${status.ok ? "ok" : "err"}`}>
            {status.ok ? "OK" : "ERR"} {status.text}
          </div>
        )}

        <p className="note">
          Sellers receive REQ:<i>ID</i> via WhatsApp; replies tagged with REQ will be forwarded to the
          customer. Configure your Twilio WhatsApp sandbox "When a message comes in" URL to
          /api/webhook/whatsapp so bids are captured here.
        </p>
      </div>
    </div>
  );
}
