import React, { useState } from "react";
import { CITY_OPTIONS } from "../../../shared/cities.js";
import { normalizeSerbianPhoneNumber } from "../../utils/form";

const SiteFooter = () => {
  const [sellerName, setSellerName] = useState("");
  const [sellerNumber, setSellerNumber] = useState("");
  const [sellerType, setSellerType] = useState("prodavac");
  const [sellerCity, setSellerCity] = useState("");
  const [sellerStatus, setSellerStatus] = useState(null);
  const [sellerSending, setSellerSending] = useState(false);

  const registerSeller = async (e) => {
    e.preventDefault();
    if (sellerSending) return;
    setSellerSending(true);
    setSellerStatus(null);
    try {
      const normalizedNumber = normalizeSerbianPhoneNumber(sellerNumber);
      const res = await fetch("/api/partnership-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerName: sellerName,
          partnerContact: normalizedNumber,
          partnerType: sellerType,
          partnerCity: sellerCity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Nepoznata greška");
      setSellerStatus({ ok: true, text: "Prijava je poslata." });
    } catch (err) {
      setSellerStatus({ ok: false, text: err.message });
    } finally {
      setSellerSending(false);
    }
  };

  return (
    <footer className="footer" id="seller-form">
      <div className="footer-inner">
        <div className="footer-grid reveal" data-reveal="fade">
          <div className="footer-brand">
            <h3>TikTak Delovi</h3>
            <p>
              Platforma koja povezuje kupce i prodavce auto delova bez gubljenja
              vremena.
            </p>
            <div className="footer-links">
              <a href="#how">Kako radi</a>
              <a href="#buyer-form">Pošalji upit</a>
              <a href="#top">Na vrh</a>
            </div>
          </div>

          <div className="footer-form">
            <h4>Registrujte se kao prodavac / serviser / pomoć na putu</h4>
            <p>
              Unesite osnovne podatke i kliknite “Pošalji prijavu”.
            </p>
            <form
              className="form-card stagger seller-form"
              data-reveal="stagger"
              onSubmit={registerSeller}
            >
              <div className="field-grid two seller-grid">
                <label>
                  Ime i prezime
                  <input
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="Ivana Marković"
                    required
                  />
                </label>
                <label>
                  Vrsta partnera
                  <select
                    value={sellerType}
                    onChange={(e) => setSellerType(e.target.value)}
                    required
                  >
                    <option value="prodavac">Prodavac</option>
                    <option value="serviser">Serviser</option>
                    <option value="pomoc_na_putu">Pomoć na putu</option>
                  </select>
                </label>
                <label>
                  Grad
                  <select
                    value={sellerCity}
                    onChange={(e) => setSellerCity(e.target.value)}
                    required
                  >
                    <option value="">Izaberite grad</option>
                    {CITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Telefon
                  <div className="phone-field">
                    <span className="phone-prefix">+381</span>
                    <input
                      value={sellerNumber}
                      onChange={(e) => setSellerNumber(e.target.value)}
                      placeholder="64 123 456"
                      inputMode="tel"
                      required
                    />
                  </div>
                </label>
                <div className="seller-submit">
                  <button type="submit" className="btn light" disabled={sellerSending}>
                    {sellerSending ? "Slanje..." : "Pošalji prijavu"}
                  </button>
                </div>
              </div>
              {sellerStatus && (
                <div
                  className={`status ${sellerStatus.ok ? "ok" : "err"}`}
                  role="status"
                  aria-live="polite"
                >
                  {sellerStatus.text}
                </div>
              )}
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © 2026 TikTak Delovi. Sva prava zadržana. Razvio{" "}
            <a className="footer-credit" href="https://nemanjas.dev">
              nemanjas.dev
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
