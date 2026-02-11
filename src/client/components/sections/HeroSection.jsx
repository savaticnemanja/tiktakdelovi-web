import React from "react";

const HeroSection = () => (
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
        <h1>Najbrži put do pravog auto dela — bez deset poziva i nagađanja.</h1>
        <p className="hero-copy">
          Pošaljite jedan upit, a TikTak Delovi ga odmah prosleđuje prodavcima.
          Dobijate ponude, birate najbolju i završavate posao bez gubljenja vremena.
        </p>
        <div className="hero-actions">
          <a className="btn primary" href="#buyer-form">
            Polovni delovi
          </a>
          <a className="btn ghost" href="#servis-form">
            Zakaži servis
          </a>
          <a className="btn light" href="#roadside-form">
            Pozovi šlep
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
