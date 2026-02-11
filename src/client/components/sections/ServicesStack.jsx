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
          src="/parts.jpg"
          alt="Auto delovi spremni za ugradnju"
          loading="lazy"
        />
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
          src="/mechanic-services.jpg"
          alt="Mehaničar u auto servisu"
          loading="lazy"
        />
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
          src="/tow.jpeg"
          alt="Šlep služba na putu"
          loading="lazy"
        />
      </div>
    </div>
  </section>
);

export default ServicesStack;
