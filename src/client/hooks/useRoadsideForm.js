import { useState } from "react";
import { parseJson } from "../utils/api";
import { ensureFormValid, normalizeSerbianPhoneNumber } from "../utils/form";

export const useRoadsideForm = ({ apiBase }) => {
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [serviceType, setServiceType] = useState("pomoc_na_putu");
  const [destination, setDestination] = useState("");
  const [notificationPreference, setNotificationPreference] = useState("whatsapp");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const send = async (e) => {
    if (!ensureFormValid(e)) return;

    setSending(true);
    setStatus(null);

    try {
      const normalizedCustomer = normalizeSerbianPhoneNumber(customerNumber);
      const details = issueDescription ? issueDescription.trim() : "";
      const res = await fetch(`${apiBase}/api/tow-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customerName,
          customerNumber: normalizedCustomer,
          city,
          serviceType,
          locationFrom: location,
          locationTo: serviceType === "slep_sluzba" ? destination : "",
          details,
          notificationPreference,
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

  return {
    customerName,
    setCustomerName,
    customerNumber,
    setCustomerNumber,
    city,
    setCity,
    location,
    setLocation,
    issueDescription,
    setIssueDescription,
    serviceType,
    setServiceType,
    destination,
    setDestination,
    notificationPreference,
    setNotificationPreference,
    sending,
    status,
    send,
  };
};
