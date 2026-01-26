import React, { useEffect, useState } from "react";
import MAKES from "./data/makes";

// Safe JSON parse helper for fetch responses
const parseJson = async (res) => {
  try {
    return await res.json();
  } catch (err) {
    return null;
  }
};

export default function App() {
  const [name, setName] = useState("Nemanja");
  const [customerNumber, setCustomerNumber] = useState("+381652290662"); // e.g. +1234567890
  const [bidMessage, setBidMessage] = useState("Test bid request");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
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
          bidMessage,
          make,
          model,
          year
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

  useEffect(() => {
    if (!make) {
      setModels([]);
      setModel("");
      return;
    }
    const load = async () => {
      setModelsLoading(true);
      try {
        const res = await fetch(`/api/models?brand=${encodeURIComponent(make)}`);
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data?.error || "Model lookup failed");
        setModels(data.options || []);
      } catch (err) {
        setModels([]);
        setStatus({ ok: false, text: err.message });
      } finally {
        setModelsLoading(false);
      }
    };
    load();
  }, [make]);

  const YEARS = [
    "",
    2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
    2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002,
    2001, 2000, 1999, 1998, 1997, 1996, 1995, 1994, 1993, 1992, 1991, 1990, 1989,
    1988, 1987, 1986, 1985, 1984, 1983, 1982, 1981, 1980, 1979, 1978, 1977, 1976,
    1975, 1970, 1965, 1960, 1955, 1950, 1945, 1940, 1935, 1930
  ];

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
            Car make
            <select
              value={make}
              onChange={(e) => {
                setMake(e.target.value);
                setModel("");
              }}
              required
            >
              {MAKES.map((m) => (
                <option key={m.value || "placeholder"} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Model
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!make || modelsLoading || !models.length}
              required
            >
              <option value="">
                {modelsLoading
                  ? "Loading models..."
                  : !make
                  ? "Choose make first"
                  : models.length
                  ? "Choose model"
                  : "No models found"}
              </option>
              {models.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Year
            <select value={year} onChange={(e) => setYear(e.target.value)} required>
              {YEARS.map((y) => (
                <option key={y || "any"} value={y}>
                  {y ? y : "Any year"}
                </option>
              ))}
            </select>
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
