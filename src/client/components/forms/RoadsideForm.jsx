import React from "react";
import { CITY_OPTIONS } from "../../../shared/cities.js";
import { getWhatsAppStoreUrl } from "../../utils/whatsappStore";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";

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
    notificationPreference,
    setNotificationPreference,
    sending,
    status,
    send,
  } = form;

  const whatsappStoreUrl = getWhatsAppStoreUrl();

  return (
    <form className="form-card stagger" data-reveal="stagger" onSubmit={send}>
      <div className="field-grid two">
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

      <div className="radio-field">
        <span className="radio-label">Preferirani kanal obaveštenja</span>
        <div className="radio-options">
          <label className="radio-option">
            <input
              type="radio"
              name="notification-preference-roadside"
              value="whatsapp"
              checked={notificationPreference === "whatsapp"}
              onChange={() => setNotificationPreference("whatsapp")}
              required
            />
            <span className="radio-icon whatsapp" aria-hidden="true">
              <FaWhatsapp />
            </span>
            <span>WhatsApp</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="notification-preference-roadside"
              value="telegram"
              checked={notificationPreference === "telegram"}
              onChange={() => setNotificationPreference("telegram")}
            />
            <span className="radio-icon telegram" aria-hidden="true">
              <FaTelegramPlane />
            </span>
            <span>Telegram</span>
          </label>
        </div>
      </div>

      <button type="submit" className="btn primary" disabled={sending}>
        {sending ? "Slanje..." : "Pošalji upit"}
      </button>

      {status && (
        <a
          className="btn ghost whatsapp-install"
          href={whatsappStoreUrl}
          target="_blank"
          rel="noreferrer"
        >
          <FaWhatsapp className="whatsapp-icon" aria-hidden="true" />
          Ako nemate WhatsApp nalog, kreirajte ga
        </a>
      )}

      {status && (
        <div className={`status ${status.ok ? "ok" : "err"}`} role="status" aria-live="polite">
          {status.ok ? "OK" : "GREŠKA"} {status.text}
        </div>
      )}
    </form>
  );
};

export default RoadsideForm;
