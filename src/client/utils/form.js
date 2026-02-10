export const ensureFormValid = (event) => {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return true;
  if (form.checkValidity()) return true;
  const firstInvalid = form.querySelector(":invalid");
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalid.focus({ preventScroll: true });
  }
  if (form.reportValidity) {
    form.reportValidity();
  }
  return false;
};

export const normalizeSerbianPhoneNumber = (value) =>
  `+381${String(value || "").replace(/\s+/g, "")}`;
