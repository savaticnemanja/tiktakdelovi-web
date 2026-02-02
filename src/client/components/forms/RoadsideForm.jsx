import React from "react";

const RoadsideForm = ({ form }) => {
  const {
    customerName,
    setCustomerName,
    customerNumber,
    setCustomerNumber,
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

      {status && (
        <div className={`status ${status.ok ? "ok" : "err"}`} role="status" aria-live="polite">
          {status.ok ? "OK" : "GREŠKA"} {status.text}
        </div>
      )}
    </form>
  );
};

export default RoadsideForm;
