import React from "react";
import RequestForm from "../forms/RequestForm";
import RoadsideForm from "../forms/RoadsideForm";

const ServicesStack = ({ partsForm, serviceForm, roadsideForm }) => (
  <section id="services" className="section services-stack">
    <div id="buyer-form" className="service-row reveal" data-reveal="fade">
      <div className="service-panel">
        <div className="service-header">
          <p className="eyebrow">Auto delovi</p>
          <h2>Najbrži upit za auto deo</h2>
          <p>
            Pošaljite tačne podatke o vozilu i delu, a mi ćemo odmah proslediti upit
            prodavcima iz mreže.
          </p>
        </div>
        <RequestForm
          form={partsForm}
          formKey="parts"
          messagePlaceholder="Npr. far za Honda Civic 2018, levo, hitno"
        />
      </div>
      <div className="service-media">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80"
          alt="Auto delovi spremni za ugradnju"
          loading="lazy"
        />
        <div className="media-overlay" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false" className="media-icon">
            <path d="M10 2h4v3h-4zM8 5h8v2H8zM10 7h4v2h-4zM8 9h8v2H8zM10 11h4v2h-4zM8 13h8v2H8zM10 15h4v7h-4z" />
          </svg>
        </div>
      </div>
    </div>

    <div id="servis-form" className="service-row reverse reveal" data-reveal="fade">
      <div className="service-panel">
        <div className="service-header">
          <p className="eyebrow">Servis</p>
          <h2>Rezervišite servis bez čekanja</h2>
          <p>
            Opišite problem ili intervenciju koja vam je potrebna. Servisi se javljaju
            sa terminima i ponudom.
          </p>
        </div>
        <RequestForm
          form={serviceForm}
          formKey="servis"
          messagePlaceholder="Npr. mali servis, zamena ulja i filtera, 120.000km"
        />
      </div>
      <div className="service-media">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80"
          alt="Mehaničar u auto servisu"
          loading="lazy"
        />
        <div className="media-overlay" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false" className="media-icon">
            <path d="M5.5 11l1.6-4.2C7.6 5.8 8.5 5 9.6 5h4.8c1.1 0 2 .8 2.4 1.8L18.5 11H20c1.1 0 2 .9 2 2v3h-2a2 2 0 0 1-4 0H8a2 2 0 0 1-4 0H2v-3c0-1.1.9-2 2-2h1.5zM7.3 11h9.4l-1.1-2.8c-.1-.2-.4-.5-.8-.5H9.2c-.4 0-.7.2-.8.5L7.3 11zM6 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm12 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
          </svg>
        </div>
      </div>
    </div>

    <div id="roadside-form" className="service-row reveal" data-reveal="fade">
      <div className="service-panel">
        <div className="service-header">
          <p className="eyebrow">Pomoć na putu</p>
          <h2>Brza pomoć i šlep služba</h2>
          <p>
            Pošaljite lokaciju i kratak opis problema. Pomoć na putu vas kontaktira
            odmah.
          </p>
        </div>
        <RoadsideForm form={roadsideForm} />
      </div>
      <div className="service-media">
        <img
          src="https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80"
          alt="Šlep služba na putu"
          loading="lazy"
        />
        <div className="media-overlay" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false" className="media-icon">
            <path d="M5.5 11l1.6-4.2C7.6 5.8 8.5 5 9.6 5h4.8c1.1 0 2 .8 2.4 1.8L18.5 11H20c1.1 0 2 .9 2 2v3h-2a2 2 0 0 1-4 0H8a2 2 0 0 1-4 0H2v-3c0-1.1.9-2 2-2h1.5zM7.3 11h9.4l-1.1-2.8c-.1-.2-.4-.5-.8-.5H9.2c-.4 0-.7.2-.8.5L7.3 11zM6 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm12 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
          </svg>
        </div>
      </div>
    </div>
  </section>
);

export default ServicesStack;
