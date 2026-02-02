import React from "react";

const SiteHeader = () => (
  <header className="site-header">
    <nav className="nav" aria-label="Glavna navigacija">
      <a className="logo" href="#top">
        TikTak Delovi
      </a>
      <div className="nav-links">
        <a href="#how">Kako radi</a>
        <a href="#buyer-form">Auto delovi</a>
        <a href="#servis-form">Servis</a>
        <a href="#roadside-form">Pomoć na putu</a>
      </div>
      <a className="nav-cta" href="#buyer-form">
        Traži deo
      </a>
    </nav>
  </header>
);

export default SiteHeader;
