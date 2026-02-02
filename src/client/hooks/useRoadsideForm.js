import { useState } from "react";
import { parseJson } from "../utils/api";

export const useRoadsideForm = ({ apiBase, serviceLabel }) => {
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [location, setLocation] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [serviceType, setServiceType] = useState("pomoc_na_putu");
  const [destination, setDestination] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      const normalizedCustomer = `+381${customerNumber.replace(/\s+/g, "")}`;
      const detailsParts = [
        customerName ? `Ime: ${customerName.trim()}` : "",
        customerNumber ? `Telefon: +381${customerNumber.replace(/\s+/g, "")}` : "",
        issueDescription ? `Opis: ${issueDescription.trim()}` : "",
      ].filter(Boolean);
      const details = detailsParts.join(" / ");
      const res = await fetch(`${apiBase}/api/tow-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customerName,
          customerNumber: normalizedCustomer,
          serviceType,
          locationFrom: location,
          locationTo: serviceType === "slep_sluzba" ? destination : "",
          details,
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
    location,
    setLocation,
    issueDescription,
    setIssueDescription,
    serviceType,
    setServiceType,
    destination,
    setDestination,
    sending,
    status,
    send,
  };
};
