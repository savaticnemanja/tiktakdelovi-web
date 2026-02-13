import React, { useEffect } from "react";

const SiteHeader = () => {
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    localStorage.setItem("theme", "light");
  }, []);

  return (
    <header className="site-header">
      <nav className="nav" aria-label="Glavna navigacija">
        <a className="logo" href="/">
          <img className="logo-mark" src="/logo.png" alt="TikTak Delovi logo" />
        </a>
        <div className="nav-links">
          <a href="/#how">Kako radi</a>
          <a href="/auto-delovi#buyer-form">Auto delovi</a>
          <a href="/auto-servis#servis-form">Servis</a>
          <a href="/pomoc-na-putu#roadside-form">Pomoć na putu</a>
        </div>
        <div className="nav-actions">
          <a className="nav-cta" href="/auto-delovi#buyer-form">
            Traži deo
          </a>
        </div>
      </nav>
    </header>
  );
};

export default SiteHeader;
