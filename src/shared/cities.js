import phoneNumbers from "./phoneNumbers.json";

export const CITY_OPTIONS = Object.entries(phoneNumbers).map(([value, data]) => ({
  value,
  label: data?.label || value,
}));

export const CITY_KEYS = CITY_OPTIONS.map((city) => city.value);
