import React from "react";
import { CITY_OPTIONS } from "../../../shared/cities.js";
import { getWhatsAppStoreUrl } from "../../utils/whatsappStore";
import { getTelegramStoreUrl } from "../../utils/telegramStore";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";

const RoadsideForm = ({ form }) => {
  const {
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
  const telegramStoreUrl = getTelegramStoreUrl();

  return (
    <form className="form-card stagger" data-reveal="stagger" onSubmit={send}>
      <div className="field-grid two">
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

      <label className="checkbox-field">
        <input type="checkbox" required />
        <span>
          Saglasan/na sam da budem kontaktiran/a putem{" "}
          {notificationPreference === "telegram" ? "Telegram-a" : "WhatsApp-a"} radi
          dostave ponuda.
        </span>
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

      {status?.ok && notificationPreference === "telegram" && status.bidId && (
        <a
          className="btn telegram-install telegram-cta"
          href={`https://t.me/tiktakdelovi_bot?start=${status.bidId}`}
        >
          <FaTelegramPlane className="telegram-icon" aria-hidden="true" />
          Kliknite da povežete Telegram na našeg bota.
        </a>
      )}
      {status && notificationPreference === "whatsapp" && (
        <a
          className="btn whatsapp-install"
          href={whatsappStoreUrl}
          target="_blank"
          rel="noreferrer"
        >
          <FaWhatsapp className="whatsapp-icon" aria-hidden="true" />
          Ako nemate WhatsApp nalog, kreirajte ga
        </a>
      )}
      {status && notificationPreference === "telegram" && (
        <a
          className="btn telegram-install"
          href={telegramStoreUrl}
          target="_blank"
          rel="noreferrer"
        >
          <FaTelegramPlane className="telegram-icon" aria-hidden="true" />
          Ako nemate Telegram nalog, preuzmite aplikaciju
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
