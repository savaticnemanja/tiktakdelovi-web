import React, { useEffect, useState } from "react";
import { MAKES, MODELS } from "./data/vehicleData";
import { YEARS, FUEL_TYPES, CHASSIS_TYPES, firstValue } from "./data/formOptions";

const parseJson = async (res) => {
  try {
    return await res.json();
  } catch (err) {
    return null;
  }
};

export default function App() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const sellerEmail = "partneri@tiktakdelovi.rs";

  const [customerNumber, setCustomerNumber] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [notificationPreference, setNotificationPreference] = useState("whatsapp");
  const [make, setMake] = useState(firstValue(MAKES));
  const [model, setModel] = useState("");
  const [year, setYear] = useState(firstValue(YEARS));
  const [fuelType, setFuelType] = useState(firstValue(FUEL_TYPES));
  const [chassis, setChassis] = useState(firstValue(CHASSIS_TYPES));
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const [sellerName, setSellerName] = useState("");
  const [sellerNumber, setSellerNumber] = useState("");
  const [sellerStatus, setSellerStatus] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      const normalizedCustomer = `+381${customerNumber.replace(/\s+/g, "")}`;
      const res = await fetch(`${API_BASE}/api/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerNumber: normalizedCustomer,
          bidMessage,
          notificationPreference,
          make,
          model,
          year,
          fuelType,
          chassis,
        }),
      });

      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.error || "Nepoznata greška");
      const sentCount = Array.isArray(data?.sent) ? data.sent.length : 0;
      const templateLabel = data?.template ? ` Šablon: ${data.template}.` : "";
      setStatus({
        ok: true,
        text: sentCount
          ? `Poslato ${sentCount} prodavcu(a).${templateLabel}`
          : `Poslato.${templateLabel}`,
      });
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  };

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

  useEffect(() => {
    setModelsLoading(true);
    const options = Array.isArray(MODELS?.[make]) ? MODELS[make] : [];
    setModels(options);
    setModel(firstValue(options));
    setModelsLoading(false);
  }, [make]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { root: null, threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="page">
      <header className="site-header">
        <nav className="nav" aria-label="Glavna navigacija">
          <a className="logo" href="#top">
            TikTak Delovi
          </a>
          <div className="nav-links">
            <a href="#how">Kako radi</a>
            <a href="#testimonials">Utisci</a>
            <a href="#buyer-form">Upit</a>
            <a href="#seller-form">Partneri</a>
          </div>
          <a className="nav-cta" href="#buyer-form">
            Traži deo
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-media" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=2000&q=80"
              alt=""
              loading="lazy"
            />
            <div className="hero-overlay" />
            <div className="hero-content stagger" data-reveal="stagger">
              <p className="eyebrow">Brzo. Precizno. Lokalno.</p>
              <h1>
                Najbrži put do pravog auto dela — bez deset poziva i nagađanja.
              </h1>
              <p className="hero-copy">
                Pošaljite jedan upit, a TikTak Delovi ga odmah prosleđuje
                prodavcima. Dobijate ponude, birate najbolju i završavate posao
                bez gubljenja vremena.
              </p>
              <div className="hero-actions">
                <a className="btn primary" href="#buyer-form">
                  Traži deo
                </a>
                <a className="btn ghost" href="#seller-form">
                  Registrujte se kao prodavac
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="section steps reveal" data-reveal="fade">
          <div className="section-heading">
            <h2>Kako TikTak Delovi radi</h2>
            <p>Jednostavan tok u četiri jasna koraka.</p>
          </div>
          <div className="step-grid stagger" data-reveal="stagger">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3>Pošaljite upit</h3>
              <p>Unesite podatke o vozilu i delu koji tražite.</p>
            </div>
            <div className="step-card">
              <span className="step-number">02</span>
              <h3>Prodavci odgovaraju</h3>
              <p>Upit stiže proverenim prodavcima iz vaše mreže.</p>
            </div>
            <div className="step-card">
              <span className="step-number">03</span>
              <h3>Uporedite ponude</h3>
              <p>Vidite cenu, stanje i rok isporuke na jednom mestu.</p>
            </div>
            <div className="step-card">
              <span className="step-number">04</span>
              <h3>Preuzmite deo</h3>
              <p>Dogovorite isporuku ili lično preuzimanje.</p>
            </div>
          </div>
        </section>

        <section
          id="buyer-form"
          className="section form-section reveal"
          data-reveal="fade"
        >
          <div className="form-grid">
            <div className="form-info">
              <h2>Pošaljite upit za deo</h2>
              <p>
                Popunite formu i napišite što više detalja. Tako prodavci brže
                proveravaju dostupnost i cenu.
              </p>
              <ul>
                <li>Tačan opis dela i broj komada.</li>
                <li>Napomena o hitnosti i isporuci.</li>
                <li>Kontakt broj u međunarodnom formatu.</li>
              </ul>
              <div className="info-callout">
                <strong>Pro tip:</strong> Ako imate kataloški broj, unesite ga u
                poruku.
              </div>
            </div>

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
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  >
                    {YEARS.map((y) => (
                      <option key={y || "any"} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Vrsta goriva
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    required
                  >
                    {FUEL_TYPES.map((fuel) => (
                      <option key={fuel || "placeholder"} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Tip karoserije
                  <select
                    value={chassis}
                    onChange={(e) => setChassis(e.target.value)}
                    required
                  >
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
                  placeholder="Npr. far za Honda Civic 2018, levo, hitno"
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
                  Kontaktiraćemo vas putem WhatsApp-a, gde možete prihvatiti ili
                  odbiti ponudu.
                </span>
              </label>

              <label className="checkbox-field">
                <input type="checkbox" required />
                <span>
                  Saglasan/na sam da budem kontaktiran/a putem WhatsApp-a radi
                  dostave ponuda.
                </span>
              </label>

              <div className="radio-field">
                <span className="radio-label">Preferirani kanal obaveštenja</span>
                <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="notification-preference"
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
                    name="notification-preference"
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
                    name="notification-preference"
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
                <div
                  className={`status ${status.ok ? "ok" : "err"}`}
                  role="status"
                  aria-live="polite"
                >
                  {status.ok ? "OK" : "GREŠKA"} {status.text}
                </div>
              )}
            </form>
          </div>
        </section>

        <section id="testimonials" className="section testimonials">
          <div className="section-inner">
            <div className="section-heading reveal" data-reveal="fade">
              <h2>Iskustva kupaca i prodavaca</h2>
              <p>Realne poruke iz mreže TikTak Delovi.</p>
            </div>
            <div className="testimonial-grid stagger" data-reveal="stagger">
              <article className="testimonial">
                <p>
                  “Za 10 minuta sam imao tri ponude. Uzeo sam deo koji je bio na
                  lageru.”
                </p>
                <div className="testimonial-meta">
                  <span>Marko · Novi Sad</span>
                  <span>Honda Civic</span>
                </div>
              </article>
              <article className="testimonial">
                <p>
                  “Kupci nam stižu sa jasnim zahtevima. Manje poziva, više prodaje.”
                </p>
                <div className="testimonial-meta">
                  <span>Ivana · Auto Line</span>
                  <span>Beograd</span>
                </div>
              </article>
              <article className="testimonial">
                <p>
                  “Nisam znao tačan kataloški broj, ali su me brzo uputili na pravi
                  deo.”
                </p>
                <div className="testimonial-meta">
                  <span>Milan · Kragujevac</span>
                  <span>Honda CR-V</span>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

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
    </div>
  );
}
