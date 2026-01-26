import React, { useState } from "react";

export default function App() {
  const [name, setName] = useState("Nemanja");
  const [customerNumber, setCustomerNumber] = useState("+381652290662"); // e.g. +1234567890
  const [bidMessage, setBidMessage] = useState("Test bid request");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          customerNumber,
          bidMessage
        })
      });

      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.error || "Unknown error");
      const sentCount = Array.isArray(data?.sent) ? data.sent.length : 0;
      const templateLabel = data?.template ? ` Template: ${data.template}.` : "";
      setStatus({
        ok: true,
        text: sentCount ? `Sent to ${sentCount} seller(s).${templateLabel}` : `Sent.${templateLabel}`
      });
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Send WhatsApp message</h1>

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
            Bid message
            <textarea
              rows="4"
              value={bidMessage}
              onChange={(e) => setBidMessage(e.target.value)}
              placeholder="Hello team - new bid request..."
              required
            />
          </label>

          <button type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send message"}
          </button>
        </form>

        {status && (
          <div className={`status ${status.ok ? "ok" : "err"}`}>
            {status.ok ? "OK" : "ERR"} {status.text}
          </div>
        )}
      </div>
    </div>
  );
}
