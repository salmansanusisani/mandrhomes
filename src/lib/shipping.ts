export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Federal Capital Territory (Abuja)",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

const ABUJA_ALIASES = new Set([
  "abuja",
  "fct",
  "f.c.t",
  "federal capital territory",
  "federal capital territory abuja",
  "federal capital territory (abuja)",
]);

export function isAbujaDelivery(state?: string | null) {
  const normalized = (state ?? "")
    .toLowerCase()
    .trim()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ");
  return ABUJA_ALIASES.has(normalized) || normalized.includes("abuja") || normalized === "fct";
}

export function deliveryFeeForState(
  state: string | null | undefined,
  subtotal: number,
  fees: { shippingFlat: number; abujaShippingFee: number },
) {
  if (subtotal <= 0) return 0;
  return isAbujaDelivery(state) ? fees.abujaShippingFee : fees.shippingFlat;
}

export function shippingForState(
  state: string | null | undefined,
  subtotal: number,
  fees: { shippingFlat: number; abujaShippingFee: number; freeShippingThreshold: number },
) {
  if (subtotal <= 0) return 0;
  if (fees.freeShippingThreshold > 0 && subtotal >= fees.freeShippingThreshold) return 0;
  return deliveryFeeForState(state, subtotal, fees);
}
