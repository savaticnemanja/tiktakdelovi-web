import React from "react";
import { CITY_OPTIONS } from "../../../shared/cities.js";
import { getWhatsAppStoreUrl } from "../../utils/whatsappStore";

const RoadsideForm = ({ form }) => {
  const {
    customerName,
    setCustomerName,
    customerNumber,
    setCustomerNumber,
    city,
    setCity,
    location,
    setLocation,
    issueDescription,
    setIssueDescription,
    serviceType,
    setServiceType,
    destination,
    setDestination,
    sending,
    status,
    send,
  } = form;

  const whatsappStoreUrl = getWhatsAppStoreUrl();

  return (
    <form className="form-card stagger" data-reveal="stagger" onSubmit={send}>
      <div className="field-grid">
        <label>
          Ime i prezime
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Marko Marković"
            required
          />
        </label>
        <label>
          Grad
          <select value={city} onChange={(e) => setCity(e.target.value)} required>
            <option value="">Izaberite grad</option>
            {CITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Lokacija
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Npr. Autokomanda, Beograd"
            required
          />
        </label>
        <label>
          Tip usluge
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            required
          >
            <option value="pomoc_na_putu">Pomoć na putu</option>
            <option value="slep_sluzba">Šlep služba</option>
          </select>
        </label>
      </div>

      {serviceType === "slep_sluzba" && (
        <label>
          Destinacija
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Npr. Servis Novi Beograd"
            required
          />
        </label>
      )}

      <label>
        Opis kvara
        <textarea
          rows="3"
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          placeholder="Npr. auto ne pali, čuje se klik"
          required
        />
      </label>

      <label>
        Kontakt broj
        <div className="phone-field">
          <span className="phone-prefix">+381</span>
          <input
            value={customerNumber}
            onChange={(e) => setCustomerNumber(e.target.value)}
            placeholder="64 123 456"
            inputMode="tel"
            required
          />
        </div>
      </label>

      <button type="submit" className="btn primary" disabled={sending}>
        {sending ? "Slanje..." : "Pošalji upit"}
      </button>

      <a
        className="btn ghost whatsapp-install"
        href={whatsappStoreUrl}
        target="_blank"
        rel="noreferrer"
      >
        <span className="radio-icon whatsapp" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false">
            <path d="M12 2a10 10 0 0 0-8.55 15.19L2 22l4.95-1.44A10 10 0 1 0 12 2zm0 18.2a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-2.9.84.86-2.82-.2-.3A8.16 8.16 0 1 1 12 20.2zm4.5-6.2c-.25-.12-1.46-.72-1.69-.8-.23-.08-.4-.12-.56.12-.16.25-.64.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.06-.39-2.02-1.24-.75-.67-1.25-1.5-1.4-1.75-.14-.25-.01-.39.1-.5.1-.1.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.36-.77-1.86-.2-.48-.4-.41-.56-.42h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.4 1.01 2.57.12.16 1.75 2.67 4.25 3.75.6.26 1.06.41 1.42.53.6.19 1.15.16 1.58.1.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.28z" />
          </svg>
        </span>
        Ako nemate WhatsApp nalog, kreirajte ga
      </a>

      {status && (
        <div className={`status ${status.ok ? "ok" : "err"}`} role="status" aria-live="polite">
          {status.ok ? "OK" : "GREŠKA"} {status.text}
        </div>
      )}
    </form>
  );
};

export default RoadsideForm;
