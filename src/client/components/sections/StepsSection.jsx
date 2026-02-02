import React from "react";

const StepsSection = () => (
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
);

export default StepsSection;
