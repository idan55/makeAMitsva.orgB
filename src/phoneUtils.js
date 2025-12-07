// Basic Israeli phone normalization used on the client to match server logic.
export function normalizeIsraeliPhone(input) {
  if (!input) return "";

  let digits = String(input).replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2); // drop international prefix
  if (digits.startsWith("972")) digits = digits.slice(3); // drop country code
  if (digits.startsWith("0")) digits = digits.slice(1); // drop local leading zero

  const validLocal = /^[2-9]\d{7,8}$/.test(digits); // landlines (8) or mobile (9)
  if (!validLocal) return "";

  return "+972" + digits;
}

export function isValidIsraeliPhone(input) {
  return Boolean(normalizeIsraeliPhone(input));
}

export function formatPhoneForDisplay(input) {
  const normalized = normalizeIsraeliPhone(input);
  return normalized || input || "";
}
