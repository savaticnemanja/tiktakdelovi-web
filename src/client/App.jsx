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
  const [sellerShop, setSellerShop] = useState("");
  const [sellerNumber, setSellerNumber] = useState("");
  const [sellerCity, setSellerCity] = useState("");
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
    const body = `Ime: ${sellerName}\nProdavnica: ${sellerShop}\nTelefon: ${sellerNumber}\nGrad: ${sellerCity}`;
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
            <div className="hero-badge reveal" data-reveal="fade">
              Mreža proverenih prodavaca
            </div>
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
                  Registruj prodavnicu
                </a>
              </div>
              <div className="hero-metrics">
                <div>
                  <strong>2–5 min</strong>
                  <span>do prve ponude</span>
                </div>
                <div>
                  <strong>Jedan formular</strong>
                  <span>više prodavaca</span>
                </div>
                <div>
                  <strong>0% provizije</strong>
                  <span>za kupce</span>
                </div>
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
              <p>Upit stiže proverеним prodavcima iz vaše mreže.</p>
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
            <h4>Registrujte prodavnicu</h4>
            <p>
              Unesite osnovne podatke i kliknite “Pošalji prijavu”. Otvoriće se
              vaš email klijent sa pripremljenom porukom.
            </p>
            <form className="stagger" data-reveal="stagger" onSubmit={registerSeller}>
              <div className="field-grid two">
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
                  Naziv prodavnice
                  <input
                    value={sellerShop}
                    onChange={(e) => setSellerShop(e.target.value)}
                    placeholder="Auto Line"
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
                <label>
                  Grad
                  <input
                    value={sellerCity}
                    onChange={(e) => setSellerCity(e.target.value)}
                    placeholder="Beograd"
                    required
                  />
                </label>
              </div>
              <button type="submit" className="btn light">
                Pošalji prijavu
              </button>
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
