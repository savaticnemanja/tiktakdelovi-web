import { useEffect, useState } from "react";
import { MAKES, MODELS } from "../data/vehicleData";
import { YEARS, FUEL_TYPES, CHASSIS_TYPES, firstValue } from "../data/formOptions";
import { parseJson } from "../utils/api";
import { ensureFormValid, normalizeSerbianPhoneNumber } from "../utils/form";

export const useServiceForm = ({
  apiBase,
  apiPath = "/api/request",
  recipientLabel = "prodavcu(a)",
  includeCity = true,
}) => {
  const [customerNumber, setCustomerNumber] = useState("");
  const [city, setCity] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [notificationPreference, setNotificationPreference] = useState("whatsapp");
  const [make, setMake] = useState(firstValue(MAKES));
  const [model, setModel] = useState("");
  const [year, setYear] = useState(firstValue(YEARS));
  const [fuelType, setFuelType] = useState(firstValue(FUEL_TYPES));
  const [chassis, setChassis] = useState(firstValue(CHASSIS_TYPES));
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const send = async (e) => {
    if (!ensureFormValid(e)) return;

    setSending(true);
    setStatus(null);

    try {
      const normalizedCustomer = normalizeSerbianPhoneNumber(customerNumber);
      const trimmedMessage = String(bidMessage || "").trim();
      const payload = {
        customerNumber: normalizedCustomer,
        bidMessage: trimmedMessage,
        notificationPreference,
        make,
        model,
        year,
        fuelType,
        chassis,
      };
      if (includeCity) {
        payload.city = city;
      }
      const res = await fetch(`${apiBase}${apiPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.error || "Nepoznata greška");
      const sentCount = Array.isArray(data?.sent) ? data.sent.length : 0;
      setStatus({
        ok: true,
        text: sentCount
          ? `Hvala! Prosledili smo upit ${recipientLabel}. Javićemo se uskoro.`
          : "Hvala! Vaš upit je uspešno poslat. Javićemo se uskoro.",
        bidId: data?.bidId || null,
      });
      setCustomerNumber("");
      if (includeCity) {
        setCity("");
      }
      setBidMessage("");
      setMake(firstValue(MAKES));
      setModel("");
      setYear(firstValue(YEARS));
      setFuelType(firstValue(FUEL_TYPES));
      setChassis(firstValue(CHASSIS_TYPES));
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    setModelsLoading(true);
    const options = Array.isArray(MODELS?.[make]) ? MODELS[make] : [];
    setModels(options);
    setModel(firstValue(options));
    setModelsLoading(false);
  }, [make]);

  return {
    customerNumber,
    setCustomerNumber,
    city,
    setCity,
    bidMessage,
    setBidMessage,
    notificationPreference,
    setNotificationPreference,
    make,
    setMake,
    model,
    setModel,
    year,
    setYear,
    fuelType,
    setFuelType,
    chassis,
    setChassis,
    models,
    modelsLoading,
    sending,
    status,
    send,
  };
};
