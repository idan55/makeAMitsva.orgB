export function normalizeIsraeliPhone(input) {
  if (!input) return "";

  let digits = String(input).replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("972")) digits = digits.slice(3);
  while (digits.startsWith("0")) digits = digits.slice(1);

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
