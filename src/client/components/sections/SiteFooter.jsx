import React, { useState } from "react";

const SiteFooter = () => {
  const sellerEmail = "partneri@tiktakdelovi.rs";
  const [sellerName, setSellerName] = useState("");
  const [sellerNumber, setSellerNumber] = useState("");
  const [sellerStatus, setSellerStatus] = useState(null);

  const registerSeller = (e) => {
    e.preventDefault();
    const subject = "Prijava prodavnice - TikTak Delovi";
    const body = `Ime: ${sellerName}\nTelefon: ${sellerNumber}`;
    const mailto = `mailto:${sellerEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setSellerStatus({ ok: true, text: "Otvoren je email klijent za prijavu." });
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
            <h4>Registrujte se kao prodavac</h4>
            <p>
              Unesite osnovne podatke i kliknite “Pošalji prijavu”. Otvoriće se
              vaš email klijent sa pripremljenom porukom.
            </p>
            <form
              className="stagger seller-form"
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
                  Telefon
                  <input
                    value={sellerNumber}
                    onChange={(e) => setSellerNumber(e.target.value)}
                    placeholder="+381..."
                    required
                  />
                </label>
                <div className="seller-submit">
                  <button type="submit" className="btn light">
                    Pošalji prijavu
                  </button>
                </div>
              </div>
              {sellerStatus && (
                <div className="status ok" role="status" aria-live="polite">
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
