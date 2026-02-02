import React from "react";

const TestimonialsSection = () => (
  <section id="testimonials" className="section testimonials">
    <div className="section-inner">
      <div className="section-heading reveal" data-reveal="fade">
        <h2>Iskustva kupaca i prodavaca</h2>
        <p>Realne poruke iz mreže TikTak Delovi.</p>
      </div>
      <div className="testimonial-grid stagger" data-reveal="stagger">
        <article className="testimonial">
          <p>
            “Za 10 minuta sam imao tri ponude. Uzeo sam deo koji je bio na lageru.”
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
            “Nisam znao tačan kataloški broj, ali su me brzo uputili na pravi deo.”
          </p>
          <div className="testimonial-meta">
            <span>Milan · Kragujevac</span>
            <span>Honda CR-V</span>
          </div>
        </article>
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
