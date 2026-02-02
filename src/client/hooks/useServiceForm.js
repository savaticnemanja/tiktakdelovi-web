import { useEffect, useState } from "react";
import { MAKES, MODELS } from "../data/vehicleData";
import { YEARS, FUEL_TYPES, CHASSIS_TYPES, firstValue } from "../data/formOptions";
import { parseJson } from "../utils/api";

export const useServiceForm = ({ apiBase, serviceLabel }) => {
  const [customerNumber, setCustomerNumber] = useState("");
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
    e.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      const normalizedCustomer = `+381${customerNumber.replace(/\s+/g, "")}`;
      const trimmedMessage = String(bidMessage || "").trim();
      const labeledMessage = serviceLabel
        ? `[${serviceLabel}] ${trimmedMessage}`
        : trimmedMessage;
      const res = await fetch(`${apiBase}/api/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerNumber: normalizedCustomer,
          bidMessage: labeledMessage,
          notificationPreference,
          make,
          model,
          year,
          fuelType,
          chassis,
        }),
      });

      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.error || "Nepoznata greška");
      const sentCount = Array.isArray(data?.sent) ? data.sent.length : 0;
      const templateLabel = data?.template ? ` Šablon: ${data.template}.` : "";
      setStatus({
        ok: true,
        text: sentCount
          ? `Poslato ${sentCount} prodavcu(a).${templateLabel}`
          : `Poslato.${templateLabel}`,
        bidId: data?.bidId || null,
      });
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
