import React, { useEffect, useState } from "react";

const SiteHeader = () => {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    localStorage.setItem("theme", "light");
    setTheme("light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <header className="site-header">
      <nav className="nav" aria-label="Glavna navigacija">
        <a className="logo" href="#top">
          <img className="logo-mark" src="/logo.png" alt="TikTak Delovi logo" />
        </a>
        <div className="nav-links">
          <a href="#how">Kako radi</a>
          <a href="#buyer-form">Auto delovi</a>
          <a href="#servis-form">Servis</a>
          <a href="#roadside-form">Pomoć na putu</a>
        </div>
        <div className="nav-actions">
          <a className="nav-cta" href="#buyer-form">
            Traži deo
          </a>
        </div>
      </nav>
    </header>
  );
};

export default SiteHeader;
