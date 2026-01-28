import React, { useEffect, useState } from "react";
import MAKES from "./data/makes";
import MODELS from "./data/models.json";

const YEARS = [
  2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
  2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002,
  2001, 2000, 1999, 1998, 1997, 1996, 1995, 1994, 1993, 1992, 1991, 1990, 1989,
  1988, 1987, 1986, 1985, 1984, 1983, 1982, 1981, 1980, 1979, 1978, 1977, 1976,
  1975, 1970, 1965, 1960, 1955, 1950, 1945, 1940, 1935, 1930
];
const FUEL_TYPES = [
  "Benzin",
  "Dizel",
  "Hibrid",
  "Električni",
  "LPG",
  "CNG",
  "Ostalo"
];
const CHASSIS_TYPES = [
  "Limuzina",
  "Hečbek",
  "Karavan",
  "Kupe",
  "Kabriolet/Roadster",
  "Monovolumen (MiniVan)",
  "Džip (SUV)",
  "Pickup"
];

const firstValue = (items) => (items || [])[0]?.value ?? (items || [])[0] ?? "";

// Safe JSON parse helper for fetch responses
const parseJson = async (res) => {
  try {
    return await res.json();
  } catch (err) {
    return null;
  }
};

export default function App() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const [name, setName] = useState("Nemanja");
  const [customerNumber, setCustomerNumber] = useState("+381652290662"); // e.g. +1234567890
  const [bidMessage, setBidMessage] = useState("Test bid request");
  const [make, setMake] = useState(firstValue(MAKES));
  const [model, setModel] = useState("");
  const [year, setYear] = useState(firstValue(YEARS));
  const [fuelType, setFuelType] = useState(firstValue(FUEL_TYPES));
  const [chassis, setChassis] = useState(firstValue(CHASSIS_TYPES));
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      const res = await fetch(`${API_BASE}/api/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          customerNumber,
          bidMessage,
          make,
          model,
          year,
          fuelType,
          chassis
        })
      });

      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.error || "Nepoznata greška");
      const sentCount = Array.isArray(data?.sent) ? data.sent.length : 0;
      const templateLabel = data?.template ? ` Šablon: ${data.template}.` : "";
      setStatus({
        ok: true,
        text: sentCount
          ? `Poslato ${sentCount} prodavcu(a).${templateLabel}`
          : `Poslato.${templateLabel}`
      });
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    setModelsLoading(true);
    const options = Array.isArray(MODELS?.[make]) ? MODELS[make] : [];
    setModels(options);
    setModel(firstValue(options));
    setModelsLoading(false);
  }, [make]);


  return (
    <div className="page">
      <div className="card">
        <h1>Pošalji WhatsApp poruku</h1>

        <form onSubmit={send}>
          <label>
            Vaše ime
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ana"
              required
            />
          </label>

          <label>
            Broj kupca (međunarodni format, npr. +381...)
            <input
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              placeholder="+381..."
              required
            />
          </label>

          <label>
            Marka vozila
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
                  ? "Učitavanje modela..."
                  : !make
                  ? "Izaberite marku prvo"
                  : models.length
                  ? "Izaberite model"
                  : "Nema modela"}
              </option>
              {models.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Godina
            <select value={year} onChange={(e) => setYear(e.target.value)} required>
              {YEARS.map((y) => (
                <option key={y || "any"} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label>
            Vrsta goriva
            <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} required>
              {FUEL_TYPES.map((fuel) => (
                <option key={fuel || "placeholder"} value={fuel}>
                  {fuel}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tip karoserije
            <select value={chassis} onChange={(e) => setChassis(e.target.value)} required>
              {CHASSIS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            Poruka za upit
            <textarea
              rows="4"
              value={bidMessage}
              onChange={(e) => setBidMessage(e.target.value)}
              placeholder="Zdravo - novi upit..."
              required
            />
          </label>

          <button type="submit" disabled={sending}>
            {sending ? "Slanje..." : "Pošalji poruku"}
          </button>
        </form>

        {status && (
          <div className={`status ${status.ok ? "ok" : "err"}`}>
            {status.ok ? "OK" : "GREŠKA"} {status.text}
          </div>
        )}
      </div>
    </div>
  );
}
