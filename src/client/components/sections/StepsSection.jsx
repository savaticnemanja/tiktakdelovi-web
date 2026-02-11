import React from "react";

const StepsSection = () => (
  <section id="how" className="section steps reveal" data-reveal="fade">
    <div className="section-heading">
      <h2>Delovi, servis i šlep — jednostavno</h2>
      <p>Jedan upit, tri usluge, jasni sledeći koraci.</p>
    </div>
    <div className="step-grid stagger" data-reveal="stagger">
      <div className="step-card">
        <span className="step-number">01</span>
        <h3>Pošaljite detalje</h3>
        <p>Unesite podatke o vozilu i izaberite polovan deo, servis ili šlep.</p>
      </div>
      <div className="step-card">
        <span className="step-number">02</span>
        <h3>Pravi ljudi odgovaraju</h3>
        <p>Upit ide proverenim prodavcima delova, servisima ili šlep službama.</p>
      </div>
      <div className="step-card">
        <span className="step-number">03</span>
        <h3>Uporedite ponude</h3>
        <p>Vidite cenu, stanje i rok ili termin intervencije na jednom mestu.</p>
      </div>
      <div className="step-card">
        <span className="step-number">04</span>
        <h3>Dogovorite realizaciju</h3>
        <p>Preuzmite deo, zakažite servis ili organizujte šlep brzo i direktno.</p>
      </div>
    </div>
  </section>
);

export default StepsSection;
