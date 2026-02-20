import { useState } from "react";
import { parseJson } from "../utils/api";
import { ensureFormValid, normalizeSerbianPhoneNumber } from "../utils/form";

export const useRoadsideForm = ({ apiBase }) => {
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
      if (!res.ok) {
        if (res.status === 429 && data?.code === "BUYER_INQUIRY_THROTTLED") {
          const retryAfterSeconds = Number(data?.retryAfterSeconds);
          const waitSeconds = Number.isFinite(retryAfterSeconds)
            ? Math.max(1, Math.ceil(retryAfterSeconds))
            : 30;
          throw new Error(`Sacekajte ${waitSeconds} sekundi pre novog zahteva.`);
        }
        throw new Error(data?.error || "Nepoznata greska");
      }
      const sentCount = Array.isArray(data?.sent) ? data.sent.length : 0;
      setStatus({
        ok: true,
        text: sentCount
          ? "Hvala! Prosledili smo zahtev. Operater će vas uskoro kontaktirati."
          : "Hvala! Vaš zahtev je uspešno poslat. Javićemo se uskoro.",
        bidId: data?.bidId || null,
      });
      setCustomerNumber("");
      setCity("");
      setLocation("");
      setIssueDescription("");
      setServiceType("pomoc_na_putu");
      setDestination("");
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  };

  return {
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
