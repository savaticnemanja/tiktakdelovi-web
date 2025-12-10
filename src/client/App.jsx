import React, { useEffect, useRef, useState } from "react";

const offerKey = (offer) => `${offer.seller}|${offer.text}`;
const parseJson = async (res) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Invalid JSON response");
  }
};

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
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission === "granted" : false
  );
  const knownOffersRef = useRef(new Set());
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushReady, setPushReady] = useState(false);
  const [pushSupport, setPushSupport] = useState(
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
  );
  const [pushPublicKey, setPushPublicKey] = useState(null);
  const [pushError, setPushError] = useState(null);
  const [demoTo, setDemoTo] = useState("");
  const [demoOfferId, setDemoOfferId] = useState("1001");
  const [demoOfferPrice, setDemoOfferPrice] = useState("50");
  const [demoSending, setDemoSending] = useState(false);
  const [demoStatus, setDemoStatus] = useState(null);
  const [mockStatus, setMockStatus] = useState(null);
  const mockTimeoutRef = useRef(null);
  const pushSubscriptionRef = useRef(null);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    setOfferStatus(null);
    setConfirmStatus(null);
    knownOffersRef.current = new Set();

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          customerNumber,
          message,
          pushSubscription: pushSubscriptionRef.current
        })
      });

      const data = await parseJson(res);
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

  const processOffers = (data, { notify = false } = {}) => {
    const bids = data.bids || [];
    setOffers(bids);
    if (data.selection) {
      setSelectedOfferKey(offerKey({ seller: data.selection.seller, text: data.selection.offerText }));
    }

    const currentKeys = new Set(bids.map((o) => offerKey(o)));
    if (
      notify &&
      notificationsEnabled &&
      notificationPermission === "granted" &&
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      const known = knownOffersRef.current;
      bids.forEach((offer, idx) => {
        const key = offerKey(offer);
        if (!known.has(key)) {
          const title = `Nova ponuda #${idx + 1} za ID:${requestId}`;
          const body = `${offer.text}\nProdavac: ${offer.seller}`;
          try {
            const notification = new Notification(title, { body });
            notification.onclick = () => window.focus();
          } catch (_) {
            // ignore permission errors
          }
        }
      });
    }
    knownOffersRef.current = currentKeys;
  };

  const fetchOffers = async ({ silent = false, notify = false } = {}) => {
    if (!requestId) return;
    if (!silent) setLoadingOffers(true);
    if (!silent) setOfferStatus(null);
    try {
      const res = await fetch(`/api/offers/${requestId}`);
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.error || "Unable to fetch offers");
      processOffers(data, { notify });
      if (!silent) {
        setOfferStatus({ ok: true, text: `Offers: ${data.bids?.length || 0}` });
      }
    } catch (err) {
      if (!silent) setOfferStatus({ ok: false, text: err.message });
    } finally {
      if (!silent) setLoadingOffers(false);
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
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.error || "Unable to confirm offer");
      setSelectedOfferKey(offerKey(offer));
      setConfirmStatus({ ok: true, text: "Order sent to owner." });
    } catch (err) {
      setConfirmStatus({ ok: false, text: err.message });
    } finally {
      setConfirming(false);
    }
  };

  const requestNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setNotificationsEnabled(permission === "granted");
    } catch (_) {
      setNotificationPermission("denied");
      setNotificationsEnabled(false);
    }
  };

  useEffect(() => {
    if (!requestId) return undefined;
    const interval = setInterval(() => {
      fetchOffers({ silent: true, notify: true });
    }, 10000);
    return () => clearInterval(interval);
  }, [requestId, notificationsEnabled]);

  useEffect(() => () => {
    if (mockTimeoutRef.current) {
      clearTimeout(mockTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!pushSupport) return;
    const loadKey = async () => {
      try {
        const res = await fetch("/api/push/public-key");
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data?.error || "Push key fetch failed");
        setPushPublicKey(data.publicKey);
        setPushError(null);
      } catch (err) {
        console.error("Push key error:", err.message);
        setPushError(err.message);
        setPushPublicKey(null);
      }
    };
    loadKey();
  }, [pushSupport]);

  const sendDemoTemplate = async (e) => {
    e.preventDefault();
    setDemoSending(true);
    setDemoStatus(null);
    try {
      const res = await fetch("/api/demo/buyer-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: demoTo,
          offerId: demoOfferId,
          offerPrice: demoOfferPrice
        })
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.error || "Unable to send demo template");
      setDemoStatus({ ok: true, text: "Template sent via Twilio." });
    } catch (err) {
      setDemoStatus({ ok: false, text: err.message });
    } finally {
      setDemoSending(false);
    }
  };

  const scheduleMockNotification = async () => {
    if (typeof window === "undefined" || !pushSupport) {
      setMockStatus({ ok: false, text: "Push/service worker not supported." });
      return;
    }
    if (!pushSubscriptionRef.current) {
      setMockStatus({ ok: false, text: "Enable push first." });
      return;
    }
    try {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        setNotificationsEnabled(permission === "granted");
        if (permission !== "granted") {
          setMockStatus({ ok: false, text: "Notifications not granted." });
          return;
        }
      } else if (Notification.permission === "denied") {
        setMockStatus({ ok: false, text: "Notifications blocked in browser." });
        return;
      }

      if (mockTimeoutRef.current) {
        clearTimeout(mockTimeoutRef.current);
      }
      setMockStatus({ ok: true, text: "Will send mock push in 2 seconds..." });
      mockTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/mock/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription: pushSubscriptionRef.current })
          });
          const data = await parseJson(res);
          if (!res.ok) throw new Error(data?.error || "Mock push failed");
          setMockStatus({ ok: true, text: "Mock push sent." });
        } catch (err) {
          setMockStatus({ ok: false, text: err.message || "Failed to send mock push." });
        }
      }, 2000);
    } catch (err) {
      setMockStatus({ ok: false, text: err.message || "Notification error." });
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const enablePush = async () => {
    if (!pushSupport) {
      setStatus({ ok: false, text: "Browser does not support push." });
      return;
    }
    if (!pushPublicKey) {
      setPushError(pushError || "Push not configured on server.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setNotificationsEnabled(permission === "granted");
      if (permission !== "granted") {
        setStatus({ ok: false, text: "Notifications not granted." });
        return;
      }
      let registration;
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
      } catch (err) {
        setPushError(err?.message || "Failed to register service worker.");
        return;
      }
      const activeRegistration = await navigator.serviceWorker.ready;
      const reg = activeRegistration || registration;
      if (!reg) {
        setPushError("Service worker not ready.");
        return;
      }
      const existing = await reg.pushManager.getSubscription();
      const subscription =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(pushPublicKey)
        }));
      pushSubscriptionRef.current = subscription;
      setPushEnabled(true);
      setPushReady(true);
      setPushError(null);
    } catch (err) {
      setPushError(err?.message || "Push enable failed");
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
            {typeof window !== "undefined" && "Notification" in window && (
              <div className="status ok">
                Browser notifications:{" "}
                {notificationPermission === "granted"
                  ? "enabled"
                  : notificationPermission === "denied"
                  ? "blocked"
                  : "not granted"}
                {"  "}
                {notificationPermission !== "granted" && (
                  <button type="button" onClick={requestNotifications} style={{ marginLeft: 8 }}>
                    Enable
                  </button>
                )}
              </div>
            )}
            {pushSupport && (
              <div className="status ok">
                Push (closed browser) notifications: {pushEnabled && pushReady ? "ready" : "disabled"}
                {pushError && (
                  <span style={{ marginLeft: 8, color: "#c00" }}>
                    {pushError || "Push not configured"}
                  </span>
                )}
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

        <hr />

        <div className="section">
          <h2>Send demo buyer offer template</h2>
          <p className="note">
            This hits <code>/api/demo/buyer-offer</code> and sends the Twilio template with{" "}
            <code>offer_id</code> and <code>offer_price</code> variables. Enter any test number
            reachable by your Twilio WhatsApp sender.
          </p>
          <form onSubmit={sendDemoTemplate}>
            <label>
              Recipient number (e.g. +381612345678)
              <input
                value={demoTo}
                onChange={(e) => setDemoTo(e.target.value)}
                placeholder="+381..."
                required
              />
            </label>
            <label>
              offer_id
              <input
                value={demoOfferId}
                onChange={(e) => setDemoOfferId(e.target.value)}
                placeholder="1001"
                required
              />
            </label>
            <label>
              offer_price
              <input
                value={demoOfferPrice}
                onChange={(e) => setDemoOfferPrice(e.target.value)}
                placeholder="50"
                required
              />
            </label>
            <button type="submit" disabled={demoSending}>
              {demoSending ? "Sending..." : "Send demo template"}
            </button>
          </form>
          {demoStatus && (
            <div className={`status ${demoStatus.ok ? "ok" : "err"}`}>
              {demoStatus.ok ? "OK" : "ERR"} {demoStatus.text}
            </div>
          )}

          <div className="section" style={{ marginTop: 20 }}>
            <h3>Mock browser notification</h3>
            <p className="note">
              Click to send a mock push (via your push subscription) after ~2 seconds. Enable push first
              so this works even if the tab is closed.
            </p>
            <button type="button" onClick={scheduleMockNotification}>
              Send mock push in 2s
            </button>
            {mockStatus && (
              <div className={`status ${mockStatus.ok ? "ok" : "err"}`}>
                {mockStatus.ok ? "OK" : "ERR"} {mockStatus.text}
              </div>
            )}
            {pushSupport && (
              <div style={{ marginTop: 12 }}>
                <div className="status ok">
                  Push (closed browser) notifications: {pushEnabled && pushReady ? "ready" : "disabled"}
                  {pushError && (
                    <span style={{ marginLeft: 8, color: "#c00" }}>
                      {pushError || "Push not configured"}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={enablePush}
                  disabled={pushEnabled || !pushPublicKey}
                  style={{ marginTop: 8 }}
                >
                  {pushEnabled ? "Push enabled" : pushPublicKey ? "Enable push" : "Push not configured"}
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="note">
          Prodavci dobijaju ID zahteva i šalju ponudu kao <code>/ponuda {'{id} {cena u EUR i opis}'}</code>.
          Kupac dobija šablon sa svim ponudama u WhatsApp-u i odgovara <code>POTVRDI # za ID</code> ili
          <code>ODBIJ # za ID</code> direktno u WhatsApp-u. Podesi Twilio WhatsApp sandbox "When a message comes in"
          na /api/webhook/whatsapp da bi ponude bile zabeležene.
        </p>
      </div>
    </div>
  );
}
