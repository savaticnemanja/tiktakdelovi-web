import React from "react";
import "./App.css";
import SiteHeader from "./components/layout/SiteHeader";
import HeroSection from "./components/sections/HeroSection";
import StepsSection from "./components/sections/StepsSection";
import ServicesStack from "./components/sections/ServicesStack";
import TestimonialsSection from "./components/sections/TestimonialsSection";
import SiteFooter from "./components/sections/SiteFooter";
import { useServiceForm } from "./hooks/useServiceForm";
import { useRoadsideForm } from "./hooks/useRoadsideForm";
import { useRevealAnimations } from "./hooks/useRevealAnimations";

export default function App() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const partsForm = useServiceForm({ apiBase: API_BASE });
  const serviceForm = useServiceForm({
    apiBase: API_BASE,
    apiPath: "/api/mechanic-request",
    recipientLabel: "servisu(a)",
  });
  const roadsideForm = useRoadsideForm({ apiBase: API_BASE });

  useRevealAnimations();

  return (
    <div className="page">
      <SiteHeader />

      <main id="top">
        <HeroSection />
        <StepsSection />
        <ServicesStack
          partsForm={partsForm}
          serviceForm={serviceForm}
          roadsideForm={roadsideForm}
        />
        <TestimonialsSection />
      </main>

      <SiteFooter />
    </div>
  );
}
