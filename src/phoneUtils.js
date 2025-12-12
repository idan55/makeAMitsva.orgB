// Basic Israeli mobile normalization (mobile only, matches server logic)
export function normalizeIsraeliPhone(input) {
  if (!input) return "";

  let digits = String(input).replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2); // drop international prefix
  if (digits.startsWith("972")) digits = digits.slice(3); // drop country code
  while (digits.startsWith("0")) digits = digits.slice(1); // drop leading zeros

  // Only mobile: 5XXXXXXXX (9 digits after stripping leading zeros)
  if (!/^5\d{8}$/.test(digits)) return "";

  return "+972" + digits;
}

export function isValidIsraeliPhone(input) {
  return Boolean(normalizeIsraeliPhone(input));
}

export function formatPhoneForDisplay(input) {
  const normalized = normalizeIsraeliPhone(input);
  return normalized || input || "";
}
