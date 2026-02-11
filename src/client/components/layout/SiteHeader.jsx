import React, { useEffect, useState } from "react";

const SiteHeader = () => {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.dataset.theme = stored;
      setTheme(stored);
    } else {
      document.documentElement.removeAttribute("data-theme");
      setTheme("system");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  const toggleLabel = theme === "dark" ? "Svetla tema" : "Tamna tema";
  const isDark = theme === "dark";

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
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={toggleLabel}
            title={toggleLabel}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                <path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1zm0 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm7.5-3.5a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V13a1 1 0 0 1 1-1zm-15 0a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V13a1 1 0 0 1 1-1zM6.2 6.2a1 1 0 0 1 1.4 0l1 1a1 1 0 1 1-1.4 1.4l-1-1a1 1 0 0 1 0-1.4zm10.2 10.2a1 1 0 0 1 1.4 0l1 1a1 1 0 1 1-1.4 1.4l-1-1a1 1 0 0 1 0-1.4zM18.8 6.2a1 1 0 0 1 0 1.4l-1 1a1 1 0 1 1-1.4-1.4l1-1a1 1 0 0 1 1.4 0zM7.4 16.4a1 1 0 0 1 0 1.4l-1 1a1 1 0 1 1-1.4-1.4l1-1a1 1 0 0 1 1.4 0z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                <path d="M20.8 15.4A8.5 8.5 0 1 1 8.6 3.2a7 7 0 1 0 12.2 12.2z" />
              </svg>
            )}
          </button>
          <a className="nav-cta" href="#buyer-form">
            Traži deo
          </a>
        </div>
      </nav>
    </header>
  );
};

export default SiteHeader;
