import React from "react";
import { MAKES } from "../../data/vehicleData";
import { YEARS, FUEL_TYPES, CHASSIS_TYPES } from "../../data/formOptions";

const RequestForm = ({ form, formKey, messagePlaceholder }) => {
  const {
    customerNumber,
    setCustomerNumber,
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

  return (
    <form className="form-card stagger" data-reveal="stagger" onSubmit={send}>
      <div className="field-grid">
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
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M12 2a10 10 0 0 0-8.55 15.19L2 22l4.95-1.44A10 10 0 1 0 12 2zm0 18.2a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-2.9.84.86-2.82-.2-.3A8.16 8.16 0 1 1 12 20.2zm4.5-6.2c-.25-.12-1.46-.72-1.69-.8-.23-.08-.4-.12-.56.12-.16.25-.64.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.06-.39-2.02-1.24-.75-.67-1.25-1.5-1.4-1.75-.14-.25-.01-.39.1-.5.1-.1.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.36-.77-1.86-.2-.48-.4-.41-.56-.42h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.4 1.01 2.57.12.16 1.75 2.67 4.25 3.75.6.26 1.06.41 1.42.53.6.19 1.15.16 1.58.1.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.28z" />
              </svg>
            </span>
            <span>WhatsApp</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name={`notification-preference-${formKey}`}
              value="viber"
              checked={notificationPreference === "viber"}
              onChange={() => setNotificationPreference("viber")}
            />
            <span className="radio-icon viber" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M19.5 3.5A9.5 9.5 0 0 0 4.7 15.2L3 21l6.1-1.6A9.5 9.5 0 1 0 19.5 3.5zm-7.6 15.6a7.7 7.7 0 0 1-3.9-1l-.3-.2-3 .8.8-2.9-.2-.3a7.7 7.7 0 1 1 6.6 3.6zm4-5.1c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.4.1-.1.2-.5.7-.6.8-.1.1-.2.2-.4.1-.2-.1-.9-.3-1.7-1.1-.6-.5-1-1.2-1.1-1.4-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2.2-.3.1-.1.1-.2 0-.3-.1-.1-.5-1.1-.7-1.5-.2-.4-.3-.3-.4-.3h-.4c-.1 0-.3.1-.5.3-.2.2-.7.7-.7 1.7s.7 2 1 2.2c.2.2 1.4 2.2 3.4 3.1.5.2.9.3 1.2.4.5.1.9.1 1.2.1.4-.1 1.2-.5 1.4-1 .2-.5.2-.9.1-1 0-.1-.2-.1-.4-.2z" />
              </svg>
            </span>
            <span>Viber</span>
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
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M21.9 4.6c.2-.8-.6-1.4-1.3-1.1L2.9 10.3c-.9.3-.9 1.6 0 1.9l4.8 1.5 1.8 5.4c.2.7 1 .9 1.5.5l2.6-2.3 4.9 3.6c.6.4 1.4.1 1.6-.7l2.4-15.3zm-4 1.9-9.3 8.2c-.1.1-.2.2-.2.4l-.2 2.2-1.1-3.6 10.8-6.4c.4-.2.8.3.6.6z" />
              </svg>
            </span>
            <span>Telegram</span>
          </label>
        </div>
      </div>

      <button type="submit" className="btn primary" disabled={sending}>
        {sending ? "Slanje..." : "Pošalji upit"}
      </button>

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
