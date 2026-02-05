import React from "react";
import { MAKES } from "../../data/vehicleData";
import { YEARS, FUEL_TYPES, CHASSIS_TYPES } from "../../data/formOptions";
import { CITY_OPTIONS } from "../../../shared/cities.js";
import { getWhatsAppStoreUrl } from "../../utils/whatsappStore";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";

const RequestForm = ({ form, formKey, messagePlaceholder }) => {
  const {
    customerNumber,
    setCustomerNumber,
    city,
    setCity,
    bidMessage,
    setBidMessage,
    notificationPreference,
    setNotificationPreference,
    make,
    setMake,
    model,
    setModel,
    year,
    setYear,
    fuelType,
    setFuelType,
    chassis,
    setChassis,
    models,
    modelsLoading,
    sending,
    status,
    send,
  } = form;

  const whatsappStoreUrl = getWhatsAppStoreUrl();

  return (
    <form className="form-card stagger" data-reveal="stagger" onSubmit={send}>
      <div className="field-grid">
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
      </div>

      <label>
        Poruka za upit
        <textarea
          rows="4"
          value={bidMessage}
          onChange={(e) => setBidMessage(e.target.value)}
          placeholder={messagePlaceholder}
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
        <span className="field-help">
          Kontaktiraćemo vas putem WhatsApp-a, gde možete prihvatiti ili odbiti ponudu.
        </span>
      </label>

      <label className="checkbox-field">
        <input type="checkbox" required />
        <span>
          Saglasan/na sam da budem kontaktiran/a putem WhatsApp-a radi dostave ponuda.
        </span>
      </label>

      <div className="radio-field">
        <span className="radio-label">Preferirani kanal obaveštenja</span>
        <div className="radio-options">
          <label className="radio-option">
            <input
              type="radio"
              name={`notification-preference-${formKey}`}
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
              name={`notification-preference-${formKey}`}
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

      <a
        className="btn ghost whatsapp-install"
        href={whatsappStoreUrl}
        target="_blank"
        rel="noreferrer"
      >
        <FaWhatsapp className="whatsapp-icon" aria-hidden="true" />
        Ako nemate WhatsApp nalog, kreirajte ga
      </a>

      {status && (
        <div className={`status ${status.ok ? "ok" : "err"}`} role="status" aria-live="polite">
          {status.ok ? "OK" : "GREŠKA"} {status.text}
        </div>
      )}
      {status?.ok && notificationPreference === "telegram" && status.bidId && (
        <a className="btn light telegram-cta" href={`https://t.me/tiktakdelovi_bot?start=${status.bidId}`}>
          Poveži Telegram za zahtev #{status.bidId}
        </a>
      )}
    </form>
  );
};

export default RequestForm;
